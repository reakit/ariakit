import { dirname, extname, resolve } from "node:path";
import { visit } from "unist-util-visit";
import { isPlaygroundNode } from "./ast.js";
import { getPageTree } from "./get-page-tree.js";

/**
 * Returns all source files for a page.
 * @param {string} filename
 */
export function getPageSourceFiles(filename) {
  if (extname(filename) !== ".md") return [filename];

  /** @type {string[]} */
  const sourceFiles = [];

  const tree = getPageTree(filename);

  visit(tree, "element", (node) => {
    if (!isPlaygroundNode(node)) return;
    const href = node.properties?.href;
    if (typeof href !== "string") return;
    const nextFilename = resolve(dirname(filename), href);
    sourceFiles.push(nextFilename);
  });

  return sourceFiles;
}
