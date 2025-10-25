// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
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
// import { Badge } from "@/components/ui/badge";
// import { LoadingSpinner } from "@/components/ui/spinner";
// import {
//     User,
//     Users,
//     Search,
//     Filter,
//     X,
//     Phone,
//     Mail,
//     MapPin,
//     Briefcase,
//     Calendar,
//     Edit,
//     Trash2,
//     Plus,
//     Settings,
//     UserCheck,
//     UserX,
// } from "lucide-react";
// import { axiosInstance } from "@/api/axios";
// import { logoutSupervisor } from "@/lib/logoutApi";
// import { clearUser } from "@/features/UserSlice";
// import { useDispatch } from "react-redux";
// import { toast } from "sonner";
// import { Account } from "./AccountPage";
// import { StaffManagementNew } from "./StaffUsers";

// export function SupervisorSettings() {
//     const [activeTab, setActiveTab] = useState<"staff" | "account">("staff");

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.1 }}
//                 className="bg-white rounded-lg shadow-sm p-4"
//             >
//                 <div className="flex items-center justify-between mb-2">
//                     <h1 className="text-xl font-semibold text-gray-900">
//                         Settings
//                     </h1>
//                 </div>
//                 <p className="text-sm text-gray-600">
//                     Manage your team and account settings
//                 </p>
//             </motion.div>

//             {/* Tab Navigation */}
//             <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
//                 <button
//                     onClick={() => setActiveTab("staff")}
//                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
//                         activeTab === "staff"
//                             ? "bg-white text-[#FF3F33] shadow-sm"
//                             : "text-gray-600 hover:text-gray-900"
//                     }`}
//                 >
//                     <Users className="h-4 w-4" />
//                     Staff Management
//                 </button>
//                 <button
//                     onClick={() => setActiveTab("account")}
//                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
//                         activeTab === "account"
//                             ? "bg-white text-[#FF3F33] shadow-sm"
//                             : "text-gray-600 hover:text-gray-900"
//                     }`}
//                 >
//                     <Settings className="h-4 w-4" />
//                     Account Settings
//                 </button>
//             </div>

//             {/* Staff Management Tab */}
//             {activeTab === "staff" && <StaffManagementNew />}

//             {/* Account Settings Tab */}
//             {activeTab === "account" && <Account />}
//         </div>
//     );
// }
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
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
    User,
    Users,
    Search,
    Filter,
    X,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Calendar,
    Edit,
    Trash2,
    Plus,
    Settings,
    UserCheck,
    UserX,
} from "lucide-react";
import { axiosInstance } from "@/api/axios";
import { logoutSupervisor } from "@/lib/logoutApi";
import { clearUser } from "@/features/UserSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Account } from "./AccountPage";
import { StaffManagementNew } from "./StaffUsers";

export function SupervisorSettings() {
    const [activeTab, setActiveTab] = useState<"staff" | "account">("account");
    const [direction, setDirection] = useState<"left" | "right">("right");

    const handleTabChange = (tab: "staff" | "account") => {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Settings
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Manage your team and account settings
                </p>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => handleTabChange("staff")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "staff"
                            ? "bg-white text-[#FF3F33] shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    <Users className="h-4 w-4" />
                    Staff Management
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
                    {activeTab === "staff" && <StaffManagementNew />}
                    {activeTab === "account" && <Account />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}