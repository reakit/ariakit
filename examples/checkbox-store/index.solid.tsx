// @ts-nocheck
import { Checkbox, useCheckboxStore } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  const checked = useCheckboxStore({ defaultValue: true });
  return (
    <label class="label">
      <Checkbox class="checkbox" store={checked} /> I have read and agree to the
      terms and conditions
    </label>
  );
}
