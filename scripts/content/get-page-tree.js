import matter from "gray-matter";
import { toString } from "hast-util-to-string";
import { marked } from "marked";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { getPageContent } from "./get-page-content.js";

/**
 * Returns the page tree from a markdown content string.
 * @param {string} content
 */
export function getPageTreeFromContent(content) {
  const { data, content: contentWithoutMatter } = matter(content);

  const tree = unified()
    .use(rehypeParse, { fragment: true })
    .parse(marked(contentWithoutMatter));

  /** @type {import("./types.js").TableOfContents} */
  const tableOfContents = [];

  visit(tree, "element", (node) => {
    if (node.tagName === "h2") {
      const id = `${node.properties?.id}`;
      const text = toString(node);
      tableOfContents.push({ id, text, href: `#${id}` });
    }
    if (node.tagName === "h3") {
      const lastH2 = tableOfContents[tableOfContents.length - 1];
      if (!lastH2) return;
      const id = `${node.properties?.id}`;
      const text = toString(node);
      lastH2.children = lastH2.children || [];
      lastH2.children.push({ id, text, href: `#${id}` });
    }
  });

  tree.data = { ...data, ...tree.data, tableOfContents };

  return tree;
}

/**
 * Gets the page tree from a file path.
 * @param {string | import("./types.js").Reference} filename
 */
export function getPageTree(filename) {
  const content = getPageContent(filename);
  return getPageTreeFromContent(content);
}
