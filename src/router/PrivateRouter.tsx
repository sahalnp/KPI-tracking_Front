


import { UserAuth } from "@/hooks/useAuth";
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = UserAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        switch (user?.role) {
            case "Owner":
                return <Navigate to="/Owner/dashboard" replace />;
            case "Staff":
                return <Navigate to="/Staff/dashboard" replace />;
            case "FloorSupervisor":
                return <Navigate to="/FloorSupervisor/dashboard" replace />;
            case "Accountant":
                return <Navigate to="/accountant/dashboard" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default PrivateRoute;
    