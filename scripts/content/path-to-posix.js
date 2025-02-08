/**
 * @param {string} path
 */
export function pathToPosix(path) {
  return path.replace(/\\/g, "/");
}
