
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
    TrendingUp,
    Settings,
    Users,
    BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { logoutAccountant } from "@/lib/logoutApi";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { axiosInstance } from "@/api/axios";
import { LoadingSpinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SalesReports } from "./AccountantSalesPage";

export function AccountantAccount() {
    const dispatch = useDispatch();

    const [activeTab, setActiveTab] = useState<"sales" | "account">("account");
    const [direction, setDirection] = useState<"left" | "right">("right");
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

    const handleTabChange = (tab: "sales" | "account") => {
        if (tab === activeTab) return;
        setDirection(tab === "account" ? "right" : "left");
        setActiveTab(tab);
    };

    const slideVariants = {
        enter: (direction: "left" | "right") => ({
            x: direction === "right" ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: "left" | "right") => ({
            x: direction === "right" ? -300 : 300,
            opacity: 0,
        }),
    };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('accesstoken')
      localStorage.removeItem('refreshtoken')
      await logoutAccountant()
      dispatch(clearUser())
      toast.success('Logged out successfully')
    } catch (err) {
      toast.error('Error signing out')
    }
  }

  const handleSaveProfile = async () => {
    try {
            if (!editData.name || !editData.mobile) {
        toast.error('Name and mobile number are required')
        return
      }

            if (editData.mobile.length < 10) {
        toast.error('Please enter a valid mobile number')
        return
      }

      await axiosInstance.put('/accountant/update-profile', {
                name: editData.name,
                mobile: editData.mobile
      })
      
            setProfileData({ ...profileData, ...editData })
            setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accesstoken')
        localStorage.removeItem('refreshtoken')
        await logoutAccountant()
        dispatch(clearUser())
        toast.error('Session Expired. Please login again')
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile')
      }
    }
  }

  const handleCancelEdit = () => {
        setEditData({
      name: profileData.name || '',
      mobile: profileData.mobile || ''
    })
        setIsEditing(false)
    }

    const handlePinChange = async () => {
        if (newPin !== confirmPin) {
      toast.error('New PIN and confirmation do not match')
      return
    }
    
        if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
            toast.error('PIN must be exactly 6 digits')
      return
    }

    try {
            setIsChangingPin(true)
      await axiosInstance.patch('/accountant/change-pin', {
                newPin: newPin
      })
      
      toast.success('PIN changed successfully')
            setNewPin('')
            setConfirmPin('')
            setShowPinChange(false)
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accesstoken')
        localStorage.removeItem('refreshtoken')
        await logoutAccountant()
        dispatch(clearUser())
        toast.error('Session Expired. Please login again')
      } else {
        toast.error(err.response?.data?.message || 'Failed to change PIN')
      }
        } finally {
            setIsChangingPin(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      owner: 'Owner',
      supervisor: 'Floor Manager/Supervisor',
      manager: 'Manager',
      accountant: 'Accountant',
      sales: 'Sales Executive'
    }
    return roleNames[role] || role
  }

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get('/accountant/getme')
        const userData = res.data.me
        setProfileData(userData)
                setEditData({
          name: userData.name || '',
          mobile: userData.mobile || ''
        })
      } catch (err: any) {
        if (err.response?.status === 401) {
                    const response: any = await logoutAccountant();
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
          toast.error(err.response?.data?.message || 'Failed to fetch profile')
        }
      }
      setLoading(false)
    }

    fetchProfile()
  }, [dispatch])

  
  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Account Settings</h2>
          <p className="text-gray-600 mt-1">Manage your profile and account preferences</p>
        </div>
      </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => handleTabChange("sales")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "sales"
                            ? "bg-white text-[#FF3F33] shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    <TrendingUp className="h-4 w-4" />
                    Sales Management
                </button>
                <button
                    onClick={() => handleTabChange("account")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "account"
                            ? "bg-white text-[#FF3F33] shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    Account Settings
                </button>
            </div>

            {/* Animated Content */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={activeTab}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    {/* Account Tab */}
                    {activeTab === "account" && (
                        <div className="space-y-6">
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
                                                {isEditing ? editData.name : profileData.name || "N/A"}
                                            </span>
                                            <Badge className="bg-blue-100 text-blue-800 capitalize">
                                                {getRoleDisplayName(profileData.role) || "N/A"}
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
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1"
                        onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4" /> Edit
                      </motion.button>
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
                                    {profileData.uniqueId && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center space-x-2"
                                        >
                                            <Hash className="h-4 w-4 text-gray-400" />
                                            <Label className="text-sm text-gray-600">ID:</Label>
                                            <span className="font-medium">{profileData.uniqueId}</span>
                                        </motion.div>
                                    )}

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
                                                <Label className="text-sm text-gray-600">Name:</Label>
                                                <span className="font-medium">{profileData.name || "N/A"}</span>
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
                                                <Label className="text-sm text-gray-600">Mobile:</Label>
                                                <span className="font-medium">{profileData.mobile || "N/A"}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Floor - View Only (Always visible) */}
                  {profileData.floor?.name && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center space-x-2"
                                        >
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <Label className="text-sm text-gray-600">Floor:</Label>
                                            <span className="font-medium">{profileData.floor.name}</span>
                                        </motion.div>
                                    )}

                                    {/* Created At - View Only - Hide when editing */}
                                    {!isEditing && profileData.created_at && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center space-x-2"
                                        >
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <Label className="text-sm text-gray-600">Joined At:</Label>
                                            <span className="font-medium">
                                                {new Date(profileData.created_at).toLocaleDateString()}
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
                                                whileTap={{ scale: 0.95 }}
                                                className="flex-1 flex items-center justify-center gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                                onClick={handleCancelEdit}
                                            >
                                                <X className="h-4 w-4" /> Cancel
                                            </motion.button>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                className="flex-1 flex items-center justify-center gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#FF3F33] hover:bg-[#E6362B] text-primary-foreground h-10 px-4 py-2"
                                                onClick={handleSaveProfile}
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
                                    <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent>
                                    {!showPinChange ? (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowPinChange(true)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#FF3F33] hover:bg-[#E6362B] text-primary-foreground h-10 px-4 py-2"
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
                                                                setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                                                            placeholder="Enter 6-digit PIN"
                        maxLength={6}
                                                        />
                  </div>

                  <div className="space-y-2">
                                                        <Label htmlFor="confirm-pin">Confirm New PIN</Label>
                      <Input
                                                            id="confirm-pin"
                                                            type="password"
                                                            value={confirmPin}
                        onChange={(e) =>
                                                                setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                                                            placeholder="Confirm 6-digit PIN"
                        maxLength={6}
                                                        />
                  </div>
                </div>

                                                <div className="flex space-x-2">
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={handlePinChange}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#FF3F33] hover:bg-[#E6362B] text-primary-foreground h-10 px-4 py-2"
                                                        disabled={isChangingPin}
                                                    >
                                                        {isChangingPin ? "Changing PIN..." : "Update PIN"}
                                                    </motion.button>

                <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                                        onClick={() => {
                                                            setShowPinChange(false);
                                                            setNewPin("");
                                                            setConfirmPin("");
                                                        }}
                                                        disabled={isChangingPin}
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
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#FF3F33] hover:bg-[#E6362B] text-white font-medium h-10 px-4 py-2"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </motion.button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Sales Tab */}
                    {activeTab === "sales" && <SalesReports />}
                </motion.div>
            </AnimatePresence>
    </motion.div>
  )
}