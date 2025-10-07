import { motion } from "motion/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
    Target,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Clock,
    Award,
    Users,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Star,
} from "lucide-react";
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
import { useEffect, useState } from "react";
import { axiosInstance } from "@/api/axios";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { LoadingSpinner } from "../ui/spinner";
import { toast } from "sonner";
import { logoutStaff } from "@/lib/logoutApi";

interface SalesDashboardProps {
    userName: string;
}
interface Details {
    overallAvg: number;
    attendence: number;
    percentageChange: number;
    currentUserRank: number;
}

export function SalesDashboard() {
    const [details, setDetails] = useState<Details | null>(null);
    const [personalKPIs, setPersonalKPIs] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any>({});
    const [isLoading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/staff/details");
                setDetails(res.data.details);
                setPersonalKPIs(res.data.personalKPIs);
                setAttendanceData(res.data.attendanceData);
            } catch (err: any) {
                  if (err.response?.status === 401) {
                    localStorage.removeItem('accesstoken')
                    localStorage.removeItem('refreshtoken')
                    await logoutStaff()
                    dispatch(clearUser())
                    toast.error('Session Expired. Please login again')
                  }
                  toast.error("Internal servor error")
                }
                setLoading(false);
        };

        fetchDetails();
    }, []);

    const getTrendDisplay = (percentageChange: number) => {
        if (percentageChange > 0) {
            return {
                icon: TrendingUp,
                color: "text-green-600",
                bgColor: "bg-green-100",
            };
        } else if (percentageChange < 0) {
            return {
                icon: TrendingDown,
                color: "text-red-600",
                bgColor: "bg-red-100",
            };
        } else {
            return {
                icon: Minus,
                color: "text-gray-600",
                bgColor: "bg-gray-100",
            };
        }
    };

    function AttendanceCard({ attendanceData }: { attendanceData: any }) {
        const thisMonth = attendanceData?.thisMonth ?? {};
        const lastMonth = attendanceData?.lastMonth ?? {};

        const present = thisMonth.present ?? 0;
        const absent = thisMonth.absent ?? 0;
        const fullDayCount = thisMonth.fullDayCount ?? 0;
        const halfDayCount = thisMonth.halfDayCount ?? 0;
        const percentage = thisMonth.percentage ?? 0;

        const lastPercentage = lastMonth.percentage ?? 0;

        const diff = +(percentage - lastPercentage).toFixed(1);

        let trendIcon;
        if (diff > 0)
            trendIcon = <TrendingUp className="h-4 w-4 text-green-600" />;
        else if (diff < 0)
            trendIcon = <TrendingDown className="h-4 w-4 text-red-600" />;
        else trendIcon = <Minus className="h-4 w-4 text-gray-500" />;

        if (!attendanceData || Object.keys(attendanceData).length === 0) {
            return (
                <div className="text-center p-4 text-gray-500">
                    <Star size={48} className="mx-auto mb-2" />
                    <p>No attendance data found.</p>
                </div>
            );
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-[#FF3F33]" />
                        <span>Attendance Summary</span>
                    </CardTitle>
                    <CardDescription>
                        This month's attendance record
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    {present}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Present ({fullDayCount} Full /{" "}
                                    {halfDayCount} Half)
                                </p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    {absent}
                                </p>
                                <p className="text-sm text-gray-600">Absent</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Monthly Percentage
                                </span>
                                <span className="font-bold text-lg">
                                    {percentage.toFixed(1)}%
                                </span>
                            </div>
                            <Progress
                                value={Math.min(percentage, 100)}
                                className="h-2 bg-gray-200" // background track
                                indicatorClassName={`
    ${percentage === 0 ? "bg-transparent" : ""}
    ${percentage > 0 && percentage < 50 ? "bg-red-500" : ""}
    ${percentage >= 50 && percentage < 80 ? "bg-yellow-500" : ""}
    ${percentage >= 80 ? "bg-blue-500" : ""}
  `}
                            />
                        </div>

                        <div className="flex items-center justify-between mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Last Month:</strong>{" "}
                                {lastPercentage.toFixed(1)}%
                            </p>
                            <div className="flex items-center space-x-1">
                                {trendIcon}
                                <span className="text-sm font-medium text-gray-700">
                                    {diff > 0 ? `+${diff}%` : `${diff}%`}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Staff Dashboard
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Here's your performance overview
                </p>
            </motion.div>


            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-[#FF3F33]" />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Overall Score
                                </p>
                                <p className="text-2xl font-bold">
                                    {details?.overallAvg ?? 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">Rank</p>
                                <p className="text-2xl font-bold">
                                    {details?.currentUserRank ?? 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Attendance
                                </p>
                                <p className="text-2xl font-bold">
                                    {details?.attendence ?? 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded-full bg-gray-100`}>
                                <Minus className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    This Week
                                </p>
                                <p className="text-2xl font-bold">
                                    {details?.percentageChange ?? 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal KPIs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-[#FF3F33]" />
                            <span>My Recent KPI Summary</span>
                        </CardTitle>
                        <CardDescription>
                            Current performance metrics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {personalKPIs.length === 0 && (
                                <div className="text-center p-4 text-gray-500">
                                    <Star size={48} className="mx-auto mb-2" />
                                    <p>No KPIs found for you.</p>
                                </div>
                            )}

                            {personalKPIs.map((kpi, index) => {
                                const percentage =
                                    (kpi.current / kpi.target) * 100;
                                const isOnTrack = percentage >= 90;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {kpi.name}
                                            </span>
                                            <Badge
                                                className={
                                                    isOnTrack
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-orange-100 text-orange-800"
                                                }
                                            >
                                                {kpi.score}%
                                            </Badge>
                                        </div>
                                        <Progress
                                            value={Math.min(percentage, 100)}
                                            className="h-2"
                                        />
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span>Current: {kpi.current}</span>
                                            <span>Target: {kpi.target}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Summary */}
                <AttendanceCard attendanceData={attendanceData} />
            </div>

            {/* Recent Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-[#FF3F33]" />
              <span>Recent Achievements</span>
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => {
                const Icon = achievement.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                  >
                    <Icon className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">{achievement.title}</p>
                      <p className="text-sm text-green-600">{achievement.description}</p>
                    </div>
                    <span className="text-xs text-green-500">{achievement.date}</span>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card> */}

                {/* Pending Tasks */}
                {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-[#FF3F33]" />
              <span>Pending Tasks</span>
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border-l-4 ${
                    task.urgent 
                      ? 'bg-red-50 border-red-400' 
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${task.urgent ? 'text-red-800' : 'text-blue-800'}`}>
                        {task.title}
                      </p>
                      <p className={`text-sm ${task.urgent ? 'text-red-600' : 'text-blue-600'}`}>
                        {task.description}
                      </p>
                    </div>
                    {task.urgent && (
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card> */}
            </div>
        </motion.div>
    );
}
