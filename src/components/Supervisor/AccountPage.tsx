
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    LogOut,
    Lock,
    User,
    Shield,
    Edit,
    Save,
    Eye,
    EyeOff,
    X,
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

    if (!user) return null;

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState<any>({});
    const [editedData, setEditedData] = useState<any>({});

    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pinChangeData, setPinChangeData] = useState({
        newPin: "",
        confirmPin: "",
    });

    const handleLogout = async () => {
        await logoutSupervisor();
        dispatch(clearUser());
        toast.success("Logged out successfully");
    };

    const handleSaveProfile = async () => {
        try {
            await axiosInstance.put("/supervisor/editMe", editedData);
            setProfileData({ ...profileData, ...editedData });
            setIsEditingProfile(false);
            toast.success("Profile updated successfully");
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutSupervisor();
                dispatch(clearUser());
                toast.error("Session Expired. Please login again");
            } else {
                toast.error(
                    err.response?.data?.message || "Failed to update profile"
                );
            }
        }
    };

    const handleCancelEdit = () => {
        setEditedData({
            name: profileData.name || "",
            mobile: profileData.mobile || "",
        });
        setIsEditingProfile(false);
    };

    const handlePinChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (pinChangeData.newPin !== pinChangeData.confirmPin) {
            toast.error("New PIN and confirmation do not match");
            return;
        }
        if (pinChangeData.newPin.length !== 6) {
            toast.error("PIN must be 6 digits");
            return;
        }

        try {
            setLoading(true);
            await axiosInstance.put("/supervisor/updatePin", pinChangeData);
            toast.success("PIN changed successfully");
            setPinChangeData({ newPin: "", confirmPin: "" });
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutSupervisor();
                dispatch(clearUser());
                toast.error("Session Expired. Please login again");
            } else {
                toast.error(err.response?.data?.message || "Failed to change PIN");
            }
        } finally {
            setLoading(false);
        }
    };

    const getRoleDisplayName = (role: string) => {
        const roleNames: Record<string, string> = {
            owner: "Owner",
            supervisor: "Floor Manager/Supervisor",
            manager: "Manager",
            accountant: "Accountant",
            sales: "Sales Executive",
        };
        return roleNames[role] || role;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/supervisor/getme");
                const userData = res.data.me;
                setProfileData(userData);
                setEditedData({
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

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h1 className="text-xl font-semibold text-gray-900">
                                       Account Settings
                                    </h1>
                                    
                                </div>
                                <p className="text-sm text-gray-600">
                                    Manage your profile and account preferences
                                </p>
                            </div>
           

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-2">
                        <TabsTrigger
                            value="profile"
                            className="flex items-center gap-2"
                        >
                            <User size={16} />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="flex items-center gap-2"
                        >
                            <Lock size={16} />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Avatar + Basic Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                            >
                                <Card className="relative">
                                    <CardHeader className="text-center">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <Avatar className="h-20 w-20 mx-auto mb-4">
                                                <AvatarFallback className="bg-[#FF3F33] text-white text-2xl">
                                                    {editedData.name
                                                        ?.split(" ")
                                                        .map((n) => n[0])
                                                        .join("") ||
                                                        user.name
                                                            ?.split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                        </motion.div>
                                        <CardTitle>
                                            {editedData.name || profileData.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {getRoleDisplayName(user.role)}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>

                            {/* Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="lg:col-span-2"
                            >
                                <Card className="relative">
                                    <CardHeader className="flex flex-row justify-between items-start">
                                        <div>
                                            <CardTitle>Personal Information</CardTitle>
                                            <CardDescription>
                                                Account details
                                            </CardDescription>
                                        </div>

                                        {/* Edit/Save/Cancel Buttons */}
                                        <AnimatePresence mode="wait">
                                            <div className="flex gap-2">
                                                {!isEditingProfile ? (
                                                    <motion.div
                                                        key="edit"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                            onClick={() =>
                                                                setIsEditingProfile(true)
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" /> Edit
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="actions"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        className="flex gap-2"
                                                    >
                                                        <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex items-center gap-1"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                <X className="h-4 w-4" /> Cancel
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                className="flex items-center gap-1 bg-[#FF3F33] hover:bg-[#E6362B]"
                                                                onClick={handleSaveProfile}
                                                            >
                                                                <Save className="h-4 w-4" />{" "}
                                                                Save
                                                            </Button>
                                                        </motion.div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </AnimatePresence>
                                    </CardHeader>

                                    <CardContent>
                                        <motion.div
                                            className="space-y-3"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 0.4 }}
                                        >
                                            {/* Name - Editable */}
                                            <AnimatePresence mode="wait">
                                                {isEditingProfile ? (
                                                    <motion.div
                                                        key="name-edit"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        className="space-y-1"
                                                    >
                                                        <Label className="text-sm font-medium">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            value={editedData.name}
                                                            onChange={(e) =>
                                                                setEditedData({
                                                                    ...editedData,
                                                                    name: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Enter name"
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.p
                                                        key="name-view"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        className="text-sm"
                                                    >
                                                        <span className="font-medium">
                                                            Name:
                                                        </span>{" "}
                                                        {profileData.name}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>

                                            {/* Mobile - Editable */}
                                            <AnimatePresence mode="wait">
                                                {isEditingProfile ? (
                                                    <motion.div
                                                        key="mobile-edit"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="space-y-1"
                                                    >
                                                        <Label className="text-sm font-medium">
                                                            Mobile
                                                        </Label>
                                                        <Input
                                                            value={editedData.mobile}
                                                            onChange={(e) =>
                                                                setEditedData({
                                                                    ...editedData,
                                                                    mobile: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Enter mobile number"
                                                            maxLength={10}
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.p
                                                        key="mobile-view"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        className="text-sm"
                                                    >
                                                        <span className="font-medium">
                                                            Mobile:
                                                        </span>{" "}
                                                        {profileData.mobile}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>

                                            {/* Floor - View Only */}
                                            <motion.p
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6, duration: 0.4 }}
                                                className="text-sm"
                                            >
                                                <span className="font-medium">
                                                    Floor:
                                                </span>{" "}
                                                {profileData.floor?.name || "N/A"}
                                            </motion.p>

                                            {/* Role - View Only */}
                                            <motion.p
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7, duration: 0.4 }}
                                                className="text-sm"
                                            >
                                                <span className="font-medium">
                                                    Role:
                                                </span>{" "}
                                                {profileData.role ||
                                                    getRoleDisplayName(user.role)}
                                            </motion.p>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Shield className="h-5 w-5 text-[#FF3F33]" />
                                        <span>Change PIN</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Update your login PIN for security
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={handlePinChange}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4, duration: 0.4 }}
                                                className="space-y-2"
                                            >
                                                <Label htmlFor="newPin">New PIN</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="newPin"
                                                        type={
                                                            showNewPin
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        value={pinChangeData.newPin}
                                                        onChange={(e) =>
                                                            setPinChangeData({
                                                                ...pinChangeData,
                                                                newPin: e.target.value,
                                                            })
                                                        }
                                                        maxLength={6}
                                                        placeholder="Enter new PIN"
                                                        required
                                                    />
                                                    <motion.div
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                            onClick={() =>
                                                                setShowNewPin(!showNewPin)
                                                            }
                                                        >
                                                            {showNewPin ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5, duration: 0.4 }}
                                                className="space-y-2"
                                            >
                                                <Label htmlFor="confirmPin">
                                                    Confirm New PIN
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="confirmPin"
                                                        type={
                                                            showConfirmPin
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        value={pinChangeData.confirmPin}
                                                        onChange={(e) =>
                                                            setPinChangeData({
                                                                ...pinChangeData,
                                                                confirmPin:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        maxLength={6}
                                                        placeholder="Confirm new PIN"
                                                        required
                                                    />
                                                    <motion.div
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                            onClick={() =>
                                                                setShowConfirmPin(
                                                                    !showConfirmPin
                                                                )
                                                            }
                                                        >
                                                            {showConfirmPin ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6, duration: 0.4 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                type="submit"
                                                disabled={
                                                    loading ||
                                                    pinChangeData.newPin.length !== 6 ||
                                                    pinChangeData.confirmPin.length !== 6 ||
                                                    pinChangeData.newPin !==
                                                        pinChangeData.confirmPin
                                                }
                                                className="bg-[#FF3F33] hover:bg-[#E6362B] w-full disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                            ></path>
                                                        </svg>
                                                        Changing PIN…
                                                    </>
                                                ) : (
                                                    "Change PIN"
                                                )}
                                            </Button>
                                        </motion.div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF3F33] hover:bg-[#E6362B] text-white font-medium rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </motion.div>
        </motion.div>
    );
}