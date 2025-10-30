import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar,
  Download,
  UserCheck,
  Clock,
  Users,
  FileText,
  Sheet,
  TrendingUp,
  CalendarDays,
  UserMinus,
  CheckCircle, 
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import { axiosInstance } from '@/api/axios'
import { logoutSupervisor } from '@/lib/logoutApi'
import { clearUser } from '@/features/UserSlice'
import { useDispatch } from 'react-redux'
import { LoadingSpinner } from '@/components/ui/spinner'

// Attendance Data Interface
interface AttendanceData {
  id: string
  staffId: string
  staffName: string
  date: string
  fullDays: number
  halfDays: number
  leaveCount: number
  totalDays: number
  staff?: {
    id: string
    name: string
    uniqueId: string
    role: string
    section: string
    floor?: { name: string }
  }
}

interface AttendanceSummary {
  totalStaff: number
  totalAttendance: number
  totalFullDays: number
  totalHalfDays: number
  totalLeaves: number
}

export default function SupervisorAttendanceReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isMonthYearModalOpen, setIsMonthYearModalOpen] = useState(false)
  const [attendance, setAttendance] = useState<AttendanceData[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalStaff: 0,
    totalAttendance: 0,
    totalFullDays: 0,
    totalHalfDays: 0,
    totalLeaves: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const dispatch = useDispatch()

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.get('/supervisor/attendanceReport', {
          params: { month: selectedMonth + 1, year: selectedYear }
        })
        if (res.data?.success) {
          setAttendance(res.data.attendance || [])
          setSummary(res.data.summary || {
            totalStaff: 0,
            totalAttendance: 0,
            totalFullDays: 0,
            totalHalfDays: 0,
            totalLeaves: 0
          })
        } else {
          setError(res.data?.error || 'Failed to fetch attendance report')
          toast.error(res.data?.error || 'Failed to fetch attendance report')
        }
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
                        }
        else if (err.response?.status === 400) {
          setError(err.response.data.error || "Invalid request parameters");
          toast.error(err.response.data.error || "Invalid request parameters");
        }
        setError(err.response?.data?.error || 'Failed to fetch attendance report')
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [selectedMonth, selectedYear, dispatch])

  const hasAttendance = attendance.length > 0

  const handleApplyMonthYear = () => {
    setIsMonthYearModalOpen(false)
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      const { data } = await axiosInstance.get(`/supervisor/attendanceReport/export`, {
        params: { format: 'pdf', month: selectedMonth + 1, year: selectedYear },
        responseType: 'blob'
      })
      const blob = new Blob([data], { type: 'application/pdf' })
      saveAs(blob, `Attendance-Report-${selectedYear}-${selectedMonth + 1}.pdf`)
      toast.success('PDF download started')
    } catch (err:any) {
      console.error(err)
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
                      }
      toast.error('Failed to download PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setExcelLoading(true)
    try {
      const { data } = await axiosInstance.get(`/supervisor/attendanceReport/export`, {
        params: { format: 'excel', month: selectedMonth + 1, year: selectedYear },
        responseType: 'blob'
      })
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `Attendance-Report-${selectedYear}-${selectedMonth + 1}.xlsx`)
      toast.success('Excel download started')
    } catch (err:any) {
      console.error(err)
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
                      }
      toast.error('Failed to export Excel')
    } finally {
      setExcelLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Attendance Report
          </h1>
          <p className="text-sm text-gray-600">
            {(() => {
              const year = selectedYear;
              const month = selectedMonth;
              const lastDay = new Date(year, month + 1, 0).getDate();
              const monthName = months[month];
              
              return `1st - ${lastDay}${lastDay === 31 ? 'st' : 'th'} ${monthName} ${year}`;
            })()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsMonthYearModalOpen(true)}
            className="flex items-center justify-center p-2 h-10 w-10"
          >
            <Calendar className="h-5 w-5" />
          </Button>

          <Button
            className="bg-transparent border border-gray-300 p-2 rounded-full transition-transform duration-200 hover:scale-110 hover:bg-gray-100 shadow-sm"
            onClick={() => setModalOpen(true)}
            disabled={!hasAttendance}
          >
            <Download className="h-6 w-6 text-red-500" />
          </Button>
        </div>
      </motion.div>

      {loading && (
        <LoadingSpinner />
      )}

      {!loading && !hasAttendance && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <motion.div
            className="p-6 bg-gray-100 rounded-full mb-6 cursor-pointer shadow-md hover:shadow-lg border-2 border-transparent hover:border-gray-400 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMonthYearModalOpen(true)}
          >
            <UserCheck className="h-16 w-16 text-gray-400" />
          </motion.div>

          <span className="text-sm text-gray-500 mb-2">
            Tap the icon to select period
          </span>

          <h3 className="text-xl font-medium mb-2">No Attendance Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No attendance data available for {(() => {
              const year = selectedYear;
              const month = selectedMonth;
              const lastDay = new Date(year, month + 1, 0).getDate();
              const monthName = months[month];
              
              return `1st - ${lastDay}${lastDay === 31 ? 'st' : 'th'} ${monthName} ${year}`;
            })()}.
          </p>
        </motion.div>
      )}

      {/* Summary Overview */}
      {!loading && hasAttendance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Attendance Overview</h2>
              <p className="text-blue-100">
                {(() => {
                  const year = selectedYear;
                  const month = selectedMonth;
                  const lastDay = new Date(year, month + 1, 0).getDate();
                  const monthName = months[month];
                  
                  return `1st - ${lastDay}${lastDay === 31 ? 'st' : 'th'} ${monthName} ${year}`;
                })()}
              </p>
            </div>
            <CalendarDays className="w-12 h-12 text-blue-200" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-blue-200" />
              </div>
              <p className="text-3xl font-bold">{summary.totalStaff}</p>
              <p className="text-sm text-blue-100">Total Staff</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
              <p className="text-3xl font-bold">{summary.totalFullDays}</p>
              <p className="text-sm text-blue-100">Full Days</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
              <p className="text-3xl font-bold">{summary.totalHalfDays}</p>
              <p className="text-sm text-blue-100">Half Days</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <UserMinus className="w-8 h-8 text-red-200" />
              </div>
              <p className="text-3xl font-bold">{summary.totalLeaves}</p>
              <p className="text-sm text-blue-100">Leaves</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance Table */}
      {!loading && hasAttendance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <p className="text-sm text-gray-500">{attendance.length} records found</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Days
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Half Days
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leaves
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record, index) => {
                  const attendancePercentage = record.totalDays > 0 
                    ? Math.round(((record.fullDays + record.halfDays * 0.5) / record.totalDays) * 100)
                    : 0;
                  
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                            {record.staff?.name ? record.staff.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.staff?.name || 'Unknown Staff'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {record.staff?.uniqueId || record.staffId}
                            </div>
                            {record.staff?.section && (
                              <div className="text-xs text-gray-400">
                                {record.staff.section} | {record.staff.floor?.name || 'No Floor'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {record.fullDays}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {record.halfDays}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {record.leaveCount}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                        {record.totalDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className={`w-16 h-2 rounded-full mr-2 ${
                            attendancePercentage >= 80 ? 'bg-green-200' :
                            attendancePercentage >= 60 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}>
                            <div 
                              className={`h-2 rounded-full ${
                                attendancePercentage >= 80 ? 'bg-green-500' :
                                attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            attendancePercentage >= 80 ? 'text-green-600' :
                            attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attendancePercentage}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Month/Year Selection Modal */}
      <Dialog open={isMonthYearModalOpen} onOpenChange={setIsMonthYearModalOpen}>
        <DialogContent className="w-[95%] max-w-[20rem] sm:max-w-[16rem] rounded-lg border border-gray-200 shadow-lg px-4 py-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold">
                Select Month & Year
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-md border border-gray-300 appearance-none cursor-pointer text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>
                      {month.slice(0, 3)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-md border border-gray-300 appearance-none cursor-pointer text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6"
            >
              <Button
                onClick={handleApplyMonthYear}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 text-sm rounded-md shadow-md transition-colors duration-200"
              >
                Done
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95%] max-w-[24rem] rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Export Attendance Report</h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              {(() => {
                const year = selectedYear;
                const month = selectedMonth;
                const lastDay = new Date(year, month + 1, 0).getDate();
                const monthName = months[month];
                
                return `1st - ${lastDay}${lastDay === 31 ? 'st' : 'th'} ${monthName} ${year}`;
              })()} • {attendance.length} records
            </p>
          </div>
          
          <div className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading || !hasAttendance}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                  pdfLoading || !hasAttendance
                    ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed'
                    : 'bg-white border-gray-200 hover:bg-red-50 hover:border-red-200 active:scale-95'
                }`}
              >
                <div className={`p-3 rounded-lg ${pdfLoading ? 'bg-gray-200' : 'bg-red-100'}`}>
                  {pdfLoading ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <FileText className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-sm">
                    {pdfLoading ? 'Preparing…' : 'PDF Report'}
                  </div>
                  <div className="text-xs text-gray-500">Portable Document</div>
                </div>
              </button>
              
              <button
                onClick={handleExportExcel}
                disabled={excelLoading || !hasAttendance}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                  excelLoading || !hasAttendance
                    ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed'
                    : 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-200 active:scale-95'
                }`}
              >
                <div className={`p-3 rounded-lg ${excelLoading ? 'bg-gray-200' : 'bg-green-100'}`}>
                  {excelLoading ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <Sheet className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-sm">
                    {excelLoading ? 'Preparing…' : 'Excel Report'}
                  </div>
                  <div className="text-xs text-gray-500">Spreadsheet</div>
                </div>
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-700">
                  Reports include attendance percentages and detailed breakdowns
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}