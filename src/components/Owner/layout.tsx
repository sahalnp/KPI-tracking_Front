// src/pages/supervisor/SupervisorLayout.tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserAuth } from "@/hooks/useAuth";
import {
    Home,
    ClipboardCheck,
    UserX,
    User,
    Users,
    LayoutDashboard,
    Target,
    HomeIcon,
    BarChart,
    Settings,
    ArrowLeft,
    Download,
    X,
    FileText,
    Sheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { axiosInstance } from "@/api/axios";

interface BottomNavProps {
    userRole: string;
    currentPage: string;
    onNavigate: (page: string) => void;
}

function BottomNav({ userRole, currentPage, onNavigate }: BottomNavProps) {
    const supervisorTabs = [
        {
            id: "dashboard",
            label: "Home",
            icon: HomeIcon,
            to: "/owner/dashboard",
        },
        { id: "scoring", label: "Scoring", icon: ClipboardCheck },
        { id: "reports", label: "Reports", icon: BarChart, to: "/owner/reports" },

        { id: "account", label: "Settings", icon: Settings, to: "/owner/account" },
    ];

    const tabs = userRole === "Owner" ? supervisorTabs : [];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
            <div className="flex">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentPage === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onNavigate(tab.id)}
                            className="flex-1 flex flex-col items-center py-2 px-1 relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[#FF3F33]/10 rounded-t-lg"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        bounce: 0.2,
                                        duration: 0.6,
                                    }}
                                />
                            )}
                            <Icon
                                className={`w-6 h-6 mb-1 ${
                                    isActive
                                        ? "text-[#FF3F33]"
                                        : "text-gray-400"
                                }`}
                            />
                            <span
                                className={`text-xs ${
                                    isActive
                                        ? "text-[#FF3F33]"
                                        : "text-gray-400"
                                }`}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function OwnerLayout() {
    const { user } = UserAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    // Check if we're on any report page (not the main reports page)
    const pathParts = location.pathname.split("/");
    const isMainReportsPage = pathParts[1] === "Owner" && 
                             pathParts[2] === "reports" && 
                             pathParts.length === 3; // /Owner/reports
    
    const isAnyReportPage = pathParts[1] === "Owner" && 
                           pathParts[2] === "reports" && 
                           pathParts.length > 3; // /Owner/reports/anything
    
    // Get the report type for the header title
    const getReportTitle = () => {
        if (pathParts[3] === "staff") {
            if (pathParts[4] && !pathParts[4].includes("daily")) {
                return "Staff Details";
            }
            return "Staff Reports";
        } else if (pathParts[3] === "attendance") {
            return "Attendance Reports";
        } else if (pathParts[3] === "sales") {
            return "Sales Reports";
        } else if (pathParts[3] === "walkout") {
            return "Walkout Reports";
        }
        return "Reports";
    };

    // Get staff ID from URL for download functionality
    const getStaffId = () => {
        const pathParts = location.pathname.split("/");
        return pathParts[pathParts.length - 1];
    };

    // Get date range from URL params for KPI details page
    const getDateRange = () => {
        const searchParams = new URLSearchParams(location.search);
        const startDate = searchParams.get("start");
        const endDate = searchParams.get("end");
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        
        if (startDate && endDate) {
            return `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        } else if (month === 'all' && year) {
            // Show "January 1st to current month 30th" for "all" month selection
            const currentDate = new Date();
            const yearNum = parseInt(year);
            const currentYear = currentDate.getFullYear();
            
            if (yearNum === currentYear) {
                // Current year - show January 1st to current month 30th
                const jan1 = new Date(yearNum, 0, 1).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric'
                });
                const currentMonth = currentDate.getMonth();
                const currentMonthName = new Date(yearNum, currentMonth, 1).toLocaleDateString('en-US', {
                    month: 'long'
                });
                return `${jan1} to ${currentMonthName} 30, ${yearNum}`;
            } else {
                // Past years - show all year
                return `all ${year}`;
            }
        } else if (month && year) {
            const monthIndex = parseInt(month);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[monthIndex] || 'Unknown';
            return `${monthName} ${year}`;
        }
        return 'Current Period';
    };

    // Download functions
    const handleExportPDF = async (period: string) => {
        setPdfLoading(true);
        try {
            const reportType = pathParts[3];
            const staffId = getStaffId();
            let endpoint = '';
            let filename = '';

            if (reportType === 'staff' && staffId) {
                endpoint = `/owner/staff/${staffId}/kpi-details/export?format=pdf&period=${period}`;
                filename = `Staff-KPI-${period}.pdf`;
            } else if (reportType === 'attendance') {
                endpoint = `/owner/attendance-report/export?format=pdf&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
                filename = `Attendance-Report-${period}.pdf`;
            } else if (reportType === 'sales') {
                endpoint = `/owner/sales-report/export?format=pdf&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
                filename = `Sales-Report-${period}.pdf`;
            } else if (reportType === 'walkout') {
                endpoint = `/owner/walkout-report/export?format=pdf&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
                filename = `Walkout-Report-${period}.pdf`;
            }

            if (endpoint) {
                const { data } = await axiosInstance.get(endpoint, { responseType: "blob" });
                const blob = new Blob([data], { type: "application/pdf" });
                saveAs(blob, filename);
                toast.success("PDF download started");
            }
        } catch (err: any) {
            toast.error("Failed to download PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleExportExcel = async (period: string) => {
        setExcelLoading(true);
        try {
            const reportType = pathParts[3];
            const staffId = getStaffId();
            let endpoint = '';
            let filename = '';

            if (reportType === 'staff' && staffId) {
                endpoint = `/owner/staff/${staffId}/kpi-details/export?format=excel&period=${period}`;
                filename = `Staff-KPI-${period}.xlsx`;
            } else if (reportType === 'attendance') {
                endpoint = `/owner/attendance-report/export?format=excel&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
                filename = `Attendance-Report-${period}.xlsx`;
            } else if (reportType === 'sales') {
                endpoint = `/owner/sales-report/export?format=excel&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
                filename = `Sales-Report-${period}.xlsx`;
            } else if (reportType === 'walkout') {
                endpoint = `/owner/walkout-report/export?format=excel&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
                filename = `Walkout-Report-${period}.xlsx`;
            }

            if (endpoint) {
                const { data } = await axiosInstance.get(endpoint, { responseType: "blob" });
                const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                saveAs(blob, filename);
                toast.success("Excel download started");
            }
        } catch (err: any) {
            toast.error("Failed to export Excel file");
        } finally {
            setExcelLoading(false);
        }
    };

    useEffect(() => {
        if (user === undefined) return;

        if (!user || user.role !== "Owner") {
            navigate("/", { replace: true });
            return;
        }

        if (location.pathname === "/Owner") {
            setIsRedirecting(true);
            navigate("/Owner/dashboard", { replace: true });
        } else {
            setIsRedirecting(false);
        }
    }, [user, navigate, location.pathname]);

    if (!user || user.role !== "Owner") {
        return null;
    }

    // Don't render content during redirect to avoid double animation
    if (isRedirecting) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header with Glass Effect */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        {isAnyReportPage ? (
                            // Report Page Header (Staff, Attendance, Sales, Walkout)
                            <>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="p-2 rounded-full hover:bg-red-50 transition"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-red-500" />
                                    </button>
                                    <div>
                                        <h1 className="text-xl font-semibold text-gray-900">
                                            {getReportTitle()}
                                        </h1>
                                        <p className="text-sm text-gray-500">
                                            {getDateRange()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button 
                                        onClick={() => setModalOpen(true)}
                                        className="p-2 rounded-full hover:bg-gray-100 transition"
                                    >
                                        <Download className="w-5 h-5 text-red-500" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Default Header
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-[#FF3F33]/20 rounded-full blur-md"></div>
                                        <img
                                            src="/images/century.png"
                                            alt="Century Logo"
                                            className="w-10 h-10 relative z-10 rounded-full"
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-semibold text-[#FF3F33] tracking-tight">
                                            Century Fashion City
                                        </h1>
                                        <p className="text-sm text-gray-600">
                                            Welcome, {user.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-gradient-to-br from-gray-50 to-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                        <p className="text-sm font-semibold capitalize text-gray-900">
                                            {user?.role}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav
                userRole={user.role}
                currentPage={location.pathname.split("/").pop() || "dashboard"}
                onNavigate={(page) => navigate(`/Owner/${page}`)}
            />

            {/* Export Modal */}
            <AnimatePresence>
                {modalOpen && isAnyReportPage && (
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
                                    Export KPI Report
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
                                    Choose export period:
                                </p>

                                {/* This Week PDF */}
                                <button
                                    onClick={() => handleExportPDF('week')}
                                    disabled={pdfLoading}
                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
              ${
                  pdfLoading
                      ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
              }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${
                                            pdfLoading
                                                ? "bg-gray-200"
                                                : "bg-red-100"
                                        }`}
                                    >
                                        {pdfLoading ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <FileText className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            {pdfLoading
                                                ? "Preparing PDF…"
                                                : "Export This Week as PDF"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Last 7 days
                                        </div>
                                    </div>
                                </button>

                                {/* This Week Excel */}
                                <button
                                    onClick={() => handleExportExcel('week')}
                                    disabled={excelLoading}
                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
              ${
                  excelLoading
                      ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
              }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${
                                            excelLoading
                                                ? "bg-gray-200"
                                                : "bg-green-100"
                                        }`}
                                    >
                                        {excelLoading ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <Sheet className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            {excelLoading
                                                ? "Preparing Excel…"
                                                : "Export This Week as Excel"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Last 7 days
                                        </div>
                                    </div>
                                </button>

                                {/* This Month PDF */}
                                <button
                                    onClick={() => handleExportPDF('month')}
                                    disabled={pdfLoading}
                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
              ${
                  pdfLoading
                      ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
              }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${
                                            pdfLoading
                                                ? "bg-gray-200"
                                                : "bg-red-100"
                                        }`}
                                    >
                                        {pdfLoading ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <FileText className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            {pdfLoading
                                                ? "Preparing PDF…"
                                                : "Export This Month as PDF"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Current month
                                        </div>
                                    </div>
                                </button>

                                {/* This Month Excel */}
                                <button
                                    onClick={() => handleExportExcel('month')}
                                    disabled={excelLoading}
                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
              ${
                  excelLoading
                      ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
              }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${
                                            excelLoading
                                                ? "bg-gray-200"
                                                : "bg-green-100"
                                        }`}
                                    >
                                        {excelLoading ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <Sheet className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            {excelLoading
                                                ? "Preparing Excel…"
                                                : "Export This Month as Excel"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Current month
                                        </div>
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
