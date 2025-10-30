import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft,
    TrendingUp,
    DollarSign,
    Award,
    Eye,
    ChevronsDown,
  Calendar,
    ShoppingCart,
    Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Sales Data Interface
interface SalesData {
    staffId: string;
    staffName: string;
    year_code?: string;
    qtySold: number;
    salesAmount: number;
    prodValue: number;
    profit: number;
    per: number;
    weight: number;
    points: number;
    role?: string;
    floor?: string;
    section?: string;
    id?: string;
}

interface SummaryData {
    totalQty: number;
    totalSales: number;
    totalProfit: number;
    totalPoints: number;
}

// Summary Card Component
const SummaryCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}> = ({ title, value, icon: Icon, color }) => (
    <Card className="h-full">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-xl font-bold">
                        {typeof value === "number"
                            ? formatNumberShort(value)
                            : value}
                    </p>
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </CardContent>
    </Card>
);

// Format big numbers (500000 → 500K, 1200000 → 1.2M)
const formatNumberShort = (num: number) => {
    if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
};

export default function SalesReportPage() {
    const [searchParams] = useSearchParams();
    const startDate =
        searchParams.get("start") || searchParams.get("startDate") || undefined;
    const endDate =
        searchParams.get("end") || searchParams.get("endDate") || undefined;

    let month = searchParams.get("month");

    if (!month) {
        month = (new Date().getMonth() + 1).toString();
    }

    const year =
        searchParams.get("year") || new Date().getFullYear().toString();

    const [sales, setSales] = useState<SalesData[]>([]);
    const [search, setSearch] = useState("");
    const [summary, setSummary] = useState<SummaryData>({
        totalQty: 0,
        totalSales: 0,
        totalProfit: 0,
        totalPoints: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // For all months view
    const [monthlyPointsData, setMonthlyPointsData] = useState<any[]>([]);
    const [yearCodeData, setYearCodeData] = useState<any[]>([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();

  const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

  useEffect(() => {
        console.log("=== MONTH STATE ===");
        console.log("month from URL:", month);
        console.log("year from URL:", year);
        console.log("startDate:", startDate);
        console.log("endDate:", endDate);
        console.log("===================");

    const fetchSales = async () => {
            setLoading(true);
            setError(null);

            try {
                const isAllMonths = month === "all" || (!startDate && !endDate);

                if (isAllMonths) {
                    // Fetch all months data
                    const res = await axiosInstance.get(
                        "/owner/all-months-sales-report",
                        {
                            params: { year: year || new Date().getFullYear() },
                        }
                    );

        if (res.data?.success) {
                        console.log('📊 All months sales data:', res.data);
                        setSales(res.data.sales || []);
                        const summaryData = res.data.summary || {
                            totalQty: 0,
                            totalSales: 0,
                            totalProfit: 0,
                            totalPoints: 0,
                        };
                        console.log('📊 Summary data from backend:', summaryData);
                        setSummary({
                            totalQty: Number(summaryData.totalQty) || 0,
                            totalSales: Number(summaryData.totalSales) || 0,
                            totalProfit: Number(summaryData.totalProfit) || 0,
                            totalPoints: Number(summaryData.totalPoints) || 0,
                        });

                        // Set monthly points data from backend
                        if (res.data.monthlyPointsData) {
                            setMonthlyPointsData(res.data.monthlyPointsData);
                        }

                        // Set year code data from backend
                        if (res.data.yearCodeData) {
                            setYearCodeData(res.data.yearCodeData);
                        }
                    }
        } else {
                    // Fetch specific month data
                    // Month is now 1-based (1-12) from URL
                    const monthNum = parseInt(month);

                    console.log("📅 Using month:", { month, monthNum });

                    const res = await axiosInstance.get("/owner/salesReport", {
                        params: { month: monthNum, year: parseInt(year) },
                    });

                    if (res.data?.success) {
                        console.log('📊 Specific month sales data:', res.data);
                        setSales(res.data.sales || []);
                        const summaryData = res.data.summary || {
                            totalQty: 0,
                            totalSales: 0,
                            totalProfit: 0,
                            totalPoints: 0,
                        };
                        console.log('📊 Summary data from backend:', summaryData);
                        setSummary({
                            totalQty: Number(summaryData.totalQty) || 0,
                            totalSales: Number(summaryData.totalSales) || 0,
                            totalProfit: Number(summaryData.totalProfit) || 0,
                            totalPoints: Number(summaryData.totalPoints) || 0,
                        });
                    }
        }
      } catch (err: any) {
                console.error("Fetch Sales Report error:", err);
         if (err.response?.status === 401) {
                            localStorage.removeItem("accesstoken");
                            localStorage.removeItem("refreshtoken");
                            await logoutOwner();
                            dispatch(clearUser());
                    toast.error("Session expired! Please sign in to continue.");
                        } else if (err.response?.status === 400) {
                            setError(
                                err.response.data.error || "Invalid request parameters"
                            );
                            toast.error(
                                err.response.data.error || "Invalid request parameters"
                            );
                        }
                setError(
                    err.response?.data?.error || "Failed to fetch sales report"
                );
      } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, [month, year, startDate, endDate, dispatch]);

  // Format currency
  const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
        }).format(amount);
    };

  const filteredSales = useMemo(() => {
        const q = search.trim().toLowerCase();
        let data = sales;
    if (q) {
            data = data.filter(
                (s) =>
        s.staffName?.toLowerCase().includes(q) ||
        String(s.staffId).toLowerCase().includes(q)
            );
        }
        return data;
    }, [sales, search]);

    const hasSales = filteredSales.length > 0;
    const isAllMonths = month === "all" || (!startDate && !endDate);

    const handleStaffClick = (staff: SalesData) => {
        // Navigate to staff sales page with staff UUID
        if (staff.id) {
            const params = new URLSearchParams();
            if (startDate) {
                params.set('start', startDate);
                params.set('startDate', startDate);
            }
            if (endDate) {
                params.set('end', endDate);
                params.set('endDate', endDate);
            }
            if (month) {
                params.set('month', month);
            }
            if (year) {
                params.set('year', year);
            }
            navigate(`/Owner/reports/sales/staffSales/${staff.id}?${params.toString()}`);
        }
    };

    const COLORS = [
        "#FF3F33",
        "#10B981",
        "#8B5CF6",
        "#F59E0B",
        "#3B82F6",
        "#EC4899",
        "#14B8A6",
    ];

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="space-y-6 p-4">
                <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Error Loading Report
                        </h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

  return (
    <div className="space-y-6 p-6">
            {/* Summary Cards */}
            {!loading && hasSales && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <SummaryCard
                            title="Total Sales Amount"
                            value={formatCurrency(summary.totalSales)}
                            icon={DollarSign}
                            color="text-green-500"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <SummaryCard
                            title="Total Profit"
                            value={formatCurrency(summary.totalProfit)}
                            icon={TrendingUp}
                            color="text-blue-500"
                        />
                    </motion.div>
<motion.div
                        initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <SummaryCard
                            title="Total Points"
                            value={Number(summary.totalPoints).toFixed(1)}
                            icon={Award}
                            color="text-purple-500"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <SummaryCard
                            title="Total Staff"
                            value={sales.length}
                            icon={Users}
                            color="text-orange-500"
                        />
                    </motion.div>
                </div>
            )}

            {/* All Months View - Charts */}
            {isAllMonths && hasSales && (
                <>
                    {/* Line Graph for Points across months */}
                    {monthlyPointsData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Points Trend</CardTitle>
                                <CardDescription>
                                    Points across all months
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyPointsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="points"
                                            stroke="#FF3F33"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pie Chart for Year Code */}
                    {yearCodeData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Year Code Distribution</CardTitle>
                                <CardDescription>
                                    Sales distribution by year code
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            data={yearCodeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name} ${(
                                                    percent * 100
                                                ).toFixed(0)}%`
                                            }
                                            outerRadius={120}
                                            innerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {yearCodeData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip formatter={(value) => value} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Staff Cards/Table */}
            {!loading && hasSales && (
                <Card>
                    <CardHeader>
                        <CardTitle>Staff Sales Report</CardTitle>
                        <CardDescription>
                            {isAllMonths
                                ? `All months data for ${year}`
                                : `${months[parseInt(month) - 1]} ${year}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
  <div className="hidden md:block">
    <Input
      placeholder="Search by name or ID"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-10 w-56"
    />
  </div>

                            {/* Desktop: Table view */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                Staff Name - ID
                                            </TableHead>
                                            <TableHead>Sales Amount</TableHead>
                                            <TableHead>Profit</TableHead>
                                            <TableHead>Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSales.map((staff, index) => (
                                            <TableRow
                                                key={staff.staffId}
                                                className={
                                                    !isAllMonths
                                                        ? "cursor-pointer hover:bg-gray-50"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    !isAllMonths &&
                                                    handleStaffClick(staff)
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    {staff.staffName} -{" "}
                                                    {staff.staffId}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        Number(
                                                            staff.salesAmount
                                                        )
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-green-600 font-medium">
                                                    {formatCurrency(
                                                        Number(staff.profit)
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {Number(
                                                        staff.points
                                                    ).toFixed(1)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
        </div>

                            {/* Mobile: Card view */}
                            <div className="md:hidden grid grid-cols-1 gap-4">
                                {filteredSales.map((staff, index) => (
            <motion.div
                                        key={staff.staffId}
                                        whileTap={
                                            !isAllMonths
                                                ? { scale: 0.95 }
                                                : undefined
                                        }
                                    >
                                        <Card
                                            className={
                                                !isAllMonths
                                                    ? "cursor-pointer hover:shadow-md transition-shadow"
                                                    : ""
                                            }
                                            onClick={() =>
                                                !isAllMonths &&
                                                handleStaffClick(staff)
                                            }
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {staff.staffName} -{" "}
                                                        {staff.staffId}
                                                    </h3>
                                                    <Badge variant="outline">
                                                        {index + 1}
                    </Badge>
                  </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="p-2 bg-green-50 rounded-lg text-center">
                                                        <p className="text-xs text-green-700 mb-1">
                                                            Sales
                                                        </p>
                                                        <p className="text-sm font-medium text-green-900">
                                                            {formatCurrency(
                                                                Number(
                                                                    staff.salesAmount
                                                                )
                                                            )}
                                                        </p>
                    </div>
                                                    <div className="p-2 bg-blue-50 rounded-lg text-center">
                                                        <p className="text-xs text-blue-700 mb-1">
                                                            Profit
                                                        </p>
                                                        <p className="text-sm font-medium text-blue-900">
                                                            {formatCurrency(
                                                                Number(
                                                                    staff.profit
                                                                )
                                                            )}
                    </p>
                  </div>
                                                    <div className="p-2 bg-purple-50 rounded-lg text-center">
                                                        <p className="text-xs text-purple-700 mb-1">
                                                            Points
                                                        </p>
                                                        <p className="text-sm font-medium text-purple-900">
                                                            {Number(
                                                                staff.points
                                                            ).toFixed(1)}
                                                        </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

            {/* No Data Found Message */}
            {!loading && !hasSales && (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-lg font-medium">
                            No sales data found
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            No sales data available for the selected period.
                        </p>
                    </CardContent>
                </Card>
            )}
    </div>
    );
}
