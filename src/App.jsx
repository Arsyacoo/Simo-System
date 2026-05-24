import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  Truck, 
  CheckSquare, 
  FileText,
  Search,
  Bell,
  User,
  HelpCircle
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Logistics from './pages/Logistics';
import AuditLogs from './pages/AuditLogs';

const SidebarItem = ({ icon: Icon, label, path }) => {
  const location = useLocation();
  const isActive = location.pathname === path || (path === '/' && location.pathname === '/dashboard');
  
  return (
    <a 
      href={path}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
      {label}
    </a>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#f4f7fb] font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#f8fafc] border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold text-lg">
              S
            </div>
            <span className="text-xl font-bold text-blue-700">SIMO System</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" />
          <SidebarItem icon={Box} label="Warehouses" path="/warehouses" />
          <SidebarItem icon={Truck} label="Logistics" path="/logistics" />
          <SidebarItem icon={CheckSquare} label="QC" path="/qc" />
          <SidebarItem icon={FileText} label="Audit Logs" path="/audit" />
        </nav>
        
        <div className="p-4">
          <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg flex items-center">
            Do not sell or share my personal info
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-[#f8fafc]/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
          <div className="w-[400px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search components, logs, manifests..." 
                className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell className="text-slate-500" size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f8fafc]"></span>
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <span className="text-sm font-medium text-slate-700">Pabrik Utama, IKN</span>
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50">
        <HelpCircle size={20} />
      </div>
    </div>
  );
};

// Placeholder for unhandled routes
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full text-slate-400">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p>Page is under construction.</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/warehouses" element={<Placeholder title="Warehouses" />} />
          <Route path="/qc" element={<Placeholder title="Quality Control" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
