
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
        {
            id: "reports",
            label: "Reports",
            icon: BarChart,
            to: "/owner/reports",
        },

        {
            id: "account",
            label: "Settings",
            icon: Settings,
            to: "/owner/account",
        },
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
    const [weekPdfLoading, setWeekPdfLoading] = useState(false);
    const [monthPdfLoading, setMonthPdfLoading] = useState(false);
    const [weekExcelLoading, setWeekExcelLoading] = useState(false);
    const [monthExcelLoading, setMonthExcelLoading] = useState(false);

    // Check if we're on any report page (not the main reports page)
    const pathParts = location.pathname.split("/");
    const isMainReportsPage =
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        pathParts.length === 3; // /Owner/reports

    const isAnyReportPage =
        pathParts[1] === "Owner" &&
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

    // Check if we're on the main staff reports page (not individual staff details)
    const isMainStaffReportsPage = 
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        pathParts[3] === "staff" &&
        pathParts.length === 4; // /Owner/reports/staff

    // Check if we're on attendance reports page
    const isAttendanceReportsPage = 
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        pathParts[3] === "attendance";

    // Check if we're on floor-wise walkout page
    const isFloorWiseWalkoutPage = 
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        ((pathParts[3] === "floor-wise-walkout") || (pathParts[3] === "walkout" && pathParts[4] === "floor-wise-walkout"));

    // Check if we're on walkout reports page root or any child under it
    const isWalkoutReportsPage =
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        pathParts[3] === "walkout";

    // Check if we're on sales reports page
    const isSalesReportsPage =
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        pathParts[3] === "sales";

    // Check if we're on staff sales page
    const isStaffSalesPage =
        pathParts[1] === "Owner" &&
        pathParts[2] === "reports" &&
        pathParts[3] === "sales" &&
        pathParts[4] === "staffSales";

    // Get staff ID from URL for download functionality
    const getStaffId = () => {
        const pathParts = location.pathname.split("/");
        // For URLs like /Owner/reports/staff/123/daily, we want the staff ID (123)
        // For URLs like /Owner/reports/staff/123, we want the staff ID (123)
        // For URLs like /Owner/reports/sales/staffSales/123, we want the staff ID (123)
        const staffIndex = pathParts.findIndex(part => part === "staff");
        if (staffIndex !== -1 && pathParts[staffIndex + 1]) {
            return pathParts[staffIndex + 1];
        }
        // Check for staffSales route
        const staffSalesIndex = pathParts.findIndex(part => part === "staffSales");
        if (staffSalesIndex !== -1 && pathParts[staffSalesIndex + 1]) {
            return pathParts[staffSalesIndex + 1];
        }
        return pathParts[pathParts.length - 1]; // fallback
    };

    // Get month parameter for conditional export options
    const getMonthParam = () => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get("month");
    };

    // Get floor name from URL params for floor-wise walkout
    const getFloorName = () => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get("floor") || "";
    };

    // Get display text for export buttons on staff sales page
    const getStaffSalesExportDisplay = () => {
        const searchParams = new URLSearchParams(location.search);
        const monthParam = searchParams.get("month");
        const yearParam = searchParams.get("year");
        
        if (monthParam === "all") {
            return {
                title: "Export All Months",
                subtitle: "All months data"
            };
        } else if (monthParam) {
            // monthParam is 1-based (October = 10)
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            const monthIndex = parseInt(monthParam); // monthParam is already 1-based
            const monthName = monthNames[monthIndex - 1]; // Subtract 1 to convert to 0-based array index
            const displayYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();
            return {
                title: `Export ${monthName}`,
                subtitle: `${monthName} ${displayYear}`
            };
        }
        
        return {
            title: "Export This Month",
            subtitle: "Current month"
        };
    };

    // Get display text for export buttons on floor-wise page
    const getFloorWiseExportDisplay = () => {
        const searchParams = new URLSearchParams(location.search);
        const floorName = searchParams.get("floor") || "";
        const monthParam = searchParams.get("month");
        const yearParam = searchParams.get("year");
        const startParam = searchParams.get("start") || searchParams.get("startDate");
        
        console.log('🔍 getFloorWiseExportDisplay params:', { floorName, monthParam, yearParam, startParam });
        
        if (monthParam === "all") {
            return {
                title: "Export All Months",
                subtitle: `All months data for ${floorName} Floor`
            };
        } else if (monthParam) {
            // monthParam is 1-based (October = 10)
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            const monthIndex = parseInt(monthParam); // monthParam is already 1-based
            const monthName = monthNames[monthIndex - 1]; // Subtract 1 to convert to 0-based array index
            const displayYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();
            console.log('📅 Using monthParam (1-based):', { monthParam, monthIndex, monthName, displayYear });
            return {
                title: `Export ${monthName}`,
                subtitle: `${floorName} Floor - ${monthName} ${displayYear}`
            };
        } else if (startParam) {
            // Fallback: derive from startDate if monthParam not available
            const date = new Date(startParam + 'T00:00:00'); // Add time to avoid timezone issues
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            const monthName = monthNames[date.getMonth()];
            const displayYear = yearParam ? parseInt(yearParam) : date.getFullYear();
            console.log('📅 Using startParam fallback:', { 
                startParam, 
                date: date.toISOString(), 
                monthIndex: date.getMonth(), 
                monthName, 
                displayYear 
            });
            return {
                title: `Export ${monthName}`,
                subtitle: `${floorName} Floor - ${monthName} ${displayYear}`
            };
        }
        
        return {
            title: "Export This Month",
            subtitle: `${floorName} Floor - Current month`
        };
    };

    // Get date range from URL params for KPI details page
    const getDateRange = () => {
        const searchParams = new URLSearchParams(location.search);
        // Read both legacy (start/end) and new (startDate/endDate) params
        const startDate = searchParams.get("start") || searchParams.get("startDate");
        const endDate = searchParams.get("end") || searchParams.get("endDate");
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        if (startDate && endDate) {
            return `${new Date(startDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })} - ${new Date(endDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })}`;
        } else if (month === "all" && year) {
            // Show "January 1st to current month 30th" for "all" month selection
            const currentDate = new Date();
            const yearNum = parseInt(year);
            const currentYear = currentDate.getFullYear();

            if (yearNum === currentYear) {
                // Current year - show January 1st to current month 30th
                const jan1 = new Date(yearNum, 0, 1).toLocaleDateString(
                    "en-US",
                    {
                        month: "long",
                        day: "numeric",
                    }
                );
                const currentMonth = currentDate.getMonth();
                const currentMonthName = new Date(
                    yearNum,
                    currentMonth,
                    1
                ).toLocaleDateString("en-US", {
                    month: "long",
                });
                return `${jan1} to ${currentMonthName} 30, ${yearNum}`;
            } else {
                // Past years - show all year
                return `all ${year}`;
            }
        } else if (month && year) {
            const monthIndex = parseInt(month);
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
            const monthName = monthNames[monthIndex] || "Unknown";
            return `${monthName} ${year}`;
        }
        return "Current Period";
    };

    // Download functions
    const handleExportPDF = async (period: string) => {
        if (period === "week") {
            setWeekPdfLoading(true);
        } else if (period === "month") {
            setMonthPdfLoading(true);
        } else {
            setPdfLoading(true);
        }
        try {
            const reportType = pathParts[3];
            const staffId = getStaffId();
            let endpoint = "";
            let filename = "";

            if (isMainStaffReportsPage) {
                // Handle main staff reports page - export all staff as table
                const searchParams = new URLSearchParams(location.search);
                const month = searchParams.get("month");
                const year = searchParams.get("year");
                const startDate = searchParams.get("start");
                const endDate = searchParams.get("end");
                
                const params = new URLSearchParams({
                    format: "pdf"
                });
                
                if (month) params.append("month", month);
                if (year) params.append("year", year);
                if (startDate) params.append("start", startDate);
                if (endDate) params.append("end", endDate);
                
                endpoint = `/owner/staffReport/export?${params.toString()}`;
                filename = `Staff-Report.pdf`;
            } else if (reportType === "staff" && staffId) {
                endpoint = `/owner/staff/${staffId}/kpi-details/export?format=pdf&period=${period}`;
                filename = `Staff-KPI-${period}.pdf`;
            } else if (reportType === "attendance") {
                const searchParams = new URLSearchParams(location.search);
                const monthParam = searchParams.get("month");
                const year = searchParams.get("year") || new Date().getFullYear().toString();
                
                // Convert month from 0-based to 1-based (same logic as attendanceReport.tsx)
                const month = monthParam === "all"
                    ? "all"
                    : Number(monthParam) === 12
                        ? "1"
                        : String(Number(monthParam) + 1);
                
                const params = new URLSearchParams({
                    format: "pdf"
                });
                
                if (month) {
                    params.append("month", month);
                }
                if (year) {
                    params.append("year", year);
                }
                
                endpoint = `/owner/attendance-report/export?${params.toString()}`;
                filename = `Attendance-Report-${month === "all" ? "All-Months" : `Month-${month}`}.pdf`;
            } else if (reportType === "sales") {
                // Check if it's staff sales page
                if (isStaffSalesPage && staffId) {
                    const searchParams = new URLSearchParams(location.search);
                    const monthParam = searchParams.get("month");
                    const yearParam = searchParams.get("year");
                    const startParam = searchParams.get("start") || searchParams.get("startDate");
                    const endParam = searchParams.get("end") || searchParams.get("endDate");
                    
                    const params = new URLSearchParams({ format: "pdf" });
                    
                    if (monthParam === "all") {
                        if (yearParam) params.append("year", yearParam);
                        endpoint = `/owner/staff/${staffId}/all-months-sales-report/export?${params.toString()}`;
                        filename = `Staff-Sales-All-Months.pdf`;
                    } else if (monthParam) {
                        params.append("month", monthParam);
                        if (yearParam) params.append("year", yearParam);
                        if (startParam) params.append("start", startParam);
                        if (endParam) params.append("end", endParam);
                        endpoint = `/owner/staff/${staffId}/sales-report/export?${params.toString()}`;
                        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                        const monthName = monthNames[parseInt(monthParam) - 1] || "Unknown";
                        filename = `Staff-Sales-${monthName}.pdf`;
                    } else {
                        endpoint = `/owner/sales-report/export?format=pdf&month=${
                            new Date().getMonth() + 1
                        }&year=${new Date().getFullYear()}`;
                        filename = `Sales-Report-${period}.pdf`;
                    }
                } else {
                    endpoint = `/owner/sales-report/export?format=pdf&month=${
                        new Date().getMonth() + 1
                    }&year=${new Date().getFullYear()}`;
                    filename = `Sales-Report-${period}.pdf`;
                }
            } else if (isFloorWiseWalkoutPage) {
                const sp = new URLSearchParams(location.search);
                const floorName = sp.get('floor') || '';
                const monthParam = sp.get('month');
                const startParam = sp.get('start') || sp.get('startDate');
                const yearParam = sp.get('year');

                console.log('📄 Export PDF - Floor-wise walkout:', {
                    floorName,
                    monthParam,
                    startParam,
                    yearParam
                });

                // Get floor ID from floor name
                try {
                    const floorsRes = await axiosInstance.get("/owner/getFloors");
                    const floors = floorsRes.data.floors || [];
                    const foundFloor = floors.find((f: any) => f.name === floorName);
                    
                    if (!foundFloor) {
                        toast.error("Floor not found");
                        return;
                    }
                    
                    const floorId = foundFloor.id;
                    console.log('✅ Found floor ID:', floorId, 'for floor:', floorName);

                    const params = new URLSearchParams({ format: 'pdf' });
                    params.append('floor', String(floorId));

                    // Check if "all" months is selected
                    if (monthParam === 'all') {
                        const year = yearParam || String(new Date().getFullYear());
                        params.append('year', year);
                        endpoint = `/owner/all-months-floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-All-Months-${year}.pdf`;
                    } else if (startParam) {
                        // Use startDate to send startDate and endDate parameters
                        const endParam = sp.get('end') || sp.get('endDate');
                        if (endParam) {
                            params.append('startDate', startParam);
                            params.append('endDate', endParam);
                            // Also send month and year if available for correct display
                            if (monthParam) {
                                params.append('month', monthParam);
                            }
                            if (yearParam) {
                                params.append('year', yearParam);
                            }
                            endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                            const startDate = new Date(startParam);
                            const derivedMonth = startDate.getMonth() + 1;
                            const derivedYear = startDate.getFullYear();
                            filename = `Floor-${floorName || 'Report'}-Month-${derivedMonth}-${derivedYear}.pdf`;
                        } else {
                            // Fallback to current month/year if no endDate
                            const now = new Date();
                            const derivedMonth = now.getMonth() + 1;
                            const derivedYear = String(now.getFullYear());
                            params.append('month', String(derivedMonth));
                            params.append('year', derivedYear);
                            endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                            filename = `Floor-${floorName || 'Report'}-Month-${derivedMonth}-${derivedYear}.pdf`;
                        }
                    } else if (yearParam) {
                        // Use yearParam if available
                        const year = yearParam;
                        params.append('year', year);
                        // Also send month if available
                        if (monthParam) {
                            params.append('month', monthParam);
                        }
                        endpoint = `/owner/all-months-floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-All-Months-${year}.pdf`;
                    } else if (monthParam && yearParam) {
                        // Send month and year parameters
                        params.append('month', monthParam);
                        params.append('year', yearParam);
                        endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-Month-${monthParam}-${yearParam}.pdf`;
                    } else {
                        // Default to current month/year
                        const now = new Date();
                        const derivedMonth = now.getMonth() + 1;
                        const derivedYear = String(now.getFullYear());
                        params.append('month', String(derivedMonth));
                        params.append('year', derivedYear);
                        endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-Month-${derivedMonth}-${derivedYear}.pdf`;
                    }

                    console.log('📤 Sending PDF export request:', {
                        endpoint,
                        params: params.toString(),
                        filename
                    });
                } catch (err: any) {
                    console.error("Error fetching floor ID:", err);
                    toast.error("Failed to get floor information");
                    return;
                }
            } else if (reportType === "walkout") {
                const sp = new URLSearchParams(location.search);
                const monthParam = sp.get("month");
                const startParam = sp.get("start") || sp.get("startDate");
                const derivedMonth = startParam ? (new Date(startParam).getMonth() + 1) : (new Date().getMonth() + 1);
                const month = monthParam === "all"
                    ? "all"
                    : monthParam !== null
                        ? (Number(monthParam) === 12 ? 1 : Number(monthParam) + 1).toString()
                        : String(derivedMonth);
                const year = sp.get("year") || (startParam ? String(new Date(startParam).getFullYear()) : String(new Date().getFullYear()));
                const params = new URLSearchParams({ format: "pdf" });
                params.append("month", month);
                if (year) params.append("year", year);
                endpoint = `/owner/walkoutReport/export?${params.toString()}`;
                filename = `Walkout-Report-${month === 'all' ? `All-${year}` : `M-${month}-${year}`}.pdf`;
            }

            if (endpoint) {
                const { data } = await axiosInstance.get(endpoint, {
                    responseType: "blob",
                });
                const blob = new Blob([data], { type: "application/pdf" });
                saveAs(blob, filename);
                toast.success("PDF download started");
            }
        } catch (err: any) {
            toast.error("Failed to download PDF");
        } finally {
            if (period === "week") {
                setWeekPdfLoading(false);
            } else if (period === "month") {
                setMonthPdfLoading(false);
            } else {
                setPdfLoading(false);
            }
        }
    };

    const handleExportExcel = async (period: string) => {
        if (period === "week") {
            setWeekExcelLoading(true);
        } else if (period === "month") {
            setMonthExcelLoading(true);
        } else {
            setExcelLoading(true);
        }
        try {
            const reportType = pathParts[3];
            const staffId = getStaffId();
            let endpoint = "";
            let filename = "";

            if (isMainStaffReportsPage) {
                // Handle main staff reports page - export all staff as table
                const searchParams = new URLSearchParams(location.search);
                const month = searchParams.get("month");
                const year = searchParams.get("year");
                const startDate = searchParams.get("start");
                const endDate = searchParams.get("end");
                
                const params = new URLSearchParams({
                    format: "excel"
                });
                
                if (month) params.append("month", month);
                if (year) params.append("year", year);
                if (startDate) params.append("start", startDate);
                if (endDate) params.append("end", endDate);
                
                endpoint = `/owner/staffReport/export?${params.toString()}`;
                filename = `Staff-Report.xlsx`;
            } else if (reportType === "staff" && staffId) {
                endpoint = `/owner/staff/${staffId}/kpi-details/export?format=excel&period=${period}`;
                filename = `Staff-KPI-${period}.xlsx`;
            } else if (reportType === "attendance") {
                const searchParams = new URLSearchParams(location.search);
                const monthParam = searchParams.get("month");
                const year = searchParams.get("year") || new Date().getFullYear().toString();
                
                // Convert month from 0-based to 1-based (same logic as attendanceReport.tsx)
                const month = monthParam === "all"
                    ? "all"
                    : Number(monthParam) === 12
                        ? "1"
                        : String(Number(monthParam) + 1);
                
                const params = new URLSearchParams({
                    format: "excel"
                });
                
                if (month) {
                    params.append("month", month);
                }
                if (year) {
                    params.append("year", year);
                }
                
                endpoint = `/owner/attendance-report/export?${params.toString()}`;
                filename = `Attendance-Report-${month === "all" ? "All-Months" : `Month-${month}`}.xlsx`;
            } else if (reportType === "sales") {
                endpoint = `/owner/sales-report/export?format=excel&month=${
                    new Date().getMonth() + 1
                }&year=${new Date().getFullYear()}`;
                filename = `Sales-Report-${period}.xlsx`;
            } else if (isFloorWiseWalkoutPage) {
                const sp = new URLSearchParams(location.search);
                const floorName = sp.get('floor') || '';
                const monthParam = sp.get('month');
                const startParam = sp.get('start') || sp.get('startDate');
                const yearParam = sp.get('year');

                console.log('📊 Export Excel - Floor-wise walkout:', {
                    floorName,
                    monthParam,
                    startParam,
                    yearParam
                });

                // Get floor ID from floor name
                try {
                    const floorsRes = await axiosInstance.get("/owner/getFloors");
                    const floors = floorsRes.data.floors || [];
                    const foundFloor = floors.find((f: any) => f.name === floorName);
                    
                    if (!foundFloor) {
                        toast.error("Floor not found");
                        return;
                    }
                    
                    const floorId = foundFloor.id;
                    console.log('✅ Found floor ID:', floorId, 'for floor:', floorName);

                    const params = new URLSearchParams({ format: 'excel' });
                    params.append('floor', String(floorId));
                    
                    // Check if "all" months is selected
                    if (monthParam === 'all') {
                        const year = yearParam || String(new Date().getFullYear());
                        params.append('year', year);
                        endpoint = `/owner/all-months-floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-All-Months-${year}.xlsx`;
                    } else if (startParam) {
                        // Use startDate to send startDate and endDate parameters
                        const endParam = sp.get('end') || sp.get('endDate');
                        if (endParam) {
                            params.append('startDate', startParam);
                            params.append('endDate', endParam);
                            // Also send month and year if available for correct display
                            if (monthParam) {
                                params.append('month', monthParam);
                            }
                            if (yearParam) {
                                params.append('year', yearParam);
                            }
                            endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                            const startDate = new Date(startParam);
                            const derivedMonth = startDate.getMonth() + 1;
                            const derivedYear = startDate.getFullYear();
                            filename = `Floor-${floorName || 'Report'}-Month-${derivedMonth}-${derivedYear}.xlsx`;
                        } else {
                            // Fallback to current month/year if no endDate
                            const now = new Date();
                            const derivedMonth = now.getMonth() + 1;
                            const derivedYear = String(now.getFullYear());
                            params.append('month', String(derivedMonth));
                            params.append('year', derivedYear);
                            endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                            filename = `Floor-${floorName || 'Report'}-Month-${derivedMonth}-${derivedYear}.xlsx`;
                        }
                    } else if (yearParam) {
                        // Use yearParam if available
                        const year = yearParam;
                        params.append('year', year);
                        // Also send month if available
                        if (monthParam) {
                            params.append('month', monthParam);
                        }
                        endpoint = `/owner/all-months-floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-All-Months-${year}.xlsx`;
                    } else if (monthParam && yearParam) {
                        // Send month and year parameters
                        params.append('month', monthParam);
                        params.append('year', yearParam);
                        endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-Month-${monthParam}-${yearParam}.xlsx`;
                    } else {
                        // Default to current month/year
                        const now = new Date();
                        const derivedMonth = now.getMonth() + 1;
                        const derivedYear = String(now.getFullYear());
                        params.append('month', String(derivedMonth));
                        params.append('year', derivedYear);
                        endpoint = `/owner/floor-walkout-analysis/export?${params.toString()}`;
                        filename = `Floor-${floorName || 'Report'}-Month-${derivedMonth}-${derivedYear}.xlsx`;
                    }

                    console.log('📤 Sending Excel export request:', {
                        endpoint,
                        params: params.toString(),
                        filename
                    });
                } catch (err: any) {
                    console.error("Error fetching floor ID:", err);
                    toast.error("Failed to get floor information");
                    return;
                }
            } else if (reportType === "walkout") {
                const sp = new URLSearchParams(location.search);
                const monthParam = sp.get("month");
                const startParam = sp.get("start") || sp.get("startDate");
                const derivedMonth = startParam ? (new Date(startParam).getMonth() + 1) : (new Date().getMonth() + 1);
                const month = monthParam === "all"
                    ? "all"
                    : monthParam !== null
                        ? (Number(monthParam) === 12 ? 1 : Number(monthParam) + 1).toString()
                        : String(derivedMonth);
                const year = sp.get("year") || (startParam ? String(new Date(startParam).getFullYear()) : String(new Date().getFullYear()));
                const params = new URLSearchParams({ format: "excel" });
                params.append("month", month);
                if (year) params.append("year", year);
                endpoint = `/owner/walkoutReport/export?${params.toString()}`;
                filename = `Walkout-Report-${month === 'all' ? `All-${year}` : `M-${month}-${year}`}.xlsx`;
            }

            if (endpoint) {
                const { data } = await axiosInstance.get(endpoint, {
                    responseType: "blob",
                });
                const blob = new Blob([data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                saveAs(blob, filename);
                toast.success("Excel download started");
            }
        } catch (err: any) {
            toast.error("Failed to export Excel file");
        } finally {
            if (period === "week") {
                setWeekExcelLoading(false);
            } else if (period === "month") {
                setMonthExcelLoading(false);
            } else {
                setExcelLoading(false);
            }
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
                        {isAnyReportPage || isFloorWiseWalkoutPage ? (
                            // Report Page Header (Staff, Attendance, Sales, Walkout, Floor-wise Walkout)
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
                                            {isFloorWiseWalkoutPage ? getDateRange() : getDateRange()}
                                        </p>
                                    </div>
                                </div>
                                {/* Download button - enable for Staff Sales page; keep disabled for sales list root */}
                                {!isWalkoutReportsPage && (!isSalesReportsPage || isStaffSalesPage) && (
                                    <div className="text-right">
                                        <button
                                            onClick={() => setModalOpen(true)}
                                            className="p-2 rounded-full hover:bg-gray-100 transition"
                                        >
                                            <Download className="w-5 h-5 text-red-500" />
                                        </button>
                                    </div>
                                )}
                                {/* {isWalkoutReportsPage && (
                                    <div className="text-right">
                                        <button
                                            onClick={() => setModalOpen(true)}
                                            className="p-2 rounded-full hover:bg-gray-100 transition"
                                        >
                                            <Download className="w-5 h-5 text-red-500" />
                                        </button>
                                    </div>
                                )} */}
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
                {modalOpen && (isAnyReportPage || isFloorWiseWalkoutPage || isStaffSalesPage) && !isWalkoutReportsPage && (!isSalesReportsPage || isStaffSalesPage) && (
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
                                    {isStaffSalesPage ? "Export Sales Report" : "Export KPI Report"}
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

                                {getMonthParam() === "all" || isAttendanceReportsPage ? (
                                    // When month is "all" OR it's attendance report page - show only PDF and Excel options
                                    <>
                                        {/* Export as PDF */}
                                        <button
                                            onClick={() => handleExportPDF("month")}
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
                                                        : isStaffSalesPage && getMonthParam() === "all"
                                                            ? getStaffSalesExportDisplay().title + " as PDF"
                                                        : isStaffSalesPage && getMonthParam()
                                                            ? getStaffSalesExportDisplay().title + " as PDF"
                                                        : isFloorWiseWalkoutPage && getMonthParam() === "all"
                                                            ? "Export All Months as PDF"
                                                            : isMainStaffReportsPage 
                                                            ? "Export Employee as PDF"
                                                            : isAttendanceReportsPage && getMonthParam() !== "all"
                                                            ? "Export This Month as PDF"
                                                            : "Export as PDF"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {isStaffSalesPage && getMonthParam() === "all"
                                                        ? getStaffSalesExportDisplay().subtitle
                                                        : isStaffSalesPage && getMonthParam()
                                                        ? getStaffSalesExportDisplay().subtitle
                                                        : isFloorWiseWalkoutPage && getMonthParam() === "all"
                                                        ? getFloorWiseExportDisplay().subtitle
                                                        : isMainStaffReportsPage 
                                                        ? "All employees data"
                                                        : isAttendanceReportsPage && getMonthParam() !== "all"
                                                        ? "Current month data"
                                                        : "All months data"}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Export as Excel - allow on StaffSales page when month is all */}
                                        {(
                                            true
                                        ) && (
                                            <button
                                                onClick={() => handleExportExcel("month")}
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
                                                            : isStaffSalesPage && getMonthParam() === "all"
                                                                ? getStaffSalesExportDisplay().title + " as Excel"
                                                                : isFloorWiseWalkoutPage && getMonthParam() === "all"
                                                                    ? "Export All Months as Excel"
                                                                    : isMainStaffReportsPage 
                                                                    ? "Export Employee as Excel"
                                                                    : isAttendanceReportsPage && getMonthParam() !== "all"
                                                                    ? "Export This Month as Excel"
                                                                    : "Export as Excel"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {isStaffSalesPage && getMonthParam() === "all"
                                                            ? getStaffSalesExportDisplay().subtitle
                                                            : isFloorWiseWalkoutPage && getMonthParam() === "all"
                                                                ? getFloorWiseExportDisplay().subtitle
                                                                : isMainStaffReportsPage 
                                                                ? "All employees data"
                                                                : isAttendanceReportsPage && getMonthParam() !== "all"
                                                                ? "Current month data"
                                                                : "All months data"}
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    // When month is specific (and NOT attendance report) - show options
                                    <>
                                        {/* Only show WEEK options if not on walkout pages or staff sales page */}
                                        {!(isWalkoutReportsPage || isFloorWiseWalkoutPage || isStaffSalesPage) && (
                                            <>
                                                {/* This Week PDF */}
                                                <button
                                                    onClick={() => handleExportPDF("week")}
                                                    disabled={weekPdfLoading}
                                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
                      ${
                          weekPdfLoading
                              ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                              : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
                      }`}
                                                >
                                                    <div
                                                        className={`p-2 rounded-lg ${
                                                            weekPdfLoading
                                                                ? "bg-gray-200"
                                                                : "bg-red-100"
                                                        }`}
                                                    >
                                                        {weekPdfLoading ? (
                                                            <div className="w-5 h-5 flex items-center justify-center">
                                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                            </div>
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </div>

                                                    <div className="text-left">
                                                        <div className="font-semibold text-gray-900">
                                                            {weekPdfLoading
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
                                                    onClick={() => handleExportExcel("week")}
                                                    disabled={weekExcelLoading}
                                                    className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
                      ${
                          weekExcelLoading
                              ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                              : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
                      }`}
                                                >
                                                    <div
                                                        className={`p-2 rounded-lg ${
                                                            weekExcelLoading
                                                                ? "bg-gray-200"
                                                                : "bg-green-100"
                                                        }`}
                                                    >
                                                        {weekExcelLoading ? (
                                                            <div className="w-5 h-5 flex items-center justify-center">
                                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                            </div>
                                                        ) : (
                                                            <Sheet className="w-5 h-5 text-green-600" />
                                                        )}
                                                    </div>

                                                    <div className="text-left">
                                                        <div className="font-semibold text-gray-900">
                                                            {weekExcelLoading
                                                                ? "Preparing Excel…"
                                                                : "Export This Week as Excel"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Last 7 days
                                                        </div>
                                                    </div>
                                                </button>
                                            </>
                                        )}

                                        {/* This Month PDF */}
                                        <button
                                            onClick={() => handleExportPDF("month")}
                                            disabled={monthPdfLoading}
                                            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
                      ${
                          monthPdfLoading
                              ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                              : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
                      }`}
                                        >
                                            <div
                                                className={`p-2 rounded-lg ${
                                                    monthPdfLoading
                                                        ? "bg-gray-200"
                                                        : "bg-red-100"
                                                }`}
                                            >
                                                {monthPdfLoading ? (
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                ) : (
                                                    <FileText className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>

                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">
                                                    {monthPdfLoading
                                                        ? "Preparing PDF…"
                                                        : isStaffSalesPage && getMonthParam()
                                                            ? getStaffSalesExportDisplay().title + " as PDF"
                                                        : isFloorWiseWalkoutPage
                                                            ? getFloorWiseExportDisplay().title + " as PDF"
                                                            : "Export This Month as PDF"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {isStaffSalesPage && getMonthParam()
                                                        ? getStaffSalesExportDisplay().subtitle
                                                        : isFloorWiseWalkoutPage
                                                        ? getFloorWiseExportDisplay().subtitle
                                                        : "Current month"}
                                                </div>
                                            </div>
                                        </button>

                                        {/* This Month Excel - show on StaffSales page */}
                                        {(
                                            <button
                                                onClick={() => handleExportExcel("month")}
                                                disabled={monthExcelLoading}
                                                className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
                          ${
                              monthExcelLoading
                                  ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                                  : "bg-white border-gray-200 hover:bg-gray-50 active:scale-95"
                          }`}
                                            >
                                                <div
                                                    className={`p-2 rounded-lg ${
                                                        monthExcelLoading
                                                            ? "bg-gray-200"
                                                            : "bg-green-100"
                                                    }`}
                                                >
                                                    {monthExcelLoading ? (
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <Sheet className="w-5 h-5 text-green-600" />
                                                    )}
                                                </div>

                                                <div className="text-left">
                                                    <div className="font-semibold text-gray-900">
                                                        {monthExcelLoading
                                                            ? "Preparing Excel…"
                                                            : isStaffSalesPage && getMonthParam()
                                                                ? getStaffSalesExportDisplay().title + " as Excel"
                                                                : isFloorWiseWalkoutPage
                                                                ? getFloorWiseExportDisplay().title + " as Excel"
                                                                : "Export This Month as Excel"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {isStaffSalesPage && getMonthParam()
                                                            ? getStaffSalesExportDisplay().subtitle
                                                            : isFloorWiseWalkoutPage
                                                            ? getFloorWiseExportDisplay().subtitle
                                                            : "Current month"}
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </>
                                )}
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
