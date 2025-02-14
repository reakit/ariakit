import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
// @ts-expect-error No Bun types for now.
import { $ } from "bun";

const ROOT_PATH = (await $`git rev-parse --show-toplevel`.text()).trim();
const REACT_PATH = resolve(ROOT_PATH, "packages/ariakit-react-core/src");
const SOLID_PATH = resolve(ROOT_PATH, "packages/ariakit-solid-core/src");

async function getDirs(dir: string) {
  const dirs = await readdir(dir);
  return dirs.filter((dir) => !dir.includes("utils") && !dir.includes("."));
}

export type FileStatusMatch = "react" | "solid" | "both";
export type StatusTree = Record<string, Record<string, FileStatusMatch>>;
export type GroupedStatusTree = Record<string, FileStatusMatch>;

let CACHED_TREE: StatusTree | undefined = undefined;

export async function getStatusTree(): Promise<StatusTree> {
  if (CACHED_TREE) return CACHED_TREE;
  const reactDirs = await getDirs(REACT_PATH);
  const solidDirs = await getDirs(SOLID_PATH);

  const tree: StatusTree = {};
  for (const dir of reactDirs) {
    tree[dir] ??= {};
    const files = await readdir(resolve(REACT_PATH, dir));
    for (const file of files) {
      const fullPath = resolve(REACT_PATH, dir, file);
      if (fullPath.includes("utils") || fullPath.includes("_")) continue;
      const cleanFile = file.replace(/\.tsx?$/, "");
      tree[dir][cleanFile] = "react";
    }
  }
  for (const dir of solidDirs) {
    tree[dir] ??= {};
    const files = await readdir(resolve(SOLID_PATH, dir));
    for (const file of files) {
      const fullPath = resolve(SOLID_PATH, dir, file);
      if (fullPath.includes("utils") || fullPath.includes("_")) continue;
      const cleanFile = file.replace(/\.tsx?$/, "");
      const isReactFile = tree[dir][cleanFile] === "react";
      tree[dir][cleanFile] = isReactFile ? "both" : "solid";
    }
  }
  CACHED_TREE = tree;
  return tree;
}

export async function getGroupedStatusTree(): Promise<GroupedStatusTree> {
  const tree = await getStatusTree();
  const groupedTree: GroupedStatusTree = {};
  for (const dir of Object.keys(tree)) {
    let match: FileStatusMatch;
    const dirValue = tree[dir]!;
    const values = Object.values(dirValue);
    if (values.every((v) => v === "both")) match = "both";
    else if (values.every((v) => v === "react")) match = "react";
    else match = "solid";
    groupedTree[dir] = match;
  }
  return groupedTree;
}

type FlatStatusTree = Record<string, FileStatusMatch>;

export async function getFlatStatusTree(): Promise<FlatStatusTree> {
  const tree = await getStatusTree();
  const flatTree: FlatStatusTree = {};
  for (const dir of Object.keys(tree))
    for (const file of Object.keys(tree[dir]!))
      flatTree[`${dir}/${file}`] = tree[dir]![file]!;
  return flatTree;
}

type GroupedFlatStatusTree = Record<string, FileStatusMatch>;

export async function getGroupedFlatStatusTree(): Promise<GroupedFlatStatusTree> {
  const tree = await getGroupedStatusTree();
  const flatTree: GroupedFlatStatusTree = {};
  for (const dir of Object.keys(tree)) flatTree[dir] = tree[dir]!;
  return flatTree;
}

export type DirStatusMatch = FileStatusMatch | "partial";
export type DirStatusInfo = Record<string, DirStatusMatch>;

let CACHED_DIR_INFO: DirStatusInfo | undefined = undefined;

export async function getDirStatusInfo(): Promise<DirStatusInfo> {
  if (CACHED_DIR_INFO) return CACHED_DIR_INFO;
  const tree = await getStatusTree();
  const dirInfo: Record<string, DirStatusMatch> = {};
  const dirs = Object.keys(tree);
  for (const dir of dirs) {
    let match: DirStatusMatch;
    const dirValue = tree[dir]!;
    const values = Object.values(dirValue);
    if (values.every((v) => v === "both")) match = "both";
    else if (values.every((v) => v === "react")) match = "react";
    else if (values.every((v) => v === "solid")) match = "solid";
    else match = "partial";
    dirInfo[dir] = match;
  }
  CACHED_DIR_INFO = dirInfo;
  return dirInfo;
}
