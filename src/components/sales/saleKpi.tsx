import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
    Target,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MessageSquare,
    Calendar,
    Star,
    Award,
    BarChart3,
    Minus,
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
    Legend,
} from "recharts";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "../ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { toast } from "sonner";
import { logoutStaff } from "@/lib/logoutApi";

interface KPI {
    id: string;
    name: string;
    weight: number;
    target: number;
}

interface Score {
    id: number;
    user_id: string;
    points: number;
    created_at: string;
    kpi: KPI;
}

interface MonthlyData {
    month: string;
    sales: number;
    service: number;
    knowledge: number;
    cleanliness: number;
    teamwork: number;
    percentage: number;
}

interface WeeklyData {
    week: string;
    score: number;
    target: number;
    percentage: number;
}

interface KPIData {
    scores: Score[];
    last4Months: MonthlyData[];
    last4Weeks: WeeklyData[];
}

export function SalesKPI() {
    const [selectedPeriod, setSelectedPeriod] = useState("current");
    const [kpiData, setKPIData] = useState<KPIData>({
        scores: [],
        last4Months: [],
        last4Weeks: [],
    });
    const [isLoading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get("/staff/MyKpis");
                setKPIData(res.data.kpi);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutStaff();
                    dispatch(clearUser());
                    toast.error("Session expired");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchKPIs();
    }, []);

    const getStatusColor = (points: number) => {
        if (points > 0) {
            return "bg-green-100 text-green-800"; // has score
        }
        return "bg-orange-100 text-orange-800"; // no score
    };

    const getStatusIcon = (points: number) => {
        if (points > 0) {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        }
        return <Clock className="h-4 w-4 text-orange-600" />;
    };

    const getStatusText = (points: number) => {
        if (points > 0) {
            return "Scored";
        }
        return "Pending";
    };

    const getPerformanceLevel = (score: number) => {
        if (score >= 90)
            return { label: "Excellent", class: "bg-green-100 text-green-800" };
        if (score >= 80)
            return { label: "Good", class: "bg-blue-100 text-blue-800" };
        if (score >= 70)
            return { label: "Average", class: "bg-orange-100 text-orange-800" };
        return { label: "Needs Improvement", class: "bg-red-100 text-red-800" };
    };

    // Calculate overall weighted score with undefined checks
    const totalWeightedScore = (kpiData?.scores || []).reduce((acc, score) => {
        const points = score?.points || 0;
        const weight = score?.kpi?.weight || 0;
        return acc + (points * weight) / 100;
    }, 0);

    const totalWeight = (kpiData?.scores || []).reduce((acc, score) => {
        return acc + (score?.kpi?.weight || 0);
    }, 0);
    const overallScore =
        totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    // Group scores by KPI for display with undefined checks
    const groupedScores = (kpiData?.scores || []).reduce((acc, score) => {
        if (!score || !score.kpi) return acc;

        const existing = acc.find((item) => item.kpi.id === score.kpi.id);
        if (existing) {
            existing.scores.push(score);
            existing.latestPoints = Math.max(
                existing.latestPoints,
                score.points || 0
            );
            existing.latestDate =
                (score.created_at || "") > existing.latestDate
                    ? score.created_at || ""
                    : existing.latestDate;
        } else {
            acc.push({
                kpi: score.kpi,
                scores: [score],
                latestPoints: score.points || 0,
                latestDate: score.created_at || "",
            });
        }
        return acc;
    }, [] as { kpi: KPI; scores: Score[]; latestPoints: number; latestDate: string }[]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
                        My KPI Performance
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    HDetailed view of your evaluation scores
                </p>
            </motion.div>

            {/* Overall Score Card */}
            <Card className="bg-gradient-to-r from-[#FF3F33]/10 to-orange-100">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Overall Weighted Score
                            </h3>
                            <p className="text-3xl font-bold text-[#FF3F33]">
                                {Math.round(overallScore)}%
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Based on {(kpiData?.scores || []).length} KPI
                                evaluations
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                                <Award className="h-5 w-5 text-orange-600" />
                                <span className="text-sm font-medium">
                                    Performance Level
                                </span>
                            </div>
                            <Badge
                                className={
                                    getPerformanceLevel(overallScore).class
                                }
                            >
                                {getPerformanceLevel(overallScore).label}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="current" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="current">Current Scores</TabsTrigger>
                    <TabsTrigger value="history">Historical View</TabsTrigger>
                    <TabsTrigger value="trends">Performance Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                    <div className="space-y-4">
                        {groupedScores.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <div className="text-center p-4 text-gray-500">
                                        <Star
                                            size={48}
                                            className="mx-auto mb-2"
                                        />
                                        <p>No KPIs found for you.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <AnimatePresence>
                                {groupedScores.map((group, index) => (
                                    <motion.div
                                        key={group.kpi.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center space-x-2">
                                                            <Target className="h-5 w-5 text-[#FF3F33]" />
                                                            <span>
                                                                {group.kpi
                                                                    ?.name ||
                                                                    "Unknown KPI"}
                                                            </span>
                                                        </CardTitle>
                                                        <CardDescription className="mt-1">
                                                            Weight:{" "}
                                                            {group.kpi
                                                                ?.weight || 0}
                                                            % • Target:{" "}
                                                            {group.kpi
                                                                ?.target ||
                                                                "N/A"}{" "}
                                                            •{" "}
                                                            {
                                                                (
                                                                    group.scores ||
                                                                    []
                                                                ).length
                                                            }{" "}
                                                            evaluation
                                                            {(
                                                                group.scores ||
                                                                []
                                                            ).length !== 1
                                                                ? "s"
                                                                : ""}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(
                                                            group.latestPoints
                                                        )}
                                                        <Badge
                                                            className={getStatusColor(
                                                                group.latestPoints
                                                            )}
                                                        >
                                                            {getStatusText(
                                                                group.latestPoints
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* Latest Score Display */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">
                                                            Latest Score
                                                        </span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-2xl font-bold text-[#FF3F33]">
                                                                {group.latestPoints >
                                                                0
                                                                    ? group.latestPoints
                                                                    : "-"}
                                                            </span>
                                                            <span className="text-gray-500">
                                                                /{" "}
                                                                {group.kpi
                                                                    ?.target ||
                                                                    "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Target Display */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">
                                                            Target
                                                        </span>
                                                        <span className="text-lg font-semibold text-gray-800">
                                                            {group.kpi
                                                                ?.target ||
                                                                "N/A"}
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {group.latestPoints > 0 &&
                                                        group.kpi?.target && (
                                                            <div className="space-y-2">
                                                                <Progress
                                                                    value={
                                                                        (group.latestPoints /
                                                                            group
                                                                                .kpi
                                                                                .target) *
                                                                        100
                                                                    }
                                                                    className="h-3"
                                                                />
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        Weight:{" "}
                                                                        {group
                                                                            .kpi
                                                                            ?.weight ||
                                                                            0}
                                                                        %
                                                                    </span>
                                                                    <span>
                                                                        Score:{" "}
                                                                        {Math.round(
                                                                            (group.latestPoints /
                                                                                group
                                                                                    .kpi
                                                                                    .target) *
                                                                                100
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                    {/* KPI Details */}
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-600">
                                                                    Total
                                                                    Evaluations:
                                                                </span>
                                                                <span className="ml-2 font-medium">
                                                                    {
                                                                        (
                                                                            group.scores ||
                                                                            []
                                                                        ).length
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">
                                                                    Latest Date:
                                                                </span>
                                                                <span className="ml-2 font-medium">
                                                                    {group.latestDate
                                                                        ? new Date(
                                                                              group.latestDate
                                                                          ).toLocaleDateString()
                                                                        : "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score History */}
                                                    {(group.scores || [])
                                                        .length > 1 && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <div className="flex items-start space-x-2">
                                                                <BarChart3 className="h-4 w-4 text-blue-600 mt-1" />
                                                                <div className="w-full">
                                                                    <p className="text-sm font-medium text-blue-800 mb-2">
                                                                        Score
                                                                        History:
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {(
                                                                            group.scores ||
                                                                            []
                                                                        )
                                                                            .slice(
                                                                                -3
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    score,
                                                                                    idx
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            score?.id ||
                                                                                            idx
                                                                                        }
                                                                                        className="flex justify-between text-xs text-blue-700"
                                                                                    >
                                                                                        <span>
                                                                                            {score?.created_at
                                                                                                ? new Date(
                                                                                                      score.created_at
                                                                                                  ).toLocaleDateString()
                                                                                                : "N/A"}
                                                                                        </span>
                                                                                        <span className="font-medium">
                                                                                            {score?.points ||
                                                                                                0}
                                                                                        </span>
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Pending Status */}
                                                    {group.latestPoints ===
                                                        0 && (
                                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                            <div className="flex items-center space-x-2">
                                                                <Clock className="h-4 w-4 text-orange-600" />
                                                                <p className="text-sm text-orange-800">
                                                                    No scores
                                                                    recorded for
                                                                    this KPI
                                                                    yet.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BarChart3 className="h-5 w-5 text-[#FF3F33]" />
                                    <span>Historical Performance</span>
                                </CardTitle>
                                <CardDescription>
                                    Past 4 months KPI scores
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(kpiData?.last4Months || []).length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <LineChart
                                            data={(
                                                kpiData?.last4Months || []
                                            ).filter((month) => month != null)}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => [
                                                    value || 0,
                                                    name,
                                                ]}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="sales"
                                                stroke="#FF3F33"
                                                strokeWidth={2}
                                                name="Sales"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="service"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                name="Service"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="knowledge"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                name="Knowledge"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="cleanliness"
                                                stroke="#F59E0B"
                                                strokeWidth={2}
                                                name="Cleanliness"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="teamwork"
                                                stroke="#8B5CF6"
                                                strokeWidth={2}
                                                name="Teamwork"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-64 text-gray-500">
                                        No historical data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Calendar className="h-5 w-5 text-[#FF3F33]" />
                                    <span>Monthly Summary</span>
                                </CardTitle>
                                <CardDescription>
                                    Last 4 months performance summary
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(kpiData?.last4Months || []).length > 0 ? (
                                        (kpiData?.last4Months || [])
                                            .map((month, index) => {
                                                if (!month) return null;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium">
                                                                {month.month ||
                                                                    "Unknown"}{" "}
                                                                2025
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Overall
                                                                Performance
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-[#FF3F33]">
                                                                {month.percentage ||
                                                                    0}
                                                                %
                                                            </p>
                                                            <Badge
                                                                className={
                                                                    getPerformanceLevel(
                                                                        month.percentage ||
                                                                            0
                                                                    ).class
                                                                }
                                                            >
                                                                {
                                                                    getPerformanceLevel(
                                                                        month.percentage ||
                                                                            0
                                                                    ).label
                                                                }
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                            .filter(Boolean)
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            No monthly data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="trends">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5 text-[#FF3F33]" />
                                <span>Weekly Progress</span>
                            </CardTitle>
                            <CardDescription>
                                Last 4 weeks performance vs targets
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(kpiData?.last4Weeks || []).length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={(
                                            kpiData?.last4Weeks || []
                                        ).filter((week) => week != null)}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                value || 0,
                                                name,
                                            ]}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="target"
                                            fill="#E5E7EB"
                                            name="Target"
                                        />
                                        <Bar
                                            dataKey="score"
                                            fill="#FF3F33"
                                            name="Actual Score"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                    No weekly data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
