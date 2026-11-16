import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Research：观点和思考（长文章）
const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    topic: z.enum(['AI 行业', '技术架构', '软件工程', '复盘']),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // 这篇文章通向哪里：栏目/文件名，例如 projects/ai-evolution-radar 或 lab/extract-and-verify
    leadsTo: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Lab：产品构想和实验记录（短）
const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['构想', '进行中', '完成', '放弃']),
    date: z.coerce.date(),
    // 构想必须写下一步怎么验证
    next: z.string().optional(),
    // 关联项目的文件名（不带 .md）
    project: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Projects：已经做出来的东西
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    // 一句话：为什么做
    why: z.string(),
    status: z.enum(['开发中', '自用中', '已归档']),
    type: z.string(),
    started: z.string().optional(),
    progress: z.string(),
    tech: z.array(z.string()).default([]),
    // 截图路径，放在 public/images/ 下，例如 /images/radar.png
    cover: z.string().optional(),
    // 首页“正在做”展示的项目
    featured: z.boolean().default(false),
    order: z.number().default(99),
    demo: z.string().url().optional(),
    repo: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { research, lab, projects };
