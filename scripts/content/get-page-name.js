import { basename, dirname, extname } from "node:path";
import { kebabCase } from "lodash-es";
import { PAGE_INDEX_FILE_REGEX } from "./const.js";

/**
 * Returns the page name from a file path. It's usually the file name, but for
 * index and readme files it's the directory name.
 * @param {string | import("./types.ts").Reference} filename
 */
export function getPageName(filename) {
  if (typeof filename !== "string") {
    return kebabCase(filename.name);
  }
  const isIndexFile = PAGE_INDEX_FILE_REGEX.test(filename);
  const name = isIndexFile
    ? `${basename(dirname(filename))}`
    : `${basename(filename, extname(filename))}`;
  // Remove leading digits.
  return name.replace(/^\d+\-/, "");
}
