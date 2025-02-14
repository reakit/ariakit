import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
// @ts-expect-error No Bun types for now.
import Bun, { $ } from "bun";
import { getFlatStatusTree, getGroupedFlatStatusTree } from "./status.ts";

const ROOT_PATH = (await $`git rev-parse --show-toplevel`.text()).trim();
const SRC_PATH = resolve(ROOT_PATH, "packages/ariakit-react-core/src");

async function getDirs(dir: string) {
  const dirs = await readdir(dir);
  return dirs.filter((dir) => !dir.includes("utils") && !dir.includes("."));
}

type Tree = Record<string, Record<string, Array<string>>>;
type GroupedTree = Record<string, Array<string>>;

async function genEmptyTree() {
  const dirs = await getDirs(SRC_PATH);
  const tree: Tree = {};
  for (const dir of dirs) {
    tree[dir] ??= {};
    const files = await readdir(resolve(SRC_PATH, dir));
    for (const file of files) {
      const fullPath = resolve(SRC_PATH, dir, file);
      if (
        fullPath.includes("utils") ||
        fullPath.includes("_") ||
        fullPath.endsWith(".ts")
      )
        continue;
      const cleanFile = file.replace(/\.tsx?$/, "");
      tree[dir][cleanFile] = [];
    }
  }
  return tree;
}

const DEP_REGEXP =
  /import {[\s\S]+?use[A-Za-z]+?[\s\S]+?\"\.\.\/([\S]+?)\.tsx"?;/gm;
const LOCAL_DEP_REGEXP =
  /import {[\s\S]+?use[A-Za-z]+?[\s\S]+?\"\.\/([\S]+?)\.tsx"?;/gm;

async function fillDeps(tree: Tree) {
  const allComponents = new Set<string>();

  for (const dir of Object.keys(tree)) {
    for (const file of Object.keys(tree[dir]!)) {
      allComponents.add(`${dir}/${file}`);
    }
  }

  for (const dir of Object.keys(tree)) {
    for (const file of Object.keys(tree[dir]!)) {
      const fullPath = resolve(SRC_PATH, dir, `${file}.tsx`);
      const deps = new Set<string>();
      const fileContent = (await Bun.file(fullPath).text()) as string;
      const match = fileContent.matchAll(DEP_REGEXP);
      for (const [, dep] of match) {
        const isComponent = allComponents.has(dep!);
        const isSelf = dep === `${dir}/${file}`;
        if (isComponent && !isSelf) deps.add(dep!);
      }
      const localMatch = fileContent.matchAll(LOCAL_DEP_REGEXP);
      for (const [, dep] of localMatch) {
        const isComponent = allComponents.has(`${dir}/${dep!}`);
        const isSelf = dep === file;
        if (isComponent && !isSelf) deps.add(`${dir}/${dep!}`);
      }
      tree[dir]![file] = [...deps];
    }
  }
}

function findDeps(component: string, tree: Tree) {
  const [dir, file] = component.split("/");
  const deps = tree[dir!]?.[file!];
  if (!deps) throw new Error(`Component ${component} not found`);
  return deps;
}

function resolveDeps(deps: Array<string>, tree: Tree) {
  const outDeps = new Set(deps);
  const stack = [...deps];

  while (stack.length) {
    const dep = stack.pop()!;
    const nestedDeps = findDeps(dep, tree);
    for (const nestedDep of nestedDeps) {
      if (!outDeps.has(nestedDep)) {
        outDeps.add(nestedDep);
        stack.push(nestedDep);
      }
    }
  }

  return Array.from(outDeps);
}

let CACHED_TREE: Tree | undefined = undefined;

export async function getDeps(): Promise<Tree>;
export async function getDeps(component: string): Promise<Array<string>>;
export async function getDeps(component?: string) {
  let tree: Tree;
  if (CACHED_TREE) tree = CACHED_TREE;
  else {
    tree = await genEmptyTree();
    await fillDeps(tree);
    CACHED_TREE = tree;
  }
  if (!component) return tree;
  return findDeps(component, tree);
}

let CACHED_RESOLVED_TREE: Tree | undefined = undefined;

export async function getResolvedDeps(): Promise<Tree>;
export async function getResolvedDeps(
  component: string,
): Promise<Array<string>>;
export async function getResolvedDeps(component?: string) {
  const tree = await getDeps();
  let resolvedTree: Tree;
  if (!component) {
    if (CACHED_RESOLVED_TREE) resolvedTree = CACHED_RESOLVED_TREE;
    else {
      const newResolvedTree: Tree = {};
      for (const dir of Object.keys(tree)) {
        newResolvedTree[dir] = {};
        for (const file of Object.keys(tree[dir]!)) {
          const deps = tree[dir]![file]!;
          if (!deps) throw new Error(`Component ${dir}/${file} not found`);
          newResolvedTree[dir]![file] = resolveDeps(deps, tree);
        }
      }
      resolvedTree = newResolvedTree;
      CACHED_RESOLVED_TREE = resolvedTree;
    }
    return resolvedTree;
  }
  if (CACHED_RESOLVED_TREE) return findDeps(component, CACHED_RESOLVED_TREE);
  return resolveDeps(findDeps(component, tree), tree);
}

let CACHED_GROUPED_TREE: GroupedTree | undefined = undefined;

function groupDeps(tree: Tree): GroupedTree {
  const groupedTree: GroupedTree = {};

  for (const dir of Object.keys(tree)) {
    groupedTree[dir] ??= [];
    for (const file of Object.keys(tree[dir]!)) {
      const deps = tree[dir]![file]!;
      groupedTree[dir].push(
        ...deps.map((dep) => dep.split("/")[0]!).filter((dep) => dep !== dir),
      );
    }
    groupedTree[dir] = [...new Set(groupedTree[dir])];
  }

  return groupedTree;
}

export async function getGroupedDeps(): Promise<GroupedTree>;
export async function getGroupedDeps(component: string): Promise<Array<string>>;
export async function getGroupedDeps(component?: string) {
  let groupedTree: GroupedTree;
  if (CACHED_GROUPED_TREE) groupedTree = CACHED_GROUPED_TREE;
  else {
    const tree = await getDeps();
    groupedTree = groupDeps(tree);
    CACHED_GROUPED_TREE = groupedTree;
  }

  if (!component) return groupedTree;
  return groupedTree[component] ?? [];
}

let CACHED_GROUPED_RESOLVED_TREE: GroupedTree | undefined = undefined;

export async function getGroupedResolvedDeps(): Promise<GroupedTree>;
export async function getGroupedResolvedDeps(
  component: string,
): Promise<Array<string>>;
export async function getGroupedResolvedDeps(component?: string) {
  let groupedTree: GroupedTree;
  if (CACHED_GROUPED_RESOLVED_TREE) groupedTree = CACHED_GROUPED_RESOLVED_TREE;
  else {
    const tree = await getResolvedDeps();
    groupedTree = groupDeps(tree);
    CACHED_GROUPED_RESOLVED_TREE = groupedTree;
  }

  if (!component) return groupedTree;
  return groupedTree[component] || [];
}

function findDependents(component: string, tree: Tree) {
  const dependents = new Set<string>();

  for (const dir of Object.keys(tree)) {
    for (const file of Object.keys(tree[dir]!)) {
      const deps = tree[dir]![file]!;
      if (deps.includes(component)) {
        dependents.add(`${dir}/${file}`);
      }
    }
  }

  return Array.from(dependents);
}

function findGroupedDependents(component: string, groupedTree: GroupedTree) {
  const dependents = new Set<string>();

  for (const dir of Object.keys(groupedTree)) {
    if (groupedTree[dir]!.includes(component)) {
      if (dir !== component) dependents.add(dir);
    }
  }

  return Array.from(dependents);
}

function resolveDependents(dependents: Array<string>, tree: Tree) {
  const outDependents = new Set(dependents);
  const stack = [...dependents];

  while (stack.length) {
    const dependent = stack.pop()!;
    const nestedDependents = findDependents(dependent, tree);
    for (const nestedDependent of nestedDependents) {
      if (!outDependents.has(nestedDependent)) {
        outDependents.add(nestedDependent);
        stack.push(nestedDependent);
      }
    }
  }

  return Array.from(outDependents);
}

function resolveGroupedDependents(
  dependents: Array<string>,
  groupedTree: GroupedTree,
) {
  const outDependents = new Set(dependents);
  const stack = [...dependents];

  while (stack.length) {
    const dependent = stack.pop()!;
    const nestedDependents = findGroupedDependents(dependent, groupedTree);
    for (const nestedDependent of nestedDependents) {
      if (!outDependents.has(nestedDependent)) {
        outDependents.add(nestedDependent);
        stack.push(nestedDependent);
      }
    }
  }

  return Array.from(outDependents);
}

export async function getDependents(component: string): Promise<Array<string>> {
  const tree = await getDeps();
  return findDependents(component, tree);
}

export async function getGroupedDependents(
  component: string,
): Promise<Array<string>> {
  const groupedTree = await getGroupedDeps();
  return findGroupedDependents(component, groupedTree);
}

export async function getResolvedDependents(
  component: string,
): Promise<Array<string>> {
  const tree = await getDeps();
  const dependents = findDependents(component, tree);
  return resolveDependents(dependents, tree);
}

export async function getResolvedGroupedDependents(
  component: string,
): Promise<Array<string>> {
  const groupedTree = await getGroupedResolvedDeps();
  const dependents = findGroupedDependents(component, groupedTree);
  return resolveGroupedDependents(dependents, groupedTree);
}

export async function getDepCounts(
  grouped = false,
): Promise<Record<string, number>> {
  if (!grouped) {
    const tree = await getDeps();
    const depCounts: Record<string, number> = {};

    for (const dir of Object.keys(tree)) {
      for (const file of Object.keys(tree[dir]!)) {
        const component = `${dir}/${file}`;
        const deps = tree[dir]![file]!;
        depCounts[component] = deps.length;
      }
    }

    return depCounts;
  }

  const groupedTree = await getGroupedDeps();
  const depCounts: Record<string, number> = {};

  for (const [component, deps] of Object.entries(groupedTree)) {
    depCounts[component] = deps.length;
  }

  return depCounts;
}

export async function getResolvedDepCounts(
  grouped = false,
): Promise<Record<string, number>> {
  if (!grouped) {
    const tree = await getResolvedDeps();
    const resolvedDepCounts: Record<string, number> = {};

    for (const dir of Object.keys(tree)) {
      for (const file of Object.keys(tree[dir]!)) {
        const component = `${dir}/${file}`;
        const deps = tree[dir]![file]!;
        resolvedDepCounts[component] = deps.length;
      }
    }

    return resolvedDepCounts;
  }

  const groupedTree = await getGroupedResolvedDeps();
  const resolvedDepCounts: Record<string, number> = {};

  for (const [component, deps] of Object.entries(groupedTree)) {
    resolvedDepCounts[component] = deps.length;
  }

  return resolvedDepCounts;
}

export async function getDependentCounts(
  grouped = false,
): Promise<Record<string, number>> {
  if (!grouped) {
    const tree = await getDeps();
    const dependentCounts: Record<string, number> = {};

    for (const dir of Object.keys(tree)) {
      for (const file of Object.keys(tree[dir]!)) {
        const component = `${dir}/${file}`;
        const dependents = findDependents(component, tree);
        dependentCounts[component] = dependents.length;
      }
    }

    return dependentCounts;
  }

  const groupedTree = await getGroupedDeps();
  const dependentCounts: Record<string, number> = {};

  for (const dir of Object.keys(groupedTree)) {
    for (const component of groupedTree[dir]!) {
      const dependents = findGroupedDependents(component, groupedTree);
      dependentCounts[component] = dependents.length;
    }
  }

  return dependentCounts;
}

export async function getResolvedDependentCounts(
  grouped = false,
): Promise<Record<string, number>> {
  if (!grouped) {
    const tree = await getDeps();
    const resolvedDependentCounts: Record<string, number> = {};

    for (const dir of Object.keys(tree)) {
      for (const file of Object.keys(tree[dir]!)) {
        const component = `${dir}/${file}`;
        const dependents = resolveDependents(
          findDependents(component, tree),
          tree,
        );
        resolvedDependentCounts[component] = dependents.length;
      }
    }

    return resolvedDependentCounts;
  }

  const groupedTree = await getGroupedResolvedDeps();
  const resolvedDependentCounts: Record<string, number> = {};

  for (const dir of Object.keys(groupedTree)) {
    for (const component of groupedTree[dir]!) {
      const dependents = findGroupedDependents(component, groupedTree);
      resolvedDependentCounts[component] = dependents.length;
    }
  }

  return resolvedDependentCounts;
}

export async function getUnlockedComponents(
  grouped = false,
): Promise<Array<string>> {
  if (!grouped) {
    const tree = await getDeps();
    const flatStatusTree = await getFlatStatusTree();
    const unlockedComponents: Array<string> = [];

    for (const dir of Object.keys(tree)) {
      for (const file of Object.keys(tree[dir]!)) {
        const component = `${dir}/${file}`;
        const deps = tree[dir]![file]!;
        const isPorted = flatStatusTree[component] === "both";
        const allDepsPorted = deps.every(
          (dep) => flatStatusTree[dep] === "both",
        );

        if (!isPorted && allDepsPorted) {
          unlockedComponents.push(component);
        }
      }
    }

    return unlockedComponents;
  }

  const groupedTree = await getGroupedDeps();
  const groupedFlatStatusTree = await getGroupedFlatStatusTree();
  const unlockedComponents: Array<string> = [];

  for (const component of Object.keys(groupedTree)) {
    const isPorted = groupedFlatStatusTree[component] === "both";
    const allDepsPorted = groupedTree[component]!.every(
      (dep) => groupedFlatStatusTree[dep] === "both",
    );

    if (!isPorted && allDepsPorted) {
      unlockedComponents.push(component);
    }
  }

  return unlockedComponents;
}
