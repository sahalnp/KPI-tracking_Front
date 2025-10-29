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
 
    // Filter and search states
    const [searchDate, setSearchDate] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [allMonthsData, setAllMonthsData] = useState<any>(null);
    
    // View state: 'monthly' | 'weekly' | 'daily'
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
    
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
                if (month === 'all') {
                    const allMonthsRes = await axiosInstance.get(`/owner/staff/${id}/all-months-daily-kpi-details`, {
                        params: {
                            year: year,
                        },
                    });

                    if (allMonthsRes.data.success) {
                        console.log('All Months Daily Data:', allMonthsRes.data.data);
                        setAllMonthsData(allMonthsRes.data.data);
                        setData(null); // Clear single month data
                    } else {
                        setError(allMonthsRes.data.error || "Failed to fetch all months data");
                        toast.error(allMonthsRes.data.error || "Failed to fetch all months data");
                    }
                } else {
                    // Fetch single month data
                    const monthIndex = month ? (typeof month === 'string' ? parseInt(month) : month) : null;
                    const res = await axiosInstance.get(`/owner/staff/${id}/daily-kpi-details`, {
                        params: {
                            start: startDate,
                            end: endDate,
                            month: monthIndex !== null ? monthIndex + 1 : null, // Convert 0-based to 1-based month
                            year: year,
                        },
                    });

                    if (res.data.success) {
                        setData(res.data.data);
                        setAllMonthsData(null); // Clear all months data
                        // For single month, default to daily view
                        setViewMode('daily');
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

    const getWeekNumberByDate = (date: Date): number => {
        const day = date.getDate();
        if (day >= 1 && day <= 7) return 1;
        if (day >= 8 && day <= 14) return 2;
        if (day >= 15 && day <= 21) return 3;
        if (day >= 22 && day <= 28) return 4;
        return 5; // Days 29-31
    };

    // Group daily data by week
    const groupDataByWeek = (dailyScores: DailyKPIScores) => {
        const weeklyData: { [weekKey: string]: any } = {};
        
        Object.keys(dailyScores).forEach(date => {
            const dateObj = new Date(date);
            const weekNum = getWeekNumberByDate(dateObj);
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const year = dateObj.getFullYear();
            
            // Calculate date range for this week
            const weekStart = weekNum === 1 ? 1 : (weekNum - 1) * 7 + 1;
            const weekEnd = weekNum <= 4 ? weekNum * 7 : new Date(year, dateObj.getMonth() + 1, 0).getDate();
            
            const weekKey = `Week ${weekNum} (${month} ${weekStart}-${weekEnd})`;
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {};
            }
            
            // Merge all KPI data for this week
            Object.keys(dailyScores[date]).forEach(kpiName => {
                const kpiData = dailyScores[date][kpiName];
                if (!weeklyData[weekKey][kpiName]) {
                    weeklyData[weekKey][kpiName] = {
                        scores: [],
                        weights: [],
                        points: []
                    };
                }
                weeklyData[weekKey][kpiName].scores.push(kpiData.avgScore);
                weeklyData[weekKey][kpiName].weights.push(kpiData.weight);
                weeklyData[weekKey][kpiName].points.push(kpiData.avgPoints);
            });
        });
        
        // Calculate averages for each week
        const processedWeeklyData: { [weekKey: string]: any } = {};
        Object.keys(weeklyData).forEach(weekKey => {
            processedWeeklyData[weekKey] = {};
            Object.keys(weeklyData[weekKey]).forEach(kpiName => {
                const kpiData = weeklyData[weekKey][kpiName];
                processedWeeklyData[weekKey][kpiName] = {
                    avgScore: (kpiData.scores.reduce((a: number, b: number) => a + b, 0) / kpiData.scores.length).toFixed(1),
                    avgPoints: (kpiData.points.reduce((a: number, b: number) => a + b, 0) / kpiData.points.length).toFixed(1),
                    weight: kpiData.weights[0] || 'N/A'
                };
            });
        });
        
        return processedWeeklyData;
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

        // Get staff info from either single month data or all months data
    const getStaffInfo = () => {
        if (data?.staff) {
            return data.staff;
        }
        if (allMonthsData) {
            // Find staff info from any available month
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            for (const monthName of months) {
                if (allMonthsData[monthName]?.staff) {
                    return allMonthsData[monthName].staff;
                }
            }
        }
        return null;
    };

    const staffInfo = getStaffInfo();

    return (
        <div className="space-y-6 p-6 pb-32 min-h-screen max-w-7xl mx-auto relative z-0 overflow-hidden">
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
                                {staffInfo?.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{staffInfo?.name}</h3>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                            staffInfo?.role === 'Staff' ? 'bg-green-100 text-green-800' :
                            staffInfo?.role === 'FloorSupervisor' ? 'bg-blue-100 text-blue-800' :
                            staffInfo?.role === 'Accountant' ? 'bg-purple-100 text-purple-800' :
                            staffInfo?.role === 'Admin' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {staffInfo?.role || 'Staff'}
                        </span>
                    </div>

                    {/* Second Line: ID | Floor-Section | Number */}
                    <div className="text-sm text-gray-600">
                        <span className="font-mono">ID: {staffInfo?.staffId}</span>
                        <span className="mx-2">|</span>
                        <span>
                            {staffInfo?.floor} Floor
                            {staffInfo?.section && `-${staffInfo.section}`}
                        </span>
                        <span className="mx-2">|</span>
                        <span>Number: {staffInfo?.mobile}</span>
                    </div>
                </motion.div>
            )}
           
            {/* View Tabs - Only show for single month or all months */}
            {(data || allMonthsData) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center gap-2 mb-6"
                >
                    {month === 'all' ? (
                        // For all months: Show 3 tabs (Monthly, Weekly, Daily)
                        <>
                            <Button
                                onClick={() => setViewMode('monthly')}
                                className={`px-6 py-2 transition-all duration-200 ${
                                    viewMode === 'monthly' 
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Monthly
                            </Button>
                            <Button
                                onClick={() => setViewMode('weekly')}
                                className={`px-6 py-2 transition-all duration-200 ${
                                    viewMode === 'weekly' 
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Weekly
                            </Button>
                            <Button
                                onClick={() => setViewMode('daily')}
                                className={`px-6 py-2 transition-all duration-200 ${
                                    viewMode === 'daily' 
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Daily
                            </Button>
                        </>
                    ) : (
                        // For single month: Show 2 tabs (Weekly, Daily)
                        <>
                            <Button
                                onClick={() => setViewMode('weekly')}
                                className={`px-6 py-2 transition-all duration-200 ${
                                    viewMode === 'weekly' 
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Weekly
                            </Button>
                            <Button
                                onClick={() => setViewMode('daily')}
                                className={`px-6 py-2 transition-all duration-200 ${
                                    viewMode === 'daily' 
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Daily
                            </Button>
                        </>
                    )}
                </motion.div>
            )}

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
                            {month === 'all' ? 'All Months Daily KPI Summary' : 'Daily KPI Summary'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {month === 'all' && allMonthsData ? (
                            // Show all months data based on view mode
                            <div className="space-y-4">
                                {viewMode === 'monthly' && (() => {
                                    // Monthly View: Show all months in one table
                                    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                    const currentDate = new Date();
                                    const currentMonthIndex = currentDate.getMonth();
                                    const monthsToShow = monthOrder.slice(0, currentMonthIndex + 1);
                                    
                                    // Filter months with daily KPI data
                                    const monthsWithData = monthsToShow.filter(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        return monthData && monthData.dailyKPIScores && Object.keys(monthData.dailyKPIScores).length > 0;
                                    });
                                    
                                    if (monthsWithData.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 font-medium">No daily KPI data available for any month</p>
                                            </div>
                                        );
                                    }
                                    
                                    // Get all unique KPIs across all months
                                    const allKPIs = new Set<string>();
                                    const monthlyAggregatedData: any = {};
                                    
                                    monthsWithData.forEach(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        const kpiAggregates: any = {};
                                        
                                        // Aggregate daily data to monthly
                                        Object.values(monthData.dailyKPIScores).forEach((dayData: any) => {
                                            Object.keys(dayData).forEach(kpiName => {
                                                allKPIs.add(kpiName);
                                                if (!kpiAggregates[kpiName]) {
                                                    kpiAggregates[kpiName] = {
                                                        points: [],
                                                        scores: [],
                                                        weights: []
                                                    };
                                                }
                                                const kpi = dayData[kpiName];
                                                kpiAggregates[kpiName].points.push(kpi.avgPoints || 0);
                                                kpiAggregates[kpiName].scores.push(kpi.avgScore || 0);
                                                kpiAggregates[kpiName].weights.push(kpi.weight || 0);
                                            });
                                        });
                                        
                                        // Calculate averages
                                        monthlyAggregatedData[monthName] = {};
                                        Object.keys(kpiAggregates).forEach(kpiName => {
                                            const agg = kpiAggregates[kpiName];
                                            monthlyAggregatedData[monthName][kpiName] = {
                                                avgPoints: agg.points.reduce((a: number, b: number) => a + b, 0) / agg.points.length,
                                                avgScore: agg.scores.reduce((a: number, b: number) => a + b, 0) / agg.scores.length,
                                                weight: agg.weights[0] || 0
                                            };
                                        });
                                    });
                                    
                                    // Calculate overall performance
                                    let totalPoints = 0;
                                    let totalScore = 0;
                                    let totalWeight = 0;
                                    let count = 0;
                                    
                                    Object.values(monthlyAggregatedData).forEach((monthData: any) => {
                                        Object.values(monthData).forEach((kpi: any) => {
                                            totalPoints += kpi.avgPoints;
                                            totalScore += kpi.avgScore;
                                            totalWeight += kpi.weight;
                                            count++;
                                        });
                                    });
                                    
                                    return (
                                        <>
                                            {/* Overall Performance Card */}
                                            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Total Points</div>
                                                        <div className="text-lg font-bold text-green-600">
                                                            {totalPoints.toFixed(1)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Avg Weight</div>
                                                        <div className="text-lg font-bold text-orange-600">
                                                            {(count > 0 ? totalWeight / count : 0).toFixed(1)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Avg Score</div>
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {(count > 0 ? totalScore / count : 0).toFixed(1)}/5
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Monthly Table */}
                                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                            <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[150px] font-semibold text-gray-800">
                                                                Month
                                                            </TableHead>
                                                            {Array.from(allKPIs).map(kpiName => (
                                                                <TableHead 
                                                                    key={kpiName}
                                                                    className="bg-white text-gray-800 text-center font-semibold min-w-[180px] border-r border-gray-300"
                                                                >
                                                                    <div className="flex flex-col items-center py-2">
                                                                        <span className="text-sm font-bold text-gray-900">{kpiName}</span>
                                                                        <span className="text-xs text-gray-600 mt-1">
                                                                            (Weight: {monthlyAggregatedData[monthsWithData[0]]?.[kpiName]?.weight?.toFixed(1) || 'N/A'})
                                                                        </span>
                                                                        <span className="text-xs text-gray-600">Avg Points - Avg Score</span>
                                                                    </div>
                                                                </TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {monthsWithData.map((monthName, monthIndex) => (
                                                            <TableRow 
                                                                key={monthName}
                                                                className={`${monthIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                                            >
                                                                <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800">
                                                                    {monthName}
                                                                </TableCell>
                                                                {Array.from(allKPIs).map(kpiName => {
                                                                    const kpi = monthlyAggregatedData[monthName]?.[kpiName];
                                                                    return (
                                                                        <TableCell key={kpiName} className="text-center align-middle border-r border-gray-200">
                                                                            {kpi ? (
                                                                                <div className="text-sm font-medium text-gray-900 py-2">
                                                                                    {kpi.avgPoints.toFixed(1)} - {kpi.avgScore.toFixed(1)}/5
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-gray-400 text-sm">-</div>
                                                                            )}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    );
                                })()}
                                
                                {viewMode === 'weekly' && (() => {
                                    // Weekly View: Show weeks grouped by month
                                    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                    const currentDate = new Date();
                                    const currentMonthIndex = currentDate.getMonth();
                                    const monthsToShow = monthOrder.slice(0, currentMonthIndex + 1);
                                    
                                    const monthsWithWeeklyData = monthsToShow.filter(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        return monthData && monthData.dailyKPIScores && Object.keys(monthData.dailyKPIScores).length > 0;
                                    });
                                    
                                    if (monthsWithWeeklyData.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 font-medium">No weekly KPI data available</p>
                                            </div>
                                        );
                                    }
                                    
                                    // Calculate overall performance across all weeks
                                    let totalPoints = 0;
                                    let totalWeight = 0;
                                    let totalScore = 0;
                                    let kpiCount = 0;
                                    
                                    monthsWithWeeklyData.forEach(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        const weeklyGrouped = groupDataByWeek(monthData.dailyKPIScores);
                                        
                                        Object.values(weeklyGrouped).forEach((weekData: any) => {
                                            Object.values(weekData).forEach((kpiData: any) => {
                                                totalPoints += parseFloat(kpiData.avgPoints) || 0;
                                                totalWeight += parseFloat(kpiData.weight) || 0;
                                                totalScore += parseFloat(kpiData.avgScore) || 0;
                                                kpiCount++;
                                            });
                                        });
                                    });
                                    
                                    const avgWeight = kpiCount > 0 ? totalWeight / kpiCount : 0;
                                    const avgScore = kpiCount > 0 ? totalScore / kpiCount : 0;
                                    
                                    return (
                                        <>
                                            {/* Overall Performance Card */}
                                            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Total Points</div>
                                                        <div className="text-lg font-bold text-green-600">
                                                            {totalPoints.toFixed(1)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Avg Weight</div>
                                                        <div className="text-lg font-bold text-orange-600">
                                                            {avgWeight.toFixed(1)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-600 mb-1">Avg Score</div>
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {avgScore.toFixed(1)}/5
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Monthly Weekly Cards */}
                                            {monthsWithWeeklyData.map(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        const weeklyGrouped = groupDataByWeek(monthData.dailyKPIScores);
                                        const weekKeys = Object.keys(weeklyGrouped).sort((a, b) => {
                                            const weekNumA = parseInt(a.match(/Week (\d+)/)?.[1] || '0');
                                            const weekNumB = parseInt(b.match(/Week (\d+)/)?.[1] || '0');
                                            return weekNumA - weekNumB;
                                        });
                                        
                                        if (weekKeys.length === 0) return null;
                                        
                                        // Get all KPIs for this month
                                        const allKPIs = new Set<string>();
                                        Object.values(weeklyGrouped).forEach((weekData: any) => {
                                            Object.keys(weekData).forEach(kpiName => allKPIs.add(kpiName));
                                        });
                                        
                                        return (
                                            <div key={monthName} className="space-y-4">
                                                {/* Month Header */}
                                               
                                                
                                                {/* Weekly Table */}
                                                <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                                <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[150px] font-semibold text-gray-800">
                                                                    Week
                                                                </TableHead>
                                                                {Array.from(allKPIs).map(kpiName => (
                                                                    <TableHead 
                                                                        key={kpiName}
                                                                        className="bg-white text-gray-800 text-center font-semibold min-w-[180px] border-r border-gray-300"
                                                                    >
                                                                        <div className="flex flex-col items-center py-2">
                                                                            <span className="text-sm font-bold text-gray-900">{kpiName}</span>
                                                                            <span className="text-xs text-gray-600 mt-1">
                                                                                (Weight: {weeklyGrouped[weekKeys[0]]?.[kpiName]?.weight || 'N/A'})
                                                                            </span>
                                                                            <span className="text-xs text-gray-600">Avg Points - Avg Score</span>
                                                                        </div>
                                                                    </TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {weekKeys.map((weekKey, weekIndex) => (
                                                                <TableRow 
                                                                    key={weekKey}
                                                                    className={`${weekIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                                                >
                                                                    <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800">
                                                                        {weekKey}
                                                                    </TableCell>
                                                                    {Array.from(allKPIs).map(kpiName => {
                                                                        const kpi = weeklyGrouped[weekKey]?.[kpiName];
                                                                        return (
                                                                            <TableCell key={kpiName} className="text-center align-middle border-r border-gray-200">
                                                                                {kpi ? (
                                                                                    <div className="text-sm font-medium text-gray-900 py-2">
                                                                                        {kpi.avgPoints} - {kpi.avgScore}/5
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-gray-400 text-sm">-</div>
                                                                                )}
                                                                            </TableCell>
                                                                        );
                                                                    })}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                        </>
                                    );
                                })()}
                                
                                {viewMode === 'daily' && (() => {
                                    // Daily View: Show separate cards for each month
                                    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                    const currentDate = new Date();
                                    const currentMonthIndex = currentDate.getMonth();
                                    const monthsToShow = monthOrder.slice(0, currentMonthIndex + 1);
                                    
                                    const monthsWithDailyData = monthsToShow.filter(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        return monthData && monthData.dailyKPIScores && Object.keys(monthData.dailyKPIScores).length > 0;
                                    });
                                    
                                    if (monthsWithDailyData.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 font-medium">No daily KPI data available</p>
                                            </div>
                                        );
                                    }
                                    
                                    return monthsWithDailyData.map(monthName => {
                                        const monthData = allMonthsData[monthName];
                                        
                                        // Get all unique KPI names for this month
                                        const allKPIs = new Set<string>();
                                        Object.values(monthData.dailyKPIScores).forEach((dayData: any) => {
                                            Object.keys(dayData).forEach(kpiName => allKPIs.add(kpiName));
                                        });
                                        
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

                                                {/* Daily KPI Table */}
                                                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                                <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[140px] font-semibold text-gray-800">
                                                                    Date ({monthName})
                                                                </TableHead>
                                                                {Array.from(allKPIs).map(kpiName => (
                                                                    <TableHead 
                                                                        key={kpiName}
                                                                        className="bg-white text-gray-800 text-center font-semibold min-w-[150px] border-r border-gray-300"
                                                                    >
                                                                        <div className="flex flex-col items-center py-1">
                                                                            <span className="text-xs font-bold text-gray-900">{kpiName}</span>
                                                                            <span className="text-xs text-gray-600">
                                                                                (Weight: {(Object.values(monthData.dailyKPIScores)[0] as any)[kpiName]?.weight || 'N/A'})
                                                                            </span>
                                                                            <span className="text-xs text-gray-600">Points - Score</span>
                                                                        </div>
                                                                    </TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {Object.entries(monthData.dailyKPIScores)
                                                                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                                                                .map(([date, kpiData]: [string, any], dayIndex) => (
                                                                    <TableRow 
                                                                        key={date}
                                                                        className={`${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                                                    >
                                                                        <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800 text-xs">
                                                                            {formatDate(date)}
                                                                        </TableCell>
                                                                        {Array.from(allKPIs).map(kpiName => {
                                                                            const kpi = kpiData[kpiName];
                                                                            return (
                                                                                <TableCell key={kpiName} className="text-center align-middle border-r border-gray-200">
                                                                                    {kpi ? (
                                                                                        <div className="text-xs font-medium text-gray-900 py-1">
                                                                                            {kpi.avgPoints?.toFixed(1) || '0.0'} - {kpi.avgScore?.toFixed(1) || '0'}/5
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-gray-400 text-xs">-</div>
                                                                                    )}
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : data ? (
                            // Show single month data
                            <div className="space-y-4">
                                {viewMode === 'weekly' ? (
                                    // Weekly View for Single Month
                                    (() => {
                                        const weeklyGrouped = groupDataByWeek(data.dailyKPIScores);
                                        const weekKeys = Object.keys(weeklyGrouped).sort((a, b) => {
                                            const weekNumA = parseInt(a.match(/Week (\d+)/)?.[1] || '0');
                                            const weekNumB = parseInt(b.match(/Week (\d+)/)?.[1] || '0');
                                            return weekNumA - weekNumB;
                                        });
                                        
                                        if (weekKeys.length === 0) {
                                            return (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-600 font-medium">No weekly KPI data available</p>
                                                </div>
                                            );
                                        }
                                        
                                        // Get all unique KPI names
                                        const allKPIs = new Set<string>();
                                        Object.values(weeklyGrouped).forEach((weekData: any) => {
                                            Object.keys(weekData).forEach(kpiName => allKPIs.add(kpiName));
                                        });
                                        
                                        // Calculate overall performance
                                        let totalPoints = 0;
                                        let totalWeight = 0;
                                        let totalScore = 0;
                                        let kpiCount = 0;
                                        
                                        Object.values(weeklyGrouped).forEach((weekData: any) => {
                                            Object.values(weekData).forEach((kpiData: any) => {
                                                totalPoints += parseFloat(kpiData.avgPoints) || 0;
                                                totalWeight += parseFloat(kpiData.weight) || 0;
                                                totalScore += parseFloat(kpiData.avgScore) || 0;
                                                kpiCount++;
                                            });
                                        });
                                        
                                        const avgWeight = kpiCount > 0 ? totalWeight / kpiCount : 0;
                                        const avgScore = kpiCount > 0 ? totalScore / kpiCount : 0;
                                        
                                        return (
                                            <>
                                                {/* Overall Performance Card */}
                                                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-600 mb-1">Total Points</div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                {totalPoints.toFixed(1)}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-600 mb-1">Avg Weight</div>
                                                            <div className="text-lg font-bold text-orange-600">
                                                                {avgWeight.toFixed(1)}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-600 mb-1">Avg Score</div>
                                                            <div className="text-lg font-bold text-blue-600">
                                                                {avgScore.toFixed(1)}/5
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Weekly Table */}
                                                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                                                                <TableHead className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 min-w-[150px] font-semibold text-gray-800">
                                                                    Week
                                                                </TableHead>
                                                                {Array.from(allKPIs).map(kpiName => (
                                                                    <TableHead 
                                                                        key={kpiName}
                                                                        className="bg-white text-gray-800 text-center font-semibold min-w-[180px] border-r border-gray-300"
                                                                    >
                                                                        <div className="flex flex-col items-center py-2">
                                                                            <span className="text-sm font-bold text-gray-900">{kpiName}</span>
                                                                            <span className="text-xs text-gray-600 mt-1">
                                                                                (Weight: {weeklyGrouped[weekKeys[0]]?.[kpiName]?.weight || 'N/A'})
                                                                            </span>
                                                                            <span className="text-xs text-gray-600">Avg Points - Avg Score</span>
                                                                        </div>
                                                                    </TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {weekKeys.map((weekKey, weekIndex) => (
                                                                <TableRow 
                                                                    key={weekKey}
                                                                    className={`${weekIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                                                >
                                                                    <TableCell className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 font-semibold text-gray-800">
                                                                        {weekKey}
                                                                    </TableCell>
                                                                    {Array.from(allKPIs).map(kpiName => {
                                                                        const kpi = weeklyGrouped[weekKey]?.[kpiName];
                                                                        return (
                                                                            <TableCell key={kpiName} className="text-center align-middle border-r border-gray-200">
                                                                                {kpi ? (
                                                                                    <div className="text-sm font-medium text-gray-900 py-2">
                                                                                        {kpi.avgPoints} - {kpi.avgScore}/5
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-gray-400 text-sm">-</div>
                                                                                )}
                                                                            </TableCell>
                                                                        );
                                                                    })}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </>
                                        );
                                    })()
                                ) : (
                                    // Daily View for Single Month
                                    <>
                                        {/* Overall Performance Card */}
                                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                            <div className="grid grid-cols-3 gap-4">
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
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-600 mb-1">Total Score</div>
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {data?.dailySummary?.totalScore?.toFixed(1) || '0.0'}/5
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
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 font-medium">No data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

           
        </div>
    );
};
