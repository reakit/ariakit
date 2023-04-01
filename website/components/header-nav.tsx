"use client";

import type { ReactNode } from "react";
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cx } from "@ariakit/core/utils/misc";
import { isApple } from "@ariakit/core/utils/platform";
import { PopoverDisclosureArrow, PopoverDismiss } from "@ariakit/react";
import { useEvent, useSafeLayoutEffect } from "@ariakit/react-core/utils/hooks";
import type {
  QueryFunctionContext,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import groupBy from "lodash/groupBy.js";
import { usePathname } from "next/navigation.js";
import { flushSync } from "react-dom";
import type { PageContent } from "website/build-pages/contents.js";
import type { PageIndexDetail } from "website/build-pages/index.js";
import pageIndex from "website/build-pages/index.js";
import Blog from "website/icons/blog.js";
import Components from "website/icons/components.js";
import Examples from "website/icons/examples.js";
import Guide from "website/icons/guide.js";
import tw from "website/utils/tw.js";
import useDelayedValue from "website/utils/use-delayed-value.js";
import {
  HeaderMenu,
  HeaderMenuGroup,
  HeaderMenuItem,
  HeaderMenuSeparator,
} from "./header-menu.js";

type Data = Array<
  PageContent & { keywords: string[]; score?: number; key?: string }
>;

type SearchData = Array<Data[number] & { nested?: boolean }>;

const style = {
  thumbnail: tw`
    w-7 h-7
    fill-blue-700 dark:fill-blue-500
  `,
};

const separator = <div className="font-semibold opacity-30">/</div>;

const thumbnails: Record<string, ReactNode> = {
  guide: <Guide className={style.thumbnail} />,
  components: <Components />,
  examples: <Examples />,
  blog: <Blog className={style.thumbnail} />,
};

const categoryTitles: Record<string, string> = {
  guide: "Guide",
  components: "Components",
  examples: "Examples",
  blog: "Blog",
  api: "API Reference",
};

const searchTitles: Record<string, string> = {
  guide: "Search guide",
  components: "Search components",
  examples: "Search examples",
  blog: "Search blog",
  api: "Search API",
};

function getSearchParentPageData(items: Data): SearchData[number] | null {
  const parentPage = items?.find((item) => !item.section);
  if (parentPage) return parentPage;
  if (items.length <= 1) return null;
  const { category, slug } = items[0]!;
  if (!category) return null;
  if (!slug) return null;
  const page = pageIndex[category]?.find((item) => item.slug === slug);
  if (!page) return null;
  return {
    ...page,
    id: null,
    section: null,
    parentSection: null,
    category,
    keywords: [],
  };
}

function parseSearchData(data: Data) {
  const dataBySlug = groupBy(data, "slug");
  const searchData: SearchData = [];
  const slugs = Object.keys(dataBySlug);
  slugs.forEach((slug) => {
    const items = dataBySlug[slug];
    if (!items) return;
    const parentPage = getSearchParentPageData(items);
    if (parentPage) {
      searchData.push(parentPage);
    }
    const itemsWithoutParentPage = items.filter((item) => item !== parentPage);
    searchData.push(
      ...itemsWithoutParentPage
        .slice(0, parentPage ? 3 : undefined)
        .map((item) => ({ ...item, nested: !!parentPage }))
    );
  });
  return searchData;
}

function getItemKey(item: PageIndexDetail | SearchData[number]) {
  const category = "category" in item && item.category ? item.category : "";
  const section = "section" in item && item.section ? item.section : "";
  return category + item.slug + section;
}

function getAllIndexes(string: string, values: string[]) {
  const indexes = [] as Array<[number, number]>;
  for (const value of values) {
    let pos = 0;
    const length = value.length;
    while (string.indexOf(value, pos) != -1) {
      const index = string.indexOf(value, pos);
      if (index !== -1) {
        indexes.push([index, length]);
      }
      pos = index + 1;
    }
  }
  return indexes;
}

function highlightValue(
  itemValue: string | null | undefined,
  userValues: string[]
) {
  if (!itemValue) return itemValue;
  userValues = userValues.filter(Boolean);
  const parts: JSX.Element[] = [];

  const wrap = (value: string, autocomplete = false) => (
    <span
      key={parts.length}
      data-autocomplete-value={autocomplete ? "" : undefined}
      data-user-value={autocomplete ? undefined : ""}
    >
      {value}
    </span>
  );

  const allIndexes = getAllIndexes(itemValue, userValues)
    .filter(
      ([index, length], i, arr) =>
        index !== -1 &&
        !arr.some(
          ([idx, l], j) => j !== i && idx <= index && idx + l >= index + length
        )
    )
    .sort(([a], [b]) => a - b);

  if (!allIndexes.length) {
    parts.push(wrap(itemValue, true));
    return parts;
  }

  const [firstIndex] = allIndexes[0]!;

  const values = [
    itemValue.slice(0, firstIndex),
    ...allIndexes
      .map(([index, length], i) => {
        const value = itemValue.slice(index, index + length);
        const nextIndex = allIndexes[i + 1]?.[0];
        const nextValue = itemValue.slice(index + length, nextIndex);
        return [value, nextValue];
      })
      .flat(),
  ];

  values.forEach((value, i) => {
    if (value) {
      parts.push(wrap(value, i % 2 === 0));
    }
  });
  return parts;
}

function queryFetch({ queryKey, signal }: QueryFunctionContext) {
  const [url] = queryKey as [string];
  return fetch(url, { signal }).then((response) => response.json());
}

function Shortcut() {
  const [platform, setPlatform] = useState<"mac" | "pc" | null>(null);
  useSafeLayoutEffect(() => {
    setPlatform(isApple() ? "mac" : "pc");
  }, []);
  if (!platform) return null;
  return (
    <span className="mx-1 flex gap-0.5 justify-self-end text-black/[62.5%] dark:text-white/70">
      {platform === "mac" ? (
        <abbr title="Command" className="no-underline">
          ⌘
        </abbr>
      ) : (
        <abbr title="Control" className="no-underline">
          Ctrl
        </abbr>
      )}
      <span className={cx(platform !== "mac" && "font-bold")}>K</span>
    </span>
  );
}

type HeaderNavItemProps = {
  item: PageIndexDetail | SearchData[number];
  category?: string;
  onClick?: () => void;
  autoFocus?: boolean;
};

const HeaderNavItem = memo(
  ({ item, category, onClick, ...props }: HeaderNavItemProps) => {
    category = category || ("category" in item ? item.category : undefined);
    if (!category) return null;
    const id = "id" in item ? item.id : null;
    const keywords = "keywords" in item ? item.keywords : null;
    const section = "section" in item ? item.section : null;
    const parentSection = "parentSection" in item ? item.parentSection : null;
    const nested = "nested" in item ? item.nested : false;
    const href = `/${category}/${item.slug}${id ? `#${id}` : ""}`;
    const description = keywords
      ? highlightValue(item.content, keywords)
      : item.content;
    const path = keywords
      ? [
          highlightValue(categoryTitles[category], keywords),
          highlightValue(item.group, keywords),
          section && highlightValue(item.title, keywords),
          highlightValue(parentSection, keywords),
          !nested && highlightValue(section, keywords),
        ]
      : undefined;
    return (
      <HeaderMenuItem
        title={nested ? section || item.title : item.title}
        description={description}
        value={href}
        href={href}
        path={path}
        nested={nested}
        thumbnail={thumbnails[category]}
        onClick={onClick}
        {...props}
      />
    );
  }
);

type HeaderNavMenuProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  category?: string;
  label?: ReactNode;
  contentLabel?: string;
  value?: string;
  footer?: boolean;
  shortcut?: boolean;
  children?: ReactNode;
  searchValue?: string;
  onBrowseAllPages?: (value: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
};

const HeaderNavMenuContext = createContext(false);

const HeaderNavMenu = memo(
  ({
    open: openProp,
    setOpen: setOpenProp,
    category,
    label,
    contentLabel,
    value,
    footer,
    shortcut,
    children,
    searchValue: searchValueProp,
    onBrowseAllPages,
    size = "lg",
    href,
  }: HeaderNavMenuProps) => {
    const isSubNav = useContext(HeaderNavMenuContext);
    const [_open, _setOpen] = useState(false);
    const open = openProp ?? _open;
    const setOpen = setOpenProp ?? _setOpen;
    const [searchValue, setSearchValue] = useState("");
    const hasSearchValue = !!searchValue;

    if (!open && searchValue) {
      setSearchValue("");
    }

    useSafeLayoutEffect(() => {
      if (searchValueProp) {
        setSearchValue(searchValueProp);
      }
    }, [searchValueProp]);

    const url = `/api/search?q=${searchValue}${
      category ? `&category=${category}` : ""
    }`;

    const options = {
      staleTime: process.env.NODE_ENV === "production" ? Infinity : 0,
      enabled: open && !!searchValue,
      keepPreviousData: open && !!searchValue,
    } satisfies UseQueryOptions<Data>;

    const { data, isFetching } = useQuery<Data>([url], queryFetch, options);

    const allUrl = `/api/search?q=${searchValue}`;
    const { data: allData, isFetching: allIsFetching } = useQuery<Data>(
      [allUrl],
      queryFetch,
      options
    );

    const loading = useDelayedValue(isFetching || allIsFetching);
    const searchData = useMemo(() => data && parseSearchData(data), [data]);
    const searchAllData = useMemo(
      () => (category && allData && parseSearchData(allData)) || undefined,
      [category, allData]
    );
    const noResults = !!searchData && !searchData.length;
    const pages = category ? pageIndex[category] : null;
    const categoryTitle = category ? categoryTitles[category] : null;
    const hasTitle = !!category && !searchData?.length && !noResults;

    const [items, groups] = useMemo(() => {
      if (searchData) {
        return [[], { [categoryTitle || "Search results"]: searchData }];
      }
      if (!pages) return [[], {}];
      const groups = groupBy(pages, "group");
      const items = groups.null || [];
      delete groups.null;
      return [items, groups];
    }, [searchData, pages]);

    const itemElements = useMemo(() => {
      if (noResults) return null;
      if (!items.length && !Object.keys(groups).length) return null;
      return (
        <>
          {items?.map((item) => (
            <HeaderNavItem
              key={getItemKey(item)}
              autoFocus={hasSearchValue ? false : undefined}
              category={category}
              item={item}
            />
          ))}
          {Object.entries(groups).map(([group, pages]) => (
            <HeaderMenuGroup key={group} label={group}>
              {pages.map((item) => (
                <HeaderNavItem
                  key={getItemKey(item)}
                  autoFocus={hasSearchValue ? false : undefined}
                  category={category}
                  item={item}
                />
              ))}
            </HeaderMenuGroup>
          ))}
        </>
      );
    }, [noResults, items, groups, category, hasSearchValue, categoryTitle]);

    const otherItemElements = useMemo(() => {
      if (!searchAllData?.length) return null;
      return searchAllData
        .filter((item) => item.category !== category)
        .map((item) => (
          <HeaderNavItem
            key={getItemKey(item)}
            autoFocus={hasSearchValue ? false : undefined}
            item={item}
          />
        ));
    }, [searchAllData, hasSearchValue, category]);

    return (
      <HeaderNavMenuContext.Provider value={true}>
        <HeaderMenu
          href={href}
          open={open}
          onToggle={setOpen}
          label={
            <>
              {label}
              {shortcut && <Shortcut />}
            </>
          }
          contentLabel={contentLabel}
          loading={loading}
          searchPlaceholder={
            category ? searchTitles[category] : "Search all pages"
          }
          searchValue={searchValue}
          onSearch={setSearchValue}
          itemValue={category}
          value={value}
          hasTitle={hasTitle}
          size={
            searchData?.length || !!searchAllData?.length || noResults
              ? "xl"
              : size
          }
          autoSelect={!!searchData?.length}
          footer={
            !isSubNav &&
            footer && (
              <PopoverDismiss
                className={cx(
                  "grid grid-cols-[theme(spacing.14)_auto_theme(spacing.14)]",
                  "h-10 w-full items-center rounded p-2",
                  "bg-gray-150 dark:bg-gray-650",
                  "hover:bg-blue-200/40 dark:hover:bg-blue-600/25",
                  "active:bg-blue-200/70 dark:active:bg-blue-800/25",
                  "focus-visible:ariakit-outline-input"
                )}
                onClick={() => {
                  requestAnimationFrame(() => {
                    onBrowseAllPages?.(searchValue);
                  });
                }}
              >
                <PopoverDisclosureArrow placement="left" />
                <span className="text-center">
                  {searchValue ? "Search" : "Browse"} all pages
                </span>
                <Shortcut />
              </PopoverDismiss>
            )
          }
        >
          {hasTitle && (
            <div
              role="presentation"
              className="sticky top-14 z-20 bg-[color:inherit]"
            >
              <HeaderMenuItem
                value={category}
                href={`/${category}`}
                className="scroll-mt-0 justify-center font-medium"
              >
                {categoryTitle}
              </HeaderMenuItem>
              <HeaderMenuSeparator />
            </div>
          )}
          {itemElements || (!noResults && children)}
          {noResults && (
            <div
              role="presentation"
              className={cx(
                "p-10 text-center text-lg text-black/60 dark:text-white/50",
                !otherItemElements && "py-20"
              )}
            >
              <div className="truncate">
                No results for &quot;
                <span className="text-black dark:text-white">
                  {searchValue}
                </span>
                &quot;
              </div>
              {!!category && (
                <div>
                  in{" "}
                  <span className="text-black dark:text-white">{category}</span>
                </div>
              )}
            </div>
          )}
          {!!otherItemElements?.length && (
            <>
              <HeaderMenuSeparator />
              <HeaderMenuGroup label="Other results">
                {otherItemElements}
              </HeaderMenuGroup>
            </>
          )}
        </HeaderMenu>
      </HeaderNavMenuContext.Provider>
    );
  }
);

export default function HeaderNav() {
  const pathname = usePathname() || "/";
  const [, category, page] = pathname.split("/");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [categorySearchValue, setCategorySearchValue] = useState<string>();

  useEffect(() => {
    if (categorySearchValue) {
      setCategorySearchValue(undefined);
    }
  }, [categorySearchValue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        const value = category
          ? document.querySelector<HTMLInputElement>(
              `[role=combobox][placeholder='${searchTitles[category]}']`
            )?.value
          : "";
        flushSync(() => {
          setCategoryOpen(false);
          setPageOpen(false);
        });
        if (categoryOpen) {
          setPageOpen(true);
        } else if (pageOpen) {
          setCategorySearchValue(value);
          setCategoryOpen(true);
        } else if (page) {
          setPageOpen(true);
        } else {
          setCategoryOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [categoryOpen, pageOpen, category, page]);

  const categoryMeta = pageIndex[category as keyof typeof pageIndex];

  const categoryTitle = category ? categoryTitles[category] : "Browse";
  const pageMeta =
    page && categoryMeta
      ? categoryMeta.find(({ slug }) => slug === page)
      : null;

  const categoryElements = useMemo(
    () =>
      Object.keys(pageIndex).map((key) => {
        const pages = pageIndex[key as keyof typeof pageIndex];
        if (!pages) return null;
        return (
          <HeaderNavMenu
            key={key}
            href={`/${key}`}
            category={key}
            label={categoryTitles[key]}
          />
        );
      }),
    []
  );

  const children = useMemo(
    () => (
      <>
        {categoryElements}
        <HeaderMenuSeparator />
        <HeaderMenuItem href="https://github.com/ariakit/ariakit">
          GitHub
        </HeaderMenuItem>
        <HeaderMenuItem href="https://github.com/ariakit/ariakit/discussions">
          Discussions
        </HeaderMenuItem>
        <HeaderMenuItem href="https://newsletter.ariakit.org">
          Newsletter
        </HeaderMenuItem>
      </>
    ),
    [categoryElements]
  );

  const element = !!pageMeta && !!category;

  const onBrowseAllPages = useEvent((value: string) => {
    setCategorySearchValue(value);
    setCategoryOpen(true);
  });

  return (
    <>
      {separator}
      <HeaderNavMenu
        key={element ? "category" : "page"}
        open={categoryOpen}
        setOpen={setCategoryOpen}
        shortcut={!element}
        label={categoryTitle}
        contentLabel="Pages"
        searchValue={categorySearchValue}
        value={category || undefined}
        size="sm"
      >
        {children}
      </HeaderNavMenu>
      {element && separator}
      {element && (
        <HeaderNavMenu
          key="page"
          open={pageOpen}
          setOpen={setPageOpen}
          category={category}
          footer
          shortcut
          onBrowseAllPages={onBrowseAllPages}
          label={pageMeta.title}
          contentLabel={categoryTitle}
          value={`/${category}/${page}`}
        />
      )}
    </>
  );
}
