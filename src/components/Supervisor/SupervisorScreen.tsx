// // import { useEffect, useState } from "react";
// // import { motion } from "framer-motion";
// // import {
// //   Card,
// //   CardContent,
// //   CardDescription,
// //   CardHeader,
// //   CardTitle,
// // } from "../ui/card";
// // import { Button } from "../ui/button";
// // import { toast } from "sonner";
// // import {
// //   AreaChart,
// //   Area,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   ResponsiveContainer,
// //   PieChart,
// //   Pie,
// //   Cell,
// // } from "recharts";
// // import {
// //   Users,
// //   Clock,
// //   UserX,
// //   AlertTriangle,
// //   CheckCircle,
// // } from "lucide-react";
// // import { axiosInstance } from "@/api/axios";
// // import { useDispatch } from "react-redux";
// // import { clearUser } from "@/features/UserSlice";
// // import { TrendingUp, TrendingDown, Info } from "lucide-react";

// // // --- TypeScript Interfaces ---
// // interface MonthlyPerformance {
// //   name: string;
// //   avgScore: number;
// //   submissions: number;
// // }

// // interface WalkOutReason {
// //   name: string;
// //   value: number;
// //   color: string;
// // }

// // interface RecentActivity {
// //   id: string;
// //   staff: string;
// //   type: "score_submitted" | "walkout_logged" | "score_approved" | "attendance_alert";
// //   message: string;
// //   time: string;
// // }

// // interface Stats {
// //   title: string;
// //   value: number | string;
// //   icon: any;
// //   color: string;
// // }

// // export function SupervisorDashboard() {
// //   const [timeframe, setTimeframe] = useState<"week" | "month">("week");
// //   const [statsValue, setStatsValue] = useState<any>({});
// //   const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>();
// //   const [walkOutReasons, setWalkOutReasons] = useState<WalkOutReason[]>();
// //   const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

// //   const dispatch = useDispatch();

// //   useEffect(() => {
// //     // Load recent activity from localStorage
// //     const storedActivity = localStorage.getItem("recentActivity");
// //     if (storedActivity) {
// //       const parsed: RecentActivity[] = JSON.parse(storedActivity);
// //       setRecentActivity(parsed.slice(-5).reverse()); 
// //     }
// //   }, []);

// // useEffect(() => {
// //   const fetchData = async () => {
// //     try {
// //       const res = await axiosInstance.get(`/supervisor/getDashboardData?timeframe=${timeframe}`);
// //       setStatsValue(res.data.status);
// //       setMonthlyPerformance(res.data.graph);
// //       setWalkOutReasons(res.data.pie);
// //     } catch (err: any) {
// //       if (err.response?.status === 401) {
// //         localStorage.removeItem("accesstoken");
// //         localStorage.removeItem("refreshtoken");
// //         dispatch(clearUser());
// //         toast.error("Session Expired. Please login again");
// //       } else {
// //         toast.error("Internal server error");
// //       }
// //     }
// //   };
// //   fetchData();
// // }, [timeframe]); // <-- refetch when timeframe changes

// //   // --- Stats Cards ---
// //   const stats: Stats[] = [
// //     {
// //       title: "Staff Under Management",
// //       value: statsValue.staffs?? 0,
// //       icon: Users,
// //       color: "text-blue-600",
// //     },
// //     {
// //       title: "Pending Score Approvals",
// //       value: statsValue.pendingScoreCount ?? 0,
// //       icon: Clock,
// //       color: "text-[#FF3F33]",
// //     },
// //     {
// //     title: "Average Team Performance",
// //     value: statsValue.avgScore ?? "N/A",
// //     icon:
// //       statsValue.avgScore?.trend === "up"
// //         ? TrendingUp
// //         : statsValue.avgScore?.trend === "down"
// //         ? TrendingDown
// //         : Info,
// //     color:
// //       statsValue.avgScore?.trend === "up"
// //         ? "text-green-600"
// //         : statsValue.avgScore?.trend === "down"
// //         ? "text-red-600"
// //         : "text-gray-600",
// //   },
// //     {
// //       title: "Customer Walk-Outs",
// //       value: statsValue.walkOutCount?? 0,
// //       icon: UserX,
// //       color: "text-orange-600",
// //     },
// //   ];

// //   return (
// //     <div className="space-y-6">
// //       {/* Header */}
// //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// //         <div>
// //           <h1 className="text-2xl font-semibold text-gray-900">Floor Supervisor Dashboard</h1>
// //           <p className="text-gray-600">Monitor team performance and manage floor operations</p>
// //         </div>
// //         <div className="flex gap-2">
// //           <Button
// //             variant={timeframe === "week" ? "default" : "outline"}
// //             size="sm"
// //             onClick={() => setTimeframe("week")}
// //             className={timeframe === "week" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
// //           >
// //             This Week
// //           </Button>
// //           <Button
// //             variant={timeframe === "month" ? "default" : "outline"}
// //             size="sm"
// //             onClick={() => setTimeframe("month")}
// //             className={timeframe === "month" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
// //           >
// //             This Month
// //           </Button>
// //         </div>
// //       </div>

// //       {/* Stats Cards */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //         {stats.map((stat, index) => (
// //           <motion.div
// //             key={stat.title}
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ delay: index * 0.1 }}
// //           >
// //             <Card>
// //               <CardContent className="p-6 flex justify-between items-center">
// //                 <div>
// //                   <p className="text-sm font-medium text-gray-600">{stat.title}</p>
// //                   <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
// //                 </div>
// //                 <stat.icon className={`h-8 w-8 ${stat.color}`} />
// //               </CardContent>
// //             </Card>
// //           </motion.div>
// //         ))}
// //       </div>

// //       {/* Charts Section */}
// //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //         {/* Area Chart */}
// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Team Performance Trends</CardTitle>
// //             <CardDescription>Average scores and submission rates</CardDescription>
// //           </CardHeader>
// //           <CardContent className="ml-[-50px]">
// //             <ResponsiveContainer width="100%" height={300}>
// //               <AreaChart data={monthlyPerformance}>
// //                 <CartesianGrid strokeDasharray="3 3" />
// //                 <XAxis dataKey="name" />
// //                 <YAxis />
// //                 <Tooltip />
// //                 <Area
// //                   type="monotone"
// //                   dataKey="avgScore"
// //                   stroke="#FF3F33"
// //                   fill="#FFB3AB"
// //                   fillOpacity={0.3}
// //                   activeDot={{ r: 6 }}
// //                   name="Avg Score"
// //                 />
// //               </AreaChart>
// //             </ResponsiveContainer>
// //           </CardContent>
// //         </Card>

// //         {/* Pie Chart */}
// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Customer Walk-Out Reasons</CardTitle>
// //             <CardDescription>Distribution of walk-out causes this week</CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="flex flex-col lg:flex-row items-center gap-6">
// //               <div className="flex-shrink-0">
// //                 <ResponsiveContainer width={200} height={200}>
// //                   <PieChart>
// //                     <Pie
// //                       data={walkOutReasons}
// //                       cx="50%"
// //                       cy="50%"
// //                       innerRadius={40}
// //                       outerRadius={80}
// //                       paddingAngle={2}
// //                       dataKey="value"
// //                     >
// //                       {walkOutReasons.map((entry, index) => (
// //                         <Cell key={`cell-${index}`} fill={entry.color} />
// //                       ))}
// //                     </Pie>
// //                     <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
// //                   </PieChart>
// //                 </ResponsiveContainer>
// //               </div>

// //               <div className="flex-1 space-y-3">
// //                 {walkOutReasons.map((reason, index) => (
// //                   <div
// //                     key={index}
// //                     className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
// //                   >
// //                     <div className="flex items-center gap-3">
// //                       <div
// //                         className="w-4 h-4 rounded-full flex-shrink-0"
// //                         style={{ backgroundColor: reason.color }}
// //                       />
// //                       <span className="font-medium text-gray-700">{reason.name}</span>
// //                     </div>
// //                     <div className="text-right">
// //                       <span className="font-semibold text-gray-900">{reason.value}%</span>
// //                       <div className="text-xs text-gray-500">{Math.round((reason.value / 100) * 8)} cases</div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Recent Activity */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle>Recent Activity</CardTitle>
// //           <CardDescription>Latest updates from your floor</CardDescription>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="space-y-4">
// //             {recentActivity.length === 0 ? (
// //               <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
// //                 <Info className="h-5 w-5 text-gray-400" />
// //                 <span className="text-gray-500">No recent activity</span>
// //               </div>
// //             ) : (
// //               recentActivity.map((activity) => (
// //                 <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
// //                   <div className="flex-shrink-0">
// //                     {activity.type === "score_submitted" && <Clock className="h-5 w-5 text-[#FF3F33]" />}
// //                     {activity.type === "walkout_logged" && <UserX className="h-5 w-5 text-orange-500" />}
// //                     {activity.type === "score_approved" && <CheckCircle className="h-5 w-5 text-green-500" />}
// //                     {activity.type === "attendance_alert" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
// //                   </div>
// //                   <div className="flex-1">
// //                     <p className="font-medium text-gray-900">{activity.staff}</p>
// //                     <p className="text-sm text-gray-600">{activity.message}</p>
// //                   </div>
// //                   <div className="text-xs text-gray-500">{activity.time}</div>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         </CardContent>
// //       </Card>
// //     </div>
// //   );
// // }


// import { useEffect, useState } from "react";
// import { motion } from "motion/react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../ui/card";
// import { Button } from "../ui/button";
// import { toast } from "sonner";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import {
//   Users,
//   Clock,
//   UserX,
//   AlertTriangle,
//   CheckCircle,
//   TrendingUp,
//   TrendingDown,
//   Info,
//   BarChart3,
// } from "lucide-react";
// import { axiosInstance } from "@/api/axios";
// import { useDispatch } from "react-redux";
// import { clearUser } from "@/features/UserSlice";
// import { logoutSupervisor } from "@/lib/logoutApi";
// import { LoadingSpinner } from "../ui/spinner";

// // --- TypeScript Interfaces ---
// interface MonthlyPerformance {
//   name: string;
//   avgScore: number;
// }

// interface WalkOutReason {
//   name: string;
//   value: number;
//   color: string;
// }

// interface RecentActivity {
//   id: string;
//   staff: string;
//   type: "score_submitted" | "walkout_logged" | "score_approved" | "attendance_alert";
//   message: string;
//   time: string;
// }

// interface Stats {
//   title: string;
//   value: number | string;
//   icon: any;
//   color: string;
// }

// export function SupervisorDashboard() {
//   const [timeframe, setTimeframe] = useState<"week" | "month">("week");
//   const [statsValue, setStatsValue] = useState<any>({});
//   const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
//   const [walkOutReasons, setWalkOutReasons] = useState<WalkOutReason[]>([]);
//   const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
//   const [loading,setLoading]=useState(false)

//   const dispatch = useDispatch();

//   useEffect(() => {
//     const storedActivity = localStorage.getItem("recentActivity");
//     if (storedActivity) {
//       const parsed: RecentActivity[] = JSON.parse(storedActivity);
//       setRecentActivity(parsed.slice(-5).reverse());
//     }
//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true)
//       try {
//         const res = await axiosInstance.get(`/supervisor/getDashboardData?timeframe=${timeframe}`);
//         setStatsValue(res.data.status);

//         // ✅ Ensure fallback if backend sends []
//         setMonthlyPerformance(
//           res.data.graph?.length > 0
//             ? res.data.graph
//             : [
//                 { name: "Week 1", avgScore: 0 },
//                 { name: "Week 2", avgScore: 0 },
//                 { name: "Week 3", avgScore: 0 },
//                 { name: "Week 4", avgScore: 0 },
//               ]
//         );

//         setWalkOutReasons(res.data.pie ?? []);
//       } catch (err: any) {
//         if (err.response?.status === 401) {
//           await logoutSupervisor()
//           localStorage.removeItem("accesstoken");
//           localStorage.removeItem("refreshtoken");
//           dispatch(clearUser());
//           toast.error("Session Expired. Please login again");
//         } else {
//           toast.error("Internal server error");
//         }
//       }
//       setLoading(false)
//     };
//     fetchData();
//   }, [timeframe]);

//   // --- Stats Cards ---
//   const stats: Stats[] = [
//     {
//       title: "Staff Under Management",
//       value: statsValue.staffs ?? 0,
//       icon: Users,
//       color: "text-blue-600",
//     },
//     {
//       title: "Pending Score Approvals",
//       value: statsValue.pendingScoreCount ?? 0,
//       icon: Clock,
//       color: "text-[#FF3F33]",
//     },
//     {
//       title: "Average Team Score",
//       value: statsValue.avgScore?? "N/A",
//       icon:
//         statsValue.avgScore?.trend === "up"
//           ? TrendingUp
//           : statsValue.avgScore?.trend === "down"
//           ? TrendingDown
//           : Info,
//       color:
//         statsValue.avgScore?.trend === "up"
//           ? "text-green-600"
//           : statsValue.avgScore?.trend === "down"
//           ? "text-red-600"
//           : "text-gray-600",
//     },
//     {
//       title: "Customer Walk-Outs",
//       value: statsValue.walkOutCount ?? 0,
//       icon: UserX,
//       color: "text-orange-600",
//     },
//   ];
//     if (loading) {
//         return <LoadingSpinner/>
//     }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
       
//          <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.1 }}
//                 className="bg-white rounded-lg shadow-sm p-4"
//             >
//                 <div className="flex items-center justify-between mb-2">
//                     <h1 className="text-xl font-semibold text-gray-900">
//                       Floor Supervisor Dashboard
//                     </h1>
//                 </div>
//                 <p className="text-sm text-gray-600">
//                     UMonitor team performance and manage floor operations
//                 </p>
//             </motion.div>
//         <div className="flex gap-2">
//           <Button
//             variant={timeframe === "week" ? "default" : "outline"}
//             size="sm"
//             onClick={() => setTimeframe("week")}
//             className={timeframe === "week" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
//           >
//             This Week
//           </Button>
//           <Button
//             variant={timeframe === "month" ? "default" : "outline"}
//             size="sm"
//             onClick={() => setTimeframe("month")}
//             className={timeframe === "month" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
//           >
//             This Month
//           </Button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         {stats.map((stat, index) => (
//           <motion.div
//             key={stat.title}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: index * 0.1 }}
//           >
//             <Card>
//               <CardContent className="p-6 flex justify-between items-center">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">{stat.title}</p>
//                   <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
//                 </div>
//                 <stat.icon className={`h-8 w-8 ${stat.color}`} />
//               </CardContent>
//             </Card>
//           </motion.div>
//         ))}
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Area Chart */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Team Performance Trends</CardTitle>
//             <CardDescription>Average scores and submission rates</CardDescription>
//           </CardHeader>
//           <CardContent className="ml-[-50px]">
//             {monthlyPerformance.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
//                 <BarChart3 className="h-10 w-10 mb-2" />
//                 <span>No data available for this timeframe</span>
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height={300}>
//                 <AreaChart data={monthlyPerformance}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Area
//                     type="monotone"
//                     dataKey="avgScore"
//                     stroke="#FF3F33"
//                     fill="#FFB3AB"
//                     fillOpacity={0.3}
//                     activeDot={{ r: 6 }}
//                     name="Avg Score"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             )}
//           </CardContent>
//         </Card>

//         {/* Pie Chart */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Customer Walk-Out Reasons</CardTitle>
//             <CardDescription>Distribution of walk-out causes this {timeframe}</CardDescription>
//           </CardHeader>
//           <CardContent>
//             {walkOutReasons.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
//                 <UserX className="h-10 w-10 mb-2" />
//                 <span>No walk-out data available</span>
//               </div>
//             ) : (
//               <div className="flex flex-col lg:flex-row items-center gap-6">
//                 <div className="flex-shrink-0">
//                   <ResponsiveContainer width={200} height={200}>
//                     <PieChart>
//                       <Pie
//                         data={walkOutReasons}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={40}
//                         outerRadius={80}
//                         paddingAngle={2}
//                         dataKey="value"
//                       >
//                         {walkOutReasons.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>

//                 <div className="flex-1 space-y-3">
//                   {walkOutReasons.map((reason, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div
//                           className="w-4 h-4 rounded-full flex-shrink-0"
//                           style={{ backgroundColor: reason.color }}
//                         />
//                         <span className="font-medium text-gray-700">{reason.name}</span>
//                       </div>
//                       <div className="text-right">
//                         <span className="font-semibold text-gray-900">{reason.value}%</span>
//                         <div className="text-xs text-gray-500">
//                           {reason.value || 0} cases
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Activity */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Recent Activity</CardTitle>
//           <CardDescription>Latest updates from your floor</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {recentActivity.length === 0 ? (
//               <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
//                 <Info className="h-5 w-5 text-gray-400" />
//                 <span className="text-gray-500">No recent activity</span>
//               </div>
//             ) : (
//               recentActivity.map((activity) => (
//                 <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
//                   <div className="flex-shrink-0">
//                     {activity.type === "score_submitted" && <Clock className="h-5 w-5 text-[#FF3F33]" />}
//                     {activity.type === "walkout_logged" && <UserX className="h-5 w-5 text-orange-500" />}
//                     {activity.type === "score_approved" && <CheckCircle className="h-5 w-5 text-green-500" />}
//                     {activity.type === "attendance_alert" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
//                   </div>
//                   <div className="flex-1">
//                     <p className="font-medium text-gray-900">{activity.staff}</p>
//                     <p className="text-sm text-gray-600">{activity.message}</p>
//                   </div>
//                   <div className="text-xs text-gray-500">{activity.time}</div>
//                 </div>
//               ))
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }









import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Clock,
  UserX,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  BarChart3,
  History
} from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutSupervisor } from "@/lib/logoutApi";
import { LoadingSpinner } from "../ui/spinner";



interface Stats {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}

export function SupervisorDashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");
  const [statsValue, setStatsValue] = useState<any>({});
  const [monthlyPerformance, setMonthlyPerformance] = useState<any[]>([]);
  const [walkOutReasons, setWalkOutReasons] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

useEffect(() => {
  const storedActivity = localStorage.getItem("SupervisorRecentActivity");
  if (storedActivity) {
    const parsed: any[] = JSON.parse(storedActivity);
    setRecentActivity(parsed.slice(0, 5));
  }
}, []);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/supervisor/getDashboardData?timeframe=${timeframe}`);
        setStatsValue(res.data.status);

        setMonthlyPerformance(
          res.data.graph?.length > 0
            ? res.data.graph
            : [
                { name: "Week 1", avgScore: 0 },
                { name: "Week 2", avgScore: 0 },
                { name: "Week 3", avgScore: 0 },
                { name: "Week 4", avgScore: 0 },
              ]
        );

        setWalkOutReasons(res.data.pie ?? []);
      } catch (err: any) {
        if (err.response?.status === 401) {
          await logoutSupervisor();
          localStorage.removeItem("accesstoken");
          localStorage.removeItem("refreshtoken");
          dispatch(clearUser());
          toast.error("Session Expired. Please login again");
        } else {
          toast.error("Internal server error");
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe]);

  // --- Stats Cards ---
  const stats: Stats[] = [
    {
      title: "Staff Under Management",
      value: statsValue.staffs ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Pending Score Approvals",
      value: statsValue.pendingScoreCount ?? 0,
      icon: Clock,
      color: "text-[#FF3F33]",
    },
    {
      title: "Average Team Score",
      value: statsValue.avgScore ?? "N/A",
      icon:
        statsValue.avgScore?.trend === "up"
          ? TrendingUp
          : statsValue.avgScore?.trend === "down"
          ? TrendingDown
          : Info,
      color:
        statsValue.avgScore?.trend === "up"
          ? "text-green-600"
          : statsValue.avgScore?.trend === "down"
          ? "text-red-600"
          : "text-gray-600",
    },
    {
      title: "Customer Walk-Outs",
      value: statsValue.walkOutCount ?? 0,
      icon: UserX,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
               Dashboard
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Monitor team performance and manage floor operations
          </p>
        </motion.div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("week")}
            className={timeframe === "week" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
          >
            This Week
          </Button>
          <Button
            variant={timeframe === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("month")}
            className={timeframe === "month" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Stats Cards - Compact 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg bg-gray-100`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{stat.value}</p>
                    <p className="text-xs text-gray-600">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Trends</CardTitle>
            <CardDescription>Average scores and submission rates</CardDescription>
          </CardHeader>
          <CardContent className="ml-[-50px]">
            {monthlyPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <BarChart3 className="h-10 w-10 mb-2" />
                <span>No data available for this timeframe</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#FF3F33"
                    fill="#FFB3AB"
                    fillOpacity={0.3}
                    activeDot={{ r: 6 }}
                    name="Avg Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart
        <Card>
          <CardHeader>
            <CardTitle>Customer Walk-Out Reasons</CardTitle>
            <CardDescription>Distribution of walk-out causes this {timeframe}</CardDescription>
          </CardHeader>
          <CardContent>
            {walkOutReasons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
                <UserX className="h-10 w-10 mb-2" />
                <span>No walk-out data available</span>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={walkOutReasons}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {walkOutReasons.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-3">
                  {walkOutReasons.map((reason, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: reason.color }}
                        />
                        <span className="font-medium text-gray-700">{reason.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{reason.value}%</span>
                        <div className="text-xs text-gray-500">
                          {reason.value || 0} cases
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>*/}
      </div> 

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your floor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          {recentActivity.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
    <History className="w-10 h-10 mb-2 text-gray-400" />
    <p className="text-sm font-medium">No recent activity found</p>
  </div>
) : (
  <div className="space-y-3">
    {recentActivity.map((activity: any, index: number) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 + index * 0.1 }}
        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
      >
        {/* Colored status dot */}
        <div
          className={`w-2 h-2 rounded-full ${
            activity.status === "success"
              ? "bg-green-500"
              : activity.status === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          }`}
        />

        {/* Activity Info */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
      </motion.div>
    ))}
  </div>
)}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}