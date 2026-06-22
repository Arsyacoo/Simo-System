import { useMemo, useState } from 'react';
import { ClipboardList, Factory, Package, ShieldAlert } from 'lucide-react';
import { useAppData } from '../context/AppDataCore';
import { WORK_STATUS_OPTIONS } from '../data/seedData';

const statusStyles = {
  'To-Do': 'border-slate-200 bg-slate-100 text-slate-700',
  'In-Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  Done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const readyStyles = {
  true: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  false: 'border-rose-200 bg-rose-50 text-rose-700',
};

const qcStatusStyles = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  'Passed QC': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Rework: 'border-rose-200 bg-rose-50 text-rose-700',
};

const SummaryTile = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

export default function Warehouses() {
  const {
    data,
    permissions,
    metrics,
    projectsById,
    warehousesById,
    updateWorkItemStatus,
  } = useAppData();
  const [projectFilter, setProjectFilter] = useState('all');

  const workItems = useMemo(
    () =>
      data.workItems
        .map((item) => ({
          ...item,
          project: projectsById.get(item.projectId),
          warehouse: warehousesById.get(item.warehouseId),
        }))
        .filter((item) => projectFilter === 'all' || item.projectId === projectFilter),
    [data.workItems, projectFilter, projectsById, warehousesById],
  );

  const blockedItems = data.workItems.filter((item) => item.status === 'Done' && !item.readyToShip);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Production Work Items</h1>
          <p className="text-slate-500">Warehouse status monitoring for SIMO Mugi Jaya</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          icon={Factory}
          label="Warehouses"
          value={metrics.totalWarehouses}
          tone="bg-blue-50 text-blue-600"
        />
        <SummaryTile
          icon={ClipboardList}
          label="Work Items"
          value={metrics.totalWorkItems}
          tone="bg-indigo-50 text-indigo-600"
        />
        <SummaryTile
          icon={Package}
          label="Completed"
          value={metrics.completedWorkItems}
          tone="bg-emerald-50 text-emerald-600"
        />
        <SummaryTile
          icon={ShieldAlert}
          label="Blocked By QC"
          value={blockedItems.length}
          tone="bg-rose-50 text-rose-600"
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Work Status Board</h2>
            <p className="text-sm text-slate-500">Every status change is recorded in Audit Logs.</p>
          </div>
          <select
            aria-label="Filter project"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-[260px]"
          >
            <option value="all">All projects</option>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Warehouse</th>
                <th className="px-5 py-4">Material</th>
                <th className="px-5 py-4">Qty</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">QC</th>
                <th className="px-5 py-4">Shipping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workItems.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{item.project?.code}</p>
                    <p className="text-sm text-slate-500">{item.project?.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{item.warehouse?.code}</p>
                    <p className="text-sm text-slate-500">{item.warehouse?.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{item.materialName}</p>
                    <p className="text-sm text-slate-500">{item.taskName}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Status for ${item.materialName}`}
                      value={item.status}
                      disabled={!permissions.canUpdateProduction}
                      onChange={(event) => updateWorkItemStatus(item.id, event.target.value)}
                      className={`w-[150px] rounded-lg border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70 ${statusStyles[item.status]}`}
                    >
                      {WORK_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded border px-2.5 py-1 text-xs font-bold ${qcStatusStyles[item.qcStatus]}`}>
                      {item.qcStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded border px-2.5 py-1 text-xs font-bold ${readyStyles[item.readyToShip]}`}>
                      {item.readyToShip ? 'Ready' : 'Not Ready'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
