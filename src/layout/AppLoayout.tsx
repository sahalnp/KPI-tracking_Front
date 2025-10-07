import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarTrigger,SidebarProvider,SidebarInset,Sidebar } from "@/components/ui/sidebar";

export const Layout = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const location = useLocation();


  const LoadingSpinner = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-card p-6 rounded-lg shadow-lg border"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-foreground">Logging out...</span>
        </div>
      </motion.div>
    </motion.div>
  );

return (
   <SidebarProvider>
  <div className="flex h-screen w-full">

    <SidebarInset className="flex-1 flex flex-col">
    

      {/* Page Content */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="pt-4"
      >
        <Outlet context={{ currentUser, setCurrentUser }} />
      </motion.div>
    </SidebarInset>
  </div>
</SidebarProvider>

  );
};
