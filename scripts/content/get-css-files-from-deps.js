/**
 * @param {Record<string, Record<string, string>>} deps
 */
export function getCSSFilesFromDeps(deps) {
  return Object.values(deps)
    .flatMap((deps) =>
      Object.values(deps).filter((dep) => dep.endsWith(".css")),
    )
    .filter(Boolean);
}
