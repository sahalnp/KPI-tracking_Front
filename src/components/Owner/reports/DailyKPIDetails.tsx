import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Star, Download, X, FileText, Sheet, Search } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { saveAs } from "file-saver";

interface StaffInfo {
    id: number;
    staffId: string;
    name: string;
    mobile: string;
    role: string;
    section: string;
    floor: string;
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

interface StaffKPIDetails {
    staff: StaffInfo;
    dailyKPIScores: DailyKPIScores;
    dailySummary: {
        totalPoints: number;
        totalWeight: number;
        totalScore: number;
        avgScore: number;
    };
    totalDays: number;
    totalKPIs: number;
}

export const DailyKPIDetails: React.FC = () => {
    const [data, setData] = useState<StaffKPIDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    
    // Filter and search states
    const [searchDate, setSearchDate] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
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
        const fetchStaffKPIDetails = async () => {
            if (!id) return;
            
            setIsLoading(true);
            setError(null);

            try {
                // If "all" is selected, fetch all months data
                if (selectedMonth === 'all') {
                    const allMonthsRes = await axiosInstance.get(`/owner/staff/${id}/all-months-daily-kpi-details`, {
                        params: {
                            year: year,
                        },
                    });

                    if (allMonthsRes.data.success) {
                        setAllMonthsData(allMonthsRes.data.data);
                        setData(null); // Clear single month data
                    } else {
                        setError(allMonthsRes.data.error || "Failed to fetch all months data");
                        toast.error(allMonthsRes.data.error || "Failed to fetch all months data");
                    }
                } else {
                    // Fetch single month data
                    const monthIndex = typeof selectedMonth === 'string' ? parseInt(selectedMonth) : selectedMonth;
                    const res = await axiosInstance.get(`/owner/staff/${id}/daily-kpi-details`, {
                        params: {
                            start: startDate,
                            end: endDate,
                            month: monthIndex + 1, // Convert 0-based to 1-based month
                            year: year,
                        },
                    });

                    if (res.data.success) {
                        setData(res.data.data);
                        setAllMonthsData(null); // Clear all months data
                    } else {
                        setError(res.data.error || "Failed to fetch staff KPI details");
                        toast.error(res.data.error || "Failed to fetch staff KPI details");
                    }
                }
            } catch (err: any) {
                console.error("Fetch Staff KPI Details error:", err);
                setError("Failed to fetch staff KPI details. Please try again later.");
                toast.error("Failed to fetch staff KPI details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaffKPIDetails();
    }, [id, startDate, endDate, selectedMonth, year]);

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

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case "up":
                return "text-green-600";
            case "down":
                return "text-red-600";
            default:
                return "text-gray-600";
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

    // Filter data
    const getFilteredData = () => {
        if (!data?.dailyKPIScores) return [];

        let filteredData = Object.entries(data.dailyKPIScores).map(([date, kpiData]) => {
            const kpiValues = Object.values(kpiData);
            const totalScore = kpiValues.reduce((sum, kpi) => sum + (kpi.avgScore || 0), 0);
            const totalPoints = kpiValues.reduce((sum, kpi) => sum + (kpi.avgPoints || 0), 0);
            const totalWeight = kpiValues.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
            const avgWeight = kpiValues.length > 0 ? totalWeight / kpiValues.length : 0;
            
            return {
                date,
                kpiData,
                totalScore: totalScore / kpiValues.length, // Average score
                totalPoints,
                avgWeight,
                kpiCount: kpiValues.length
            };
        });

        // Apply date search filter
        if (searchDate) {
            filteredData = filteredData.filter(item => 
                item.date.toLowerCase().includes(searchDate.toLowerCase())
            );
        }

        // Sort by date (newest first)
        filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return filteredData;
    };

    const filteredData = getFilteredData();

    const handleExportPDF = async (period: string) => {
        setPdfLoading(true);
        try {
            const { data } = await axiosInstance.get(
                `/owner/staff/${id}/kpi-details/export?format=pdf&period=${period}`,
                { responseType: "blob" }
            );

            const blob = new Blob([data], { type: "application/pdf" });
            saveAs(blob, `Daily-KPI-${period}.pdf`);
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
            const { data } = await axiosInstance.get(
                `/owner/staff/${id}/kpi-details/export?format=excel&period=${period}`,
                { responseType: "blob" }
            );

            const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `Daily-KPI-${period}.xlsx`);
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

        return (
        <div className="space-y-6 p-6 pb-32 min-h-screen max-w-7xl mx-auto relative z-0 overflow-hidden">
            {/* Staff Info Card - Same as StaffKPIDetails */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
                {/* First Line: Staff Icon, Name, Badge */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-xl">
                            {data?.staff?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                            </div>
                    <h3 className="text-xl font-semibold text-gray-900">{data?.staff?.name}</h3>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        data?.staff?.role === 'Staff' ? 'bg-green-100 text-green-800' :
                        data?.staff?.role === 'FloorSupervisor' ? 'bg-blue-100 text-blue-800' :
                        data?.staff?.role === 'Accountant' ? 'bg-purple-100 text-purple-800' :
                        data?.staff?.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {data?.staff?.role || 'Staff'}
                    </span>
                            </div>

                {/* Second Line: ID | Floor-Section | Number */}
                <div className="text-sm text-gray-600">
                    <span className="font-mono">ID: {data?.staff?.staffId}</span>
                    <span className="mx-2">|</span>
                    <span>
                        {data?.staff?.floor} Floor
                        {data?.staff?.section && `-${data.staff.section}`}
                    </span>
                    <span className="mx-2">|</span>
                    <span>Number: {data?.staff?.mobile}</span>
                        </div>
            </motion.div>

           
            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-600">
                            <Search className="w-5 h-5 text-gray-500" />
                            Search by Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex gap-2 items-end">
                         
                            
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search by date..."
                                        value={searchDate}
                                        onChange={(e) => setSearchDate(e.target.value)}
                                        className="pl-10"
                                    />
                                
                            </div>
                            <Button
                                onClick={() => setIsSearchActive(!isSearchActive)}
                                className={`px-6 py-2 transition-all duration-200 ${
                                    isSearchActive 
                                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                {isSearchActive ? 'Clear' : 'Search'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Daily KPI Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">mir-daily details</h2>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                
                <Card className="mb-6 shadow-lg w-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-center text-gray-800">
                            {selectedMonth === 'all' ? 'All Months Daily KPI Summary' : 'Daily KPI Summary'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {selectedMonth === 'all' && allMonthsData ? (
                            // Show all months data
                            <div className="space-y-6">
                                {Object.keys(allMonthsData).map((monthName) => {
                                    const monthData = allMonthsData[monthName];
                                    return (
                                        <div key={monthName} className="border rounded-lg p-4">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">{monthName}</h4>
                                            
                                            {/* Daily Summary Header for this month */}
                                            <div className="bg-gray-100 rounded-lg p-3 mb-3">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Total Score</div>
                                                        <div className="text-sm font-bold text-blue-600">
                                                            {monthData.dailySummary?.totalScore?.toFixed(1) || '0.0'}/5
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Total Points</div>
                                                        <div className="text-sm font-bold text-green-600">
                                                            {monthData.dailySummary?.totalPoints?.toFixed(1) || '0.0'}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Avg Weight</div>
                                                        <div className="text-sm font-bold text-orange-600">
                                                            {monthData.dailySummary?.totalWeight?.toFixed(1) || '0.0'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Daily KPI Table for this month */}
                                            {monthData.dailyKPIScores && Object.keys(monthData.dailyKPIScores).length > 0 ? (
                                                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                                <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[120px] font-semibold text-gray-800">
                                                                    Date
                                                                </TableHead>
                                                                {/* Get all unique KPI names for this month */}
                                                                {(() => {
                                                                    const allKPIs = new Set<string>();
                                                                    Object.values(monthData.dailyKPIScores).forEach((dayData: any) => {
                                                                        Object.keys(dayData).forEach(kpiName => allKPIs.add(kpiName));
                                                                    });
                                                                    
                                                                    return Array.from(allKPIs).map((kpiName) => (
                                                                        <TableHead 
                                                                            key={kpiName}
                                                                            className="bg-white text-gray-800 text-center font-semibold min-w-[120px] border-r border-gray-300"
                                                                        >
                                                                            <div className="flex flex-col items-center py-1">
                                                                                <span className="text-xs font-bold text-gray-900">{kpiName}</span>
                                                                                <span className="text-xs text-gray-600">Weight - Points - Score</span>
                                                                            </div>
                                                                        </TableHead>
                                                                    ));
                                                                })()}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {Object.entries(monthData.dailyKPIScores).map(([date, kpiData]: [string, any]) => (
                                                                <TableRow 
                                                                    key={date} 
                                                                    className="hover:bg-gray-100"
                                                                >
                                                                    <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800 text-xs">
                                                                        {formatDate(date)}
                                                                    </TableCell>
                                                                    {/* Get all unique KPI names */}
                                                                    {(() => {
                                                                        const allKPIs = new Set<string>();
                                                                        Object.values(monthData.dailyKPIScores).forEach((dayData: any) => {
                                                                            Object.keys(dayData).forEach(kpiName => allKPIs.add(kpiName));
                                                                        });
                                                                        
                                                                        return Array.from(allKPIs).map((kpiName) => {
                                                                            const kpi = kpiData[kpiName];
                                                                            return (
                                                                                <TableCell key={kpiName} className="text-center align-middle border-r border-gray-200">
                                                                                    {kpi ? (
                                                                                        <div className="text-xs font-medium text-gray-900 py-1">
                                                                                            {kpi.weight || 'N/A'} - {kpi.avgPoints?.toFixed(1) || '0.0'} - {kpi.avgScore?.toFixed(1) || '0'}/5
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-gray-400 text-xs">-</div>
                                                                                    )}
                                                                                </TableCell>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-gray-500 text-sm">No daily KPI data for {monthName}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : data ? (
                            // Show single month data
                            <>
                                {/* Daily Summary Header */}
                                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">Total Score</div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {data?.dailySummary?.totalScore?.toFixed(1) || '0.0'}/5
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">Total Points</div>
                                            <div className="text-lg font-bold text-green-600">
                                                {data?.dailySummary?.totalPoints?.toFixed(1) || '0.0'}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 mb-1">Avg Weight</div>
                                            <div className="text-lg font-bold text-orange-600">
                                                {data?.dailySummary?.totalWeight?.toFixed(1) || '0.0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily KPI Table */}
                                {filteredData.length > 0 ? (
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                            <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[150px] font-semibold text-gray-800">
                                                Date
                                            </TableHead>
                                            {/* Get all unique KPI names and create columns for each */}
                                            {(() => {
                                                const allKPIs = new Set<string>();
                                                filteredData.forEach((dayData) => {
                                                    Object.keys(dayData.kpiData).forEach(kpiName => allKPIs.add(kpiName));
                                                });
                                                
                                                return Array.from(allKPIs).map((kpiName, index) => (
                                                    <TableHead 
                                                        key={kpiName}
                                                        className="bg-white text-gray-800 text-center font-semibold min-w-[150px] border-r border-gray-300"
                                                    >
                                                        <div className="flex flex-col items-center py-2">
                                                            <span className="text-sm font-bold text-gray-900">{kpiName}</span>
                                                            <span className="text-xs text-gray-600 mt-1">Weight - Points - Score</span>
                                                        </div>
                                                    </TableHead>
                                                ));
                                            })()}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.map((dayData, dayIndex) => (
                                            <TableRow 
                                                key={dayData.date} 
                                                className={`${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                            >
                                                <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800">
                                                    {formatDate(dayData.date)}
                                                </TableCell>
                                                {/* Get all unique KPI names */}
                                                {(() => {
                                                    const allKPIs = new Set<string>();
                                                    filteredData.forEach((dayData) => {
                                                        Object.keys(dayData.kpiData).forEach(kpiName => allKPIs.add(kpiName));
                                                    });
                                                    
                                                    return Array.from(allKPIs).map((kpiName) => {
                                                        const kpiData = dayData.kpiData[kpiName];
                                                        return (
                                                            <TableCell key={kpiName} className="text-center align-middle border-r border-gray-200">
                                                                {kpiData ? (
                                                                    <div className="text-sm font-medium text-gray-900 py-2">
                                                                        {kpiData.weight || 'N/A'} - {kpiData.avgPoints?.toFixed(1) || '0.0'} - {kpiData.avgScore?.toFixed(1) || '0'}/5
                                                </div>
                                                                ) : (
                                                                    <div className="text-gray-400 text-sm">-</div>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    });
                                                })()}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 font-medium">No daily KPI data found matching your search</p>
                            </div>
                        )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 font-medium">No data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Export Modal */}
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
                                    Export Daily KPI Report
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
};
