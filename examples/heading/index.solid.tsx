// @ts-nocheck
import { Heading, HeadingLevel } from "@ariakit/solid";
import "./style.css";

export default function Example() {
  return (
    <div class="wrapper">
      <HeadingLevel>
        <Heading class="heading">Heading 1</Heading>
        <p>Torquent penatibus ipsum nascetur cursus primis lobortis</p>
        <HeadingLevel>
          <Heading class="heading">Heading 2</Heading>
          <p>Volutpat metus id purus dignissim fusce Tellus egestas.</p>
        </HeadingLevel>
        <HeadingLevel>
          <Heading class="heading">Heading 2</Heading>
          <p>Platea justo lectus. Praesent. Et sodales pellentesque</p>
        </HeadingLevel>
      </HeadingLevel>
    </div>
  );
}
