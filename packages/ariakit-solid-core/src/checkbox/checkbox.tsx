import { disabledFromProps } from "@ariakit/core/utils/misc";
import type { Accessor, ComponentProps } from "solid-js";
import type { CommandOptions } from "../command/command.tsx";
import { useCommand } from "../command/command.tsx";
import {
  type ElementType,
  removeUndefinedValues,
  useEffect,
  useEvent,
  useForceUpdate,
  useRef,
  useState,
} from "../utils/__port.ts";
import { $, $o } from "../utils/__props.ts";
import { useMergeRefs, useTagName, useWrapElement } from "../utils/hooks.ts";
import { useStoreState } from "../utils/store.tsx";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";
import { CheckboxCheckedContext } from "./checkbox-checked-context.tsx";
import { useCheckboxContext } from "./checkbox-context.tsx";
import type { CheckboxStore } from "./checkbox-store.ts";

// [port]: translation helper
function $d(props: any) {
  // TODO [port]: idea - utility that creates a props object with a subset of "frozen" props
  const disabledProp = props.$disabled;
  const ariaDisabledProp = props["$aria-disabled"];
  return {
    get disabled() {
      return disabledProp();
    },
    get "aria-disabled"() {
      return ariaDisabledProp();
    },
  };
}

// [port]: translation helper
function $h(target: EventTarget | null) {
  // TODO [port]: verify that these casts are safe.
  return target as HTMLType;
}

const TagName = "input" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

function setMixed(element: HTMLType, mixed?: boolean) {
  if (mixed) {
    element.indeterminate = true;
  } else if (element.indeterminate) {
    element.indeterminate = false;
  }
}

function isNativeCheckbox(tagName?: string, type?: string) {
  return tagName === "input" && (!type || type === "checkbox");
}

function getPrimitiveValue<T>(value: T) {
  if (Array.isArray(value)) {
    return value.toString();
  }
  return value as Exclude<T, readonly any[]>;
}

/**
 * Returns props to create a `Checkbox` component. If the element is not a
 * native checkbox, the hook will return additional props to make sure it's
 * accessible.
 * @see https://ariakit.org/components/checkbox
 * @example
 * ```jsx
 * const props = useCheckbox({ render: <div /> });
 * <Role {...props}>Accessible checkbox</Role>
 * ```
 */
export const useCheckbox = createHook<TagName, CheckboxOptions>(
  function useCheckbox(__) {
    let [_, props] = $o(__, {
      store: undefined,
      defaultChecked: undefined,
    });
    const nameProp = props.$name;
    const valueProp = props.$value;
    const checkedProp = props.$checked;

    const context = useCheckboxContext();
    const store = () => _.store?.() || context();

    const [_checked, setChecked] = useState(_.defaultChecked ?? false);

    const checked = useStoreState(store, (state) => {
      const $checkedProp = checkedProp();
      if ($checkedProp !== undefined) return $checkedProp;
      if (state?.value === undefined) return _checked();
      const $valueProp = valueProp();
      if ($valueProp != null) {
        if (Array.isArray(state.value)) {
          const primitiveValue = getPrimitiveValue($valueProp);
          return state.value.includes(primitiveValue);
        }
        return state.value === $valueProp;
      }
      if (Array.isArray(state.value)) return false;
      if (typeof state.value === "boolean") return state.value;
      return false;
    });

    const ref = useRef<HTMLType>(null);
    const tagName = () => useTagName(ref, TagName);
    const typeProp = props.$type;
    const nativeCheckbox = () => isNativeCheckbox(tagName(), typeProp());
    const mixed = () => (checked() ? checked() === "mixed" : undefined);
    const isChecked = () =>
      checked() === "mixed" ? false : (checked() as boolean);

    const dprops = $d(props);
    const disabled = () => disabledFromProps(dprops);
    // When the checked property is programmatically set on the change event, we
    // need to schedule the element's property update, so the controlled
    // isChecked state can be taken into account.
    const [propertyUpdated, schedulePropertyUpdate] = useForceUpdate();

    useEffect(() => {
      propertyUpdated();
      const $mixed = mixed();
      const $nativeCheckbox = nativeCheckbox();
      const $isChecked = isChecked();
      const $name = nameProp();
      const $valueProp = valueProp();
      const element = ref.current;
      if (!element) return;
      setMixed(element, $mixed);
      if ($nativeCheckbox) return;
      element.checked = $isChecked;
      if ($name !== undefined) {
        element.name = $name;
      }
      if ($valueProp !== undefined) {
        element.value = `${$valueProp}`;
      }
    }, "[propertyUpdated, mixed, nativeCheckbox, isChecked, name, valueProp]");

    const onChangeProp = props.$onChange;

    const onChange = useEvent((event: Event) => {
      if (disabled()) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      setMixed($h(event.currentTarget), mixed());
      if (!nativeCheckbox()) {
        // If the element is not a native checkbox, we need to manually update
        // its checked property.
        $h(event.currentTarget).checked = !$h(event.currentTarget).checked;
        queueMicrotask(schedulePropertyUpdate);
      }
      // @ts-expect-error TODO [port]: [event-chain]
      onChangeProp()?.(event);
      if (event.defaultPrevented) return;

      const elementChecked = $h(event.currentTarget).checked;
      setChecked(elementChecked);

      store()?.setValue((prevValue) => {
        const $valueProp = valueProp();

        if ($valueProp == null) return elementChecked;
        const primitiveValue = getPrimitiveValue($valueProp);

        if (!Array.isArray(prevValue)) {
          return prevValue === primitiveValue ? false : primitiveValue;
        }
        if (elementChecked) {
          if (prevValue.includes(primitiveValue)) {
            return prevValue;
          }
          return [...prevValue, primitiveValue];
        }
        return prevValue.filter((v) => v !== primitiveValue);
      });
    });

    const onClickProp = props.$onClick;

    const onClick = useEvent((event: MouseEvent) => {
      // @ts-expect-error TODO [port]: [event-chain]
      onClickProp()?.(event);
      if (event.defaultPrevented) return;
      if (nativeCheckbox()) return;
      // ts-expect-error The onChange event expects a ChangeEvent, but here we
      // need to pass a MouseEvent.
      onChange(event);
    });

    props = useWrapElement(
      props,
      (element) => (
        <CheckboxCheckedContext.Provider value={isChecked}>
          {element.children}
        </CheckboxCheckedContext.Provider>
      ),
      "[isChecked]",
    );

    $(props, {
      $role: () => (!nativeCheckbox() ? "checkbox" : undefined),
      $type: () => (nativeCheckbox() ? "checkbox" : undefined),
      "$aria-checked": checked,
    })({
      $ref: (props) => useMergeRefs(ref.bind, props.ref),
      onChange,
      onClick,
    });

    $(props)({
      $clickOnEnter: (props) => props.clickOnEnter ?? !nativeCheckbox(),
    });

    useCommand<TagName>(
      props as
        // [port]: unfortunate typing issue.
        typeof props & { checked: Exclude<(typeof props)["checked"], "mixed"> },
    );

    $(props, {
      $name: () => (nativeCheckbox() ? nameProp() : undefined),
      $value: () => (nativeCheckbox() ? valueProp() : undefined),
      $checked: isChecked,
    });

    return removeUndefinedValues(props);
  },
);

/**
 * Renders an accessible checkbox element. If the underlying element is not a
 * native checkbox, this component will pass additional attributes to make sure
 * it's accessible.
 * @see https://ariakit.org/components/checkbox
 * @example
 * ```jsx
 * <Checkbox render={<div />}>Accessible checkbox</Checkbox>
 * ```
 */
export const Checkbox = forwardRef(function Checkbox(props: CheckboxProps) {
  const htmlProps = useCheckbox(props);
  return createElement(TagName, htmlProps);
});

export interface CheckboxOptions<T extends ElementType = TagName>
  extends CommandOptions<T> {
  /**
   * Object returned by the
   * [`useCheckboxStore`](https://ariakit.org/reference/use-checkbox-store)
   * hook. If not provided, the closest
   * [`CheckboxProvider`](https://ariakit.org/reference/checkbox-provider)
   * component's context will be used. Otherwise, the component will fall back
   * to an internal store.
   *
   * Live examples:
   * - [Checkbox as button](https://ariakit.org/examples/checkbox-as-button)
   */
  store?: Accessor<CheckboxStore>;
  /**
   * The native `name` attribute.
   *
   * Live examples:
   * - [MenuItemCheckbox](https://ariakit.org/examples/menu-item-checkbox)
   */
  name?: string;
  /**
   * The value of the checkbox. This is useful when the same checkbox store is
   * used for multiple [`Checkbox`](https://ariakit.org/reference/checkbox)
   * elements, in which case the value will be an array of checked values.
   *
   * Live examples:
   * - [Checkbox group](https://ariakit.org/examples/checkbox-group)
   * - [MenuItemCheckbox](https://ariakit.org/examples/menu-item-checkbox)
   * @example
   * ```jsx "value"
   * <CheckboxProvider defaultValue={["Apple", "Orange"]}>
   *   <Checkbox value="Apple" />
   *   <Checkbox value="Orange" />
   *   <Checkbox value="Watermelon" />
   * </CheckboxProvider>
   * ```
   */
  value?: ComponentProps<TagName>["value"];
  /**
   * The default checked state of the checkbox. This prop is ignored if the
   * [`checked`](https://ariakit.org/reference/checkbox#checked) or the
   * [`store`](https://ariakit.org/reference/checkbox#store) props are provided.
   */
  defaultChecked?: "mixed" | boolean;
  /**
   * The checked state of the checkbox. This will override the value inferred
   * from [`store`](https://ariakit.org/reference/checkbox#store) prop, if
   * provided. This can be `"mixed"` to indicate that the checkbox is partially
   * checked.
   */
  checked?: "mixed" | boolean;
  /**
   * A function that is called when the checkbox's checked state changes.
   */
  onChange?: ComponentProps<TagName>["onChange"];
}

export type CheckboxProps<T extends ElementType = TagName> = Props<
  T,
  CheckboxOptions<T>
>;
