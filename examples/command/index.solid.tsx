// @ts-nocheck
import { As, Command } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  return (
    <Command
      role="button"
      class="button"
      onClick={() => alert("Accessible button clicked")}
      render={<As.div />}
    >
      Button
    </Command>
  );
}
