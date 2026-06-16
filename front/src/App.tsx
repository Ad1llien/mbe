import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import OnboardingPage from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import VerifyEmailPage from './pages/VerifyEmail';

const queryClient = new QueryClient();

// Dashboard: must be logged in AND have completed onboarding
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isComplete = useOnboardingStore((s) => s.isComplete);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isComplete) return <Navigate to="/register" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
