export interface StockSeed {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  persona: string;
}

export const STOCK_SEEDS: StockSeed[] = [
  // === 科技行业 ===
  {
    symbol: 'PEAR',
    name: '梨子科技',
    sector: '科技',
    basePrice: 185.00,
    persona: '全球最大的消费电子公司，以极简主义设计闻名。CEO 乔布柿经常在发布会上说"One more thing"然后掏出一个水果。最近在研发能吃的手机。',
  },
  {
    symbol: 'GOGGLE',
    name: '护目镜搜索',
    sector: '科技',
    basePrice: 142.50,
    persona: '搜索引擎巨头，座右铭是"什么都能搜到，除了我的钥匙"。正在开发AI助手，但AI经常给出离谱的建议。',
  },
  {
    symbol: 'TESLAA',
    name: '特斯拉拉',
    sector: '科技/汽车',
    basePrice: 265.00,
    persona: '电动车先驱，CEO伊隆·麝香是个推特狂魔，每条推特都能让股价坐过山车。正在研发能飞的汽车。',
  },
  {
    symbol: 'NETTFLIX',
    name: '网飞飞',
    sector: '科技/娱乐',
    basePrice: 78.50,
    persona: '流媒体巨头，最近因为砍了太多好剧被用户联名抗议。CEO表示"我们的算法说这些剧不好看"，结果算法被黑客改成了只推荐猫片。',
  },
  {
    symbol: 'BYTT',
    name: '字节跳跳',
    sector: '科技/社交',
    basePrice: 120.00,
    persona: '短视频帝国，算法太强大以至于能预测你下一顿吃什么。正在研发让人一刷就停不下来的新算法，联合国已发出警告。',
  },

  // === 餐饮行业 ===
  {
    symbol: 'HOTPOT',
    name: '火锅控股',
    sector: '餐饮',
    basePrice: 88.00,
    persona: '全球最大连锁火锅企业，CEO张麻辣是个性情中人，经常在社交媒体上跟竞争对手对骂。正在研发自动涮肉机器人。',
  },
  {
    symbol: 'MALALA',
    name: '麻辣烫集团',
    sector: '餐饮',
    basePrice: 45.50,
    persona: '火锅控股的死对头，主打平价路线。两家CEO曾在美食节上互相往对方锅里加辣椒。正在开发外太空送餐服务。',
  },
  {
    symbol: 'MTEA',
    name: '奶茶科技',
    sector: '餐饮/科技',
    basePrice: 56.00,
    persona: '将奶茶与科技结合的新锐企业，发明了能根据心情自动调配的智能奶茶机。最近的"情绪奶茶"系列让失恋的人喝了更伤心了。',
  },
  {
    symbol: 'JBING',
    name: '煎饼果子网络',
    sector: '餐饮',
    basePrice: 32.00,
    persona: '以煎饼果子起家的餐饮连锁，号称"没有什么问题是一个煎饼果子解决不了的"。最近推出了煎饼果子味的NFT。',
  },
  {
    symbol: 'CHUANR',
    name: '串儿传媒',
    sector: '餐饮/娱乐',
    basePrice: 28.50,
    persona: '烧烤连锁兼直播平台，每晚的烤串直播观看人数超过春晚。CEO经常一边烤串一边发布财报。是火锅控股的原材料供应商。',
  },

  // === 金融行业 ===
  {
    symbol: 'GCOIN',
    name: '金币银行',
    sector: '金融',
    basePrice: 210.00,
    persona: '虚拟世界最大的银行，以稳健著称。行长是一位80岁的老太太，每天准时9点上班，从不迟到。银行金库里真的存着金币。',
  },
  {
    symbol: 'INSUR',
    name: '包你险保险',
    sector: '金融/保险',
    basePrice: 95.00,
    persona: '什么都能保的保险公司，甚至推出了"被猫抓伤险"和"踩到乐高险"。理赔部门的座右铭是"这个不在保障范围内"。',
  },

  // === 能源行业 ===
  {
    symbol: 'SUNPW',
    name: '日光能源',
    sector: '能源',
    basePrice: 62.00,
    persona: '太阳能巨头，在撒哈拉沙漠建了全球最大的太阳能电站。但最近发现沙漠上空的云越来越多了，怀疑是竞争对手搞的。',
  },
  {
    symbol: 'WINDY',
    name: '风之谷电力',
    sector: '能源',
    basePrice: 48.00,
    persona: '风力发电公司，选址总是特别精准。不过最近被环保组织投诉说"你们的风力发电机把候鸟的航线都吹偏了"。',
  },

  // === 消费行业 ===
  {
    symbol: 'CATCO',
    name: '喵星宠物',
    sector: '消费/宠物',
    basePrice: 72.00,
    persona: '宠物用品龙头，CEO是一只叫"总裁"的猫（代言的）。公司会议室里永远有一只猫在键盘上走来走去。网红概念股，容易被社交媒体热度带飞。',
  },
  {
    symbol: 'SHOPP',
    name: '买买买商城',
    sector: '消费/电商',
    basePrice: 155.00,
    persona: '电商平台，双11销售额每年翻一番。物流速度快到顾客还没下单东西就到了（当然是夸张说法）。最近推出"后悔药"服务，买了不满意可以穿越时空退货。',
  },

  // === 娱乐行业 ===
  {
    symbol: 'GPLAY',
    name: '玩个球游戏',
    sector: '娱乐/游戏',
    basePrice: 108.00,
    persona: '游戏公司，以出氪金手游闻名。CEO号称"我们不是在做游戏，我们是在做艺术品——很贵的艺术品"。最新游戏被玩家戏称为"钱包粉碎机"。',
  },
  {
    symbol: 'MOVIEE',
    name: '大片工厂',
    sector: '娱乐/影视',
    basePrice: 42.00,
    persona: '电影制作公司，专拍大IP续集。观众说"又拍续集？"他们说"对，这是第17部了"。最近的电影因为特效太真实吓哭了小朋友。',
  },

  // === 医疗健康 ===
  {
    symbol: 'HEALZ',
    name: '药到病除',
    sector: '医疗',
    basePrice: 135.00,
    persona: '生物制药公司，正在研发能让人不犯困的药。结果试验者连续清醒了一周后开始看见独角兽。研发团队表示"这是一个积极的副作用"。',
  },
  {
    symbol: 'FITBIT',
    name: '暴汗健身',
    sector: '健康/消费',
    basePrice: 38.00,
    persona: '智能健身设备公司，手环会在你偷吃零食时震动提醒。最新功能是连接冰箱，在你半夜开冰箱时播放恐怖音乐。',
  },

  // === 房地产/基建 ===
  {
    symbol: 'TOWER',
    name: '摩天大楼',
    sector: '房地产',
    basePrice: 180.00,
    persona: '建筑巨头，设计的大楼越来越高。最新项目号称"能看到月球"，被天文学家吐槽"你连飞机都看不到"。以稳重著称，股价波动不大。',
  },

  // === 交通运输 ===
  {
    symbol: 'FLYER',
    name: '飞个够航空',
    sector: '交通',
    basePrice: 52.00,
    persona: '廉价航空公司，票价便宜但座位窄到连模特都嫌挤。CEO说"我们卖的不是座位，是一段回忆"。乘客说"对，挤到骨折的回忆"。',
  },

  // === 水产 ===
  {
    symbol: 'SEAAA',
    name: '深海鲜生',
    sector: '水产/食品',
    basePrice: 66.00,
    persona: '全球最大海鲜供应商，靠天吃饭。每年台风季就是股价过山车季。CEO经常在台风天直播捕鱼，被称为"风暴猎人"。去年台风把海鲜都刮到澳大利亚去了。',
  },

  // === 教育 ===
  {
    symbol: 'LEARN',
    name: '学无止境教育',
    sector: '教育',
    basePrice: 85.00,
    persona: '在线教育平台，AI老师据说比真人还会讲冷笑话。学生评价"学到了知识，也学到了尬"。最近推出了"睡眠学习法"课程。',
  },

  // === 农业 ===
  {
    symbol: 'FARMM',
    name: '开心农场',
    sector: '农业',
    basePrice: 24.00,
    persona: '智能农业公司，用AI种地。机器人农夫比真农夫还会偷懒——有一次全部机器人集体罢工要求"充电时间"。产品质量很好但经营不太稳定。',
  },
];
