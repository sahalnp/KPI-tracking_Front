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

interface PerformanceReport {
    date: string;
    totalSales: number;
    totalTarget: number;
    achievement: number;
    activeStaff: number;
    walkOuts: number;
}

export function OwnerReport() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // +1 because "All Month" is at index 0
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();

    const months = [
        "All Month","January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 4 + i);

    const isDisabled = (month: number, year: number) => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // +1 because "All Month" is at index 0
        const currentYear = currentDate.getFullYear();
        
        // Disable future years
        if (year > currentYear) return true;
        // Disable future months in current year
        if (year === currentYear && month > currentMonth) return true;
        // Disable "All Month" for future years
        if (month === 0 && year > currentYear) return true;
        return false;
    };

    // Initialize selected month to current month to avoid future months
    useEffect(() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        if (selectedMonth > currentMonth && selectedYear === currentDate.getFullYear()) {
            setSelectedMonth(currentMonth);
        }
    }, [selectedMonth, selectedYear]);

    const reports = [
        {
            id: 1,
            name: "Staff Overview",
            icon: Users,
            bgColor: "bg-yellow-50",
            iconColor: "text-yellow-600",
            route: "/Owner/reports/staff",
        },
        {
            id: 2,
            name: "Sales Report",
            icon: TrendingUp,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            route: "/Owner/reports/sales",
        },
        {
            id: 3,
            name: "Attendance",
            icon: UserCheck, 
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            route: "/Owner/reports/attendance",
        },

        {
            id: 4,
            name: "Walkout Report",
            icon: UserX,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            route: "/Owner/reports/walkout",
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div
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
            </motion.div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Select Month & Year
                    </CardTitle>
                    <CardDescription>
                        Choose the month and year for your reports
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="flex gap-4 items-end">
                        {/* Month Selection */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Month
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {months.map((month, index) => (
                                    <option 
                                        key={month} 
                                        value={index}
                                        disabled={isDisabled(index, selectedYear)}
                                    >
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selection */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                                        // onClick={() => {
                                        //   const today = new Date();
                                        //   const fmt = (d: Date) => d.toISOString().split("T")[0];
                                        //   const startOfWeek = new Date(today);
                                        //   startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                                        //   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                                        //   const [start, end] =
                                        //     customStartDate && customEndDate
                                        //       ? [customStartDate, customEndDate]
                                        //       : filterType === "this-week"
                                        //       ? [fmt(startOfWeek), fmt(today)]
                                        //       : filterType === "this-month"
                                        //       ? [fmt(startOfMonth), fmt(today)]
                                        //       : [fmt(today), fmt(today)];

                                        //   navigate(`${report.route}?filter=${filterType}&start=${start}&end=${end}`);
                                        // }}
                                        onClick={() => {
                                            const fmt = (d: Date) => d.toISOString().split("T")[0];
                                            
                                            if (selectedMonth === 0) {
                                                // "All Month" selected
                                                const currentDate = new Date();
                                                const currentYear = currentDate.getFullYear();
                                                const currentMonth = currentDate.getMonth();
                                                
                                                let start, end;
                                                
                                                if (selectedYear === currentYear) {
                                                    // Current year: Jan 1st to current month 31st
                                                    start = new Date(selectedYear, 0, 1); // January 1st
                                                    end = new Date(selectedYear, currentMonth + 1, 0); // Last day of current month
                                                } else {
                                                    // Previous years: Jan 1st to Dec 31st
                                                    start = new Date(selectedYear, 0, 1); // January 1st
                                                    end = new Date(selectedYear, 11, 31); // December 31st
                                                }
                                                
                                                navigate(`${report.route}?start=${fmt(start)}&end=${fmt(end)}&month=all&year=${selectedYear}`);
                                            } else {
                                                // Specific month selected
                                                // selectedMonth is 1-based (October = 10)
                                                // For Date constructor, need 0-based (October = 9)
                                                const dateMonth = selectedMonth - 1;
                                                const startOfMonth = new Date(selectedYear, dateMonth, 1);
                                                const endOfMonth = new Date(selectedYear, dateMonth + 1, 0);
                                                
                                                const start = fmt(startOfMonth);
                                                const end = fmt(endOfMonth);

                                                // Pass 1-based month in URL (October = 10)
                                                navigate(
                                                    `${report.route}?start=${start}&end=${end}&month=${selectedMonth}&year=${selectedYear}`
                                                );
                                            }
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
