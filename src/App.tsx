import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActiveProfileProvider } from "@/contexts/ActiveProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppShell } from "@/components/AppShell";
import { OfflineBanner } from "@/components/OfflineBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import SourcesMethodologyPage from "./pages/SourcesMethodologyPage";
import AdvisoryBoardPage from "./pages/AdvisoryBoardPage";
import AdminLogin from "./pages/AdminLogin";
import Onboarding from "./pages/Onboarding";
import UploadLab from "./pages/UploadLab";
import ResultReport from "./pages/ResultReport";
import History from "./pages/History";
import Trends from "./pages/Trends";
import BulkUpload from "./pages/BulkUpload";
import Profile from "./pages/Profile";
import Family from "./pages/Family";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ControlRoom from "./pages/admin/ControlRoom";
import SupportDesk from "./pages/admin/SupportDesk";
import IssueQueue from "./pages/admin/IssueQueue";
import IssueDetail from "./pages/admin/IssueDetail";
import { AdminRoute } from "./components/AdminRoute";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import ResetPassword from "./pages/ResetPassword";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

/** Public landing — auto-bounces signed-in users to /app */
const PublicLanding = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return <Landing />;
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
        {/* Public marketing site at the root URL */}
        <Route path="/" element={<PageFade><PublicLanding /></PageFade>} />
        {/* Back-compat: old /landing → / */}
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/sources" element={<PageFade><SourcesMethodologyPage /></PageFade>} />
        <Route path="/advisory-board" element={<PageFade><AdvisoryBoardPage /></PageFade>} />

        <Route path="/auth" element={<PageFade><Auth /></PageFade>} />
        <Route path="/admin-login" element={<PageFade><AdminLogin /></PageFade>} />
        <Route path="/onboarding" element={<PageFade><Onboarding /></PageFade>} />
        <Route path="/unsubscribe" element={<PageFade><Unsubscribe /></PageFade>} />
        <Route path="/reset-password" element={<PageFade><ResetPassword /></PageFade>} />

        {/* Authenticated app under /app */}
        <Route path="/app" element={
          <ProtectedRoute>
            <ActiveProfileProvider>
              <AppShell />
            </ActiveProfileProvider>
          </ProtectedRoute>
        }>
          <Route index element={<PageFade><Index /></PageFade>} />
          <Route path="upload" element={<PageFade><UploadLab /></PageFade>} />
          <Route path="result/:id" element={<PageFade><ResultReport /></PageFade>} />
          <Route path="history" element={<PageFade><History /></PageFade>} />
          <Route path="trends" element={<PageFade><Trends /></PageFade>} />
          <Route path="bulk-upload" element={<PageFade><BulkUpload /></PageFade>} />
          <Route path="family" element={<PageFade><Family /></PageFade>} />
          <Route path="profile" element={<PageFade><Profile /></PageFade>} />
          <Route path="admin" element={<AdminRoute><PageFade><AdminDashboard /></PageFade></AdminRoute>} />
          <Route path="admin/control-room" element={<AdminRoute><PageFade><ControlRoom /></PageFade></AdminRoute>} />
          <Route path="admin/support" element={<AdminRoute><PageFade><SupportDesk /></PageFade></AdminRoute>} />
          <Route path="admin/issues" element={<AdminRoute><PageFade><IssueQueue /></PageFade></AdminRoute>} />
          <Route path="admin/issues/:id" element={<AdminRoute><PageFade><IssueDetail /></PageFade></AdminRoute>} />
        </Route>

        {/* Back-compat redirects for old top-level app paths */}
        <Route path="/upload" element={<Navigate to="/app/upload" replace />} />
        <Route path="/result/:id" element={<Navigate to="/app/result/:id" replace />} />
        <Route path="/history" element={<Navigate to="/app/history" replace />} />
        <Route path="/trends" element={<Navigate to="/app/trends" replace />} />
        <Route path="/bulk-upload" element={<Navigate to="/app/bulk-upload" replace />} />
        <Route path="/family" element={<Navigate to="/app/family" replace />} />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OfflineBanner />
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
