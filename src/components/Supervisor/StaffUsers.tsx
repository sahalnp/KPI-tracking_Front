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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    const [filterStatus, setFilterStatus] = useState<
        "all" | "active" | "inactive"
    >("all");
    const [viewMode, setViewMode] = useState<"list" | "card">("card");
    const [showFilters, setShowFilters] = useState(false);
    const [openScores, setOpenScores] = useState(false);
    const [selectedStaffScores, setSelectedStaffScores] = useState<any[]>([]);
    const [selectedStaffName, setSelectedStaffName] = useState("");

    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);

    const [editing, setEditing] = useState<any | null>(null);
    const [deleting, setDeleting] = useState<any | null>(null);

    const [form, setForm] = useState<any>({
        name: "",
        mobile: "",
        section: "",
        uniqueId: "",
    });

    /* ---------- DERIVED ---------- */
    const filtered = staff.filter((m) => {
        const okSearch =
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.section &&
                m.section.toLowerCase().includes(searchTerm.toLowerCase()));
        const okSection =
            filterSection === "all" || m.section === filterSection;
        const okStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && m.active_flag) ||
            (filterStatus === "inactive" && !m.active_flag);
        return okSearch && okSection && okStatus;
    });

    /* ---------- API ---------- */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await axiosInstance.get(
                    "/supervisor/getUsers"
                );
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
            setLoading(false);
        })();
    }, [dispatch]);

    /* ---------- HANDLERS ---------- */
    const resetForm = () =>
        setForm({
            name: "",
            mobile: "",
            section: "",
            uniqueId: "",
        });

    const handleAdd = () => {
        setEditing(null);
        resetForm();
        setOpenAdd(true);
    };
    const handleShowScores = (staffMember: any) => {
        console.log("Staff member data:", staffMember); // Debug log
        setSelectedStaffScores(staffMember.scores || []);
        setSelectedStaffName(staffMember.name);
        setOpenScores(true);
    };

    const handleEdit = (m: any) => {
        setEditing(m);
        setForm({
            name: m.name,
            mobile: m.mobile,
            section: m.section || "",
            uniqueId: m.uniqueId,
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
    const pushActivity = (
        action: "Added" | "Edited" | "Deleted",
        name: string,
        priority = "Normal"
    ) => {
        const newActivity = {
            title: `${action} Staff: ${name} (${priority})`,
            time: new Date().toLocaleString(),
            status: "success" as const,
        };
        const raw = localStorage.getItem("SupervisorRecentActivity");
        const prev: (typeof newActivity)[] = raw ? JSON.parse(raw) : [];
        const updated = [newActivity, ...prev].slice(0, 5);
        localStorage.setItem(
            "SupervisorRecentActivity",
            JSON.stringify(updated)
        );
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
    return;
  }

  try {
    if (editing) {
      const { data } = await axiosInstance.put(
        `/supervisor/editUser/${editing.id}`,
        form
      );

      if (data.success) {
        setStaff((prev) =>
          prev.map((s) => (s.id === editing.id ? data.editUser : s))
        );
        pushActivity("Edited", data.editUser.name);
        toast.success("Updated Staff successfully");
      }
    } else {
      const { data } = await axiosInstance.post(
        "/supervisor/addUser",
        form
      );

      if (data.success) {
        setStaff((prev) => [data.addUser, ...prev]); // ✅ ADD new user
        pushActivity("Added", data.addUser.name);
        toast.success("Added Staff successfully");
      }
    }

    setOpenAdd(false);
    setOpenEdit(false);
    resetForm();
    setEditing(null);
  } catch (err: any) {
    console.error("❌ Error while saving staff:", err);
    if (err.response?.status === 401) {
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshtoken");
      await logoutSupervisor();
      dispatch(clearUser());
      toast.error("Session expired");
    } else {
      toast.error(err.response?.data?.message || "Request failed");
    }
  }
};

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await axiosInstance.delete(`/supervisor/deleteUser/${deleting.id}`);
            setStaff((prev) => prev.filter((s) => s.id !== deleting.id));
             pushActivity('Deleted', deleting.name);
            toast.success("Deleted Staff Successfully");
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
            await axiosInstance.patch(`/supervisor/toggleStaff/${id}`, {
                active_flag: newStatus,
            });
            setStaff((prev) =>
                prev.map((s) =>
                    s.id === id ? { ...s, active_flag: newStatus } : s
                )
            );
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
        return <LoadingSpinner />;
    }
    /* ---------- RENDER ---------- */
    return (
        <div className="space-y-6 pb-20">
            {/* Header */}

            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Staff Management
                    </h1>
                    <motion.button
                        onClick={handleAdd}
                        whileTap={{ scale: 0.95 }}
                        className="hidden sm:flex items-center bg-[#FF3F33] hover:bg-[#E6362A] text-white p-2 rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff
                    </motion.button>
                </div>
                <p className="text-sm text-gray-600">
                    Manage your team members and their information
                </p>
            </div>

            {/* stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                            Total Staff
                        </p>
                        <p className="text-2xl font-bold text-[#FF3F33]">
                            {staff.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                            {staff.filter((s) => s.active_flag).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">Inactive</p>
                        <p className="text-2xl font-bold text-red-600">
                            {staff.filter((s) => !s.active_flag).length}
                        </p>
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
            <div className="px-4 mb-6 mt-6">
                {" "}
                {/* Added mt-6 for gap */}
                {/* Filters Card */}
                {staff.length > 0 && (
                    <div className="px-4 mb-6 mt-6">
                        <Card>
                            <CardContent className="p-6">
                            {/* <div className="flex flex-row items-center gap-2 w-full">

  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input
      placeholder="Search by name, section."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 w-full"
    />
  </div>

  <Button
    variant="outline"
    onClick={() => setShowFilters(!showFilters)}
    className="flex items-center gap-2 whitespace-nowrap"
  >
    <Filter className="h-4 w-4" />
    Filters
  </Button>
</div> */}
<div className="flex flex-row items-center gap-2 w-full">
  {/* 🔍 Search Bar (Left) */}
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input
      placeholder="Search by name, mobile, role, or ID..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 pr-4 w-full"
    />
  </div>

  {/* 🧰 Filter Button (Right) */}
  <Button
    variant="outline"
    onClick={() => setShowFilters(!showFilters)}
    className="flex items-center gap-2 whitespace-nowrap"
  >
    <Filter className="h-4 w-4 text-gray-600" />
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
                )}
            </div>

            {/* list / cards */}
            <Card>
                <CardHeader>
                    <CardTitle>Staff Directory</CardTitle>
                    <CardDescription>
                        Manage your team members and their details
                    </CardDescription>
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
                                                    <p className="font-medium">
                                                        {m.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {m.mobile}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{m.uniqueId}</TableCell>
                                        <TableCell>
                                            {m.section || "N/A"}
                                        </TableCell>
                                        <TableCell>{m.mobile}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                               <button
  onClick={() => toggleStatus(m.id, !m.active_flag)}
  className={`px-3 py-1 rounded-full text-white text-sm font-medium transition-colors ${
    m.active_flag ? "bg-green-500" : "bg-red-500"
  }`}
>
  {m.active_flag ? "Active" : "Inactive"}
</button>

                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleEdit(m)
                                                    }
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(m)
                                                    }
                                                    className="text-red-600 hover:bg-red-50"
                                                >
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
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="bg-[#FF3F33] text-white">
                                                            {m.name
                                                                .split(" ")
                                                                .map(
                                                                    (n) => n[0]
                                                                )
                                                                .join("")
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {m.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={m.active_flag}
                                                    onCheckedChange={(c) =>
                                                        toggleStatus(m.id, c)
                                                    }
                                                    className="data-[state=checked]:bg-[#FF3F33]"
                                                />
                                            </div>
                                            <div className="space-y-2 mb-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-gray-400" />
                                                    <span>
                                                        ID: {m.uniqueId}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span>
                                                        Section:
                                                        {m.section ||
                                                            "No section assigned"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span>
                                                        Contact:{m.mobile}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <div className="flex justify-between items-center mt-4 gap-2">
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 0.95,
                                                            y: 1,
                                                        }}
                                                        whileHover={{
                                                            scale: 1.05,
                                                        }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 15,
                                                        }}
                                                        onClick={() =>
                                                            handleShowScores(m)
                                                        }
                                                        className="flex items-center gap-2 bg-[#FF3F33] text-white px-3 py-2 rounded-full hover:bg-[#E6362A] shadow-sm text-sm"
                                                    >
                                                        <Award className="h-4 w-4" />
                                                        View Score
                                                    </motion.button>

                                                    <div className="flex gap-2 ml-auto">
                                                        <motion.button
                                                            whileTap={{
                                                                scale: 0.95,
                                                                y: 2,
                                                            }}
                                                            whileHover={{
                                                                scale: 1.05,
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 400,
                                                                damping: 15,
                                                            }}
                                                            onClick={() =>
                                                                handleEdit(m)
                                                            }
                                                            className="flex items-center justify-center p-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </motion.button>

                                                        <motion.button
                                                            whileTap={{
                                                                scale: 0.95,
                                                                y: 2,
                                                            }}
                                                            whileHover={{
                                                                scale: 1.05,
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 400,
                                                                damping: 15,
                                                            }}
                                                            onClick={() =>
                                                                handleDelete(m)
                                                            }
                                                            className="flex items-center justify-center p-2 border border-red-600 rounded text-red-600 hover:bg-red-50 text-sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    {filtered.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No staff members found
                        </div>
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
                                    <X
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
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
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    uniqueId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Full Name *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                value={form.name}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        name: e.target.value,
                                                    })
                                                }
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
                                                    const value =
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            ""
                                                        );
                                                    if (value.length <= 10)
                                                        setForm({
                                                            ...form,
                                                            mobile: value,
                                                        });
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
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    section: e.target.value,
                                                })
                                            }
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
                                    Are you sure you want to delete{" "}
                                    <strong>{deleting?.name}</strong>? This
                                    action cannot be undone.
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
                            className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {selectedStaffName}'s Performance
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedStaffScores.length} KPI
                                        {selectedStaffScores.length !== 1
                                            ? "s"
                                            : ""}{" "}
                                        Evaluated
                                    </p>
                                </div>
                                <button
                                    onClick={() => setOpenScores(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X
                                        size={24}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </button>
                            </div>

                            {/* Scores List */}

                            <div className="p-6 space-y-4">
                                {selectedStaffScores.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Award className="h-16 w-16 text-gray-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                            No Scores Found
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {selectedStaffName} hasn't been
                                            evaluated yet
                                        </p>
                                    </div>
                                ) : (
                                    selectedStaffScores.map((score, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-lg text-gray-800">
                                                            {score.kpi.name}
                                                        </h3>
                                                        {score.trend ===
                                                            "up" && (
                                                            <TrendingUp className="h-5 w-5 text-green-500" />
                                                        )}
                                                        {score.trend ===
                                                            "down" && (
                                                            <TrendingDown className="h-5 w-5 text-red-500" />
                                                        )}
                                                        {score.trend ===
                                                            "stable" && (
                                                            <Minus className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Award className="h-4 w-4" />
                                                            {
                                                                score.kpi
                                                                    .frequency
                                                            }
                                                        </span>
                                                        <span>
                                                            Target:{" "}
                                                            {score.kpi.target}%
                                                        </span>
                                                        <span>
                                                            Weight:{" "}
                                                            {(
                                                                score.kpi
                                                                    .weight *
                                                                100
                                                            ).toFixed(0)}
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-[#FF3F33] mb-1">
                                                        {score.points}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        / {score.kpi.max_points}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${
                                                                (score.points /
                                                                    score.kpi
                                                                        .max_points) *
                                                                100
                                                            }%`,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                idx * 0.1 + 0.2,
                                                            duration: 0.5,
                                                        }}
                                                        className={`h-3 rounded-full ${
                                                            score.points >=
                                                            score.kpi
                                                                .max_points *
                                                                0.8
                                                                ? "bg-green-500"
                                                                : score.points >=
                                                                  score.kpi
                                                                      .max_points *
                                                                      0.5
                                                                ? "bg-yellow-500"
                                                                : "bg-red-500"
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>0</span>
                                                    <span>
                                                        {(
                                                            (score.points /
                                                                score.kpi
                                                                    .max_points) *
                                                            100
                                                        ).toFixed(0)}
                                                        %
                                                    </span>
                                                    <span>
                                                        {score.kpi.max_points}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-2">
                                                {score.comment && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-sm text-gray-700 italic">
                                                            💬 "{score.comment}"
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                                                    <span
                                                        className={`px-2 py-1 rounded-full ${
                                                            score.status ===
                                                            "Approved"
                                                                ? "bg-green-100 text-green-700"
                                                                : score.status ===
                                                                  "Pending"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-gray-100 text-gray-700"
                                                        }`}
                                                    >
                                                        {score.status}
                                                    </span>
                                                    {score.evalutedDate && (
                                                        <span>
                                                            Evaluated:{" "}
                                                            {new Date(
                                                                score.evalutedDate
                                                            ).toLocaleDateString(
                                                                "en-IN"
                                                            )}
                                                        </span>
                                                    )}
                                                    <span>
                                                        Updated:{" "}
                                                        {new Date(
                                                            score.updated_at
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}




