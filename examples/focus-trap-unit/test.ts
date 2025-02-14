import { click, focus, press, q } from "@ariakit/test";

test("traps focus", async () => {
  const qq = q.within(q.group("trap"));

  await focus(qq.text("Start"));
  await press.Tab();
  expect(qq.text("Before")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trap")).toHaveFocus();
  await press.Tab();
  expect(qq.text("After")).toHaveFocus();
});

test("redirects focus", async () => {
  const qq = q.within(q.group("redirect"));

  await focus(qq.text("Start"));
  await press.Tab();
  expect(qq.text("Before")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Focus target")).toHaveFocus();
  await press.ShiftTab();
  expect(qq.text("Skip")).toHaveFocus();
  await press.ShiftTab();
  expect(qq.text("Focus target")).toHaveFocus();
});

test("traps focus in region", async () => {
  const qq = q.within(q.group("region"));

  await focus(qq.text("Start"));
  await press.Tab();
  expect(qq.text("Toggle region")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Before")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 1")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 3")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 4")).toHaveFocus();
  await press.Tab();
  expect(qq.text("After")).toHaveFocus();

  await click(qq.text("Toggle region"));
  await press.Tab();
  expect(qq.text("Before")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 1")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 3")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 4")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 1")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 3")).toHaveFocus();
  await press.ShiftTab();
  expect(qq.text("Trapped 1")).toHaveFocus();
  await press.ShiftTab();
  expect(qq.text("Trapped 4")).toHaveFocus();
  await press.ShiftTab();
  expect(qq.text("Trapped 3")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 4")).toHaveFocus();
  await press.Tab();
  expect(qq.text("Trapped 1")).toHaveFocus();
});
