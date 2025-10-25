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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    LogOut,
    Lock,
    User,
    Edit,
    Save,
    X,
    Phone,
    Hash,
    Building,
} from "lucide-react";
import { toast } from "sonner";
import { UserAuth } from "@/hooks/useAuth";
import { logoutSupervisor } from "@/lib/logoutApi";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "@/components/ui/spinner";

export function Account() {
    const { user } = UserAuth();
    const dispatch = useDispatch();

    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<any>({});
    const [editData, setEditData] = useState<any>({
        name: "",
        mobile: "",
    });

    const [showPinChange, setShowPinChange] = useState(false);
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [isChangingPin, setIsChangingPin] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/supervisor/getme");
                const userData = res.data.me;
                setProfileData(userData);
                setEditData({
                    name: userData.name || "",
                    mobile: userData.mobile || "",
                });
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutSupervisor();
                    dispatch(clearUser());
                    toast.error("Session Expired. Please login again");
                } else {
                    toast.error(
                        err.response?.data?.message || "Failed to fetch profile"
                    );
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [dispatch]);

    const handleSaveEdit = async () => {
        try {
            await axiosInstance.put("/supervisor/editMe", editData);
            setProfileData({ ...profileData, ...editData });
            setIsEditing(false);
            toast.success("Profile updated successfully");
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response: any = await logoutSupervisor();
                if (response.success) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    dispatch(clearUser());
                    toast.error("Session Expired. Please login again");
                } else {
                    console.error("Internal server error ");
                }
            } else {
                toast.error(
                    err.response?.data?.message || "Failed to update profile"
                );
            }
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            name: profileData.name || "",
            mobile: profileData.mobile || "",
        });
        setIsEditing(false);
    };

    const handlePinChange = async () => {
        if (newPin !== confirmPin) {
            toast.error("New PIN and confirmation do not match");
            return;
        }
        if (newPin.length !== 6) {
            toast.error("PIN must be 6 digits");
            return;
        }

        try {
            setIsChangingPin(true);
            await axiosInstance.put("/supervisor/updatePin", {
                newPin,
                confirmPin,
            });
            toast.success("PIN changed successfully");
            setNewPin("");
            setConfirmPin("");
            setShowPinChange(false);
        } catch (err: any) {
            if (err.response?.status === 401) {
                const response: any = await logoutSupervisor();
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
                    err.response?.data?.message || "Failed to change PIN"
                );
            }
        } finally {
            setIsChangingPin(false);
        }
    };

    const handleLogout = async () => {
        await logoutSupervisor();
        dispatch(clearUser());
        toast.success("Logged out successfully");
    };

    if (!user) return null;

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            key="account"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
        >
            {/* Profile Information */}
            <Card className="relative p-4">
                {/* Top Row: Avatar + Name + Role + Edit Button */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-[#FF3F33] text-white text-lg">
                                {editData.name
                                    ? editData.name
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .join("")
                                          .toUpperCase()
                                    : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-2">
                            <span className="font-medium text-lg">
                                {isEditing
                                    ? editData.name
                                    : profileData.name || "N/A"}
                            </span>
                            <Badge className="bg-blue-100 text-blue-800 capitalize">
                                {user.role || "N/A"}
                            </Badge>
                        </div>
                    </div>

                    {/* Edit Button - Only show when not editing */}
                    {!isEditing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* User Details */}
                <motion.div
                    className="space-y-3"
                    initial={false}
                    animate={isEditing ? { scale: 1.01 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* ID - View Only (Always visible) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center space-x-2"
                    >
                        <Hash className="h-4 w-4 text-gray-400" />
                        <Label className="text-sm text-gray-600">ID:</Label>
                        <span className="font-medium">
                            {profileData.uniqueId || "N/A"}
                        </span>
                    </motion.div>

                    {/* Name - Editable */}
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div
                                key="name-edit"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1"
                            >
                                <Label className="text-sm font-medium flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>Name:</span>
                                </Label>
                                <Input
                                    value={editData.name}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Enter name"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="name-view"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center space-x-2"
                            >
                                <User className="h-4 w-4 text-gray-400" />
                                <Label className="text-sm text-gray-600">
                                    Name:
                                </Label>
                                <span className="font-medium">
                                    {profileData.name || "N/A"}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile - Editable */}
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div
                                key="mobile-edit"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1"
                            >
                                <Label className="text-sm font-medium flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>Mobile:</span>
                                </Label>
                                <Input
                                    value={editData.mobile}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            mobile: e.target.value,
                                        })
                                    }
                                    placeholder="Enter mobile number"
                                    maxLength={10}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="mobile-view"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center space-x-2"
                            >
                                <Phone className="h-4 w-4 text-gray-400" />
                                <Label className="text-sm text-gray-600">
                                    Mobile:
                                </Label>
                                <span className="font-medium">
                                    {profileData.mobile || "N/A"}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Floor - View Only (Always visible) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center space-x-2"
                    >
                        <Building className="h-4 w-4 text-gray-400" />
                        <Label className="text-sm text-gray-600">Floor:</Label>
                        <span className="font-medium">
                            {profileData.floor?.name || "N/A"}
                        </span>
                    </motion.div>

                    {/* Created At - View Only - Hide when editing */}
                    {!isEditing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center space-x-2"
                        >
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <Label className="text-sm text-gray-600">
                                Joined At:
                            </Label>
                            <span className="font-medium">
                                {profileData.created_at
                                    ? new Date(
                                          profileData.created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Save/Cancel Buttons - Bottom of Card */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex gap-2 mt-6 pt-4 border-t"
                        >
                            <motion.button
                                variant="outline"
                                className="flex-1 flex items-center justify-center gap-2"
                                onClick={handleCancelEdit}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <X className="h-4 w-4" /> Cancel
                            </motion.button>

                            <motion.button
                                className="flex-1 flex items-center justify-center gap-2 bg-[#FF3F33] hover:bg-[#E6362B]"
                                onClick={handleSaveEdit}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Save className="h-4 w-4" /> Save Changes
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Change PIN */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Lock className="h-5 w-5 text-[#FF3F33]" />
                        <span>Security</span>
                    </CardTitle>
                    <CardDescription>
                        Manage your account security settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!showPinChange ? (
                        <motion.button
                            onClick={() => setShowPinChange(true)}
                            className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md px-4 py-2"
                            whileTap={{ scale: 0.95 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 17,
                            }}
                        >
                            Change PIN
                        </motion.button>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="pin-change-form"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pin">New PIN</Label>
                                        <Input
                                            id="new-pin"
                                            type="password"
                                            value={newPin}
                                            onChange={(e) =>
                                                setNewPin(e.target.value)
                                            }
                                            placeholder="Enter new PIN"
                                            maxLength={6}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-pin">
                                            Confirm New PIN
                                        </Label>
                                        <Input
                                            id="confirm-pin"
                                            type="password"
                                            value={confirmPin}
                                            onChange={(e) =>
                                                setConfirmPin(e.target.value)
                                            }
                                            placeholder="Confirm new PIN"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <motion.button
                                        onClick={handlePinChange}
                                        className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md px-4 py-2 disabled:opacity-70"
                                        disabled={isChangingPin}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {isChangingPin
                                            ? "Changing PIN..."
                                            : "Update PIN"}
                                    </motion.button>

                                    <motion.button
                                        variant="outline"
                                        onClick={() => {
                                            setShowPinChange(false);
                                            setNewPin("");
                                            setConfirmPin("");
                                        }}
                                        disabled={isChangingPin}
                                        className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-70"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-[#FF3F33] hover:bg-[#E6362B] text-white font-medium rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </motion.button>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
