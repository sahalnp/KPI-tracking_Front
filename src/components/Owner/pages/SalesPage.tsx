import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Plus, BarChart3 } from 'lucide-react';

const mockSalesData = [
  { month: 'Jan', sales: 145000, lastYear: 132000 },
  { month: 'Feb', sales: 165000, lastYear: 145000 },
  { month: 'Mar', sales: 185420, lastYear: 162000 },
  { month: 'Apr', sales: 175000, lastYear: 168000 },
  { month: 'May', sales: 195000, lastYear: 175000 },
  { month: 'Jun', sales: 210000, lastYear: 185000 },
];
const COLORS = ['#1e40af', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

export default function SalesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Sales Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#1e40af" />
                  <Bar dataKey="lastYear" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Electronics', value: 35 },
                      { name: 'Books', value: 25 },
                      { name: 'Clothing', value: 20 },
                      { name: 'Supplies', value: 15 },
                      { name: 'Food', value: 5 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2, 3, 4].map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sales Records</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Sales records table would go here</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}