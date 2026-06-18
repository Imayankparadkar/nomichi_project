import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/lib/auth";
import PublicPage from "@/pages/PublicPage";
import StatusPage from "@/pages/StatusPage";
import LoginPage from "@/pages/admin/LoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import LeadsPage from "@/pages/admin/LeadsPage";
import LeadDetailPage from "@/pages/admin/LeadDetailPage";
import TripsPage from "@/pages/admin/TripsPage";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-ink/40 font-poppins text-sm">Loading…</p>
      </div>
    );
  }
  if (!user) return <Redirect to="/admin/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/admin/login" component={LoginPage} />
      <Route path="/admin">
        {() => <Redirect to="/admin/dashboard" />}
      </Route>
      <Route path="/admin/dashboard">
        {() => (
          <AdminLayout>
            <ProtectedRoute component={DashboardPage} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/leads/:id">
        {() => (
          <AdminLayout>
            <ProtectedRoute component={LeadDetailPage} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/leads">
        {() => (
          <AdminLayout>
            <ProtectedRoute component={LeadsPage} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/trips">
        {() => (
          <AdminLayout>
            <ProtectedRoute component={TripsPage} />
          </AdminLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
