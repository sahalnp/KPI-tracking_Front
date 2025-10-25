import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
    Calendar,
    Filter,
    Download,
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    FileText,
    Wallet,
    ShoppingCart,
    CreditCard,
    Package,
    LogOut,
    UserX2,
    UserX,
    UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/api/axios";
import { logoutSupervisor } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";

interface PerformanceReport {
    date: string;
    totalSales: number;
    totalTarget: number;
    achievement: number;
    activeStaff: number;
    walkOuts: number;
}

export function SupervisorReports() {
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCustomCalendar, setShowCustomCalendar] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [filterType, setFilterType] = useState<
        "today" | "this-week" | "this-month" | "custom" | "open"
    >("today");


    // Get current data based on filter type
    // const getCurrentData = () => {
    //     switch (filterType) {
    //         case "today":
    //             return dailyData;
    //         case "this-week":
    //             return monthlyData;
    //         case "this-month":
    //             return yearlyData;
    //         default:
    //             return dailyData;
    //     }
    // };

    function MiniCalendar({
        start,
        end,
        onChange,
    }: {
        start: string;
        end: string;
        onChange: (s: string, e: string) => void;
    }) {
        // ✅ Initialize cursor to current month
        const [cursor, setCursor] = useState(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        );

        const [highlightedDates, setHighlightedDates] = useState<string[]>([]);

        // Highlight dates between start and end
        useEffect(() => {
            if (!start || !end) {
                setHighlightedDates([]);
                return;
            }

            const startDate = new Date(start);
            const endDate = new Date(end);
            const dates: string[] = [];
            let current = new Date(startDate);

            while (current <= endDate) {
                dates.push(current.toISOString().split("T")[0]);
                current.setDate(current.getDate() + 1);
            }

            setHighlightedDates(dates);
        }, [start, end]);

        const monthName = cursor.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        const daysInMonth = new Date(
            cursor.getFullYear(),
            cursor.getMonth() + 1,
            0
        ).getDate();
        const firstDay = new Date(
            cursor.getFullYear(),
            cursor.getMonth(),
            1
        ).getDay();
        const today = new Date().toISOString().split("T")[0];

        const dateCells = Array.from(
            { length: firstDay + daysInMonth },
            (_, i) => {
                const day = i - firstDay + 1;
                if (day <= 0) return null;
                const iso = new Date(
                    cursor.getFullYear(),
                    cursor.getMonth(),
                    day
                )
                    .toISOString()
                    .split("T")[0];
                return iso;
            }
        );

        const isDisabled = (iso: string) => iso > today;
        const isStart = (iso: string) => start && iso === start;
        const isEnd = (iso: string) => end && iso === end;

        const handleDateClick = (iso: string) => {
            if (isDisabled(iso)) return;

            if (start === iso && !end) {
                onChange("", "");
                return;
            }

            if (start === iso && end === iso) {
                onChange("", "");
                return;
            }

            if (!start || (start && end)) {
                onChange(iso, "");
            } else {
                if (iso >= start) {
                    onChange(start, iso);
                } else {
                    onChange(iso, start);
                }
            }
        };

        const goToPrevMonth = () => {
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
        };

        const goToNextMonth = () => {
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
        };

        return (
            <div className="w-72 select-none bg-white p-4 rounded-lg shadow-lg border">
                {/* header */}
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={goToPrevMonth}
                        className="px-2 py-1 hover:bg-accent rounded"
                    >
                        ‹
                    </button>
                    <span className="font-medium">{monthName}</span>
                    <button
                        onClick={goToNextMonth}
                        className="px-2 py-1 hover:bg-accent rounded"
                    >
                        ›
                    </button>
                </div>

                {/* weekday labels */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                {/* days */}
                <div className="grid grid-cols-7 gap-1">
                    {dateCells.map((iso, idx) =>
                        iso ? (
                            <button
                                key={iso}
                                onClick={() => handleDateClick(iso)}
                                disabled={isDisabled(iso)}
                                className={`h-8 w-8 rounded text-sm transition-colors
                ${
                    isDisabled(iso)
                        ? "text-gray-300 cursor-not-allowed opacity-50"
                        : "hover:bg-accent"
                }
                ${
                    highlightedDates.includes(iso) &&
                    !isStart(iso) &&
                    !isEnd(iso)
                        ? "bg-red-100 text-red-700"
                        : ""
                }
                ${isStart(iso) ? "bg-red-600 text-white font-bold" : ""}
                ${isEnd(iso) ? "bg-red-600 text-white font-bold" : ""}
              `}
                            >
                                {new Date(iso).getDate()}
                            </button>
                        ) : (
                            <div key={`empty-${idx}`} />
                        )
                    )}
                </div>
            </div>
        );
    }

    const reports = [
        {
            id: 1,
            name: "Staff Overview",
            icon: Users,
            bgColor: "bg-yellow-50",
            iconColor: "text-yellow-600",
            route: "/FloorSupervisor/reports/staff",
        },
        {
            id: 2,
            name: "Sales Report",
            icon: TrendingUp,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            route: "/FloorSupervisor/reports/sales",
        },
        {
            id: 3,
            name: "Attendance",
            icon: UserCheck, 
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            route: "/FloorSupervisor/reports/attendance",
        },
        {
            id: 4,
            name: "Walkout Report",
            icon: UserX,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            route: "/FloorSupervisor/reports/walkout",
        },
    ];

    return (
        <div className="space-y-6">
            {/* <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Performance Reports
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Analyze performance metrics across different time periods
                </p>
            </motion.div> */}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Report Filters
                    </CardTitle>
                    <CardDescription>
                        Select date range to view performance data
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* -------- FILTER SECTION -------- */}
                    <div className="relative flex items-center gap-3 w-full max-w-sm">
                        {/* --- TODAY DROPDOWN --- */}
                        <div className="relative flex-1">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() =>
                                    setFilterType((p) =>
                                        p === "open" ? "today" : "open"
                                    )
                                }
                                className="flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-background h-10"
                            >
                                <span className="capitalize flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {filterType === "open"
                                        ? "Today"
                                        : filterType.replace("-", " ")}
                                </span>
                                <motion.div
                                    animate={{
                                        rotate: filterType === "open" ? 180 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </motion.div>
                            </motion.button>

                            <AnimatePresence>
                                {filterType === "open" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg"
                                    >
                                        {(
                                            [
                                                "today",
                                                "this-week",
                                                "this-month",
                                            ] as const
                                        ).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setFilterType(t)}
                                                className="w-full text-left px-3 py-2 hover:bg-accent capitalize"
                                            >
                                                {t.replace("-", " ")}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCustomCalendar((c) => !c);
                            }}
                            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg px-3"
                        >
                            <Calendar className="h-4 w-4" />
                            <span>Custom</span>

                            {/* rotating chevron */}
                            <motion.div
                                animate={{
                                    rotate: showCustomCalendar ? 180 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </motion.div>
                        </Button>

                        {/* calendar pop-over */}
                        <AnimatePresence>
                            {showCustomCalendar && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-20 top-full left-0 right-0 mt-2"
                                >
                                    <MiniCalendar
                                        start={customStartDate}
                                        end={customEndDate}
                                        onChange={(s, e) => {
                                            setCustomStartDate(s);
                                            setCustomEndDate(e);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

            {/* ALL REPORTS SECTION */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Reports</CardTitle>
                        <CardDescription>
                            Access different report types and analytics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {reports.map((report, index) => {
                                const Icon = report.icon;
                                return (
                                    <motion.button
                                        key={report.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{
                                            scale: 0.85,
                                            boxShadow:
                                                "0 2px 4px rgba(0,0,0,0.1)",
                                        }}
                                        onClick={() => {
                                            const today = new Date();
                                            const fmt = (d: Date) =>
                                                d.toISOString().split("T")[0];

                                            // Start of week (Monday)
                                            const startOfWeek = new Date(today);
                                            const day = today.getDay(); // 0 = Sunday, 1 = Monday ...
                                            startOfWeek.setDate(
                                                today.getDate() -
                                                    (day === 0 ? 6 : day - 1)
                                            );

                                            // End of week (Sunday)
                                            const endOfWeek = new Date(
                                                startOfWeek
                                            );
                                            endOfWeek.setDate(
                                                startOfWeek.getDate() + 6
                                            );

                                            // Start of month
                                            const startOfMonth = new Date(
                                                today.getFullYear(),
                                                today.getMonth(),
                                                1
                                            );

                                            const [start, end] =
                                                customStartDate && customEndDate
                                                    ? [
                                                          customStartDate,
                                                          customEndDate,
                                                      ]
                                                    : filterType === "this-week"
                                                    ? [
                                                          fmt(startOfWeek),
                                                          fmt(endOfWeek),
                                                      ]
                                                    : filterType ===
                                                      "this-month"
                                                    ? [
                                                          fmt(startOfMonth),
                                                          fmt(today),
                                                      ]
                                                    : [fmt(today), fmt(today)];

                                            navigate(
                                                `${report.route}?filter=${filterType}&start=${start}&end=${end}`
                                            );
                                        }}
                                        className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                    >
                                        <div
                                            className={`${report.bgColor} p-3 rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200`}
                                        >
                                            <Icon
                                                className={`w-6 h-6 ${report.iconColor}`}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 text-center">
                                            {report.name}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
