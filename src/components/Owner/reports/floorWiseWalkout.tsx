import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, UserX, Tag, AlertTriangle, Users, Building } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Summary Card Component (matching Owner Dashboard style)
const SummaryCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="h-full">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-xl font-bold">{typeof value === "number" ? formatNumberShort(value) : value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-600">{subtitle}</p>
                    )}
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </CardContent>
    </Card>
);

// Format big numbers (500000 → 500K, 1200000 → 1.2M)
const formatNumberShort = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
};

interface WalkoutData {
    id: string;
    staffId: string;
    staffName: string;
    itemName: string | { name: string };
    type: string | { name: string };
    priority: 'High' | 'Medium' | 'Low';
    description: string;
    created_at: string;
    staff?: {
        id: string;
        name: string;
        uniqueId: string;
        role: string;
        section: string;
        floor?: { name: string };
    };
    submittedBy?: {
        id: string;
        name: string;
        uniqueId: string;
    };
}

interface TypeAnalysis {
    type: string;
    count: number;
    percentage: number;
}

export const FloorWiseWalkout: React.FC = () => {
    const [searchParams] = useSearchParams();
    const floorName = searchParams.get('floor') || '';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const [walkoutData, setWalkoutData] = useState<WalkoutData[]>([]);
    const [typeAnalysis, setTypeAnalysis] = useState<TypeAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [floorId, setFloorId] = useState<number | null>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Debug logging
    console.log("=== MONTH STATE ===");
    console.log("month from URL:", month);
    console.log("year from URL:", year);
    console.log("startDate:", startDate);
    console.log("endDate:", endDate);
    console.log("===================");
    
    console.log('FloorWiseWalkout - URL params:', {
        floor: floorName,
        startDate,
        endDate,
        month,
        year,
        fullURL: window.location.href
    });
    
    // If no date parameters, use current month as default
    const effectiveStartDate = startDate || (() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    })();
    
    const effectiveEndDate = endDate || (() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lastDay.toISOString().split('T')[0];
    })();
    
    console.log('FloorWiseWalkout - Effective dates:', {
        effectiveStartDate,
        effectiveEndDate
    });

    // First, fetch floor ID from floor name
    useEffect(() => {
        const fetchFloorId = async () => {
            if (!floorName) {
                setError("Floor parameter is missing from URL");
                return;
            }

            try {
                console.log('🔍 Fetching floor ID for floor name:', floorName);
                const floorsRes = await axiosInstance.get("/owner/getFloors");
                console.log('📋 Floors received:', floorsRes.data.floors);
                
                const floors = floorsRes.data.floors || [];
                const foundFloor = floors.find((f: any) => f.name === floorName);
                
                if (foundFloor) {
                    console.log('✅ Found floor ID:', foundFloor.id, 'for floor:', floorName);
                    setFloorId(foundFloor.id);
                } else {
                    console.error('❌ Floor not found:', floorName);
                    setError(`Floor "${floorName}" not found`);
                }
            } catch (err: any) {
                console.error("Error fetching floors:", err);
                setError("Failed to fetch floor information");
            }
        };

        fetchFloorId();
    }, [floorName]);

    useEffect(() => {
        const fetchFloorWalkoutData = async () => {
            // Don't fetch if floorName is empty or floorId is not set
            if (!floorName || !floorId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Debug: check if we have date parameters
                console.log('📅 Date parameters check:', {
                    startDate,
                    endDate,
                    month,
                    year,
                    effectiveStartDate,
                    effectiveEndDate
                });
                
                const isAllMonths = month === 'all' || (!startDate && !endDate);

                let endpoint = "/owner/floor-walkout-analysis";
                let params: any;
                if (isAllMonths) {
                    endpoint = "/owner/all-months-floor-walkout-analysis";
                    params = { floor: floorId, year: year || new Date().getFullYear() };
                } else {
                    // Send startDate, endDate, month, and year to backend
                    // Backend will prioritize startDate/endDate over month/year
                    params = { 
                        floor: floorId,
                        startDate: startDate || undefined,
                        endDate: endDate || undefined,
                        month: month ? parseInt(month) : undefined,
                        year: year ? parseInt(year) : undefined
                    };
                }
                
                console.log('📊 Sending params to backend:', params);

                console.log('🔍 Fetching floor walkout data with params:', {
                    endpoint,
                    params,
                    floorName,
                    floorId
                });

                const res = await axiosInstance.get(endpoint, { params });
                
                console.log('✅ Walkout data received:', {
                    success: res.data.success,
                    walkoutCount: res.data.walkouts?.length || 0,
                    typeAnalysisCount: res.data.typeAnalysis?.length || 0
                });
                
                if (res.data.success) {
                    setWalkoutData(res.data.walkouts || []);
                    setTypeAnalysis(res.data.typeAnalysis || []);
                } else {
                    setError(res.data.error || "Failed to fetch floor walkout data");
                    toast.error(res.data.error || "Failed to fetch floor walkout data");
                }
            } catch (err: any) {
                console.error("Floor walkout data error:", err);
                if (err.response?.status === 401) {
                    const response: any = await logoutOwner();
                    if (response.success) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        dispatch(clearUser());
                    }
                } else {
                    setError("Failed to fetch floor walkout data. Please try again later.");
                    toast.error(err.response?.data?.error || "Failed to fetch floor walkout data");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchFloorWalkoutData();
    }, [floorId, startDate, endDate, month, year, floorName, dispatch, effectiveStartDate, effectiveEndDate]);

    const goBack = () => {
        navigate(-1);
    };

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="space-y-6 p-4">
                <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Error Loading Floor Data
                        </h3>
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
        );
    }

    return (
        <div className="space-y-6 p-6">
        

            {/* Donut Chart for Item Types */}
            {typeAnalysis.length > 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Walkouts by Type - {floorName} Floor</h3>
                        </div>
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={typeAnalysis}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ type, percentage }) => `${type} (${percentage}%)`}
                                        outerRadius={120}
                                        innerRadius={60}
                                        fill="#8884d8"
                                        dataKey="count"
                                        className="cursor-pointer"
                                    >
                                        {typeAnalysis.map((entry, index) => {
                                            const colors = ['#FF3F33', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899'];
                                            return (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={colors[index] || '#6B7280'} 
                                                />
                                            );
                                        })}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, 'Walkouts']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Type Indicators (Non-clickable) */}
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                            {typeAnalysis.map((entry, index) => {
                                const colors = ['#FF3F33', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899'];
                                const color = colors[index] || '#6B7280';
                                
                                return (
                                    <div
                                        key={entry.type}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        <div 
                                            className="w-4 h-4 rounded-full" 
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            {entry.type}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({entry.count})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <Tag className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        No item type data found for {floorName}.
                    </CardContent>
                </Card>
            )}

            {/* View More Button */}
            <div className="flex justify-center">
                <motion.button
                    onClick={toggleDetails}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FF3F33] text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                >
                    <Eye className="h-4 w-4" />
                    {showDetails ? 'Hide Details' : 'View More'}
                </motion.button>
            </div>

            {/* Details Table */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserX className="h-5 w-5" />
                                    Walkout Details - {floorName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {walkoutData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <UserX className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        No walkout data found for {floorName}.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Name</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff ID</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted By</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {walkoutData.map((walkout, index) => (
                                                    <motion.tr
                                                        key={walkout.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="border-b border-gray-100 hover:bg-gray-50"
                                                    >
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <Tag className="h-4 w-4 text-gray-400" />
                                                                <span className="font-medium text-gray-900">
                                                                    {typeof walkout.itemName === "object" 
                                                                        ? walkout.itemName.name 
                                                                        : walkout.itemName}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-4 w-4 text-gray-400" />
                                                                <span className="text-gray-700">
                                                                    {walkout.staff?.uniqueId || walkout.staffId}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(walkout.priority)}`}
                                                            >
                                                                {walkout.priority}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <UserX className="h-4 w-4 text-gray-400" />
                                                                <span className="text-gray-700">
                                                                    {walkout.submittedBy?.name || 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            {new Date(walkout.created_at).toLocaleDateString()}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
