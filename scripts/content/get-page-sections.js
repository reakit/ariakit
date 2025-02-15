import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { isPlaygroundParagraphNode } from "./ast.js";
import { getPageIndexDetail } from "./get-page-index-detail.js";
import { getPageTree } from "./get-page-tree.js";

/**
 * @param {string | import("./types.js").Reference} filename
 * @param {string} category
 * @param {import("./types.js").Page["getGroup"]} [getGroup]
 */
export function getPageSections(filename, category, getGroup) {
  const tree = getPageTree(filename);
  const meta = getPageIndexDetail(filename, getGroup, tree);

  /** @type {string | null} */
  let parentSection = null;
  /** @type {string | null} */
  let section = null;
  /** @type {string | null} */
  let sectionId = null;

  const pageMeta = {
    ...meta,
    category,
    /** @type {import("./types.js").PageContents} */
    sections: [],
  };

  visit(tree, "element", (node) => {
    if (node.tagName === "h2") {
      parentSection = null;
      section = toString(node).trim();
      sectionId = `${node.properties?.id}`;
    }
    if (node.tagName === "h3") {
      parentSection = parentSection || section;
      section = toString(node).trim();
      sectionId = `${node.properties?.id}`;
    }
    if (node.tagName === "p") {
      if (isPlaygroundParagraphNode(node)) return;
      const content = toString(node).trim();
      const existingSection = pageMeta.sections.find(
        (s) => s.sectionId === sectionId,
      );
      if (existingSection) {
        existingSection.content += `\n\n${content}`;
      } else {
        pageMeta.sections.push({
          ...meta,
          category,
          parentSection,
          section,
          sectionId,
          content,
        });
      }
    }
  });

  return pageMeta;
}
