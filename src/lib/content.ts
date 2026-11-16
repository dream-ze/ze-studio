import { getCollection } from 'astro:content';

// 草稿只在本地开发（npm run dev）时显示，正式构建时不会出现。
const showDrafts = import.meta.env.DEV;
const visible = ({ data }: { data: { draft: boolean } }) => showDrafts || !data.draft;

export async function getResearch() {
  const items = await getCollection('research', visible);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getLab() {
  const items = await getCollection('lab', visible);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getProjects() {
  const items = await getCollection('projects', visible);
  return items.sort((a, b) => a.data.order - b.data.order);
}

export function formatDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
