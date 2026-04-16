import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  ICellRendererParams,
  GetRowIdParams,
} from "ag-grid-community";
import api from "../../api";
import { useAlert } from "../../context/common/AlertContext";
import ProductModal from "../../components/admin/ProductModal";
import ProductViewModal from "../../components/admin/ProductViewModal";
import StockStepperCellRenderer from "../../components/admin/StockStepperCellRenderer";
import {
  HiPencil,
  HiTrash,
  HiEye,
  HiOutlineRefresh,
  HiX,
  HiOutlineSwitchHorizontal,
} from "react-icons/hi";


export interface Product {
  product_id: number;
  product_code: string;
  product_name: string;
  product_category: string;
  product_description?: string;
  unit_type: string;
  cost_price: number;
  selling_price: number;
  available_quantity: number;
  saleable_quantity: number;
  sell_per_unit_qty?: number;
  selling_unit?: string;
}

export interface ProductWithImage extends Product {
  imageUrl?: string | null;
}

const gridStyles = `
  .custom-ag-theme .ag-header {
    background-color: #387c40;
    border-bottom: 2px solid #387c40;
  }

  .custom-ag-theme .ag-header-cell {
    color: white;
  }

  .custom-ag-theme .ag-header-cell-label {
    font-weight: 600;
    font-size: 15px;
  }
  .custom-ag-theme .ag-header-icon {
    color: white;
  }
  .custom-ag-theme .ag-header-icon {
    color: white;
  }
`;

const ProductsPage: React.FC = () => {
  const [rowData, setRowData] = useState<Product[]>([]);
  const { showAlert } = useAlert();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductWithImage | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const [dirtyRows, setDirtyRows] = useState<{
    [productId: number]: {
      saleable_quantity: number;
      available_quantity: number;
    };
  }>({});

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get<Product[]>("/api/admin/products");
      setRowData(response.data);
      setDirtyRows({});
    } catch (error) {
      console.error("Failed to fetch products", error);
      showAlert(
        "Could not load product data. Please refresh the page.",
        "error"
      );
    }
  }, [showAlert]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuantityChange = useCallback(
    (productId: number, newSaleableQuantity: number) => {
      const originalProduct = rowData.find((p) => p.product_id === productId);
      if (!originalProduct) return;

      const totalStock =
        Number(originalProduct.available_quantity) +
        Number(originalProduct.saleable_quantity);

      let finalSaleableQuantity = Math.floor(newSaleableQuantity);

      if (finalSaleableQuantity < 0) {
        finalSaleableQuantity = 0;
      }
      if (finalSaleableQuantity > totalStock) {
        finalSaleableQuantity = totalStock;
      }

      if (finalSaleableQuantity === Number(originalProduct.saleable_quantity)) {
        setDirtyRows((prev) => {
          if (!prev[productId]) {
            return prev;
          }
          const newDirtyRows = { ...prev };
          delete newDirtyRows[productId];
          return newDirtyRows;
        });
        return;
      }

      const newAvailableQuantity = totalStock - finalSaleableQuantity;

      setDirtyRows((prev) => ({
        ...prev,
        [productId]: {
          saleable_quantity: finalSaleableQuantity,
          available_quantity: newAvailableQuantity,
        },
      }));
    },
    [rowData, showAlert]
  );

  const handleBatchUpdate = useCallback(async () => {
    const payload = Object.entries(dirtyRows).map(
      ([productId, quantities]) => ({
        product_id: Number(productId),
        ...quantities,
      })
    );

    if (payload.length === 0) return;

    try {
      await api.put("/api/admin/stock/batch-update", { updates: payload });
      showAlert("Stock levels updated successfully!", "success");
      setIsEditMode(false);
      fetchProducts();
    } catch (error: any) {
      showAlert(
        error.response?.data?.message || "Failed to update stock.",
        "error"
      );
    }
  }, [dirtyRows, showAlert]);

  const displayRowData = useMemo(() => {
    if (Object.keys(dirtyRows).length === 0) return rowData;
    return rowData.map((row) =>
      dirtyRows[row.product_id] ? { ...row, ...dirtyRows[row.product_id] } : row
    );
  }, [rowData, dirtyRows]);

  const handleCancel = () => {
    setDirtyRows({});
    setIsEditMode(false);
  };

  const handleOpenViewModal = (productId: number) => {
    setSelectedProductId(productId);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = async (productId: number | null) => {
    if (productId === null) {
      setProductToEdit(null);
    } else {
      try {
        const response = await api.get<ProductWithImage>(
          `/api/admin/products/${productId}`
        );
        setProductToEdit(response.data);
      } catch (error) {
        console.error("Failed to fetch product details for editing", error);
        showAlert("Failed to fetch product details for editing.", "error");
        return;
      }
    }
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setProductToEdit(null);
    setSelectedProductId(null);
  };

  const handleDeleteProduct = (productId: number) => {
    const performDelete = async () => {
      try {
        await api.delete(`/api/admin/products/${productId}`);
        showAlert("Product deleted successfully!", "success");
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
        showAlert("Failed to delete product. Please try again.", "error");
      }
    };
    showAlert(
      "This action cannot be undone. Are you sure you want to delete this product?",
      "warning",
      performDelete
    );
  };

  const ActionsCellRenderer: React.FC<ICellRendererParams> = ({ data }) => (
    <div className="flex gap-4 items-center h-full">
      <button
        onClick={() => handleOpenViewModal(data.product_id)}
        className="text-green-600 hover:text-green-800"
        title="View Details"
      >
        <HiEye size={22} />
      </button>
      <button
        onClick={() => handleOpenEditModal(data.product_id)}
        className="text-blue-500 hover:text-blue-700"
        title="Edit Product"
      >
        <HiPencil size={20} />
      </button>
      <button
        onClick={() => handleDeleteProduct(data.product_id)}
        className="text-red-500 hover:text-red-700"
        title="Delete Product"
      >
        <HiTrash size={20} />
      </button>
    </div>
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "product_code",
        headerName: "Code",
        flex: 1.2,
        sortable: true,
      },
      {
        field: "product_name",
        headerName: "Product Name",
        flex: 1.5,
      },
      {
        field: "product_category",
        headerName: "Category",
        flex: 1.2,
      },
      {
        field: "available_quantity",
        headerName: "Total Stock",
        flex: 1.5,
        valueFormatter: (p) => `${p.value} ${p.data.unit_type}`,
      },
      {
        field: "saleable_quantity",
        headerName: "Stock for Sales",
        flex: 1.5,
        cellRenderer: StockStepperCellRenderer,
        cellRendererParams: {
          onQuantityChange: handleQuantityChange,
          isEditMode: isEditMode,
        },
      },
      {
        field: "cost_price",
        headerName: "Cost Price",
        valueFormatter: (p) =>
          `₹${Number(p.value).toFixed(2)} / ${p.data.unit_type}`,
        flex: 1.5,
      },
      {
        field: "selling_price",
        headerName: "Selling Price",
        valueFormatter: (params) => {
          const price = Number(params.value || 0).toFixed(2);
          const qty = params.data?.sell_per_unit_qty ?? "";
          const unit = params.data?.selling_unit ?? "";
          return `₹${price} / ${qty} ${unit}`;
        },
        flex: 2,
      },
      {
        field: "actions",
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        flex: 1.5,
        filter: false,
        sortable: false,
      },
    ],
    [handleQuantityChange, isEditMode]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: { fontSize: "15px", fontWeight: "600" },
    }),
    []
  );

  const getRowId = useMemo(() => {
    return (params: GetRowIdParams) => params.data.product_id;
  }, []);

  return (
    <div>
      <style>{gridStyles}</style>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-4">
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex gap-3 text-lg cursor-pointer text-white font-semibold bg-gradient-to-r from-[#144a31] to-[#387c40] px-7 py-3 rounded-full border border-[#144a31] hover:scale-105 duration-200 justify-center items-center"
            >
              <HiOutlineSwitchHorizontal size={20} /> Manage Stocks
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex justify-center items-center text-white font-semibold bg-gradient-to-r from-[#e30000] to-[#b30000] w-12 h-12 rounded-full border border-[#e30000] hover:scale-110 duration-200"
              >
                <HiX size={22} />
              </button>
              <button
                onClick={handleBatchUpdate}
                disabled={Object.keys(dirtyRows).length === 0}
                className={`flex gap-3 text-lg font-semibold px-7 py-3 rounded-full border justify-center items-center transition-all duration-200
                  ${
                    Object.keys(dirtyRows).length > 0
                      ? "bg-gradient-to-r from-[#144a31] to-[#387c40] text-white border-[#144a31] hover:scale-105 cursor-pointer"
                      : "bg-[#618172] text-white cursor-not-allowed"
                  }`}
              >
                <HiOutlineRefresh
                  size={22}
                  className={`${
                    Object.keys(dirtyRows).length > 0
                      ? "text-white"
                      : "text-white"
                  } transition-transform duration-300 ${
                    Object.keys(dirtyRows).length > 0
                      ? "group-hover:rotate-180"
                      : ""
                  }`}
                />
                Update Changes
              </button>
            </>
          )}
          <button
            onClick={() => handleOpenEditModal(null)}
            className="flex gap-3 text-lg cursor-pointer text-white font-semibold bg-gradient-to-r from-[#144a31] to-[#387c40] px-7 py-3 rounded-full border border-[#144a31] hover:scale-105 duration-200 justify-center items-center"
          >
            + Add New Product
          </button>
        </div>
      </div>
      <div
        className="ag-theme-alpine custom-ag-theme"
        style={{ height: 600, width: "100%" }}
      >
        <AgGridReact
          rowData={displayRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          pagination={true}
          paginationPageSize={15}
          paginationPageSizeSelector={[15, 20, 50, 100]}
        />
      </div>
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        onSaveSuccess={fetchProducts}
        productToEdit={productToEdit}
      />
      <ProductViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseModals}
        productId={selectedProductId}
      />
    </div>
  );
};

export default ProductsPage;
