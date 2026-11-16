# ZE STUDIO

个人工作室网站。设计决定见 [设计定稿.md](设计定稿.md)。

## 本地运行

```bash
npm install
```

```bash
npm run dev
```

打开 http://localhost:4321 。草稿只在本地运行时显示，带“草稿”标记。

```bash
npm run build
```

生成正式版本到 `dist/`，草稿不会被包含。

## 新增内容

内容都是 Markdown 文件，加一个文件就会自动出现在列表和首页，不用改代码。文件名用英文和连字符，它会成为网址的一部分。

| 栏目 | 文件夹 | 开头必填的字段 |
|---|---|---|
| Research | `src/content/research/` | `title` `summary` `topic` `date`，有关联时写 `leadsTo` |
| Lab | `src/content/lab/` | `title` `summary` `status` `date`，构想另外写 `next` |
| Projects | `src/content/projects/` | `title` `why` `status` `type` `progress` |

- `topic` 只能是：AI 行业、技术架构、软件工程、复盘
- Lab 的 `status` 只能是：构想、进行中、完成、放弃
- Projects 的 `status` 只能是：开发中、自用中、已归档
- 加上 `draft: true` 就是草稿，不会发布
- 项目截图放到 `public/images/`，然后在项目文件里写 `cover: /images/文件名.png`
- 写了 `featured: true` 的项目是主项目：首页和项目页用大块显示，血缘图里用黄绿色标出

## 关联（血缘图上的连线）

首页的血缘图、项目页的上下游图、文末的“通向”链接，都只来自内容文件里写明的关联。没写就没有线。

| 从哪里 | 怎么写 | 例子 |
|---|---|---|
| 观点 → 项目或 Lab | 文章开头写 `leadsTo` | `leadsTo: [projects/ai-evolution-radar]` |
| Lab → 项目 | 记录开头写 `project` | `project: ai-evolution-radar` |
| 项目 → 合作方向 | 在 `src/data/services.ts` 里写 `basedOn` | `basedOn: 'projects/ai-evolution-radar'` |

写法是“栏目/文件名”，文件名不带 `.md`。首页的图每栏只显示最新 3 条。

合作方向和技术交流的话题不是 Markdown，在 `src/data/services.ts` 里改。

## 上线前要改的地方

- `src/consts.ts`：填联系邮箱和 GitHub 账号（页脚会自动显示）
- `astro.config.mjs`：把 `site` 改成正式域名
- 检查页面上所有“待补充”的地方

## 版本说明

Astro 固定在 7.4.0，因为更新的版本要求 Node 22.23.4 以上，而本机是 22.23.1。升级 Node 之后可以再升级 Astro。
