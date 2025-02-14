// @ts-nocheck
import { FocusTrap, FocusTrapRegion } from "@ariakit/solid";
import { createSignal } from "solid-js";

export default function Fixture() {
  const [regionEnabled, setRegionEnabled] = createSignal(false);
  function toggleRegion() {
    setRegionEnabled((value) => !value);
  }
  return (
    <>
      <div role="group" aria-label="trap">
        <button>Start</button>
        <button>Before</button>
        <FocusTrap>Trap</FocusTrap>
        <button>After</button>
      </div>

      <div role="group" aria-label="redirect">
        <button>Start</button>
        <button>Before</button>
        <FocusTrap
          onFocus={() => document.getElementById("focus-target")?.focus()}
        >
          Trap
        </FocusTrap>
        <button>Skip</button>
        <button id="focus-target">Focus target</button>
      </div>

      <div role="group" aria-label="region">
        <button>Start</button>
        <button onClick={toggleRegion}>Toggle region</button>
        <button>Before</button>
        <FocusTrapRegion enabled={regionEnabled()}>
          <button>Trapped 1</button>
          <button disabled>Trapped 2</button>
          <button>Trapped 3</button>
          <button>Trapped 4</button>
        </FocusTrapRegion>
        <button>After</button>
      </div>
    </>
  );
}
