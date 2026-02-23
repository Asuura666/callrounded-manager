import { Route, Switch, useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AgentsPage } from "@/pages/AgentsPage";
import { CallsPage } from "@/pages/CallsPage";
import { CallDetailPage } from "@/pages/CallDetailPage";
import { CallHistoryRich } from "@/pages/CallHistoryRich";
import { PhoneNumbersPage } from "@/pages/PhoneNumbersPage";
import { KnowledgeBasesPage } from "@/pages/KnowledgeBasesPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AgentBuilderPage } from "@/pages/AgentBuilderPage";
import { AnalyticsDashboard } from "@/pages/AnalyticsDashboard";
import { AlertsConfig } from "@/pages/AlertsConfig";
import { ReportSettings } from "@/pages/ReportSettings";
import { CalendarIntegration } from "@/pages/CalendarIntegration";
import { LoadingSpinner } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

// Admin route guard
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  
  if (!(user?.role === "ADMIN" || user?.role === "TENANT_ADMIN" || user?.role === "SUPER_ADMIN")) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="text-center relative z-10" style={{ animation: "fade-in 0.4s ease-out forwards" }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-4xl font-bold text-gold font-heading">W&I</h1>
            <Sparkles className="w-6 h-6 text-gold/60 animate-pulse" />
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent rounded-full mx-auto mb-6" />
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-white/50 text-sm animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage onLogin={async (email, password) => { await login(email, password); setLocation("/"); }} />
    );
  }


  return (
    <AppLayout user={user} onLogout={logout}>
      <Switch>
        {/* Main routes */}
        <Route path="/" component={DashboardPage} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/agents" component={AgentsPage} />
        <Route path="/calls" component={CallHistoryRich} />
        <Route path="/calls/:id" component={CallDetailPage} />
        <Route path="/alerts" component={AlertsConfig} />
        <Route path="/reports" component={ReportSettings} />
        <Route path="/calendar" component={CalendarIntegration} />
        <Route path="/phone-numbers" component={PhoneNumbersPage} />
        <Route path="/knowledge-bases" component={KnowledgeBasesPage} />
        
        {/* Admin routes */}
        <Route path="/admin/users">
          <AdminRoute component={AdminUsersPage} />
        </Route>
        <Route path="/admin/agent-builder">
          <AdminRoute component={AgentBuilderPage} />
        </Route>
        
        {/* 404 */}
        <Route>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>
              <span className="text-3xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold text-navy font-heading mb-2">Page introuvable</h2>
            <p className="text-text-muted">La page que vous recherchez n'existe pas.</p>
          </div>
        </Route>
      </Switch>
    </AppLayout>
  );
}
