
// import React, { useState, useEffect } from "react";
// import { Phone } from "lucide-react";
// import {motion} from"framer-motion"
// import {
//     Users,
//     Building,
//     Target,
//     Calendar,
//     UserPlus,
//     XCircle,
//     History,
// } from "lucide-react";

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { axiosInstance } from "@/api/axios";
// import { LoadingSpinner } from "../ui/spinner";
// import { cva } from "class-variance-authority";
// import { Badge } from "../ui/badge";
// import { Card, CardHeader, CardTitle, CardContent,CardDescription, } from "../ui/card";
// import { useDispatch } from "react-redux";
// import { clearUser } from "@/features/UserSlice";
// import { logoutOwner } from "@/lib/logoutApi";
// // ---------------- Types ----------------
// type KPI = {
//     id: string;
//     name: string;
//     frequency: "daily" | "weekly" | "monthly";
//     target: number;
//     weight: number;
//     max_points: number;
//     isDlt: boolean;
//     status: boolean;
// };

// type User = {
//     id: string;
//     name: string;
//     role: string;
//     mobile: string;
//     section: string;
//     created_at: string;
//     floor_id: number;
//     avatar?: string;
// };

// // ---------------- Helpers ----------------
// const freqBadge = cva(
//     "text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide",
//     {
//         variants: {
//             frequency: {
//                 daily: "bg-emerald-100 text-emerald-700",
//                 weekly: "bg-sky-100 text-sky-700",
//                 monthly: "bg-violet-100 text-violet-700",
//             },
//         },
//     }
// );

// // ---------------- Components ----------------
// interface SummaryCardProps {
//     title: string;
//     value: number | string;
//     icon: React.ComponentType<{ className?: string }>;
//     color: string;
//     subtitle?: string;
// }

// const SummaryCard: React.FC<SummaryCardProps> = ({
//     title,
//     value,
//     icon: Icon,
//     color,
//     subtitle,
// }) => (
//     <div className="h-full bg-white rounded-lg border p-4 shadow-sm">
//         <div className="flex items-center justify-between">
//             <div>
//                 <p className="text-sm text-gray-600">{title}</p>
//                 <p className="text-xl font-bold">{value}</p>
//                 {subtitle && (
//                     <p className="text-xs text-gray-600">{subtitle}</p>
//                 )}
//             </div>
//             <Icon className={`h-6 w-6 ${color}`} />
//         </div>
//     </div>
// );

// // ---------- KPI Item ----------
// function KPIItem({ kpi }: { kpi: KPI }) {
//     // Determine status text and emoji
//     const statusText = kpi.status ? "On Track" : "Delayed";
//     const statusEmoji = kpi.status ? "✅" : "❌";

//     return (
//         <Card className="w-full max-w-sm rounded-2xl shadow-md border">
//             <CardHeader className="pb-0">
//                 <div className="flex items-center justify-between">
//                     <CardTitle className="text-lg font-semibold">
//                         {kpi.name}
//                     </CardTitle>
//                     <Badge
//                         variant={kpi.isDlt ? "destructive" : "secondary"}
//                         className="capitalize"
//                     >
//                         {kpi.isDlt ? "Deleted" : kpi.frequency}
//                     </Badge>
//                 </div>
//             </CardHeader>

//             <CardContent className="space-y-2 pt-2">
//                 {/* Metrics rows */}
//                 <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground flex items-center gap-1">
//                         <Target className="w-4 h-4" /> Target
//                     </span>
//                     <span className="font-medium">{kpi.target}</span>
//                 </div>

//                 <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground flex items-center gap-1">
//                         🎯 Weight
//                     </span>
//                     <span className="font-medium">{kpi.weight}%</span>
//                 </div>

//                 <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground flex items-center gap-1">
//                         <Calendar className="w-4 h-4" /> Max Points
//                     </span>
//                     <span className="font-medium">{kpi.max_points}</span>
//                 </div>

//                 <hr className="my-2 border-gray-200" />

//                 {/* Status row */}
//                 <div className="flex justify-between text-sm font-medium">
//                     <span>Status</span>
//                     <span>
//                         {statusEmoji} {statusText}
//                     </span>
//                 </div>
//             </CardContent>
//         </Card>
//     );
// }
// // ---------- User Item ----------
// const UserItem: React.FC<{ user: User }> = ({ user }) => (
//     <Card className="w-full max-w-sm rounded-2xl shadow-md border p-4">
//         {/* Top row: Avatar, Name, Role */}
//         <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-4">
//                 <Avatar className="w-10 h-10">
//                     <AvatarImage src={user.avatar} alt={user.name} />
//                     <AvatarFallback>
//                         {user.name?.charAt(0) || "?"}
//                     </AvatarFallback>
//                 </Avatar>
//                 <p className="font-semibold text-gray-900">{user.name}</p>
//             </div>
//             <Badge variant="secondary" className="capitalize text-sm">
//                 {user.role}
//             </Badge>
//         </div>

//         {/* Phone row */}
//         <div className="flex items-center gap-4 text-gray-600 mb-2">
//             <Phone className="w-4 h-4" />
//             <span>{user.mobile}</span>
//         </div>

//         {/* Section & Floor row */}
//         <div className="flex items-center gap-4 text-gray-600 mb-2">
//             <Building className="w-4 h-4" />
//             <span>
//                 Section: {user.section} | Floor:{" "}
//                 {user.floor_id === 0 ? "Ground" : `${user.floor_id}F`}
//             </span>
//         </div>

//         {/* Joined row */}
//         <div className="flex items-center gap-4 text-gray-600">
//             <Calendar className="w-4 h-4" />
//             <span>
//                 Joined: {new Date(user.created_at).toLocaleDateString()}
//             </span>
//         </div>
//     </Card>
// );

// // ---------------- Main Dashboard ----------------
// export default function OwnerDashboard() {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     const [totalUsers, setTotalUsers] = useState(0);
//     const [totalFloors, setTotalFloors] = useState(0);
//     const [totalKPIs, setTotalKPIs] = useState(0);
//     const [leavesThisMonth, setLeavesThisMonth] = useState(0);
//     const [recentKPIs, setRecentKPIs] = useState<KPI[]>([]);
//     const [recentUsers, setRecentUsers] = useState<User[]>([]);
//       const [recentActivity, setRecentActivity] = useState<any[]>([]);
//     const dispatch = useDispatch();
    
//     useEffect(() => {
//         const storedActivity = localStorage.getItem("SupervisorRecentActivity");
//         if (storedActivity) {
//             const parsed: any[] = JSON.parse(storedActivity);
//             setRecentActivity(parsed.slice(0, 5));
//         }
//     }, []);
//     useEffect(() => {
//         const fetchDashboard = async () => {
//             setLoading(true);
//             try {
//                 const res = await axiosInstance.get("/owner/details");
//                 const data = res.data || {};

//                 setTotalUsers(data.totalUsers ?? 0);
//                 setTotalFloors(data.totalFloors ?? 0);
//                 setTotalKPIs(data.totalKPIs ?? 0);
//                 setLeavesThisMonth(data.leavesThisMonth ?? 0);
//                 setRecentKPIs(
//                     Array.isArray(data.recentKPIs) ? data.recentKPIs : []
//                 );
//                 setRecentUsers(
//                     Array.isArray(data.recentUsers) ? data.recentUsers : []
//                 );
//             } catch (err: any) {
//                 if (err.response?.status === 401) {
//                     localStorage.removeItem("accessToken");
//                     localStorage.removeItem("refreshToken");
//                     await logoutOwner()
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

//             {/* Summary Cards */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 <SummaryCard
//                     title="Employees"
//                     value={totalUsers}
//                     icon={Users}
//                     color="text-[#FF3F33]"
//                 />
//                 <SummaryCard
//                     title="Floors"
//                     value={totalFloors}
//                     icon={Building}
//                     color="text-green-500"
//                 />
//                 <SummaryCard
//                     title="KPIs"
//                     value={totalKPIs}
//                     icon={Target}
//                     color="text-purple-500"
//                 />
//                 <SummaryCard
//                     title="Leaves"
//                     value={leavesThisMonth}
//                     icon={Calendar}
//                     color="text-orange-500"
//                 />
//             </div>

//             {/* Recent KPIs */}
//             <div className="bg-white rounded-lg border p-6 shadow-sm">
//                 <div className="flex items-center gap-2 mb-4">
//                     <Target className="h-5 w-5 text-[#FF3F33]" />
//                     <h3 className="text-lg font-semibold">Recent KPIs</h3>
//                 </div>
//                 <div className="space-y-3 max-h-64 overflow-y-auto">
//                     {recentKPIs.length > 0 ? (
//                         recentKPIs.map((kpi) => (
//                             <KPIItem key={kpi.id} kpi={kpi} />
//                         ))
//                     ) : (
//                         <div className="flex flex-col items-center justify-center text-gray-400 py-10">
//                             <Target className="w-8 h-8 mb-2" />
//                             <p className="text-sm font-medium">No KPIs found</p>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Recent Users */}
//             <div className="bg-white rounded-lg border p-6 shadow-sm">
//                 <div className="flex items-center gap-2 mb-4">
//                     <UserPlus className="h-5 w-5 text-[#FF3F33]" />
//                     <h3 className="text-lg font-semibold">Recent Users</h3>
//                 </div>
//                 <div className="space-y-3 max-h-64 overflow-y-auto">
//                     {recentUsers.length > 0 ? (
//                         recentUsers.map((user) => (
//                             <UserItem key={user.id} user={user} />
//                         ))
//                     ) : (
//                         <div className="flex flex-col items-center justify-center text-gray-400 py-10">
//                             <UserPlus className="w-8 h-8 mb-2" />
//                             <p className="text-sm font-medium">
//                                 No Users found
//                             </p>
//                         </div>
//                     )}
//                 </div>
//             </div>
//              <Card>
//         <CardHeader>
//           <CardTitle>Recent Activity</CardTitle>
//           <CardDescription>Latest updates from your floor</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//           {recentActivity.length === 0 ? (
//   <div className="flex flex-col items-center justify-center py-8 text-gray-500">
//     <History className="w-10 h-10 mb-2 text-gray-400" />
//     <p className="text-sm font-medium">No recent activity found</p>
//   </div>
// ) : (
//   <div className="space-y-3">
//     {recentActivity.map((activity: any, index: number) => (
//       <motion.div
//         key={index}
//         initial={{ opacity: 0, x: -20 }}
//         animate={{ opacity: 1, x: 0 }}
//         transition={{ delay: 0.2 + index * 0.1 }}
//         className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
//       >
//         {/* Colored status dot */}
//         <div
//           className={`w-2 h-2 rounded-full ${
//             activity.status === "success"
//               ? "bg-green-500"
//               : activity.status === "error"
//               ? "bg-red-500"
//               : "bg-blue-500"
//           }`}
//         />

//         {/* Activity Info */}
//         <div className="flex-1">
//           <p className="text-sm font-medium text-gray-900">{activity.title}</p>
//           <p className="text-xs text-gray-500">{activity.time}</p>
//         </div>
//       </motion.div>
//     ))}
//   </div>
// )}

//           </div>
//         </CardContent>
//       </Card>
//         </div>
//     );
// }


import React, { useState, useEffect } from "react";
import { Phone, Building, Target, Calendar, UserPlus, XCircle, History, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";

// Types
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

// Frequency badge styling
const freqColors = {
    daily: "bg-emerald-100 text-emerald-700",
    weekly: "bg-sky-100 text-sky-700",
    monthly: "bg-violet-100 text-violet-700",
};

// Enhanced KPI Item
function KPIItem({ kpi }: { kpi: KPI }) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
            {/* Status indicator bar */}
            <div className={`absolute left-0 top-0 h-1 w-full ${kpi.status ? 'bg-emerald-500' : 'bg-red-500'}`} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{kpi.name}</h4>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-xs capitalize px-2 py-0.5 ${freqColors[kpi.frequency] || freqColors.monthly}`}>
                        {kpi.isDlt ? "Deleted" : kpi.frequency}
                    </Badge>
                </div>
            </div>

            {/* Content grid */}
            <div className="space-y-2.5">
                {/* Target */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-gray-400" />
                        Target
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{kpi.target}</span>
                </div>

                {/* Weight */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        Weight
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{kpi.weight}%</span>
                </div>

                {/* Max Points */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-gray-400" />
                        Max Points
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{kpi.max_points}</span>
                </div>
            </div>

            {/* Status footer */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Status</span>
                <div className="flex items-center gap-1.5">
                    {kpi.status ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700">On Track</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-semibold text-red-700">Delayed</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Enhanced User Item
function UserItem({ user }: { user: User }) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 h-1 w-0 bg-[#FF3F33] group-hover:w-full transition-all duration-300" />

            {/* Header: Avatar and name */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-gray-200">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-[#FF3F33] text-white text-sm font-semibold">
                            {user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm">{user.mobile}</span>
                </div>

                {/* Section & Floor */}
                <div className="flex items-center gap-2.5 text-gray-600">
                    <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm">
                        <span className="font-medium">
                            {user.section}
                        </span>
                        {" • "}
                        <span className="font-medium">
                            {user.floor_id === 0 ? "Ground" : `${user.floor_id}F`}
                        </span>
                    </span>
                </div>

                {/* Joined date */}
                <div className="flex items-center gap-2.5 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm">
                        Joined: {new Date(user.created_at).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric" 
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Main Component
export default function EnhancedDashboard() {
    const [recentKPIs] = useState<KPI[]>([
        {
            id: "1",
            name: "Customer Satisfaction",
            frequency: "daily",
            target: 95,
            weight: 30,
            max_points: 100,
            isDlt: false,
            status: true,
        },
        {
            id: "2",
            name: "Sales Target",
            frequency: "weekly",
            target: 50000,
            weight: 40,
            max_points: 100,
            isDlt: false,
            status: false,
        },
        {
            id: "3",
            name: "Team Attendance",
            frequency: "monthly",
            target: 98,
            weight: 20,
            max_points: 100,
            isDlt: false,
            status: true,
        },
    ]);

    const [recentUsers] = useState<User[]>([
        {
            id: "1",
            name: "John Anderson",
            role: "Manager",
            mobile: "+91 98765 43210",
            section: "North",
            created_at: "2025-10-05",
            floor_id: 2,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        },
        {
            id: "2",
            name: "Sarah Mitchell",
            role: "Supervisor",
            mobile: "+91 87654 32109",
            section: "South",
            created_at: "2025-09-28",
            floor_id: 1,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        },
        {
            id: "3",
            name: "Mike Chen",
            role: "Staff",
            mobile: "+91 76543 21098",
            section: "East",
            created_at: "2025-09-15",
            floor_id: 0,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        },
    ]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-6xl mx-auto">
            {/* Recent KPIs Section */}
            <Card className="border-gray-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#FF3F33]" />
                        <div>
                            <CardTitle>Recent KPIs</CardTitle>
                            <CardDescription>Track your key performance indicators</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentKPIs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentKPIs.map((kpi) => (
                                <KPIItem key={kpi.id} kpi={kpi} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                            <Target className="w-10 h-10 mb-3 text-gray-300" />
                            <p className="text-sm font-medium">No KPIs found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Users Section */}
            <Card className="border-gray-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-[#FF3F33]" />
                        <div>
                            <CardTitle>Recent Users</CardTitle>
                            <CardDescription>Latest team members added</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentUsers.map((user) => (
                                <UserItem key={user.id} user={user} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                            <UserPlus className="w-10 h-10 mb-3 text-gray-300" />
                            <p className="text-sm font-medium">No users found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}