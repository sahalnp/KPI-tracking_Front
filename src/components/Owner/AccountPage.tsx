// import { useEffect, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { User, Lock, LogOut, Phone, Building, Hash } from "lucide-react";
// import { toast } from "sonner";
// import { axiosInstance } from "@/api/axios";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { clearUser } from "@/features/UserSlice";
// import { Home, Calendar } from "lucide-react";
// import { logoutOwner } from "@/lib/logoutApi";

// export default function AccountSettings() {
//     const [newPin, setNewPin] = useState("");
//     const [confirmPin, setConfirmPin] = useState("");
//     const [isChangingPin, setIsChangingPin] = useState(false);
//     const [showPinChange, setShowPinChange] = useState(false);
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState({
//         name: "",
//         floor: "",
//         section: "",
//     });
//     const navigate = useNavigate();
//     const [user, setUser] = useState<any>({});
//     const dispatch = useDispatch();

//     const onLogout = () => {
//         dispatch(clearUser());
//         localStorage.removeItem("accesstoken");
//         localStorage.removeItem("refreshtoken");
//         navigate("/");
//         toast.success("Logged out successfully");
//     };

//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 const res = await axiosInstance.get("/owner/me");
//                 setUser(res.data.user);
//             } catch (err: any) {
//                 if (err.response?.status === 401) {
//                     localStorage.removeItem("accessToken");
//                     localStorage.removeItem("refreshToken");
//                     await logoutOwner();
//                     dispatch(clearUser());
//                 }
//             }
//         };

//         fetchUserData();
//     }, []);

//     const handleUpdate = async () => {
//         try {
//             const res = await axiosInstance.patch(
//                 `/owner/editOwner/${user.id}`,
//                 {
//                     name: editData.name,
//                     floor: editData.floor,
//                     section: editData.section,
//                 }
//             );

//             setUser(res.data.user);
//             toast.success("Profile updated successfully");
//             setIsEditing(false);
//         } catch (err: any) {
//             if (err.response?.status === 401) {
//                 localStorage.removeItem("accessToken");
//                 localStorage.removeItem("refreshToken");
//                 await logoutOwner();
//                 dispatch(clearUser());
//             }
//         }
//     };
//     const handlePinChange = async (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();

//         // Validation
//         if (!newPin || !confirmPin) {
//             toast.error("Please fill in all PIN fields");
//             return;
//         }

//         if (newPin !== confirmPin) {
//             toast.error("New PIN and confirmation do not match");
//             return;
//         }

//         if (newPin.length !== 6) {
//             toast.error("PIN must be 6 digits");
//             return;
//         }

//         setIsChangingPin(true);

//         try {
//             await axiosInstance.patch("/owner/changePin", {
//                 pin: newPin,
//             });

//             // Simulate API delay
//             setTimeout(() => {
//                 toast.success("PIN changed successfully");
//                 setNewPin("");
//                 setConfirmPin("");
//                 setIsChangingPin(false);
//                 setShowPinChange(false);
//             }, 1000);
//         } catch (error) {
//             toast.error("Failed to change PIN");
//             setIsChangingPin(false);
//         }
//     };

//     return (
//         <div className="h-screen overflow-y-auto">
//             <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.3 }}
//                 className="p-6 space-y-6 max-w-4xl mx-auto pb-20"
//             >
//                 <div className="bg-white rounded-lg shadow-sm p-4">
//                     <div className="flex items-center justify-between mb-2">
//                         <h1 className="text-xl font-semibold text-gray-900">
//                             Accountant Settings
//                         </h1>
//                     </div>
//                     <p className="text-sm text-gray-600">
//                         Manage your account preferences and security
//                     </p>
//                 </div>

//                 {/* Profile Information */}
//                 <Card className="relative p-4">
//                     {/* Active Circular Tick */}
//                     {/* Active Badge */}

//                     {/* Top Row: Avatar + Name + Role */}
//                     <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center space-x-4">
//                             <Avatar className="h-16 w-16">
//                                 <AvatarFallback className="bg-[#FF3F33] text-white text-lg">
//                                     {user?.name
//                                         ? user.name
//                                               .split(" ") // split by space
//                                               .map((n: string) => n[0]) // take first letter of each part
//                                               .join("") // join together (e.g., "MS")
//                                               .toUpperCase()
//                                         : "U"}
//                                 </AvatarFallback>
//                             </Avatar>
//                             <div className="flex items-center space-x-2">
//                                 <span className="font-medium text-lg">
//                                     {user.name || "N/A"}
//                                 </span>
//                                 <Badge className="bg-blue-100 text-blue-800 capitalize">
//                                     {user.role || "N/A"}
//                                 </Badge>
//                             </div>
//                         </div>
//                         {/* Checkmark handled by absolute SVG above */}
//                     </div>

//                     {/* User Details */}
//                     <div className="space-y-2">
//                         {/* Section */}
//                         <div className="flex items-center space-x-2">
//                             <Building className="h-4 w-4 text-gray-400" />
//                             <Label className="text-sm text-gray-600">
//                                 Section:
//                             </Label>
//                             <span className="font-medium">
//                                 {user.section || "N/A"}
//                             </span>
//                         </div>

//                         {/* Mobile */}
//                         <div className="flex items-center space-x-2">
//                             <Phone className="h-4 w-4 text-gray-400" />
//                             <Label className="text-sm text-gray-600">
//                                 Mobile:
//                             </Label>
//                             <span className="font-medium">
//                                 {user.mobile || "N/A"}
//                             </span>
//                         </div>

//                         {/* Floor ID */}
//                         <div className="flex items-center space-x-2">
//                             <Home className="h-4 w-4 text-gray-400" />
//                             <Label className="text-sm text-gray-600">
//                                 Floor:
//                             </Label>
//                             <span className="font-medium">
//                                 {user.floor_id || "N/A"}
//                             </span>
//                         </div>

//                         {/* Created At */}
//                         <div className="flex items-center space-x-2">
//                             <Calendar className="h-4 w-4 text-gray-400" />
//                             <Label className="text-sm text-gray-600">
//                                 Joined At:
//                             </Label>
//                             <span className="font-medium">
//                                 {user.created_at
//                                     ? new Date(
//                                           user.created_at
//                                       ).toLocaleDateString()
//                                     : "N/A"}
//                             </span>
//                         </div>
//                     </div>
//                 </Card>

//                 {/* Change PIN */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle className="flex items-center space-x-2">
//                             <Lock className="h-5 w-5 text-[#FF3F33]" />
//                             <span>Security</span>
//                         </CardTitle>
//                         <CardDescription>
//                             Manage your account security settings
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         {!showPinChange ? (
//                             <Button
//                                 onClick={() => setShowPinChange(true)}
//                                 className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md"
//                             >
//                                 Change PIN
//                             </Button>
//                         ) : (
//                             <AnimatePresence mode="wait">
//                                 {showPinChange && (
//                                     <motion.div
//                                         key="pin-change-form"
//                                         initial={{ opacity: 0, y: 15 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         exit={{ opacity: 0, y: -15 }}
//                                         transition={{ duration: 0.3 }}
//                                         className="space-y-4"
//                                     >
//                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                             <div className="space-y-2">
//                                                 <Label htmlFor="new-pin">
//                                                     New PIN
//                                                 </Label>
//                                                 <Input
//                                                     id="new-pin"
//                                                     type="password"
//                                                     value={newPin}
//                                                     onChange={(e) =>
//                                                         setNewPin(
//                                                             e.target.value
//                                                         )
//                                                     }
//                                                     placeholder="Enter new PIN"
//                                                     maxLength={6}
//                                                 />
//                                             </div>

//                                             <div className="space-y-2">
//                                                 <Label htmlFor="confirm-pin">
//                                                     Confirm New PIN
//                                                 </Label>
//                                                 <Input
//                                                     id="confirm-pin"
//                                                     type="password"
//                                                     value={confirmPin}
//                                                     onChange={(e) =>
//                                                         setConfirmPin(
//                                                             e.target.value
//                                                         )
//                                                     }
//                                                     placeholder="Confirm new PIN"
//                                                     maxLength={6}
//                                                 />
//                                             </div>
//                                         </div>

//                                         <div className="flex space-x-2">
//                                             <Button
//                                                 onClick={handlePinChange}
//                                                 className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md"
//                                                 disabled={isChangingPin}
//                                             >
//                                                 {isChangingPin
//                                                     ? "Changing PIN..."
//                                                     : "Update PIN"}
//                                             </Button>
//                                             <Button
//                                                 variant="outline"
//                                                 onClick={() => {
//                                                     setShowPinChange(false);
//                                                     setNewPin("");
//                                                     setConfirmPin("");
//                                                 }}
//                                                 disabled={isChangingPin}
//                                             >
//                                                 Cancel
//                                             </Button>
//                                         </div>
//                                     </motion.div>
//                                 )}
//                             </AnimatePresence>
//                         )}
//                     </CardContent>
//                 </Card>

//                 {/* Account Actions */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Account Actions</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="flex justify-center">
//                             <Button
//                                 onClick={onLogout}
//                                 size="lg"
//                                 className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl shadow-lg w-full max-w-xs"
//                             >
//                                 <LogOut className="h-5 w-5 mr-2" />
//                                 Sign Out
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </motion.div>
//         </div>
//     );
// }
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
import { User, Lock, LogOut, Phone, Building, Hash, Edit, Save, X, Home, Calendar } from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/api/axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { logoutOwner } from "@/lib/logoutApi";

export default function AccountSettings() {
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isChangingPin, setIsChangingPin] = useState(false);
    const [showPinChange, setShowPinChange] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState<any>({});
    const [editData, setEditData] = useState({
        name: "",
        mobile: "",
        floor: "",
        section: "",
    });
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onLogout = async() => {
        await logoutOwner()
        dispatch(clearUser());
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        navigate("/");
        toast.success("Logged out successfully");
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await axiosInstance.get("/owner/me");
                setUser(res.data.user);
                setEditData({
                    name: res.data.user.name || "",
                    mobile: res.data.user.mobile || "",
                    floor: res.data.user.floor_id || "",
                    section: res.data.user.section || "",
                });
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    await logoutOwner();
                    dispatch(clearUser());
                }
            }
        };

        fetchUserData();
    }, []);

    const handleSaveEdit = async () => {
        try {
            const res = await axiosInstance.put(
                `/owner/editOwner/${user.id}`,
                {
                    name: editData.name,
                    mobile: editData.mobile,
                    floor: editData.floor,
                    section: editData.section,
                }
            );

            setUser(res.data.updateMe);
            toast.success("Profile updated successfully");
            setIsEditing(false);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                await logoutOwner();
                dispatch(clearUser());
            } else {
                toast.error(err.response?.data?.message || "Failed to update profile");
            }
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            name: user.name || "",
            mobile: user.mobile || "",
            floor: user.floor_id || "",
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
            await axiosInstance.patch("/owner/changePin", {
                pin: newPin,
            });

            setTimeout(() => {
                toast.success("PIN changed successfully");
                setNewPin("");
                setConfirmPin("");
                setIsChangingPin(false);
                setShowPinChange(false);
            }, 1000);
        } catch (error) {
            toast.error("Failed to change PIN");
            setIsChangingPin(false);
        }
    };

    return (
        <div className="h-screen overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 space-y-6 max-w-4xl mx-auto pb-20"
            >
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Accountant Settings
                        </h1>
                    </div>
                    <p className="text-sm text-gray-600">
                        Manage your account preferences and security
                    </p>
                </div>

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
                                    {isEditing ? editData.name : user.name || "N/A"}
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
                                            setEditData({ ...editData, name: e.target.value })
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
                                    <Label className="text-sm text-gray-600">Name:</Label>
                                    <span className="font-medium">{user.name || "N/A"}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mobile - Editable */}
                        {isEditing ? (
                            <div className="space-y-1">
                                <Label className="text-sm font-medium flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>Mobile:</span>
                                </Label>
                                <Input
                                    value={editData.mobile}
                                    onChange={(e) =>
                                        setEditData({ ...editData, mobile: e.target.value })
                                    }
                                    placeholder="Enter mobile number"
                                    maxLength={10}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <Label className="text-sm text-gray-600">Mobile:</Label>
                                <span className="font-medium">{user.mobile || "N/A"}</span>
                            </div>
                        )}

                        {/* Section - Editable */}
                        {isEditing ? (
                            <div className="space-y-1">
                                <Label className="text-sm font-medium flex items-center space-x-2">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <span>Section:</span>
                                </Label>
                                <Input
                                    value={editData.section}
                                    onChange={(e) =>
                                        setEditData({ ...editData, section: e.target.value })
                                    }
                                    placeholder="Enter section"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <Label className="text-sm text-gray-600">Section:</Label>
                                <span className="font-medium">{user.section || "N/A"}</span>
                            </div>
                        )}

                        {/* Floor ID - Editable */}
                        {isEditing ? (
                            <div className="space-y-1">
                                <Label className="text-sm font-medium flex items-center space-x-2">
                                    <Home className="h-4 w-4 text-gray-400" />
                                    <span>Floor:</span>
                                </Label>
                                <Input
                                    value={editData.floor}
                                    onChange={(e) =>
                                        setEditData({ ...editData, floor: e.target.value })
                                    }
                                    placeholder="Enter floor"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Home className="h-4 w-4 text-gray-400" />
                                <Label className="text-sm text-gray-600">Floor:</Label>
                                <span className="font-medium">{user.floor_id || "N/A"}</span>
                            </div>
                        )}

                        {/* Created At - View Only - Hide when editing */}
                        {!isEditing && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center space-x-2"
                            >
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <Label className="text-sm text-gray-600">Joined At:</Label>
                                <span className="font-medium">
                                    {user.created_at
                                        ? new Date(user.created_at).toLocaleDateString()
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
                                    <Save className="h-4 w-4" /> Save Changes
                                </Button>
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
                            <Button
                                onClick={() => setShowPinChange(true)}
                                className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md"
                            >
                                Change PIN
                            </Button>
                        ) : (
                            <AnimatePresence mode="wait">
                                {showPinChange && (
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
                                            <Button
                                                onClick={handlePinChange}
                                                className="bg-[#FF3F33] hover:bg-[#E6362B] text-white rounded-xl shadow-md"
                                                disabled={isChangingPin}
                                            >
                                                {isChangingPin
                                                    ? "Changing PIN..."
                                                    : "Update PIN"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowPinChange(false);
                                                    setNewPin("");
                                                    setConfirmPin("");
                                                }}
                                                disabled={isChangingPin}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
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
                        <div className="flex justify-center">
                            <Button
                                onClick={onLogout}
                                size="lg"
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl shadow-lg w-full max-w-xs"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}