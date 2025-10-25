import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { useInView } from "react-intersection-observer";
import { axiosInstance } from "@/api/axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Eye,
    Trash2,
    Plus,
    X,
    LayoutGrid,
    Search,
    Loader,
    Edit,
    Phone,
    MapPin,
    Building,
    Calendar,
    Filter,
    SlidersHorizontal,
    Hash,
    User,
    Award,
    TrendingUp,
    TrendingDown,
    Minus,
    Grid,
} from "lucide-react";
import { LoadingSpinner } from "../ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { Switch } from "../ui/switch";
import { logoutOwner } from "@/lib/logoutApi";
const OwnerUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showScoresModal, setShowScoresModal] = useState(false);
    const [selectedStaffScores, setSelectedStaffScores] = useState<any[]>([]);
    const [selectedStaffName, setSelectedStaffName] = useState("");
    const [userToEdit, setUserToEdit] = useState<any | null>(null);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [viewMode] = useState<"card">("card");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");
    const [visibleCount, setVisibleCount] = useState(12);
    const dispatch = useDispatch();

    const [totalUser, setTotalUser] = useState(0);
    const [totalActive, setTotalActive] = useState(0);
    const [totalInactive, setTotalInactive] = useState(0);
    const [totalDeleted, setTotalDeleted] = useState(0);

    // ID validation states
    const [idValidation, setIdValidation] = useState({
        isChecking: false,
        exists: false,
        message: ""
    });

    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });

    useEffect(() => {
        if (inView) loadMore();
    }, [inView]);

    // Debounced function to check ID existence
    const checkIdExists = useCallback(
        debounce(async (uniqueId: string) => {
            if (!uniqueId || uniqueId.length < 3) {
                setIdValidation({ isChecking: false, exists: false, message: "" });
                return;
            }

            setIdValidation(prev => ({ ...prev, isChecking: true }));

            try {
                const { data } = await axiosInstance.get(`/owner/check-id?uniqueId=${uniqueId}`);
                setIdValidation({
                    isChecking: false,
                    exists: data.exists,
                    message: data.message
                });
            } catch (err:any) {
                 if (err.response?.status === 401) {
                                    const response = await logoutOwner();
                                    if ((response as any).success) {
                                        localStorage.removeItem("accessToken");
                                        localStorage.removeItem("refreshToken");
                                        dispatch(clearUser());
                                    } else {
                                        console.error("Logout failed on backend");
                                    }
                                }
                setIdValidation({
                    isChecking: false,
                    exists: false,
                    message: "Error checking ID"
                });
            }
        }, 500),
        []
    );

    // Reset ID validation when modal is closed
    const resetIdValidation = () => {
        setIdValidation({ isChecking: false, exists: false, message: "" });
    };

    const SummaryCard: React.FC<any> = ({
        title,
        value,
        icon: Icon,
        color,
        subtitle,
    }) => (
        <div className="h-full bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-600">{subtitle}</p>
                    )}
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </div>
    );

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axiosInstance.get<any>("/owner/getUsers");
            setTotalUser(res.data.totalUsers || 0);
            setTotalActive(res.data.activeUsers || 0);
            setTotalInactive(res.data.inactiveUsers || 0);
            setTotalDeleted(res.data.deletedUsers || 0);
            setUsers(res.data.users);
            setFilteredUsers(res.data.users);
        } catch (err: any) {
            if (err.response?.status === 401) {
                  const response = await logoutOwner();
                    if ((response as any).success) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        dispatch(clearUser());
                    } else {
                        console.error("Logout failed on backend");
                    }
            } else {
                setError("Failed to load users.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let res = [...users];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            res = res.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.mobile.includes(q) ||
                    u.role.toLowerCase().includes(q) ||
                    u.uniqueId.toLowerCase().includes(q)
            );
        }
        if (roleFilter !== "all")
            res = res.filter((u) => u.role === roleFilter);
        if (statusFilter !== "all")
            res = res.filter(
                (u) => u.active_flag === (statusFilter === "active")
            );
        setFilteredUsers(res);
        setVisibleCount(12);
    }, [users, searchQuery, roleFilter, statusFilter]);

    const debouncedSearch = useCallback(
        debounce((q: string) => setSearchQuery(q), 300),
        []
    );

    const loadMore = () =>
        setVisibleCount((v) => Math.min(v + 12, filteredUsers.length));

    const clearAllFilters = () => {
        setSearchQuery("");
        setRoleFilter("all");
        setStatusFilter("all");
        debouncedSearch("");
    };

    const hasActiveFilters =
        searchQuery || roleFilter !== "all" || statusFilter !== "all";

    const handleShowScores = (user: any) => {
        setSelectedStaffScores(user.scores || []);
        setSelectedStaffName(user.name);
        setShowScoresModal(true);
    };

    const toggleActive = async (u: any) => {
        try {
            await axiosInstance.patch("/owner/updateStatus", {
                id: u.id,
                active_flag: !u.active_flag,
            });
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === u.id
                        ? { ...user, active_flag: !user.active_flag }
                        : user
                )
            );
            toast.success(
                `User "${u.name}" is now ${
                    !u.active_flag ? "Active" : "Inactive"
                }`
            );
        } catch (err: any) {
            if (err.response?.status === 401) {
                 const response = await logoutOwner();
                                   if ((response as any).success) {
                                       localStorage.removeItem("accessToken");
                                       localStorage.removeItem("refreshToken");
                                       dispatch(clearUser());
                                   } else {
                                       console.error("Logout failed on backend");
                                   }
            } else {
                console.error("Failed to update status:", err);
            }
        }
    };



    const deleteUser = (u: any) => {
        setUserToDelete(u);
        setShowDeleteModal(true);
    };

    const editUser = (u: any) => {
        setUserToEdit(u);
        setShowEditModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await axiosInstance.delete(`/owner/deleteUser/${userToDelete.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setFilteredUsers((prev) =>
                prev.filter((u) => u.id !== userToDelete.id)
            );
            setTotalUser((prev) => prev - 1);
            if (userToDelete.active_flag) {
                setTotalActive((prev) => prev - 1);
            } else {
                setTotalInactive((prev) => prev - 1);
            }
            setShowDeleteModal(false);
            setUserToDelete(null);
            toast.success("User deleted successfully");
        } catch {
            toast.error("Failed to delete user");
        }
    };

    const addUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const mobile = fd.get("mobile") as string;
        const role = fd.get("role") as string;

        if (mobile && mobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }
        if (mobile && !/^\d{10}$/.test(mobile)) {
            toast.error("Mobile number must contain only digits");
            return;
        }
        
        const pin = fd.get("pin") as string;
        if (pin && ( pin.length > 6)) {
            toast.error("PIN must be 6 digits");
            return;
        }
        if (pin && !/^\d+$/.test(pin)) {
            toast.error("PIN must contain only digits");
            return;
        }
        
        // Check if ID already exists
        if (idValidation.exists) {
            toast.error("ID already exists. Please choose a different ID.");
            return;
        }
        
        try {
            const { data } = await axiosInstance.post("/owner/addUser", {
                name: fd.get("name"),
                mobile: fd.get("mobile"),
                uniqueId: fd.get("uniqueId"),
                pin: fd.get("pin"),
                role: role,
                floor: fd.get("floor"),
                // Send null for section if role is Accountant or FloorSupervisor
                section:
                    role === "Accountant" || role === "FloorSupervisor"
                        ? null
                        : fd.get("section"),
            });
            if (data.success) {
                const newUser = data.users;
                setUsers((prev) => [...prev, newUser]);
                setFilteredUsers((prev) => [...prev, newUser]);
                if (data.totalUsers !== undefined)
                    setTotalUser(data.totalUsers);
                if (data.activeUsers !== undefined)
                    setTotalActive(data.activeUsers);
                if (data.inactiveUsers !== undefined)
                    setTotalInactive(data.inactiveUsers);
                if (data.deletedUsers !== undefined)
                    setTotalDeleted(data.deletedUsers);
                setSelectedRole(""); 
                resetIdValidation();
                toast.success("User added successfully!");
            }
       } catch (err: any) {
    if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        await logoutOwner();
        dispatch(clearUser());
    } else if (err.response?.status === 400) {
        toast.error("Number already exists!");
    } else if (err.response?.status === 409) {
        toast.error("Unique ID already exists!");
    } else {
        toast.error("Failed to add user ❌");
    }
}

        setShowAddModal(false);
    };

    const editUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userToEdit) return;
        const fd = new FormData(e.currentTarget);
        const mobile = fd.get("mobile") as string;
        const role = fd.get("role") as string;

        if (mobile && mobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }
        if (mobile && !/^\d{10}$/.test(mobile)) {
            toast.error("Mobile number must contain only digits");
            return;
        }
        
        const pin = fd.get("pin") as string;
        if (pin && pin.trim() !== "" && ( pin.length > 6)) {
            toast.error("PIN must be 6 digits");
            return;
        }
        if (pin && pin.trim() !== "" && !/^\d+$/.test(pin)) {
            toast.error("PIN must contain only digits");
            return;
        }
        
        try {
            const { data } = await axiosInstance.put(
                `/owner/updateUser/${userToEdit.id}`,
                {
                    name: fd.get("name"),
                    mobile: fd.get("mobile"),
                    uniqueId: fd.get("uniqueId"),
                    pin: pin && pin.trim() !== "" ? pin : undefined,
                    role: role,
                    floor: fd.get("floor"),
                    // Send null for section if role is Accountant or FloorSupervisor
                    section:
                        role === "Accountant" || role === "FloorSupervisor"
                            ? null
                            : fd.get("section"),
                    isActive: fd.get("isActive") === "on",
                    isDeleted: fd.get("isDeleted") === "on",
                }
            );
            if (data.success && data.user) {
                const updated = data.user;
                setUsers((prev) =>
                    prev.map((u) => (u.id === userToEdit.id ? updated : u))
                );
                setFilteredUsers((prev) =>
                    prev.map((u) => (u.id === userToEdit.id ? updated : u))
                );
                toast.success("User updated successfully");
                setShowEditModal(false);
                setUserToEdit(null);
            }
        } catch {
            toast.error("Update failed");
        }
    };

    const fmtDate = (d: string) =>
        d ? new Date(d).toLocaleDateString() : "N/A";
    const fmtDateTime = (d: string) =>
        d ? new Date(d).toLocaleString() : "N/A";

    const StatBlock = ({
        label,
        value,
        color,
    }: {
        label: string;
        value: number;
        color: string;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex-1 bg-white rounded-xl shadow p-4 text-center border-b-4 ${color}`}
        >
            <div className="text-3xl font-bold text-gray-800">{value}</div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>
        </motion.div>
    );

    const CardView = () => (
        <div className="p-4 pb-24">
            {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500 space-y-2">
                    <User size={32} className="text-gray-400" />
                    <span>No users found</span>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredUsers.slice(0, visibleCount).map((u) => (
                            <motion.div
                                key={u.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow hover:shadow-lg p-5 border border-gray-100 flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg text-gray-800 truncate">
                                                {u.name}
                                            </h3>
                                            {u.role !== "N/A" && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {u.role}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => editUser(u)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                                        >
                                            <Edit
                                                size={16}
                                                className="text-gray-400 hover:text-blue-500"
                                            />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => deleteUser(u)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                                        >
                                            <Trash2
                                                size={16}
                                                className="text-gray-400 hover:text-red-500"
                                            />
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-3">
                                    {u.uniqueId && u.uniqueId !== "N/A" && (
                                        <div className="flex items-center gap-2">
                                            <Hash
                                                size={14}
                                                className="text-gray-500"
                                            />
                                            <span>{u.uniqueId}</span>
                                        </div>
                                    )}
                                    {u.mobile !== "N/A" && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} />
                                            <span>{u.mobile}</span>
                                        </div>
                                    )}
                                    {u.floor !== "N/A" && (
                                        <div className="flex items-center gap-2">
                                            <Building size={14} />
                                            <span>{u.floor.name}</span>
                                        </div>
                                    )}
                                    {u.section  && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} />
                                            <span>{u.section}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>
                                            Joined {fmtDate(u.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                    <div className="flex justify-between items-center text-gray-700 text-sm">
                                        <div className="pt-2 border-t border-gray-100">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() =>
                                                    handleShowScores(u)
                                                }
                                                className="flex items-center gap-1.5 bg-[#FF3F33] text-white px-2.5 py-1.5 rounded-md hover:bg-[#E6362A] shadow-sm text-xs"
                                            >
                                                <Award className="h-3.5 w-3.5" />
                                                View Score
                                            </motion.button>
                                        </div>
                                        <Switch
                                            checked={u.active_flag}
                                            onCheckedChange={() =>
                                                toggleActive(u)
                                            }
                                            className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-300"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {visibleCount < filteredUsers.length && (
                        <div ref={loadMoreRef} className="h-10" />
                    )}
                    {visibleCount >= filteredUsers.length &&
                        filteredUsers.length > 0 && (
                            <div className="text-center mt-6 text-sm text-gray-400">
                                ─── End of list ───
                            </div>
                        )}
                </>
            )}
        </div>
    );

    // const ListView = () => (
        <div className="p-4 pb-24">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-100">
                            <tr className="border-t-4 border-[#FF3F33]">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Unique ID
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Mobile
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Floor
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Section
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Created
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.slice(0, visibleCount).map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                        {u.uniqueId}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {u.name !== "N/A" ? (
                                            u.name
                                        ) : (
                                            <span className="text-gray-400">
                                                No Name
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {u.mobile !== "N/A" ? (
                                            u.mobile
                                        ) : (
                                            <span className="text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {u.role !== "N/A" ? (
                                            u.role
                                        ) : (
                                            <span className="text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {u.floor !== "N/A" ? (
                                            u.floor.name
                                        ) : (
                                            <span className="text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {u.section !== "N/A" ? (
                                            u.section
                                        ) : (
                                            <span className="text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {/* <button
                                           
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                u.active_flag
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                            }`}
                                        >
                                            {u.active_flag ? "Active" : "Inactive"}
                                        </button> */}
                                        <button
                                            onClick={() => toggleActive(u)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                u.active_flag
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                            }`}
                                        >
                                            {u.active_flag
                                                ? "Active"
                                                : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {fmtDate(u.created_at)}
                                    </td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleShowScores(u)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                                        >
                                            <Award
                                                size={16}
                                                className="text-gray-400 hover:text-[#FF3F33]"
                                            />
                                        </motion.button>
                                      
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => editUser(u)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                                        >
                                            <Edit
                                                size={16}
                                                className="text-gray-400 hover:text-blue-500"
                                            />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => deleteUser(u)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                                        >
                                            <Trash2
                                                size={16}
                                                className="text-gray-400 hover:text-red-500"
                                            />
                                        </motion.button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {visibleCount < filteredUsers.length && (
                    <div className="text-center my-4">
                        <button
                            onClick={loadMore}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    // );

    if (loading) return <LoadingSpinner />;
    if (error)
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-[#FF3F33] text-white rounded-lg hover:bg-[#E63629]"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="px-4 py-6 grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                            Total Staff
                        </p>
                        <p className="text-2xl font-bold text-[#FF3F33]">
                            {totalUser}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                            {totalActive}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">Inactive</p>
                        <p className="text-2xl font-bold text-red-600">
                            {totalInactive}
                        </p>
                    </CardContent>
                </Card>
            </div>
            {/* Search and Filters */}
            {users.length > 0 && (
                <div className="px-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex flex-row items-center gap-2 w-full">
                            {/* 🔍 Search Bar (Left) */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, mobile, role, or ID..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10 pr-4 w-full"
                                />
                            </div>

                            {/* 🧰 Filter Button (Right) */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 whitespace-nowrap inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                <Filter className="h-4 w-4 text-gray-600" />
                                
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 flex flex-col sm:flex-row gap-4"
                                >
                                    <Select
                                        value={roleFilter}
                                        onValueChange={setRoleFilter}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Filter by Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Roles
                                            </SelectItem>
                                            {/* <SelectItem value="Manager">Manager</SelectItem> */}
                                            <SelectItem value="Staff">
                                                Staff
                                            </SelectItem>
                                            <SelectItem value="FloorSupervisor">
                                                Floor Supervisor
                                            </SelectItem>
                                            <SelectItem value="Accountant">
                                                Accountant
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={statusFilter}
                                        onValueChange={setStatusFilter}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Filter by Status" />
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

                                    {hasActiveFilters && (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={clearAllFilters}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                        >
                                            Clear Filters
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <div className="-mt-5">
                <CardView />
            </div>

            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-20 right-6 bg-[#FF3F33] text-white p-4 rounded-full shadow-lg hover:bg-[#E63629] transition-colors sm:hidden z-20"
            >
                <Plus size={24} />
            </button>

            {/* Modals remain the same */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Add New User
                                </h2>
                                <button onClick={() => {
                                    setShowAddModal(false);
                                    resetIdValidation();
                                }}>
                                    <X
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </button>
                            </div>
                            <form onSubmit={addUser} className="p-6 grid gap-5">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-uniqueId">
                                        Unique ID
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="add-uniqueId"
                                            name="uniqueId"
                                            placeholder="ID"
                                            required
                                            onChange={(e) => checkIdExists(e.target.value)}
                                        />
                                        {idValidation.isChecking && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader className="h-4 w-4 animate-spin text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    {idValidation.message && (
                                        <span className={`text-xs ${
                                            idValidation.exists ? 'text-red-500' : 'text-green-500'
                                        }`}>
                                            {idValidation.message}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-name">Name</Label>
                                    <Input
                                        id="add-name"
                                        name="name"
                                        placeholder="Full name"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-mobile">Mobile</Label>
                                    <Input
                                        id="add-mobile"
                                        name="mobile"
                                        type="tel"
                                        placeholder="Phone"
                                        pattern="[0-9]{10}"
                                        minLength={10}
                                        maxLength={10}
                                        title="Mobile number must be exactly 10 digits"
                                        required
                                    />
                                    <span className="text-xs text-gray-500">
                                        Mobile must be exactly 10 digits
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-pin">PIN</Label>
                                    <Input
                                        id="add-pin"
                                        name="pin"
                                        type="password"
                                        placeholder="Enter PIN"
                                        minLength={4}
                                        maxLength={6}
                                        title="PIN must be 6 digits"
                                        required
                                    />
                                    <span className="text-xs text-gray-500">
                                        PIN must be 6 digits
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-role">Role</Label>
                                    <Select
                                        name="role"
                                        value={selectedRole}
                                        onValueChange={setSelectedRole}
                                        required
                                    >
                                        <SelectTrigger id="add-role">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Manager">
                                                Manager
                                            </SelectItem>
                                            <SelectItem value="Staff">
                                                Staff
                                            </SelectItem>
                                            <SelectItem value="FloorSupervisor">
                                                Floor Supervisor
                                            </SelectItem>
                                            <SelectItem value="Accountant">
                                                Accountant
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-floor">Floor</Label>
                                    <Input
                                        id="add-floor"
                                        name="floor"
                                        placeholder="Floor number"
                                        required
                                    />
                                </div>
                                {selectedRole !== "Accountant" &&
                                    selectedRole !== "FloorSupervisor" && (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="add-section">
                                                Section
                                            </Label>
                                            <Input
                                                id="add-section"
                                                name="section"
                                                placeholder="Section"
                                                required
                                            />
                                        </div>
                                    )}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            resetIdValidation();
                                        }}
                                        className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#FF3F33] text-white rounded-lg py-2 hover:bg-[#E63629]"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {showEditModal && userToEdit && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Edit User
                                </h2>
                                <button onClick={() => setShowEditModal(false)}>
                                    <X
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </button>
                            </div>
                            <form
                                onSubmit={editUserSubmit}
                                className="p-6 grid gap-5"
                            >
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-uniqueId">
                                        Unique ID
                                    </Label>
                                    <Input
                                        id="edit-uniqueId"
                                        name="uniqueId"
                                        placeholder="ID"
                                        required
                                        defaultValue={userToEdit.uniqueId}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        placeholder="Full name"
                                        required
                                        defaultValue={userToEdit.name}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-mobile">Mobile</Label>
                                    <Input
                                        id="edit-mobile"
                                        name="mobile"
                                        type="tel"
                                        placeholder="Phone"
                                        pattern="[0-9]{10}"
                                        minLength={10}
                                        maxLength={10}
                                        title="Mobile number must be exactly 10 digits"
                                        required
                                        defaultValue={userToEdit.mobile}
                                    />
                                    <span className="text-xs text-gray-500">
                                        Mobile must be exactly 10 digits
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-pin">PIN</Label>
                                    <Input
                                        id="edit-pin"
                                        name="pin"
                                        type="password"
                                        placeholder="Enter new PIN"
                                        minLength={4}
                                        maxLength={6}
                                        title="PIN must be 6 digits"
                                    />
                                    <span className="text-xs text-gray-500">
                                        Leave blank if PIN is not changing
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select
                                        name="role"
                                        required
                                        defaultValue={userToEdit.role}
                                        onValueChange={(value) =>
                                            setSelectedRole(value)
                                        }
                                    >
                                        <SelectTrigger id="edit-role">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* <SelectItem value="Manager">Manager</SelectItem> */}
                                            <SelectItem value="Staff">
                                                Staff
                                            </SelectItem>
                                            <SelectItem value="FloorSupervisor">
                                                Floor Supervisor
                                            </SelectItem>
                                            <SelectItem value="Accountant">
                                                Accountant
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                               <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-floor">Floor</Label>
                                    <Input
                                        id="edit-floor"
                                        name="floor"
                                        placeholder="Floor number"
                                        required
                                        defaultValue={userToEdit.floor.name}
                                    />
                                </div>
                                {selectedRole !== "Accountant" &&
                                    selectedRole !== "FloorSupervisor" && (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="edit-section">
                                                Section
                                            </Label>
                                            <Input
                                                id="edit-section"
                                                name="section"
                                                placeholder="Section"
                                                required
                                                defaultValue={userToEdit.section}
                                            />
                                        </div>
                                    )}
                               
                               
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#FF3F33] text-white rounded-lg py-2 hover:bg-[#E63629]"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* {showDetailModal && selectedUser && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    User Details
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    <X
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </button>
                            </div>
                            <div className="p-6 space-y-3 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Unique ID:
                                    </span>
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                        {selectedUser.uniqueId}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Name:</span>
                                    <span>{selectedUser.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Mobile:</span>
                                    <span>{selectedUser.mobile}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Role:</span>
                                    <span>{selectedUser.role}</span>
                                </div>
                                {(selectedRole || userToEdit.role) !==
                                    "Accountant" &&
                                    (selectedRole || userToEdit.role) !==
                                        "FloorSupervisor" && (
                                        <div className="flex flex-col gap-1">
                                            <Label htmlFor="edit-section">
                                                Section
                                            </Label>
                                            <Input
                                                id="edit-section"
                                                name="section"
                                                placeholder="Section"
                                                required
                                                defaultValue={
                                                    userToEdit.section || ""
                                                }
                                            />
                                        </div>
                                    )}
                                <div className="flex justify-between">
                                    <span className="font-medium">Floor:</span>
                                    <span>{selectedUser.floor.name}</span>
                                </div>
                               
                                <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            selectedUser.active_flag
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {selectedUser.active_flag
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Deleted:
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            selectedUser.isDeleted
                                                ? "bg-red-100 text-red-700"
                                                : "bg-green-100 text-green-700"
                                        }`}
                                    >
                                        {selectedUser.isDeleted ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Created At:
                                    </span>
                                    <span>
                                        {fmtDateTime(selectedUser.created_at)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )} */}

                {showDeleteModal && userToDelete && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-lg w-full max-w-sm"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                    Confirm Deletion
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete{" "}
                                    <span className="font-medium">
                                        {userToDelete.name}
                                    </span>
                                    ? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() =>
                                            setShowDeleteModal(false)
                                        }
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showScoresModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowScoresModal(false)}
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
                                    onClick={() => setShowScoresModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X
                                        size={24}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </button>
                            </div>

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

                                            <div className="space-y-2">
                                                {score.comment && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-sm text-gray-700 italic">
                                                            💬 "{score.comment}"
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                                                    {/* <span
                                                        className={`px-2 py-1 rounded-full ${
                                                            score.status === "Approved"
                                                                ? "bg-green-100 text-green-700"
                                                                : score.status === "Pending"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-gray-100 text-gray-700"
                                                        }`}
                                                    >
                                                        {score.status}
                                                    </span> */}
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
};

export default OwnerUsers;
