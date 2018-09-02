import { css } from "reakit";
import { prop, palette as p, theme as t, ifProp } from "styled-tools";

export const values = {
  borderWidth: "1px",
  borderRadius: "0.25em",
  rowHeight: "2.5em"
};

export const palette = {
  white: "#ffffff",
  whiteText: p("black"),

  black: "#212121",
  blackText: p("white"),

  primary: ["#1976d2", "#2196f3", "#71bcf7", "#c2e2fb"],
  primaryText: [p("white"), p("white"), p("white"), p("black")],

  secondary: ["#c2185b", "#e91e63", "#f06292", "#f8bbd0"],
  secondaryText: [p("white"), p("white"), p("white"), p("black")],

  danger: ["#d32f2f", "#f44336", "#f8877f", "#ffcdd2"],
  dangerText: [p("white"), p("white"), p("white"), p("black")],

  alert: ["#ffa000", "#ffc107", "#ffd761", "#ffecb3"],
  alertText: [p("white"), p("black"), p("black"), p("black")],

  success: ["#388e3c", "#4caf50", "#7cc47f", "#c8e6c9"],
  successText: [p("white"), p("white"), p("white"), p("black")],

  grayscale: [
    p("black"),
    "#414141",
    "#616161",
    "#9e9e9e",
    "#bdbdbd",
    "#e0e0e0",
    "#eeeeee",
    p("white")
  ],
  grayscaleText: [
    p("white"),
    p("white"),
    p("white"),
    p("black"),
    p("black"),
    p("black"),
    p("black"),
    p("black")
  ],

  background: [
    p("grayscale", -4),
    p("grayscale", -3),
    p("grayscale", -2),
    p("grayscale", -1)
  ],
  text: p("grayscale"),

  shadow: [
    "rgba(0, 0, 0, 0.9)",
    "rgba(0, 0, 0, 0.7)",
    "rgba(0, 0, 0, 0.5)",
    "rgba(0, 0, 0, 0.3)",
    "rgba(0, 0, 0, 0.15)",
    "rgba(0, 0, 0, 0.075)"
  ],
  shadowText: [
    p("white"),
    p("white"),
    p("white"),
    p("black"),
    p("black"),
    p("black")
  ],

  transparent: [p("shadow", -2), "transparent", p("shadow", -1)],
  transparentText: p("black"),

  border: [p("grayscale", -4), p("grayscale", -3)]
};

export const Avatar = css`
  border-radius: 50%;
  width: 1.5em;
  height: 1.5em;
  overflow: hidden;
  object-fit: cover;
`;

export const Backdrop = css`
  background-color: ${p("shadow", 2)};
`;

export const Blockquote = css`
  border-left: 5px solid ${p("grayscale", -3)};
  padding: 0.5em 0 0.5em 1em;
  font-style: italic;
`;

export const Button = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-width: ${t("rowHeight")};
  height: ${t("rowHeight")};
  padding: 0 0.68em;
  position: relative;
  flex: none;
  appearance: none;
  user-select: none;
  white-space: nowrap;
  text-decoration: none;
  &[disabled] {
    pointer-events: none;
  }
`;

export const Card = css`
  background-color: ${p("background", -1)};
  color: ${p("text", -1)};
`;

export const Code = css`
  background-color: ${p("background", -2)};
  color: ${p("text", -2)};
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: ${ifProp("block", "0", "0.25em 0.35em")};

  code {
    display: block;
    padding: 1em;
  }
`;

export const Field = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  label {
    padding-bottom: 0.5em;
  }
  > *:not(label):not(:last-child) {
    margin-bottom: 0.5em;
  }
`;

export const GroupItem = css`
  border: ${t("borderWidth")} solid ${p("border")};
  border-radius: ${t("borderRadius")};
`;

export const Heading = css`
  font-weight: bold;
  margin: 1em 0 0.5em;
  &:first-child {
    margin-top: 0;
  }
  h1& {
    font-size: 2.5em;
  }
  h2& {
    font-size: 2em;
  }
  h3& {
    font-size: 1.75em;
  }
  h4& {
    font-size: 1.5em;
  }
  h5& {
    font-size: 1.25em;
  }
  h6& {
    font-size: 1em;
  }
`;

export const Image = css`
  display: block;
  max-width: 100%;
`;

export const Input = css`
  display: block;
  width: 100%;
  padding: 0 0.5em;
  height: ${t("rowHeight")};

  &[type="checkbox"],
  &[type="radio"] {
    display: inline-block;
    width: auto;
    height: auto;
    padding: 0;
  }

  &::placeholder {
    color: currentcolor;
    opacity: 0.5;
  }

  textarea & {
    padding: 0.5em;
    height: auto;
  }
`;

export const Link = css`
  display: inline-grid;
  grid-gap: 0.25em;
  align-items: center;
  grid-auto-flow: column;
  text-decoration: none;
  color: ${p("primary", 1)};

  &:hover {
    text-decoration: underline;
  }
`;

export const List = css`
  list-style: none;

  li {
    margin-bottom: 0.35em;
  }
`;

export const Overlay = css`
  padding: 1em;
  border-radius: ${t("borderRadius")};
  box-shadow: 0 0 0 1px ${p("shadow", -2)}, 0 4px 8px ${p("shadow", -2)},
    0 16px 48px ${p("shadow", -2)};
  background-color: ${p("background", -1)};
`;

export const Paragraph = css`
  &:not(:last-child) {
    margin-bottom: 1rem;
  }
`;

export const Popover = css`
  padding: 1em;
  border-radius: ${t("borderRadius")};
  box-shadow: 0 0 0 1px ${p("shadow", -2)}, 0 2px 4px ${p("shadow", -1)},
    0 8px 24px ${p("shadow", -1)};

  &[aria-hidden="false"] {
    transition-timing-function: ${prop(
      "timing",
      "cubic-bezier(0.25, 0.1, 0.25, 1.5)"
    )};
  }
`;

export const PopoverArrow = css`
  & .stroke {
    fill: ${p("shadow", -3)};
  }
`;

export const Sidebar = css`
  border-radius: 0;
`;

export const Table = css`
  border: ${t("borderWidth")} solid ${p("border")};
  table-layout: fixed;
  border-collapse: collapse;
  background-color: ${p("background", -1)};
  line-height: 200%;

  tbody,
  td,
  th,
  tfoot,
  thead,
  tr {
    border: inherit;
  }

  caption {
    text-transform: uppercase;
    font-size: 0.9em;
    color: ${p("grayscale", 3)};
  }

  td,
  th {
    padding: 0 8px;
    vertical-align: middle;
  }

  th {
    font-weight: bold;
    background-color: ${p("shadow", -1)};
  }
`;

export const Tabs = css`
  display: flex;
  align-items: center;
  list-style: none;
`;

export const TabsTab = css`
  display: inline-flex;
  position: relative;
  flex: 1;
  user-select: none;
  outline: none;
  align-items: center;
  white-space: nowrap;
  justify-content: center;
  text-decoration: none;
  height: ${t("rowHeight")};
  padding: 0 0.5em;
  min-width: ${t("rowHeight")};
  &.active {
    font-weight: bold;
  }
  &[disabled] {
    pointer-events: none;
  }
`;

export const Tooltip = css`
  text-transform: none;
  pointer-events: none;
  white-space: nowrap;
  font-size: 0.875em;
  text-align: center;
  background-color: ${p("grayscale")};
  color: ${p("grayscaleText")};
  box-shadow: none;
  border-radius: ${t("borderRadius")};
  padding: 0.75em 1em;
`;

export const TooltipArrow = css`
  & .stroke {
    fill: none;
  }
  & .fill {
    fill: ${p("grayscale")};
  }
`;

export default {
  ...values,
  palette,
  Avatar,
  Backdrop,
  Blockquote,
  Button,
  Card,
  Code,
  Field,
  GroupItem,
  Heading,
  Image,
  Input,
  Link,
  List,
  Overlay,
  Paragraph,
  Popover,
  PopoverArrow,
  Sidebar,
  Table,
  Tabs,
  TabsTab,
  Tooltip,
  TooltipArrow
};
