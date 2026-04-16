import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import api from "../../api";
import { format, isAfter } from 'date-fns';
import { HiUsers } from 'react-icons/hi';
import { CustomDatePicker } from '../../components/common/CustomDatePicker';

interface DailyTotalItem {
    product_id: number;
    product_name: string;
    total_quantity_in_base_unit: number;
    base_unit: string;
    customer_count: number;
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

const DailyTotalsPage: React.FC = () => {
    const [rowData, setRowData] = useState<DailyTotalItem[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [loading, setLoading] = useState(false);

    const fetchTotals = useCallback(async (date: Date) => {
        setLoading(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const response = await api.get<DailyTotalItem[]>("/api/admin/reports/daily-item-totals", {
                params: { date: dateStr }
            });
            setRowData(response.data);
        } catch (error) {
            console.error("Error fetching daily totals:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchTotals(selectedDate);
        }
    }, [selectedDate, fetchTotals]);

    const columnDefs = useMemo<ColDef<DailyTotalItem>[]>(() => [
        {
            headerName: "S.No",
            valueGetter: "node.rowIndex + 1",
            flex: 1,
            pinned: 'left',
        },
        { field: "product_name", headerName: "Product Name", flex: 2, filter: true },
        {
            headerName: "Total Quantity Sold",
            flex: 1,
            valueFormatter: p => `${p.data?.total_quantity_in_base_unit.toFixed(2)} ${p.data?.base_unit}`,
        },
        {
            headerName: "No. of Customers",
            field: "customer_count",
            flex: 1,
            cellRenderer: (params: ICellRendererParams<DailyTotalItem>) => {
                if (!params.data) return null;
                return (
                    <div className="flex items-center gap-2 h-full">
                        <HiUsers className="text-gray-500" />
                        <span className="font-semibold">{params.data.customer_count}</span>
                    </div>
                )
            }
        },
    ], []);

    return (
        <div className="p-4 md:p-1 relative">
            <style>{gridStyles}</style>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Daily Item Totals</h1>
                <div className="flex items-center">
                    <CustomDatePicker
                        value={selectedDate}
                        onChange={(date) => {
                            if (date && isAfter(date, new Date())) {
                                setSelectedDate(new Date());
                            } else {
                                setSelectedDate(date);
                            }
                        }}
                        maxDate={new Date()}
                        placeholder="Select Date"
                    />
                </div>
            </div>
            {loading ? (
                <div className="mb-4 text-gray-600">Loading ...</div>
            )
                : (
                    <div className="ag-theme-alpine custom-ag-theme" style={{ height: 550, width: "100%" }}>
                        <AgGridReact<DailyTotalItem>
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={{ sortable: true, resizable: true }}
                            animateRows={true}
                            overlayLoadingTemplate='<span class="ag-overlay-loading-center">Loading data...</span>'
                            overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">No orders found for this date.</span>'
                            pagination={true}
                            paginationPageSize={500}
                            paginationPageSizeSelector={[500, 1000, 1500]}
                        />
                    </div>
                )}
        </div>
    );
};

export default DailyTotalsPage;