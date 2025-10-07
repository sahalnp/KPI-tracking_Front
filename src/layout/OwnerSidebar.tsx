import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Home, LayoutDashboard, Users, Building, Target, FileText, BarChart3, Calendar } from 'lucide-react';

const menuItems = [
  { id: 'dashboard',     title: 'Dashboard', icon: LayoutDashboard, desc: 'Overview and analytics', path: '/owner/dashboard' },
  { id: 'users',         title: 'Users',     icon: Users,           desc: 'Employee management',   path: '/owner/users' },
  { id: 'floors',        title: 'Floors',    icon: Building,        desc: 'Floor management',      path: '/owner/floors' },
  { id: 'kpis',          title: 'KPIs',      icon: Target,          desc: 'KPI management',        path: '/owner/kpis' },
  { id: 'scores',        title: 'Scores',    icon: FileText,        desc: 'Score tracking',        path: '/owner/scores' },
  { id: 'sales',         title: 'Sales',     icon: BarChart3,       desc: 'Sales management',      path: '/owner/sales' },
  { id: 'leaves',        title: 'Leaves',    icon: Calendar,        desc: 'Leave management',      path: '/owner/leaves' },
];

export default function AppLoayout({ onLogout }: { onLogout?: () => void }) {
  const location = useLocation();
    const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Find active menu item based on current route
  const activeItem = menuItems.find((m) => location.pathname.startsWith(m.path));
 const handleLogout = () => {
    setIsLoading(true);

    // Clear user immediately to prevent navigation issues
    setCurrentUser(null);

    setTimeout(() => {
      setIsLoading(false);
      navigate("/", { replace: true });
    }, 600);
  };
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              {/* sidebar trigger */}
              <SidebarTrigger />
              <Home className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-semibold text-primary">Owner Dashboard</h2>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((m) => (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton
                        onClick={() => navigate(m.path)}
                        isActive={location.pathname.startsWith(m.path)}
                      >
                        <m.icon />
                        <span>{m.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            {onLogout && (
              <Button onClick={onLogout} variant="outline" size="sm" className="w-full gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center mt-2">
              © 2024 Store Management
            </p>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="font-semibold">{activeItem?.title}</h1>
              <p className="text-sm text-muted-foreground">{activeItem?.desc}</p>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {/* Nested routes will be rendered here */}
            <Outlet />
          </main>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
