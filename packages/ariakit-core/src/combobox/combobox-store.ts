import {
  CompositeStoreFunctions,
  CompositeStoreItem,
  CompositeStoreOptions,
  CompositeStoreState,
  createCompositeStore,
} from "../composite/composite-store";
import { MenuStore } from "../menu/menu-store";
import {
  PopoverStoreFunctions,
  PopoverStoreOptions,
  PopoverStoreState,
  createPopoverStore,
} from "../popover/popover-store";
import { SelectStore } from "../select/select-store";
import { defaultValue } from "../utils/misc";
import { isSafari, isTouchDevice } from "../utils/platform";
import {
  Store,
  StoreOptions,
  StoreProps,
  createStore,
  mergeStore,
} from "../utils/store";
import { SetState } from "../utils/types";

type Item = CompositeStoreItem & {
  value?: string;
};

const isSafariOnMobile = isSafari() && isTouchDevice();

export function createComboboxStore({
  menu,
  select,
  ...props
}: ComboboxStoreProps = {}): ComboboxStore {
  const menuStore = menu?.omit(
    "baseElement",
    "arrowElement",
    "anchorElement",
    "contentElement",
    "popoverElement",
    "disclosureElement"
  );

  const selectStore = select?.omit(
    "value",
    "items",
    "renderedItems",
    "baseElement",
    "arrowElement",
    "anchorElement",
    "contentElement",
    "popoverElement",
    "disclosureElement"
  );

  const store = mergeStore(props.store, menuStore, selectStore);
  const syncState = store.getState();

  const activeId = defaultValue(
    props.activeId,
    syncState.activeId,
    props.defaultActiveId,
    null
  );

  const composite = createCompositeStore({
    ...props,
    store,
    activeId,
    includesBaseElement: defaultValue(
      props.includesBaseElement,
      syncState.includesBaseElement,
      true
    ),
    orientation: defaultValue(
      props.orientation,
      syncState.orientation,
      "vertical" as const
    ),
    focusLoop: defaultValue(props.focusLoop, syncState.focusLoop, true),
    focusWrap: defaultValue(props.focusWrap, syncState.focusWrap, true),
    virtualFocus: defaultValue(
      props.virtualFocus,
      syncState?.virtualFocus,
      !isSafariOnMobile
    ),
  });

  const popover = createPopoverStore({
    ...props,
    store,
    placement: defaultValue(
      props.placement,
      syncState.placement,
      "bottom-start" as const
    ),
  });

  const initialValue = defaultValue(
    props.value,
    syncState.value,
    props.defaultValue,
    ""
  );

  const initialState: ComboboxStoreState = {
    ...composite.getState(),
    ...popover.getState(),
    value: initialValue,
    resetValueOnHide: defaultValue(
      props.resetValueOnHide,
      syncState.resetValueOnHide,
      false
    ),
    activeValue: syncState.activeValue,
  };

  const combobox = createStore(initialState, composite, popover, store);

  combobox.setup(() =>
    combobox.sync(
      (state) => {
        if (state.open) return;
        combobox.setState("activeId", activeId);
        combobox.setState("moves", 0);
      },
      ["open"]
    )
  );
  combobox.setup(() =>
    combobox.sync(
      (state, prevState) => {
        if (state.moves === prevState.moves) {
          combobox.setState("activeValue", undefined);
        }
      },
      ["moves", "activeId"]
    )
  );
  combobox.setup(() =>
    combobox.sync(() => {
      const { activeId } = combobox.getState();
      const activeItem = composite.item(activeId);
      combobox.setState("activeValue", activeItem?.value);
    }, ["moves", "renderedItems"])
  );
  combobox.setup(() =>
    combobox.sync(
      (state) => {
        if (!state.resetValueOnHide) return;
        if (state.mounted) return;
        combobox.setState("value", initialValue);
      },
      ["resetValueOnHide", "mounted"]
    )
  );

  return {
    ...popover,
    ...composite,
    ...combobox,
    setValue: (value) => combobox.setState("value", value),
  };
}

export type ComboboxStoreItem = Item;

export type ComboboxStoreState = CompositeStoreState<Item> &
  PopoverStoreState & {
    /**
     * The input value.
     */
    value: string;
    /**
     * The value of the current active item when `moveType` is `keyboard`. This
     * is not updated when `moveType` is `mouse`.
     */
    activeValue?: string;
    /**
     * TODO: Description
     */
    resetValueOnHide: boolean;
  };

export type ComboboxStoreFunctions = CompositeStoreFunctions<Item> &
  PopoverStoreFunctions & {
    /**
     * Sets the `value` state.
     */
    setValue: SetState<ComboboxStoreState["value"]>;
  };

export type ComboboxStoreOptions = CompositeStoreOptions<Item> &
  PopoverStoreOptions &
  StoreOptions<ComboboxStoreState, "value" | "resetValueOnHide"> & {
    menu?: MenuStore;
    select?: SelectStore;
    defaultValue?: ComboboxStoreState["value"];
  };

export type ComboboxStoreProps = ComboboxStoreOptions &
  StoreProps<ComboboxStoreState>;

export type ComboboxStore = ComboboxStoreFunctions & Store<ComboboxStoreState>;
