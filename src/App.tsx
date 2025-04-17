
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createContext, useState } from "react";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";

// Create a context for app-wide settings
export const AppSettingsContext = createContext({
  disableTestData: true, // Changed to true by default
  setDisableTestData: (value: boolean) => {}
});

// Create Query Client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => {
  // App-wide setting to disable test data (changed to true by default)
  const [disableTestData, setDisableTestData] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsContext.Provider value={{ disableTestData, setDisableTestData }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppSettingsContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
