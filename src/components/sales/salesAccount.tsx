import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    User,
    Lock,
    LogOut,
    Phone,
    Building,
    Edit,
    Save,
    X,
    Home,
    Calendar,
    DollarSign,
    UserMinus,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/api/axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutStaff } from "@/lib/logoutApi";
import { LoadingSpinner } from "../ui/spinner";

export function SalesAccount() {
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isChangingPin, setIsChangingPin] = useState(false);
    const [showPinChange, setShowPinChange] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>({});
    const [walkOutLogs, setWalkOutLogs] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [editData, setEditData] = useState({
        name: "",
        mobile: "",
        floor: "",
        section: "",
    });
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onLogout = () => {
        dispatch(clearUser());
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        navigate("/");
        toast.success("Logged out successfully");
    };

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const res = await axiosInstance.get("/staff/accountData");
                setUser(res.data.details.user);
                setWalkOutLogs(res.data.details.walkOuts || []);
                setSalesData(res.data.details.sales || []); // Add your sales data here
                setEditData({
                    name: res.data.details.user.name || "",
                    mobile: res.data.details.user.mobile || "",
                    floor: res.data.details.user.floor?.id || "",
                    section: res.data.details.user.section || "",
                });
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutStaff();
                    dispatch(clearUser());
                    toast.error("Session expired");
                }
                toast.error("Failed to load account data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSaveEdit = async () => {
        try {
            const res = await axiosInstance.patch(
                `/staff/editProfile/${user.id}`,
                {
                    name: editData.name,
                    mobile: editData.mobile,
                    floor: editData.floor,
                    section: editData.section,
                }
            );

            setUser(res.data.user);
            toast.success("Profile updated successfully");
            setIsEditing(false);
        } catch (err: any) {
            if (err.response?.status === 401) {
            
            localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutStaff();
                dispatch(clearUser());
                toast.error("Session expired");
          }
            toast.error(
                err.response?.data?.message || "Failed to update profile"
            );
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            name: user.name || "",
            mobile: user.mobile || "",
            floor: user.floor?.id || "",
            section: user.section || "",
        });
        setIsEditing(false);
    };

    const handlePinChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!newPin || !confirmPin) {
            toast.error("Please fill in all PIN fields");
            return;
        }

        if (newPin !== confirmPin) {
            toast.error("New PIN and confirmation do not match");
            return;
        }

        if (newPin.length !== 6) {
            toast.error("PIN must be 6 digits");
            return;
        }

        setIsChangingPin(true);

        try {
            await axiosInstance.post("/staff/changepin", {
                newPin: newPin,
            });

            toast.success("PIN changed successfully");
            setNewPin("");
            setConfirmPin("");
            setIsChangingPin(false);
            setShowPinChange(false);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutStaff();
                dispatch(clearUser());
                toast.error("Session expired");
            }
            toast.error("Failed to change PIN");
            setIsChangingPin(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            return "Invalid Date";
        }
    };

    const formattedFloor = (num: number): string => {
        if (num === 0) return "Ground";
        if (num === 1) return "1st";
        if (num === 2) return "2nd";
        if (num === 3) return "3rd";
        const suffix = (n: number) => {
            const j = n % 10,
                k = n % 100;
            if (j === 1 && k !== 11) return "st";
            if (j === 2 && k !== 12) return "nd";
            if (j === 3 && k !== 13) return "rd";
            return "th";
        };
        return `${num}${suffix(num)}`;
    };

    if (isLoading) {
        return <LoadingSpinner />
    }

    return (
        <div className="h-screen overflow-y-auto bg-gray-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 space-y-6 max-w-6xl mx-auto pb-20"
            >

                   <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-lg shadow-sm p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h1 className="text-xl font-semibold text-gray-900">
                                         Account Settings
                                    </h1>
                                </div>
                                <p className="text-sm text-gray-600">
                                     Manage your profile and account preferences
                                </p>
                            </motion.div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger
                            value="profile"
                            className="flex flex-col items-center gap-1"
                        >
                            <User className="h-5 w-5" />
                            <span className="text-xs">Profile</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="security"
                            className="flex flex-col items-center gap-1"
                        >
                            <Lock className="h-5 w-5" />
                            <span className="text-xs">Security</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="sales"
                            className="flex flex-col items-center gap-1"
                        >
                            <DollarSign className="h-5 w-5" />
                            <span className="text-xs">Sales</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="walkouts"
                            className="flex flex-col items-center gap-1"
                        >
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-xs">Walk-outs</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <Card className="relative p-4">
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
                                                : user.name || "N/A"}
                                        </span>
                                        <Badge className="bg-blue-100 text-blue-800 capitalize">
                                            {user.role || "Sales"}
                                        </Badge>
                                    </div>
                                </div>

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

                            <motion.div
                                className="space-y-3"
                                initial={false}
                                animate={
                                    isEditing ? { scale: 1.01 } : { scale: 1 }
                                }
                                transition={{ duration: 0.3 }}
                            >
                                {/* Name */}
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
                                            <Label className="text-sm font-medium">
                                                Name:
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
                                                {user.name || "N/A"}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Mobile */}
                                {isEditing ? (
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">
                                            Mobile:
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
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <Label className="text-sm text-gray-600">
                                            Mobile:
                                        </Label>
                                        <span className="font-medium">
                                            {user.mobile || "N/A"}
                                        </span>
                                    </div>
                                )}

                                {/* Section */}
                                {isEditing ? (
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">
                                            Section:
                                        </Label>
                                        <Input
                                            value={editData.section}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    section: e.target.value,
                                                })
                                            }
                                            placeholder="Enter section"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Building className="h-4 w-4 text-gray-400" />
                                        <Label className="text-sm text-gray-600">
                                            Section:
                                        </Label>
                                        <span className="font-medium">
                                            {user.section || "N/A"}
                                        </span>
                                    </div>
                                )}

                                {/* Floor */}
                                {isEditing ? (
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">
                                            Floor:
                                        </Label>
                                        <Input
                                            value={editData.floor}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    floor: e.target.value,
                                                })
                                            }
                                            placeholder="Enter floor"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Home className="h-4 w-4 text-gray-400" />
                                        <Label className="text-sm text-gray-600">
                                            Floor:
                                        </Label>
                                        <span className="font-medium">
                                            {user.floor
                                                ? formattedFloor(user.floor.id)
                                                : "N/A"}
                                        </span>
                                    </div>
                                )}

                                {/* Created At */}
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
                                            {user.created_at
                                                ? formatDateTime(
                                                      user.created_at
                                                  )
                                                : "N/A"}
                                        </span>
                                    </motion.div>
                                )}
                            </motion.div>

                            <AnimatePresence>
                                {isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex gap-2 mt-6 pt-4 border-t"
                                    >
                                        <Button
                                            variant="outline"
                                            className="flex-1 flex items-center justify-center gap-2"
                                            onClick={handleCancelEdit}
                                        >
                                            <X className="h-4 w-4" /> Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 flex items-center justify-center gap-2 bg-[#FF3F33] hover:bg-[#E6362B]"
                                            onClick={handleSaveEdit}
                                        >
                                            <Save className="h-4 w-4" /> Save
                                            Changes
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={onLogout}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Lock className="h-5 w-5 text-[#FF3F33]" />
                                    <span>Security Settings</span>
                                </CardTitle>
                                <CardDescription>
                                    Change your login PIN
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!showPinChange ? (
                                    <Button
                                        onClick={() => setShowPinChange(true)}
                                        className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md"
                                    >
                                        Change PIN
                                    </Button>
                                ) : (
                                    <AnimatePresence mode="wait">
                                        {showPinChange && (
                                            <motion.form
                                                key="pin-change-form"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -15 }}
                                                transition={{ duration: 0.3 }}
                                                onSubmit={handlePinChange}
                                                className="space-y-4"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="new-pin">
                                                            New PIN
                                                        </Label>
                                                        <Input
                                                            id="new-pin"
                                                            type="password"
                                                            value={newPin}
                                                            onChange={(e) =>
                                                                setNewPin(
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        ""
                                                                    )
                                                                )
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
                                                                setConfirmPin(
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        ""
                                                                    )
                                                                )
                                                            }
                                                            placeholder="Confirm new PIN"
                                                            maxLength={6}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <Button
                                                        type="submit"
                                                        className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md"
                                                        disabled={isChangingPin}
                                                    >
                                                        {isChangingPin
                                                            ? "Changing PIN..."
                                                            : "Update PIN"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowPinChange(
                                                                false
                                                            );
                                                            setNewPin("");
                                                            setConfirmPin("");
                                                        }}
                                                        disabled={isChangingPin}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={onLogout}
                                
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Sales Tab */}
                    <TabsContent value="sales">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <DollarSign className="h-5 w-5 text-[#FF3F33]" />
                                    <span>Sales Performance</span>
                                </CardTitle>
                                <CardDescription>
                                    View your sales data and performance metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {salesData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>
                                                        Amount
                                                    </TableHead>
                                                    <TableHead>Items</TableHead>
                                                    <TableHead>
                                                        Points
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesData.map(
                                                    (
                                                        sale: any,
                                                        index: number
                                                    ) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                {formatDateTime(
                                                                    sale.date
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                ₹{sale.amount}
                                                            </TableCell>
                                                            <TableCell>
                                                                {sale.items}
                                                            </TableCell>
                                                            <TableCell>
                                                                {sale.points}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            No sales data available
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={onLogout}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Walk-outs Tab */}
                    <TabsContent value="walkouts">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <UserMinus className="h-5 w-5 text-[#FF3F33]" />
                                    <span>Walk-Out Log</span>
                                </CardTitle>
                                <CardDescription>
                                    Recent walk-out records (
                                    {
                                        walkOutLogs.filter((log) => !log.isDlt)
                                            .length
                                    }
                                    )
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {walkOutLogs.filter((log) => !log.isDlt)
                                        .length > 0 ? (
                                        walkOutLogs
                                            .filter((log) => !log.isDlt)
                                            .sort(
                                                (a, b) =>
                                                    new Date(b.time).getTime() -
                                                    new Date(a.time).getTime()
                                            )
                                            .map((log) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    className="border border-gray-200 rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center">
                                                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                                            <span className="font-medium text-gray-900">
                                                                {log.name ||
                                                                    "Walk Out"}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {formatDateTime(
                                                                log.time
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Reason:{" "}
                                                            </span>
                                                            <span className="text-red-600 font-medium">
                                                                {log.reason ||
                                                                    "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <UserMinus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                                                No walk-out logs found
                                            </h4>
                                            <p className="text-gray-500">
                                                No walk-out records available
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={onLogout}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
