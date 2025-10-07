import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, AlertTriangle, CheckCircle } from 'lucide-react';

const mockLeaveRequests = [
  { id: 1, employee: 'Amy Lee',    type: 'Sick Leave', dates: 'Mar 15-16', status: 'pending',  days: 2 },
  { id: 2, employee: 'David Chen', type: 'Vacation',   dates: 'Mar 20-25', status: 'pending',  days: 5 },
  { id: 3, employee: 'Emma Davis', type: 'Personal',   dates: 'Mar 18',    status: 'approved', days: 1 },
  { id: 4, employee: 'James Wilson',type:'Sick Leave', dates: 'Mar 12',    status: 'rejected', days: 1 },
];

export default function LeavesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Leave Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-500">{mockLeaveRequests.filter((r) => r.status === 'pending').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-500">{mockLeaveRequests.filter((r) => r.status === 'approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-500">{mockLeaveRequests.filter((r) => r.status === 'rejected').length}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeaveRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employee}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.dates}</TableCell>
                  <TableCell>{r.days}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}