import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    AlertCircle,
    Award,
    Building,
    Layers,
    Star,
    UserX,
} from "lucide-react";

import {
    Download,
    X,
    FileText,
    Sheet,
    User,
    Phone,
    TrendingUp,
} from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/spinner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface StaffData {
    id:string;
    staffId: string;
    name: string;
    mobile: string;
    role: string;
    section: string;
    floor: string;
    avgScore: number;
    joinDate: string;
    kpiScores: { [key: string]: number };
    totalKPIs: number;
}

interface SummaryData {
    totalStaff: number;
    avgScore: number;
}
interface StaffCardProps {
    name: string;
    staffId: string;
    mobile?: string;
    score: number;
    role: string;
}
interface KPIScoreCardProps {
    kpiScores: Record<string, number>;
    totalKPIs: number;
}

export const StaffReportView: React.FC = () => {
    const [staffReport, setStaffReport] = useState<{ [key: string]: StaffData[] }>({});
    const [pdfLoading, setPdfLoading] = useState(false);

    const [excelLoading, setExcelLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<{ [key: string]: SummaryData }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const dispatch = useDispatch();
    const location = useLocation();

    const query = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );
    const navigate = useNavigate();

    const startDate = query.get("start");
    const endDate = query.get("end");
    const month = query.get("month");
    const year = query.get("year");

    const downloadFile = (blob: Blob, fileName: string) => {
        try {
            saveAs(blob, fileName);
            toast.success("Download started");
        } catch (e: any) {
            console.error(e);
            toast.error("Export failed");
        }
    };
    const StaffInfo: React.FC<StaffCardProps> = ({
        name,
        staffId,
        mobile,
        score,
        role,
    }) => {
        const roleColors: Record<string, string> = {
            Staff: "bg-green-100 text-green-800",
            FloorSupervisor: "bg-blue-100 text-blue-800",
            Accountant: "bg-purple-100 text-purple-800",
            Admin: "bg-red-100 text-red-800",
            Default: "bg-gray-100 text-gray-800",
        };

        const roleClass = roleColors[role] || roleColors["Default"];

        return (
            <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Profile Circle */}
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                            {name ? name.charAt(0).toUpperCase() : "?"}
                        </div>

                        {/* Name, Role, ID, Mobile */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {name}
                                </h3>
                                <span
                                    className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${roleClass} shadow-sm`}
                                >
                                    {role}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                                ID: {staffId} &nbsp;|&nbsp; Phone:{" "}
                                {mobile || "N/A"}
                            </p>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                        <Star className="w-4 h-4" />
                        <span>{score}</span>
                    </div>
                </div>
            </div>
        );
    };
    const KPIScoreCard: React.FC<KPIScoreCardProps> = ({
        kpiScores,
        totalKPIs,
    }) => {
        if (!kpiScores || Object.keys(kpiScores).length === 0) return null;

        return (
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    KPI Scores ({totalKPIs} KPIs)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(kpiScores).map(([kpiName, kpiScore]) => (
                        <div
                            key={kpiName}
                            className="flex justify-between items-center text-xs"
                        >
                            <span className="text-gray-600 truncate">
                                {kpiName}
                            </span>
                            <span className="font-semibold text-blue-600 ml-2">
                                {kpiScore}/5
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
   

    const LocationBlock: React.FC<any> = ({ section, floor }) => (
        <div className="pt-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Section Box */}
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500">Section</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {section || "None"}
                        </p>
                    </div>
                </div>

                {/* Floor Box */}
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <Layers className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500">Floor</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {floor}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    useEffect(() => {
    const fetchStaffReport = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Always use the regular API to get all staff in the date range
            const res = await axiosInstance.get("/owner/staffReport", {
                params: {
                    start: startDate,
                    end: endDate,
                    month: month,
                    year: year,
                },
            });

            console.log("Staff report API response:", res.data);

            if (res.data.success) {
                // Convert array to object format for consistency - show all staff in one group
                const staffArray = res.data.staffReport || [];
                setStaffReport({ "All Staff": staffArray });
                setSummaryData({ "All Staff": res.data.summary || { totalStaff: 0, avgScore: 0 } });
            } else {
                setError(res.data.error || "Failed to fetch staff report");
                toast.error(res.data.error || "Failed to fetch staff report");
            }
            } catch (err: any) {
                console.error("Fetch Staff Report error:", err);

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
                } else {
                    setError(
                        "Failed to fetch staff report. Please try again later."
                    );
                    toast.error(
                        err.response?.data?.error ||
                            "Failed to fetch staff report"
                    );
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (!startDate || !endDate || (startDate && endDate)) {
            fetchStaffReport();
        }
    }, [startDate, endDate, month, dispatch]);

    const [currentView, setCurrentView] = useState("staffReport");

    const getDateRangeLabel = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Check if it's the same month
            if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                const year = start.getFullYear();
                const month = start.getMonth();
                const lastDay = new Date(year, month + 1, 0).getDate();
                const monthName = start.toLocaleDateString("en-IN", { month: "short" });
                
                return `1st - ${lastDay}${lastDay === 31 ? 'st' : 'th'} ${monthName} ${year}`;
            } else {
                // Different months - show full range
                const startFormatted = start.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
                const endFormatted = end.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
                return `${startFormatted} - ${endFormatted}`;
            }
        }
        return "All Time";
    };

   


    if (currentView !== "staffReport") return null;

    // Loading state
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Error state
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
            {/* <Button
        className="bg-transparent border border-gray-300 hover:bg-gray-100 text-black p-2 rounded-full"
        onClick={() => setModalOpen(true)}
    >
        <Download className="h-7 w-7" />
    </Button> */}


            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="h-full">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Staff</p>
                                    <p className="text-xl font-bold">
                                        {Object.values(summaryData).reduce((total, monthData) => total + monthData.totalStaff, 0)}
                                    </p>
                                </div>
                                <User className="h-6 w-6 text-[#FF3F33]" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Avg Score</p>
                                    <p className="text-xl font-bold">
                                        {Object.values(summaryData).length > 0 
                                            ? (Object.values(summaryData).reduce((total, monthData) => total + monthData.avgScore, 0) / Object.values(summaryData).length).toFixed(1)
                                            : '0.0'
                                        }
                                    </p>
                                </div>
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Staff Cards */}
            {Object.keys(staffReport).length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                        <UserX className="h-12 w-12 text-gray-400" />
                        <span>
                            No staff data found for the selected date range.
                        </span>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(staffReport).map(([groupName, staffList]: [string, StaffData[]]) => (
                        <div key={groupName} className="space-y-4">
                            {staffList?.map((staff, index) => (
                                <motion.div
                                    key={staff.staffId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden p-4 cursor-pointer"
                                        onClick={() =>
                                            navigate(
                                                `/Owner/reports/staff/${staff.id}?start=${startDate}&end=${endDate}&month=${month}&year=${year}`
                                            )
                                        }
                                    >
                                        {/* First Line: Icon, Name, Badge */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                                {staff.name ? staff.name.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {staff.name}
                                            </h3>
                                            <span className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${
                                                staff.role === 'Staff' ? 'bg-green-100 text-green-800' :
                                                staff.role === 'FloorSupervisor' ? 'bg-blue-100 text-blue-800' :
                                                staff.role === 'Accountant' ? 'bg-purple-100 text-purple-800' :
                                                staff.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            } shadow-sm`}>
                                                {staff.role}
                                            </span>
                                            <div className="flex items-center gap-1 text-yellow-500 font-semibold ml-auto">
                                                <Star className="w-4 h-4" />
                                                <span>{staff.avgScore}</span>
                                            </div>
                                        </div>

                                        {/* Second Line: ID | Floor | Section */}
                                        <div className="text-sm text-gray-600 mb-3">
                                            <span className="font-mono">ID: {staff.staffId}</span>
                                            <span className="mx-2">|</span>
                                            <span>Floor: {staff.floor}</span>
                                            <span className="mx-2">|</span>
                                            <span>Section: {staff.section || 'None'}</span>
                                        </div>

                                        {/* KPI Scores - 2 column grid with separators */}
                                        {staff.kpiScores && Object.keys(staff.kpiScores).length > 0 && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(staff.kpiScores).map(([kpiName, kpiScore]) => (
                                                    <div key={kpiName} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 truncate">{kpiName}</span>
                                                        <span className="mx-2">|</span>
                                                        <span className="font-semibold text-blue-600">{kpiScore}/5</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

           
        </div>
    );
};