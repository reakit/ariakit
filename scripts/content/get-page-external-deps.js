import { dirname, resolve } from "node:path";
import { visit } from "unist-util-visit";
import { isPlaygroundNode } from "./ast.js";
import { getExampleDeps } from "./get-example-deps.js";
import { getPageTree } from "./get-page-tree.js";

/**
 * @param {string} filename
 */
export function getPageExternalDeps(filename) {
  const tree = getPageTree(filename);

  /** @type {Record<string, string>} */
  let deps = {};

  visit(tree, "element", (node) => {
    if (!isPlaygroundNode(node)) return;
    const href = node.properties?.href;
    if (typeof href !== "string") return;
    const nextFilename = resolve(dirname(filename), href);
    const pageDeps = getExampleDeps(nextFilename);
    deps = { ...deps, ...pageDeps.dependencies };
  });

  return deps;
}
