export const calculateMaxCartableQuantity = (
  availableStock: number,
  baseUnit: string,
  sellPerUnitQty: number,
  sellingUnit: string
): number => {
  if (!availableStock || !baseUnit || !sellPerUnitQty || !sellingUnit) {
    return 0;
  }

  let totalStockInSmallestUnit: number;
  const base = baseUnit.toLowerCase();
  const selling = sellingUnit.toLowerCase();

  if (base === "kg") totalStockInSmallestUnit = availableStock * 1000;
  else if (base === "ltr") totalStockInSmallestUnit = availableStock * 1000;
  else if (base === "dozen") totalStockInSmallestUnit = availableStock * 12;
  else totalStockInSmallestUnit = availableStock;

  let onePackageInSmallestUnit: number;
  if (selling === "kg") onePackageInSmallestUnit = sellPerUnitQty * 1000;
  else if (selling === "ltr") onePackageInSmallestUnit = sellPerUnitQty * 1000;
  else if (selling === "dozen") onePackageInSmallestUnit = sellPerUnitQty * 12;
  else onePackageInSmallestUnit = sellPerUnitQty;

  if (onePackageInSmallestUnit <= 0) return 0;

  const maxQuantity = totalStockInSmallestUnit / onePackageInSmallestUnit;

  return Math.floor(maxQuantity);
};
