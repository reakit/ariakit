// @ts-nocheck
import { Checkbox, useCheckboxStore } from "@ariakit/solid";
import "./style.css";
import { createSignal } from "solid-js";

export default function Example() {
  const [allChecked, setAllChecked] = createSignal(true);
  const checkbox1 = useCheckboxStore({
    get value() {
      return allChecked();
    },
    setValue: setAllChecked,
  });
  const checkbox2 = useCheckboxStore({
    get store() {
      return allChecked() ? checkbox1() : undefined;
    },
  });
  return (
    <div>
      <label class="label">
        <Checkbox store={checkbox1} class="checkbox" />
        Checkbox 1
      </label>
      <label class="label">
        <Checkbox store={checkbox2} class="checkbox" />
        Checkbox 2
      </label>
    </div>
  );
}
