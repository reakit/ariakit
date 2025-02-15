import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PAGE_FILE_REGEX } from "./const.js";
import { getPageName } from "./get-page-name.js";
import { pathToPosix } from "./path-to-posix.js";

/**
 * Reads a directory recursively and returns a list of files that match the
 * given pattern.
 * @param {string | string[]} context
 * @param {RegExp} pattern
 * @param {string[]} [files]
 * @param {string | null} [parentContext]
 */
export function getPageEntryFiles(
  context,
  pattern = PAGE_FILE_REGEX,
  files = [],
  parentContext = null,
) {
  const contexts = Array.isArray(context) ? context : [context];
  for (const context of contexts) {
    const items = readdirSync(context, { withFileTypes: true });
    for (const item of items) {
      const itemPath = join(context, item.name);
      const posixPath = pathToPosix(itemPath);
      const relativePath = posixPath.replace(parentContext || context, "");
      if (/node_modules/.test(itemPath)) continue;
      if (parentContext === null && item.isDirectory()) {
        getPageEntryFiles(itemPath, pattern, files, context);
      } else if (pattern.test(relativePath)) {
        const pageName = getPageName(relativePath);
        const index = files.findIndex((file) => getPageName(file) === pageName);
        if (index !== -1) {
          files.splice(index, 1, posixPath);
        } else {
          files.push(posixPath);
        }
      }
    }
  }
  return files;
}

/** @type {WeakMap<import("./types.js").Page, string[]>} */
const entryFilesCache = new WeakMap();

/**
 * Reads a directory recursively and returns a list of files that match the
 * given pattern.
 * @param {import("./types.js").Page} page
 */
export function getPageEntryFilesCached(page) {
  if (process.env.NODE_ENV === "production" && entryFilesCache.has(page)) {
    const files = entryFilesCache.get(page);
    if (files) return files;
  }
  const files = getPageEntryFiles(page.sourceContext, page.pageFileRegex);
  entryFilesCache.set(page, files);
  return files;
}
