import { Injectable } from '@nestjs/common';

const POS = [
  { title: '{name}宣布营收创历史新高', content: '{name}({symbol})发布最新财报，营收同比增长{pct}%，超出市场预期。CEO表示战略布局进入收获期。', level: 'medium' as const },
  { title: '{name}获得{amount}万美元大合同', content: '{name}({symbol})宣布签下价值{amount}万美元的重大合同，这是公司史上最大单笔订单，分析师普遍看好。', level: 'major' as const },
  { title: '{name}新品发布反响热烈', content: '{name}({symbol})新品发布会上展示革命性产品，首日预购{amount}万台，社交媒体好评如潮。', level: 'medium' as const },
  { title: '{name}获机构上调评级', content: '多家机构同时上调{name}({symbol})评级至"强烈推荐"，目标价上调{pct}%。', level: 'minor' as const },
];

const NEG = [
  { title: '{name}产品出现质量问题', content: '{name}({symbol})部分产品被曝质量问题，紧急发布召回通知。CEO在社交媒体道歉，投资者信心受挫。', level: 'medium' as const },
  { title: '{name}核心高管突然离职', content: '{name}({symbol})CTO今日宣布因"个人原因"离职，传言与CEO在战略方向上存在严重分歧。', level: 'medium' as const },
  { title: '{name}面临监管调查', content: '据知情人士透露，{name}({symbol})正面临监管部门调查，涉及核心业务合规问题。', level: 'major' as const },
  { title: '{name}季度财报不及预期', content: '{name}({symbol})最新季报净利润同比下降{pct}%，低于预期。管理层表示正调整战略。', level: 'medium' as const },
];

const FUNNY = [
  { title: '{name}CEO直播打翻咖啡', content: '{name}({symbol})CEO在投资者直播会议中把咖啡洒在键盘上，直播中断15分钟。回来后笑称"这是防水技术的反面教材"。', level: 'minor' as const },
  { title: '{name}办公室闯入流浪猫', content: '一只流浪猫闯入{name}({symbol})总部，在CEO办公桌上睡了一下午。HR宣布正式录用该猫为"首席快乐官"。', level: 'minor' as const },
  { title: '{name}年会CEO穿恐龙服上热搜', content: '{name}({symbol})年会视频流出，CEO身穿恐龙服跳广场舞冲上热搜。CEO回应："你们不懂艺术。"', level: 'minor' as const },
  { title: '{name}官网被自家AI搞崩', content: '{name}({symbol})新部署的AI客服过于热情推荐产品，流量暴增10倍，官网宕机2小时。', level: 'medium' as const },
];

@Injectable()
export class FallbackGenerator {
  generate(name: string, symbol: string) {
    const rand = Math.random();
    let templates: typeof POS, sentiment: string, impact: string;
    if (rand < 0.35) { templates = POS; sentiment = 'bullish'; impact = 'positive'; }
    else if (rand < 0.65) { templates = NEG; sentiment = 'bearish'; impact = 'negative'; }
    else { templates = FUNNY; sentiment = 'funny'; impact = Math.random() > 0.5 ? 'positive' : 'negative'; }

    const t = templates[Math.floor(Math.random() * templates.length)];
    const pct = Math.floor(Math.random() * 40) + 10;
    const amount = Math.floor(Math.random() * 900) + 100;
    const fill = (s: string) => s.replace(/{name}/g, name).replace(/{symbol}/g, symbol).replace(/{pct}/g, String(pct)).replace(/{amount}/g, String(amount));

    return { title: fill(t.title), content: fill(t.content), sentiment, impact, impactLevel: t.level };
  }
}
