import { Role } from "@ariakit/react";
import { type CSSProperties, useState } from "react";

export default function Fixture() {
  const [values2, setValues2] = useState<Array<string>>([]);
  function addValue2(value: string) {
    setValues2((values) => [...values, value]);
  }
  const [values3, setValues3] = useState<Array<string>>([]);
  function addValue3(value: string) {
    setValues3((values) => [...values, value]);
  }
  return (
    <div role="group" aria-label="render">
      <Role>1</Role>
      <Role render={<p />}>2</Role>
      <Role data-outer render={<span data-inner />}>
        3
      </Role>
      <Role
        aria-label="merged2"
        data-outer
        data-both="outer"
        className="outer"
        style={{ "--outer": "value" } as CSSProperties}
        onClick={() => addValue2("outer")}
        render={
          <button
            data-inner
            data-both="inner"
            className="inner"
            style={{ "--inner": "value" } as CSSProperties}
            onClick={() => addValue2("inner")}
          >
            4 (inner)
          </button>
        }
      >
        4 (outer)
      </Role>
      <button aria-label="values2">{values2.join(", ")}</button>
      <Role
        aria-label="merged3"
        data-outer
        data-both="top"
        className="top"
        style={{ "--top": "value" } as CSSProperties}
        onClick={() => addValue3("top")}
        render={
          <Role.button
            data-middle
            data-both="middle"
            className="middle"
            style={{ "--middle": "value" } as CSSProperties}
            onClick={() => addValue3("middle")}
            render={
              <Role.button
                data-inner
                data-both="bottom"
                className="bottom"
                style={{ "--bottom": "value" } as CSSProperties}
                onClick={() => addValue3("bottom")}
              >
                5 (bottom)
              </Role.button>
            }
          >
            5 (middle)
          </Role.button>
        }
      >
        5 (top)
      </Role>
      <button aria-label="values3">{values3.join(", ")}</button>
    </div>
  );
}
