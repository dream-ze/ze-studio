// 合作方向。首页、Services 页和血缘图都从这里取。
// basedOn 写它依据的项目：projects/项目文件名。写了之后血缘图会自动画出连线。

export interface Service {
  id: string;
  title: string;
  points: string[];
  // 依据：这句话会显示在页面上
  basis?: string;
  basedOn?: string;
  note?: string;
}

export const SERVICES: Service[] = [
  {
    id: 'collect',
    title: '数据采集与自动化',
    points: ['定时从网站或接口采集数据', '多个系统之间的数据对接', '把重复的手工操作变成脚本'],
    basis: 'AI Evolution Radar 的采集层',
    basedOn: 'projects/ai-evolution-radar',
  },
  {
    id: 'pipeline',
    title: '数据处理与数据管道',
    points: ['数据清洗、去重、入库', '实时或定时的数据流转', '数据监控与异常推送'],
    basis: '数据工程的工作经验（相关内容都经过脱敏）',
  },
  {
    id: 'talk',
    title: '技术交流',
    points: ['AI Agent 的设计和实践', '怎么用数据观察 AI 行业', '用 AI 辅助开发的工作方法'],
    note: '这些我正在实践，还没有成熟的交付案例。',
  },
];

// 技术交流的话题，Services 页会展开说明
export const TOPICS = [
  { title: 'AI Agent 的设计和实践', desc: '怎么让 agent 的每一步都有证据，结论可以核对。' },
  { title: '怎么用数据观察 AI 行业', desc: '看哪些维度，用什么数据源，怎么区分事实和推断。' },
  { title: '用 AI 辅助开发的工作方法', desc: '怎么让 AI 帮我加速，而不是替我做决定。' },
];
