import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { 
  Calendar,
  Download,
  X,
  DollarSign,
  ShoppingCart
} from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import { axiosInstance } from '@/api/axios'
import { logoutSupervisor } from '@/lib/logoutApi'
import { clearUser } from '@/features/UserSlice'
import { useDispatch } from 'react-redux'
import { LoadingSpinner } from '@/components/ui/spinner'

// Sales Data Interface
interface SalesData {
  id: string
  staffId: string
  staffName: string
  year_code: string
  qtySold: number
  salesAmount: number
  prodValue: number
  profit: number
  per: number
  weight: number
  points: number
  date: string
}

// no mock data

interface SalesReportPageProps {
  onClose?: () => void
}

export default function SupervisorSalesReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isMonthYearModalOpen, setIsMonthYearModalOpen] = useState(false)
  const [sales, setSales] = useState<SalesData[]>([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'sales'|'qty'|'profit'|'points'>('sales')
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc')
  const [summary, setSummary] = useState({ totalQty: 0, totalSales: 0, totalProfit: 0, totalPoints: 0 })
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
    const fetchSales = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.get('/supervisor/salesReport', {
          params: { month: selectedMonth + 1, year: selectedYear }
        })
        if (res.data?.success) {
          setSales(res.data.sales || [])
          setSummary(res.data.summary || { totalQty: 0, totalSales: 0, totalProfit: 0, totalPoints: 0 })
        } else {

          setError(res.data?.error || 'Failed to fetch sales report')
          toast.error(res.data?.error || 'Failed to fetch sales report')
        }
      } catch (err: any) {
        console.error('Fetch Sales Report error:', err)
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
                        } else if (err.response?.status === 400) {
                            setError(
                                err.response.data.error || "Invalid request parameters"
                            );
                            toast.error(
                                err.response.data.error || "Invalid request parameters"
                            );
                        }
        setError(err.response?.data?.error || 'Failed to fetch sales report')
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [selectedMonth, selectedYear, dispatch])
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase()
    let data = sales
    if (q) {
      data = data.filter(s =>
        s.staffName?.toLowerCase().includes(q) ||
        String(s.staffId).toLowerCase().includes(q)
      )
    }
    const keyMap = {
      sales: (s: SalesData) => s.salesAmount,
      qty: (s: SalesData) => s.qtySold,
      profit: (s: SalesData) => s.profit,
      points: (s: SalesData) => s.points,
    }
    const getter = keyMap[sortKey]
    const sorted = [...data].sort((a, b) => {
      const av = getter(a) || 0
      const bv = getter(b) || 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return sorted
  }, [sales, search, sortKey, sortDir])

  const hasSales = filteredSales.length > 0

  const handleApplyMonthYear = () => {
    setIsMonthYearModalOpen(false)
  }

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      const { data } = await axiosInstance.get(`/supervisor/salesReport/export`, {
        params: { format: 'pdf', month: selectedMonth + 1, year: selectedYear },
        responseType: 'blob'
      })
      const blob = new Blob([data], { type: 'application/pdf' })
      saveAs(blob, `Sales-Report-${selectedYear}-${selectedMonth + 1}.pdf`)
      toast.success('PDF download started')
    } catch (err:any) {
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
      const { data } = await axiosInstance.get(`/supervisor/salesReport/export`, {
        params: { format: 'excel', month: selectedMonth + 1, year: selectedYear },
        responseType: 'blob'
      })
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `Sales-Report-${selectedYear}-${selectedMonth + 1}.xlsx`)
      toast.success('Excel download started')
    } catch (err:any) {
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
  {/* Left: Title & Date */}
  <div>
    <h1 className="text-xl font-semibold text-gray-900">
      Sales Report
    </h1>
    <p className="text-sm text-gray-600">
      {months[selectedMonth]} {selectedYear}
    </p>
  </div>

  {/* Right: Buttons */}
  <div className="flex items-center gap-3">
  <div className="hidden md:block">
    <Input
      placeholder="Search by name or ID"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-10 w-56"
    />
  </div>
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
      disabled={!hasSales}
    >
      <Download className="h-6 w-6 text-red-500" />
    </Button>
  </div>
</motion.div>



      {loading && (
        <LoadingSpinner />
      )}

      {!loading && !hasSales && (
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
      <ShoppingCart className="h-16 w-16 text-gray-400" />
    </motion.div>

    <span className="text-sm text-gray-500 mb-2">
      Tap the cart to select period
    </span>

    <h3 className="text-xl font-medium mb-2">No Sales Found</h3>
    <p className="text-muted-foreground text-center max-w-md">
      No sales data available for {months[selectedMonth]} {selectedYear}.
    </p>
  </motion.div>
)}

     

    {/* {!hasSales && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="p-6 bg-gray-100 rounded-full mb-6">
            <ShoppingCart className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Sales Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No sales data available for {months[selectedMonth]} {selectedYear}.
          </p> */}
        {/* <Button
  className="mt-6 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md flex items-center"
  onClick={() => setIsMonthYearModalOpen(true)}
>
  <Calendar className="h-4 w-4 mr-2" />
  Select Different Period
</Button> */}

        {/* </motion.div>
      )} */}
      {/* Sort & Mobile Search */}
      {!loading && hasSales && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="sm:hidden">
            <Input
              placeholder="Search by name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by</span>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
            >
              <option value="sales">Sales</option>
              <option value="qty">Qty</option>
              <option value="profit">Profit</option>
              <option value="points">Points</option>
            </select>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
            >
              <option value="desc">High → Low</option>
              <option value="asc">Low → High</option>
            </select>
          </div>
        </div>
      )}

      {/* Sales Cards */}
      {!loading && hasSales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSales.map((sale, index) => (
            <motion.div
              key={`${sale.staffId}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {sale.staffId}
                    </Badge>
                    <Badge 
                      variant={index < 3 ? 'default' : 'secondary'}
                      className={`${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        ''
                      }`}
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{sale.staffName}</CardTitle>
                  <CardDescription>Month: {months[selectedMonth]} {selectedYear}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sales Amount - Primary */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-900">Sales Amount</span>
                    </div>
                    <p className="text-2xl font-medium text-green-900">
                      {formatCurrency(sale.salesAmount)}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 mb-1">Qty Sold</p>
                      <p className="font-medium text-blue-900">{sale.qtySold}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-700 mb-1">Points</p>
                      <p className="font-medium text-purple-900">{sale.points.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-700 mb-1">Profit</p>
                      <p className="font-medium text-orange-900">{formatCurrency(sale.profit)}</p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-xs text-pink-700 mb-1">Profit %</p>
                      <p className="font-medium text-pink-900">{sale.per.toFixed(2)}%</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Product Value:</span>
                      <span className="font-medium">{formatCurrency(sale.prodValue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="font-medium">{sale.weight.toFixed(2)} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Card if sales exist */}
      {!loading && hasSales && (
        <Card className="bg-gradient-to-r from-[#FF3F33] to-[#ff6b63] text-white">
          <CardHeader>
            <CardTitle className="text-white">Summary</CardTitle>
            <CardDescription className="text-white/80">
              Total for {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-white/80 mb-1">Total Sales</p>
                <p className="text-xl font-medium">
                  {formatCurrency(summary.totalSales)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/80 mb-1">Total Qty</p>
                <p className="text-xl font-medium">
                  {summary.totalQty}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/80 mb-1">Total Profit</p>
                <p className="text-xl font-medium">
                  {formatCurrency(summary.totalProfit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/80 mb-1">Total Points</p>
                <p className="text-xl font-medium">
                  {summary.totalPoints.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


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

      {/* Dropdowns */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Month */}
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

        {/* Year */}
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

      {/* Done Button */}
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

{/* Export Modal (match staffReports.tsx style) */}
<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="w-[95%] max-w-[20rem] sm:max-w-[16rem] rounded-2xl">
    <DialogHeader>
      <DialogTitle>Export Report</DialogTitle>
      <DialogDescription>Choose a format:</DialogDescription>
    </DialogHeader>
    <div className="space-y-3 pt-2">
      <button
        onClick={handleExportPDF}
        disabled={pdfLoading}
        className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm ${pdfLoading ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed' : 'bg-white border-gray-200 hover:bg-gray-50 active:scale-95'}`}
      >
        <div className={`p-2 rounded-lg ${pdfLoading ? 'bg-gray-200' : 'bg-red-100'}`}>
          {pdfLoading ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Download className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="text-left">
          <div className="font-semibold text-gray-900">{pdfLoading ? 'Preparing PDF…' : 'Export as PDF'}</div>
          <div className="text-xs text-gray-500">Portable Document</div>
        </div>
      </button>

      <button
        onClick={handleExportExcel}
        disabled={excelLoading}
        className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-200 shadow-sm ${excelLoading ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed' : 'bg-white border-gray-200 hover:bg-gray-50 active:scale-95'}`}
      >
        <div className={`p-2 rounded-lg ${excelLoading ? 'bg-gray-200' : 'bg-green-100'}`}>
          {excelLoading ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Download className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="text-left">
          <div className="font-semibold text-gray-900">{excelLoading ? 'Preparing Excel…' : 'Export as Excel'}</div>
          <div className="text-xs text-gray-500">Spreadsheet (.xlsx)</div>
        </div>
      </button>
    </div>
  </DialogContent>
</Dialog>


    </div>
  )
}