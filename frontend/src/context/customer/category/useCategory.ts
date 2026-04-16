import { useContext } from "react";
import { CategoryContext, type CategoryContextType } from "./CategoryContext";

export const useCategory = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }
  return context;
};