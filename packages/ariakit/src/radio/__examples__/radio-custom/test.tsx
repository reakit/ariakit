import {
  click,
  getAllByRole,
  getByLabelText,
  getByRole,
  press,
  render,
} from "ariakit-test";
import { axe } from "jest-axe";
import Example from ".";

test("a11y", async () => {
  render(<Example />);
  const radioElements = getAllByRole("radio");
  const radio = radioElements[0] as string | Element;
  expect(await axe(getByRole("radiogroup"))).toHaveNoViolations();
  expect(await axe(radio)).toHaveNoViolations();
});

test("check radio button on click", async () => {
  render(<Example />);
  expect(getByLabelText("apple")).toHaveAttribute("aria-checked", "false");
  expect(getByLabelText("orange")).toHaveAttribute("aria-checked", "false");
  expect(getByLabelText("watermelon")).toHaveAttribute("aria-checked", "false");
  await click(getByLabelText("apple"));
  expect(getByLabelText("apple")).toHaveAttribute("aria-checked", "true");
  expect(getByLabelText("orange")).toHaveAttribute("aria-checked", "false");
  expect(getByLabelText("watermelon")).toHaveAttribute("aria-checked", "false");
  await click(getByLabelText("watermelon"));
  expect(getByLabelText("apple")).toHaveAttribute("aria-checked", "false");
  expect(getByLabelText("watermelon")).toHaveAttribute("aria-checked", "true");
});

test("tab", async () => {
  render(<Example />);
  expect(getByLabelText("apple")).not.toHaveFocus();
  expect(getByLabelText("orange")).not.toHaveFocus();
  expect(getByLabelText("watermelon")).not.toHaveFocus();

  await press.Tab();
  expect(getByLabelText("apple")).toHaveFocus();
  expect(getByLabelText("apple")).not.toBeChecked();
  expect(getByLabelText("orange")).not.toHaveFocus();
  expect(getByLabelText("watermelon")).not.toHaveFocus();
});

test("space", async () => {
  render(<Example />);
  await press.Tab();
  expect(getByLabelText("apple")).toHaveFocus();
  expect(getByLabelText("apple")).not.toBeChecked();
  await press.Space();
  expect(getByLabelText("apple")).toHaveFocus();
  expect(getByLabelText("apple")).toBeChecked();
});

test("arrow right", async () => {
  render(<Example />);
  await press.Tab();
  await press.ArrowRight();
  expect(getByLabelText("orange")).toHaveFocus();
  expect(getByLabelText("orange")).toBeChecked();
  await press.ArrowRight();
  expect(getByLabelText("orange")).not.toBeChecked();
  expect(getByLabelText("watermelon")).toBeChecked();
  expect(getByLabelText("watermelon")).toHaveFocus();
});

test("arrow down", async () => {
  render(<Example />);
  await press.Tab();
  await press.ArrowDown();
  expect(getByLabelText("orange")).toHaveFocus();
  expect(getByLabelText("orange")).toBeChecked();
  await press.ArrowDown();
  expect(getByLabelText("orange")).not.toBeChecked();
  expect(getByLabelText("watermelon")).toBeChecked();
  expect(getByLabelText("watermelon")).toHaveFocus();
});

test("arrow left", async () => {
  render(<Example />);
  await press.Tab();
  await press.ArrowLeft();
  expect(getByLabelText("watermelon")).toHaveFocus();
  expect(getByLabelText("watermelon")).toBeChecked();
  await press.ArrowLeft();
  expect(getByLabelText("watermelon")).not.toBeChecked();
  expect(getByLabelText("orange")).toBeChecked();
  expect(getByLabelText("orange")).toHaveFocus();
});

test("arrow up", async () => {
  render(<Example />);
  await press.Tab();
  await press.ArrowUp();
  expect(getByLabelText("watermelon")).toHaveFocus();
  expect(getByLabelText("watermelon")).toBeChecked();
  await press.ArrowUp();
  expect(getByLabelText("watermelon")).not.toBeChecked();
  expect(getByLabelText("orange")).toBeChecked();
  expect(getByLabelText("orange")).toHaveFocus();
});
