
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";          // NOT motion/react
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

export function AttendanceManagement() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [staffResults, setStaffResults] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  /* ---------- 1.  MONTH LIST: only up to current month, no year in label ---------- */
  const months = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();      // 0-11
    const currentYear = now.getFullYear();

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    return monthNames.slice(0, currentMonth + 1).map((name, idx) => ({
      value: `${currentYear}-${String(idx + 1).padStart(2, "0")}`,
      label: name,                 // ← only month name shown in UI
    }));
  }, []);

  /* -------------------------- 2.  SEARCH STAFF -------------------------- */
  useEffect(() => {
    const searchStaff = async () => {
      if (!searchTerm.trim()) {
        setStaffResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await axiosInstance.get("/accountant/getstaff", {
          params: { search: searchTerm },
        });
        setStaffResults(data.staff || []);
      } catch {
        toast.error("Failed to search staff");
        setStaffResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const t = setTimeout(searchStaff, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* -------------------------- 3.  ATTENDANCE LOGIC -------------------------- */
  const addStaffToAttendance = (staff: any) => {
    if (attendanceData.some((a) => a.id === staff.id)) {
      toast.error("Staff member already added");
      return;
    }
    setAttendanceData((p) => [
      ...p,
      { ...staff, fullDays: 0, halfDays: 0, leaveCount: 0 },
    ]);
    setSearchTerm("");
    setHasUnsavedChanges(true);
    toast.success(`Added ${staff.name}`);
  };

  const updateAttendanceData = (
    staffId: string,
    updates: Partial<{ fullDays: string; halfDays: string; leaveCount: string }>
  ) => {
    setAttendanceData((p) =>
      p.map((s) => (s.id === staffId ? { ...s, ...updates } : s))
    );
    setHasUnsavedChanges(true);
  };

  const removeStaffFromAttendance = (staffId: string) => {
    setAttendanceData((p) => p.filter((s) => s.id !== staffId));
    setHasUnsavedChanges(true);
  };

  const cancelChanges = () => {
    setAttendanceData([]);
    setHasUnsavedChanges(false);
    setSelectedMonth("");
    toast.info("Changes cancelled");
  };

  const saveAttendanceData = async () => {
    if (!selectedMonth) return toast.error("Select a month");
    if (attendanceData.length === 0) return toast.error("Add at least one staff");

    setIsSaving(true);
    try {
      const payload = attendanceData.map((s) => ({
        staffId: s.id,
        name: s.name,
        uniqueId: s.uniqueId,
        fullDays: Number(s.fullDays || 0),
        halfDays: Number(s.halfDays || 0),
        leaveCount: Number(s.leaveCount || 0),
        totalDays: Number(s.fullDays || 0) + Number(s.halfDays || 0) * 0.5,
      }));

      await axiosInstance.post("/accountant/attendance", {
        month: selectedMonth,
        attendanceList: payload,
      });

      // recent activity (localStorage)
      const existing = JSON.parse(localStorage.getItem("recentActivity") || "[]");
      const newest = attendanceData.map((s) => ({
        title: `Added attendance for ${s.name}`,
        time: new Date().toLocaleString(),
        status: "success",
      }));
      localStorage.setItem("recentActivity", JSON.stringify([...newest, ...existing].slice(0, 5)));

      // Reset all states after successful save
setAttendanceData([]);
setSelectedMonth("");
setSearchTerm("");
setHasUnsavedChanges(false);
toast.success("Attendance saved and form reset");

    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );

  /* -------------------------------- RENDER -------------------------------- */
  return (
    <div className="space-y-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-gray-900">Attendance Management</h1>
        </div>
        <p className="text-sm text-gray-600">Manage staff attendance records by month</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Select Period
          </CardTitle>
          <CardDescription>Choose the month to manage attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label} {/* only month name */}
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
              <Search className="h-5 w-5" /> Add Staff to Attendance
            </CardTitle>
            <CardDescription>Search and click on staff member to add</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Staff</Label>
                <Input
                  placeholder="Type staff name to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchTerm.trim() && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : staffResults.length ? (
                    staffResults.map((staff) => (
                      <motion.div
                        key={staff.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          attendanceData.some((a) => a.id === staff.id)
                            ? "bg-gray-100 cursor-not-allowed opacity-50"
                            : "hover:bg-blue-50 hover:border-blue-300"
                        }`}
                        onClick={() =>
                          !attendanceData.some((a) => a.id === staff.id) &&
                          addStaffToAttendance(staff)
                        }
                      >
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-gray-600">
                            {staff.uniqueId} • {staff.section}
                          </p>
                        </div>
                        {attendanceData.some((a) => a.id === staff.id) && (
                          <Badge variant="secondary">Added</Badge>
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
            <Users className="h-5 w-5" /> Attendance Records
          </CardTitle>
          <CardDescription>Edit attendance directly in each card</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceData.length ? (
            <div className="space-y-4">
              {attendanceData.map((staff, idx) => (
                <motion.div
                  key={`inline-${staff.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{staff.name}</h3>
                      <p className="text-sm text-gray-500">
                        {staff.uniqueId} • {staff.section}
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => removeStaffFromAttendance(staff.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground text-gray-400 hover:text-red-500 h-9 px-3"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
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
                          updateAttendanceData(staff.id, { fullDays: e.target.value })
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
                          updateAttendanceData(staff.id, { halfDays: e.target.value })
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
                          updateAttendanceData(staff.id, { leaveCount: e.target.value })
                        }
                        className="focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Total Days:{" "}
                      <span className="font-medium text-gray-900">
                        {(
                          Number(staff.fullDays || 0) +
                          Number(staff.halfDays || 0) * 0.5 +
                          Number(staff.leaveCount || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No staff members added</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------ Fixed Bottom Action Bar ------------------------ */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50"
        >
          <div className="container mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">You have unsaved changes</span>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={cancelChanges}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveAttendanceData}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 hover:bg-red-700 text-primary-foreground h-10 px-4 py-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save 
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}