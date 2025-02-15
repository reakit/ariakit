// @ts-nocheck
import { Checkbox, CheckboxProvider, Group, GroupLabel } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  return (
    <CheckboxProvider defaultValue={[]}>
      <Group class="wrapper">
        <GroupLabel>Your favorite fruits</GroupLabel>
        <label class="label">
          <Checkbox value="apple" class="checkbox" /> Apple
        </label>
        <label class="label">
          <Checkbox value="orange" class="checkbox" /> Orange
        </label>
        <label class="label">
          <Checkbox value="mango" class="checkbox" /> Mango
        </label>
      </Group>
    </CheckboxProvider>
  );
}
