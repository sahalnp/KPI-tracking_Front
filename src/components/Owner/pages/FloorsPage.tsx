import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

const mockFloors = [
  { id: 1, name: 'Floor 1', description: 'Books, Supplies, Food', kpiCount: 6 },
  { id: 2, name: 'Floor 2', description: 'Electronics, Clothing, Sports', kpiCount: 6 },
  { id: 3, name: 'Floor 3', description: 'Stationery, Accessories', kpiCount: 6 },
];

export default function FloorsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Floor Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Floor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockFloors.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{f.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{f.kpiCount} KPIs</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}