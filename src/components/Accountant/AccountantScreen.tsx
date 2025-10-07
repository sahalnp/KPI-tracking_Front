import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Upload, Calendar, ShoppingCart, History, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from 'react'
import { axiosInstance } from '@/api/axios'
import { logoutAccountant } from '@/lib/logoutApi'
import { useDispatch } from 'react-redux'
import { clearUser } from '@/features/UserSlice'
import { toast } from "sonner"
import { LoadingSpinner } from '../ui/spinner'
import { useNavigate } from 'react-router-dom'

export function AccountantDashboard() {
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const quickStats = [
    {
      title: 'Uploads',
      value: details?.uploadCount || 0,
      icon: Upload,
      color: 'text-orange-500',
      path: '/accountant/uploads'
    },
    {
      title: 'Top Selling Staff',
      value: details?.topStaffName || 'N/A',
      icon: ShoppingCart,
      color: 'text-blue-500',
      path: '/accountant/dashboard'
    },
    {
      title: 'Attendance',
      value: details?.attendanceCount || 0,
      icon: CalendarCheck,
      color: 'text-purple-500',
      path: '/accountant/attendence'
    },
    {
      title: 'Active Staff',
      value: details?.activeStaff || 0,
      icon: Calendar,
      color: 'text-green-500',
      path: '/accountant/account'
    }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        
        const { data } = await axiosInstance.get("/accountant/getDetails", {
          params: { month, year }
        });
        setDetails(data.value)
        console.log(data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("accesstoken");
          localStorage.removeItem("refreshtoken");
          await logoutAccountant();
          dispatch(clearUser());
          toast.error("Session expired");
        } else {
          toast.error("Failed to load staff");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [dispatch, selectedDate]);
  const quickActions = [
    {
      title: 'Upload Monthly Data',
      description: 'Upload Excel/CSV files for sales & attendance',
      icon: Upload,
      action: () => navigate('/accountant/uploads'),
      color: 'bg-[#FF3F33]'
    },
    {
      title: 'Staff Purchases',
      description: 'Manage staff purchases and ledger',
      icon: ShoppingCart,
      action: () => navigate('/accountantpurchases'),
      color: 'bg-blue-500'
    },
    {
      title: 'Monthly Settlement',
      description: 'Process end-of-month settlements',
      icon: Calendar,
      action: () => { },
      color: 'bg-purple-500'
    }
  ]

  const recentActivity = JSON.parse(localStorage.getItem("recentActivity") || "[]").slice(0, 5);

  const handlePreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      
      // Don't allow going before January of current year
      const currentYear = new Date().getFullYear();
      if (newDate.getFullYear() < currentYear) {
        return prev; // Return unchanged if it would go to previous year
      }
      
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      const today = new Date();
      
      newDate.setMonth(newDate.getMonth() + 1);
      
      // Don't allow going beyond current month
      if (newDate.getFullYear() > today.getFullYear() || 
          (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() > today.getMonth())) {
        return prev; // Return unchanged if it would go to future
      }
      
      return newDate;
    });
  };

const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  // Check if we can go to previous month (not before January of current year)
  const canGoPrevious = () => {
    const currentYear = new Date().getFullYear();
    return selectedDate.getMonth() > 0 || selectedDate.getFullYear() > currentYear;
  };

  // Check if we can go to next month (not beyond current month)
  const canGoNext = () => {
    const today = new Date();
    return selectedDate.getFullYear() < today.getFullYear() || 
           (selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() < today.getMonth());
  };

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">

      {/* Header with Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-gray-900">Accountant Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreviousMonth}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!canGoPrevious()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#FF3F33] text-black hover:bg-[#E63529] hover:text-white font-medium px-4"
            >
              {formatMonthYear(selectedDate)}
            </Button>
            <Button
              onClick={handleNextMonth}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!canGoNext()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">Manage uploads, purchases, and financial data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg bg-gray-100 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <History className="w-10 h-10 mb-2 text-gray-400" />
              <p className="text-sm font-medium">No recent activity found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity: any, index: any) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg border"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "error"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}