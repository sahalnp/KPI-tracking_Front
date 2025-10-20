import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Award, Building, Layers, Star } from "lucide-react";

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
    staffId: string;
    name: string;
    mobile: string;
    role: string;
    section: string;
    floor: string;
    avgScore: number;
    joinDate: string;
}

interface SummaryData {
    totalStaff: number;
    avgScore: number;
}

export const StaffReportView: React.FC = () => {
    const [staffReport, setStaffReport] = useState<StaffData[]>([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    
const [excelLoading, setExcelLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData>({
        totalStaff: 0,
        avgScore: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const dispatch = useDispatch();
    const location = useLocation();

    const query = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    const startDate = query.get("start");
    const endDate = query.get("end");

    const downloadFile = (blob: Blob, fileName: string) => {
        try {
            saveAs(blob, fileName);
            toast.success("Download started");
        } catch (e: any) {
            console.error(e);
            toast.error("Export failed");
        }
    };
    const StaffInfo: React.FC<any> = ({
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
            <div className="flex justify-between items-start py-2">
                {/* Profile + Info */}
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
                            {" "}
                            ID: {staffId} &nbsp;|&nbsp; Phone: {mobile || "N/A"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                    <Star className="w-4 h-4" />
                    <span>{score}</span>
                </div>
            </div>
        );
    };

    const LocationBlock: React.FC<any> = ({ section, floor }) => (
        <div className="pt-4">
            {/* <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      Location
    </p> */}
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
                const res = await axiosInstance.get("/owner/staffReport", {
                    params: {
                        start: startDate,
                        end: endDate,
                    },
                });

                console.log("Staff report API response:", res.data);

                if (res.data.success) {
                    setStaffReport(res.data.staffReport || []);
                    setSummaryData(
                        res.data.summary || {
                            totalStaff: 0,
                            avgScore: 0,
                        }
                    );
                } else {
                    setError(res.data.error || "Failed to fetch staff report");
                    toast.error(
                        res.data.error || "Failed to fetch staff report"
                    );
                }
            } catch (err: any) {
                console.error("Fetch Staff Report error:", err);

                if (err.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutOwner();
                    dispatch(clearUser());
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
    }, [startDate, endDate, dispatch]);

    const [currentView, setCurrentView] = useState("staffReport");

    const getDateRangeLabel = () => {
        if (startDate && endDate) {
            const start = new Date(startDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
            const end = new Date(endDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
            return `${start} - ${end}`;
        }
        return "All Time";
    };

const handleExportPDF = async () => {
  setPdfLoading(true);                       // <- start spinner
  try {
    const { data } = await axiosInstance.get(
      `/owner/staffReport/export?format=pdf&start=${startDate}&end=${endDate}`,
      { responseType: 'blob' }
    );

    const blob = new Blob([data], { type: 'application/pdf' });
    saveAs(blob, 'Staff-Report.pdf');
    toast.success('PDF download started');
  } catch (err) {
    console.error(err);
    toast.error('Failed to download PDF');
  } finally {
    setPdfLoading(false);                    // <- stop spinner
  }
};


  const handleExportExcel = async () => {
    setModalOpen(false);
    try {

        const { data } = await axiosInstance.get(`/owner/staffReport/export`, {
            params: { start: startDate, end: endDate, format: "excel" },
            responseType: "blob", // important for file download
        });

        // Create a downloadable link
        const fileName = `staff-report-${startDate}-${endDate}.xlsx`;
        const url = window.URL.createObjectURL(data); // data is already a Blob
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Excel download error:", error);
        toast.error("Failed to export Excel file");
    }
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
        <div className="space-y-6 p-4">
            {/* Header + Export Button */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
            >
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Staff Reports
                    </h1>
                    <p className="text-sm text-gray-600">
                        {getDateRangeLabel()}
                    </p>
                </div>

                {/* Export Button */}
                <Button
                    className="bg-red-500 hover:bg-red-700 text-white p-2 rounded-full"
                    onClick={() => setModalOpen(true)}
                >
                    <Download className="h-5 w-5" />
                </Button>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Total Staff
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {summaryData.totalStaff}
                                    </p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Avg Score
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {summaryData.avgScore.toFixed(1)}
                                    </p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Staff Cards Grid */}
            {staffReport.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        No staff data found for the selected date range.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {staffReport.map((staff, index) => (
                        <motion.div
                            key={staff.staffId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden p-4">
                                <StaffInfo
                                    name={staff.name}
                                    staffId={staff.staffId}
                                    mobile={staff.mobile}
                                    score={staff.avgScore}
                                    role={staff.role}
                                />
                                <LocationBlock
                                    section={staff.section}
                                    floor={staff.floor}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

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
  disabled={pdfLoading}
  className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
              ${pdfLoading
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
  disabled={excelLoading}
  className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm
              ${excelLoading
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
                                {/* <button
                                    onClick={handleExportPDF}
                                    className="w-full flex items-center gap-4 px-5 py-3 rounded-xl bg-white border border-gray-200
  hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-sm"
                                >
                                    <div className="bg-red-100 p-2 rounded-lg">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            Export as PDF
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Portable Document
                                        </div>
                                    </div>
                                </button>

                  
                                <button
                                    onClick={handleExportExcel}
                                    className="w-full flex items-center gap-4 px-5 py-3 rounded-xl bg-white border border-gray-200
  hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-sm"
                                >
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <Sheet className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">
                                            Export as Excel
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Spreadsheet (.xlsx)
                                        </div>
                                    </div>
                                </button> */}
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
};
