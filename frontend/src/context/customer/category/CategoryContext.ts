import { createContext } from "react";

export interface CategoryContextType {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const CategoryContext = createContext<CategoryContextType | undefined>(undefined);