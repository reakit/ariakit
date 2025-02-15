// @ts-nocheck
import { As, Checkbox, useCheckboxStore, useStoreState } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  const checkbox = useCheckboxStore();
  const label = useStoreState(checkbox, (state) =>
    state.value ? "Checked" : "Unchecked",
  );
  return (
    <Checkbox store={checkbox} class="button" render={<As.button />}>
      {label}
    </Checkbox>
  );
}
