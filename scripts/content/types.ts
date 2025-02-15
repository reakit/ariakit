export interface Page {
  /**
   * The slug of the category to be used in the URL.
   */
  slug: string;
  /**
   * The title of the category.
   */
  title: string;
  /**
   * Where the source files for the page are located.
   */
  sourceContext: string | string[];
  /**
   * Whether the page is a reference page.
   */
  reference?: boolean;
  /**
   * The regex to match the source files for the page.
   */
  pageFileRegex?: RegExp;
  /**
   * A function that returns the group name for the page or null if the page
   * should not be grouped.
   */
  getGroup?: (filename: string | Reference) => string | null;
}

export interface PageVideo {
  type: "video";
  gif?: boolean;
  playbackrate?: number;
  src: string;
  poster?: string;
}

export interface PageImage {
  type: "image";
  src: string;
  alt: string;
}

export interface PageIndexDetail {
  /**
   * The category that the page belongs to (e.g., "components", "examples").
   */
  category: string;
  /**
   * The name of the group that the page belongs to. This string is returned by
   * the getGroup function.
   */
  group: string | null;
  /**
   * The slug of the page to be used in the URL.
   */
  slug: string;
  /**
   * The title of the page.
   */
  title: string;
  /**
   * The content of the page or section.
   */
  content: string;
  /**
   * Whether the page is unlisted.
   */
  unlisted: boolean;
  /**
   * Page tags.
   * @default []
   */
  tags: string[];
  /**
   * Page media.
   * @default []
   */
  media: Array<PageVideo | PageImage>;
}

export interface PageContent extends PageIndexDetail {
  /**
   * If the content is a section of another page, this is the id of the section
   * heading that can be used to link to the section.
   */
  sectionId: string | null;
  /**
   * The parent section title if any.
   */
  parentSection: string | null;
  /**
   * The section title if any.
   */
  section: string | null;
}

export type TableOfContents = Array<{
  /**
   * The id of the section heading that can be used to link to the section.
   */
  id: string;
  /**
   * The href link to the section.
   */
  href: string;
  /**
   * The title of the section.
   */
  text: string;
  /**
   * The nested sections if any.
   */
  children?: TableOfContents;
}>;

export type Pages = Page[];

export type PageIndex = Record<string, PageIndexDetail[]>;

export type PageContents = PageContent[];

export interface ReferenceExample {
  /**
   * The code to be displayed in the example.
   */
  code: string;
  /**
   * The language of the code.
   * @default "jsx"
   */
  language: string;
  /**
   * The description of the example.
   */
  description: string;
}

export interface ReferenceProp {
  /**
   * The name of the prop.
   */
  name: string;
  /**
   * The type of the prop.
   */
  type: string;
  /**
   * The description of the prop.
   */
  description: string;
  /**
   * Whether the prop is optional.
   */
  optional: boolean;
  /**
   * The default value of the prop.
   */
  defaultValue: string | null;
  /**
   * Whether the prop is deprecated. May be a string with the deprecation
   * message.
   */
  deprecated: boolean | string;
  /**
   * The examples of the prop.
   */
  examples: ReferenceExample[];
}

export interface Reference {
  /**
   * The filename of the component.
   */
  filename: string;
  /**
   * The name of the component.
   */
  name: string;
  /**
   * The description of the component.
   */
  description: string;
  /**
   * Whether the component is deprecated. May be a string with the deprecation
   * message.
   */
  deprecated?: boolean | string;
  /**
   * The examples of the component.
   */
  examples: ReferenceExample[];
  /**
   * The props of the component.
   */
  props: ReferenceProp[];
  /**
   * The props returned by the component.
   */
  returnProps?: ReferenceProp[];
}
