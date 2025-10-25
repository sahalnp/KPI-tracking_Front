import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
    Upload,
    Calendar,
    ShoppingCart,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    TrendingUp,
    X,
    UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/api/axios";
import { logoutAccountant } from "@/lib/logoutApi";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/spinner";
import { useNavigate } from "react-router-dom";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

export function AccountantDashboard() {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedGraphType, setSelectedGraphType] = useState<
        "sales" | "walkouts" | "staff"
    >("staff");
    const [graphData, setGraphData] = useState<any[]>([]);
    const [graphLoading, setGraphLoading] = useState(false);
    const [floorPerformanceData, setFloorPerformanceData] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
    const [tempYear, setTempYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);

    // Format big numbers (500000 → 500K, 1200000 → 1.2M)
    const formatNumberShort = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
        if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
        return num.toString();
    };

   const quickStats = [
    {
        title: "Top Attendance",
        value: details?.topAttendanceStaff?.attendance ? `${details.topAttendanceStaff.attendance}%` : "0%",
        subtitle: details?.topAttendanceStaff?.name || "N/A",
        icon: UserCheck,
        color: "text-orange-500",
    },
    {
        title: "Top Selling Staff",
        value: details?.topStaffName || "N/A",
        icon: ShoppingCart,
        color: "text-blue-500",
    },
    {
    title: "Top Sale Floor",
    value: details?.topSaleFloor?.sales ? formatCurrency(details.topSaleFloor.sales) : "₹0",      
    subtitle: details?.topSaleFloor?.floor || "N/A", 
    icon: CalendarCheck,
    color: "text-purple-500",
},
    {
        title: "Active Staff",
        value: details?.activeStaff || 0,
        icon: Calendar,
        color: "text-green-500",
    },
];


    const generateMonthLabels = (
        selectedMonth: number,
        selectedYear: number
    ) => {
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        const labels = [];
        for (let i = 3; i >= 0; i--) {
            const monthIndex = selectedMonth - i;
            let adjustedMonth = monthIndex;
            let adjustedYear = selectedYear;
            if (adjustedMonth < 0) {
                adjustedMonth = 12 + monthIndex;
                adjustedYear = selectedYear - 1;
            }
            labels.push(`${monthNames[adjustedMonth]} ${adjustedYear}`);
        }
        return labels;
    };

    const handleMonthChange = (month: string) => {
        setSelectedMonth(parseInt(month));
        const newDate = new Date(selectedYear, parseInt(month) - 1, 1);
        setSelectedDate(newDate);
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(parseInt(year));
        const newDate = new Date(parseInt(year), selectedMonth - 1, 1);
        setSelectedDate(newDate);
    };

    const handleCalendarOpen = () => {
        setTempMonth(selectedMonth);
        setTempYear(selectedYear);
        setIsCalendarOpen(true);
    };

    const handleApplyDate = () => {
        setSelectedMonth(tempMonth);
        setSelectedYear(tempYear);
        setSelectedDate(new Date(tempYear, tempMonth - 1, 1));
        setIsCalendarOpen(false);
    };

    const getCurrentYearRange = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - i);
    };

    const isMonthDisabled = (month: number, year: number) => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (year > currentYear) return true;
        if (year === currentYear && month > currentMonth) return true;
        return false;
    };

    const monthNames = [
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

    const formatMonthYear = (date: Date) => {
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const month = selectedDate.getMonth() + 1;
                const year = selectedDate.getFullYear();
                console.log(year,month,"sfsdkljfdsklfjklsdfj");
                
                const { data } = await axiosInstance.get(
                    "/accountant/getDetails",
                    { params: { month, year } }
                );
                console.log("vali",data);
                
                setDetails(data.value);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    const response: any = await logoutAccountant();
                    if (response?.success) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        dispatch(clearUser());
                        toast.error("Session Expired. Please login again");
                    } else {
                        toast.error("Something went wrong. Please try again.");
                    }
                } else toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dispatch, selectedDate]);

    useEffect(() => {
        const fetchGraphData = async () => {
            setGraphLoading(true);
            try {
                const month = selectedDate.getMonth() + 1;
                const year = selectedDate.getFullYear();

                // Always fetch staff data for the last 4 months
                const { data } = await axiosInstance.get(
                    "/accountant/getStaffGraph",
                    { params: { month, year } }
                );
                const transformedData =
                    data.staffGraph?.map((item: any, index: number) => ({
                        period:
                            generateMonthLabels(month - 1, year)[index] ||
                            item.period,
                        value: item.value || 0,
                    })) || [];
                setGraphData(transformedData);
            } catch {
                // Don't set static data, let the graph show empty
                setGraphData([]);
            } finally {
                setGraphLoading(false);
            }
        };
        fetchGraphData();
    }, [selectedDate]);

    useEffect(() => {
        const fetchFloorData = async () => {
            try {
                const month = selectedDate.getMonth() + 1;
                const year = selectedDate.getFullYear();

                // Fetch floor performance data
                const salesRes = await axiosInstance.get(
                    "/accountant/getFloorData",
                    { params: { month, year } }
                );
                const salesData = salesRes.data.floorPerformance || [];

                // Fetch attendance data
                const attendanceRes = await axiosInstance.get(
                    "/accountant/getFloorAttendance",
                    { params: { month, year } }
                );
                const attendanceData = attendanceRes.data.floorAttendance || [];

                // Always get floors and show them, even if no data
                const floorsRes = await axiosInstance.get(
                    "/accountant/getFloors"
                );
                const floors = floorsRes.data.floors || [];
                console.log("Floors from API:", floors); // Debugging

                // If no sales data, show floors with 0 values
                if (salesData.length === 0) {
                    const emptySalesData = floors.map((floor: any) => ({
                        floor: floor.name,
                        sales: 0,
                    }));
                    console.log("Empty sales data:", emptySalesData); // Debugging
                    setSalesData(emptySalesData);
                } else {
                    setSalesData(salesData);
                }

                // If no attendance data, show floors with 0 values
                if (attendanceData.length === 0) {
                    const emptyAttendanceData = floors.map((floor: any) => ({
                        floor: floor.name,
                        attendance: 0,
                    }));
                    console.log("Empty attendance data:", emptyAttendanceData); // Debugging
                    setAttendanceData(emptyAttendanceData);
                } else {
                    setAttendanceData(attendanceData);
                }
            } catch {
                // Get floors from database and show with 0 values
                try {
                    const floorsRes = await axiosInstance.get(
                        "/accountant/getFloors"
                    );
                    const floors = floorsRes.data.floors || [];

                    const emptySalesData = floors.map((floor: any) => ({
                        floor: floor.name,
                        sales: 0,
                    }));

                    const emptyAttendanceData = floors.map((floor: any) => ({
                        floor: floor.name,
                        attendance: 0,
                    }));

                    setSalesData(emptySalesData);
                    setAttendanceData(emptyAttendanceData);
                } catch {
                    setSalesData([]);
                    setAttendanceData([]);
                }
            }
        };
        fetchFloorData();
    }, [selectedDate]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {" "}
                        Dashboard
                    </h1>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCalendarOpen}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-[#FF3F33] text-white hover:bg-[#E63529] font-medium px-4 h-9 gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            {formatMonthYear(selectedDate)}
                        </motion.button>
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                    Manage uploads, purchases, and financial data
                </p>
            </div>

            {/* Calendar Modal */}
            {isCalendarOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={() => setIsCalendarOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white rounded-lg shadow-xl p-6 w-[400px] max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Select Month & Year
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsCalendarOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </motion.button>
                        </div>

                        <div className="space-y-4">
                            {/* Year Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year
                                </label>
                                <Select
                                    value={tempYear.toString()}
                                    onValueChange={(value) =>
                                        setTempYear(parseInt(value))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getCurrentYearRange().map((year) => (
                                            <SelectItem
                                                key={year}
                                                value={year.toString()}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Month Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Month
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {monthNames.map((month, index) => {
                                        const monthValue = index + 1;
                                        const disabled = isMonthDisabled(
                                            monthValue,
                                            tempYear
                                        );
                                        return (
                                            <motion.button
                                                key={month}
                                                whileHover={
                                                    !disabled
                                                        ? { scale: 1.05 }
                                                        : {}
                                                }
                                                whileTap={
                                                    !disabled
                                                        ? { scale: 0.95 }
                                                        : {}
                                                }
                                                onClick={() =>
                                                    !disabled &&
                                                    setTempMonth(monthValue)
                                                }
                                                disabled={disabled}
                                                className={`
                          px-4 py-2 rounded-md text-sm font-medium transition-colors
                          ${
                              tempMonth === monthValue && !disabled
                                  ? "bg-[#FF3F33] text-white"
                                  : disabled
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }
                        `}
                                            >
                                                {month.substring(0, 3)}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1"
                                >
                                    <Button
                                        onClick={() => setIsCalendarOpen(false)}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1"
                                >
                                    <Button
                                        onClick={handleApplyDate}
                                        className="w-full bg-[#FF3F33] hover:bg-[#E63529] text-white"
                                    >
                                        Apply
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                {quickStats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardContent className="p-3">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className={`p-1.5 rounded-lg bg-gray-100 ${stat.color}`}
                                    >
                                        <stat.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-600">
                                            {stat.title}
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {stat.value}
                                        </p>
                                        {stat.subtitle && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {stat.subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Staff Trend Graph */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" /> Staff Trend
                        </CardTitle>
                        <CardDescription>
                            Monthly staff creation trend
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        {graphLoading ? (
                            <div className="flex items-center justify-center h-[250px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF3F33]" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart
                                    data={graphData}
                                    margin={{ left: -20 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="period"
                                        style={{ fontSize: "12px" }}
                                    />
                                    <YAxis style={{ fontSize: "12px" }} />
                                    <Tooltip
                                        formatter={(value: number) =>
                                            `${value} staff`
                                        }
                                        contentStyle={{ borderRadius: "8px" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#FF3F33"
                                        strokeWidth={2}
                                        dot={{ fill: "#FF3F33", r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Floor Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" /> Floor Sales
                        </CardTitle>
                        <CardDescription>
                            Sales performance by floor
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={salesData} margin={{ left: -20 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />
                                <XAxis
                                    dataKey="floor"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis 
                                    style={{ fontSize: "12px" }} 
                                    tickFormatter={(value) => formatNumberShort(value)}
                                />
                                <Tooltip
                                    formatter={(value: number) =>
                                        formatNumberShort(value)
                                    }
                                    contentStyle={{ borderRadius: "8px" }}
                                />
                                <Bar
                                    dataKey="sales"
                                    fill="#FF3F33"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Floor Attendance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" /> Floor Attendance
                        </CardTitle>
                        <CardDescription>
                            Attendance percentage by floor
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                                data={attendanceData}
                                margin={{ left: -20 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />
                                <XAxis
                                    dataKey="floor"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis style={{ fontSize: "12px" }} />
                                <Tooltip
                                    formatter={(value: number) => `${value}%`}
                                    contentStyle={{ borderRadius: "8px" }}
                                />
                                <Bar
                                    dataKey="attendance"
                                    fill="#FF3F33"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
