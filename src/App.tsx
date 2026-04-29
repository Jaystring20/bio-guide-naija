import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActiveProfileProvider } from "@/contexts/ActiveProfileContext";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import UploadLab from "./pages/UploadLab";
import ResultReport from "./pages/ResultReport";
import History from "./pages/History";
import Trends from "./pages/Trends";
import BulkUpload from "./pages/BulkUpload";
import Profile from "./pages/Profile";
import Family from "./pages/Family";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/landing" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const PageFade = ({ children }: { children: React.ReactNode }) => {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/landing" element={<PageFade><Landing /></PageFade>} />
        <Route path="/auth" element={<PageFade><Auth /></PageFade>} />
        <Route path="/onboarding" element={<PageFade><Onboarding /></PageFade>} />
        <Route element={
          <ProtectedRoute>
            <ActiveProfileProvider>
              <AppShell />
            </ActiveProfileProvider>
          </ProtectedRoute>
        }>
          <Route path="/" element={<PageFade><Index /></PageFade>} />
          <Route path="/upload" element={<PageFade><UploadLab /></PageFade>} />
          <Route path="/result/:id" element={<PageFade><ResultReport /></PageFade>} />
          <Route path="/history" element={<PageFade><History /></PageFade>} />
          <Route path="/trends" element={<PageFade><Trends /></PageFade>} />
          <Route path="/bulk-upload" element={<PageFade><BulkUpload /></PageFade>} />
          <Route path="/family" element={<PageFade><Family /></PageFade>} />
          <Route path="/profile" element={<PageFade><Profile /></PageFade>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
