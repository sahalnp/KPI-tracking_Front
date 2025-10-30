import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, DollarSign, Award, Eye, ChevronsDown, Package } from "lucide-react"
import { useNavigate, useSearchParams, useParams } from "react-router-dom"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import { axiosInstance } from '@/api/axios'
import { logoutOwner } from '@/lib/logoutApi'
import { clearUser } from '@/features/UserSlice'
import { useDispatch } from 'react-redux'
import { LoadingSpinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface SalesData {
  year_code?: string
  qtySold: number
  salesAmount: number
  prodValue: number
  profit: number
  per: number
  weight: number
  points: number
}

interface StaffInfo {
  id: string
  staffId: string
  name: string
  mobile: string
  role: string
  section: string
  floor: string
}

const SummaryCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}> = ({ title, value, icon: Icon, color }) => (
    <Card className="h-full">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-xl font-bold">{typeof value === "number" ? formatNumberShort(value) : value}</p>
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </CardContent>
    </Card>
);

const formatNumberShort = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
};

export default function StaffSalesPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const staffId = id; // Use id from URL params instead of search params
  const startDate = searchParams.get('start') || searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('end') || searchParams.get('endDate') || undefined;
  
  let month = searchParams.get("month");
  
  // Month is already 1-based from Reports.tsx (January=1, October=10, December=12)
  if (!month) {
    month = (new Date().getMonth() + 1).toString();
  }
  
  const year = searchParams.get("year") || new Date().getFullYear().toString();

  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // For all months view
  const [monthlyPointsData, setMonthlyPointsData] = useState<any[]>([])
  const [yearCodeData, setYearCodeData] = useState<any[]>([])
  
  // For summary totals
  const [totalSalesAmt, setTotalSalesAmt] = useState(0)
  const [totalProfitAmt, setTotalProfitAmt] = useState(0)
  const [totalPointsAmt, setTotalPointsAmt] = useState(0)
  const [totalQtyAmt, setTotalQtyAmt] = useState(0)
  
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    console.log("=== MONTH STATE ===");
    console.log("staffId from URL:", staffId);
    console.log("month from URL:", month);
    console.log("year from URL:", year);
    console.log("startDate:", startDate);
    console.log("endDate:", endDate);
    console.log("===================");
    
    const fetchSales = async () => {
      if (!staffId) return;
      
      setLoading(true)
      setError(null)
      
      try {
        const isAllMonths = month === "all" || (!startDate && !endDate);
        
        if (isAllMonths) {
          // Fetch all months data for staff
          const res = await axiosInstance.get(`/owner/staff/${staffId}/all-months-sales-report`, {
            params: { year: year || new Date().getFullYear() }
          });
          
          if (res.data?.success) {
            // Get staff info from first available month
            const firstMonthData = Object.values(res.data.data)[0] as any;
            setStaffInfo(firstMonthData?.staff || null);
            
            // Process data for charts and calculate totals
            const monthData: any[] = [];
            const yearCodeCounts: any = {};
            let totalSales = 0;
            let totalProfit = 0;
            let totalPoints = 0;
            let totalQty = 0;
            
            // Iterate through each month in allMonthsData
            Object.keys(res.data.data).forEach((monthName) => {
              const monthDataObj = res.data.data[monthName];
              
              // Calculate total points for this month
              let monthTotalPoints = 0;
              if (monthDataObj?.salesByYearCode && Array.isArray(monthDataObj.salesByYearCode)) {
                monthTotalPoints = monthDataObj.salesByYearCode.reduce((sum: number, item: any) => {
                  return sum + (Number(item.totals?.points || 0));
                }, 0);
                
                // Aggregate year codes for pie chart and calculate totals
                monthDataObj.salesByYearCode.forEach((item: any) => {
                  const yc = item.yearCode || 'N/A';
                  if (!yearCodeCounts[yc]) {
                    yearCodeCounts[yc] = { 
                      name: yc, 
                      value: 0, 
                      totalSales: 0,
                      qtySold: 0,
                      salesAmount: 0,
                      prodValue: 0,
                      profit: 0,
                      per: 0,
                      points: 0
                    };
                  }
                  yearCodeCounts[yc].qtySold += Number(item.totals?.qtySold || 0);
                  yearCodeCounts[yc].salesAmount += Number(item.totals?.salesAmount || 0);
                  yearCodeCounts[yc].prodValue += Number(item.totals?.prodValue || 0);
                  yearCodeCounts[yc].profit += Number(item.totals?.profit || 0);
                  yearCodeCounts[yc].points += Number(item.totals?.points || 0);
                  yearCodeCounts[yc].value = yearCodeCounts[yc].qtySold;
                  yearCodeCounts[yc].totalSales = yearCodeCounts[yc].salesAmount;
                  
                  // Calculate totals
                  totalQty += Number(item.totals?.qtySold || 0);
                  totalSales += Number(item.totals?.salesAmount || 0);
                  totalProfit += Number(item.totals?.profit || 0);
                  totalPoints += Number(item.totals?.points || 0);
                });
              }
              
              monthData.push({ month: monthName, points: monthTotalPoints });
            });
            
            // Normalize months: ensure 0 for months with no sales
            const monthNames: string[] = [
              'January','February','March','April','May','June','July','August','September','October','November','December'
            ];
            const targetYear = parseInt(year || String(new Date().getFullYear()));
            const currentYear = new Date().getFullYear();
            const endMonthIndex = targetYear === currentYear ? new Date().getMonth() : 11; // 0-based index
            const pointsByMonth: Record<string, number> = Object.fromEntries(monthData.map((m:any)=>[m.month, m.points]));
            const normalized = monthNames.slice(0, endMonthIndex + 1).map((name)=>({ month: name, points: Number(pointsByMonth[name]||0) }));

            setMonthlyPointsData(normalized);
            setYearCodeData(Object.values(yearCodeCounts));
            setTotalSalesAmt(totalSales);
            setTotalProfitAmt(totalProfit);
            setTotalPointsAmt(totalPoints);
            setTotalQtyAmt(totalQty);
          }
        } else {
          // Fetch specific month data for staff
          const res = await axiosInstance.get(`/owner/staff/${staffId}/sales-report`, {
            params: { 
              start: startDate, 
              end: endDate, 
              month: parseInt(month), 
              year: parseInt(year) 
            }
          })
          
          if (res.data?.success) {
            console.log('📊 Specific month sales data:', res.data.data);
            setStaffInfo(res.data.data?.staff || null);
            setSalesData(res.data.data?.salesByYearCode || []);
            
            // Calculate totals for specific month
            const salesList = res.data.data?.salesByYearCode || [];
            console.log('📊 Sales list for totals:', salesList);
            const totalSales = salesList.reduce((sum: number, item: any) => sum + (Number(item.totals?.salesAmount || 0)), 0);
            const totalProfit = salesList.reduce((sum: number, item: any) => sum + (Number(item.totals?.profit || 0)), 0);
            const totalPoints = salesList.reduce((sum: number, item: any) => sum + (Number(item.totals?.points || 0)), 0);
            const totalQty = salesList.reduce((sum: number, item: any) => sum + (Number(item.totals?.qtySold || 0)), 0);
            
            console.log('📊 Calculated totals:', { totalSales, totalProfit, totalPoints, totalQty });
            
            setTotalSalesAmt(totalSales);
            setTotalProfitAmt(totalProfit);
            setTotalPointsAmt(totalPoints);
            setTotalQtyAmt(totalQty);
          }
        }
      } catch (err: any) {
        console.error('Fetch Staff Sales error:', err)
        if (err.response?.status === 401) {
          localStorage.removeItem("accesstoken");
          localStorage.removeItem("refreshtoken");
          await logoutOwner();
          dispatch(clearUser());
          toast.error('Session expired! Please sign in to continue.');
        } else if (err.response?.status === 400) {
          setError(err.response.data.error || "Invalid request parameters");
          toast.error(err.response.data.error || "Invalid request parameters");
        }
        setError(err.response?.data?.error || 'Failed to fetch sales report')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSales()
  }, [staffId, month, year, startDate, endDate, dispatch])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const hasSales = salesData.length > 0 || yearCodeData.length > 0
  const isAllMonths = month === "all" || (!startDate && !endDate);

  // Expanded COLORS array to ensure different colors for all year codes
  const COLORS = ['#FF3F33', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#A855F7', '#EF4444', '#6366F1', '#22C55E'];

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Report</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Use state values for summary totals
  const totalSales = totalSalesAmt
  const totalProfit = totalProfitAmt
  const totalPoints = totalPointsAmt
  const totalQty = totalQtyAmt

  return (
    <div className="space-y-6 p-6">
      {/* Staff Info Card */}
      {staffInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">
                {staffInfo?.name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{staffInfo?.name}</h3>
            <span className="text-sm px-3 py-1 rounded-full font-medium bg-green-100 text-green-800">
              {staffInfo?.role || 'Staff'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-mono">ID: {staffInfo?.staffId}</span>
            <span className="mx-2">|</span>
            <span>{staffInfo?.floor} Floor {staffInfo?.section && `- ${staffInfo.section}`}</span>
            <span className="mx-2">|</span>
            <span>Number: {staffInfo?.mobile}</span>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      {!loading && hasSales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SummaryCard 
              title="Total Sales Amount" 
              value={formatCurrency(totalSales)}
              icon={DollarSign} 
              color="text-green-500" 
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SummaryCard 
              title="Total Profit" 
              value={formatCurrency(totalProfit)}
              icon={TrendingUp} 
              color="text-blue-500" 
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SummaryCard 
              title="Total Points" 
              value={totalPoints.toFixed(1)}
              icon={Award} 
              color="text-purple-500" 
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SummaryCard 
              title="Total Quantity" 
              value={totalQty}
              icon={Package} 
              color="text-orange-500" 
            />
          </motion.div>
        </div>
      )}

      {/* All Months View - Charts */}
      {isAllMonths && hasSales && (
        <>
          {/* Line Graph for Points across months */}
          {monthlyPointsData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Points Trend</CardTitle>
                <CardDescription>Points across all months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyPointsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="points" stroke="#FF3F33" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pie Chart for Year Code */}
          {yearCodeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Year Code Distribution</CardTitle>
                <CardDescription>Sales distribution by year code</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={yearCodeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {yearCodeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value} />
                    <Legend formatter={(value, entry: any) => `${value} ${((entry.payload.value / yearCodeData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)) * 100).toFixed(0)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sales Details Table with Pie Chart for Specific Month */}
      {!loading && hasSales && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sales Details</CardTitle>
                <CardDescription>
                  {isAllMonths 
                    ? `All months data for ${year}` 
                    : `${months[parseInt(month) - 1]} ${year}`
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Show Pie Chart for specific month */}
            {!isAllMonths && salesData.length > 0 && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-center mb-4">Sales by Year Code</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={salesData.map((item:any)=>({ name: item.yearCode, value: Number(item.totals?.salesAmount||item.salesAmount||0) }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(salesData as any[]).map((_, index:number)=>(
                          <Cell key={`cell-s-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value)=>formatCurrency(value as number)} />
                      <Legend formatter={(value, entry: any) => `${value} ${((entry.payload.value / salesData.reduce((sum: number, item: any) => sum + Number(item.totals?.salesAmount || item.salesAmount || 0), 0)) * 100).toFixed(0)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* View More Button */}
                <div className="flex justify-center mt-4 mb-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDetails(!showDetails)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
                  >
                    {showDetails ? (
                      <span className="flex items-center gap-2">
                        Hide Details{" "}
                        <ChevronsDown className="w-4 h-4 rotate-180 transition-transform" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        View Full Details{" "}
                        <ChevronsDown className="w-4 h-4 animate-bounce" />
                      </span>
                    )}
                  </motion.button>
                </div>
              </>
            )}
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-x-auto"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year Code</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Sales Amount</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(isAllMonths ? yearCodeData : salesData).map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.yearCode || item.name || 'N/A'}
                          </TableCell>
                          <TableCell>{Number(item.totals?.qtySold || item.qtySold || item.value || 0)}</TableCell>
                          <TableCell>{formatCurrency(Number(item.totals?.salesAmount || item.salesAmount || 0))}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(Number(item.totals?.profit || item.profit || 0))}
                          </TableCell>
                          <TableCell>{Number(item.totals?.per || item.per || 0).toFixed(2)}%</TableCell>
                          <TableCell className="font-medium">{Number(item.totals?.points || item.points || 0).toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* No Data Found Message */}
      {!loading && !hasSales && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-medium">No sales data found</p>
            <p className="text-sm text-gray-400 mt-2">
              No sales data available for this staff member.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

