/* KPIPage.tsx  –  visually identical to OwnerUsers page  */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import {
    Trash2,
    Plus,
    X,
    LayoutGrid,
    Search,
    Loader,
    Edit,
    Grid,
    Filter,
    AlertCircle,
    Info,
    Target,
    Star,
} from "lucide-react";
import { debounce } from "lodash";
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
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { LoadingSpinner } from "@/components/ui/spinner";
import { logoutOwner } from "@/lib/logoutApi";
import { Card, CardContent } from "@/components/ui/card";

/* ---------- types ---------- */
interface KPI {
    id: number;
    name: string;
    weight: number;
    frequency: "daily" | "weekly" | "monthly";
    max_points?: number;
    isDlt?: boolean;
    created_at: Date;
}

interface CreateKPIPayload {
    name: string;
    weight: number;
    frequency: "daily" | "weekly" | "monthly";
}

/* ---------- helper ---------- */
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString() : "N/A");

/* ---------- page ---------- */
export function KPIPage() {
    /* ======  state  ====== */
    const [kpiList, setKpiList] = useState<KPI[]>([]);
    const [filteredKPIs, setFilteredKPIs] = useState<KPI[]>([]);
    const [viewMode] = useState<"card">("card");
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [kpiToDelete, setKpiToDelete] = useState<KPI | null>(null);

    /* modal states */
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<KPI | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
        "daily"
    );
    const [formData, setFormData] = useState({
        name: "",
        weight: "",
    });

    // Filter states
    const [filterSection, setFilterSection] = useState("all");

    const [sections, setSections] = useState<string[]>([]);

    const dispatch = useDispatch();

    const fetchKPIs = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axiosInstance.get("/owner/getKpis");
            let kpis: KPI[] = [];
            let frequencies: string[] = [];
            if (Array.isArray(res.data.kpis.kpis)) {
                kpis = res.data.kpis.kpis;
            } else if (res.data.kpis && Array.isArray(res.data.kpis.kpis)) {
                kpis = res.data.kpis.kpis;
            } else if (Array.isArray(res.data)) {
                kpis = res.data;
            }
            if (
                res.data.kpis.frequencies &&
                Array.isArray(res.data.kpis.frequencies)
            ) {
                frequencies = res.data.kpis.frequencies;
            }
            setSections(frequencies);
            const activeKPIs = Array.isArray(kpis)
                ? kpis.filter((k) => !k.isDlt)
                : [];

            setKpiList(activeKPIs);
            setFilteredKPIs(activeKPIs);
        } catch (err: any) {
            console.error("Fetch KPIs error:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutOwner();
                dispatch(clearUser());
            }
            setError("Failed to load KPIs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIs();
    }, []);

    /* ======  search / filter  ====== */
    useEffect(() => {
        let res = [...kpiList];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            res = res.filter((k) => k.name.toLowerCase().includes(q));
        }
        setFilteredKPIs(res);
        setVisibleCount(12);
    }, [kpiList, searchQuery]);

    const debouncedSearch = React.useCallback(
        debounce((q: string) => setSearchQuery(q), 300),
        []
    );

    /* ======  infinite scroll  ====== */
    const loadMore = () =>
        setVisibleCount((v) => Math.min(v + 12, filteredKPIs.length));

    /* ======  crud  ====== */
    const openModal = (item: KPI | null = null) => {
        setSelectedItem(item);
        setFrequency(item?.frequency ?? "daily");
        if (item) {
            setFormData({
                name: item.name,
                weight: String(item.weight),
            });
        } else {
            setFormData({ name: "", weight: "" });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setIsSubmitting(false);
    };

    const confirmDelete = async () => {
        if (!kpiToDelete) return;

        setIsSubmitting(true);
        try {
            await axiosInstance.delete("/owner/dltKpi", {
                data: { id: kpiToDelete.id },
            });
            setKpiList((prev) => prev.filter((k) => k.id !== kpiToDelete.id));
            toast.success("KPI removed successfully");
        } catch (err: any) {
            console.error("Delete KPI error:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutOwner();
                dispatch(clearUser());
            }
            toast.error(err.response?.data?.message || "Delete failed");
        } finally {
            setShowDeleteModal(false);
            setKpiToDelete(null);
            setIsSubmitting(false);
        }
    };

    const handleSave = async () => {
        const payload: CreateKPIPayload = {
            name: formData.name.trim(),
            weight: Number(formData.weight),
            frequency,
        };

        // Validation
        if (!payload.name || payload.weight === undefined) {
            toast.error("Please fill all required fields");
            return;
        }

        if (payload.weight < 0 || payload.weight > 100) {
            toast.error("Enter weight");
            return;
        }

        if (payload.weight < 0 || payload.weight > 100) {
            toast.error("Weight must be between 0-100");
            return;
        }

        setIsSubmitting(true);
        try {
            if (selectedItem) {
                await axiosInstance.put(
                    `/owner/editKpi/${selectedItem.id}`,
                    payload
                );
                toast.success("KPI updated successfully");
            } else {
                await axiosInstance.post("/owner/addKpi", payload);
                toast.success("KPI added successfully");
            }
            await fetchKPIs();
            closeModal();
        } catch (err: any) {
            console.error("Save KPI error:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutOwner();
                dispatch(clearUser());
            }
            toast.error(err.response?.data?.message ?? "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ======  ui components  ====== */
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
            {filteredKPIs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                    <AlertCircle size={36} className="text-gray-400" />
                    <span>No KPIs found.</span>
                     <button
      onClick={() => openModal()}
      className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
    >
      Add New KPI
    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                       {filteredKPIs.slice(0, visibleCount).map((k) => (
  <motion.div
    key={k.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
  >
    {/* ----  ROW-1  ---- */}
    <div className="flex items-start justify-between">
      {/* LEFT: name + freq badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {k.name}
          </h3>
          <Badge className="bg-blue-100 text-blue-700 capitalize text-xs">
            {k.frequency}
          </Badge>
        </div>
      </div>

      {/* RIGHT: action icons */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => openModal(k)}
          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
          title="Edit KPI"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => {
            setKpiToDelete(k);
            setShowDeleteModal(true);
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete KPI"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    {/* ----  ROW-2: Weight & Points Boxes ---- */}
    <div className="pt-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Weight Box */}
        <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <Target className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Weight</p>
            <p className="text-sm font-semibold text-gray-900">
              {k.weight}%
            </p>
          </div>
        </div>

        {/* Points Box */}
        <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <Star className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Points</p>
            <p className="text-sm font-semibold text-gray-900">
              {k.max_points || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
))}
                    </div>

                    {visibleCount < filteredKPIs.length && (
                        <div className="text-center mt-6">
                            <button
                                onClick={loadMore}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    


    /* ======  loading & error states  ====== */
    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchKPIs}
                        className="px-4 py-2 bg-[#FF3F33] text-white rounded-lg hover:bg-[#E63629] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    /* ======  main render  ====== */
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 py-6 grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">Total KPIs</p>
                        <p className="text-2xl font-bold text-[#FF3F33]">
                            {kpiList.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">Daily</p>
                        <p className="text-2xl font-bold text-green-600">
                            {
                                kpiList.filter((k) => k.frequency === "daily")
                                    .length
                            }
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                            Weekly / Monthly
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                            {
                                kpiList.filter(
                                    (k) =>
                                        k.frequency === "weekly" ||
                                        k.frequency === "monthly"
                                ).length
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>
            {/* <div className="flex gap-2">
            </div> */}

            {/* ----------  Search + Filters (copy-pasted from 2nd code) ---------- */}
            <div className="px-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex flex-row items-center gap-2 w-full">
                        {/* 🔍 Search Bar (Left) */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, frequency..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                         
                        </Button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 flex flex-col sm:flex-row gap-4"
                            >
                                {/* Frequency filter */}
                                <Select
                                    value={filterSection}
                                    onValueChange={setFilterSection}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Filter by Frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Frequencies
                                        </SelectItem>
                                        {sections.map((f) => (
                                            <SelectItem key={f} value={f}>
                                                {f}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Clear */}
                                {(searchQuery || filterSection !== "all") && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setFilterSection("all");
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* content */}
            <div className="-mt-5">
                <CardView />
            </div>

            {/* floating add (mobile) */}
            <button
                onClick={() => openModal()}
                className="fixed bottom-20 right-6 bg-[#FF3F33] text-white p-4 rounded-full shadow-lg hover:bg-[#E63629] sm:hidden z-20 transition-colors"
                title="Add KPI"
            >
                <Plus size={24} />
            </button>

            {/* ======  modals  ====== */}
            <AnimatePresence>
                {/* Detail / View Modal */}
                {showDetailModal && selectedItem && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-lg w-full max-w-md"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    KPI Details
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3 text-sm text-gray-700">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Name:</span>
                                    <span>{selectedItem.name}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Weight:</span>
                                    <span>{selectedItem.weight}%</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                        Frequency:
                                    </span>
                                    <span className="capitalize">
                                        {selectedItem.frequency}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && kpiToDelete && (
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
                                        {kpiToDelete.name}
                                    </span>
                                    ? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setKpiToDelete(null);
                                        }}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                                Deleting...
                                            </div>
                                        ) : (
                                            "Delete"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
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
                            {/* header */}
                            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-xl">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {selectedItem ? "Edit KPI" : "Add New KPI"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-800 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* form */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                                className="p-6 grid gap-5"
                            >
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="kpi-name">
                                        KPI Name{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="kpi-name"
                                        placeholder="Enter KPI name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={isSubmitting}
                                        maxLength={100}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor="kpi-weight">
                                            Weight (%){" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="kpi-weight"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            placeholder="Enter weight"
                                            value={formData.weight}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    weight: e.target.value,
                                                })
                                            }
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="kpi-frequency">
                                        Frequency{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={frequency}
                                        onValueChange={(v: any) =>
                                            setFrequency(v)
                                        }
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger id="kpi-frequency">
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">
                                                Daily
                                            </SelectItem>
                                            <SelectItem value="weekly">
                                                Weekly
                                            </SelectItem>
                                            <SelectItem value="monthly">
                                                Monthly
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#FF3F33] text-white rounded-lg py-2 hover:bg-[#E63629] transition-colors disabled:opacity-50 disabled:hover:bg-[#FF3F33]"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                                {selectedItem
                                                    ? "Updating..."
                                                    : "Saving..."}
                                            </div>
                                        ) : selectedItem ? (
                                            "Update KPI"
                                        ) : (
                                            "Save KPI"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
