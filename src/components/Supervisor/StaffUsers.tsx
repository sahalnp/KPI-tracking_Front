
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Save,
  X,
  Phone,
  User,
  Trash2,
  List,
  Grid,
  MapPin,
  Building2,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  ChevronDown,
} from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { logoutSupervisor } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { LoadingSpinner } from "../ui/spinner";




/* ---------- COMPONENT ---------- */
export function StaffManagementNew() {
  const dispatch = useDispatch();

  /* ---------- STATE ---------- */
  const [staff, setStaff] = useState<any[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [showFilters, setShowFilters] = useState(false);
  const [openScores, setOpenScores] = useState(false);
const [selectedStaffScores, setSelectedStaffScores] = useState<any[]>([]);
const [selectedStaffName, setSelectedStaffName] = useState("");


  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [loading,setLoading]=useState(false)

  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const [form, setForm] = useState<any>({
    name: "",
    mobile: "",
    section: "",
    uniqueId:""
  });

  /* ---------- DERIVED ---------- */
  const filtered = staff.filter((m) => {
    const okSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.section && m.section.toLowerCase().includes(searchTerm.toLowerCase()));
    const okSection = filterSection === "all" || m.section === filterSection;
    const okStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && m.active_flag) ||
      (filterStatus === "inactive" && !m.active_flag);
    return okSearch && okSection && okStatus;
  });

  /* ---------- API ---------- */
  useEffect(() => {

    (async () => {
          setLoading(true)
      try {
        const { data } = await axiosInstance.get("/supervisor/getUsers");
        setStaff(data.users.users || []);
    
        setSections(data.users.sections || []);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("accesstoken");
          localStorage.removeItem("refreshtoken");
          await logoutSupervisor();
          dispatch(clearUser());
          toast.error("Session expired");
        } else toast.error("Failed to load staff");
      }
       setLoading(false)
    })();
   
  }, [dispatch]);

  /* ---------- HANDLERS ---------- */
  const resetForm = () =>
    setForm({
      name: "",
      mobile: "",
      section: "",
      uniqueId:""
    });

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setOpenAdd(true);
  };
  const handleShowScores = (staffMember: any) => {
  if (!staffMember.scores || staffMember.scores.length === 0) {
    toast.info("No scores available for this staff");
    return;
  }
  setSelectedStaffScores(staffMember.scores);
  setSelectedStaffName(staffMember.name);
  setOpenScores(true);
};


  const handleEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name,
      mobile: m.mobile,
      section: m.section || "",
      uniqueId:m.uniqueId
    });
    setOpenEdit(true);
  };

  const handleDelete = (m: any) => {
    setDeleting(m);
    setOpenDelete(true);
  };

  const handleCancel = () => {
    setOpenAdd(false);
    setOpenEdit(false);
    resetForm();
    setEditing(null);
  };

  const saveStaff = async () => {
    if (!form.name || !form.mobile) {
      toast.error("Please fill required fields");
      return;
    }
    if (!form.uniqueId) {
  toast.error("Unique ID is required");
  return;
}

      if (form.mobile.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
      return 
    }

    try {
      if (editing) {
        const { data } = await axiosInstance.put(`/supervisor/editUser/${editing.id}`, form);
       if (data.success) {
          setStaff((prev) => prev.map((s) => (s.id === editing.id ? data.editUser : s)));
          toast.success("Updated");
        }
      } else {
        const { data } = await axiosInstance.post("/supervisor/addUser", form);
        if (data.success) {
          setStaff((prev) => [data.addUser, ...prev]);
          toast.success("Added");
        }
      }
      setOpenAdd(false);
      setOpenEdit(false);
      resetForm();
      setEditing(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        await logoutSupervisor();
        dispatch(clearUser());
        toast.error("Session expired");
      } else toast.error(err.response?.data?.message || "Request failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await axiosInstance.delete(`/supervisor/deleteUser/${deleting.id}`);
      setStaff((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success("Deleted");
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        await logoutSupervisor();
        dispatch(clearUser());
        toast.error("Session expired");
      } else toast.error("Delete failed");
    } finally {
      setOpenDelete(false);
      setDeleting(null);
    }
  };

  const toggleStatus = async (id: string, newStatus: boolean) => {
    try {
      await axiosInstance.patch(`/supervisor/toggleStaff/${id}`, { active_flag: newStatus });
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active_flag: newStatus } : s)));
      toast.success("Status changed");
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        await logoutSupervisor();
        dispatch(clearUser());
        toast.error("Session expired");
      } else toast.error("Update failed");
    }
  };
 /* ======  loading & error states  ====== */
    if (loading) {
        return <LoadingSpinner />
    }
  /* ---------- RENDER ---------- */
  return (
    <div className="space-y-6 pb-20">
      {/* header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-gray-900">Staff Management</h1>
          <Button onClick={handleAdd} className="hidden sm:flex bg-[#FF3F33] hover:bg-[#E6362A]">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
        <p className="text-sm text-gray-600">Manage your team members and their information</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Staff</p>
            <p className="text-2xl font-bold text-[#FF3F33]">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{staff.filter((s) => s.active_flag).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{staff.filter((s) => !s.active_flag).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
                     <Button
                         variant={viewMode === "card" ? "default" : "outline"}
                         size="sm"
                         onClick={() => setViewMode("card")}
                         className={
                             viewMode === "card"
                                 ? "bg-[#FF3F33] hover:bg-[#E6362A] flex-1"
                                 : "flex-1"
                         }
                     >
                         <Grid className="h-4 w-4 mr-2" />
                         Cards
                     </Button>
                     <Button
                         variant={viewMode === "list" ? "default" : "outline"}
                         size="sm"
                         onClick={() => setViewMode("list")}
                         className={
                             viewMode === "list"
                                 ? "bg-[#FF3F33] hover:bg-[#E6362A] flex-1"
                                 : "flex-1"
                         }
                     >
                         <List className="h-4 w-4 mr-2" />
                         List
                     </Button>
                 </div>
     
                 {/* Filters Card */}
                <div className="px-4 mb-6 mt-6">  {/* Added mt-6 for gap */}
         <Card>
             <CardContent className="p-6">
                 <div className="flex flex-col lg:flex-row gap-4">
                     <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                         <Input
                             placeholder="Search by name,section."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="pl-10"
                         />
                     </div>
                     <Button
                         variant="outline"
                         onClick={() => setShowFilters(!showFilters)}
                         className="lg:w-auto"
                     >
                         <Filter className="h-4 w-4 mr-2" />
                         Filters
                     </Button>
                 </div>
     
                             {showFilters && (
                                 <motion.div
                                     initial={{ opacity: 0, height: 0 }}
                                     animate={{ opacity: 1, height: "auto" }}
                                     exit={{ opacity: 0, height: 0 }}
                                     className="mt-4 flex flex-col sm:flex-row gap-4"
                                 >
                                     <Select
                                         value={filterSection}
                                         onValueChange={setFilterSection}
                                     >
                                         <SelectTrigger className="flex-1">
                                             <SelectValue placeholder="All Section" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="all">
                                                 All Section
                                             </SelectItem>
                                             {sections.map((d) => (
                                                 <SelectItem key={d} value={d}>
                                                     {d}
                                                 </SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                     <Select
                                         value={filterStatus}
                                         onValueChange={(
                                             v: "all" | "active" | "inactive"
                                         ) => setFilterStatus(v)}
                                     >
                                         <SelectTrigger className="flex-1">
                                             <SelectValue placeholder="All Status" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="all">
                                                 All Status
                                             </SelectItem>
                                             <SelectItem value="active">
                                                 Active
                                             </SelectItem>
                                             <SelectItem value="inactive">
                                                 Inactive
                                             </SelectItem>
                                         </SelectContent>
                                     </Select>
                                 </motion.div>
                             )}
                         </CardContent>
                     </Card>
                 </div>

      {/* list / cards */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Manage your team members and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  
                  <TableHead>Staff Member</TableHead>
                   <TableHead>ID</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m, idx) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-gray-50"
                  >
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-[#FF3F33] text-white text-sm">
                            {m.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-sm text-gray-500">{m.mobile}</p>
                        </div>
                      </div>
                    </TableCell>
                     <TableCell>{m.uniqueId}</TableCell>
                    <TableCell>{m.section || "N/A"}</TableCell>
                    <TableCell>{m.mobile}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={m.active_flag}
                          onCheckedChange={(c) => toggleStatus(m.id, c)}
                          className="data-[state=checked]:bg-[#FF3F33]"
                        />
                        <span className={`text-sm ${m.active_flag ? "text-[#FF3F33]" : "text-gray-500"}`}>
                          {m.active_flag ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(m)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(m)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m, idx) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#FF3F33] text-white">
                              {m.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{m.name}</p>
                          </div>
                        </div>
                        <Switch
                          checked={m.active_flag}
                          onCheckedChange={(c) => toggleStatus(m.id, c)}
                          className="data-[state=checked]:bg-[#FF3F33]"
                        />
                      </div>
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
    <Hash className="h-4 w-4 text-gray-400" />
    <span>ID: {m.uniqueId}</span> 
  </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>Section:{m.section || "No section assigned"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>Contact:{m.mobile}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
  variant="outline"
  size="sm"
  onClick={() => handleShowScores(m)}
  className="text-blue-600 hover:bg-blue-50 flex items-center gap-1"
>
  Show Scores
  <ChevronDown className="h-4 w-4" />
</Button>

                        <Button variant="outline" size="sm" onClick={() => handleEdit(m)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(m)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">No staff members found</div>
          )}
        </CardContent>
      </Card>

      {/* Floating Add Button */}
      <button
        onClick={handleAdd}
        className="fixed bottom-20 right-6 bg-[#FF3F33] text-white p-4 rounded-full shadow-lg hover:bg-[#E6362A] transition-colors sm:hidden z-20"
      >
        <Plus size={24} />
      </button>

      {/* Add / Edit modal */}
      <AnimatePresence>
        {(openAdd || openEdit) && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editing ? "Edit Staff" : "Add Staff"}
                </h2>
                <button onClick={handleCancel}>
                  <X size={20} className="text-gray-500 hover:text-gray-800" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
  <Label>Unique ID</Label>
  <Input
    type="text"
    placeholder="Enter unique ID"
    value={form.uniqueId}
    onChange={(e) => setForm({ ...form, uniqueId: e.target.value })}
  />
</div>

                  <div>
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="pl-10"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                <div>
  <Label>Mobile *</Label>
  <div className="relative">
    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input
      type="tel"
      value={form.mobile}
      onChange={(e) => {
        const value = e.target.value.replace(/\D/g, ""); 
        if (value.length <= 10) setForm({ ...form, mobile: value });
      }}
      className="pl-10"
      placeholder="Mobile number"
    />
  </div>
</div>

              <div>
  <Label>Section</Label>
  <Input
    type="text"
    placeholder="Enter section"
    value={form.section}
    onChange={(e) => setForm({ ...form, section: e.target.value })}
  />
</div>

                
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveStaff}
                    className="flex-1 bg-[#FF3F33] text-white rounded-lg py-2 hover:bg-[#E6362A]"
                  >
                    {editing ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {openDelete && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenDelete(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg w-full max-w-sm"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Confirm Delete
                </h2>
                <p className="text-sm text-gray-600 mb-5">
                  Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenDelete(false)}
                    className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
  {openScores && (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setOpenScores(false)}
    >
      <motion.div
        className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 overflow-y-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedStaffName}'s KPIs
          </h2>
          <button onClick={() => setOpenScores(false)}>
            <X size={20} className="text-gray-500 hover:text-gray-800" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
          {selectedStaffScores.map((score, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  score.trend === "up"
                    ? "bg-green-500"
                    : score.trend === "down"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm mt-2 font-medium text-gray-800 text-center">
                {score.kpi.name}
              </span>
              <span
                className={`text-xs ${
                  score.trend === "up"
                    ? "text-green-600"
                    : score.trend === "down"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {score.trend === "up"
                  ? "↑ Up"
                  : score.trend === "down"
                  ? "↓ Down"
                  : "→ Stable"}
              </span>
            </div>
          ))}
        </div>

        {/* Scores Section */}
        <div className="space-y-6">
          {selectedStaffScores.map((score, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  KPI: {score.kpi.name}
                </h3>
                <span className="text-[#FF3F33] font-bold text-lg">
                  {score.points}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-[#FF3F33] h-2 rounded-full"
                  style={{ width: `${(score.points / 5) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 italic">
                “{score.comment || "No comment provided"}”
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


    </div>
  );
}