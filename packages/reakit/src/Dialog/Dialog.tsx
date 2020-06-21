import * as React from "react";
import { warning, useWarning } from "reakit-warning";
import { createComponent } from "reakit-system/createComponent";
import { useCreateElement } from "reakit-system/useCreateElement";
import { createHook } from "reakit-system/createHook";
import { useForkRef } from "reakit-utils/useForkRef";
import { useLiveRef } from "reakit-utils/useLiveRef";
import { getActiveElement } from "reakit-utils/getActiveElement";
import {
  DisclosureContentOptions,
  DisclosureContentHTMLProps,
  useDisclosureContent,
} from "../Disclosure/DisclosureContent";
import { Portal } from "../Portal/Portal";
import { MenuContext } from "../Menu/__utils/MenuContext";
import { useDisclosureRef } from "./__utils/useDisclosureRef";
import { usePreventBodyScroll } from "./__utils/usePreventBodyScroll";
import { useFocusOnShow } from "./__utils/useFocusOnShow";
import { useFocusTrap } from "./__utils/useFocusTrap";
import { useFocusOnHide } from "./__utils/useFocusOnHide";
import { useNestedDialogs } from "./__utils/useNestedDialogs";
import { useHideOnClickOutside } from "./__utils/useHideOnClickOutside";
import { useDialogState, DialogStateReturn } from "./DialogState";
import { useDisableHoverOutside } from "./__utils/useDisableHoverOutside";
import { DialogBackdropContext } from "./__utils/DialogBackdropContext";

export type DialogOptions = DisclosureContentOptions &
  Pick<
    Partial<DialogStateReturn>,
    "modal" | "hide" | "unstable_disclosureRef"
  > &
  Pick<DialogStateReturn, "baseId"> & {
    /**
     * When enabled, user can hide the dialog by pressing `Escape`.
     */
    hideOnEsc?: boolean;
    /**
     * When enabled, user can hide the dialog by clicking outside it.
     */
    hideOnClickOutside?: boolean;
    /**
     * When enabled, user can't scroll on body when the dialog is visible.
     * This option doesn't work if the dialog isn't modal.
     */
    preventBodyScroll?: boolean;
    /**
     * The element that will be focused when the dialog shows.
     * When not set, the first tabbable element within the dialog will be used.
     */
    unstable_initialFocusRef?: React.RefObject<HTMLElement>;
    /**
     * The element that will be focused when the dialog hides.
     * When not set, the disclosure component will be used.
     */
    unstable_finalFocusRef?: React.RefObject<HTMLElement>;
    /**
     * Whether or not the dialog should be a child of its parent.
     * Opening a nested orphan dialog will close its parent dialog if
     * `hideOnClickOutside` is set to `true` on the parent.
     * It will be set to `false` if `modal` is `false`.
     */
    unstable_orphan?: boolean;
    /**
     * Whether or not to move focus when the dialog shows.
     * @private
     */
    unstable_autoFocusOnShow?: boolean;
    /**
     * Whether or not to move focus when the dialog hides.
     * @private
     */
    unstable_autoFocusOnHide?: boolean;
  };

export type DialogHTMLProps = DisclosureContentHTMLProps;

export type DialogProps = DialogOptions & DialogHTMLProps;

const isIE11 = typeof window !== "undefined" && "msCrypto" in window;

export function getNextActiveElementOnBlur(event: React.FocusEvent) {
  // IE 11 doesn't support event.relatedTarget on blur.
  // document.activeElement points the the next active element.
  // On modern browsers, document.activeElement points to the current target.
  if (isIE11) {
    const activeElement = getActiveElement(event.target);
    return activeElement as HTMLElement | null;
  }
  return event.relatedTarget as HTMLElement | null;
}

export const useDialog = createHook<DialogOptions, DialogHTMLProps>({
  name: "Dialog",
  compose: useDisclosureContent,
  useState: useDialogState,
  keys: [
    "hideOnEsc",
    "hideOnClickOutside",
    "preventBodyScroll",
    "unstable_initialFocusRef",
    "unstable_finalFocusRef",
    "unstable_orphan",
    "unstable_autoFocusOnShow",
    "unstable_autoFocusOnHide",
  ],

  useOptions({
    modal = true,
    hideOnEsc = true,
    hideOnClickOutside = true,
    preventBodyScroll = modal,
    unstable_autoFocusOnShow = true,
    unstable_autoFocusOnHide = true,
    unstable_orphan,
    ...options
  }) {
    return {
      modal,
      hideOnEsc,
      hideOnClickOutside,
      preventBodyScroll: modal && preventBodyScroll,
      unstable_autoFocusOnShow,
      unstable_autoFocusOnHide,
      unstable_orphan: modal && unstable_orphan,
      ...options,
    };
  },

  useProps(
    options,
    {
      ref: htmlRef,
      onKeyDown: htmlOnKeyDown,
      onBlur: htmlOnBlur,
      wrapElement: htmlWrapElement,
      tabIndex,
      ...htmlProps
    }
  ) {
    const dialog = React.useRef<HTMLElement>(null);
    const backdrop = React.useContext(DialogBackdropContext);
    const hasBackdrop = backdrop && backdrop === options.baseId;
    const disclosure = useDisclosureRef(dialog, options);
    const onKeyDownRef = useLiveRef(htmlOnKeyDown);
    const onBlurRef = useLiveRef(htmlOnBlur);
    const { dialogs, visibleModals, wrap } = useNestedDialogs(dialog, options);
    // VoiceOver/Safari accepts only one `aria-modal` container, so if there
    // are visible child modals, then we don't want to set aria-modal on the
    // parent modal (this component).
    const modal = options.modal && !visibleModals.length ? true : undefined;

    usePreventBodyScroll(dialog, options);
    useFocusTrap(dialog, visibleModals, options);
    useFocusOnShow(dialog, dialogs, options);
    useFocusOnHide(dialog, disclosure, options);
    useHideOnClickOutside(dialog, disclosure, dialogs, options);
    useDisableHoverOutside(dialog, dialogs, options);

    const onKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        onKeyDownRef.current?.(event);
        if (event.defaultPrevented) return;
        if (event.key !== "Escape") return;
        if (!options.hideOnEsc) return;
        if (!options.hide) {
          warning(
            true,
            "`hideOnEsc` prop is truthy, but `hide` prop wasn't provided.",
            "See https://reakit.io/docs/dialog",
            dialog.current
          );
          return;
        }
        event.stopPropagation();
        options.hide();
      },
      [options.hideOnEsc, options.hide]
    );

    const [a, setA] = React.useState();

    const onBlur = React.useCallback(
      (event: React.FocusEvent<HTMLElement>) => {
        onBlurRef.current?.(event);
        if (!options.visible) return;
        // console.log(event.target);
        // TODO: Support IE 11
        const nextActiveElement = getNextActiveElementOnBlur(event);
        if (
          !nextActiveElement ||
          !nextActiveElement.tagName ||
          nextActiveElement.tagName === "HTML" ||
          nextActiveElement === document.body
        ) {
          setA({});
        }
        // DISPLAY IS NOT WORKING ON SAFARI
      },
      [options.visible]
    );

    React.useLayoutEffect(() => {
      if (
        (a && options.visible && document.activeElement === document.body) ||
        !document.activeElement ||
        document.activeElement.tagName === "HTML"
      ) {
        dialog.current?.focus();
      }
    }, [a]);

    React.useEffect(() => {
      if (!options.visible || !dialog.current) return undefined;
      const observer = new MutationObserver((mutations) => {
        const [mutation] = mutations;
        if (mutation.target !== dialog.current) return;
        if (
          document.activeElement === document.body ||
          !document.activeElement
        ) {
          dialog.current?.focus();
        }
      });
      observer.observe(dialog.current, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
      };
    }, [options.visible]);

    const wrapElement = React.useCallback(
      (element: React.ReactNode) => {
        element = wrap(element);
        if (options.modal && !hasBackdrop) {
          element = <Portal>{element}</Portal>;
        }
        if (htmlWrapElement) {
          element = htmlWrapElement(element);
        }
        return (
          // Prevents Menu > Dialog > Menu to behave as a sub menu
          <MenuContext.Provider value={null}>{element}</MenuContext.Provider>
        );
      },
      [wrap, options.modal, hasBackdrop, htmlWrapElement]
    );

    return {
      ref: useForkRef(dialog, htmlRef),
      role: "dialog",
      tabIndex: tabIndex ?? -1,
      "aria-modal": modal,
      "data-dialog": true,
      onKeyDown,
      onBlur,
      wrapElement,
      ...htmlProps,
    };
  },
});

export const Dialog = createComponent({
  as: "div",
  useHook: useDialog,
  useCreateElement: (type, props, children) => {
    useWarning(
      !props["aria-label"] && !props["aria-labelledby"],
      "You should provide either `aria-label` or `aria-labelledby` props.",
      "See https://reakit.io/docs/dialog"
    );
    return useCreateElement(type, props, children);
  },
});
