// src/pages/supervisor/SupervisorLayout.tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { UserAuth } from "@/hooks/useAuth";
import {
    Home,
    ClipboardCheck,
    UserX,
    User,
    Users,
    LayoutDashboard,
    Target,
} from "lucide-react";

interface BottomNavProps {
    userRole: string;
    currentPage: string;
    onNavigate: (page: string) => void;
}

function BottomNav({ userRole, currentPage, onNavigate }: BottomNavProps) {
    const supervisorTabs = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            to: "/owner/dashboard",
        },
        { id: "scoring", label: "Scoring", icon: ClipboardCheck },
        { id: "kpis", label: "KPIs", icon: Target, to: "/owner/kpis" },
        { id: "users", label: "Users", icon: Users, to: "/owner/users" },
        { id: "account", label: "Account", icon: User, to: "/owner/account" },
    ];

    const tabs = userRole === "Owner" ? supervisorTabs : [];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
            <div className="flex">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentPage === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onNavigate(tab.id)}
                            className="flex-1 flex flex-col items-center py-2 px-1 relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[#FF3F33]/10 rounded-t-lg"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        bounce: 0.2,
                                        duration: 0.6,
                                    }}
                                />
                            )}
                            <Icon
                                className={`w-6 h-6 mb-1 ${
                                    isActive
                                        ? "text-[#FF3F33]"
                                        : "text-gray-400"
                                }`}
                            />
                            <span
                                className={`text-xs ${
                                    isActive
                                        ? "text-[#FF3F33]"
                                        : "text-gray-400"
                                }`}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function OwnerLayout() {
    const { user } = UserAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (user === undefined) return;

        if (!user || user.role !== "Owner") {
            navigate("/", { replace: true });
            return;
        }

        if (location.pathname === "/Owner") {
            setIsRedirecting(true);
            navigate("/Owner/dashboard", { replace: true });
        } else {
            setIsRedirecting(false);
        }
    }, [user, navigate, location.pathname]);

    if (!user || user.role !== "Owner") {
        return null;
    }

    // Don't render content during redirect to avoid double animation
    if (isRedirecting) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header with Glass Effect */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#FF3F33]/20 rounded-full blur-md"></div>
                                <img
                                    src="/images/century.png"
                                    alt="Century Logo"
                                    className="w-10 h-10 relative z-10 rounded-full"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-[#FF3F33] tracking-tight">
                                    Century Fashion City
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Welcome, Owner
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-gradient-to-br from-gray-50 to-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                <p className="text-sm font-semibold capitalize text-gray-900">
                                    {user?.section}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav
                userRole={user.role}
                currentPage={location.pathname.split("/").pop() || "dashboard"}
                onNavigate={(page) => navigate(`/Owner/${page}`)}
            />
        </div>
    );
}
