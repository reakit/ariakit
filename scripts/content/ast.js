/**
 * Determines if a node is a playground node.
 * @param {import("hast").Element | import("hast").ElementContent} node
 * @returns {node is import("hast").Element}
 */
export function isPlaygroundNode(node) {
  if (!("tagName" in node)) return false;
  if (node.tagName !== "a") return false;
  if (!node.properties) return false;
  return "dataPlayground" in node.properties;
}

/**
 * Determines if a node is a playground paragraph node.
 * @param {import("hast").Element} node
 */
export function isPlaygroundParagraphNode(node) {
  if (node.tagName !== "p") return false;
  const [child] = node.children;
  if (!child) return false;
  return isPlaygroundNode(child);
}
