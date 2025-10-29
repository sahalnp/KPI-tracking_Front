import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Tag,
    Calendar,
    TrendingUp,
    TrendingDown,
    Minus,
    Star,
    Download,
    X,
    FileText,
    Sheet,
    ChevronsDown,
    Eye,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { saveAs } from "file-saver";

interface StaffInfo {
    id: number;
    staffId: string;
    name: string;
    mobile: string;
    role: string;
    section: string;
    floor: {
        name: string;
    };
}

interface KPIScore {
    avgScore: number;
    avgPoints: number;
    count: number;
    weight: number;
    latestComment: string;
    latestTrend: string;
}

interface DailyKPIScores {
    [date: string]: {
        [kpiName: string]: KPIScore;
    };
}

interface MonthlyKPIScores {
    [kpiName: string]: KPIScore;
}

interface StaffKPIDetails {
    staff: StaffInfo;
    dailyKPIScores: DailyKPIScores;
    weeklyKPIScores: DailyKPIScores; // Weekly KPIs also use the same structure as daily
    monthlyKPIScores: MonthlyKPIScores;
    monthlySummary: {
        avgPoints: number;
        avgWeight: number;
        avgScore: number;
        totalPoins: number;
        totalScore: number;
        fullScore: number;
    };
    weeklySummary: {
        totalPoints: number;
        totalWeight: number;
        totalScore: number;
        avgScore: number;
    };
    dailySummary: {
        totalPoints: number;
        totalWeight: number;
        totalScore: number;
        avgScore: number;
    };
    totalDays: number;
    totalKPIs: number;
} // Updated interface with monthly and weekly data

export const StaffKPIDetails: React.FC = () => {
    const [data, setData] = useState<StaffKPIDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [salesData, setSalesData] = useState<any>(null);
    const [showDetailedSales, setShowDetailedSales] = useState(false);
    const [allMonthsData, setAllMonthsData] = useState<any>(null);

    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    const query = new URLSearchParams(location.search);
    const startDate = query.get("start");
    const endDate = query.get("end");
    const month = query.get("month");
    const year = query.get("year");

    useEffect(() => {
        console.log("=== MONTH STATE ===");
        console.log("month from URL:", month);
        console.log("===================");

        const fetchStaffKPIDetails = async () => {
            if (!id) return;

            setIsLoading(true);
            setError(null);

            try {
                // If "all" is selected, fetch all months data
                if (month === "all") {
                    const allMonthsRes = await axiosInstance.get(
                        `/owner/staff/${id}/all-months-kpi-details`,
                        {
                            params: {
                                year: year,
                            },
                        }
                    );

                    // Fetch weekly KPI aggregated by month
                    const allWeeklyRes = await axiosInstance.get(
                        `/owner/staff/${id}/all-months-weekly-kpi-details`,
                        {
                            params: {
                                year: year,
                            },
                        }
                    );

                    // Fetch all months attendance report
                    const allMonthsAttendanceRes = await axiosInstance.get(
                        `/owner/staff/${id}/all-months-attendance-report`,
                        {
                            params: {
                                year: year,
                            },
                        }
                    );

                    // Fetch all months sales report
                    const allMonthsSalesRes = await axiosInstance.get(
                        `/owner/staff/${id}/all-months-sales-report`,
                        {
                            params: {
                                year: year,
                            },
                        }
                    );

                    if (allMonthsRes.data.success) {
                        console.log("All Months Data:", allMonthsRes.data.data);
                        console.log(
                            "All Weekly KPI Data:",
                            allWeeklyRes.data.data
                        );
                        console.log(
                            "All Months Attendance Data:",
                            allMonthsAttendanceRes.data.data
                        );
                        console.log(
                            "All Months Sales Data:",
                            allMonthsSalesRes.data.data
                        );

                        // Merge weekly data into the main data
                        const mergedData = {
                            ...allMonthsRes.data.data,
                            weeklyMonthlyAggregatedData:
                                allWeeklyRes.data.data.monthlyAggregatedData ||
                                {},
                        };

                        setAllMonthsData(mergedData);
                        setData(null); // Clear single month data

                        // Set all months attendance data
                        if (allMonthsAttendanceRes.data.success) {
                            setAttendanceData(allMonthsAttendanceRes.data.data);
                        } else {
                            setAttendanceData(null);
                        }

                        // Set all months sales data
                        if (allMonthsSalesRes.data.success) {
                            setSalesData(allMonthsSalesRes.data.data);
                        } else {
                            setSalesData(null);
                        }
                    } else {
                        setError(
                            allMonthsRes.data.error ||
                                "Failed to fetch all months data"
                        );
                        toast.error(
                            allMonthsRes.data.error ||
                                "Failed to fetch all months data"
                        );
                    }
                } else {
                    // Fetch single month data
                    const monthIndex = month
                        ? typeof month === "string"
                            ? parseInt(month)
                            : month
                        : null;
                    const monthlyRes = await axiosInstance.get(
                        `/owner/staff/${id}/kpi-details`,
                        {
                            params: {
                                start: startDate,
                                end: endDate,
                                month:
                                    monthIndex !== null ? monthIndex + 1 : null, // Convert 0-based to 1-based month
                                year: year,
                            },
                        }
                    );

                    // Fetch weekly KPI details
                    const weeklyRes = await axiosInstance.get(
                        `/owner/staff/${id}/weekly-kpi-details`,
                        {
                            params: {
                                start: startDate,
                                end: endDate,
                                month:
                                    monthIndex !== null ? monthIndex + 1 : null, // Convert 0-based to 1-based month
                                year: year,
                            },
                        }
                    );

                    if (
                        monthlyRes.data.success &&
                        weeklyRes.data.success
                    ) {
                        // Debug logging
                        console.log(
                            "Monthly KPIs:",
                            Object.keys(
                                monthlyRes.data.data.monthlyKPIScores || {}
                            )
                        );
                        console.log(
                            "Weekly KPIs:",
                            Object.keys(
                                weeklyRes.data.data.weeklyKPIScores || {}
                            )
                        );

                        // Combine the data from both APIs
                        const combinedData = {
                            staff: monthlyRes.data.data.staff, // Use staff info from monthly API
                            monthlyKPIScores:
                                monthlyRes.data.data.monthlyKPIScores || {},
                            monthlySummary:
                                monthlyRes.data.data.monthlySummary || {},
                            weeklyKPIScores:
                                weeklyRes.data.data.weeklyKPIScores || {},
                            weeklySummary:
                                weeklyRes.data.data.weeklySummary || {},
                            dailyKPIScores: {},
                            dailySummary: {
                                totalPoints: 0,
                                totalWeight: 0,
                                totalScore: 0,
                                avgScore: 0,
                            },
                            totalDays: 0,
                            totalKPIs: monthlyRes.data.data.totalKPIs || 0,
                        };
                        setData(combinedData);
                        setAllMonthsData(null); // Clear all months data
                    } else {
                        setError(
                            monthlyRes.data.error ||
                                weeklyRes.data.error ||
                                "Failed to fetch staff KPI details"
                        );
                        toast.error(
                            monthlyRes.data.error ||
                                weeklyRes.data.error ||
                                "Failed to fetch staff KPI details"
                        );
                    }
                }

                // Fetch attendance report
                const attendanceRes = await axiosInstance.get(
                    `/owner/staff/${id}/attendance-report`,
                    {
                        params: {
                            start: startDate,
                            end: endDate,
                            month:
                                month === "all" || !month
                                    ? null
                                    : typeof month === "string"
                                    ? parseInt(month) + 1
                                    : month + 1,
                            year: year,
                        },
                    }
                );

                // Fetch sales report
                const salesRes = await axiosInstance.get(
                    `/owner/staff/${id}/sales-report`,
                    {
                        params: {
                            start: startDate,
                            end: endDate,
                            month:
                                month === "all" || !month
                                    ? null
                                    : typeof month === "string"
                                    ? parseInt(month) + 1
                                    : month + 1,
                            year: year,
                        },
                    }
                );

                // Handle attendance data separately - it might not exist
                if (attendanceRes.data.success) {
                    setAttendanceData(attendanceRes.data.data);
                } else {
                    // If attendance fetch fails or has no data, set attendance to null
                    setAttendanceData(null);
                }

                // Handle sales data separately - it might not exist
                if (salesRes.data.success) {
                    setSalesData(salesRes.data.data);
                } else {
                    // If sales fetch fails or has no data, set sales to null
                    setSalesData(null);
                }
            } catch (err: any) {
                console.error("Fetch Staff KPI Details error:", err);
                setError(
                    "Failed to fetch staff KPI details. Please try again later."
                );
                toast.error("Failed to fetch staff KPI details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaffKPIDetails();
    }, [id, startDate, endDate, month, year]);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "up":
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case "down":
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };
    const getWeekNumberByDate = (date: Date): number => {
        const day = date.getDate();
        if (day >= 1 && day <= 7) return 1;
        if (day >= 8 && day <= 14) return 2;
        if (day >= 15 && day <= 21) return 3;
        if (day >= 22 && day <= 28) return 4;
        return 5; // Days 29-31
    };

    // Group dates by fixed weekly structure
    const groupByWeek = () => {
        if (!data?.weeklyKPIScores) {
            return {};
        }

        const weeklyData: { [weekKey: string]: any } = {};

        Object.keys(data.weeklyKPIScores).forEach((date) => {
            const dateObj = new Date(date);
            const weekNum = getWeekNumberByDate(dateObj);
            const month = dateObj.toLocaleDateString("en-US", {
                month: "short",
            });
            const year = dateObj.getFullYear();

            // Calculate date range for this week
            const weekStart = weekNum === 1 ? 1 : (weekNum - 1) * 7 + 1;
            const weekEnd =
                weekNum <= 4
                    ? weekNum * 7
                    : new Date(year, dateObj.getMonth() + 1, 0).getDate();

            const weekKey = `Week ${weekNum} (${month} ${weekStart}-${weekEnd})`;

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {};
            }

            // Merge all KPI data for this week
            Object.keys(data.weeklyKPIScores[date]).forEach((kpiName) => {
                const kpiData = data.weeklyKPIScores[date][kpiName];
                if (!weeklyData[weekKey][kpiName]) {
                    weeklyData[weekKey][kpiName] = {
                        scores: [],
                        weights: [],
                        points: [],
                    };
                }
                weeklyData[weekKey][kpiName].scores.push(kpiData.avgScore);
                weeklyData[weekKey][kpiName].weights.push(kpiData.weight);
                weeklyData[weekKey][kpiName].points.push(kpiData.avgPoints);
            });
        });

        // Calculate averages for each week
        const processedWeeklyData: { [weekKey: string]: any } = {};
        Object.keys(weeklyData).forEach((weekKey) => {
            processedWeeklyData[weekKey] = {};
            Object.keys(weeklyData[weekKey]).forEach((kpiName) => {
                const kpiData = weeklyData[weekKey][kpiName];
                processedWeeklyData[weekKey][kpiName] = {
                    avgScore: (
                        kpiData.scores.reduce(
                            (a: number, b: number) => a + b,
                            0
                        ) / kpiData.scores.length
                    ).toFixed(1),
                    avgPoints: (
                        kpiData.points.reduce(
                            (a: number, b: number) => a + b,
                            0
                        ) / kpiData.points.length
                    ).toFixed(1),
                    weight: kpiData.weights[0] || "N/A",
                };
            });
        });

        return processedWeeklyData;
    };

    const weeklyGroupedData = groupByWeek();
    const weekKeys = Object.keys(weeklyGroupedData).sort(
        (a: string, b: string) => {
            // Sort by week number
            const weekNumA = parseInt(a.match(/Week (\d+)/)?.[1] || "0");
            const weekNumB = parseInt(b.match(/Week (\d+)/)?.[1] || "0");
            return weekNumA - weekNumB;
        }
    );

    const handleExportPDF = async (period: string) => {
        setPdfLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams({
                format: "pdf",
                period: period
            });
            
            // Always add month and year parameters
            if (month) {
                params.append("month", month);
            }
            if (year) {
                params.append("year", year);
            }
            if (startDate) {
                params.append("start", startDate);
            }
            if (endDate) {
                params.append("end", endDate);
            }

            console.log("📤 PDF EXPORT REQUEST:");
            console.log("  - Staff ID:", id);
            console.log("  - Format: pdf");
            console.log("  - Period:", period);
            console.log("  - Month:", month);
            console.log("  - Year:", year);
            console.log("  - Start Date:", startDate);
            console.log("  - End Date:", endDate);
            console.log("  - Full URL:", `/owner/staff/${id}/kpi-details/export?${params.toString()}`);

            const { data } = await axiosInstance.get(
                `/owner/staff/${id}/kpi-details/export?${params.toString()}`,
                { responseType: "blob" }
            );

            const blob = new Blob([data], { type: "application/pdf" });
            saveAs(blob, `Staff-KPI-${period}.pdf`);
            toast.success("PDF download started");
        } catch (err: any) {
            toast.error("Failed to download PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleExportExcel = async (period: string) => {
        setExcelLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams({
                format: "excel",
                period: period
            });
            
            // Always add month and year parameters
            if (month) {
                params.append("month", month);
            }
            if (year) {
                params.append("year", year);
            }
            if (startDate) {
                params.append("start", startDate);
            }
            if (endDate) {
                params.append("end", endDate);
            }

            console.log("📤 EXCEL EXPORT REQUEST:");
            console.log("  - Staff ID:", id);
            console.log("  - Format: excel");
            console.log("  - Period:", period);
            console.log("  - Month:", month);
            console.log("  - Year:", year);
            console.log("  - Start Date:", startDate);
            console.log("  - End Date:", endDate);
            console.log("  - Full URL:", `/owner/staff/${id}/kpi-details/export?${params.toString()}`);

            const { data } = await axiosInstance.get(
                `/owner/staff/${id}/kpi-details/export?${params.toString()}`,
                { responseType: "blob" }
            );

            const blob = new Blob([data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            saveAs(blob, `Staff-KPI-${period}.xlsx`);
            toast.success("Excel download started");
        } catch (err: any) {
            toast.error("Failed to export Excel file");
        } finally {
            setExcelLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="space-y-6 p-4">
                <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Error Loading Details
                        </h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate monthly totals from daily data if monthly data is not available
    const calculateMonthlyTotals = () => {
        if (!data?.dailyKPIScores)
            return {
                totalPoints: 0,
                totalWeight: 0,
                totalScore: 0,
                fullScore: 5,
            };

        let totalPoints = 0;
        let totalWeight = 0;
        let totalScore = 0;
        let count = 0;

        Object.values(data.dailyKPIScores).forEach((dayKPIs) => {
            Object.values(dayKPIs).forEach((kpiData) => {
                totalPoints += kpiData.avgPoints || 0;
                totalWeight += kpiData.weight || 0;
                totalScore += kpiData.avgScore || 0;
                count++;
            });
        });

        return {
            totalPoints: totalPoints,
            totalWeight: count > 0 ? totalWeight / count : 0,
            totalScore: count > 0 ? totalScore / count : 0,
            fullScore: 5,
        };
    };

    const monthlyTotals = calculateMonthlyTotals();

    // Get staff info from either single month data or all months data
    const getStaffInfo = () => {
        if (data?.staff) {
            return data.staff;
        }
        if (allMonthsData) {
            // Find staff info from any available month
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
            for (const month of months) {
                if (allMonthsData[month]?.staff) {
                    return allMonthsData[month].staff;
                }
            }
        }
        return null;
    };

    const staffInfo = getStaffInfo();

    return (
        <div className="space-y-6 p-6 pb-40 min-h-screen max-w-7xl mx-auto relative z-0 overflow-hidden">
            {/* Staff Info Card */}
            {staffInfo && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-md p-6 mb-6"
                >
                    {/* First Line: Staff Icon, Name, Badge */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-xl">
                                {staffInfo?.name?.charAt(0)?.toUpperCase() ||
                                    "S"}
                            </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {staffInfo?.name}
                        </h3>
                        <span
                            className={`text-sm px-3 py-1 rounded-full font-medium ${
                                staffInfo?.role === "Staff"
                                    ? "bg-green-100 text-green-800"
                                    : staffInfo?.role === "FloorSupervisor"
                                    ? "bg-blue-100 text-blue-800"
                                    : staffInfo?.role === "Accountant"
                                    ? "bg-purple-100 text-purple-800"
                                    : staffInfo?.role === "Admin"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            {staffInfo?.role || "Staff"}
                        </span>
                    </div>

                    {/* Staff Information Table - Exact Match to Image */}
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">No</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Staff ID</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Mobile</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Role</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Section</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Floor</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">Avg Score</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">1</td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">{staffInfo?.staffId || "N/A"}</td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">{staffInfo?.name || "N/A"}</td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">{staffInfo?.mobile || "N/A"}</td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">{staffInfo?.role || "N/A"}</td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">{staffInfo?.section || "N/A"}</td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">
                            {typeof staffInfo?.floor === "string"
                                ? staffInfo.floor
                                            : staffInfo?.floor?.name || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 border-b border-gray-200">0</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Monthly KPI Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="mb-6 shadow-lg w-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-center text-gray-800">
                            {month === "all"
                                ? "All Months KPI Summary"
                                : "Monthly KPI Summary"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        {month === "all" && allMonthsData ? (
                            // Show all months data with calculated totals
                            <>
                                {(() => {
                                    // Use the _averages data calculated by the backend
                                    const averages = allMonthsData._averages;
                                    if (!averages) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 font-medium">
                                                    No averaged data available
                                                </p>
                                            </div>
                                        );
                                    }

                                    const totalPoints =
                                        averages.monthlySummary?.avgPoints || 0;
                                    const avgWeight =
                                        averages.monthlySummary?.avgWeight || 0;
                                    const avgScore =
                                        averages.monthlySummary?.avgScore || 0;
                                    const allKPIData =
                                        averages.monthlyKPIScores || {};

                                    return (
                                        <>
                                            {/* Overall Summary */}
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
                                                <h3 className="text-sm font-bold text-center text-gray-700 mb-3">
                                                    Overall Performance
                                                </h3>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Total Points
                                                        </div>
                                                        <div className="text-lg font-bold text-green-600">
                                                            {totalPoints.toFixed(
                                                                1
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Weight
                                                        </div>
                                                        <div className="text-lg font-bold text-orange-600">
                                                            {avgWeight.toFixed(
                                                                1
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Total Score
                                                        </div>
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {avgScore.toFixed(
                                                                1
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Individual KPI Cards */}
                                            <div className="space-y-2">
                                                {Object.keys(allKPIData)
                                                    .length > 0 ? (
                                                    Object.keys(allKPIData).map(
                                                        (kpiName) => {
                                                            const kpiData =
                                                                allKPIData[
                                                                    kpiName
                                                                ];
                                                            const avgPoints =
                                                                kpiData.avgPoints ||
                                                                0;
                                                            const avgWeight =
                                                                kpiData.avgWeight ||
                                                                0;
                                                            const avgScore =
                                                                kpiData.avgScore ||
                                                                0;

                                                            return (
                                                                <div
                                                                    key={
                                                                        kpiName
                                                                    }
                                                                    className="bg-gray-50 rounded-lg p-3 border hover:shadow-md transition-shadow"
                                                                >
                                                                    {/* KPI Name */}
                                                                    <h5 className="text-sm font-semibold text-gray-800 mb-3 text-center">
                                                                        {
                                                                            kpiName
                                                                        }
                                                                    </h5>

                                                                    {/* Points | Weight | Score */}
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <div className="text-center">
                                                                            <div className="text-xs text-gray-600 mb-1">
                                                                                Avg
                                                                                Points
                                                                            </div>
                                                                            <div className="text-sm font-bold text-green-600">
                                                                                {avgPoints.toFixed(
                                                                                    1
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="text-xs text-gray-600 mb-1">
                                                                                Weight
                                                                            </div>
                                                                            <div className="text-sm font-bold text-orange-600">
                                                                                {avgWeight.toFixed(
                                                                                    1
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="text-xs text-gray-600 mb-1">
                                                                                Avg
                                                                                Score
                                                                            </div>
                                                                            <div className="text-sm font-bold text-blue-600">
                                                                                {avgScore.toFixed(
                                                                                    1
                                                                                )}
                                                                                /5
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <p className="text-gray-600 font-medium">
                                                            No KPI scored for
                                                            this month
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </>
                        ) : data ? (
                            // Show single month data
                            <>
                                {/* Overall Summary */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
                                    <h3 className="text-sm font-bold text-center text-gray-700 mb-3">
                                        Overall Performance
                                    </h3>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Total Points
                                            </div>
                                            <div className="text-lg font-bold text-green-600">
                                                {data?.monthlySummary?.totalPoins?.toFixed(
                                                    1
                                                ) || "0.0"}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Weight
                                            </div>
                                            <div className="text-lg font-bold text-orange-600">
                                                {data?.monthlySummary?.avgWeight?.toFixed(
                                                    1
                                                ) || "0.0"}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Total Score
                                            </div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {data?.monthlySummary?.totalScore?.toFixed(
                                                    1
                                                ) || "0.0"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Individual KPI Cards */}
                                <div className="space-y-2">
                                    {data?.monthlyKPIScores &&
                                    Object.keys(data.monthlyKPIScores).length >
                                        0 ? (
                                        Object.keys(data.monthlyKPIScores).map(
                                            (kpiName) => {
                                                const kpiData =
                                                    data.monthlyKPIScores[
                                                        kpiName
                                                    ];
                                                return (
                                                    <div
                                                        key={kpiName}
                                                        className="bg-gray-50 rounded-lg p-3 border hover:shadow-md transition-shadow"
                                                    >
                                                        {/* KPI Name */}
                                                        <h5 className="text-sm font-semibold text-gray-800 mb-3 text-center">
                                                            {kpiName}
                                                        </h5>

                                                        {/* Points | Weight | Score */}
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="text-center">
                                                                <div className="text-xs text-gray-600 mb-1">
                                                                    {month ===
                                                                    "all"
                                                                        ? "Avg Points"
                                                                        : "Points"}
                                                                </div>
                                                                <div className="text-sm font-bold text-green-600">
                                                                    {kpiData.avgPoints?.toFixed(
                                                                        1
                                                                    ) || "0.0"}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-xs text-gray-600 mb-1">
                                                                    Weight
                                                                </div>
                                                                <div className="text-sm font-bold text-orange-600">
                                                                    {kpiData.weight ||
                                                                        "N/A"}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-xs text-gray-600 mb-1">
                                                                    {month ===
                                                                    "all"
                                                                        ? "Avg Score"
                                                                        : "Score"}
                                                                </div>
                                                                <div className="text-sm font-bold text-blue-600">
                                                                    {kpiData.avgScore?.toFixed(
                                                                        1
                                                                    ) || "0.0"}
                                                                    /5
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600 font-medium">
                                                No KPI scored for this month
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 font-medium">
                                    No data available
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Weekly KPI Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="mb-6 shadow-lg w-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-center text-gray-800">
                            {month === "all"
                                ? "Weekly KPI Summary (All Months)"
                                : "Weekly KPI Summary"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {month === "all" && allMonthsData ? (
                            // Show weekly KPI data with months as rows
                            <div className="space-y-4">
                                {(() => {
                                    const monthOrder = [
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

                                    const currentDate = new Date();
                                    const currentMonthIndex =
                                        currentDate.getMonth();
                                    const monthsToShow = monthOrder.slice(
                                        0,
                                        currentMonthIndex + 1
                                    );

                                    const weeklyAggregatedData =
                                        allMonthsData.weeklyMonthlyAggregatedData ||
                                        {};

                                    // Get all unique KPI names across all months
                                    const allKPIs = new Set<string>();
                                    monthsToShow.forEach((monthName) => {
                                        const monthData =
                                            weeklyAggregatedData[monthName];
                                        if (monthData) {
                                            Object.keys(monthData).forEach(
                                                (kpiName) =>
                                                    allKPIs.add(kpiName)
                                            );
                                        }
                                    });

                                    if (allKPIs.size === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 font-medium">
                                                    No weekly KPI data available
                                                    for any month
                                                </p>
                                            </div>
                                        );
                                    }

                                    // Calculate overall performance from aggregated data
                                    let totalPoints = 0;
                                    let totalWeight = 0;
                                    let totalScore = 0;
                                    let kpiCount = 0;

                                    monthsToShow.forEach((monthName) => {
                                        const monthData =
                                            weeklyAggregatedData[monthName];
                                        if (monthData) {
                                            Object.values(monthData).forEach(
                                                (kpiData: any) => {
                                                    totalPoints +=
                                                        kpiData.avgPoints || 0;
                                                    totalWeight +=
                                                        kpiData.weight || 0;
                                                    totalScore +=
                                                        kpiData.avgScore || 0;
                                                    kpiCount++;
                                                }
                                            );
                                        }
                                    });

                                    const avgWeight =
                                        kpiCount > 0
                                            ? totalWeight / kpiCount
                                            : 0;
                                    const avgScore =
                                        kpiCount > 0
                                            ? totalScore / kpiCount
                                            : 0;

                                    return (
                                        <>
                                            {/* Overall Performance Summary */}
                                            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Total Points
                                                        </div>
                                                        <div className="text-lg font-bold text-green-600">
                                                            {totalPoints.toFixed(
                                                                1
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Avg Weight
                                                        </div>
                                                        <div className="text-lg font-bold text-orange-600">
                                                            {avgWeight.toFixed(
                                                                1
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Avg Score
                                                        </div>
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {avgScore.toFixed(
                                                                1
                                                            )}
                                                            /5
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Monthly KPI Table */}
                                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                            <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[150px] font-semibold text-gray-800">
                                                                Month
                                                            </TableHead>
                                                            {Array.from(
                                                                allKPIs
                                                            ).map((kpiName) => (
                                                                <TableHead
                                                                    key={
                                                                        kpiName
                                                                    }
                                                                    className="bg-white text-gray-800 text-center font-semibold min-w-[180px] border-r border-gray-300"
                                                                >
                                                                    <div className="flex flex-col items-center py-2">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {
                                                                                kpiName
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-gray-600 mt-1">
                                                                            Weight
                                                                            -
                                                                            Avg
                                                                            Points
                                                                            -
                                                                            Avg
                                                                            Score
                                                                        </span>
                                                                    </div>
                                                                </TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {monthsToShow
                                                            .map(
                                                                (
                                                                    monthName,
                                                                    monthIndex
                                                                ) => {
                                                                    const monthData =
                                                                        weeklyAggregatedData[
                                                                            monthName
                                                                        ];

                                                                    // Skip months with no data
                                                                    if (
                                                                        !monthData ||
                                                                        Object.keys(
                                                                            monthData
                                                                        )
                                                                            .length ===
                                                                            0
                                                                    ) {
                                                                        return null;
                                                                    }

                                                                    return (
                                                                        <TableRow
                                                                            key={
                                                                                monthName
                                                                            }
                                                                            className={`${
                                                                                monthIndex %
                                                                                    2 ===
                                                                                0
                                                                                    ? "bg-white"
                                                                                    : "bg-gray-50"
                                                                            } hover:bg-gray-100`}
                                                                        >
                                                                            <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800">
                                                                                {
                                                                                    monthName
                                                                                }
                                                                            </TableCell>
                                                                            {Array.from(
                                                                                allKPIs
                                                                            ).map(
                                                                                (
                                                                                    kpiName
                                                                                ) => {
                                                                                    const kpiData =
                                                                                        monthData?.[
                                                                                            kpiName
                                                                                        ];
                                                                                    return (
                                                                                        <TableCell
                                                                                            key={
                                                                                                kpiName
                                                                                            }
                                                                                            className="text-center align-middle border-r border-gray-200"
                                                                                        >
                                                                                            {kpiData ? (
                                                                                                <div className="text-sm font-medium text-gray-900 py-2">
                                                                                                    {kpiData.weight?.toFixed(
                                                                                                        1
                                                                                                    ) ||
                                                                                                        "N/A"}{" "}
                                                                                                    -{" "}
                                                                                                    {kpiData.avgPoints?.toFixed(
                                                                                                        1
                                                                                                    ) ||
                                                                                                        "0.0"}{" "}
                                                                                                    -{" "}
                                                                                                    {kpiData.avgScore?.toFixed(
                                                                                                        1
                                                                                                    ) ||
                                                                                                        "0.0"}
                                                                                                    /5
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-gray-400 text-sm">
                                                                                                    -
                                                                                                </div>
                                                                                            )}
                                                                                        </TableCell>
                                                                                    );
                                                                                }
                                                                            )}
                                                                        </TableRow>
                                                                    );
                                                                }
                                                            )
                                                            .filter(Boolean)}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : data ? (
                            // Show single month weekly data
                            <div className="space-y-4">
                                {/* Weekly Summary Header */}
                                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Total Score
                                            </div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {data?.weeklySummary?.totalScore?.toFixed(
                                                    1
                                                ) || "0.0"}
                                                /5
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Total Weight
                                            </div>
                                            <div className="text-lg font-bold text-orange-600">
                                                {data?.weeklySummary?.totalWeight?.toFixed(
                                                    1
                                                ) || "0.0"}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Total Points
                                            </div>
                                            <div className="text-lg font-bold text-green-600">
                                                {data?.weeklySummary?.totalPoints?.toFixed(
                                                    1
                                                ) || "0.0"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly KPI Table */}
                                {weekKeys.length > 0 &&
                                Object.keys(weeklyGroupedData).some(
                                    (week) =>
                                        Object.keys(weeklyGroupedData[week])
                                            .length > 0
                                ) ? (
                                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                    <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[150px] font-semibold text-gray-800">
                                                        Week
                                                    </TableHead>
                                                    {/* Get all unique KPI names and create columns for each */}
                                                    {(() => {
                                                        const allKPIs =
                                                            new Set<string>();
                                                        Object.values(
                                                            weeklyGroupedData
                                                        ).forEach(
                                                            (weekData) => {
                                                                Object.keys(
                                                                    weekData
                                                                ).forEach(
                                                                    (kpiName) =>
                                                                        allKPIs.add(
                                                                            kpiName
                                                                        )
                                                                );
                                                            }
                                                        );

                                                        return Array.from(
                                                            allKPIs
                                                        ).map(
                                                            (
                                                                kpiName,
                                                                index
                                                            ) => (
                                                                <TableHead
                                                                    key={
                                                                        kpiName
                                                                    }
                                                                    className="bg-white text-gray-800 text-center font-semibold min-w-[150px] border-r border-gray-300"
                                                                >
                                                                    <div className="flex flex-col items-center py-2">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {
                                                                                kpiName
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-gray-600 mt-1">
                                                                            Weight
                                                                            -
                                                                            Points
                                                                            -
                                                                            Score
                                                                        </span>
                                                                    </div>
                                                                </TableHead>
                                                            )
                                                        );
                                                    })()}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {weekKeys.map(
                                                    (weekKey, weekIndex) => (
                                                        <TableRow
                                                            key={weekKey}
                                                            className={`${
                                                                weekIndex %
                                                                    2 ===
                                                                0
                                                                    ? "bg-white"
                                                                    : "bg-gray-50"
                                                            } hover:bg-gray-100`}
                                                        >
                                                            <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800">
                                                                {weekKey}
                                                            </TableCell>
                                                            {/* Get all unique KPI names */}
                                                            {(() => {
                                                                const allKPIs =
                                                                    new Set<string>();
                                                                Object.values(
                                                                    weeklyGroupedData
                                                                ).forEach(
                                                                    (
                                                                        weekData
                                                                    ) => {
                                                                        Object.keys(
                                                                            weekData
                                                                        ).forEach(
                                                                            (
                                                                                kpiName
                                                                            ) =>
                                                                                allKPIs.add(
                                                                                    kpiName
                                                                                )
                                                                        );
                                                                    }
                                                                );

                                                                return Array.from(
                                                                    allKPIs
                                                                ).map(
                                                                    (
                                                                        kpiName
                                                                    ) => {
                                                                        const kpiData =
                                                                            weeklyGroupedData[
                                                                                weekKey
                                                                            ]?.[
                                                                                kpiName
                                                                            ];
                                                                        return (
                                                                            <TableCell
                                                                                key={
                                                                                    kpiName
                                                                                }
                                                                                className="text-center align-middle border-r border-gray-200"
                                                                            >
                                                                                {kpiData ? (
                                                                                    <div className="text-sm font-medium text-gray-900 py-2">
                                                                                        {kpiData.weight ||
                                                                                            "N/A"}{" "}
                                                                                        -{" "}
                                                                                        {kpiData.avgPoints ||
                                                                                            "0.0"}{" "}
                                                                                        -{" "}
                                                                                        {kpiData.avgScore ||
                                                                                            "0"}
                                                                                        /5
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-gray-400 text-sm">
                                                                                        -
                                                                                    </div>
                                                                                )}
                                                                            </TableCell>
                                                                        );
                                                                    }
                                                                );
                                                            })()}
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600 font-medium">
                                            No weekly KPI scored for this period
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 font-medium">
                                    No weekly KPI data available
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
            {/* Daily KPI Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="mb-6 shadow-lg w-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-center text-gray-800">
                                {month === 'all' ? 'Daily KPI Summary (All Months)' : 'Daily KPI Summary'}
                            </CardTitle>
                           
                        </div>
                    </CardHeader>
                   <CardContent className="p-5 flex justify-center items-center">
  <Button
    onClick={() =>
      navigate(
        `/Owner/reports/staff/${id}/daily?start=${startDate}&end=${endDate}&month=${month}&year=${year}`
      )
    }
    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
               text-white px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200 
               flex items-center gap-2 hover:shadow-md hover:scale-105 active:scale-95"
  >
    <Eye className="w-4 h-4" />
    <span className="font-medium">View Daily Report</span>
  </Button>
</CardContent>

                </Card>
            </motion.div>

            {/* Attendance Report */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Attendance Report
                    </h2>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <Card className="mb-6 shadow-lg w-full">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-lg font-bold text-center text-gray-800">
                            {month === 'all' ? 'Overall Attendance (All Months)' : 'Monthly Attendance Overview'}
                        </CardTitle>
                    </CardHeader>

                    {attendanceData ? (
                        <CardContent className="p-4">
                            {/* Debug Logging */}
                            {(() => {
                                console.log("🔍 FRONTEND ATTENDANCE DEBUG:");
                                console.log("Raw attendanceData:", attendanceData);
                                console.log("Has overallSummary:", !!attendanceData.overallSummary);
                                if (attendanceData.overallSummary) {
                                    console.log("Overall Summary:", attendanceData.overallSummary);
                                    console.log("  - totalFullDays:", attendanceData.overallSummary.totalFullDays);
                                    console.log("  - totalHalfDays:", attendanceData.overallSummary.totalHalfDays);
                                    console.log("  - totalLeaves:", attendanceData.overallSummary.totalLeaves);
                                    console.log("  - totalPresentDays:", attendanceData.overallSummary.totalPresentDays);
                                    console.log("  - totalDaysInAllMonths:", attendanceData.overallSummary.totalDaysInAllMonths);
                                    console.log("  - overallAttendancePercentage:", attendanceData.overallSummary.overallAttendancePercentage);
                                } else {
                                    console.log("Single Month Data:");
                                    console.log("  - totalFullDays:", attendanceData.totalFullDays);
                                    console.log("  - totalHalfDays:", attendanceData.totalHalfDays);
                                    console.log("  - totalLeaves:", attendanceData.totalLeaves);
                                    console.log("  - presentDays:", attendanceData.presentDays);
                                    console.log("  - totalDaysInMonth:", attendanceData.totalDaysInMonth);
                                    console.log("  - attendancePercentage:", attendanceData.attendancePercentage);
                                }
                                return null;
                            })()}
                            
                            {/* Attendance Summary - Compact inline format */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-600">
                                        {month === 'all' ? "Total Full Day: " : "Full Day: "}
                                        <span className="font-semibold text-green-600">
                                            {attendanceData.overallSummary 
                                                ? attendanceData.overallSummary.totalFullDays 
                                                : attendanceData.totalFullDays}
                                        </span>
                                    </span>
                                </div>
                                <span className="text-gray-400 text-xs">|</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-xs text-gray-600">
                                        {month === 'all' ? "Total Half Day: " : "Half Day: "}
                                        <span className="font-semibold text-yellow-600">
                                            {attendanceData.overallSummary 
                                                ? attendanceData.overallSummary.totalHalfDays 
                                                : attendanceData.totalHalfDays}
                                        </span>
                                    </span>
                                </div>
                                <span className="text-gray-400 text-xs">|</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-xs text-gray-600">
                                        {month === 'all' ? "Total Leaves: " : "Leaves: "}
                                        <span className="font-semibold text-red-600">
                                            {attendanceData.overallSummary 
                                                ? attendanceData.overallSummary.totalLeaves 
                                                : attendanceData.totalLeaves}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Bar & Percentage */}
                            <div className="flex flex-col justify-center">
                                <div className="relative w-full h-6 bg-gray-200 rounded-lg overflow-hidden">
                                    {(() => {
                                        // Use overallSummary for all months, otherwise use regular data
                                        const totalFullDays = attendanceData.overallSummary 
                                            ? attendanceData.overallSummary.totalFullDays 
                                            : attendanceData.totalFullDays;
                                        const totalHalfDays = attendanceData.overallSummary 
                                            ? attendanceData.overallSummary.totalHalfDays 
                                            : attendanceData.totalHalfDays;
                                        const totalLeaves = attendanceData.overallSummary 
                                            ? attendanceData.overallSummary.totalLeaves 
                                            : attendanceData.totalLeaves;
                                        // For bar chart, use the sum of all attendance types as total days
                                        const totalDays = attendanceData.overallSummary 
                                            ? (attendanceData.overallSummary.totalFullDays + 
                                               attendanceData.overallSummary.totalHalfDays + 
                                               attendanceData.overallSummary.totalLeaves)
                                            : (attendanceData.totalFullDays + 
                                               attendanceData.totalHalfDays + 
                                               attendanceData.totalLeaves);

                                        console.log("🎯 BAR CHART CALCULATION:");
                                        console.log("  - totalFullDays:", totalFullDays);
                                        console.log("  - totalHalfDays:", totalHalfDays);
                                        console.log("  - totalLeaves:", totalLeaves);
                                        console.log("  - totalDays:", totalDays);
                                        console.log("  - Expected Total:", totalFullDays + totalHalfDays + totalLeaves);

                                        const f = (totalFullDays / totalDays) * 100;
                                        const h = (totalHalfDays / totalDays) * 100;
                                        const l = (totalLeaves / totalDays) * 100;
                                        
                                        console.log("  - Full Days %:", f);
                                        console.log("  - Half Days %:", h);
                                        console.log("  - Leaves %:", l);
                                        console.log("  - Total %:", f + h + l);

                                        return (
                                            <>
                                                <motion.div
                                                    className="absolute h-full"
                                                    style={{
                                                        backgroundColor:
                                                            "#10B981",
                                                        width: `${f}%`,
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${f}%` }}
                                                    transition={{
                                                        duration: 0.8,
                                                        ease: "easeOut",
                                                    }}
                                                    title={`Full Days: ${totalFullDays}`}
                                                />
                                                <motion.div
                                                    className="absolute h-full"
                                                    style={{
                                                        left: `${f}%`,
                                                        backgroundColor:
                                                            "#F59E0B",
                                                        width: `${h}%`,
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${h}%` }}
                                                    transition={{
                                                        duration: 0.8,
                                                        ease: "easeOut",
                                                        delay: 0.1,
                                                    }}
                                                    title={`Half Days: ${totalHalfDays}`}
                                                />
                                                <motion.div
                                                    className="absolute h-full"
                                                    style={{
                                                        left: `${f + h}%`,
                                                        backgroundColor:
                                                            "#EF4444",
                                                        width: `${l}%`,
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${l}%` }}
                                                    transition={{
                                                        duration: 0.8,
                                                        ease: "easeOut",
                                                        delay: 0.2,
                                                    }}
                                                    title={`Leaves: ${totalLeaves}`}
                                                />
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="text-center mt-4">
                                    {(() => {
                                        const attendancePercentage = attendanceData.overallSummary
                                            ? attendanceData.overallSummary.overallAttendancePercentage
                                            : attendanceData.attendancePercentage;
                                        const presentDays = attendanceData.overallSummary
                                            ? attendanceData.overallSummary.totalPresentDays
                                            : attendanceData.presentDays;
                                        const totalDays = attendanceData.overallSummary
                                            ? attendanceData.overallSummary.totalDaysInAllMonths
                                            : attendanceData.totalDaysInMonth;

                                        console.log("📊 PERCENTAGE DISPLAY CALCULATION:");
                                        console.log("  - attendancePercentage:", attendancePercentage);
                                        console.log("  - presentDays:", presentDays);
                                        console.log("  - totalDays:", totalDays);
                                        console.log("  - Display: ", presentDays, "/", totalDays, "days present");
                                        console.log("  - Percentage:", parseFloat(attendancePercentage).toFixed(1) + "%");

                                        return (
                                            <>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        {month === 'all' ? "Total Percentage" : "Attendance Percentage"}
                                                    </p>
                                                    <p
                                                        className={`text-2xl font-bold ${
                                                            parseFloat(attendancePercentage) >= 80
                                                                ? "text-green-600"
                                                                : parseFloat(attendancePercentage) >= 60
                                                                ? "text-blue-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        {parseFloat(attendancePercentage).toFixed(1)}%
                                                    </p>
                                                </div>

                                                <p className="text-sm text-gray-500">
                                                    {presentDays}/{totalDays} days present
                                                    {attendanceData.overallSummary && (
                                                        <>
                                                            <span className="text-xs block mt-1">
                                                                (Across {attendanceData.overallSummary.monthsWithData} month{attendanceData.overallSummary.monthsWithData > 1 ? 's' : ''})
                                                            </span>
                                                            <div className="text-xs text-gray-400 mt-2 space-y-1">
                                                                <div>Average: {attendanceData.overallSummary.averageDaysPerMonth} days/month</div>
                                                                <div>Total Days: {attendanceData.overallSummary.totalDaysInAllMonths} days</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </CardContent>
                    ) : (
                        <CardContent className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-3">
                                📅
                            </div>
                            <p className="text-gray-600 font-medium">
                                No attendance found for this month
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Attendance data will appear here once recorded
                            </p>
                        </CardContent>
                    )}
                </Card>
            </motion.div>

            {/* Sales Report */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Sales Report
                    </h2>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <Card className="mb-6 shadow-lg w-full">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-lg font-bold text-center text-gray-800">
                            Sales by Year Code
                        </CardTitle>
                    </CardHeader>

                    {salesData &&
                    salesData.salesByYearCode &&
                    salesData.salesByYearCode.length > 0 ? (
                        <CardContent className="p-6 space-y-4">
                            {/* Pie Chart */}
                            <div className="w-full h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={salesData.salesByYearCode.map(
                                                (item: any) => ({
                                                    name: item.yearCode,
                                                    value: parseFloat(
                                                        item.totals.salesAmount
                                                    ),
                                                })
                                            )}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${(
                                                    percent * 100
                                                ).toFixed(0)}%`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {salesData.salesByYearCode.map(
                                                (item: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={item.color.code}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) =>
                                                `₹${value.toFixed(2)}`
                                            }
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* View More Button */}
                            <div className="text-center pt-4">
                                <Button
                                    onClick={() =>
                                        setShowDetailedSales(!showDetailedSales)
                                    }
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-6 px-12 w-full max-w-md mx-auto text-lg flex items-center justify-center gap-3 shadow-lg"
                                >
                                    {showDetailedSales ? (
                                        <span className="flex items-center gap-2">
                                            Hide Details{" "}
                                            <ChevronsDown className="rotate-180 transition-transform" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            View Full Details{" "}
                                            <ChevronsDown className="animate-bounce" />
                                        </span>
                                    )}
                                </Button>
                            </div>

                            {/* Detailed View - Table Format */}
                            {showDetailedSales && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-6"
                                >
                                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 z-10 bg-white">
                                                <TableRow className="bg-gray-100">
                                                    <TableHead className="font-bold sticky left-0 z-10 bg-gray-100">
                                                        Year Code
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Quantity Sold
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Sales Amount
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Production Value
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Profit
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Percentage (%)
                                                    </TableHead>
                                                    <TableHead className="font-bold">
                                                        Points
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesData.salesByYearCode.map(
                                                    (
                                                        item: any,
                                                        index: number
                                                    ) => (
                                                        <TableRow
                                                            key={index}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <TableCell className="sticky left-0 z-10 bg-white">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-4 h-4 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                item
                                                                                    .color
                                                                                    .code,
                                                                        }}
                                                                    ></div>
                                                                    <span className="font-semibold">
                                                                        {
                                                                            item.yearCode
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {
                                                                    item.totals
                                                                        .qtySold
                                                                }
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                ₹
                                                                {parseFloat(
                                                                    item.totals
                                                                        .salesAmount
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                ₹
                                                                {parseFloat(
                                                                    item.totals
                                                                        .prodValue
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-green-600">
                                                                ₹
                                                                {parseFloat(
                                                                    item.totals
                                                                        .profit
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {parseFloat(
                                                                    item.totals
                                                                        .per
                                                                ).toFixed(2)}
                                                                %
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {parseFloat(
                                                                    item.totals
                                                                        .points
                                                                ).toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    ) : (
                        <CardContent className="text-center py-8">
                            <div className="text-red-500 text-4xl mb-3 flex justify-center">
                                <Tag className="w-10 h-10" />
                            </div>

                            <p className="text-gray-600 font-medium">
                                No sales found for this period
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Sales data will appear here once recorded
                            </p>
                        </CardContent>
                    )}
                </Card>
            </motion.div>

           
        </div>
    );
};
