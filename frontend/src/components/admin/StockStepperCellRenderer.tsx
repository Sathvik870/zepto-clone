import React from "react";
import type { ICellRendererParams } from "ag-grid-community";
import { HiPlus, HiMinus } from "react-icons/hi";
import type { Product } from "../../pages/admin/ProductsPage";

interface IStockStepperProps extends ICellRendererParams {
  data: Product;
  onQuantityChange: (productId: number, newSaleableQuantity: number) => void;
  isEditMode: boolean;
}

const StockStepperCellRenderer: React.FC<IStockStepperProps> = (props) => {
  if (!props.data) {
    return null;
  }

  const { data, onQuantityChange, isEditMode} = props;
  const currentValue = Math.floor(Number(props.value));

  if (!isEditMode) {
    return <>{`${currentValue} ${data.unit_type}`}</>;
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuantityChange(data.product_id, currentValue + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuantityChange(data.product_id, currentValue - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newQuantity = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(newQuantity)) {
      onQuantityChange(data.product_id, newQuantity);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex items-center justify-center h-full gap-2">
      <button
        onClick={handleDecrement}
        className="p-1 rounded-md border bg-gray-200 hover:bg-gray-300 transition-colors"
        aria-label="Decrement"
      >
        <HiMinus />
      </button>

      <input
        type="number"
        value={currentValue}
        onChange={handleInputChange}
        onClick={stopPropagation}
        step="1"
        className="w-16 text-center font-semibold text-lg border-b-2 border-gray-300 focus:border-[#144a31] focus:outline-none bg-transparent"
      />

      <button
        onClick={handleIncrement}
        className="p-1 rounded-md border bg-gray-200 hover:bg-gray-300 transition-colors"
        aria-label="Increment"
      >
        <HiPlus />
      </button>
    </div>
  );
};

export default StockStepperCellRenderer;
