// @ts-nocheck
import { As, Button } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  return (
    <Button class="button" render={<As.div />}>
      Button
    </Button>
  );
}
