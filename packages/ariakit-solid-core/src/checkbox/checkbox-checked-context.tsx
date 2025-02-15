import { type Accessor, createContext } from "solid-js";

export const CheckboxCheckedContext = createContext<Accessor<boolean>>(
  () => false,
);
