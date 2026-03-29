import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { AIService } from '../ai/ai.service';
import { WorldMemoryService } from '../ai/world-memory.service';
import { FallbackGenerator } from '../ai/fallback-generator';
import { RedisService } from '../redis/redis.service';
import { NEWS_BUFFER_JOB, NEWS_BUFFER_QUEUE } from './news.constants';

export interface QueuedNewsItem {
  stockId: string;
  stockSymbol: string;
  stockName: string;
  title: string;
  content: string;
  sentiment: 'bullish' | 'bearish' | 'funny' | 'neutral' | 'breaking';
  impact: 'positive' | 'negative' | 'neutral';
  impactLevel: 'minor' | 'medium' | 'major';
  impactPercent: number;
}

export interface ManualNewsRequest {
  stockId: string;
  impact: 'positive' | 'negative';
  impactPercent: number;
  style?: 'neutral' | 'breaking' | 'funny';
  eventHint?: string;
}

type GeneratedNewsPayload = Omit<QueuedNewsItem, 'stockId' | 'stockSymbol' | 'stockName'>;

interface GenerateNewsPayloadOptions {
  prompt?: string;
  fallbackPayload?: GeneratedNewsPayload;
  overrides?: Partial<GeneratedNewsPayload>;
}

const SYSTEM_PROMPT = `你是 MockTrade 交易所的首席新闻编辑。为虚拟股市生成新闻。

规则：
1. 新闻必须围绕目标股票的人设和世界观展开，风格可以幽默夸张，但逻辑必须自洽。
2. 标题控制在 20 字内，正文控制在 100-200 字。
3. 可引用虚构原话，但必须写进 JSON 字符串里，内部双引号要转义成 \\"。
4. impactPercent 必须是 number，例如 0.034，不能带 %。
5. 只能返回一个 JSON 对象，不能输出 Markdown、代码块、注释或解释。

返回格式：
{"title":"","content":"","sentiment":"bullish|bearish|funny|neutral|breaking","impact":"positive|negative|neutral","impactLevel":"minor|medium|major","impactPercent":0.034}`;

const JSON_REPAIR_SYSTEM_PROMPT = `你是严格的 JSON 修复器。

任务：
1. 把用户提供的内容修正为一个合法 JSON 对象。
2. 只能保留这些字段：title, content, sentiment, impact, impactLevel, impactPercent。
3. 不要新增解释，不要输出 Markdown，不要输出数组。
4. 所有 key 和字符串都必须使用双引号。
5. impactPercent 必须是 number。`;

@Injectable()
export class NewsGeneratorService {
  private readonly logger = new Logger(NewsGeneratorService.name);
  private readonly legacyQueueKey = 'news:pending';
  private readonly autoQueuePriority = 10;
  private readonly manualQueuePriority = 1;

  constructor(
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectQueue(NEWS_BUFFER_QUEUE) private readonly bufferQueue: Queue<QueuedNewsItem>,
    private readonly ai: AIService,
    private readonly worldMemory: WorldMemoryService,
    private readonly fallback: FallbackGenerator,
    private readonly redis: RedisService,
  ) {}

  async migrateLegacyQueue(): Promise<void> {
    const rawItems = await this.redis.lRange(this.legacyQueueKey, 0, -1);
    if (rawItems.length === 0) {
      return;
    }

    let migratedCount = 0;

    for (const rawItem of rawItems.reverse()) {
      try {
        const parsed = JSON.parse(rawItem) as unknown;
        const item = this.normalizeQueueItem(parsed);
        if (!item) {
          continue;
        }

        await this.bufferQueue.add(NEWS_BUFFER_JOB, item, { priority: this.autoQueuePriority });
        migratedCount++;
      } catch (error) {
        this.logger.warn(`Skipping malformed legacy queued news: ${error}`);
      }
    }

    await this.redis.del(this.legacyQueueKey);

    if (migratedCount > 0) {
      this.logger.log(`Migrated ${migratedCount} legacy queued news items into Bull`);
    }
  }

  async generateOne(): Promise<QueuedNewsItem | null> {
    const stocks = await this.stockRepo.find({ where: { isActive: true } });
    if (stocks.length === 0) {
      return null;
    }

    const stock = stocks[Math.floor(Math.random() * stocks.length)];

    try {
      const payload = await this.generateNewsPayload(stock);
      const queuedNews: QueuedNewsItem = {
        ...payload,
        stockId: stock.id,
        stockSymbol: stock.symbol,
        stockName: stock.name,
      };

      await this.worldMemory.addNewsMemory(stock.id, `${queuedNews.sentiment}: ${queuedNews.title}`);
      return queuedNews;
    } catch (error) {
      this.logger.error(`Generation failed for ${stock.symbol}, fallback`, error);

      const fallbackNews = this.buildFallback(stock);
      const queuedNews: QueuedNewsItem = {
        ...fallbackNews,
        stockId: stock.id,
        stockSymbol: stock.symbol,
        stockName: stock.name,
      };

      await this.worldMemory.addNewsMemory(stock.id, `${queuedNews.sentiment}: ${queuedNews.title}`);
      return queuedNews;
    }
  }

  async generateAndQueue(): Promise<QueuedNewsItem | null> {
    const newsData = await this.generateOne();
    if (!newsData) {
      return null;
    }

    await this.bufferQueue.add(NEWS_BUFFER_JOB, newsData, { priority: this.autoQueuePriority });
    this.logger.log(`Queued: ${newsData.stockSymbol} - "${newsData.title}"`);
    return newsData;
  }

  async generateManual(input: ManualNewsRequest): Promise<QueuedNewsItem> {
    const stock = await this.stockRepo.findOne({ where: { id: input.stockId, isActive: true } });
    if (!stock) {
      throw new BadRequestException('股票不存在或已停用');
    }

    const impactPercent = this.normalizeManualImpactPercent(input.impactPercent, input.impact);
    const style = input.style || 'neutral';
    const overrides = this.buildManualOverrides(input.impact, impactPercent, style);
    const fallbackPayload = this.buildManualFallback(stock, {
      ...input,
      style,
      impactPercent,
    });

    try {
      const payload = await this.generateNewsPayload(stock, {
        prompt: await this.buildManualGenerationPrompt(stock, {
          ...input,
          style,
          impactPercent,
        }),
        fallbackPayload,
        overrides,
      });

      const queuedNews: QueuedNewsItem = {
        ...payload,
        stockId: stock.id,
        stockSymbol: stock.symbol,
        stockName: stock.name,
      };

      await this.worldMemory.addNewsMemory(stock.id, `${queuedNews.sentiment}: ${queuedNews.title}`);
      return queuedNews;
    } catch (error) {
      this.logger.error(`Manual generation failed for ${stock.symbol}, fallback`, error);

      const queuedNews: QueuedNewsItem = {
        ...fallbackPayload,
        stockId: stock.id,
        stockSymbol: stock.symbol,
        stockName: stock.name,
      };

      await this.worldMemory.addNewsMemory(stock.id, `${queuedNews.sentiment}: ${queuedNews.title}`);
      return queuedNews;
    }
  }

  async generateManualAndQueue(input: ManualNewsRequest): Promise<QueuedNewsItem> {
    const newsData = await this.generateManual(input);
    await this.bufferQueue.add(NEWS_BUFFER_JOB, newsData, {
      priority: this.manualQueuePriority,
      lifo: true,
    });
    this.logger.log(`Queued manual news: ${newsData.stockSymbol} - "${newsData.title}"`);
    return newsData;
  }

  async getQueueLength(): Promise<number> {
    return this.bufferQueue.getJobCountByTypes(['waiting', 'paused']);
  }

  async popFromQueue(): Promise<QueuedNewsItem | null> {
    const jobs = await this.bufferQueue.getJobs(['waiting', 'paused'], 0, 20, true);

    for (const job of jobs) {
      const item = this.normalizeQueueItem(job.data);
      await job.remove();

      if (item) {
        return item;
      }
    }

    return null;
  }

  async getQueuePreview(limit = 5): Promise<QueuedNewsItem[]> {
    const jobs = await this.bufferQueue.getJobs(['waiting', 'paused'], 0, Math.max(limit - 1, 0), true);
    return jobs
      .map((job) => this.normalizeQueueItem(job.data))
      .filter((item): item is QueuedNewsItem => item !== null)
      .slice(0, limit);
  }

  async ensureQueueFilled(min = 3) {
    const len = await this.getQueueLength();
    if (len >= min) {
      return;
    }

    for (let i = 0; i < min - len; i++) {
      await this.generateAndQueue();
    }
  }

  private async generateNewsPayload(stock: StockEntity, options?: GenerateNewsPayloadOptions): Promise<GeneratedNewsPayload> {
    if (!(await this.ai.isConfigured())) {
      return this.applyPayloadOverrides(options?.fallbackPayload ?? this.buildFallback(stock), options?.overrides);
    }

    const prompt = options?.prompt ?? await this.buildGenerationPrompt(stock);

    const firstRaw = await this.ai.generateText(SYSTEM_PROMPT, prompt, {
      temperature: 0.65,
      maxTokens: 800,
    });
    const firstParsed = this.parseGeneratedNewsPayload(firstRaw);
    if (firstParsed) {
      return this.applyPayloadOverrides(firstParsed, options?.overrides);
    }

    this.logger.warn(
      `Invalid AI news JSON for ${stock.symbol} on attempt 1. Raw: ${this.summarizeRaw(firstRaw)}`,
    );

    const repairedRaw = await this.ai.generateText(
      JSON_REPAIR_SYSTEM_PROMPT,
      this.buildRepairPrompt(firstRaw),
      { temperature: 0.1, maxTokens: 800 },
    );
    const repairedParsed = this.parseGeneratedNewsPayload(repairedRaw);
    if (repairedParsed) {
      return this.applyPayloadOverrides(repairedParsed, options?.overrides);
    }

    this.logger.warn(
      `Invalid AI news JSON for ${stock.symbol} after repair attempt. Raw: ${this.summarizeRaw(repairedRaw)}`,
    );

    const retryRaw = await this.ai.generateText(
      SYSTEM_PROMPT,
      `${prompt}\n\n上次输出未能通过 JSON 校验，这次必须只输出一个合法 JSON 对象。`,
      { temperature: 0.2, maxTokens: 800 },
    );
    const retryParsed = this.parseGeneratedNewsPayload(retryRaw);
    if (retryParsed) {
      return this.applyPayloadOverrides(retryParsed, options?.overrides);
    }

    this.logger.warn(
      `Invalid AI news JSON for ${stock.symbol} on final attempt. Raw: ${this.summarizeRaw(retryRaw)}`,
    );

    throw new Error('AI news JSON remained invalid after retry');
  }

  private async buildGenerationPrompt(stock: StockEntity): Promise<string> {
    const context = await this.worldMemory.buildContext(stock.id);
    return `请为 "${stock.name}" (${stock.symbol}) 生成一条会影响股价的新闻。

要求：
- 结合股票人设和世界观
- 只返回一个 JSON 对象
- 不要出现 Markdown 代码块
- content 中如果有双引号必须转义
- impactPercent 用 0.01~0.10 之间的小数表示，正数利好，负数利空

${context}`;
  }

  private async buildManualGenerationPrompt(stock: StockEntity, input: ManualNewsRequest): Promise<string> {
    const context = await this.worldMemory.buildContext(stock.id);
    const direction = input.impact === 'positive' ? '偏多，后续走势应逐步走强' : '偏空，后续走势应逐步走弱';
    const style = input.style === 'breaking'
      ? '突发快讯'
      : input.style === 'funny'
        ? '搞笑整活'
        : '常规事件';
    const hint = this.cleanText(input.eventHint) || '请你自行补一个贴合人设的事件导火索';

    return `请为 "${stock.name}" (${stock.symbol}) 生成一条管理员手动指定参数的事件新闻。

硬性设定：
- 事件方向：${direction}
- 目标影响幅度：约 ${(Math.abs(input.impactPercent) * 100).toFixed(1)}%
- 事件风格：${style}
- 事件提示：${hint}

额外要求：
- 这是公开给玩家看的事件线索，不要直接写出涨跌幅、利好/利空、看涨/看跌、impactPercent 之类后台答案
- 新闻内容要像真实事件线索，只给玩家观察和判断空间
- 只返回一个 JSON 对象
- 不要出现 Markdown 代码块
- content 中如果有双引号必须转义

${context}`;
  }

  private buildRepairPrompt(raw: string): string {
    return `请把下面内容修复成合法 JSON，仅输出修复后的 JSON 对象：

${raw}`;
  }

  private buildFallback(stock: StockEntity): GeneratedNewsPayload {
    const news = this.fallback.generate(stock.name, stock.symbol);
    const sign = news.impact === 'positive' ? 1 : -1;
    const impactPercent = news.impactLevel === 'major'
      ? (Math.random() * 0.04 + 0.06) * sign
      : news.impactLevel === 'medium'
        ? (Math.random() * 0.03 + 0.03) * sign
        : (Math.random() * 0.02 + 0.01) * sign;

    return {
      title: news.title,
      content: news.content,
      sentiment: news.sentiment as GeneratedNewsPayload['sentiment'],
      impact: news.impact as GeneratedNewsPayload['impact'],
      impactLevel: news.impactLevel,
      impactPercent: +impactPercent.toFixed(4),
    };
  }

  private buildManualFallback(stock: StockEntity, input: ManualNewsRequest): GeneratedNewsPayload {
    const impactPercent = this.normalizeManualImpactPercent(input.impactPercent, input.impact);
    const sentiment = this.resolveManualSentiment(input.impact, input.style || 'neutral');
    const hint = this.cleanText(input.eventHint);
    const headlineBase = hint
      ? `${stock.name}${hint}`
      : input.impact === 'positive'
        ? `${stock.name}传出新动向`
        : `${stock.name}传出新波折`;
    const titlePrefix = input.style === 'breaking'
      ? '盘中传出：'
      : input.style === 'funny'
        ? '市场热议：'
        : '';
    const title = `${titlePrefix}${headlineBase}`.slice(0, 22);

    const styleLead = input.style === 'breaking'
      ? '盘中突然传出消息，'
      : input.style === 'funny'
        ? '一则离谱但真实在传播的消息，让交易室瞬间热闹起来，'
        : '市场传出新的经营动向，';
    const eventCopy = hint
      ? `消息焦点围绕“${hint}”展开，`
      : '';
    const directionCopy = input.impact === 'positive'
      ? '不少人开始重新评估这家公司接下来的表现，买盘情绪有升温迹象。'
      : '市场开始重新评估这家公司接下来的压力，观望和抛压情绪有所升温。';

    return {
      title,
      content: `${styleLead}${stock.name}(${stock.symbol})${eventCopy}${directionCopy}`,
      sentiment,
      impact: input.impact,
      impactLevel: this.classifyImpactLevel(impactPercent),
      impactPercent,
    };
  }

  private normalizeQueueItem(value: unknown): QueuedNewsItem | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const payload = this.normalizeGeneratedNewsPayload(record);
    const stockId = this.cleanIdentifier(record.stockId, 64);
    const stockSymbol = this.cleanIdentifier(record.stockSymbol, 24);
    const stockName = this.cleanIdentifier(record.stockName, 60);

    if (!payload || !stockId || !stockSymbol || !stockName) {
      return null;
    }

    return {
      ...payload,
      stockId,
      stockSymbol,
      stockName,
    };
  }

  private parseGeneratedNewsPayload(raw: string): GeneratedNewsPayload | null {
    for (const candidate of this.extractJSONCandidates(raw)) {
      const parsed = this.tryParseJSON(candidate);
      if (!parsed) {
        continue;
      }

      const normalized = this.normalizeGeneratedNewsPayload(parsed);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private normalizeGeneratedNewsPayload(value: unknown): GeneratedNewsPayload | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const title = this.cleanText(record.title);
    const content = this.cleanText(record.content);

    if (!title || !content || title.length > 80 || content.length > 1200) {
      return null;
    }

    let impact = this.normalizeImpact(record.impact);
    let sentiment = this.normalizeSentiment(record.sentiment);
    const levelHint = this.normalizeImpactLevel(record.impactLevel);
    let impactPercent = this.parseImpactPercent(record.impactPercent);

    if (impactPercent === null) {
      impactPercent = this.defaultImpactPercent(impact ?? 'neutral', levelHint ?? 'minor');
    }

    const directionHint = this.inferDirectionHint(impact, sentiment);
    if (directionHint > 0) {
      impactPercent = Math.abs(impactPercent);
    } else if (directionHint < 0) {
      impactPercent = -Math.abs(impactPercent);
    }

    impactPercent = this.normalizeSignedImpactPercent(impactPercent, impact);
    impact = this.inferImpact(impact, impactPercent);
    sentiment = this.inferSentiment(sentiment, impact);

    return {
      title,
      content,
      sentiment,
      impact,
      impactLevel: this.classifyImpactLevel(impactPercent),
      impactPercent,
    };
  }

  private extractJSONCandidates(raw: string): string[] {
    const candidates: string[] = [];
    const seen = new Set<string>();
    const trimmed = raw.replace(/^\uFEFF/, '').trim();

    const push = (candidate: string | undefined) => {
      const next = (candidate || '').trim();
      if (!next || seen.has(next)) {
        return;
      }
      seen.add(next);
      candidates.push(next);
    };

    push(trimmed);

    for (const match of trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
      push(match[1]);
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      push(trimmed.slice(firstBrace, lastBrace + 1));
    }

    return candidates;
  }

  private tryParseJSON(candidate: string): unknown | null {
    const normalized = candidate
      .replace(/^json\s*/i, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, '\'')
      .trim();

    const variants = [
      normalized,
      normalized.replace(/,\s*([}\]])/g, '$1'),
      normalized.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3'),
      normalized
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
        .replace(/,\s*([}\]])/g, '$1'),
    ];

    for (const variant of variants) {
      try {
        return JSON.parse(variant);
      } catch {
        continue;
      }
    }

    return null;
  }

  private cleanText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const cleaned = value
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .replace(/"{2,}/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) {
      return null;
    }

    return cleaned;
  }

  private cleanIdentifier(value: unknown, maxLength: number): string | null {
    const cleaned = this.cleanText(value);
    if (!cleaned || cleaned.length > maxLength) {
      return null;
    }

    return cleaned;
  }

  private normalizeImpact(value: unknown): GeneratedNewsPayload['impact'] | null {
    const normalized = this.normalizeEnumValue(value);

    if (['positive', 'bullish', 'up', '上涨', '利好'].includes(normalized)) {
      return 'positive';
    }
    if (['negative', 'bearish', 'down', '下跌', '利空'].includes(normalized)) {
      return 'negative';
    }
    if (['neutral', 'flat', '中性', '无明显影响'].includes(normalized)) {
      return 'neutral';
    }

    return null;
  }

  private normalizeSentiment(value: unknown): GeneratedNewsPayload['sentiment'] | null {
    const normalized = this.normalizeEnumValue(value);

    if (['bullish', 'positive', 'up', '利好', '看涨'].includes(normalized)) {
      return 'bullish';
    }
    if (['bearish', 'negative', 'down', '利空', '看跌'].includes(normalized)) {
      return 'bearish';
    }
    if (['funny', 'humor', 'humorous', '搞笑'].includes(normalized)) {
      return 'funny';
    }
    if (['breaking', 'urgent', '突发'].includes(normalized)) {
      return 'breaking';
    }
    if (['neutral', '中性'].includes(normalized)) {
      return 'neutral';
    }

    return null;
  }

  private normalizeImpactLevel(value: unknown): GeneratedNewsPayload['impactLevel'] | null {
    const normalized = this.normalizeEnumValue(value);

    if (['minor', 'low', 'small', '轻微', '小'].includes(normalized)) {
      return 'minor';
    }
    if (['medium', 'mid', 'moderate', '中等', '中'].includes(normalized)) {
      return 'medium';
    }
    if (['major', 'high', 'large', 'severe', '重大', '大'].includes(normalized)) {
      return 'major';
    }

    return null;
  }

  private normalizeEnumValue(value: unknown): string {
    return typeof value === 'string'
      ? value.trim().toLowerCase()
      : '';
  }

  private parseImpactPercent(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.abs(value) > 1 ? value / 100 : value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().replace(/％/g, '%');
    const numeric = parseFloat(normalized.replace(/%/g, ''));
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return normalized.includes('%') || Math.abs(numeric) > 1
      ? numeric / 100
      : numeric;
  }

  private defaultImpactPercent(
    impact: GeneratedNewsPayload['impact'],
    level: GeneratedNewsPayload['impactLevel'],
  ): number {
    if (impact === 'neutral') {
      return 0;
    }

    const magnitude = level === 'major'
      ? 0.08
      : level === 'medium'
        ? 0.045
        : 0.02;

    return impact === 'positive' ? magnitude : -magnitude;
  }

  private inferDirectionHint(
    impact: GeneratedNewsPayload['impact'] | null,
    sentiment: GeneratedNewsPayload['sentiment'] | null,
  ): number {
    if (impact === 'positive' || sentiment === 'bullish') {
      return 1;
    }
    if (impact === 'negative' || sentiment === 'bearish') {
      return -1;
    }
    return 0;
  }

  private normalizeSignedImpactPercent(
    value: number,
    impact: GeneratedNewsPayload['impact'] | null,
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (impact === 'neutral') {
      return 0;
    }

    const sign = value === 0
      ? impact === 'negative' ? -1 : 1
      : Math.sign(value);
    const magnitude = Math.min(0.1, Math.max(0.01, Math.abs(value)));

    return +(magnitude * sign).toFixed(4);
  }

  private inferImpact(
    impact: GeneratedNewsPayload['impact'] | null,
    impactPercent: number,
  ): GeneratedNewsPayload['impact'] {
    if (impact === 'positive') {
      return 'positive';
    }
    if (impact === 'negative') {
      return 'negative';
    }
    if (Math.abs(impactPercent) < 0.005) {
      return 'neutral';
    }
    return impactPercent >= 0 ? 'positive' : 'negative';
  }

  private inferSentiment(
    sentiment: GeneratedNewsPayload['sentiment'] | null,
    impact: GeneratedNewsPayload['impact'],
  ): GeneratedNewsPayload['sentiment'] {
    if (sentiment === 'funny' || sentiment === 'breaking') {
      return sentiment;
    }

    if (impact === 'positive') {
      return 'bullish';
    }
    if (impact === 'negative') {
      return 'bearish';
    }

    return sentiment ?? 'neutral';
  }

  private classifyImpactLevel(percent: number): GeneratedNewsPayload['impactLevel'] {
    const abs = Math.abs(percent);
    if (abs >= 0.06) {
      return 'major';
    }
    if (abs >= 0.03) {
      return 'medium';
    }
    return 'minor';
  }

  private summarizeRaw(raw: string): string {
    return raw.replace(/\s+/g, ' ').trim().slice(0, 240);
  }

  private applyPayloadOverrides(
    payload: GeneratedNewsPayload,
    overrides?: Partial<GeneratedNewsPayload>,
  ): GeneratedNewsPayload {
    if (!overrides) {
      return payload;
    }

    return this.normalizeGeneratedNewsPayload({ ...payload, ...overrides }) || payload;
  }

  private buildManualOverrides(
    impact: ManualNewsRequest['impact'],
    impactPercent: number,
    style: NonNullable<ManualNewsRequest['style']>,
  ): Partial<GeneratedNewsPayload> {
    return {
      sentiment: this.resolveManualSentiment(impact, style),
      impact,
      impactPercent,
    };
  }

  private resolveManualSentiment(
    impact: ManualNewsRequest['impact'],
    style: NonNullable<ManualNewsRequest['style']>,
  ): GeneratedNewsPayload['sentiment'] {
    if (style === 'breaking') {
      return 'breaking';
    }
    if (style === 'funny') {
      return 'funny';
    }
    return impact === 'positive' ? 'bullish' : 'bearish';
  }

  private normalizeManualImpactPercent(
    rawImpactPercent: number,
    impact: ManualNewsRequest['impact'],
  ): number {
    const normalized = Math.abs(rawImpactPercent) > 1
      ? rawImpactPercent / 100
      : rawImpactPercent;

    return this.normalizeSignedImpactPercent(
      impact === 'negative' ? -Math.abs(normalized) : Math.abs(normalized),
      impact,
    );
  }
}
