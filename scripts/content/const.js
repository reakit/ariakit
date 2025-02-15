export const PAGE_INDEX_FILE_REGEX =
  /\/[^\/]+\/((index(\.(react|solid))?|page|layout)\.([tj]sx?|vue|svelte)|readme(\.(react|solid|vue|svelte))?\.mdx?)/i;

export const PAGE_FILE_REGEX = new RegExp(
  `(${PAGE_INDEX_FILE_REGEX.source}|\.mdx?)$`,
  "i",
);
