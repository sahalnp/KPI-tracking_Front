import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Save,
    Star,
    Phone,
    Users,
    AlertCircle,
    MapPin,
    Briefcase,
    Search,
    Filter,
    X,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import { axiosInstance } from "@/api/axios";
import { logoutOwner } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const isToday = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    const t = new Date();
    return d.toDateString() === t.toDateString();
};

export function OwnerScoringForm() {
    const [view, setView] = useState<"list" | "scoring">("list");
    const [staff, setStaff] = useState<any[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedFloor, setSelectedFloor] = useState("");

    const [kpis, setKpis] = useState<any[]>([]);
    const [scores, setScores] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true); // global first load
    const [loadingScore, setLoadingScore] = useState(false);
    const dispatch = useDispatch();
     const hasKPIs = Array.isArray(kpis) && kpis.length > 0;

    /* --------------------  Derived  -------------------- */
    const roles = [...new Set(staff.map((s) => s.role))];
    const floors = [
        ...new Set(staff.map((s) => s.floor?.name).filter(Boolean)),
    ];
    // /* ----------  helper  ---------- */
    // const extractScoreInfo = (arr: any[] = []) => {
    //     if (!arr.length) return { isScoredToday: false, lastAvg: 0 };
    //     const latest = [...arr].sort(
    //         (a, b) =>
    //             new Date(b.createdAt || 0).getTime() -
    //             new Date(a.createdAt || 0).getTime()
    //     )[0];
    //     return {
    //         isScoredToday:
    //             latest.createdAt &&
    //             new Date(latest.createdAt).toDateString() ===
    //                 new Date().toDateString(),
    //         lastAvg: Number(latest.score) || 0,
    //     };
    // };
    useEffect(() => {
        (async () => {
            try {
                const [usersRes, kpiRes] = await Promise.all([
                    axiosInstance.get<any>("/owner/staff-scoring"),
                    axiosInstance.get<any[]>("/owner/scoreKPI"),
                ]);

                setStaff(usersRes.data.usersRes);
                setKpis(kpiRes.data.kpis);
                
            } catch (err: any) {
                console.error("Error fetching data:", err);
                if (err.response?.status === 401) {
                    const response = await logoutOwner();
                    if (response.success) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        dispatch(clearUser());
                    } else {
                        console.error("Logout failed on backend");
                    }
                }
                toast.error(
                    err.response?.data?.message ||
                        "Failed to load data. Please try again."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* --------------------  Filter logic  -------------------- */
    useEffect(() => {
        let f = staff;
        if (searchQuery)
            f = f.filter(
                (s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.mobile.includes(searchQuery)
            );
        if (selectedRole) f = f.filter((s) => s.role === selectedRole);
        if (selectedFloor) f = f.filter((s) => s.floor?.name === selectedFloor);
        setFilteredStaff(f);
    }, [searchQuery, selectedRole, selectedFloor, staff]);

    const initialiseScores = () => {
        if (!Array.isArray(kpis) || !kpis.length) return; // ← guard
        const base: any = {};
        kpis.forEach((k) => (base[k.id] = { score: 0, comment: "" }));
        setScores(base);
    };
    const handleStaffClick = async (member: any) => {
        setSelectedStaff(member);
        setLoadingScore(true);
        try {
            if (member.isScored) {
                const { data } = await axiosInstance.get<any>(
                    `/owner/userscore/${member.id}`
                );
                console.log(data.kpis, "jhjklhjkhjkl");

                // Transform the kpis array into scores object format
                const transformedScores: any = {};
                if (data.kpis && Array.isArray(data.kpis)) {
                    data.kpis.forEach((kpi: any) => {
                        transformedScores[kpi.kpi_id] = {
                            score: kpi.score || 0,
                            comment: kpi.comment || "",
                        };
                    });
                }
                setScores(transformedScores);
            } else {
                initialiseScores();
            }
            setView("scoring");
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response = await logoutOwner();
                if (response.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    dispatch(clearUser());
                } else {
                    console.error("Logout failed on backend");
                }
            }
        } finally {
            setLoadingScore(false);
        }
    };

    /* --------------------  Form helpers  -------------------- */
    const updateScore = (id: string, val: number) =>
        setScores((p: any) => ({ ...p, [id]: { ...p[id], score: val } }));
    const updateComment = (id: string, txt: string) =>
        setScores((p: any) => ({ ...p, [id]: { ...p[id], comment: txt } }));

    const calcAvg = (d: any) => {
        const values = Object.values(d) as { score: number }[];
        const total = values.reduce((sum, item) => sum + item.score, 0);
        return (total / kpis.length).toFixed(1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const scoresArray = Object.entries(scores).map(
            ([kpiId, { score, comment }]) => {
                const kpi = kpis.find((k) => k.id === kpiId);
                return { kpiId, score, comment, weight: kpi?.weight ?? 1 };
            }
        );

        /* ---------- 1. SUBMIT (only this can fail the save) ---------- */
        try {
            const payload = { staffId: selectedStaff!.id, scores: scoresArray };
            if (selectedStaff!.isScored) {
                await axiosInstance.put(
                    `/owner/updateScore/${selectedStaff!.id}`,
                    payload
                );
            } else {
                await axiosInstance.post("/owner/submit-score", payload);
            }
            toast.success("Score saved!"); // ✅ only when submit really worked
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response = await logoutOwner();
                if (response.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    dispatch(clearUser());
                } else {
                    console.error("Logout failed on backend");
                }
            } else {
                toast.error(err.response?.data?.message || "Save failed");
            }
            setIsSubmitting(false);
            return; // stop here – don't refresh lists
        }

        /* ---------- 2. REFRESH LISTS (errors here are silent) ---------- */
        try {
            const { data: fresh } = await axiosInstance.get<any>(
                "/owner/staff-scoring"
            );
            setStaff(fresh.usersRes);
        } catch (err: any) {
            console.log("Refresh staff list failed", err);
            if (err.response?.status === 401) {
                const response = await logoutOwner();
                if (response.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    dispatch(clearUser());
                } else {
                    console.error("Logout failed on backend");
                }
            }
            // Fallback: update local state immediately
            setStaff((prevStaff) =>
                prevStaff.map((s) =>
                    s.id === selectedStaff!.id ? { ...s, isScored: true } : s
                )
            );
        }

        setView("list");
        setSelectedStaff(null);
        setScores({});
        setIsSubmitting(false);
    };

    //     const handleSubmit = async () => {
    //   setIsSubmitting(true);

    //   const scoresArray = Object.entries(scores).map(
    //     ([kpiId, { score, comment }]) => {
    //       const kpi = kpis.find((k) => k.id === kpiId);
    //       return { kpiId, score, comment, weight: kpi?.weight ?? 1 };
    //     }
    //   );

    //   /* ---------- 1. SUBMIT (only this can fail the save) ---------- */
    //   try {
    //     const payload = { staffId: selectedStaff!.id, scores: scoresArray };
    //     if (selectedStaff!.isScored) {
    //       await axiosInstance.put(`/owner/updateScore/${selectedStaff!.id}`, payload);
    //     } else {
    //       await axiosInstance.post("/owner/submit-score", payload);
    //     }
    //     toast.success("Score saved!"); // ✅ only when submit really worked
    //   } catch (err: any) {
    //     if (err.response?.status === 401) {
    //       localStorage.removeItem("accesstoken");
    //       localStorage.removeItem("refreshtoken");
    //       await logoutOwner();
    //       dispatch(clearUser());
    //       toast.error("Session Expired. Please login again");
    //     } else {
    //       toast.error(err.response?.data?.message || "Save failed");
    //     }
    //     setIsSubmitting(false);
    //     return; // stop here – don’t refresh lists
    //   }

    //   try {
    //     const { data: fresh } = await axiosInstance.get<any[]>("/owner/getUsers");
    //     setStaff(
    //       fresh.map((u) => ({
    //         ...u,
    //         isScored: isToday(u.lastScoreDate),
    //         score: u.lastScore || 0,
    //       }))
    //     );
    //   } catch (e) {
    //     console.warn("Refresh staff list failed", e); // silent
    //   }

    //   setView("list");
    //   setSelectedStaff(null);
    //   setScores({});
    //   setIsSubmitting(false);
    // };

    //     const handleSubmit = async () => {
    //         setIsSubmitting(true);

    //         /* ---- NEW: convert scores-object to array ---- */
    //         const scoresArray = Object.entries(scores).map(
    //             ([kpiId, { score, comment }]) => {
    //                 const kpi = kpis.find((k) => k.id === kpiId); // ← full KPI row
    //                 return {
    //                     kpiId,
    //                     score,
    //                     comment,
    //                     weight: kpi?.weight ?? 1,
    //                 };
    //             }
    //         );

    //         try {
    //             const payload = { staffId: selectedStaff!.id, scores: scoresArray };
    //             if (!selectedStaff) return;

    //             if (selectedStaff!.isScored) {
    //                 await axiosInstance.put(
    //                     `/owner/updateScore/${selectedStaff!.id}`,
    //                     payload
    //                 );
    //             } else {
    //                 await axiosInstance.post("/owner/submit-score", payload);
    //             }
    //             const { data: fresh } = await axiosInstance.get<any[]>(
    //                 "/owner/getUsers"
    //             );
    //             setStaff(
    //     fresh.map((u) => {
    //         const lastScore = u.lastScore || 0; // backend should send this
    //         return {
    //             ...u,
    //             isScored: isToday(u.lastScoreDate),
    //             score: lastScore,
    //         };
    //     })
    // );

    //             setView("list");
    //             setSelectedStaff(null);
    //             setScores({});
    //         } catch (err: any) {
    //             if (err.response?.status === 401) {
    //                 localStorage.removeItem("accesstoken");
    //                 localStorage.removeItem("refreshtoken");
    //                 await logoutOwner();
    //                 dispatch(clearUser());
    //                 toast.error("Session Expired. Please login again");
    //             } else {
    //                toast.error(err.response?.data?.message || "Internal Server Error");
    //             }
    //         } finally {
    //             setIsSubmitting(false);
    //         }
    //     };

    /* --------------------  Reset filters  -------------------- */
    const handleReset = () => {
        setSearchQuery("");
        setSelectedRole("");
        setSelectedFloor("");
    };

    /* --------------------  Loading guards  -------------------- */
    if (loading) return <LoadingSpinner />;
    if (view === "scoring" && loadingScore) return <LoadingSpinner />;

    if (view === "scoring" && selectedStaff) {
        const average = Object.keys(scores).length ? calcAvg(scores) : "0.0";
        const isUpdate = selectedStaff.isScored ?? false;

        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-sm p-4"
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {isUpdate ? "Update Scores" : "Staff Scoring"}
                        </h1>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setView("list")}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Back to List
                        </motion.button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ---------- Left column – criteria ---------- */}
                    <motion.div
                        className="lg:col-span-2 space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-[#FF3F33]" />
                                    Performance Evaluation
                                </CardTitle>
                                <CardDescription>
                                    Rate each criterion on a scale of 1-5
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <AnimatePresence>
                                    {kpis.map((k, idx) => (
                                        <motion.div
                                            key={k.id}
                                            className="space-y-4 p-4 border rounded-lg"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: idx * 0.1,
                                            }}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        {k.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {k.description}
                                                    </p>
                                                </div>
                                                <motion.div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                    <span className="text-sm text-gray-500">
                                                        Score:
                                                    </span>
                                                    <motion.div
                                                        key={
                                                            scores[k.id]?.score
                                                        }
                                                        animate={{ scale: 1 }}
                                                        initial={{ scale: 1.3 }}
                                                        transition={{
                                                            duration: 0.3,
                                                        }}
                                                    >
                                                        <Badge
                                                            className={`${
                                                                scores[k.id]
                                                                    ?.score >= 4
                                                                    ? "border-green-500 text-green-700 bg-green-50"
                                                                    : scores[
                                                                          k.id
                                                                      ]
                                                                          ?.score >=
                                                                      3
                                                                    ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                                                                    : scores[
                                                                          k.id
                                                                      ]?.score >
                                                                      0
                                                                    ? "border-red-500 text-red-700 bg-red-50"
                                                                    : "border-gray-300 text-gray-500 bg-gray-50"
                                                            }`}
                                                        >
                                                            {scores[k.id]
                                                                ?.score || 0}
                                                            /5
                                                        </Badge>
                                                    </motion.div>
                                                </motion.div>
                                            </div>

                                            {/* 5 buttons */}
                                            <div className="flex justify-between mt-4 px-2 gap-2">
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <motion.button
                                                        key={n}
                                                        onClick={() =>
                                                            updateScore(k.id, n)
                                                        }
                                                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-medium transition-all ${
                                                            scores[k.id]
                                                                ?.score >= n
                                                                ? "bg-[#FF3F33] text-white border-[#FF3F33]"
                                                                : "bg-white border-gray-300 text-gray-400 hover:border-[#FF3F33] hover:text-[#FF3F33]"
                                                        }`}
                                                        whileHover={{
                                                            scale: 1.15,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.9,
                                                        }}
                                                        animate={
                                                            scores[k.id]
                                                                ?.score >= n
                                                                ? { scale: 1.1 }
                                                                : { scale: 1 }
                                                        }
                                                        transition={{
                                                            duration: 0.2,
                                                        }}
                                                    >
                                                        {n}
                                                    </motion.button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
                                                <span>Poor</span>
                                                <span>Fair</span>
                                                <span>Good</span>
                                                <span>V.Good</span>
                                                <span>Excellent</span>
                                            </div>

                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <Textarea
                                                    placeholder={`Add comments for ${k.name.toLowerCase()}…`}
                                                    value={
                                                        scores[k.id]?.comment ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateComment(
                                                            k.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    rows={2}
                                                    className="mt-2"
                                                />
                                            </motion.div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* ---------- Right column – summary + staff info + button ---------- */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="space-y-6"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Evaluation Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <motion.div
                                    className="text-center"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        delay: 0.4,
                                    }}
                                >
                                    <motion.div
                                        className="text-3xl font-bold text-[#FF3F33]"
                                        key={average}
                                        animate={{ scale: 1 }}
                                        initial={{ scale: 1.5 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {average}
                                    </motion.div>
                                    <div className="text-sm text-gray-500">
                                        Average Score
                                    </div>
                                </motion.div>

                                <div className="space-y-2">
                                    {kpis.map((k, idx) => (
                                        <motion.div
                                            key={k.id}
                                            className="flex justify-between items-center"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: 0.4 + idx * 0.1,
                                            }}
                                        >
                                            <span className="text-sm text-gray-600">
                                                {k.name}
                                            </span>
                                            <motion.span
                                                key={scores[k.id]?.score}
                                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${
                                                    scores[k.id]?.score >= 4
                                                        ? "bg-green-500"
                                                        : scores[k.id]?.score >=
                                                          3
                                                        ? "bg-yellow-500"
                                                        : scores[k.id]?.score >
                                                          0
                                                        ? "bg-red-500"
                                                        : "bg-gray-300"
                                                }`}
                                                animate={{ scale: 1 }}
                                                initial={{ scale: 1.3 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {scores[k.id]?.score || 0}
                                            </motion.span>
                                        </motion.div>
                                    ))}
                                </div>

                                {Object.values(scores).some(
                                    (s) => s.score === 0
                                ) && (
                                    <motion.div
                                        className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-800">
                                            Please rate all criteria before
                                            submitting
                                        </p>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Staff Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-500">
                                            Name:
                                        </span>
                                        <span className="font-medium">
                                            {selectedStaff.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-500">
                                            Role:
                                        </span>
                                        <span className="font-medium">
                                            {selectedStaff.role}
                                        </span>
                                    </div>
                                    {selectedStaff.section && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-500">
                                                Section:
                                            </span>
                                            <span className="font-medium">
                                                {selectedStaff.section}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-500">
                                            Phone:
                                        </span>
                                        <span className="font-medium">
                                            {selectedStaff.mobile}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSubmit}
                                disabled={
        isSubmitting ||
        !hasKPIs ||                       // ← NEW
        Object.values(scores).some((s) => s.score === 0)
    }
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#FF3F33] hover:bg-[#E6362A] text-primary-foreground h-10 px-4 py-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                            className="mr-2"
                                        >
                                            <Save className="h-4 w-4" />
                                        </motion.div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isUpdate ? "Update Score" : "Submit"}
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Staff Scoring
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Manage and create weekly performance evaluations for your
                    team
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#FF3F33]" />
                                Staff Members
                            </CardTitle>
                            <div className="flex gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSearchOpen((s) => !s)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 hover:text-accent-foreground h-9 px-3"
                                >
                                    <Search className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilterOpen((s) => !s)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 hover:text-accent-foreground h-9 px-3"
                                >
                                    <Filter className="h-4 w-4" />
                                </motion.button>
                                {(searchQuery ||
                                    selectedRole ||
                                    selectedFloor) && (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleReset}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 hover:text-accent-foreground h-9 px-3"
                                    >
                                        <X className="h-4 w-4" />
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <AnimatePresence>
                            {searchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Input
                                        placeholder="Search "
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="mb-4"
                                        autoFocus
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {filterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-3 p-4 bg-gray-50 rounded-lg mb-4"
                                >
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Role
                                        </Label>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) =>
                                                setSelectedRole(e.target.value)
                                            }
                                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="">All Roles</option>
                                            {roles.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Floor
                                        </Label>
                                        <select
                                            value={selectedFloor}
                                            onChange={(e) =>
                                                setSelectedFloor(e.target.value)
                                            }
                                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="">All Floors</option>
                                            {floors.map((f) => (
                                                <option key={f} value={f}>
                                                    {f}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            {filteredStaff.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">
                                            No staff members found
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredStaff.map((member, idx) => (
                                    <motion.div
                                        key={member.id}
                                        onClick={() => handleStaffClick(member)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                            member.isScored
                                                ? "bg-red-50 border-red-200 hover:border-red-400"
                                                : "bg-white border-gray-200 hover:border-gray-400"
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.1 + idx * 0.05,
                                            duration: 0.3,
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5 text-gray-600" />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {member.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {member.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                {member.floor && (
                                                    <p className="text-xs text-gray-500 mt-1 ml-8">
                                                        {member.floor.name}
                                                        -Floor
                                                    </p>
                                                )}
                                            </div>
                                            {member.isScored ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs text-gray-500"
                                                >
                                                    Scored
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs text-gray-500"
                                                >
                                                    Not Scored
                                                </Badge>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
