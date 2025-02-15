// @ts-nocheck
import { Checkbox } from "@ariakit/solid";
import "./style.css";
import { createSignal } from "solid-js";

export default function Example() {
  const [checked, setChecked] = createSignal(true);
  return (
    <label class="label">
      <Checkbox
        class="checkbox"
        checked={checked()}
        onChange={(event) => setChecked(event.target.checked)}
      />
      I have read and agree to the terms and conditions
    </label>
  );
}
