import { createContext } from "react";
import { MenuBarStore } from "./menu-bar-store";
import { MenuStore } from "./menu-store";

export const MenuBarContext = createContext<MenuBarStore | undefined>(
  undefined
);
export const MenuContext = createContext<MenuStore | undefined>(undefined);
export const MenuItemCheckedContext = createContext<boolean | undefined>(
  undefined
);
