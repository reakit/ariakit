import * as React from "react";
import { render } from "reakit-test-utils";
import { Radio } from "../Radio";

const props: Parameters<typeof Radio>[0] = {
  value: "radio",
  stopId: "radio",
  stops: [],
  currentId: null,
  register: jest.fn(),
  unregister: jest.fn(),
  move: jest.fn(),
  next: jest.fn(),
  previous: jest.fn(),
  first: jest.fn(),
  last: jest.fn()
};

test("render", () => {
  const { baseElement } = render(<Radio {...props} />);
  expect(baseElement).toMatchInlineSnapshot(`
    <body>
      <div>
        <input
          aria-checked="false"
          data-tabbable="true"
          id="radio"
          role="radio"
          tabindex="-1"
          type="radio"
          value="radio"
        />
      </div>
    </body>
  `);
});
