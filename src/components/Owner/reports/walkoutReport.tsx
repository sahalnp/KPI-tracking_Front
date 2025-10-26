
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
    Download,
    X,
    FileText,
    Sheet,
    UserX,
    Info,
} from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { saveAs } from "file-saver";

interface WalkoutData {
    id: string;
    staffId: string;
    staffName: string;
    itemName: string | { name: string };
    type: string | { name: string };
    priority: 'High' | 'Medium' | 'Low';
    description: string;
    created_at: string;
    staff?: {
        id: string;
        name: string;
        uniqueId: string;
        role: string;
        section: string;
        floor?: { name: string };
    };
    submittedBy?: {
        id: string;
        name: string;
        uniqueId: string;
    };
}

interface SummaryData {
    totalWalkouts: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
}

interface WalkoutReportPageProps {
    startDate?: string;
    endDate?: string;
}

export const WalkoutReportPage: React.FC<WalkoutReportPageProps> = ({ 
    startDate, 
    endDate 
}) => {
    const [walkoutReport, setWalkoutReport] = useState<WalkoutData[]>([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData>({
        totalWalkouts: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate()


    const WalkoutInfo: React.FC<any> = ({
        name,
        staffId,
        itemName,
        type,
        priority,
        created_at,
    }) => {
        const priorityColors: Record<string, string> = {
            High: "bg-red-100 text-red-800",
            Medium: "bg-yellow-100 text-yellow-800",
            Low: "bg-green-100 text-green-800",
        };

        const priorityClass = priorityColors[priority] || priorityColors["Low"];

        return (
            <div className="flex justify-between items-start py-2">
                <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                        {name ? name.charAt(0).toUpperCase() : "?"}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                                {name}
                            </h3>
                            <span
                                className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${priorityClass} shadow-sm`}
                            >
                                {priority} Priority
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                            Item: {typeof itemName === 'string' ? itemName : itemName.name} &nbsp;|&nbsp; Type: {typeof type === 'string' ? type : type.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-gray-500 font-semibold text-xs">
                    {new Date(created_at).toLocaleDateString('en-IN')}
                </div>
            </div>
        );
    };

    const WalkoutDetailsBlock: React.FC<any> = ({ description, submittedBy }) => (
  <div className="pt-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Description */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <Info className="w-4 h-4 text-gray-400 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">Description</p>
          <p className="text-sm font-semibold text-gray-900">
            {description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Submitted By */}
      {submittedBy && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <UserX className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Submitted By</p>
            <p className="text-sm font-semibold text-gray-900">
              {submittedBy}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);


    useEffect(() => {
        const fetchWalkoutReport = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await axiosInstance.get("/owner/walkoutReport", {
                    params: {
                        start: startDate,
                        end: endDate,
                    },
                });

                console.log("Walkout report API response:", res.data);

                if (res.data.success) {
                    setWalkoutReport(res.data.walkouts || []);
                    setSummaryData(
                        res.data.summary || {
                            totalWalkouts: 0,
                            highPriority: 0,
                            mediumPriority: 0,
                            lowPriority: 0,
                        }
                    );
                } else {
                    
                    setError(res.data.error || "Failed to fetch walkout report");
                    toast.error(res.data.error || "Failed to fetch walkout report");
                }
            } catch (err: any) {
                console.error("Fetch Walkout Report error:", err);

                 if (err.response?.status === 401) {
                                    const response:any = await logoutOwner();
                                    if (response.success) {
                                        localStorage.removeItem("accessToken");
                                        localStorage.removeItem("refreshToken");
                                        dispatch(clearUser());
                                    } else {
                                        console.error("Logout failed on backend");
                                    }
                                } else if (err.response?.status === 400) {
                    setError(err.response.data.error || "Invalid request parameters");
                    toast.error(err.response.data.error || "Invalid request parameters");
                } else {
                    setError("Failed to fetch walkout report. Please try again later.");
                    toast.error(err.response?.data?.error || "Failed to fetch walkout report");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchWalkoutReport();
    }, [startDate, endDate, dispatch]);

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
        setPdfLoading(true);
        try {
            const { data } = await axiosInstance.get(
                `/owner/walkoutReport/export?format=pdf&start=${startDate}&end=${endDate}`,
                { responseType: 'blob' }
            );

            const blob = new Blob([data], { type: 'application/pdf' });
            saveAs(blob, 'Walkout-Report.pdf');
            toast.success('PDF download started');
        } catch (err:any) {
            console.error(err);
             if (err.response?.status === 401) {
                                const response:any = await logoutOwner();
                                if (response.success) {
                                    localStorage.removeItem("accessToken");
                                    localStorage.removeItem("refreshToken");
                                    dispatch(clearUser());
                                } else {
                                    console.error("Logout failed on backend");
                                }
                            }
            toast.error('Failed to download PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setModalOpen(false);
        setExcelLoading(true);
        try {
            const { data } = await axiosInstance.get(`/owner/walkoutReport/export`, {
                params: { start: startDate, end: endDate, format: "excel" },
                responseType: "blob",
            });

            const fileName = `walkout-report-${startDate}-${endDate}.xlsx`;
            const url = window.URL.createObjectURL(data);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Excel download started');
        } catch (err:any) {
            console.error("Excel download error:", error);
             if (err.response?.status === 401) {
                                const response:any = await logoutOwner();
                                if (response.success) {
                                    localStorage.removeItem("accessToken");
                                    localStorage.removeItem("refreshToken");
                                    dispatch(clearUser());
                                } else {
                                    console.error("Logout failed on backend");
                                }
                            }
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
                                        Total Walkouts
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {summaryData.totalWalkouts}
                                    </p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <UserX className="w-6 h-6 text-blue-600" />
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
                                        High Priority
                                    </p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {summaryData.highPriority}
                                    </p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Walkout Cards Grid */}
            {walkoutReport.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <UserX className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        No walkout data found for the selected date range.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {walkoutReport.map((walkout, index) => (
                        <motion.div
                            key={walkout.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden p-4">
                                <WalkoutInfo
                                    name={walkout.staff?.name || walkout.staffName}
                                    staffId={walkout.staff?.uniqueId || walkout.staffId}
                                    itemName={walkout.itemName}
                                    type={walkout.type}
                                    priority={walkout.priority}
                                    created_at={walkout.created_at}
                                />
                                <WalkoutDetailsBlock
                                    description={walkout.description}
                                    submittedBy={walkout.submittedBy?.name}
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

                            <div className="px-6 py-5 space-y-4">
                                <p className="text-sm text-gray-600">
                                    Choose a format:
                                </p>

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