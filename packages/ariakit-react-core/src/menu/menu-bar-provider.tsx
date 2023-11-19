import { MenubarProvider } from "../menubar/menubar-provider.js";
import type { MenubarProviderProps } from "../menubar/menubar-provider.js";

/**
 * Provides a menubar store to MenuBar components.
 * @deprecated
 * Use [`MenubarProvider`](https://ariakit.org/reference/menubar-provider)
 * instead.
 * @example
 * ```jsx
 * <MenuBarProvider>
 *   <MenuBar>
 *     <MenuProvider>
 *       <MenuButton>File</MenuButton>
 *       <Menu>
 *         <MenuItem>New File</MenuItem>
 *         <MenuItem>New Window</MenuItem>
 *       </Menu>
 *     </MenuProvider>
 *     <MenuProvider>
 *       <MenuButton>Edit</MenuButton>
 *       <Menu>
 *         <MenuItem>Undo</MenuItem>
 *         <MenuItem>Redo</MenuItem>
 *       </Menu>
 *     </MenuProvider>
 *   </MenuBar>
 * </MenuBarProvider>
 * ```
 */
export function MenuBarProvider(props: MenuBarProviderProps = {}) {
  return <MenubarProvider {...props} />;
}

export interface MenuBarProviderProps extends MenubarProviderProps {}
