import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";
import { LoginScreen } from "@/components/LoginScreen";

import AccountSettings from "@/components/Owner/AccountPage";
import { OwnerLayout } from "@/components/Owner/layout";
import OwnerDashboard from "@/components/Owner/DashboardPage";

import { SalesDashboard } from "@/components/sales/saleDashboard";
import { SalesKPI } from "@/components/sales/saleKpi";
import { SalesAccount } from "@/components/sales/salesAccount";
import { SalesBottomNav } from "@/components/sales/saleBottomNav";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";
import { SupervisorLayout } from "@/components/Supervisor/SupervisorLayout";
import { SupervisorDashboard } from "@/components/Supervisor/SupervisorScreen";
import { StaffScoringForm } from "@/components/Supervisor/SupervisorScoring";
import { WalkOutManagement } from "@/components/Supervisor/WalkOutManagement";
import { StaffManagementNew } from "@/components/Supervisor/StaffUsers";
import { Account } from "@/components/Supervisor/AccountPage";
import { AccountantDashboard } from "@/components/Accountant/AccountantScreen";
import { AccountantLayout } from "@/components/Accountant/AccountantLayout";
import { AccountantAccount } from "@/components/Accountant/AccountantAccount";
import { MonthlyUploads } from "@/components/Accountant/MonthlyUploads";
import { AttendanceManagement } from "@/components/Accountant/AttendenceManagment";
import { SalesReports } from "@/components/Accountant/AccountantSalesPage";
import { OwnerScoringForm } from "@/components/Owner/ScoringPage";
import { OwnerReport } from "@/components/Owner/Reports";
import { StaffReportView } from "@/components/Owner/reports/staffReports";
function MainRouter() {
    const router = createBrowserRouter([
        {
            path: "/",
            children: [
                {
                    index: true,
                    element: (
                        <PublicRouter>
                            <LoginScreen />
                        </PublicRouter>
                    ),
                },

                // Owner routes
                {
                    path: "Owner",
                    element: (
                        <PrivateRouter allowedRoles={["Owner"]}>
                            <OwnerLayout />
                        </PrivateRouter>
                    ),
                    children: [
                        { path: "dashboard", element: <OwnerDashboard /> },
                        {
                            path: "reports",
                            children: [
                                {
                                    index: true,
                                    element: <OwnerReport />,
                                },
                                {
                                    path: "staff",
                                    element: <StaffReportView />,
                                },
                            ],
                        },

                        { path: "scoring", element: <OwnerScoringForm /> },
                        { path: "account", element: <AccountSettings /> },
                    ],
                },

                // Floor Supervisor routes
                {
                    path: "FloorSupervisor",
                    element: (
                        <PrivateRouter allowedRoles={["FloorSupervisor"]}>
                            <SupervisorLayout />
                        </PrivateRouter>
                    ),
                    children: [
                        { path: "dashboard", element: <SupervisorDashboard /> },
                        { path: "scoring", element: <StaffScoringForm /> },
                        { path: "walkouts", element: <WalkOutManagement /> },
                        { path: "Users", element: <StaffManagementNew /> },
                        { path: "account", element: <Account /> },
                    ],
                },

                // Staff routes
                {
                    path: "Staff",
                    element: (
                        <PrivateRouter allowedRoles={["Staff"]}>
                            <SalesBottomNav />
                        </PrivateRouter>
                    ),
                    children: [
                        { path: "dashboard", element: <SalesDashboard /> },
                        { path: "myKpi", element: <SalesKPI /> },
                        { path: "account", element: <SalesAccount /> },
                    ],
                },

                // Accountant routes
                {
                    path: "accountant",
                    element: (
                        <PrivateRouter allowedRoles={["Accountant"]}>
                            <AccountantLayout />
                        </PrivateRouter>
                    ),
                    children: [
                        { path: "dashboard", element: <AccountantDashboard /> },
                        { path: "uploads", element: <MonthlyUploads /> },
                        { path: "account", element: <AccountantAccount /> },
                        {
                            path: "attendence",
                            element: <AttendanceManagement />,
                        },
                        { path: "sales", element: <SalesReports /> },
                    ],
                },
                { path: "*", element: <Navigate to="/" replace /> },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}

export default MainRouter;
