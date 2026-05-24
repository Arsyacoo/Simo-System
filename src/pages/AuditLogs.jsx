import { Download, Calendar, Users, Activity } from 'lucide-react';

const FilterDropdown = ({ label, icon: Icon, value }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white shadow-sm min-w-[160px] cursor-pointer hover:border-slate-300">
      <Icon size={16} className="text-slate-400" />
      <span className="text-sm font-medium text-slate-700 flex-1">{value}</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
);

const Badge = ({ type }) => {
  const styles = {
    UPDATE: 'bg-amber-100 text-amber-700 border-amber-200',
    INSERT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DELETE: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${styles[type]}`}>
      {type}
    </span>
  );
};

export default function AuditLogs() {
  const logs = [
    { id: 1, timestamp: '2026-05-19 14:32:01', user: 'Budi Santoso (Admin)', action: 'UPDATE', table: 'tasks_warehouse_3', value: 'Status...' },
    { id: 2, timestamp: '2026-05-19 14:15:22', user: 'Ahmad Riyadi (Driver)', action: 'UPDATE', table: 'logistics_manifest', value: 'locati...' },
    { id: 3, timestamp: '2026-05-19 13:45:10', user: 'Siti Nurhaliza (QC)', action: 'INSERT', table: 'qc_inspections', value: '-' },
    { id: 4, timestamp: '2026-05-19 11:20:05', user: 'System System', action: 'DELETE', table: 'temporary_sessions', value: 'Sessio...' },
    { id: 5, timestamp: '2026-05-19 10:05:41', user: 'Joko Anwar (Foreman)', action: 'UPDATE', table: 'inventory_materials', value: 'Stock(...' },
    { id: 6, timestamp: '2026-05-19 09:12:33', user: 'Budi Santoso (Admin)', action: 'UPDATE', table: 'system_settings', value: 'Mainte...' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Audit Trail & Activity Log</h2>
          <p className="text-slate-500">System-wide security and data modification records</p>
        </div>
        
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <FilterDropdown label="Date Range" icon={Calendar} value="Today" />
        <FilterDropdown label="User Role" icon={Users} value="All Roles" />
        <FilterDropdown label="Action Type" icon={Activity} value="All Actions" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">TIMESTAMP</th>
                <th className="px-6 py-4 whitespace-nowrap">PENGGUNA</th>
                <th className="px-6 py-4 whitespace-nowrap">AKSI</th>
                <th className="px-6 py-4 whitespace-nowrap">TABEL TERDAMPAK</th>
                <th className="px-6 py-4 whitespace-nowrap">NILAI SEBELUM...</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge type={log.action} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{log.table}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-[150px]">{log.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between mt-auto">
          <span className="text-sm text-slate-500 font-medium">
            Showing 1 to 6 of 1,240 entries
          </span>
          
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">
              Prev
            </button>
            <button className="px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded">
              1
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
              2
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
              3
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
