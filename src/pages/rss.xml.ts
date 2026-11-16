import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../consts';
import { getResearch } from '../lib/content';

export async function GET(context: APIContext) {
  // 草稿永远不进 RSS
  const posts = (await getResearch()).filter((post) => !post.data.draft);

  return rss({
    title: `${SITE.name} · Research`,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: `/research/${post.id}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
}
