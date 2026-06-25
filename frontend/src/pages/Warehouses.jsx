import { useMemo, useState } from 'react';
import { ClipboardList, Factory, Package, ShieldAlert } from 'lucide-react';
import { useAppData } from '../context/AppDataCore';
import { WORK_STATUS_OPTIONS } from '../data/seedData';
import { AlertMessage, EmptyState, MetricCard, PageHeader, SectionHeading, StatusBadge, Surface } from '../components/ui';

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
  const [savingItemId, setSavingItemId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  const handleStatusChange = async (item, nextStatus) => {
    if (item.status === nextStatus) {
      return;
    }

    setSavingItemId(item.id);
    setMessage('');
    setError('');

    try {
      await updateWorkItemStatus(item.id, nextStatus);
      setMessage(`${item.materialName} updated from ${item.status} to ${nextStatus}.`);
    } catch (err) {
      setError(err?.message || 'Status work item belum dapat diperbarui. Silakan coba lagi.');
    } finally {
      setSavingItemId('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Warehouse execution"
        title="Production Work Items"
        description="Update status pekerjaan produksi per warehouse dan pantau material yang masih tertahan QC."
        meta={
          <StatusBadge tone={permissions.canUpdateProduction ? 'emerald' : 'slate'}>
            {permissions.canUpdateProduction ? 'Status updates enabled' : 'Monitoring view'}
          </StatusBadge>
        }
      />

      {message && <AlertMessage type="success" title="Status updated">{message}</AlertMessage>}
      {error && <AlertMessage type="error" title="Update failed">{error}</AlertMessage>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Factory}
          label="Warehouses"
          value={metrics.totalWarehouses}
          caption="Production areas"
          tone="blue"
        />
        <MetricCard
          icon={ClipboardList}
          label="Work Items"
          value={metrics.totalWorkItems}
          caption="Tracked tasks"
          tone="indigo"
        />
        <MetricCard
          icon={Package}
          label="Completed"
          value={metrics.completedWorkItems}
          caption="Production done"
          tone="emerald"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Blocked By QC"
          value={blockedItems.length}
          caption="Done but not ready"
          tone="rose"
        />
      </div>

      <Surface padding="p-0">
        <div className="p-5">
          <SectionHeading
            icon={ClipboardList}
            title="Work Status Board"
            description="Every status change is recorded in Audit Logs."
            action={
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
            }
          />
        </div>

        {workItems.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={ClipboardList}
              title="No work items found."
              description="Try another project filter or seed production data before the demo."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
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
                  <tr key={item.id} className="transition-colors hover:bg-blue-50/40">
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
                        disabled={!permissions.canUpdateProduction || savingItemId === item.id}
                        onChange={(event) => handleStatusChange(item, event.target.value)}
                        className={`w-[150px] rounded-lg border px-3 py-2 text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${statusStyles[item.status]}`}
                      >
                        {WORK_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {savingItemId === item.id && (
                        <p className="mt-1 text-xs font-semibold text-blue-600">Saving...</p>
                      )}
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
        )}
      </Surface>
    </div>
  );
}
