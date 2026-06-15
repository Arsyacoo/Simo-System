import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Truck,
  CheckSquare,
  FileText,
  Search,
  Bell,
  User,
  HelpCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { getAllowedNavItems, canAccessPath, getDefaultPathForRole } from './auth/roleAccess';
import { AppDataProvider } from './context/AppDataContext';
import { useAppData } from './context/AppDataCore';
import { useAuth } from './context/AuthCore';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Logistics from './pages/Logistics';
import AuditLogs from './pages/AuditLogs';
import Warehouses from './pages/Warehouses';
import QualityControl from './pages/QualityControl';
import Login from './pages/Login';

const navIcons = {
  '/': LayoutDashboard,
  '/warehouses': Box,
  '/logistics': Truck,
  '/qc': CheckSquare,
  '/audit': FileText,
};

const sourceLabels = {
  backend: 'Backend API',
  localStorage: 'Local demo',
  'localStorage-fallback': 'Local fallback',
};

const SidebarItem = ({ icon: Icon, label, path }) => (
  <NavLink
    to={path}
    end={path === '/'}
    className={({ isActive }) =>
      `flex flex-shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

const UserSession = () => {
  const { currentUser, logout } = useAuth();
  const { apiError, dataSource, isLoading, resetDemoData } = useAppData();

  return (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
      <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 sm:flex">
        <User size={16} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase text-slate-400">
          {sourceLabels[dataSource] || dataSource}
          {isLoading ? ' - syncing' : ''}
        </p>
        <p className="max-w-[240px] truncate text-sm font-semibold text-slate-700">
          {currentUser?.name} - {currentUser?.roleName}
        </p>
      </div>
      <button
        type="button"
        aria-label="Reset demo data"
        title="Reset demo data"
        onClick={resetDemoData}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <RefreshCw size={16} />
      </button>
      <button
        type="button"
        aria-label="Logout"
        title="Logout"
        onClick={logout}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <LogOut size={16} />
      </button>
      {apiError && (
        <span className="hidden max-w-[220px] truncate rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 lg:inline">
          {apiError}
        </span>
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  const { currentUser } = useAuth();
  const navItems = getAllowedNavItems(currentUser?.roleId);

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans text-slate-800 lg:flex">
      <aside className="border-b border-slate-200 bg-[#f8fafc] lg:min-h-screen lg:w-[260px] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
              S
            </div>
            <span className="text-xl font-bold text-blue-700">SIMO Mugi Jaya</span>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={navIcons[item.path]}
              label={item.label}
              path={item.path}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-[#f8fafc]/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search projects, work items, audit logs..."
                  className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative hidden sm:block">
                <Bell className="text-slate-500" size={20} />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#f8fafc] bg-red-500"></span>
              </div>
              <UserSession />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <button
        type="button"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition-colors hover:bg-slate-50"
      >
        <HelpCircle size={20} />
      </button>
    </div>
  );
};

function ProtectedShell() {
  const location = useLocation();
  const { currentUser, isAuthenticated, isRestoringSession } = useAuth();

  if (isRestoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] text-sm font-semibold text-slate-500">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPath(currentUser.roleId, location.pathname)) {
    return <Navigate to={getDefaultPathForRole(currentUser.roleId)} replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function RoleRoute({ children }) {
  const location = useLocation();
  const { currentUser } = useAuth();

  if (!canAccessPath(currentUser?.roleId, location.pathname)) {
    return <Navigate to={getDefaultPathForRole(currentUser?.roleId)} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedShell />}>
          <Route path="/" element={<RoleRoute><Dashboard /></RoleRoute>} />
          <Route path="/logistics" element={<RoleRoute><Logistics /></RoleRoute>} />
          <Route path="/audit" element={<RoleRoute><AuditLogs /></RoleRoute>} />
          <Route path="/warehouses" element={<RoleRoute><Warehouses /></RoleRoute>} />
          <Route path="/qc" element={<RoleRoute><QualityControl /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppRoutes />
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
