// @ts-nocheck
import { Checkbox, useCheckboxStore } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  const checkbox = useCheckboxStore();
  return (
    <div>
      <label class="label">
        <Checkbox store={checkbox} value="accept" class="checkbox" /> I have
        read and agree to the terms and conditions
      </label>
    </div>
  );
}
