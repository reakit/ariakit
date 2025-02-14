// @ts-nocheck
import { As, Focusable, Role } from "@ariakit/solid";
import type { FocusableProps } from "@ariakit/solid";
import "./style.css";

interface TextareaProps extends FocusableProps<"textarea"> {}

function Textarea(props: TextareaProps) {
  return (
    <Role.textarea
      {...props}
      ref={props.ref}
      render={
        <As component={Focusable} render={props.render || <As.textarea />} />
      }
    />
  );
}

export default function Example() {
  return (
    <label className="label">
      Comment
      <Textarea class="textarea" placeholder="Write your comment, be kind" />
    </label>
  );
}
