


// // import React, { useState, useEffect } from "react";
// // import { Phone, UserX, Home, User2 } from "lucide-react";
// // import { motion } from "framer-motion";
// // import {
// //     Users,
// //     Building,
// //     Target,
// //     Calendar,
// //     UserPlus,
// //     XCircle,
// //     History,
// // } from "lucide-react";

// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // import { axiosInstance } from "@/api/axios";
// // import { LoadingSpinner } from "../ui/spinner";
// // import { cva } from "class-variance-authority";
// // import { Badge } from "../ui/badge";
// // import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
// // import { useDispatch } from "react-redux";
// // import { clearUser } from "@/features/UserSlice";
// // import { logoutOwner } from "@/lib/logoutApi";
// // import { WalkOutManagement } from "../Supervisor/WalkOutManagement";
// // import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// // // ---------------- Types ----------------
// // type KPI = {
// //     id: string;
// //     name: string;
// //     frequency: "daily" | "weekly" | "monthly";
// //     target: number;
// //     weight: number;
// //     max_points: number;
// //     isDlt: boolean;
// //     status: boolean;
// // };

// // type User = {
// //     id: string;
// //     name: string;
// //     role: string;
// //     mobile: string;
// //     section: string;
// //     created_at: string;
// //     floor_id: number;
// //     avatar?: string;
// // };

// // // ---------------- Helpers ----------------
// // const freqBadge = cva(
// //     "text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide",
// //     {
// //         variants: {
// //             frequency: {
// //                 daily: "bg-emerald-100 text-emerald-700",
// //                 weekly: "bg-sky-100 text-sky-700",
// //                 monthly: "bg-violet-100 text-violet-700",
// //             },
// //         },
// //     }
// // );

// // const SummaryCard: React.FC<{
// //     title: string;
// //     value: number | string;
// //     icon: React.ComponentType<{ className?: string }>;
// //     color: string;
// //     subtitle?: string;
// // }> = ({ title, value, icon: Icon, color, subtitle }) => (
// //     <div className="h-full bg-white rounded-lg border p-4 shadow-sm">
// //         <div className="flex items-center justify-between">
// //             <div>
// //                 <p className="text-sm text-gray-600">{title}</p>
// //                 <p className="text-xl font-bold">{value}</p>
// //                 {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
// //             </div>
// //             <Icon className={`h-6 w-6 ${color}`} />
// //         </div>
// //     </div>
// // );

// // // ---------------- Main Dashboard ----------------
// // export default function OwnerDashboard() {
// //     const [loading, setLoading] = useState(true);
// //     const [error, setError] = useState<string | null>(null);
// //     const [activeTab, setActiveTab] = useState<"user" | "kpi" | "account">(
// //         "user"
// //     );

// //     const [totalUsers, setTotalUsers] = useState(0);
// //     const [totalFloors, setTotalFloors] = useState(0);
// //     const [totalKPIs, setTotalKPIs] = useState(0);
// //     const [totalWalkouts, setTotalWalkouts] = useState(0);
// //     const dispatch = useDispatch();

// //     useEffect(() => {
// //         const fetchDashboard = async () => {
// //             setLoading(true);
// //             try {
// //                 const res = await axiosInstance.get("/owner/details");
// //                 const data = res.data || {};

// //                 setTotalUsers(data.totalUsers ?? 0);
// //                 setTotalFloors(data.totalFloors ?? 0);
// //                 setTotalKPIs(data.totalKPIs ?? 0);
// //                 setTotalWalkouts(data.walkouts ?? 0);
// //             } catch (err: any) {
// //                 if (err.response?.status === 401) {
// //                     localStorage.removeItem("accessToken");
// //                     localStorage.removeItem("refreshToken");
// //                     await logoutOwner();
// //                     dispatch(clearUser());
// //                 }
// //                 setError("Failed to load dashboard data.");
// //             } finally {
// //                 setLoading(false);
// //             }
// //         };

// //         fetchDashboard();
// //     }, []);

// //     if (loading) return <LoadingSpinner />;

// //     if (error)
// //         return (
// //             <div className="h-full flex items-center justify-center">
// //                 <div className="text-center">
// //                     <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
// //                     <p className="text-red-600 mb-4">{error}</p>
// //                     <button
// //                         onClick={() => window.location.reload()}
// //                         className="px-4 py-2 bg-[#FF3F33] text-white rounded-lg hover:bg-red-600 transition-colors"
// //                     >
// //                         Retry
// //                     </button>
// //                 </div>
// //             </div>
// //         );

// //     return (
// //         <div className="h-full overflow-y-auto bg-gray-50 p-4 space-y-6 max-w-5xl mx-auto">
// //             <div className="bg-white rounded-lg shadow-sm p-4">
// //                 <div className="flex items-center justify-between mb-2">
// //                     <h1 className="text-xl font-semibold text-gray-900">
// //                         Owner Dashboard
// //                     </h1>
// //                 </div>
// //                 <p className="text-sm text-gray-600">
// //                     Store overview and analytics
// //                 </p>
// //             </div>

// //             {/* Tabs */}
// //             <Tabs
// //                 value={activeTab}
// //                 // onValueChange={setActiveTab}
// //                 className="space-y-6 mt-8"
// //             >
// //                 <TabsList className="relative grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg overflow-hidden">
// //                     <motion.div
// //                         layout
// //                         transition={{
// //                             type: "spring",
// //                             stiffness: 300,
// //                             damping: 25,
// //                         }}
// //                         className="absolute top-1 bottom-1 w-1/3 bg-white rounded-md shadow-sm"
// //                         animate={{
// //                             x:
// //                                 activeTab === "user"
// //                                     ? "0%"
// //                                     : activeTab === "kpi"
// //                                     ? "100%"
// //                                     : "200%",
// //                         }}
// //                     />

// //                     <TabsTrigger
// //                         value="user"
// //                         className="flex items-center gap-2 rounded-md transition-all relative z-10"
// //                     >
// //                         <Users className="h-4 w-4" />
// //                         <span className="hidden sm:inline">User Management</span>
// //                         <span className="sm:hidden">User</span>
// //                     </TabsTrigger>

// //                     <TabsTrigger
// //                         value="kpi"
// //                         className="flex items-center gap-2 rounded-md transition-all relative z-10"
// //                     >
// //                         <Target className="h-4 w-4" />
// //                         <span className="hidden sm:inline">KPI Management</span>
// //                         <span className="sm:hidden">KPI</span>
// //                     </TabsTrigger>

// //                     <TabsTrigger
// //                         value="account"
// //                         className="flex items-center gap-2 rounded-md transition-all relative z-10"
// //                     >
// //                         <User2 className="h-4 w-4" />
// //                         <span className="hidden sm:inline">
// //                             Account Settings
// //                         </span>
// //                         <span className="sm:hidden">Account</span>
// //                     </TabsTrigger>
// //                 </TabsList>

// //                 {/* User Management Tab */}
// //                 <TabsContent value="walkout" className="space-y-6">
// //                     <WalkOutManagement />
// //                 </TabsContent>

               
            
// //             </Tabs>
// //         </div>
// //     );
// // }




// import React, { useState, useEffect } from "react";
// import { Home, History, XCircle } from "lucide-react";
// import { motion } from "framer-motion";
// import { axiosInstance } from "@/api/axios";
// import { LoadingSpinner } from "../ui/spinner";
// import { useDispatch } from "react-redux";
// import { clearUser } from "@/features/UserSlice";
// import { logoutOwner } from "@/lib/logoutApi";
// import { WalkOutManagement } from "../Supervisor/WalkOutManagement";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// const SummaryCard: React.FC<{
//     title: string;
//     value: number | string;
//     icon: React.ComponentType<{ className?: string }>;
//     color: string;
//     subtitle?: string;
// }> = ({ title, value, icon: Icon, color, subtitle }) => (
//     <div className="h-full bg-white rounded-lg border p-4 shadow-sm">
//         <div className="flex items-center justify-between">
//             <div>
//                 <p className="text-sm text-gray-600">{title}</p>
//                 <p className="text-xl font-bold">{value}</p>
//                 {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
//             </div>
//             <Icon className={`h-6 w-6 ${color}`} />
//         </div>
//     </div>
// );

// export default function OwnerDashboard() {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [activeTab, setActiveTab] = useState<"home" | "walkouts">("home");

//     const [totalUsers, setTotalUsers] = useState(0);
//     const [totalFloors, setTotalFloors] = useState(0);
//     const [totalKPIs, setTotalKPIs] = useState(0);
//     const [totalWalkouts, setTotalWalkouts] = useState(0);
//     const dispatch = useDispatch();

//     useEffect(() => {
//         const fetchDashboard = async () => {
//             setLoading(true);
//             try {
//                 const res = await axiosInstance.get("/owner/details");
//                 const data = res.data || {};

//                 setTotalUsers(data.totalUsers ?? 0);
//                 setTotalFloors(data.totalFloors ?? 0);
//                 setTotalKPIs(data.totalKPIs ?? 0);
//                 setTotalWalkouts(data.walkouts ?? 0);
//             } catch (err: any) {
//                 if (err.response?.status === 401) {
//                     localStorage.removeItem("accessToken");
//                     localStorage.removeItem("refreshToken");
//                     await logoutOwner();
//                     dispatch(clearUser());
//                 }
//                 setError("Failed to load dashboard data.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchDashboard();
//     }, []);

//     if (loading) return <LoadingSpinner />;

//     if (error)
//         return (
//             <div className="h-full flex items-center justify-center">
//                 <div className="text-center">
//                     <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//                     <p className="text-red-600 mb-4">{error}</p>
//                     <button
//                         onClick={() => window.location.reload()}
//                         className="px-4 py-2 bg-[#FF3F33] text-white rounded-lg hover:bg-red-600 transition-colors"
//                     >
//                         Retry
//                     </button>
//                 </div>
//             </div>
//         );

//     return (
//         <div className="h-full overflow-y-auto bg-gray-50 p-4 space-y-6 max-w-5xl mx-auto">
//             <div className="bg-white rounded-lg shadow-sm p-4">
//                 <div className="flex items-center justify-between mb-2">
//                     <h1 className="text-xl font-semibold text-gray-900">
//                         Owner Dashboard
//                     </h1>
//                 </div>
//                 <p className="text-sm text-gray-600">
//                     Store overview and analytics
//                 </p>
//             </div>

//             {/* Tabs */}
//             <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-8">
//                 <TabsList className="relative grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg overflow-hidden">
//                     {/* Sliding indicator */}
//                     <motion.div
//                         layout
//                         transition={{ type: "spring", stiffness: 300, damping: 25 }}
//                         className="absolute top-1 bottom-1 w-1/2 bg-white rounded-md shadow-sm"
//                         animate={{
//                             x: activeTab === "home" ? "0%" : "100%",
//                         }}
//                     />

//                     <TabsTrigger
//                         value="home"
//                         className="flex items-center gap-2 rounded-md transition-all relative z-10"
//                     >
//                         <Home className="h-4 w-4" />
//                         <span>Home</span>
//                     </TabsTrigger>

//                     <TabsTrigger
//                         value="walkouts"
//                         className="flex items-center gap-2 rounded-md transition-all relative z-10"
//                     >
//                         <History className="h-4 w-4" />
//                         <span>Walkouts</span>
//                     </TabsTrigger>
//                 </TabsList>

//                 {/* Home Tab */}
//                 <TabsContent value="home" className="space-y-6">
//                     {/* Your summary cards / dashboard content goes here */}
//                 </TabsContent>

//                 {/* Walkouts Tab */}
//                 <TabsContent value="walkouts" className="space-y-6">
//                     <WalkOutManagement />
//                 </TabsContent>
//             </Tabs>
//         </div>
//     );
// }



import React, { useState, useEffect } from "react";
import { Phone, Home, History, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
    Users,
    Building,
    Target,
    Calendar,
    UserPlus,
} from "lucide-react";

// Import actual components (adjust paths as needed)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutOwner } from "@/lib/logoutApi";
import { WalkOutManagement } from "@/components/Supervisor/WalkOutManagement";

// ---------------- Types ----------------
type KPI = {
    id: string;
    name: string;
    frequency: "daily" | "weekly" | "monthly";
    target: number;
    weight: number;
    max_points: number;
    isDlt: boolean;
    status: boolean;
};

type User = {
    id: string;
    name: string;
    role: string;
    mobile: string;
    section: string;
    created_at: string;
    floor_id: number;
    avatar?: string;
};

// ---------------- Components ----------------
const SummaryCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="h-full bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                <p className="text-xl font-bold">{value}</p>
                {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
            </div>
            <Icon className={`h-6 w-6 ${color}`} />
        </div>
    </div>
);


// ---------------- Main Dashboard ----------------
export default function OwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"home" | "walkouts">("home");

    const [totalUsers, setTotalUsers] = useState(0);
    const [totalFloors, setTotalFloors] = useState(0);
    const [totalKPIs, setTotalKPIs] = useState(0);
    const [totalWalkouts, setTotalWalkouts] = useState(0);
    const [leavesThisMonth, setLeavesThisMonth] = useState(0);
    const [recentKPIs, setRecentKPIs] = useState<KPI[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    
    const dispatch = useDispatch();

    useEffect(() => {
        const storedActivity = localStorage.getItem("SupervisorRecentActivity");
        if (storedActivity) {
            const parsed: any[] = JSON.parse(storedActivity);
            setRecentActivity(parsed.slice(0, 5));
        }
    }, []);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/owner/details");
                const data = res.data || {};

                setTotalUsers(data.totalUsers ?? 0);
                setTotalFloors(data.totalFloors ?? 0);
                setTotalKPIs(data.totalKPIs ?? 0);
                setTotalWalkouts(data.walkouts ?? 0);
                setLeavesThisMonth(data.leavesThisMonth ?? 0);
                setRecentKPIs(
                    Array.isArray(data.recentKPIs) ? data.recentKPIs : []
                );
                setRecentUsers(
                    Array.isArray(data.recentUsers) ? data.recentUsers : []
                );
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    await logoutOwner();
                    dispatch(clearUser());
                }
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [dispatch]);

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
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Owner Dashboard
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Store overview and analytics
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-8">
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
                        className="flex items-center justify-center gap-2 rounded-md transition-colors relative z-10 data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600"
                    >
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="walkouts"
                        className="flex items-center justify-center gap-2 rounded-md transition-colors relative z-10 data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600"
                    >
                        <History className="h-4 w-4" />
                        <span>Walkouts</span>
                    </TabsTrigger>
                </TabsList>

                {/* Home Tab */}
                <TabsContent value="home" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard
                            title="Employees"
                            value={totalUsers}
                            icon={Users}
                            color="text-[#FF3F33]"
                        />
                        <SummaryCard
                            title="Floors"
                            value={totalFloors}
                            icon={Building}
                            color="text-green-500"
                        />
                        <SummaryCard
                            title="KPIs"
                            value={totalKPIs}
                            icon={Target}
                            color="text-purple-500"
                        />
                        <SummaryCard
                            title="Leaves"
                            value={leavesThisMonth}
                            icon={Calendar}
                            color="text-orange-500"
                        />
                    </div>

                   
                    
                </TabsContent>

                {/* Walkouts Tab */}
                <TabsContent value="walkouts" className="space-y-6">
                    <WalkOutManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}