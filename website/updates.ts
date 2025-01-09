export interface UpdateItem {
  title: string;
  type: "page" | "release" | "newsletter";
  href: string;
  dateTime: string;
}

const updates: UpdateItem[] = [
  {
    title: "Improved example: Dialog with React Router",
    type: "page",
    href: "/examples/dialog-react-router",
    dateTime: "2024-11-30T23:24Z",
  },
  {
    title: "New example: Select with Combobox and Tabs",
    type: "page",
    href: "/examples/select-combobox-tab",
    dateTime: "2024-04-26T14:53Z",
  },
  {
    title: "Improved example: Combobox with Tabs",
    type: "page",
    href: "/examples/combobox-tabs",
    dateTime: "2024-03-04T22:34Z",
  },
  {
    title: "New example: Animated Disclosure",
    type: "page",
    href: "/examples/disclosure-animated",
    dateTime: "2024-02-23T12:36Z",
  },
  {
    title: "New example: Animated TabPanel",
    type: "page",
    href: "/examples/tab-panel-animated",
    dateTime: "2024-02-19T13:39Z",
  },
  {
    title: "Improved example: Animated Select",
    type: "page",
    href: "/examples/select-animated",
    dateTime: "2024-02-15T04:20Z",
  },
  {
    title: "Improved example: Animated Dialog",
    type: "page",
    href: "/examples/dialog-animated",
    dateTime: "2024-02-14T22:34Z",
  },
  {
    title: "Improved example: Animated Combobox",
    type: "page",
    href: "/examples/combobox-animated",
    dateTime: "2024-02-13T21:18Z",
  },
  {
    title: "New example: Select with Next.js App Router",
    type: "page",
    href: "/examples/select-next-router",
    dateTime: "2024-02-07T14:06Z",
  },
  {
    title: "New example: Command Menu",
    type: "page",
    href: "/examples/dialog-combobox-command-menu",
    dateTime: "2024-01-26T12:38Z",
  },
  {
    title: "Improved docs: Combobox",
    type: "page",
    href: "/reference#combobox",
    dateTime: "2024-01-06T21:25Z",
  },
  {
    title: "Improved docs: Styling",
    type: "page",
    href: "/guide/styling#data-user-value",
    dateTime: "2024-01-03T20:40Z",
  },
  {
    title: "New example: Radix Select with Combobox",
    type: "page",
    href: "/examples/combobox-radix-select",
    dateTime: "2023-12-27T13:18Z",
  },
  {
    title: "New example: Combobox with Tabs",
    type: "page",
    href: "/examples/combobox-tabs",
    dateTime: "2023-12-23T17:34Z",
  },
  {
    title: "Improved docs: Composition",
    type: "page",
    href: "/guide/composition#merging-the-rendered-element-props",
    dateTime: "2023-12-19T21:12Z",
  },
  {
    title: "New example: Submenu with Combobox",
    type: "page",
    href: "/examples/menu-nested-combobox",
    dateTime: "2023-12-15T12:40Z",
  },
  {
    title: "New example: Radix Combobox",
    type: "page",
    href: "/examples/combobox-radix",
    dateTime: "2023-12-04T10:32Z",
  },
  {
    title: "Improved example: Multi-selectable Combobox",
    type: "page",
    href: "/examples/combobox-multiple",
    dateTime: "2023-12-02T23:14Z",
  },
  {
    title: "New example: Navigation Menubar",
    type: "page",
    href: "/examples/menubar-navigation",
    dateTime: "2023-11-28T12:00Z",
  },
  {
    title: "New example: Combobox with integrated filter",
    type: "page",
    href: "/examples/combobox-filtering-integrated",
    dateTime: "2023-11-25T16:10Z",
  },
  {
    title: "New component: Menubar",
    type: "page",
    href: "/components/menubar",
    dateTime: "2023-11-21T09:32Z",
  },
  {
    title: "Improved docs: Nested Dialog",
    type: "page",
    href: "/examples/dialog-nested",
    dateTime: "2023-10-09T18:51Z",
  },
  {
    title: "Improved example: Dialog with Menu",
    type: "page",
    href: "/examples/dialog-menu",
    dateTime: "2023-10-08T22:15Z",
  },
  {
    title: "Improved example: Toolbar with Select",
    type: "page",
    href: "/examples/toolbar-select",
    dateTime: "2023-10-03T11:34Z",
  },
  {
    title: "Improved example: Tab with Next.js App Router",
    type: "page",
    href: "/examples/tab-next-router",
    dateTime: "2023-10-02T17:49Z",
  },
  {
    title: "Improved example: Tab with React Router",
    type: "page",
    href: "/examples/tab-react-router",
    dateTime: "2023-10-02T17:48Z",
  },
  {
    title: "New example: Warning on Dialog hide",
    type: "page",
    href: "/examples/dialog-hide-warning",
    dateTime: "2023-09-30T11:12Z",
  },
  {
    title: "Improved docs: Animated Select",
    type: "page",
    href: "/examples/select-animated",
    dateTime: "2023-09-19T16:00Z",
  },
  {
    title: "Improved docs: Submenu",
    type: "page",
    href: "/examples/menu-nested",
    dateTime: "2023-09-14T17:11Z",
  },
  {
    title: "Improved example: ComboboxGroup",
    type: "page",
    href: "/examples/combobox-group",
    dateTime: "2023-09-11T02:58Z",
  },
  {
    title: "New guide: Component providers",
    type: "page",
    href: "/guide/component-providers",
    dateTime: "2023-09-10T21:07Z",
  },
  {
    title: "Improved docs: Command",
    type: "page",
    href: "/reference/command",
    dateTime: "2023-08-20T17:17Z",
  },
  {
    title: "Improved docs: Focusable",
    type: "page",
    href: "/reference/focusable",
    dateTime: "2023-08-12T02:27Z",
  },
  {
    title: "Improved docs: Multi-selectable Combobox",
    type: "page",
    href: "/examples/combobox-multiple",
    dateTime: "2023-08-09T23:27Z",
  },
  {
    title: "New guide: Coding guidelines",
    type: "page",
    href: "/guide/coding-guidelines",
    dateTime: "2023-08-07T11:46Z",
  },
  {
    title: "New example: Combobox filtering",
    type: "page",
    href: "/examples/combobox-filtering",
    dateTime: "2023-08-06T11:45Z",
  },
  {
    title: "Improved docs: Combobox with links",
    type: "page",
    href: "/examples/combobox-links",
    dateTime: "2023-08-05T10:40Z",
  },
  {
    title: "New example: Menu with Tooltip",
    type: "page",
    href: "/examples/menu-tooltip",
    dateTime: "2023-08-04T12:33Z",
  },
  {
    title: "Improved docs: ComboboxGroup",
    type: "page",
    href: "/examples/combobox-group",
    dateTime: "2023-07-30T02:09Z",
  },
  {
    title: "Improved docs: ComboboxDisclosure",
    type: "page",
    href: "/examples/combobox-disclosure",
    dateTime: "2023-07-28T19:24Z",
  },
  {
    title: "Improved docs: ComboboxCancel",
    type: "page",
    href: "/examples/combobox-cancel",
    dateTime: "2023-07-28T18:57Z",
  },
  {
    title: "Improved docs: Animated Combobox",
    type: "page",
    href: "/examples/combobox-animated",
    dateTime: "2023-07-27T18:40Z",
  },
  {
    title: "Improved docs: Getting started",
    type: "page",
    href: "/guide/getting-started",
    dateTime: "2023-07-25T20:16Z",
  },
  {
    title: "Improved docs: Checkbox",
    type: "page",
    href: "/components/checkbox",
    dateTime: "2023-07-20T12:00Z",
  },
  {
    title: "Improved docs: Button",
    type: "page",
    href: "/components/button",
    dateTime: "2023-07-19T13:10Z",
  },
  {
    title: "New page: API Reference",
    type: "page",
    href: "/reference",
    dateTime: "2023-07-05T11:00Z",
  },
  {
    title: "New example: Dialog with scrollable backdrop",
    type: "page",
    href: "/examples/dialog-backdrop-scrollable",
    dateTime: "2023-06-07T11:00Z",
  },
  {
    title: "New example: Radix Dialog",
    type: "page",
    href: "/examples/dialog-radix",
    dateTime: "2023-06-04T11:00Z",
  },
];

export default updates;
