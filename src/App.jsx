import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { AppDataProvider } from './context/AppDataContext';
import { useAppData } from './context/AppDataCore';
import { useBackendApi } from './services/apiClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Logistics from './pages/Logistics';
import AuditLogs from './pages/AuditLogs';
import Warehouses from './pages/Warehouses';
import QualityControl from './pages/QualityControl';

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

const UserSwitcher = () => {
  const { users, activeUser, activeUserId, setActiveUserId, resetDemoData, token, logout } = useAppData();
  const useApi = useBackendApi;

  if (useApi && token) {
    return (
      <div className="flex items-center gap-3 border-t border-slate-200 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 sm:flex">
          <User size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase text-slate-400">Connected</p>
          <span className="block text-sm font-bold text-slate-700 truncate max-w-[140px]" title={activeUser?.name}>
            {activeUser?.name}
          </span>
          <span className="block text-[10px] font-medium text-slate-500 truncate max-w-[140px]">
            {activeUser?.roleName}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex h-8 px-2.5 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold shadow-sm transition-colors hover:bg-red-100"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
      <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 sm:flex">
        <User size={16} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase text-slate-400">{activeUser?.site}</p>
        <select
          aria-label="Active demo user"
          value={activeUserId}
          onChange={(event) => setActiveUserId(event.target.value)}
          className="w-full max-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.roleName}
            </option>
          ))}
        </select>
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
    </div>
  );
};

const Layout = ({ children }) => {
  const { permissions } = useAppData();

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
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" />
          {permissions.canUpdateProduction && (
            <SidebarItem icon={Box} label="Warehouses" path="/warehouses" />
          )}
          <SidebarItem icon={Truck} label="Logistics" path="/logistics" />
          {permissions.canSubmitQc && (
            <SidebarItem icon={CheckSquare} label="QC" path="/qc" />
          )}
          {permissions.canViewAudit && (
            <SidebarItem icon={FileText} label="Audit Logs" path="/audit" />
          )}
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
              <UserSwitcher />
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

function AppRoutes() {
  const { token, permissions } = useAppData();
  const useApi = useBackendApi;

  if (useApi && !token) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route
            path="/audit"
            element={
              permissions.canViewAudit ? <AuditLogs /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/warehouses"
            element={
              permissions.canUpdateProduction ? <Warehouses /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/qc"
            element={
              permissions.canSubmitQc ? <QualityControl /> : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppDataProvider>
      <AppRoutes />
    </AppDataProvider>
  );
}

export default App;
