import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "react-day-picker/dist/style.css";
import {
  HiUsers,
  HiShoppingBag,
  HiShoppingCart,
  HiCash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
} from "react-icons/hi";
import api from "../../api";
import { format, subDays } from "date-fns";
import { CustomDatePicker } from '../../components/common/CustomDatePicker';

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  completedOrders: number;
  pendingPayments: number;
  dailyProfit: DailyProfit[];
  weeklyOrders: WeeklyOrder[];
}

interface DailyProfit {
  day: string;
  profit: string;
  revenue: string;
  cost: string;
}

interface WeeklyOrder {
  day_name: string;
  orders: number;
}

interface FormattedProfitData {
  day: string;
  profit: number;
  revenue: number;
  cost: number;
}

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-[#f7f7f7] p-6 rounded-xl shadow-md flex items-center gap-6">
    <div className={`p-4 rounded-full text-white ${color}`}>{icon}</div>
    <div>
      <p className="text-gray-600 text-sm font-bold uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState<Date | null>(subDays(new Date(), 29));
  const [toDate, setToDate] = useState<Date | null>(new Date());


  const fetchStats = useCallback(async () => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/dashboard/stats", {
        params: {
          startDate: fromDate,
          endDate: toDate,
        },
      });
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }

  const formattedProfitData: FormattedProfitData[] = stats.dailyProfit.map((day: DailyProfit) => ({
    ...day,
    day: format(new Date(day.day), "MMM d"),
    profit: parseFloat(day.profit),
    revenue: parseFloat(day.revenue),
    cost: parseFloat(day.cost),
  }));

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <HiCash size={28} />,
      color: "bg-green-500",
    },
    {
      title: "Revenue This Month",
      value: `₹${(stats.monthlyRevenue || 0).toLocaleString()}`,
      icon: <HiCash size={28} />,
      color: "bg-blue-500",
    },
    {
      title: "Total Orders",
      value: (stats.totalOrders ?? 0).toString(),
      icon: <HiShoppingCart size={28} />,
      color: "bg-indigo-500",
    },
    {
      title: "Pending Orders",
      value: (stats.pendingOrders ?? 0).toString(),
      icon: <HiOutlineClock size={28} />,
      color: "bg-yellow-500",
    },
    {
      title: "Total Customers",
      value: (stats.totalCustomers ?? 0).toString(),
      icon: <HiUsers size={28} />,
      color: "bg-purple-500",
    },
    {
      title: "Total Products",
      value: (stats.totalProducts ?? 0).toString(),
      icon: <HiShoppingBag size={28} />,
      color: "bg-pink-500",
    },
    {
      title: "Completed Orders",
      value: (stats.completedOrders ?? 0).toString(),
      icon: <HiOutlineCheckCircle size={28} />,
      color: "bg-teal-500",
    },
    {
      title: "Pending Payments",
      value: (stats.pendingPayments ?? 0).toString(),
      icon: <HiOutlineCreditCard size={28} />,
      color: "bg-red-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#f7f7f7] p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Daily Profit</h2>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <CustomDatePicker
                value={fromDate}
                onChange={(date) => setFromDate(date)}
                maxDate={new Date()}
                placeholder="Start Date"
              />
              <span className="text-gray-500 font-semibold">to</span>
              <CustomDatePicker
                value={toDate}
                onChange={(date) => setToDate(date)}
                maxDate={new Date()}
                minDate={fromDate || undefined}
                placeholder="End Date"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left rounded-lg">
              <thead className="sticky top-0  bg-[#387c40] text-md text-white uppercase">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formattedProfitData.length > 0 ? (
                  formattedProfitData.map((row: FormattedProfitData, index: number) => (
                    <tr
                      key={row.day}
                      className={`text-sm ${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {row.day}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        ₹{row.revenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">
                        ₹{row.cost.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${row.profit >= 0 ? "text-green-700" : "text-red-700"
                          }`}
                      >
                        {row.profit >= 0
                          ? `₹${row.profit.toFixed(2)}`
                          : `-₹${Math.abs(row.profit).toFixed(2)}`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No data for this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#f7f7f7] p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Weekly Orders</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={stats.weeklyOrders}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day_name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.5rem",
                  borderColor: "#387c40",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#387c40"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
