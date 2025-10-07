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
    List,
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
} from "lucide-react";
import { LoadingSpinner } from "../ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { Switch } from "../ui/switch";
import { logoutOwner } from "@/lib/logoutApi";

/* --------------------  COMPONENT  -------------------- */
export const OwnerUsers: React.FC = () => {
    /* ======  state  ====== */
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState<any | null>(null);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

    const [viewMode, setViewMode] = useState<"card" | "list">("card");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const dispatch = useDispatch();

    /* stat counters */
    const [totalUser, setTotalUser] = useState(0);
    const [totalActive, setTotalActive] = useState(0);
    const [totalInactive, setTotalInactive] = useState(0);
    const [totalDeleted, setTotalDeleted] = useState(0);

    /* ======  infinite-scroll sentinel  ====== */
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });
    useEffect(() => {
        if (inView) loadMore();
    }, [inView]);

    /* ======  data  ====== */
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
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutOwner();
                dispatch(clearUser());
                toast.error("Credentials expired. Please login again ✅");
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

    /* ======  search / filter  ====== */
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
    const toggleActive = async (u: any) => {
        try {
            // Send only id and the inverted active_flag
            const response = await axiosInstance.patch("/owner/updateStatus", {
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

            console.log("Status updated:", response.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutOwner();
                dispatch(clearUser());
            } else {
                console.error("Failed to update status:", err);
            }
        }
    };

    /* ======  CRUD  ====== */
    const viewDetails = (u: any) => {
        setSelectedUser(u);
        setShowDetailModal(true);
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

            // Remove user from arrays
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setFilteredUsers((prev) =>
                prev.filter((u) => u.id !== userToDelete.id)
            );

            // Update statistics manually
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

        // Validate mobile number
        const mobile = fd.get("mobile") as string;
        if (mobile && mobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }
        if (mobile && !/^\d{10}$/.test(mobile)) {
            toast.error("Mobile number must contain only digits");
            return;
        }

        try {
            const { data } = await axiosInstance.post("/owner/addUser", {
                name: fd.get("name"),
                mobile: fd.get("mobile"),
                uniqueId: fd.get("uniqueId"),
                role: fd.get("role"),
                floor: fd.get("floor"),
                section: fd.get("section"),
            });
            if (data.success) {
                const newUser = data.users;

                // Update users arrays
                setUsers((prev) => [...prev, newUser]);
                setFilteredUsers((prev) => [...prev, newUser]);

                // Update statistics from backend response
                if (data.totalUsers !== undefined)
                    setTotalUser(data.totalUsers);
                if (data.activeUsers !== undefined)
                    setTotalActive(data.activeUsers);
                if (data.inactiveUsers !== undefined)
                    setTotalInactive(data.inactiveUsers);
                if (data.deletedUsers !== undefined)
                    setTotalDeleted(data.deletedUsers);

                e.currentTarget.reset();
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

        // Validate mobile number
        const mobile = fd.get("mobile") as string;
        if (mobile && mobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }
        if (mobile && !/^\d{10}$/.test(mobile)) {
            toast.error("Mobile number must contain only digits");
            return;
        }

        try {
            const { data } = await axiosInstance.put(
                `/owner/updateUser/${userToEdit.id}`,
                {
                    name: fd.get("name"),
                    mobile: fd.get("mobile"),
                    uniqueId: fd.get("uniqueId"),
                    role: fd.get("role"),
                    floor: fd.get("floor"),
                    section: fd.get("section"),
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

    /* ======  UI helpers  ====== */
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
                                {/* Top Row: Name, Role, Actions */}
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => viewDetails(u)}
                                        >
                                            <Eye
                                                size={16}
                                                className="text-gray-400 hover:text-[#FF3F33]"
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => editUser(u)}
                                        >
                                            <Edit
                                                size={16}
                                                className="text-gray-400 hover:text-blue-500"
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteUser(u)}
                                        >
                                            <Trash2
                                                size={16}
                                                className="text-gray-400 hover:text-red-500"
                                            />
                                        </Button>
                                    </div>
                                </div>

                                {/* Other Details */}

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
                                            <span> {u.floor.name}</span>
                                        </div>
                                    )}
                                    {u.section !== "N/A" && (
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

                                {/* Bottom Row: IsActive toggle (Switch) */}
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex justify-end items-center gap-2 text-gray-700 text-sm">
                                        <span>
                                            {u.active_flag
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
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

    /* ======  ListView  ====== */
    const ListView = () => (
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => viewDetails(u)}
                                        >
                                            <Eye
                                                size={16}
                                                className="text-gray-400 hover:text-[#FF3F33]"
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => editUser(u)}
                                        >
                                            <Edit
                                                size={16}
                                                className="text-gray-400 hover:text-blue-500"
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteUser(u)}
                                        >
                                            <Trash2
                                                size={16}
                                                className="text-gray-400 hover:text-red-500"
                                            />
                                        </Button>
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
    );

    /* ======  skeleton / error  ====== */
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

    /* ======  main render  ====== */
    return (
        <div className="min-h-screen bg-gray-50">
            {/* header */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Staff Management
                        </h1>
                    </div>
                    <p className="text-sm text-gray-600">
                      Manage your team members and their information
                    </p>
                </div>



            {/* stat blocks */}
            <div className="px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBlock
                    label="Total Users"
                    value={totalUser}
                    color="border-blue-500"
                />
                <StatBlock
                    label="Active Users"
                    value={totalActive}
                    color="border-green-500"
                />
                <StatBlock
                    label="Inactive Users"
                    value={totalInactive}
                    color="border-orange-500"
                />
                <StatBlock
                    label="Deleted Users"
                    value={totalDeleted}
                    color="border-red-500"
                />
            </div>

            {/* content */}
            <div className="-mt-5">
                {viewMode === "card" ? <CardView /> : <ListView />}
            </div>

            {/* floating add (mobile) */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-20 right-6 bg-[#FF3F33] text-white p-4 rounded-full shadow-lg hover:bg-[#E63629] transition-colors sm:hidden z-20"
            >
                <Plus size={24} />
            </button>

            {/* ======  modals  ====== */}
            <AnimatePresence>
                {/* Add User Modal */}
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
                                <button onClick={() => setShowAddModal(false)}>
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
                                    <Input
                                        id="add-uniqueId"
                                        name="uniqueId"
                                        placeholder="ID"
                                        required
                                    />
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
                                    <Label htmlFor="add-role">Role</Label>
                                    <Select name="role" required>
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
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-section">Section</Label>
                                    <Input
                                        id="add-section"
                                        name="section"
                                        placeholder="Section  "
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
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

                {/* Edit User Modal */}
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
                            {/* Header */}
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

                            {/* Form with every field */}
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
                                {/* Name */}
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

                                {/* Mobile */}
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

                                {/* Role */}
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select
                                        name="role"
                                        required
                                        defaultValue={userToEdit.role}
                                    >
                                        <SelectTrigger id="edit-role">
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

                                {/* Floor */}
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

                                {/* Section */}
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-section">
                                        Section
                                    </Label>
                                    <Input
                                        id="edit-section"
                                        name="section"
                                        placeholder="Section  "
                                        required
                                        defaultValue={userToEdit.section}
                                    />
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">Active</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="edit-isActive"
                                            name="isActive"
                                            className="sr-only peer"
                                            defaultChecked={
                                                userToEdit.active_flag
                                            }
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#FF3F33] peer-focus:ring-2 peer-focus:ring-[#FF3F33] transition-all"></div>
                                        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md peer-checked:translate-x-5 transition-transform"></span>
                                    </label>
                                </div>

                                {/* Deleted Toggle */}
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">Deleted</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="edit-isDeleted"
                                            name="isDeleted"
                                            className="sr-only peer"
                                            defaultChecked={
                                                userToEdit.isDeleted
                                            }
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-500 peer-focus:ring-2 peer-focus:ring-red-500 transition-all"></div>
                                        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md peer-checked:translate-x-5 transition-transform"></span>
                                    </label>
                                </div>

                                {/* Actions */}
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

                {/* User Details Modal */}
                {showDetailModal && selectedUser && (
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
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Section:
                                    </span>
                                    <span>{selectedUser.section}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Floor:</span>
                                    <span>{selectedUser.floor.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        PIN Hash:
                                    </span>
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                        {selectedUser.pinHash}
                                    </span>
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
                )}

                {/* Delete Confirmation Modal */}
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
            </AnimatePresence>
        </div>
    );
};

export default OwnerUsers;
