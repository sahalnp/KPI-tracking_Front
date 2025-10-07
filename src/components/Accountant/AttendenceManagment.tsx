import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Calendar, Search, Users, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/api/axios";

const months = [
    { value: "2025-01", label: "January 2025" },
    { value: "2025-02", label: "February 2025" },
    { value: "2025-03", label: "March 2025" },
    { value: "2025-04", label: "April 2025" },
    { value: "2025-05", label: "May 2025" },
    { value: "2025-06", label: "June 2025" },
    { value: "2025-07", label: "July 2025" },
    { value: "2025-08", label: "August 2025" },
    { value: "2025-09", label: "September 2025" },
    { value: "2025-10", label: "October 2025" },
    { value: "2025-11", label: "November 2025" },
    { value: "2025-12", label: "December 2025" },
];

export function AttendanceManagement() {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [staffResults, setStaffResults] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Search staff from backend
    useEffect(() => {
        const searchStaff = async () => {
            if (!searchTerm.trim()) {
                setStaffResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await axiosInstance.get(
                    "/accountant/getstaff",
                    {
                        params: { search: searchTerm },
                    }
                );
                setStaffResults(response.data.staff || []);
            } catch (error) {
                console.error("Error searching staff:", error);
                toast.error("Failed to search staff");
                setStaffResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(searchStaff, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    // Add staff to attendance list
    const addStaffToAttendance = (staff: any) => {
        const exists = attendanceData.find((a) => a.id === staff.id);
        if (exists) {
            toast.error("Staff member already added to attendance list");
            return;
        }

        const newAttendance: any = {
            ...staff,
            fullDays: 0,
            halfDays: 0,
            leaveCount: 0,
        };

        setAttendanceData((prev) => [...prev, newAttendance]);
        setSearchTerm("");
        setHasUnsavedChanges(true);
        toast.success(`Added ${staff.name} to attendance list`);
    };

    // Update attendance data
    const updateAttendanceData = (
        staffId: string,
        updates: Partial<Pick<any, "fullDays" | "halfDays" | "leaveCount">>
    ) => {
        setAttendanceData((prev) =>
            prev.map((staff) =>
                staff.id === staffId ? { ...staff, ...updates } : staff
            )
        );
        setHasUnsavedChanges(true);
    };

    // Remove staff from attendance list
    const removeStaffFromAttendance = (staffId: string) => {
        setAttendanceData((prev) =>
            prev.filter((staff) => staff.id !== staffId)
        );
        setHasUnsavedChanges(true);
    };

    // Cancel changes
    const cancelChanges = () => {
        setAttendanceData([]);
        setHasUnsavedChanges(false);
        setSelectedMonth("");
        toast.info("Changes cancelled");
    };

    // Save attendance data
    const saveAttendanceData = async () => {
        if (!selectedMonth) {
            toast.error("Please select month first");
            return;
        }

        if (attendanceData.length === 0) {
            toast.error("Please add at least one staff member");
            return;
        }

        setIsSaving(true);
        try {
            const attendancePayload = attendanceData.map((staff) => ({
                staffId: staff.id,
                name: staff.name,
                uniqueId: staff.uniqueId,
                fullDays: staff.fullDays,
                halfDays: staff.halfDays,
                leaveCount: staff.leaveCount,
                totalDays: staff.fullDays + staff.halfDays * 0.5,
            }));
await axiosInstance.post("/accountant/attendance", {
  month: selectedMonth,
  attendanceList: attendancePayload,
});

// Get existing activities from localStorage
const existingActivities = JSON.parse(
  localStorage.getItem("recentActivity") || "[]"
);

// Create new activity objects
const newActivities = attendanceData.map((staff) => ({
  title: `Added attendance for ${staff.name}`,
  time: new Date().toLocaleString(),
  status: "success",
}));

// Merge with existing activities and keep only last 5
const updatedActivities = [...newActivities, ...existingActivities].slice(0, 5);

// Save back to localStorage
localStorage.setItem("recentActivity", JSON.stringify(updatedActivities));

            setHasUnsavedChanges(false);
            toast.success("Attendance data saved successfully");
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error("Failed to save attendance data");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Attendance Management
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Manage staff attendance records by month
                </p>
            </motion.div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Select Period
                    </CardTitle>
                    <CardDescription>
                        Choose the month to manage attendance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <Select
                                value={selectedMonth}
                                onValueChange={setSelectedMonth}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month) => (
                                        <SelectItem
                                            key={month.value}
                                            value={month.value}
                                        >
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedMonth && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Add Staff to Attendance
                        </CardTitle>
                        <CardDescription>
                            Search and click on staff member to add
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Search Staff</Label>
                                <Input
                                    placeholder="Type staff name to search..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>

                            {searchTerm.trim() && (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                        </div>
                                    ) : staffResults.length > 0 ? (
                                        staffResults.map((staff) => (
                                            <motion.div
                                                key={staff.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    attendanceData.some(
                                                        (a) => a.id === staff.id
                                                    )
                                                        ? "bg-gray-100 cursor-not-allowed opacity-50"
                                                        : "hover:bg-blue-50 hover:border-blue-300"
                                                }`}
                                                onClick={() =>
                                                    !attendanceData.some(
                                                        (a) => a.id === staff.id
                                                    ) &&
                                                    addStaffToAttendance(staff)
                                                }
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {staff.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {staff.uniqueId} •{" "}
                                                        {staff.section}
                                                    </p>
                                                </div>
                                                {attendanceData.some(
                                                    (a) => a.id === staff.id
                                                ) && (
                                                    <Badge variant="secondary">
                                                        Added
                                                    </Badge>
                                                )}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">
                                            No staff found matching your search
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Attendance Records
                    </CardTitle>
                    <CardDescription>
                        Edit attendance directly in each card
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {attendanceData.length > 0 ? (
                        <div className="space-y-4">
                            {attendanceData.map((staff, index) => (
                                <motion.div
                                    key={`inline-${staff.id}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {staff.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {staff.uniqueId} •{" "}
                                                {staff.section}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                removeStaffFromAttendance(
                                                    staff.id
                                                )
                                            }
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-1">
                                                Full Days Present
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={staff.fullDays ?? ""}
                                                onChange={(e) =>
                                                    updateAttendanceData(
                                                        staff.id,
                                                        {
                                                            fullDays:
                                                                e.target.value, // keep raw string
                                                        }
                                                    )
                                                }
                                                className="focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-1">
                                                Half Days
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={staff.halfDays ?? ""}
                                                onChange={(e) =>
                                                    updateAttendanceData(
                                                        staff.id,
                                                        {
                                                            halfDays:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                className="focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-1">
                                                Leaves
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={staff.leaveCount ?? ""}
                                                onChange={(e) =>
                                                    updateAttendanceData(
                                                        staff.id,
                                                        {
                                                            leaveCount:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                className="focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            Total Days:{" "}
                                            <span className="font-medium text-gray-900">
                                                {Number(staff.fullDays || 0) +
                                                    Number(
                                                        staff.halfDays || 0
                                                    ) *
                                                        0.5 +
                                                    Number(
                                                        staff.leaveCount || 0
                                                    )}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                No staff members added
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fixed Bottom Action Bar */}
            {hasUnsavedChanges && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50"
                >
                    <div className="container mx-auto max-w-7xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-sm text-gray-600">
                                You have unsaved changes
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={cancelChanges}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={saveAttendanceData}
                                disabled={isSaving}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Attendance
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
