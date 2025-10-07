// import { UserAuth } from "@/hooks/useAuth";
// import React, { ReactNode } from "react";

// import { Navigate } from "react-router-dom";

// interface PublicRouteProps {
//   children: ReactNode;
// }

// const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
//   const { isAuthenticated, user } = UserAuth();

//   if (!isAuthenticated) {
//     return <>{children}</>;
//   }
//   switch (user?.role) {
//     case "Owner":
//       return <Navigate to="/Owner/dashboard" replace />;
//     case "Staff":
//       return <Navigate to="/Staff/dashboard" replace />;
//     case "FloorSupervisor":
//       return <Navigate to="/FloorSupervisor/dashboard" replace />;
//     case "Accountant":
//       return <Navigate to="/accountant/dashboard" replace />;
//     default:
//       return <Navigate to="/" replace />;
//   }
// };

// export default PublicRoute;


import { UserAuth } from "@/hooks/useAuth";
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PublicRouteProps {
    children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, user } = UserAuth();

    if (!isAuthenticated) return <>{children}</>;

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
};

export default PublicRoute;
