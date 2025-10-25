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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  Clock,
  UserX,
  TrendingUp,
  TrendingDown,
  Info,
  BarChart3,
  DollarSign,
  Activity,
  Plus,
  Gauge,
} from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutSupervisor } from "@/lib/logoutApi";
import { LoadingSpinner } from "../ui/spinner";
import { WalkOutManagement } from "./WalkOutManagement";

interface Stats {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}

interface GraphData {
  name: string;
  value: number;
}

export function SupervisorDashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");
  const [statsValue, setStatsValue] = useState<any>({});
  const [salesData, setSalesData] = useState<GraphData[]>([]);
  const [walkoutData, setWalkoutData] = useState<GraphData[]>([]);
  const [staffData, setStaffData] = useState<GraphData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWalkoutManagement, setShowWalkoutManagement] = useState(false);
  const MotionButton = motion(Button)
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/supervisor/getDashboardData?timeframe=${timeframe}`);
        setStatsValue(res.data.status);

        // Set graph data with fallbacks
        setSalesData(
          res.data.salesGraph?.length > 0
            ? res.data.salesGraph
            : [
                { name: timeframe === "week" ? "Week 1" : "Month 1", value: 0 },
                { name: timeframe === "week" ? "Week 2" : "Month 2", value: 0 },
                { name: timeframe === "week" ? "Week 3" : "Month 3", value: 0 },
                { name: timeframe === "week" ? "Week 4" : "Month 4", value: 0 },
              ]
        );

        setWalkoutData(
          res.data.walkoutGraph?.length > 0
            ? res.data.walkoutGraph
            : [
                { name: timeframe === "week" ? "Week 1" : "Month 1", value: 0 },
                { name: timeframe === "week" ? "Week 2" : "Month 2", value: 0 },
                { name: timeframe === "week" ? "Week 3" : "Month 3", value: 0 },
                { name: timeframe === "week" ? "Week 4" : "Month 4", value: 0 },
              ]
        );

        setStaffData(
          res.data.staffGraph?.length > 0
            ? res.data.staffGraph
            : [
                { name: timeframe === "week" ? "Week 1" : "Month 1", value: 0 },
                { name: timeframe === "week" ? "Week 2" : "Month 2", value: 0 },
                { name: timeframe === "week" ? "Week 3" : "Month 3", value: 0 },
                { name: timeframe === "week" ? "Week 4" : "Month 4", value: 0 },
              ]
        );
      } catch (err: any) {
        if (err.response?.status === 401) {
          const response: any = await logoutSupervisor();
          if (response?.success) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            dispatch(clearUser());
            toast.error("Session Expired. Please login again");
          } else {
            console.error("Internal server error");
            toast.error("Something went wrong. Please try again.");
          }
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
  title: "Average Score",
  value: statsValue.avgScore ?? 0,
  icon: Gauge,
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

  if (showWalkoutManagement) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Walkout Management
            </h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWalkoutManagement(false)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Back to Dashboard
            </motion.button>
          </div>
          <p className="text-sm text-gray-600">
            Manage customer walkouts and track issues
          </p>
        </motion.div>
        <WalkOutManagement />
      </div>
    );
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
        {/* <div className="flex gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWalkoutManagement(true)}
            className="flex items-center gap-2"
          >
            <UserX className="h-4 w-4" />
            Walkouts
          </Button>
        </div> */}
        <div className="flex gap-2">
  <MotionButton
    variant={timeframe === "week" ? "default" : "outline"}
    size="sm"
    onClick={() => setTimeframe("week")}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
    className={timeframe === "week" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
  >
    This Week
  </MotionButton>

  <MotionButton
    variant={timeframe === "month" ? "default" : "outline"}
    size="sm"
    onClick={() => setTimeframe("month")}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
    className={timeframe === "month" ? "bg-[#FF3F33] hover:bg-[#E6362A]" : ""}
  >
    This Month
  </MotionButton>

  <MotionButton
    variant="outline"
    size="sm"
    onClick={() => setShowWalkoutManagement(true)}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
    className="flex items-center gap-2"
  >
    <UserX className="h-4 w-4" />
    Walkouts
  </MotionButton>
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

      {/* Three Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              Sales Performance
            </CardTitle>
            <CardDescription>
              Sales trends over {timeframe === "week" ? "last 4 weeks" : "last 4 months"}
            </CardDescription>
          </CardHeader>
          {/* <CardContent className="mr-20">
            {salesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
                <BarChart3 className="h-10 w-10 mb-2" />
                <span>No sales data available</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#EF4444", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent> */}
          <CardContent className="pl-0">
  {salesData.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
      <BarChart3 className="h-10 w-10 mb-2" />
      <span>No sales data available</span>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={salesData} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" style={{ fontSize: "12px" }} />
        <YAxis style={{ fontSize: "12px" }} />
        <Tooltip contentStyle={{ borderRadius: "8px" }} />
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

        {/* Walkout Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Walkout Trends
            </CardTitle>
            <CardDescription>
              Customer walkouts over {timeframe === "week" ? "last 4 weeks" : "last 4 months"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
  {walkoutData.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
      <UserX className="h-10 w-10 mb-2" />
      <span>No walkout data available</span>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={walkoutData} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" style={{ fontSize: "12px" }} />
        <YAxis style={{ fontSize: "12px" }} />
        <Tooltip contentStyle={{ borderRadius: "8px" }} />
        <Bar
          dataKey="value"
          fill="#FF3F33"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )}
</CardContent>
        </Card>

        {/* Staff Performance Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Staff Performance
            </CardTitle>
            <CardDescription>
              Team performance over {timeframe === "week" ? "last 4 weeks" : "last 4 months"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
  {staffData.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
      <Users className="h-10 w-10 mb-2" />
      <span>No staff data available</span>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={staffData} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" style={{ fontSize: "12px" }} />
        <YAxis style={{ fontSize: "12px" }} />
        <Tooltip contentStyle={{ borderRadius: "8px" }} />
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
    </div>
  );
}
