import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import MedicineManagement from "./pages/MedicineManagement";
import ImportManagement from "./pages/ImportManagement";
import ExportManagement from "./pages/ExportManagement";
import TransactionHistory from "./pages/TransactionHistory";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} nest>
        {() => (
          <DashboardLayout>
            <Switch>
              <Route path={"/"} component={Dashboard} />
              <Route path={"/medicines"} component={MedicineManagement} />
              <Route path={"/imports"} component={ImportManagement} />
              <Route path={"/exports"} component={ExportManagement} />
              <Route path={"/history"} component={TransactionHistory} />
              <Route path={"/reports"} component={Reports} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
