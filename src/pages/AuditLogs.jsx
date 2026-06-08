import { useMemo, useState } from 'react';
import { Activity, Calendar, Download, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataCore';

const actionStyles = {
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200',
  INSERT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DELETE: 'bg-rose-100 text-rose-700 border-rose-200',
};

const Badge = ({ type }) => (
  <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold ${actionStyles[type] || actionStyles.UPDATE}`}>
    {type}
  </span>
);

const FilterSelect = ({ label, icon: Icon, value, onChange, children }) => (
  <div>
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[180px] rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  </div>
);

function escapeCsv(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AuditLogs() {
  const { data, permissions } = useAppData();
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const roles = useMemo(() => [...new Set(data.auditLogs.map((log) => log.role))], [data.auditLogs]);
  const actions = useMemo(() => [...new Set(data.auditLogs.map((log) => log.action))], [data.auditLogs]);

  const logs = useMemo(
    () =>
      data.auditLogs.filter(
        (log) =>
          (roleFilter === 'all' || log.role === roleFilter) &&
          (actionFilter === 'all' || log.action === actionFilter),
      ),
    [actionFilter, data.auditLogs, roleFilter],
  );

  const handleExport = () => {
    const header = [
      'timestamp',
      'user',
      'role',
      'action',
      'table',
      'record_id',
      'previous_value',
      'new_value',
      'description',
    ];
    const rows = logs.map((log) => [
      log.timestamp,
      log.user,
      log.role,
      log.action,
      log.table,
      log.recordId,
      log.previousValue,
      log.newValue,
      log.description,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'simo-audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Trail & Activity Log</h1>
          <p className="text-slate-500">Production and QC activity records</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
          permissions.canViewAudit
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-blue-200 bg-blue-50 text-blue-700'
        }`}
      >
        {permissions.canViewAudit ? 'Full audit visibility' : 'Demo audit visibility'}
      </div>

      <div className="flex flex-wrap gap-4">
        <FilterSelect label="Date Range" icon={Calendar} value="today" onChange={() => undefined}>
          <option value="today">Today</option>
        </FilterSelect>
        <FilterSelect label="User Role" icon={Users} value={roleFilter} onChange={setRoleFilter}>
          <option value="all">All roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Action Type" icon={Activity} value={actionFilter} onChange={setActionFilter}>
          <option value="all">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Table</th>
                <th className="px-5 py-4">Before</th>
                <th className="px-5 py-4">After</th>
                <th className="px-5 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">{log.timestamp}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{log.user}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{log.role}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <Badge type={log.action} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">{log.table}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{log.previousValue}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">{log.newValue}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{log.description}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                    No audit logs match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-medium text-slate-500">
            Showing {logs.length} of {data.auditLogs.length} entries
          </span>
        </div>
      </div>
    </div>
  );
}
