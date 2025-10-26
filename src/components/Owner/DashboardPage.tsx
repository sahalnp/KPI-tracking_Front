

import React, { useState, useEffect } from "react";
import { Phone, Home, History, XCircle, BarChart3, UserX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Building, Target, Calendar, UserPlus } from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "@/components/ui/spinner";

import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutOwner } from "@/lib/logoutApi";
import { WalkOutManagementOwner } from "./Walkouts";



// ---------------- Components ----------------
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
                    {/* <p className="text-xl font-bold">{value}</p> */}
                    <p className="text-xl font-bold">{typeof value === "number" ?  formatNumberShort(value) : value}</p>

                    {subtitle && (
                        <p className="text-xs text-gray-600">{subtitle}</p>
                    )}
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </CardContent>
    </Card>
);
export const formatNumberShort = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
};
// ---------------- Main Dashboard ----------------
export default function OwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"home" | "walkouts">("home");
    const [direction, setDirection] = useState<"left" | "right">("right");

    const [totalUsers, setTotalUsers] = useState(0);
    const [totalFloors, setTotalFloors] = useState(0);
    const [totalKPIs, setTotalKPIs] = useState(0);
    const [totalWalkouts, setTotalWalkouts] = useState(0);
    const dispatch=useDispatch()

    // Graph data states
    const [selectedGraphType, setSelectedGraphType] = useState<
         "walkouts" | "staff" | "kpi"
    >("staff");
    const [graphData, setGraphData] = useState<any[]>([]);
    const [floorPerformanceData, setFloorPerformanceData] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [graphLoading, setGraphLoading] = useState(false);

    // Format currency helper
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };
// Format big numbers (500000 → 500K, 1200000 → 1.2M)
const formatNumberShort = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
};

    // Fetch graph data
    const fetchGraphData = async (type: string) => {
        setGraphLoading(true);
        try {
            const res = await axiosInstance.get(
                `/owner/dashboard/graph?type=${type}&months=4`
            );
            console.log(res.data,"7879879798789");
            
            setGraphData(res.data.data);
        } catch (err: any) {
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
        } finally {
            setGraphLoading(false);
        }
    };

    // Fetch floor performance data
    const fetchFloorPerformanceData = async () => {
        try {
            const res = await axiosInstance.get(
                "/owner/dashboard/floor-performance"
            );
            console.log(res.data,"1234567890-qwertyuio");
            
            setFloorPerformanceData(res.data.data);
        } catch (err: any) {
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
            setError("Failed to load floor performance data.");
        }
    };

    // Fetch attendance data
    const fetchAttendanceData = async () => {
        try {
            const res = await axiosInstance.get(
                "/owner/dashboard/floor-attendance"
            );
             console.log(res.data,"!!!!!1234567890-qwertyuio");
            const attendanceData = res.data.data || [];
            
            // If no attendance data, try to get floors and show with 0 values
            if (attendanceData.length === 0) {
                try {
                    const floorsRes = await axiosInstance.get("/owner/getFloors");
                     console.log(res.data,"$$$$1234567890-qwertyuio");
                    const floors = floorsRes.data.floors || [];
                    
                    const emptyAttendanceData = floors.map((floor: any) => ({
                        floor: floor.name,
                        attendance: 0,
                    }));
                    
                    setAttendanceData(emptyAttendanceData);
                } catch {
                    setAttendanceData([]);
                }
            } else {
                setAttendanceData(attendanceData);
            }
        } catch (err: any) {
             if (err.response?.status === 401) {
                    const response:any = await logoutOwner();
                    if (response.success) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        dispatch(clearUser());
                    } else {
                        console.error("Logout failed on backend");
                    }
                } else {
                    // If API fails, try to get floors and show with 0 values
                    try {
                        const floorsRes = await axiosInstance.get("/owner/getFloors");
                         console.log(floorsRes.data,"####1234567890-qwertyuio");
                        const floors = floorsRes.data.floors || [];
                        
                        const emptyAttendanceData = floors.map((floor: any) => ({
                            floor: floor.name,
                            attendance: 0,
                        }));
                        
                        setAttendanceData(emptyAttendanceData);
                    } catch {
                        setAttendanceData([]);
                    }
                }
        }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/owner/details");
                console.log(res.data,"sdjfklsdjfklfjksldf");
                
                const data = res.data || {};

                setTotalUsers(data.totalUsers ?? 0);
                setTotalFloors(data.totalFloors ?? 0);
                setTotalKPIs(data.totalKPIs ?? 0);
                setTotalWalkouts(data.totalWalkouts ?? 0);
            } catch (err: any) {
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
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    useEffect(() => {
        fetchGraphData(selectedGraphType);
        fetchFloorPerformanceData();
        fetchAttendanceData();
    }, [selectedGraphType]);

    if (loading) return <LoadingSpinner />;

    if (error)
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#FF3F33] text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-4 space-y-6 max-w-5xl mx-auto">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-semibold text-gray-900">Owner Dashboard</h1>
                    </div>
                    <p className="text-sm text-gray-600">Store overview and analytics</p>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(value) => {
                    const newTab = value as "home" | "walkouts";
                    setDirection(newTab === "home" ? "right" : "left");
                    setActiveTab(newTab);
                }}
                className="space-y-6 mt-8"
            >
                <TabsList className="relative grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                    <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute inset-y-1 w-[calc(50%-0.25rem)] bg-white rounded-md shadow-sm"
                        style={{
                            left: activeTab === "home" ? "0.25rem" : "calc(50% + 0.25rem)",
                        }}
                    />

                    <TabsTrigger
                        value="home"
                        className={`flex items-center justify-center gap-2 rounded-md transition-colors relative z-10 ${
                            activeTab === "home" ? "text-[#FF3F33]" : "text-gray-600"
                        }`}
                    >
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="walkouts"
                        className={`flex items-center justify-center gap-2 rounded-md transition-colors relative z-10 ${
                            activeTab === "walkouts" ? "text-[#FF3F33]" : "text-gray-600"
                        }`}
                    >
                        <History className="h-4 w-4" />
                        <span>Walkouts</span>
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ x: direction === "left" ? 300 : -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction === "left" ? -300 : 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Home Tab */}
                        {activeTab === "home" && (
                            <TabsContent value="home" className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <SummaryCard title="Employees" value={totalUsers} icon={Users} color="text-[#FF3F33]" />
                                    <SummaryCard title="Floors" value={totalFloors} icon={Building} color="text-green-500" />
                                    <SummaryCard title="KPIs" value={totalKPIs} icon={Target} color="text-purple-500" />
                                    <SummaryCard title="Walkout" value={totalWalkouts} icon={UserX} color="text-orange-500" />
                                </div>

                                {/* Analytics Graphs */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Sales Trend Graph */}
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <BarChart3 className="h-5 w-5" />
                                                        { selectedGraphType === "walkouts"
                                                            ? "Walkout Trend"
                                                            : selectedGraphType === "staff"
                                                            ? "Staff Trend"
                                                            : "KPI Trend"}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {selectedGraphType === "walkouts"
                                                            ? "Monthly walkout incidents"
                                                        
                                                            : selectedGraphType === "staff"
                                                            ? "Monthly staff performance"
                                                            : "Monthly KPI performance"}
                                                    </CardDescription>
                                                </div>
                                                <select
                                                    value={selectedGraphType}
                                                    onChange={(e) =>
                                                        setSelectedGraphType(
                                                            e.target.value as "walkouts" | "staff" | "kpi"
                                                        )
                                                    }
                                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3F33]"
                                                >
                                                   
                                                    <option value="walkouts">Walkouts</option>
                                                    <option value="staff">Staff</option>
                                                    <option value="kpi">KPI</option>
                                                </select>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pl-0">
                                            {graphLoading ? (
                                                <div className="flex items-center justify-center h-[250px]">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF3F33]"></div>
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <LineChart data={graphData} margin={{ left: -20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                        <XAxis dataKey="period" style={{ fontSize: "12px" }} />
                                                        <YAxis style={{ fontSize: "12px" }} />
                                                        {/* <Tooltip
                                                            formatter={(value: number) =>
                                                                selectedGraphType === "staff"
                                                                    ? formatCurrency(value)
                                                                    : value
                                                            }
                                                            contentStyle={{ borderRadius: "8px" }}
                                                        /> */}
                                                        <Tooltip
    formatter={(value: number) => formatNumberShort(value)}
    contentStyle={{ borderRadius: "8px" }}
/>

                                                        <Line
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke="#FF3F33"
                                                            strokeWidth={2}
                                                            dot={{ fill: "#FF3F33", r: 4 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Floor Performance and Attendance Graphs */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                   
                                    {/* Floor Performance */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <BarChart3 className="h-5 w-5" />
      Floor Performance
    </CardTitle>
    <CardDescription>Sales by Floor: Only 10% of the price is displayed</CardDescription>

  </CardHeader>
  <CardContent className="pl-0">
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={floorPerformanceData} margin={{ left: -20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="floor" style={{ fontSize: '12px' }} />
      <YAxis
        tickFormatter={(v) => formatNumberShort(v)} // short labels
        style={{ fontSize: '12px' }}
      />
      <Tooltip
        formatter={(value: number) => formatNumberShort(value)}
        contentStyle={{ borderRadius: '8px' }}
      />
      <Bar dataKey="sales" fill="#FF3F33" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</CardContent>
</Card>


                                    {/* Floor Attendance */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5" />
                                                Floor Attendance
                                            </CardTitle>
                                            <CardDescription>Attendance percentage by floor</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pl-0">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={attendanceData} margin={{ left: -20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="floor" style={{ fontSize: "12px" }} />
                                                    <YAxis style={{ fontSize: "12px" }} />
                                                    <Tooltip
                                                        formatter={(value: number) => `${value}%`}
                                                        contentStyle={{ borderRadius: "8px" }}
                                                    />
                                                    <Bar dataKey="attendance" fill="#FF3F33" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        )}

                        {/* Walkouts Tab */}
                        {activeTab === "walkouts" && (
                            <TabsContent value="walkouts" className="space-y-6">
                                <WalkOutManagementOwner/>
                            </TabsContent>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}