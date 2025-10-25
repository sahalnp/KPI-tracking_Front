/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { pushActivity } from "@/lib/setRecentActivity";
import {
    UserX,
    Plus,
    X,
    User,
    Users,
    Calendar,
    Flag,
    FileText,
    Clock,
    CheckCircle,
    Edit,
    Trash2,
    Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { axiosInstance } from "@/api/axios";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { toast } from "sonner";
import { logoutOwner } from "@/lib/logoutApi";
import { LoadingSpinner } from "../ui/spinner";
import { Navigate, useNavigate } from "react-router-dom";

// /* ---------- helpers ---------- */
// const timeAgo = (dateString: string) => {
//     const now = new Date();
//     const date = new Date(dateString);
//     const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
//     if (diff < 60) return `${diff} seconds ago`;
//     if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
//     return `${Math.floor(diff / 86400)} days ago`;
// };  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
//   

const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
        case "high":
            return "bg-red-100 text-red-800 border-red-200";
        case "medium":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "low":
            return "bg-green-100 text-green-800 border-green-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};
function formatTimeAgo(dateString: any) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return count === 1
                ? `1 ${interval.label} ago`
                : `${count} ${interval.label}s ago`;
        }
    }
    return "just now";
}


/* ---------- component ---------- */
export function WalkOutManagementOwner() {
    /* ---- existing state ---- */
    const [entries, setEntries] = useState<any[]>([]);
    const [weekCount, setWeekCount] = useState(0);
    const [priorityCount, setPriorityCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [viewMode] = useState<"card">("card");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<any>(null);
    const [selectedPriority, setSelectedPriority] = useState("");
    const [query, setQuery] = useState("");

    const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /* ---- NEW: item name / type ---- */
    const [itemQuery, setItemQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [itemLoading, setItemLoading] = useState(false);
    const itemDropdownRef = useRef<HTMLDivElement>(null);

    const [typeQuery, setTypeQuery] = useState("");
    const [selectedType, setSelectedType] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [typeLoading, setTypeLoading] = useState(false);
    const typeDropdownRef = useRef<HTMLDivElement>(null);

    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [filteredTypes, setFilteredTypes] = useState<any[]>([]);
    const [isStaffInputFocused, setIsStaffInputFocused] = useState(false);

    const dispatch = useDispatch();
    const staffDropdownRef = useRef<HTMLDivElement>(null);
    const naivate = useNavigate();
    /* ---------- debounce ---------- */
    const debounce = (fn: Function, delay: number) => {
        let t: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), delay);
        };
    };

    const fetchItems = debounce(async (q: string) => {
        if (!q.trim()) {
            setFilteredItems([]);
            return;
        }
        setItemLoading(true);
        try {
            const { data } = await axiosInstance.get(
                "/owner/getItemName",
                { params: { query: q } }
            );
            setFilteredItems(data.items ?? []);
        } catch {
            setFilteredItems([]);
        } finally {
            setItemLoading(false);
        }
    }, 400);

    const fetchTypes = debounce(async (q: string) => {
        if (!q.trim()) {
            setFilteredTypes([]);
            return;
        }
        setTypeLoading(true);
        try {
            const { data } = await axiosInstance.get(
                "/owner/getItemType",
                { params: { query: q } }
            );
            setFilteredTypes(data.types ?? []);
        } catch {
            setFilteredTypes([]);
        } finally {
            setTypeLoading(false);
        }
    }, 400);

    const fetchStaff = debounce(async (q: string) => {
        if (!q.trim()) {
            setFilteredStaff([]);
            return;
        }
        setItemLoading(true); // Reuse itemLoading for staff search
        try {
            const { data } = await axiosInstance.get(
                "/owner/searchStaff",
                { params: { query: q } }
            );
            console.log(data,"+5646+46484484");
            
            setFilteredStaff(data.staffs ?? []);
        } catch {
            setFilteredStaff([]);
        } finally {
            setItemLoading(false);
        }
    }, 400);

    useEffect(() => {
        fetchItems(itemQuery);
    }, [itemQuery]);
    useEffect(() => {
        fetchTypes(typeQuery);
    }, [typeQuery]);
    useEffect(() => {
        fetchStaff(query);
    }, [query]);

    /* ---------- outside click ---------- */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                itemDropdownRef.current &&
                !itemDropdownRef.current.contains(e.target as Node)
            )
                setFilteredItems([]);
            if (
                typeDropdownRef.current &&
                !typeDropdownRef.current.contains(e.target as Node)
            )
                setFilteredTypes([]);
            if (
                staffDropdownRef.current &&
                !staffDropdownRef.current.contains(e.target as Node)
            ) {
                setFilteredStaff([]);
                setIsStaffInputFocused(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ---------- initial data ---------- */
    useEffect(() => {
        const fetchWalkouts = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/owner/getWalkouts");
                
                const data = res.data.walkouts;
                setEntries(data.walkouts);
                setWeekCount(data.weekWalkoutCount || 0);
                setPriorityCount(data.priorityCount || 0);
                setTodayCount(data.todayCount || 0);

                console.log("Staff list loaded:", data.staffs);
            } catch (err: any) {
               if (err.response?.status === 401) {
                                   const response:any = await logoutOwner();
                                   if (response.success) {
                                       localStorage.removeItem("accessToken");
                                       localStorage.removeItem("refreshToken");
                                       dispatch(clearUser());
                                   } else {
                                       console.error("Logout failed on backend");
                                   }
                               }
            }
            setLoading(false);
        };
        fetchWalkouts();
    }, []);

    /* ---------- staff filter ---------- */
    // Removed frontend filtering - now using backend search via fetchStaff

    /* ---------- add / edit / delete ---------- */
    const addWalkout = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const finalItemName =
            selectedItem?.name || fd.get("itemName")?.toString().trim();
        const finalItemType =
            selectedType?.name || fd.get("itemType")?.toString().trim();

        if (!selectedStaff || !finalItemName || !finalItemType) {
            toast.error(
                "Please complete all fields (staff, item name, item type)"
            );
            return;
        }

        try {
            const { data } = await axiosInstance.post(
                "/owner/addWalkout",
                {
                    itemId: selectedItem?.id || null,
                    itemName: finalItemName,
                    itemTypeId: selectedType?.id || null,
                    itemTypeName: finalItemType,
                    description: fd.get("description"),
                    priority: selectedPriority,
                    staffId: selectedStaff.id,
                }
            );

            if (data?.success) {
                const newWalkout = data.walkout;

                setEntries((prev) => [newWalkout, ...prev]);
                setTodayCount((prev) => prev + 1);
                setWeekCount((prev) => prev + 1);
                if (newWalkout.priority === "High")
                    setPriorityCount((prev) => prev + 1);

                pushActivity(
                    "Added",
                    finalItemName,
                    selectedPriority || "Normal"
                );
                setSelectedPriority("");
                setQuery("");
                setItemQuery("");
                setTypeQuery("");
                setSelectedStaff(null);
                setSelectedItem(null);
                setSelectedType(null);
                setShowAddModal(false);
                toast.success("Walk-out recorded successfully!");
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response: any = await logoutOwner();
                if (response?.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                dispatch(clearUser());
                toast.error("Session Expired. Please login again");
                } else {
                    console.error("Internal server error");
                    toast.error("Something went wrong. Please try again.");
                }
            } else {
                toast.error(
                    err.response?.data?.message || "Failed to record walk-out"
                );
            }
        }
    };

    const handleEdit = (entry: any) => {
        setEditingEntry(entry);
        setSelectedPriority(entry.priority);
        setQuery(entry.staff.name);
        setSelectedStaff(entry.staff);
        /* pre-fill item & type if backend returns them */
        if (entry.item) {
            setSelectedItem({ id: entry.item.id, name: entry.itemName.name });
            setItemQuery(entry.itemName.name);
        }
        if (entry.itemType) {
            setSelectedType({
                id: entry.itemType.id,
                name: entry.itemType.name,
            });
            setTypeQuery(entry.itemType.name);
        }
        setShowEditModal(true);
    };

    const editWalkout = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedStaff || !selectedItem || !selectedType) {
            toast.error("Please complete all fields (staff, item, type)");
            return;
        }
        const fd = new FormData(e.currentTarget);
        try {
            const { data } = await axiosInstance.put(
                `/owner/editWalkout/${editingEntry.id}`,
                {
                    itemId: selectedItem.id,
                    itemName: selectedItem.name,
                    itemTypeId: selectedType.id,
                    itemTypeName: selectedType.name,
                    description: fd.get("description"),
                    priority: selectedPriority,
                    staffId: selectedStaff.id,
                }
            );
            if (data.success) {
                setEntries((prev) =>
                    prev.map((entry) =>
                        entry.id === Number(editingEntry.id)
                            ? data.edited
                            : entry
                    )
                );
                pushActivity(
                    "Edited",
                    selectedItem.name,
                    selectedPriority || "Normal"
                );

                setShowEditModal(false);
                setEditingEntry(null);
                setSelectedPriority("");
                setQuery("");
                setItemQuery("");
                setTypeQuery("");
                setSelectedStaff(null);
                setSelectedItem(null);
                setSelectedType(null);

                toast.success("Walk-out updated successfully!");
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response: any = await logoutOwner();
                if (response?.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                dispatch(clearUser());
                toast.error("Session Expired. Please login again");
                } else {
                    console.error("Internal server error");
                    toast.error("Something went wrong. Please try again.");
                }
            } else {
                toast.error(
                    err.response?.data?.message || "Failed to update walk-out"
                );
            }
        }
    };
    /* ---------- DELETE ---------- */
    const deleteWalkout = async () => {
        if (!deletingId) return;
        try {
            const deleted = entries.find((e) => e.id === deletingId);
            await axiosInstance.delete(`/owner/dltWalkt/${deletingId}`);

            setEntries((prev) => prev.filter((e) => e.id !== deletingId));
            setTodayCount((prev) => Math.max(0, prev - 1));
            setWeekCount((prev) => Math.max(0, prev - 1));
            if (deleted?.priority === "High")
                setPriorityCount((prev) => Math.max(0, prev - 1));

            pushActivity(
                "Deleted",
                deleted?.itemName?.name || "N/A",
                deleted?.priority || "Normal"
            );

            toast.success("Walk-out deleted");
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response: any = await logoutOwner();
                if (response?.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                dispatch(clearUser());
                    toast.error("Session Expired. Please login again");
                } else {
                    console.error("Internal server error");
                    toast.error("Something went wrong. Please try again.");
                }
            } else {
                toast.error(err.response?.data?.message || "Delete failed");
            }
        } finally {
            setShowDeleteModal(false);
            setDeletingId(null);
        }
    };

    /* ---------- render ---------- */
    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto p-4 space-y-4">
                {/* stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-gray-600 mb-1">Today</p>
                            <p className="text-2xl font-bold text-[#FF3F33]">
                                {todayCount}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-gray-600 mb-1">
                                This Week
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                                {weekCount}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-gray-600 mb-1">
                                High Alert
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {priorityCount}
                            </p>
                        </CardContent>
                    </Card>
                </div>


               
                {entries.length === 0 ? (
                        <Card className="bg-white mt-4 p-8 rounded-xl shadow-sm">
                            <div className="flex flex-col items-center">
                                <UserX className="h-14 w-14 mb-3 text-gray-300" />
                                <p className="text-sm text-gray-500">No walk-outs found</p>
                            </div>
                        </Card>
                    ) : (
                    <div className="space-y-3 mt-4">
                        {entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="relative p-4 flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-shadow">
                                    <Badge
                                        className={`${getSeverityColor(
                                            entry.priority
                                        )} capitalize text-xs absolute top-3 right-3`}
                                    >
                                        {entry.priority}
                                    </Badge>
                                    <div className="mb-1">
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {entry.itemName?.name || "N/A"}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Type: {entry.type?.name || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <span>{entry.staff.name}</span>
                                        <span className="text-gray-400">•</span>
                                        <span>{entry.staff.section}</span>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                            💬 Description:
                                        </p>
                                        <p className="text-sm text-gray-900">
                                            {entry.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {/* <span>
                                                {new Date(
                                                    entry.created_at
                                                ).toLocaleDateString()}
                                            </span> */}

                                            {/* <Clock size={14} /> */}
                                            <span>
                                                {formatTimeAgo(
                                                    entry.created_at
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 ml-auto">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() =>
                                                    handleEdit(entry)
                                                }
                                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setDeletingId(entry.id);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>



            

            {/* floating add button mobile */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-20 right-6 bg-[#FF3F33] text-white p-4 rounded-full shadow-lg hover:bg-[#E6362A] transition-colors sm:hidden z-20"
            >
                <Plus size={24} />
            </motion.button>

            {/* ---------- ADD MODAL ---------- */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowAddModal(false);
                            setQuery("");
                            setItemQuery("");
                            setTypeQuery("");
                            setSelectedStaff(null);
                            setSelectedItem(null);
                            setSelectedType(null);
                            setSelectedPriority("");
                        }}
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
                                    Record Walk-Out
                                </h2>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setQuery("");
                                        setItemQuery("");
                                        setTypeQuery("");
                                        setSelectedStaff(null);
                                        setSelectedItem(null);
                                        setSelectedType(null);
                                        setSelectedPriority("");
                                    }}
                                >
                                    <X
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </motion.button>
                            </div>
                            <form
                                onSubmit={addWalkout}
                                className="p-6 grid gap-5"
                            >
                                {/* Row 1: Item Name + Item Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Item Name */}
                                    <div
                                        className="flex flex-col gap-1 relative"
                                        ref={itemDropdownRef}
                                    >
                                        <Label htmlFor="add-item">
                                            Item Name
                                        </Label>
                                        <div className="relative flex items-center">
                                            <User
                                                className="absolute left-3 text-gray-400"
                                                size={18}
                                            />
                                            <Input
                                                id="add-item"
                                                name="itemName" // Add this so FormData can read it
                                                placeholder="Start typing item name…"
                                                value={itemQuery}
                                                onChange={(e) => {
                                                    setItemQuery(
                                                        e.target.value
                                                    );
                                                    setSelectedItem(null);
                                                }}
                                                autoComplete="off"
                                                className="pl-9"
                                            />

                                            {itemLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {filteredItems.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredItems.map((it) => (
                                                    <button
                                                        type="button"
                                                        key={it.id}
                                                        onClick={() => {
                                                            setItemQuery(
                                                                it.name
                                                            );
                                                            setSelectedItem(it);
                                                            setFilteredItems(
                                                                []
                                                            );
                                                        }}
                                                        className="w-full px-3 py-2 hover:bg-gray-100 text-left text-sm"
                                                    >
                                                        {it.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Type */}
                                    <div
                                        className="flex flex-col gap-1 relative"
                                        ref={typeDropdownRef}
                                    >
                                        <Label htmlFor="add-type">
                                            Item Type
                                        </Label>
                                        <div className="relative flex items-center">
                                            <Flag
                                                className="absolute left-3 text-gray-400"
                                                size={18}
                                            />
                                            <Input
                                                id="add-type"
                                                name="itemType"
                                                placeholder="Start typing type…"
                                                value={typeQuery}
                                                onChange={(e) => {
                                                    setTypeQuery(
                                                        e.target.value
                                                    );
                                                    setSelectedType(null);
                                                }}
                                                autoComplete="off"
                                                className="pl-9"
                                            />
                                            {typeLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {filteredTypes.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredTypes.map((ty) => (
                                                    <button
                                                        type="button"
                                                        key={ty.id}
                                                        onClick={() => {
                                                            setTypeQuery(
                                                                ty.name
                                                            );
                                                            setSelectedType(ty);
                                                            setFilteredTypes(
                                                                []
                                                            );
                                                        }}
                                                        className="w-full px-3 py-2 hover:bg-gray-100 text-left text-sm"
                                                    >
                                                        {ty.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Reason */}
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="add-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="add-description"
                                        name="description"
                                        placeholder="Enter description about walkout"
                                        className="min-h-[60px]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Label>Priority Level</Label>
                                        <RadioGroup
                                            value={selectedPriority}
                                            onValueChange={setSelectedPriority}
                                            className="flex gap-6 mt-1"
                                        >
                                            {["Low", "Medium", "High"].map(
                                                (level) => (
                                                    <div
                                                        key={level}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <RadioGroupItem
                                                            value={level}
                                                            id={level.toLowerCase()}
                                                            className="relative"
                                                        >
                                                            {selectedPriority ===
                                                                level && (
                                                                <motion.div
                                                                    layoutId="highlight"
                                                                    className="absolute inset-0 rounded-full bg-blue-100"
                                                                    initial={{
                                                                        opacity: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                    }}
                                                                    transition={{
                                                                        type: "spring",
                                                                        stiffness: 500,
                                                                        damping: 30,
                                                                    }}
                                                                />
                                                            )}
                                                        </RadioGroupItem>
                                                        <Label
                                                            htmlFor={level.toLowerCase()}
                                                        >
                                                            {level}
                                                        </Label>
                                                    </div>
                                                )
                                            )}
                                        </RadioGroup>
                                    </div>
                                </div>

                                {/* Row 4: Staff */}
                                <div
                                    className="flex flex-col gap-1 relative"
                                    ref={staffDropdownRef}
                                >
                                    <Label htmlFor="add-staff">
                                        Staff Member{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative flex items-center">
                                        <Users
                                            className="absolute left-3 text-gray-400"
                                            size={18}
                                        />
                                        <Input
                                            id="add-staff"
                                            placeholder="Enter staff name…"
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                setSelectedStaff(null);
                                            }}
                                            onFocus={() => setIsStaffInputFocused(true)}
                                            onBlur={() => {
                                                // Delay hiding to allow clicking on dropdown items
                                                setTimeout(() => setIsStaffInputFocused(false), 200);
                                            }}
                                            autoComplete="off"
                                            className="pl-9"
                                            required
                                        />
                                        {itemLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {filteredStaff.length > 0 &&
                                        !selectedStaff &&
                                        isStaffInputFocused && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredStaff.map((staff) => (
                                                    <button
                                                        type="button"
                                                        key={staff.id}
                                                        onClick={() => {
                                                            setSelectedStaff(
                                                                staff
                                                            );
                                                            setQuery(
                                                                staff.name
                                                            );
                                                            setFilteredStaff(
                                                                []
                                                            );
                                                        }}
                                                        className="w-full flex justify-between items-center px-3 py-2 hover:bg-gray-100 transition-colors"
                                                    ><span className="font-medium">{staff.name}</span>
<span className="text-xs text-gray-500">
  ID: {staff.uniqueId} • Floor: {staff.floor?.name}
</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    {selectedStaff && (
                                        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <strong>{selectedStaff.name}</strong> (ID: {selectedStaff.uniqueId}, Floor: {selectedStaff.floor?.name})
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStaff(null);
                                                    setQuery("");
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setQuery("");
                                            setItemQuery("");
                                            setTypeQuery("");
                                            setSelectedStaff(null);
                                            setSelectedItem(null);
                                            setSelectedType(null);
                                            setSelectedPriority("");
                                        }}
                                        className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!selectedStaff}
                                        className="flex-1 bg-[#FF3F33] text-white rounded-lg py-2 hover:bg-[#E6362A] disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Submit
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------- EDIT MODAL ---------- */}
            <AnimatePresence>
                {showEditModal && editingEntry && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowEditModal(false);
                            setEditingEntry(null);
                            setQuery("");
                            setItemQuery("");
                            setTypeQuery("");
                            setSelectedStaff(null);
                            setSelectedItem(null);
                            setSelectedType(null);
                            setSelectedPriority("");
                        }}
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
                                    Edit Walk-Out
                                </h2>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingEntry(null);
                                        setQuery("");
                                        setItemQuery("");
                                        setTypeQuery("");
                                        setSelectedStaff(null);
                                        setSelectedItem(null);
                                        setSelectedType(null);
                                        setSelectedPriority("");
                                    }}
                                >
                                    <X
                                        size={20}
                                        className="text-gray-500 hover:text-gray-800"
                                    />
                                </motion.button>
                            </div>

                            <form
                                onSubmit={editWalkout}
                                className="p-6 grid gap-5"
                            >
                                {/* Row 1: Item Name + Item Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Item Name */}
                                    <div
                                        className="flex flex-col gap-1 relative"
                                        ref={itemDropdownRef}
                                    >
                                        <Label htmlFor="edit-item">
                                            Item Name
                                        </Label>
                                        <div className="relative flex items-center">
                                            <User
                                                className="absolute left-3 text-gray-400"
                                                size={18}
                                            />
                                            <Input
                                                id="edit-item"
                                                name="itemName"
                                                placeholder="Start typing item name…"
                                                value={itemQuery}
                                                onChange={(e) => {
                                                    setItemQuery(
                                                        e.target.value
                                                    );
                                                    setSelectedItem(null);
                                                }}
                                                autoComplete="off"
                                                className="pl-9"
                                            />
                                            {itemLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {filteredItems.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredItems.map((it) => (
                                                    <button
                                                        type="button"
                                                        key={it.id}
                                                        onClick={() => {
                                                            setItemQuery(
                                                                it.name
                                                            );
                                                            setSelectedItem(it);
                                                            setFilteredItems(
                                                                []
                                                            );
                                                        }}
                                                        className="w-full px-3 py-2 hover:bg-gray-100 text-left text-sm"
                                                    >
                                                        {it.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Type */}
                                    <div
                                        className="flex flex-col gap-1 relative"
                                        ref={typeDropdownRef}
                                    >
                                        <Label htmlFor="edit-type">
                                            Item Type
                                        </Label>
                                        <div className="relative flex items-center">
                                            <Flag
                                                className="absolute left-3 text-gray-400"
                                                size={18}
                                            />
                                            <Input
                                                id="edit-type"
                                                name="itemType"
                                                placeholder="Start typing type…"
                                                value={typeQuery}
                                                onChange={(e) => {
                                                    setTypeQuery(
                                                        e.target.value
                                                    );
                                                    setSelectedType(null);
                                                }}
                                                autoComplete="off"
                                                className="pl-9"
                                            />
                                            {typeLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {filteredTypes.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredTypes.map((ty) => (
                                                    <button
                                                        type="button"
                                                        key={ty.id}
                                                        onClick={() => {
                                                            setTypeQuery(
                                                                ty.name
                                                            );
                                                            setSelectedType(ty);
                                                            setFilteredTypes(
                                                                []
                                                            );
                                                        }}
                                                        className="w-full px-3 py-2 hover:bg-gray-100 text-left text-sm"
                                                    >
                                                        {ty.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Description */}
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="edit-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="edit-description"
                                        name="description"
                                        placeholder="Enter description about walkout"
                                        defaultValue={editingEntry.description}
                                        className="min-h-[60px]"
                                        required
                                    />
                                </div>

                                {/* Row 3: Priority Level */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Label>Priority Level</Label>
                                        <RadioGroup
                                            value={selectedPriority}
                                            onValueChange={setSelectedPriority}
                                            className="flex gap-6 mt-1"
                                        >
                                            {["Low", "Medium", "High"].map(
                                                (level) => (
                                                    <div
                                                        key={level}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <RadioGroupItem
                                                            value={level}
                                                            id={`edit-${level.toLowerCase()}`}
                                                            className="relative"
                                                        >
                                                            {selectedPriority ===
                                                                level && (
                                                                <motion.div
                                                                    layoutId="edit-highlight"
                                                                    className="absolute inset-0 rounded-full bg-blue-100"
                                                                    initial={{
                                                                        opacity: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                    }}
                                                                    transition={{
                                                                        type: "spring",
                                                                        stiffness: 500,
                                                                        damping: 30,
                                                                    }}
                                                                />
                                                            )}
                                                        </RadioGroupItem>
                                                        <Label
                                                            htmlFor={`edit-${level.toLowerCase()}`}
                                                        >
                                                            {level}
                                                        </Label>
                                                    </div>
                                                )
                                            )}
                                        </RadioGroup>
                                    </div>
                                </div>

                                {/* Row 4: Staff */}
                                <div
                                    className="flex flex-col gap-1 relative"
                                    ref={staffDropdownRef}
                                >
                                    <Label htmlFor="edit-staff">
                                        Staff Member{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative flex items-center">
                                        <Users
                                            className="absolute left-3 text-gray-400"
                                            size={18}
                                        />
                                        <Input
                                            id="edit-staff"
                                            placeholder="Enter staff name…"
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                setSelectedStaff(null);
                                            }}
                                            onFocus={() => setIsStaffInputFocused(true)}
                                            onBlur={() => {
                                                // Delay hiding to allow clicking on dropdown items
                                                setTimeout(() => setIsStaffInputFocused(false), 200);
                                            }}
                                            autoComplete="off"
                                            className="pl-9"
                                            required
                                        />
                                        {itemLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {filteredStaff.length > 0 &&
                                        !selectedStaff &&
                                        isStaffInputFocused && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredStaff.map((staff) => (
                                                    <button
                                                        type="button"
                                                        key={staff.id}
                                                        onClick={() => {
                                                            setSelectedStaff(
                                                                staff
                                                            );
                                                            setQuery(
                                                                staff.name
                                                            );
                                                            setFilteredStaff(
                                                                []
                                                            );
                                                        }}
                                                        className="w-full flex justify-between items-center px-3 py-2 hover:bg-gray-100 transition-colors"
                                                    >
                                                       <span className="font-medium">{staff.name}</span>
<span className="text-xs text-gray-500">
  ID: {staff.uniqueId} • Floor: {staff.floor?.name}
</span>
                      
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    {selectedStaff && (
                                        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-700">
                                                     <strong>{selectedStaff.name}</strong> (ID: {selectedStaff.uniqueId}, Floor: {selectedStaff.floor?.name})
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStaff(null);
                                                    setQuery("");
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                               

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingEntry(null);
                                            setQuery("");
                                            setItemQuery("");
                                            setTypeQuery("");
                                            setSelectedStaff(null);
                                            setSelectedItem(null);
                                            setSelectedType(null);
                                            setSelectedPriority("");
                                        }}
                                        className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={
                                            !selectedStaff ||
                                            !selectedItem ||
                                            !selectedType
                                        }
                                        className="flex-1 bg-[#FF3F33] text-white rounded-lg py-2 hover:bg-[#E6362A] disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Update Walk-Out
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------- DELETE MODAL ---------- */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(false)}
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
                                    Are you sure you want to delete this
                                    walk-out record? This action cannot be
                                    undone.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() =>
                                            setShowDeleteModal(false)
                                        }
                                        className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={deleteWalkout}
                                        className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700"
                                    >
                                        Delete
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
