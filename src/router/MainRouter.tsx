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
import { SupervisorDashboard, SupervisorScoringForm, SupervisorSettings } from "@/components/Supervisor/SupervisorScreen";
import { SupervisorReports } from "@/components/Supervisor/SupervisorReports";

import { SupervisorStaffReportView } from "@/components/Supervisor/reports/staffReports";
import SupervisorSalesReportPage from "@/components/Supervisor/reports/salesReport";
import SupervisorAttendanceReportPage from "@/components/Supervisor/reports/attendanceReport";
import { SupervisorWalkoutReportPage } from "@/components/Supervisor/reports/walkoutReport";
import { AccountantDashboard } from "@/components/Accountant/AccountantScreen";
import { AccountantLayout } from "@/components/Accountant/AccountantLayout";
import { AccountantAccount } from "@/components/Accountant/AccountantAccount";
import { MonthlyUploads } from "@/components/Accountant/MonthlyUploads";
import { AttendanceManagement } from "@/components/Accountant/AttendenceManagment";

import { OwnerScoringForm } from "@/components/Owner/ScoringPage";
import { OwnerReport } from "@/components/Owner/Reports";
import { StaffReportView } from "@/components/Owner/reports/staffReports";
import SalesReportPage from "@/components/Owner/reports/salesReport";
import AttendanceReportPage from "@/components/Owner/reports/attendanceReport";
import { WalkoutReportPage } from "@/components/Owner/reports/walkoutReport";

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
                                 {
                                    path: "sales",
                                    element: <SalesReportPage />,
                                },
                                 {
                                    path: "attendance",
                                    element: <AttendanceReportPage />,
                                },
                                {
                                    path: "walkout",
                                    element: <WalkoutReportPage />,
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
                        { path: "scoring", element: <SupervisorScoringForm /> },
                        {
                            path: "reports",
                            children: [
                                {
                                    index: true,
                                    element: <SupervisorReports />,
                                },
                                {
                                    path: "staff",
                                    element: <SupervisorStaffReportView />,
                                },
                                {
                                    path: "sales",
                                    element: <SupervisorSalesReportPage />,
                                },
                                {
                                    path: "attendance",
                                    element: <SupervisorAttendanceReportPage />,
                                },
                                {
                                    path: "walkout",
                                    element: <SupervisorWalkoutReportPage />,
                                },
                            ],
                        },
                        { path: "settings", element: <SupervisorSettings /> },
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
                        
                    ],
                },
                { path: "*", element: <Navigate to="/" replace /> },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}

export default MainRouter;
