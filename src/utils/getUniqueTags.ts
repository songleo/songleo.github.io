import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";
import config from "@/config";

type Tag = {
  tag: string;
  tagName: string;
};

/**
 * Builds a de-duplicated, sorted tag list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
  const tags = new Map<string, Tag>();
  for (const post of posts.filter(postFilter)) {
    for (const tagName of post.data.tags) {
      const tag = slugifyStr(tagName);
      if (!tags.has(tag)) tags.set(tag, { tag, tagName });
    }
  }
  return [...tags.values()].sort((tagA, tagB) =>
    tagA.tag.localeCompare(tagB.tag, config.site.lang)
  );
}
