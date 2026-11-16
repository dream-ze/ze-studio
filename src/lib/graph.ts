// 血缘图的数据：把站里的内容变成“节点”和“连线”。
// 连线只来自内容文件里写明的关联，没有写就没有线：
//   观点   leadsTo: [projects/xxx, lab/xxx]
//   Lab    project: xxx
//   合作   basedOn: projects/xxx（在 src/data/services.ts）

import { SERVICES } from '../data/services';
import { getLab, getProjects, getResearch } from './content';

export type NodeState = 'done' | 'idea' | 'active' | 'archived' | 'none';

export interface GNode {
  key: string; // 栏目/文件名
  col: 0 | 1 | 2 | 3; // 观点 / 构想与实验 / 项目 / 合作
  title: string;
  href: string;
  kind: string; // 观点、构想、实验、项目、合作
  state: NodeState;
  hub: boolean;
  sub?: string;
}

export interface GEdge {
  from: string;
  to: string;
}

export const COLUMNS = [
  { name: '观点', hint: '我怎么看' },
  { name: '构想与实验', hint: '想试的和试过的' },
  { name: '项目', hint: '做出来的' },
  { name: '合作', hint: '能一起做的' },
];

const LAB_STATE: Record<string, NodeState> = { 构想: 'idea', 进行中: 'active', 完成: 'done', 放弃: 'archived' };
const PROJECT_STATE: Record<string, NodeState> = { 开发中: 'active', 自用中: 'done', 已归档: 'archived' };

export async function getGraph() {
  const [research, lab, projects] = await Promise.all([getResearch(), getLab(), getProjects()]);
  const hubId = (projects.find((p) => p.data.featured) ?? projects[0])?.id;

  const nodes: GNode[] = [
    ...research.map(
      (p): GNode => ({
        key: `research/${p.id}`,
        col: 0,
        title: p.data.title,
        href: `/research/${p.id}/`,
        kind: '观点',
        state: 'done',
        hub: false,
      }),
    ),
    ...lab.map(
      (e): GNode => ({
        key: `lab/${e.id}`,
        col: 1,
        title: e.data.title,
        href: `/lab/${e.id}/`,
        kind: e.data.status === '构想' ? '构想' : '实验',
        state: LAB_STATE[e.data.status] ?? 'none',
        hub: false,
      }),
    ),
    ...projects.map(
      (p): GNode => ({
        key: `projects/${p.id}`,
        col: 2,
        title: p.data.title,
        href: `/projects/${p.id}/`,
        kind: '项目',
        state: PROJECT_STATE[p.data.status] ?? 'none',
        hub: p.id === hubId,
        sub: `${p.data.status} · ${p.data.progress.split(/[，,。；;]/)[0]}`,
      }),
    ),
    ...SERVICES.map(
      (s): GNode => ({
        key: `services/${s.id}`,
        col: 3,
        title: s.title,
        href: '/services/',
        kind: '合作',
        state: 'none',
        hub: false,
      }),
    ),
  ];

  const keys = new Set(nodes.map((n) => n.key));
  const edges: GEdge[] = [
    ...research.flatMap((p) => p.data.leadsTo.map((to) => ({ from: `research/${p.id}`, to }))),
    ...lab.filter((e) => e.data.project).map((e) => ({ from: `lab/${e.id}`, to: `projects/${e.data.project}` })),
    ...SERVICES.filter((s) => s.basedOn).map((s) => ({ from: s.basedOn!, to: `services/${s.id}` })),
  ].filter((e) => keys.has(e.from) && keys.has(e.to));

  return { nodes, edges };
}

// 某条内容的上游（谁通向它）和下游（它通向谁）
export async function getNeighbors(key: string) {
  const { nodes, edges } = await getGraph();
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const pick = (list: string[]) => list.map((k) => byKey.get(k)).filter((n): n is GNode => Boolean(n));
  return {
    self: byKey.get(key),
    upstream: pick(edges.filter((e) => e.to === key).map((e) => e.from)),
    downstream: pick(edges.filter((e) => e.from === key).map((e) => e.to)),
  };
}

// 首页的图每栏最多显示几条（内容多了之后只显示最新的）
const PER_COLUMN = 3;

export async function getHomeGraph() {
  const { nodes, edges } = await getGraph();
  const shown = ([0, 1, 2, 3] as const).flatMap((col) => nodes.filter((n) => n.col === col).slice(0, PER_COLUMN));
  const keys = new Set(shown.map((n) => n.key));
  return { nodes: shown, edges: edges.filter((e) => keys.has(e.from) && keys.has(e.to)) };
}

// 标题太长时截断。中文算 1 个单位，英文和数字约 0.56 个。
export function fit(text: string, maxUnits: number) {
  let units = 0;
  let out = '';
  for (const ch of text) {
    units += /[\u0000-ÿ]/.test(ch) ? 0.56 : 1;
    if (units > maxUnits) return `${out.trimEnd()}…`;
    out += ch;
  }
  return out;
}

// ---------- 桌面版布局：四栏从左到右 ----------

const COL_X = [50, 350, 650, 950];
const COL_W = [240, 240, 240, 200];
const SLOT_TOP = 96;
const SLOT_STEP = 62;
const NODE_H = 44;
const HUB_H = 56;

export interface Box {
  node: GNode;
  x: number;
  y: number;
  w: number;
  h: number;
  cy: number;
}

export interface Wire {
  d: string;
  head: string;
}

export function layoutDesktop(nodes: GNode[], edges: GEdge[]) {
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const slots = Math.max(5, ...[0, 1, 2, 3].map((c) => nodes.filter((n) => n.col === c).length));
  const slot = new Map<string, number>();
  const taken = [new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>()];
  const all = Array.from({ length: slots }, (_, i) => i);

  // 没有连线的内容排在下面几行
  const lower = [...all.filter((s) => s >= 3), ...all.filter((s) => s < 3).reverse()];
  const near = (t: number) => [...all].sort((a, b) => Math.abs(a - t) - Math.abs(b - t) || a - b);

  const place = (n: GNode, wanted: number[]) => {
    const s = [...wanted, ...all].find((x) => x >= 0 && x < slots && !taken[n.col].has(x));
    if (s === undefined) return;
    taken[n.col].add(s);
    slot.set(n.key, s);
  };
  const targetOf = (n: GNode) => edges.filter((e) => e.from === n.key).map((e) => byKey.get(e.to))[0];
  const sourceOf = (n: GNode) => edges.filter((e) => e.to === n.key).map((e) => byKey.get(e.from))[0];
  const col = (c: number) => nodes.filter((n) => n.col === c);

  // 项目：主项目固定在第二行
  const hub = col(2).find((n) => n.hub);
  if (hub) place(hub, [1]);
  for (const n of col(2)) if (n !== hub) place(n, lower);

  // 合作：有依据的排在它依据的项目同一行，连线是直的
  for (const n of col(3).filter(sourceOf)) place(n, near(slot.get(sourceOf(n)!.key) ?? 1));
  for (const n of col(3).filter((x) => !sourceOf(x))) place(n, lower);

  // 观点直接通向项目时，连线要横穿“构想与实验”这一栏，所以把那一行空出来
  const reserved = new Set(
    col(0)
      .map(targetOf)
      .filter((t) => t && t.col === 2)
      .map((t) => slot.get(t!.key)!),
  );
  for (const n of col(1).filter(targetOf)) {
    place(n, near(slot.get(targetOf(n)!.key) ?? 1).filter((s) => !reserved.has(s)));
  }
  for (const n of col(1).filter((x) => !targetOf(x))) place(n, lower.filter((s) => !reserved.has(s)));

  // 观点：排在它通向的内容同一行
  for (const n of col(0).filter(targetOf)) place(n, near(slot.get(targetOf(n)!.key) ?? 1));
  for (const n of col(0).filter((x) => !targetOf(x))) place(n, lower);

  const boxes = new Map<string, Box>();
  for (const n of nodes) {
    const s = slot.get(n.key) ?? 0;
    const h = n.hub ? HUB_H : NODE_H;
    const cy = SLOT_TOP + s * SLOT_STEP + NODE_H / 2;
    boxes.set(n.key, { node: n, x: COL_X[n.col], y: cy - h / 2, w: COL_W[n.col], h, cy });
  }

  const wires: Wire[] = [];
  for (const target of nodes) {
    const incoming = edges
      .filter((e) => e.to === target.key)
      .map((e) => boxes.get(e.from)!)
      .sort((a, b) => a.cy - b.cy);
    const t = boxes.get(target.key)!;
    incoming.forEach((s, i) => {
      const ty = t.cy + (i - (incoming.length - 1) / 2) * 10;
      const sx = s.x + s.w;
      const ex = t.x - 10;
      const dx = ex - sx;
      const d =
        Math.abs(s.cy - ty) < 0.5
          ? `M${sx} ${s.cy}H${ex}`
          : `M${sx} ${s.cy}C${sx + dx * 0.55} ${s.cy} ${ex - dx * 0.55} ${ty} ${ex} ${ty}`;
      wires.push({ d, head: `M${t.x - 1} ${ty}l-9-4.5v9z` });
    });
  }

  const height = SLOT_TOP + slots * SLOT_STEP + 40;
  return { boxes: [...boxes.values()], wires, height, width: 1200 };
}

// ---------- 手机版布局：四栏从上到下，连线走两侧 ----------

export function layoutMobile(nodes: GNode[], edges: GEdge[]) {
  const desktop = layoutDesktop(nodes, edges);
  const rowOf = new Map(desktop.boxes.map((b) => [b.node.key, b.cy]));
  const X = 52;
  const W = 274;
  const boxes = new Map<string, Box>();
  const headers: { y: number; col: number }[] = [];

  let y = 0;
  for (const c of [0, 1, 2, 3]) {
    const list = nodes.filter((n) => n.col === c).sort((a, b) => rowOf.get(a.key)! - rowOf.get(b.key)!);
    if (list.length === 0) continue;
    y += headers.length === 0 ? 30 : 32;
    headers.push({ y, col: c });
    y += 14;
    for (const n of list) {
      const h = n.hub ? 52 : 40;
      boxes.set(n.key, { node: n, x: X, y, w: W, h, cy: y + h / 2 });
      y += h + 10;
    }
  }

  const wires: Wire[] = [];
  const pairs = edges.map((e) => ({ s: boxes.get(e.from)!, t: boxes.get(e.to)! }));

  // 通向主项目的线走左侧，最远的走最外面
  const left = pairs.filter((p) => p.t.node.hub).sort((a, b) => a.s.cy - b.s.cy);
  const step = left.length > 1 ? Math.min(10, 28 / (left.length - 1)) : 0;
  left.forEach((p, i) => {
    const x = 14 + i * step;
    const ty = p.t.y + 16 + i * Math.min(10, (p.t.h - 32) / Math.max(1, left.length - 1));
    wires.push({ d: `M${X} ${p.s.cy}H${x}V${ty}H${X - 10}`, head: `M${X - 1} ${ty}l-9-4.5v9z` });
  });

  // 其他的线走右侧，跨度最大的走最外面
  const right = pairs
    .filter((p) => !p.t.node.hub)
    .sort((a, b) => Math.abs(b.s.cy - b.t.cy) - Math.abs(a.s.cy - a.t.cy));
  right.forEach((p, i) => {
    const x = 342 - i * 8;
    wires.push({
      d: `M${X + W} ${p.s.cy}H${x}V${p.t.cy}H${X + W + 10}`,
      head: `M${X + W + 1} ${p.t.cy}l9-4.5v9z`,
    });
  });

  const legendY = y + 22;
  return { boxes: [...boxes.values()], headers, wires, legendY, height: legendY + 28, width: 358 };
}
