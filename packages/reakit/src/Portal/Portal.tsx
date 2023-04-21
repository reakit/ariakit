import * as React from "react";
import * as ReactDOM from "react-dom";
import { canUseDOM } from "reakit-utils/canUseDOM";

export type PortalProps = {
  /**
   * Portal's children.
   */
  children: React.ReactNode;
};

function getBodyElement() {
  return canUseDOM ? document.body : null;
}

export const PortalContext = React.createContext<HTMLElement | null>(
  getBodyElement()
);

export function Portal({ children }: PortalProps) {
  // if it's a nested portal, context is the parent portal
  // otherwise it's document.body
  // https://github.com/reakit/reakit/issues/513
  const context = React.useContext(PortalContext) || getBodyElement();
  const [hostNode, setHostNode] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!context) return undefined;
    const element = document.createElement("div");
    element.className = Portal.__className;
    setHostNode(element);
    context.appendChild(element);
    return () => {
      context.removeChild(element);
    };
  }, [context]);

  if (hostNode) {
    return ReactDOM.createPortal(
      <PortalContext.Provider value={hostNode}>
        {children}
      </PortalContext.Provider>,
      hostNode
    );
  }
  // ssr
  return null;
}

Portal.__className = "__reakit-portal";
Portal.__selector = `.${Portal.__className}`;
