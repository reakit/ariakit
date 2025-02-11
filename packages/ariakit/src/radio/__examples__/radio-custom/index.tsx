import { useState } from "react";
import { Radio, RadioGroup, useRadioState } from "ariakit/radio";
import { VisuallyHidden } from "ariakit/visually-hidden";
import "./style.css";

export default function Example() {
  const radio = useRadioState();
  const [focusAppleVisible, setFocusAppleVisible] = useState(false);
  const [focusOrangeVisible, setFocusOrangeVisible] = useState(false);
  const [focusWatermelonVisible, setFocusWatermelonVisible] = useState(false);

  return (
    <RadioGroup state={radio}>
      <label className="label">
        <VisuallyHidden>
          <Radio
            value="apple"
            onFocusVisible={() => setFocusAppleVisible(true)}
            onBlur={() => setFocusAppleVisible(false)}
          />
        </VisuallyHidden>
        <span
          className={radio.value === "apple" ? "radio radio-checked" : "radio"}
          data-focus-visible={focusAppleVisible ? "" : null}
        />
        apple
      </label>
      <label className="label">
        <VisuallyHidden>
          <Radio
            value="orange"
            onFocusVisible={() => setFocusOrangeVisible(true)}
            onBlur={() => setFocusOrangeVisible(false)}
          />
        </VisuallyHidden>
        <span
          className={radio.value === "orange" ? "radio radio-checked" : "radio"}
          data-focus-visible={focusOrangeVisible ? "" : null}
        />
        orange
      </label>
      <label className="label">
        <VisuallyHidden>
          <Radio
            value="watermelon"
            onFocusVisible={() => setFocusWatermelonVisible(true)}
            onBlur={() => setFocusWatermelonVisible(false)}
          />
        </VisuallyHidden>
        <span
          className={
            radio.value === "watermelon" ? "radio radio-checked" : "radio"
          }
          data-focus-visible={focusWatermelonVisible ? "" : null}
        />
        watermelon
      </label>
    </RadioGroup>
  );
}
