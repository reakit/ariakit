// @ts-nocheck
import { As, Command } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  return (
    <div>
      <p>Notice that you cannot trigger the alert with the space key.</p>
      <Command
        class="button"
        clickOnSpace={false}
        onClick={() => alert("Accessible button clicked")}
        render={<As.div />}
      >
        Accessible button
      </Command>
    </div>
  );
}
