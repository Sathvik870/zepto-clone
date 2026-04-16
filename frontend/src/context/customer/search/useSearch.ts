import { useContext } from "react";
import { SearchContext, type SearchContextType } from "./SearchContext";

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};