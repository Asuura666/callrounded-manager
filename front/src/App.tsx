import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AgentsPage } from "@/pages/AgentsPage";
import { CallsPage } from "@/pages/CallsPage";
import { CallDetailPage } from "@/pages/CallDetailPage";
import { PhoneNumbersPage } from "@/pages/PhoneNumbersPage";
import { KnowledgeBasesPage } from "@/pages/KnowledgeBasesPage";

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-muted">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={async (email, password) => {
          await login(email, password);
          setLocation("/");
        }}
      />
    );
  }

  return (
    <AppLayout user={user} onLogout={logout}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/agents" component={AgentsPage} />
        <Route path="/calls" component={CallsPage} />
        <Route path="/calls/:id" component={CallDetailPage} />
        <Route path="/phone-numbers" component={PhoneNumbersPage} />
        <Route path="/knowledge-bases" component={KnowledgeBasesPage} />
        <Route>
          <div className="text-center py-12 text-text-muted">Page introuvable</div>
        </Route>
      </Switch>
    </AppLayout>
  );
}
