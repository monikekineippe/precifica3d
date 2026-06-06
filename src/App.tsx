import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet } from 'react-helmet-async';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import PrintersPage from "@/pages/PrintersPage";
import NewPricing from "@/pages/NewPricing";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import PlansPage from "@/pages/PlansPage";
import ReportsPage from "@/pages/ReportsPage";
import InventoryPage from "@/pages/InventoryPage";
import LandingPage from "@/pages/LandingPage";
import CalculatorSEOPage from "@/pages/CalculatorSEOPage";
import InventorySEOPage from "@/pages/InventorySEOPage";
import SoftwareGestaoPage from "@/pages/SoftwareGestaoPage";
import BlogPage from "@/pages/BlogPage";
import AuthPage from "@/pages/AuthPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SalesPage from "@/pages/SalesPage";
import ClientsPage from "@/pages/ClientsPage";
import MarketplacePage from "@/pages/MarketplacePage";
import NotFound from "@/pages/NotFound";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/calculadora-preco-impressao-3d" element={<CalculatorSEOPage />} />
            <Route path="/controle-estoque-filamento" element={<InventorySEOPage />} />
            <Route path="/software-gestao-impressao-3d" element={<SoftwareGestaoPage />} />

            <Route path="/login" element={<AuthPage />} />
             <Route path="/signup" element={<AuthPage initialIsLogin={false} />} />
             <Route path="/register" element={<AuthPage initialIsLogin={false} />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/planos" element={<PlansPage />} />
            {/* Protected */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/printers" element={<PrintersPage />} />
              <Route path="/new" element={<NewPricing />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
