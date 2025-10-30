
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { AlertTriangle, Building, Users, Tag, TrendingUp, UserX, Download, X, FileText, Sheet, Info } from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
    mostWalkoutFloor: string;
    mostAssignedStaff: string;
    mostWalkoutType: string;
    floorAnalysis: Array<{
        floor: string;
        count: number;
        percentage: number;
    }>;
    typeAnalysis: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
}

export const WalkoutReportPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    // Accept both start/end and startDate/endDate for compatibility
    const startDate = searchParams.get('startDate') || searchParams.get('start') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('end') || undefined;
   let month = searchParams.get("month");

// Month is already 1-based from Reports.tsx (January=1, October=10, December=12)
// month is now always a string or null

    const year = searchParams.get('year');
    
    // Debug logging
    console.log("=== MONTH STATE ===");
    console.log("month from URL:", month);
    console.log("year from URL:", year);
    console.log("startDate:", startDate);
    console.log("endDate:", endDate);
    console.log("===================");
    
    console.log('WalkoutReportPage - URL params:', {
        startDate,
        endDate,
        month,
        year,
        fullURL: window.location.href
    });
    const [walkoutReport, setWalkoutReport] = useState<WalkoutData[]>([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData>({
        totalWalkouts: 0,
        mostWalkoutFloor: 'No Data',
        mostAssignedStaff: 'No Data',
        mostWalkoutType: 'No Data',
        floorAnalysis: [],
        typeAnalysis: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [staffList, setStaffList] = useState<any[]>([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Handle floor selection from pie chart - navigate to floor-wise page
    const handleFloorClick = (floorName: string) => {
        console.log('Navigating to floor-wise walkout with floor:', floorName, 'startDate:', startDate, 'endDate:', endDate, 'month:', month);
        
        // Navigate to floor-wise walkout page with floor name and date parameters
        const params = new URLSearchParams();
        params.set('floor', floorName);
        if (startDate) {
            params.set('startDate', startDate);
            params.set('start', startDate); // Add legacy param for backward compatibility
        }
        if (endDate) {
            params.set('endDate', endDate);
            params.set('end', endDate); // Add legacy param for backward compatibility
        }
        // Add month and year if available
        if (month) {
            params.set('month', month);
        }
        if (year) {
            params.set('year', year);
        }
        
        const url = `/Owner/reports/walkout/floor-wise-walkout?${params.toString()}`;
        console.log('Navigation URL:', url);
        navigate(url);
    };

    // Handle staff click - navigate to staff sales page
    const handleStaffClick = (staffUuid: string) => {
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
        
        navigate(`/Owner/reports/sales/staffSales/${staffUuid}?${params.toString()}`);
    };



    const WalkoutInfo: React.FC<any> = ({
        name,
        staffId,
        itemName,
        type,
        priority,
        created_at,
        submittedBy,
    }) => {
        const priorityColors: Record<string, string> = {
            High: "bg-red-100 text-red-800",
            Medium: "bg-yellow-100 text-yellow-800",
            Low: "bg-green-100 text-green-800",
        };

        const priorityClass = priorityColors[priority] || priorityColors["Low"];

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {name}
                            </h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {staffId}
                            </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Item:</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {typeof itemName === "object"
                                        ? itemName.name
                                        : itemName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Type:</span>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                    {typeof type === "object" ? type.name : type}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{new Date(created_at).toLocaleDateString()}</span>
                                {submittedBy && (
                                    <>
                                        <span>•</span>
                                        <span>By: {submittedBy.name}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="ml-2">
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityClass}`}
                        >
                            {priority}
                        </span>
                    </div>
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
                // Determine if we should fetch all months or specific month data
                const isAllMonths = month === "all" || (!startDate && !endDate);
                const endpoint = isAllMonths ? "/owner/all-months-walkoutReport" : "/owner/walkoutReport";
                
                const params = isAllMonths 
                    ? { year: year || new Date().getFullYear() }
                    : { 
                        startDate: startDate || undefined,
                        endDate: endDate || undefined,
                        month: month ? parseInt(month) : null,
                        year: year ? parseInt(year) : null
                      };

                console.log('📥 Fetching walkout data with params:', { isAllMonths, endpoint, params });
                console.log('📊 URL params sent:', { startDate, endDate, month, year });
                const res = await axiosInstance.get(endpoint, { params });

                console.log("Walkout report API response:", res.data);

                if (res.data.success) {
                    setWalkoutReport(res.data.walkouts || []);
                    setSummaryData(
                        res.data.summary || {
                            totalWalkouts: 0,
                            highPriority: 0,
                            mediumPriority: 0,
                            lowPriority: 0,
                            mostWalkoutFloor: 'No Data',
                            mostAssignedStaff: 'No Data',
                            mostWalkoutType: 'No Data',
                            floorAnalysis: [],
                            typeAnalysis: []
                        }
                    );
                } else {
                    setError(res.data.error || "Failed to fetch walkout report");
                    toast.error(res.data.error || "Failed to fetch walkout report");
                }

                // Fetch staff list (role: Staff only)
                try {
                    const staffRes = await axiosInstance.get('/owner/staffReport', { params });
                    if (staffRes.data?.success) {
                        const staffWithRole = (staffRes.data.staffReport || []).filter((s: any) => s.role === 'Staff');
                        setStaffList(staffWithRole);
                    }
                } catch (staffErr) {
                    console.error("Failed to fetch staff list:", staffErr);
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
    }, [startDate, endDate, month, year, dispatch]);

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
    }

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

            {/* Summary Cards - Matching Dashboard Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <SummaryCard 
                        title="Total Walkouts" 
                        value={summaryData.totalWalkouts} 
                        icon={UserX} 
                        color="text-[#FF3F33]" 
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <SummaryCard 
                        title="Most Walkout Floor" 
                        value={summaryData.mostWalkoutFloor} 
                        icon={Building} 
                        color="text-green-500" 
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <SummaryCard 
                        title="Most Assigned Staff" 
                        value={summaryData.mostAssignedStaff} 
                        icon={Users} 
                        color="text-purple-500" 
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <SummaryCard 
                        title="Most Walkout Type" 
                        value={summaryData.mostWalkoutType} 
                        icon={Tag} 
                        color="text-orange-500" 
                    />
                </motion.div>
            </div>

            {/* Pie Chart for Floor Analysis */}
            {summaryData.floorAnalysis.length > 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Walkouts by Floor</h3>
                            <p className="text-sm text-gray-600">Click on a graph to view details</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={summaryData.floorAnalysis}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ floor, percentage }) => `${floor} (${percentage}%)`}
                                        outerRadius={120}
                                        innerRadius={60}
                                        fill="#8884d8"
                                        dataKey="count"
                                        onClick={(data) => handleFloorClick(data.floor)}
                                        className="cursor-pointer"
                                    >
                                        {summaryData.floorAnalysis.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={index === 0 ? '#FF3F33' : index === 1 ? '#10B981' : index === 2 ? '#8B5CF6' : '#F59E0B'} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, 'Walkouts']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Custom Floor Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                            {summaryData.floorAnalysis.map((entry, index) => {
                                const colors = ['#FF3F33', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899'];
                                const color = colors[index] || '#6B7280';
                                
                                return (
                                    <motion.button
                                        key={entry.floor}
                                        onClick={() => handleFloorClick(entry.floor)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow hover:border-gray-400"
                                    >
                                        <div 
                                            className="w-4 h-4 rounded-full" 
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            {entry.floor}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Floor &gt;
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <UserX className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        No walkout data found for the selected date range.
                    </CardContent>
                </Card>
            )}

            {/* Staff List Section */}
            {staffList.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff List</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {staffList.map((staff, index) => (
                                <motion.button
                                    key={staff.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStaffClick(staff.id)}
                                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-600 font-semibold">
                                            {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">{staff.name}</p>
                                        <p className="text-xs text-gray-500">ID: {staff.staffId}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </motion.button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
};