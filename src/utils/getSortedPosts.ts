import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";

/**
 * Returns posts that are eligible to be shown to users, sorted by publication
 * date descending. Updating a post does not change its position in post lists.
 *
 * Note: filtering respects drafts and scheduled posts via `postFilter()`.
 */
export function getSortedPosts(posts: CollectionEntry<"posts">[]) {
  return posts
    .filter(postFilter)
    .sort((a, b) => {
      const dateDifference =
        new Date(b.data.pubDatetime).getTime() -
        new Date(a.data.pubDatetime).getTime();

      return dateDifference || b.id.localeCompare(a.id);
    });
}
