import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

interface Salesperson {
  id: number;
  name: string;
  section: string;
  onLeave: boolean;
}

interface KPIScores {
  [key: number]: {
    itemShortage: number[];
    sectionClean: number[];
    productDisplay: number[];
    phoneUsage: number[];
    customerService: number[];
    punctuality: number[];
  };
}

const kpiLabels = [
  { key: 'itemShortage', label: 'Item Shortage' },
  { key: 'sectionClean', label: 'Section Clean' },
  { key: 'productDisplay', label: 'Product Display' },
  { key: 'phoneUsage', label: 'Phone Usage' },
  { key: 'customerService', label: 'Customer Service' },
  { key: 'punctuality', label: 'Punctuality' }
];

const mockSalespersons: Salesperson[] = [
  { id: 1, name: 'John Smith', section: 'Electronics', onLeave: false },
  { id: 2, name: 'Sarah Johnson', section: 'Books', onLeave: false },
  { id: 3, name: 'Mike Davis', section: 'Clothing', onLeave: true },
  { id: 4, name: 'Lisa Wilson', section: 'Supplies', onLeave: false }
];

export function ManagerScreen() {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<KPIScores>({});
  const [touchedSliders, setTouchedSliders] = useState<Set<string>>(new Set());

  const updateScore = (personId: number, kpi: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        [kpi]: value
      }
    }));
    setTouchedSliders(prev => new Set(prev).add(`${personId}-${kpi}`));
  };

  const getRequiredSliders = () => {
    return mockSalespersons.filter(p => !p.onLeave).length * kpiLabels.length;
  };

  const isAllSlidersCompleted = () => {
    return touchedSliders.size >= getRequiredSliders();
  };

  const handleSubmit = () => {
    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      setLoading(false);
      alert('Scores submitted successfully!');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="mb-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <h1 className="text-xl" style={{ color: '#311b92' }}>Score Today</h1>
        <p className="text-sm text-muted-foreground">Rate your team's performance</p>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {mockSalespersons.map((person) => (
            <Card key={person.id} className={person.onLeave ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{person.name}</CardTitle>
                  {person.onLeave && (
                    <Badge variant="destructive">On Leave</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{person.section}</p>
              </CardHeader>
              
              {!person.onLeave && (
                <CardContent className="space-y-4">
                  {kpiLabels.map((kpi) => (
                    <div key={kpi.key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm">{kpi.label}</label>
                        <span className="text-sm font-medium">
                          {scores[person.id]?.[kpi.key as keyof typeof scores[number]]?.[0] ?? 5}
                        </span>
                      </div>
                      <Slider
                        value={scores[person.id]?.[kpi.key as keyof typeof scores[number]] ?? [5]}
                        onValueChange={(value) => updateScore(person.id, kpi.key, value)}
                        max={10}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 bg-white border-t p-4">
        <Button
          onClick={handleSubmit}
          disabled={!isAllSlidersCompleted()}
          className="w-full"
          style={{
            backgroundColor: isAllSlidersCompleted() ? '#22c55e' : '#9ca3af'
          }}
        >
          Submit Scores ({touchedSliders.size}/{getRequiredSliders()})
        </Button>
      </div>
    </div>
  );
}


