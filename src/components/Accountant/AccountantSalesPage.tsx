


import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Calendar, Users, TrendingUp, DollarSign, Package, Award, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { axiosInstance } from '@/api/axios'
import { LoadingSpinner } from '../ui/spinner'

export function SalesReports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [allSalesData, setAllSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Generate year options from 2020 to current year
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= 2020; year--) {
      years.push(year.toString())
    }
    return years
  }

  // Generate month options
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  // Fetch sales data from backend
  const fetchSalesData = async () => {
    if (!selectedYear) {
      toast.error('Please select a year')
      return
    }

    setLoading(true)
    try {
      const response = await axiosInstance.get('/accountant/sales-reports', {
        params: { 
          year: selectedYear, 
          month: selectedMonth === 'all' ? undefined : selectedMonth 
        }
      })
      console.log(response.data.value, "Sales data received")
      
      setAllSalesData(response.data.value)
    } catch (error) {
      console.error('Error fetching sales data:', error)
      toast.error('Failed to load sales data')
      setAllSalesData(null)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when year or month changes
  useEffect(() => {
    if (selectedYear) {
      fetchSalesData()
    }
  }, [selectedYear, selectedMonth])

  // Function to get rank color based on position
  const getRankColor = (rank: number, total: number) => {
    const intensity = 1 - ((rank - 1) / Math.max(total - 1, 1))
    const red = Math.round(220 + (35 * (1 - intensity)))
    const green = Math.round(53 * (1 - intensity))
    const blue = Math.round(69 * (1 - intensity))
    return `rgb(${red}, ${green}, ${blue})`
  }

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  // Format number
  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numValue)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-gray-900">
            Sales Reports
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          View detailed sales performance data for staff members by month and year
        </p>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Period
          </CardTitle>
          <CardDescription>Choose year and month to view sales reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Select 
                value={selectedMonth} 
                onValueChange={setSelectedMonth}
                disabled={!selectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics - 2x2 Grid */}
      {!loading && allSalesData && allSalesData.staffRanking?.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-semibold">{allSalesData.totalSales || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-xl font-semibold">{formatCurrency(allSalesData.totalProfit || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qty Sold</p>
                  <p className="text-xl font-semibold">{formatNumber(allSalesData.totalQtySold || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-xl font-semibold">
                    {formatNumber(
                      allSalesData.staffRanking.reduce((sum: number, staff: any) => 
                        sum + parseFloat(staff.totalPoints || 0), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Data Table */}
      {!loading && allSalesData && allSalesData.staffRanking?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sales Performance by User
                </CardTitle>
                <CardDescription>
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear} • {allSalesData.staffRanking.length} users
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSalesData.staffRanking.map((user: any, index: number) => (
                    <TableRow key={user.staffId}>
                      <TableCell>
                        <div 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white"
                          style={{ backgroundColor: getRankColor(index + 1, allSalesData.staffRanking.length) }}
                        >
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {user.staff?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(user.totalQtySold || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(user.totalProfit || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-purple-600">
                        {formatNumber(user.totalPoints || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && selectedYear && (!allSalesData || !allSalesData.staffRanking || allSalesData.staffRanking.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sales Data Found</h3>
            <p className="text-muted-foreground">
              No sales records found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
