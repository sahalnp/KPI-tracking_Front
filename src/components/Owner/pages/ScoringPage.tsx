import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Save,
    Star,
    Phone,
    Users,
    ClipboardList,
    AlertCircle,
    MapPinIcon,
    UserIcon,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { axiosInstance } from "@/api/axios";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { LoadingSpinner } from "@/components/ui/spinner";
import { pushActivity } from "@/lib/setRecentActivity";
import { logoutOwner } from "@/lib/logoutApi";

interface ScoreData {
    [key: string]: {
        score: number;
        comment: string;
    };
}

export function OnwerScoringForm() {
    const [selectedStaff, setSelectedStaff] = useState("");
    const [staff, setStaff] = useState<any[]>([]);
    const [scores, setScores] = useState<ScoreData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [kpis, setKpis] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const [kpisLoading, setKpisLoading] = useState(false);

    const initializeScores = () => {
        const initialScores: ScoreData = {};
        kpis.forEach((criteria) => {
            initialScores[criteria.id] = { score: 0, comment: "" };
        });
        setScores(initialScores);
    };

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get("/owner/staff-scoring");
                setStaff(res.data.staffs);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutOwner();
                    dispatch(clearUser());
                    toast.error("Session Expired. Please login again");
                } else {
                    toast.error("Internal Server Error");
                }
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedStaff) {
            // Reset KPIs when no staff is selected
            setKpis([]);
            return;
        }

        setKpisLoading(true);
        const fetchKpi = async () => {
            try {
                const res = await axiosInstance.get("/owner/getKpis");
                console.log("KPI Response:", res.data.kpis); // Debug log
                setKpis(res.data.kpis.kpis || []);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutOwner();
                    dispatch(clearUser());
                    toast.error("Session Expired. Please login again");
                } else {
                    toast.error("Internal Server Error");
                }
                setKpis([]); // Set empty array on error
            } finally {
                setKpisLoading(false);
            }
        };
        fetchKpi();
    }, [selectedStaff]);

    // Initialize scores after KPIs are loaded
    useEffect(() => {
        if (selectedStaff && kpis && kpis.length > 0) {
            initializeScores();
        }
    }, [selectedStaff, kpis]);

    const updateScore = (criteria: string, score: number) => {
        setScores((prev) => ({
            ...prev,
            [criteria]: { ...prev[criteria], score },
        }));
    };

    const updateComment = (criteria: string, comment: string) => {
        setScores((prev) => ({
            ...prev,
            [criteria]: { ...prev[criteria], comment },
        }));
    };

    const calculateAverageScore = () => {
        const totalScore = Object.values(scores).reduce(
            (sum, score) => sum + score.score,
            0
        );
        return (totalScore / kpis.length).toFixed(1);
    };

    const handleSubmit = async () => {
        if (!selectedStaff) {
            toast.error("Please select staff member");
            return;
        }

        // Check if all scores are filled
        const allScoresFilled = Object.values(scores).every((s) => s.score > 0);
        if (!allScoresFilled) {
            toast.error("Please rate all criteria before submitting");
            return;
        }

        setIsSubmitting(true);

        try {
            const scoresArray = Object.entries(scores).map(
                ([kpi_id, data]) => ({
                    kpi_id,
                    points: data.score,
                    comment: data.comment,
                })
            );

            await axiosInstance.post("/owner/submit-score", {
                staffId: selectedStaff,
                scores: scoresArray,
            });
            const staffName = selectedStaffMember?.name || "Staff";
            pushActivity("Scored", staffName, averageScore);

            setSelectedStaff("");
            setScores({});
            setKpis([]);
            toast.success("Score submitted successfully");
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutOwner();
                dispatch(clearUser());
                toast.error("Session Expired. Please login again");
            } else {
                toast.error("Internal Server Error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedStaffMember = staff.find(
        (s) => s.id.toString() === selectedStaff
    );
    const averageScore =
        Object.keys(scores).length > 0 ? calculateAverageScore() : "0.0";

    if (loading) {
        return <LoadingSpinner />;
    }

    // Empty state for no staff
    if (!loading && staff.length === 0) {
        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-sm p-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Staff Scoring
                        </h1>
                    </div>
                    <p className="text-sm text-gray-600">
                        Create weekly performance evaluations for your team
                    </p>
                </motion.div>

                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Staff Members Found
                        </h3>
                        <p className="text-gray-600 mb-4">
                            There are no staff members assigned to you for
                            scoring.
                        </p>
                        <p className="text-sm text-gray-500">
                            Please contact your administrator if you believe
                            this is an error.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Staff Scoring
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Create weekly performance evaluations for your team
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Staff Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-[#FF3F33]" />
                                Staff & Period Selection
                            </CardTitle>
                            <CardDescription>
                                Choose the staff member and evaluation period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="staff">Staff Member</Label>
                                <Select
                                    value={selectedStaff}
                                    onValueChange={setSelectedStaff}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map((staffMember) => (
                                            <SelectItem
                                                key={staffMember.id}
                                                value={staffMember.id.toString()}
                                            >
                                                <div className="flex flex-col">
                                                    <span>
                                                        {staffMember.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {staffMember.role}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Empty state when no staff selected */}
                    {!selectedStaff && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Select a Staff Member
                                </h3>
                                <p className="text-gray-600">
                                    Choose a staff member from the dropdown
                                    above to begin the evaluation
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Loading state */}
                    {selectedStaff && kpisLoading && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <LoadingSpinner />
                                <p className="text-gray-600 mt-4">
                                    Loading KPIs...
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* No KPIs found */}
                    {selectedStaff && !kpisLoading && kpis.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No KPIs Available
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    No Key Performance Indicators have been
                                    configured for evaluation.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Please contact your administrator to set up
                                    KPIs.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Scoring Criteria */}
                    {selectedStaff && kpis.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
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
                                    {kpis.map((criteria) => (
                                        <div
                                            key={criteria.id}
                                            className="space-y-4 p-4 border rounded-lg"
                                        >
                                            {/* KPI Title + Current Score */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">
                                                        {criteria.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {criteria.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                    <span className="text-sm text-gray-500">
                                                        Score:
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${
                                                            scores[criteria.id]
                                                                ?.score >= 4
                                                                ? "border-green-500 text-green-700"
                                                                : scores[
                                                                      criteria
                                                                          .id
                                                                  ]?.score >= 3
                                                                ? "border-yellow-500 text-yellow-700"
                                                                : scores[
                                                                      criteria
                                                                          .id
                                                                  ]?.score > 0
                                                                ? "border-red-500 text-red-700"
                                                                : "border-gray-300 text-gray-500"
                                                        }`}
                                                    >
                                                        {scores[criteria.id]
                                                            ?.score || 0}
                                                        /5
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Dots Rating */}
                                            <div className="flex justify-between mt-4 px-2">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        key={num}
                                                        onClick={() =>
                                                            updateScore(
                                                                criteria.id,
                                                                num
                                                            )
                                                        }
                                                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-medium transition-all
                                                            ${
                                                                scores[
                                                                    criteria.id
                                                                ]?.score >= num
                                                                    ? "bg-[#FF3F33] text-white border-[#FF3F33] scale-110"
                                                                    : "bg-white border-gray-300 text-gray-400 hover:border-[#FF3F33] hover:text-[#FF3F33]"
                                                            }`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Labels below dots */}
                                            <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
                                                <span>Poor</span>
                                                <span>Fair</span>
                                                <span>Good</span>
                                                <span>V.Good</span>
                                                <span>Excellent</span>
                                            </div>

                                            {/* Comment Box */}
                                            <Textarea
                                                placeholder={`Add comments for ${criteria.name?.toLowerCase()}...`}
                                                value={
                                                    scores[criteria.id]
                                                        ?.comment || ""
                                                }
                                                onChange={(e) =>
                                                    updateComment(
                                                        criteria.id,
                                                        e.target.value
                                                    )
                                                }
                                                rows={2}
                                                className="mt-2"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Summary Sidebar */}
                {selectedStaff && kpis.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Score Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Evaluation Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-[#FF3F33]">
                                        {averageScore}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Average Score
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {kpis.map((criteria) => (
                                        <div
                                            key={criteria.id}
                                            className="flex justify-between items-center"
                                        >
                                            <span className="text-sm text-gray-600">
                                                {criteria.name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`${
                                                    scores[criteria.id]
                                                        ?.score >= 4
                                                        ? "border-green-500 text-green-700"
                                                        : scores[criteria.id]
                                                              ?.score >= 3
                                                        ? "border-yellow-500 text-yellow-700"
                                                        : scores[criteria.id]
                                                              ?.score > 0
                                                        ? "border-red-500 text-red-700"
                                                        : "border-gray-300 text-gray-500"
                                                }`}
                                            >
                                                {scores[criteria.id]?.score ||
                                                    0}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* Warning if scores incomplete */}
                                {Object.values(scores).some(
                                    (s) => s.score === 0
                                ) && (
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-800">
                                            Please rate all criteria before
                                            submitting
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Staff Info */}
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
                                            {selectedStaffMember?.name}
                                        </span>
                                    </div>
                                    {/* Role */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <UserIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-500">
                                            Role:
                                        </span>
                                        <span className="font-medium">
                                            {selectedStaffMember?.role}
                                        </span>
                                    </div>

                                    {/* Section (only if not null) */}
                                    {selectedStaffMember?.section && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPinIcon className="w-4 h-4 text-gray-500" />{" "}
                                            {/* changed icon */}
                                            <span className="text-gray-500">
                                                Section:
                                            </span>
                                            <span className="font-medium">
                                                {selectedStaffMember.section}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-500">
                                            Phone:
                                        </span>
                                        <span className="font-medium">
                                            {selectedStaffMember?.mobile}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting ||
                                !selectedStaff ||
                                Object.values(scores).some((s) => s.score === 0)
                            }
                            className="w-full bg-[#FF3F33] hover:bg-[#E6362A] disabled:opacity-50"
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
                                    Submit for Approval
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
