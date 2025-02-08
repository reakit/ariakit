import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { getPageName } from "./get-page-name.js";
import { getPageTree } from "./get-page-tree.js";

/**
 * @param {string | import("./types.js").Reference} filename
 * @param {import("./types.js").Page["getGroup"]} [getGroup]
 * @param {import("hast").Root} [tree]
 * @return {Omit<import("./types.js").PageIndexDetail, "category">}
 */
export function getPageIndexDetail(filename, getGroup, tree) {
  tree = tree || getPageTree(filename);
  const slug = getPageName(filename);
  let title = "";
  let content = "";
  visit(tree, "element", (node) => {
    if (node.tagName === "h1" && !title) {
      title = toString(node).trim();
    }
    if (node.tagName === "p" && !content) {
      content = toString(node).trim();
    }
  });
  const dataGroup = tree.data?.group ? `${tree.data?.group}` : null;
  const group = getGroup?.(filename) || dataGroup;
  return {
    group,
    slug,
    title,
    content,
    unlisted: !!tree.data?.unlisted,
    tags: Array.isArray(tree.data?.tags) ? tree.data?.tags || [] : [],
    media: Array.isArray(tree.data?.media) ? tree.data?.media || [] : [],
  };
}
