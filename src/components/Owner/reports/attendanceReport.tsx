import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import {
    Calendar,
    Download,
    UserCheck,
    Clock,
    Users,
    FileText,
    Sheet,
    TrendingUp,
    CalendarDays,
    UserMinus,
    CheckCircle,
    X,
    User,
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { LoadingSpinner } from "@/components/ui/spinner";

// Summary Card Component (matching Owner Dashboard style)
const SummaryCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="h-full">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-xl font-bold">{typeof value === "number" ? formatNumberShort(value) : value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-600">{subtitle}</p>
                    )}
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </CardContent>
    </Card>
);

// Format big numbers (500000 → 500K, 1200000 → 1.2M)
const formatNumberShort = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
};

// Get number of days in a specific month and year
const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
};

// Calculate attendance percentage based on actual month days
const calculateAttendancePercentage = (fullDays: string | number, halfDays: string | number, month: number, year: number) => {
    const fullDaysNum = Number(fullDays) || 0;
    const halfDaysNum = Number(halfDays) || 0;
    const totalDays = getDaysInMonth(month, year);
    const percentage = ((fullDaysNum + 0.5 * halfDaysNum) / totalDays) * 100;
    return Math.min(percentage, 100); // Cap at 100%
};

// Attendance Data Interface
interface AttendanceData {
    id: string;
    staffId: string;
    staffName: string;
    date: string;
    fullDays: number;
    halfDays: number;
    leaveCount: number;
    totalDays: number;
    totalDaysInMonth?: number;
    staff?: {
        id: string;
        name: string;
        uniqueId: string;
        role: string;
        section: string;
        floor?: { name: string };
    };
}

interface AttendanceSummary {
    totalStaff: number;
    totalAttendance: number;
    totalFullDays: number;
    totalHalfDays: number;
    totalLeaves: number;
}

export default function AttendanceReportPage() {
    const dispatch = useDispatch();

    const location = useLocation();
    
    // Get month and year from URL parameters
    const query = new URLSearchParams(location.search);
    const monthParam = query.get("month");
const month = monthParam === "all"
  ? "all"
  : Number(monthParam) === 12
    ? 1
    : Number(monthParam) + 1;

    const year = query.get("year");
    
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    const [isMonthYearModalOpen, setIsMonthYearModalOpen] = useState(false);
    const [attendance, setAttendance] = useState<AttendanceData[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary>({
        totalStaff: 0,
        totalAttendance: 0,
        totalFullDays: 0,
        totalHalfDays: 0,
        totalLeaves: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [allMonthsData, setAllMonthsData] = useState<any>(null);
    

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

    const years = Array.from(
        { length: 10 },
        (_, i) => new Date().getFullYear() - i
    );

    useEffect(() => {
        console.log("=== ATTENDANCE REPORT MONTH STATE ===");
        console.log("month from URL:", month);
        console.log("year from URL:", year);
        console.log("selectedYear:", selectedYear);
        console.log("======================================");
        
        const fetchAttendance = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // If "all" is selected, fetch all months data
                if (month === 'all') {
                    const res = await axiosInstance.get("/owner/all-months-attendanceReport", {
                        params: { year: selectedYear },
                    });
                    
                    if (res.data?.success) {
                        console.log("All months data received:", res.data.data);
                        console.log("Staff count:", res.data.data?.staff?.length);
                        console.log("Summary:", res.data.data?.summary);
                        setAllMonthsData(res.data.data || {});
                        setAttendance([]); // Clear single month data
                        setSummary({
                            totalStaff: 0,
                            totalAttendance: 0,
                            totalFullDays: 0,
                            totalHalfDays: 0,
                            totalLeaves: 0,
                        });
                    } else {
                        console.error("All months data error:", res.data?.error);
                        setError(res.data?.error || "Failed to fetch all months attendance data");
                        toast.error(res.data?.error || "Failed to fetch all months attendance data");
                    }
                } else {
                    // Fetch single month data
                    const res = await axiosInstance.get("/owner/attendanceReport", {
                        params: { month: month, year: selectedYear },
                    });
                    console.log(res.data,"87897897");
                    
                    if (res.data?.success) {
                        setAttendance(res.data.attendance || []);
                        setSummary(
                            res.data.summary || {
                                totalStaff: 0,
                                totalAttendance: 0,
                                totalFullDays: 0,
                                totalHalfDays: 0,
                                totalLeaves: 0,
                            }
                        );
                        setAllMonthsData(null); // Clear all months data
                    } else {
                        setError(
                            res.data?.error || "Failed to fetch attendance report"
                        );
                        toast.error(
                            res.data?.error || "Failed to fetch attendance report"
                        );
                    }
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    const response: any = await logoutOwner();
                    if (response.success) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        dispatch(clearUser());
                    } else {
                        console.error("Logout failed on backend");
                    }
                } else if (err.response?.status === 400) {
                    setError(
                        err.response.data.error || "Invalid request parameters"
                    );
                    toast.error(
                        err.response.data.error || "Invalid request parameters"
                    );
                }
                setError(
                    err.response?.data?.error ||
                        "Failed to fetch attendance report"
                );
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [month, selectedYear, dispatch]);

    const hasAttendance = attendance.length > 0;

    // Helper function to get month name
    const getMonthName = () => {
        if (month === 'all') return 'All Months';
        return months[(month as number) - 1];
    };

    const handleExportPDF = async () => {
        setPdfLoading(true);
        try {
            const { data } = await axiosInstance.get(
                `/owner/attendanceReport/export`,
                {
                    params: {
                        format: "pdf",
                        month: month,
                        year: selectedYear,
                    },
                    responseType: "blob",
                }
            );
            const blob = new Blob([data], { type: "application/pdf" });
            saveAs(
                blob,
                `Attendance-Report-${selectedYear}-${month}.pdf`
            );
            toast.success("PDF download started");
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                const response: any = await logoutOwner();
                if (response.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    dispatch(clearUser());
                } else {
                    console.error("Logout failed on backend");
                }
            }
            toast.error("Failed to download PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setExcelLoading(true);
        try {
            const { data } = await axiosInstance.get(
                `/owner/attendanceReport/export`,
                {
                    params: {
                        format: "excel",
                        month: month,
                        year: selectedYear,
                    },
                    responseType: "blob",
                }
            );
            const blob = new Blob([data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            saveAs(
                blob,
                `Attendance-Report-${selectedYear}-${month}.xlsx`
            );
            toast.success("Excel download started");
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                const response: any = await logoutOwner();
                if (response.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    dispatch(clearUser());
                } else {
                    console.error("Logout failed on backend");
                }
            }
            toast.error("Failed to export Excel");
        } finally {
            setExcelLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
           

            {loading && <LoadingSpinner />}

            {/* Empty State - Show when no data and not loading (removed - using table message instead) */}
            {false && !loading && !error && month !== 'all' && !hasAttendance && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16"
                >
                    <motion.div
                        className="p-6 bg-gray-100 rounded-full mb-6 cursor-pointer shadow-md hover:shadow-lg border-2 border-transparent hover:border-gray-400 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <UserCheck className="h-16 w-16 text-gray-400" />
                    </motion.div>

                    <h3 className="text-xl font-medium mb-2">
                        No Attendance Found
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        No attendance data available for {getMonthName()}{" "}
                        {selectedYear}.
                    </p>
                    
                </motion.div>
            )}

            {/* Error State */}
            {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                >
                            <motion.div
                        className="p-6 bg-red-100 rounded-full mb-6 shadow-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <X className="h-16 w-16 text-red-500" />
                            </motion.div>

                    <h3 className="text-xl font-medium mb-2 text-red-800">
                        Error Loading Data
                    </h3>
                    <p className="text-red-600 text-center max-w-md mb-6">
                        {error}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-md shadow-md transition-colors duration-200"
                    >
                        Try Again
                    </Button>
                            </motion.div>
            )}

            {/* Summary Cards for Specific Month */}
            {!loading && month !== 'all' && hasAttendance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <SummaryCard 
                            title="Staff" 
                            value={attendance.length} 
                                    icon={User} 
                                    color="text-[#FF3F33]" 
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <SummaryCard 
                                    title="Full Days" 
                            value={attendance.reduce((sum, record) => sum + Number(record.fullDays || 0), 0)} 
                                    icon={CheckCircle} 
                                    color="text-green-500" 
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <SummaryCard 
                                    title="Half Days" 
                            value={attendance.reduce((sum, record) => sum + Number(record.halfDays || 0), 0)} 
                                    icon={Clock} 
                                    color="text-yellow-500" 
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <SummaryCard 
                            title="Leaves" 
                            value={attendance.reduce((sum, record) => sum + Number(record.leaveCount || 0), 0)} 
                                    icon={X} 
                                    color="text-red-500" 
                                />
                            </motion.div>
                </div>
            )}

            {/* Summary Cards - Only show when month is "all" */}
            {!loading && month === 'all' && allMonthsData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <SummaryCard 
                                    title="Total Staff" 
                                    value={allMonthsData.summary?.totalStaff || 0} 
                                    icon={User} 
                                    color="text-[#FF3F33]" 
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <SummaryCard 
                                    title="Avg Full Days" 
                                    value={allMonthsData.summary?.avgFullDays || 0} 
                                    icon={CheckCircle} 
                                    color="text-green-500" 
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <SummaryCard 
                                    title="Avg Half Days" 
                                    value={allMonthsData.summary?.avgHalfDays || 0} 
                                    icon={Clock} 
                                    color="text-yellow-500" 
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <SummaryCard 
                                    title="Avg Leaves" 
                                    value={allMonthsData.summary?.avgLeaves || 0} 
                                    icon={X} 
                                    color="text-red-500" 
                                />
                            </motion.div>
                </div>
            )}

            {/* Single Month Attendance Table */}
            {!loading && month !== 'all' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Attendance Records
                        </h3>
                        <p className="text-sm text-gray-500">
                            {getMonthName()} {selectedYear}
                        </p>
                    </div>

                    {hasAttendance ? (
                    <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200 shadow-sm">
                                        Staff
                                    </th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Full Days
                                    </th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Half Days
                                    </th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Leaves
                                    </th>
                                       
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Present Days
                                    </th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Days in Month
                                        </th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Percentage
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {attendance.map((record, index) => {
                                    const totalDaysInMonth = record.totalDaysInMonth || 30;
                                    const totalDays = Number(record.totalDays || 0);
                                    const attendancePercentage = totalDaysInMonth > 0 ? Math.round((totalDays / totalDaysInMonth) * 100) : 0;

                                    return (
                                        <motion.tr
                                            key={record.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                                <td className="px-3 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200 shadow-sm">
                                                <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-gray-600 font-semibold text-sm">
                                                                {record.staff?.name?.charAt(0)?.toUpperCase() || 'S'}
                                                            </span>
                                                        </div>
                                                    <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {record.staff?.name || "Unknown Staff"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                                ID: {record.staff?.uniqueId || record.staffId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                                <Badge
                                                    variant="outline"
                                                        className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1"
                                                >
                                                    {record.fullDays}
                                                </Badge>
                                            </td>
                                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                                <Badge
                                                    variant="outline"
                                                        className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-1"
                                                >
                                                    {record.halfDays}
                                                </Badge>
                                            </td>
                                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                                <Badge
                                                    variant="outline"
                                                        className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-1"
                                                >
                                                    {record.leaveCount}
                                                </Badge>
                                            </td>
                                             
                                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-1"
                                                    >
                                                        {record.totalDays || 0}
                                                    </Badge>
                                            </td>
                                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2 py-1"
                                                    >
                                                        {record.totalDaysInMonth || 30}
                                                    </Badge>
                                                </td>
                                                <td className="px-2 py-3 whitespace-nowrap text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs px-2 py-1 ${
                                                            attendancePercentage >= 90 
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : attendancePercentage >= 70
                                                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}
                                                    >
                                                        {attendancePercentage.toFixed(0)}%
                                                    </Badge>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <p>No attendance records found for {getMonthName()} {selectedYear}</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* All Months Empty State */}
            {!loading && month === 'all' && !allMonthsData && !error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16"
                >
                    <motion.div
                        className="p-6 bg-gray-100 rounded-full mb-6 cursor-pointer shadow-md hover:shadow-lg border-2 border-transparent hover:border-gray-400 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <UserCheck className="h-16 w-16 text-gray-400" />
                    </motion.div>

                    <h3 className="text-xl font-medium mb-2">
                        No Data Available
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                        No attendance data available for all months in {selectedYear}.
                    </p>
                </motion.div>
            )}

            {/* All Months Table */}
            {!loading && month === 'all' && allMonthsData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            All Months Attendance Summary
                        </h3>
                        <p className="text-sm text-gray-500">
                            {allMonthsData?.staff?.length || 0} staff members
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200 shadow-sm">
                                        Staff
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Full Days
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Half Days
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Leaves
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Present Days
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Days in Month
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {allMonthsData.staff?.map((staff: any, index: number) => (
                                    <motion.tr
                                        key={staff.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-3 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200 shadow-sm">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-gray-600 font-semibold text-sm">
                                                        {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {staff.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {staff.staffId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap text-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1"
                                            >
                                                {staff.totalFullDays}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap text-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-1"
                                            >
                                                {staff.totalHalfDays}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap text-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-1"
                                            >
                                                {staff.totalLeaves}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap text-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1"
                                            >
                                                {staff.totalPresentDays || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap text-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2 py-1"
                                            >
                                                {staff.totalDaysInMonth || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap text-center">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs px-2 py-1 ${
                                                    staff.totalPercentage >= 90 
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : staff.totalPercentage >= 70
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                }`}
                                            >
                                                {staff.totalDaysInMonth > 0 ? Math.round((staff.totalPresentDays / staff.totalDaysInMonth) * 100) : 0}%
                                            </Badge>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Month/Year Selection Modal */}
            <Dialog
                open={isMonthYearModalOpen}
                onOpenChange={setIsMonthYearModalOpen}
            >
                <DialogContent className="w-[95%] max-w-[20rem] sm:max-w-[16rem] rounded-lg border border-gray-200 shadow-lg px-4 py-6 mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-center text-lg font-semibold">
                                Select Month & Year
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Month and year are controlled by the URL parameters.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Current: {getMonthName()} {selectedYear}
                            </p>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-6"
                        >
                            <Button
                                onClick={() => setIsMonthYearModalOpen(false)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 text-sm rounded-md shadow-md transition-colors duration-200"
                            >
                                Close
                            </Button>
                        </motion.div>
                    </motion.div>
                </DialogContent>
            </Dialog>

            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Export Report
                                </h2>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    aria-label="Close modal"
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-sm text-gray-600">
                                    Choose a format:
                                </p>

                                {/* ----------  PDF BUTTON  ---------- */}
                                <button
                                    onClick={handleExportPDF}
                                    disabled={pdfLoading || !hasAttendance}
                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
                                    ${pdfLoading || !hasAttendance
                                        ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed'
                                        : 'bg-white border-gray-200 hover:bg-gray-50 active:scale-95'}`}
                                >
                                    <div className={`p-2 rounded-lg ${pdfLoading ? 'bg-gray-200' : 'bg-red-100'}`}>
                                        {pdfLoading ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                {/* tiny spinner */}
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <FileText className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            {pdfLoading ? 'Preparing PDF…' : 'Export as PDF'}
                                        </div>
                                        <div className="text-xs text-gray-500">Portable Document</div>
                                    </div>
                                </button>

                                {/* ----------  EXCEL BUTTON  ---------- */}
                                <button
                                    onClick={handleExportExcel}
                                    disabled={excelLoading || !hasAttendance}
                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
                                    ${excelLoading || !hasAttendance
                                        ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed'
                                        : 'bg-white border-gray-200 hover:bg-gray-50 active:scale-95'}`}
                                >
                                    <div className={`p-2 rounded-lg ${excelLoading ? 'bg-gray-200' : 'bg-green-100'}`}>
                                        {excelLoading ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                {/* tiny spinner */}
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <Sheet className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            {excelLoading ? 'Preparing Excel…' : 'Export as Excel'}
                                        </div>
                                        <div className="text-xs text-gray-500">Spreadsheet (.xlsx)</div>
                                    </div>
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-3xl">
                                <p className="text-xs text-gray-500 text-center">
                                    Download will start automatically
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}