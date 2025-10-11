
import React, { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import {motion} from"framer-motion"
import {
    Users,
    Building,
    Target,
    Calendar,
    UserPlus,
    XCircle,
    History,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "../ui/spinner";
import { cva } from "class-variance-authority";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent,CardDescription, } from "../ui/card";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutOwner } from "@/lib/logoutApi";
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

// ---------------- Helpers ----------------
const freqBadge = cva(
    "text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide",
    {
        variants: {
            frequency: {
                daily: "bg-emerald-100 text-emerald-700",
                weekly: "bg-sky-100 text-sky-700",
                monthly: "bg-violet-100 text-violet-700",
            },
        },
    }
);

// ---------------- Components ----------------
interface SummaryCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
}) => (
    <div className="h-full bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                <p className="text-xl font-bold">{value}</p>
                {subtitle && (
                    <p className="text-xs text-gray-600">{subtitle}</p>
                )}
            </div>
            <Icon className={`h-6 w-6 ${color}`} />
        </div>
    </div>
);

// ---------- KPI Item ----------
function KPIItem({ kpi }: { kpi: KPI }) {
    // Determine status text and emoji
    const statusText = kpi.status ? "On Track" : "Delayed";
    const statusEmoji = kpi.status ? "✅" : "❌";

    return (
        <Card className="w-full max-w-sm rounded-2xl shadow-md border">
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                        {kpi.name}
                    </CardTitle>
                    <Badge
                        variant={kpi.isDlt ? "destructive" : "secondary"}
                        className="capitalize"
                    >
                        {kpi.isDlt ? "Deleted" : kpi.frequency}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-2 pt-2">
                {/* Metrics rows */}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="w-4 h-4" /> Target
                    </span>
                    <span className="font-medium">{kpi.target}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        🎯 Weight
                    </span>
                    <span className="font-medium">{kpi.weight}%</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Max Points
                    </span>
                    <span className="font-medium">{kpi.max_points}</span>
                </div>

                <hr className="my-2 border-gray-200" />

                {/* Status row */}
                <div className="flex justify-between text-sm font-medium">
                    <span>Status</span>
                    <span>
                        {statusEmoji} {statusText}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
// ---------- User Item ----------
const UserItem: React.FC<{ user: User }> = ({ user }) => (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border p-4">
        {/* Top row: Avatar, Name, Role */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                        {user.name?.charAt(0) || "?"}
                    </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-gray-900">{user.name}</p>
            </div>
            <Badge variant="secondary" className="capitalize text-sm">
                {user.role}
            </Badge>
        </div>

        {/* Phone row */}
        <div className="flex items-center gap-4 text-gray-600 mb-2">
            <Phone className="w-4 h-4" />
            <span>{user.mobile}</span>
        </div>

        {/* Section & Floor row */}
        <div className="flex items-center gap-4 text-gray-600 mb-2">
            <Building className="w-4 h-4" />
            <span>
                Section: {user.section} | Floor:{" "}
                {user.floor_id === 0 ? "Ground" : `${user.floor_id}F`}
            </span>
        </div>

        {/* Joined row */}
        <div className="flex items-center gap-4 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
                Joined: {new Date(user.created_at).toLocaleDateString()}
            </span>
        </div>
    </Card>
);

// ---------------- Main Dashboard ----------------
export default function OwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [totalUsers, setTotalUsers] = useState(0);
    const [totalFloors, setTotalFloors] = useState(0);
    const [totalKPIs, setTotalKPIs] = useState(0);
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
                    await logoutOwner()
                    dispatch(clearUser());
                }
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

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

            {/* Recent KPIs */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-[#FF3F33]" />
                    <h3 className="text-lg font-semibold">Recent KPIs</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentKPIs.length > 0 ? (
                        recentKPIs.map((kpi) => (
                            <KPIItem key={kpi.id} kpi={kpi} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                            <Target className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">No KPIs found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="h-5 w-5 text-[#FF3F33]" />
                    <h3 className="text-lg font-semibold">Recent Users</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentUsers.length > 0 ? (
                        recentUsers.map((user) => (
                            <UserItem key={user.id} user={user} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                            <UserPlus className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">
                                No Users found
                            </p>
                        </div>
                    )}
                </div>
            </div>
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
