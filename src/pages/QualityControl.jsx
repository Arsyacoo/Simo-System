import { useMemo, useState } from 'react';
import { ClipboardCheck, PackageCheck, Ruler, ShieldCheck, Upload } from 'lucide-react';
import { useAppData } from '../context/AppDataCore';
import { QC_STATUS_OPTIONS } from '../data/seedData';

const qcStyles = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  'Passed QC': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Rework: 'border-rose-200 bg-rose-50 text-rose-700',
};

const statusHelp = {
  Pending: 'Waiting for final inspection result.',
  'Passed QC': 'Material can move to shipping preparation.',
  Rework: 'Material remains blocked until corrected.',
};

function buildFormFromItem(item) {
  return {
    projectId: item?.projectId || '',
    warehouseId: item?.warehouseId || '',
    workItemId: item?.id || '',
    materialName: item?.materialName || '',
    length: '',
    width: '',
    thickness: '',
    qcStatus: 'Pending',
    notes: '',
    evidencePhoto: '',
  };
}

const FieldLabel = ({ children }) => (
  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">{children}</label>
);

const MetricCard = ({ icon: Icon, label, value, tone }) => (
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

export default function QualityControl() {
  const {
    data,
    activeUser,
    permissions,
    projectsById,
    warehousesById,
    submitQcChecklist,
  } = useAppData();

  const [form, setForm] = useState(() => buildFormFromItem(data.workItems[0]));

  const filteredWorkItems = useMemo(
    () => data.workItems.filter((item) => item.projectId === form.projectId),
    [data.workItems, form.projectId],
  );

  const selectedWorkItem = data.workItems.find((item) => item.id === form.workItemId);
  const passedCount = data.qcChecklists.filter((item) => item.qcStatus === 'Passed QC').length;
  const reworkCount = data.qcChecklists.filter((item) => item.qcStatus === 'Rework').length;
  const readyItems = data.workItems.filter((item) => item.readyToShip);

  const setSelectedItem = (item) => {
    setForm((currentForm) => ({
      ...buildFormFromItem(item),
      length: currentForm.length,
      width: currentForm.width,
      thickness: currentForm.thickness,
      qcStatus: currentForm.qcStatus,
      notes: currentForm.notes,
      evidencePhoto: currentForm.evidencePhoto,
    }));
  };

  const handleProjectChange = (projectId) => {
    const nextItem = data.workItems.find((item) => item.projectId === projectId);
    setSelectedItem(nextItem);
  };

  const handleWorkItemChange = (workItemId) => {
    const nextItem = data.workItems.find((item) => item.id === workItemId);
    setSelectedItem(nextItem);
  };

  const handleChange = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!permissions.canSubmitQc) {
      return;
    }

    submitQcChecklist(form);
    setForm((currentForm) => ({
      ...currentForm,
      length: '',
      width: '',
      thickness: '',
      qcStatus: 'Pending',
      notes: '',
      evidencePhoto: '',
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Digital QC Checklist</h1>
          <p className="text-slate-500">Material inspection records before shipping release</p>
        </div>

        <div
          className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
            permissions.canSubmitQc
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {permissions.canSubmitQc ? `${activeUser.roleName} QC access` : `${activeUser.roleName} view only`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={ClipboardCheck}
          label="QC Records"
          value={data.qcChecklists.length}
          tone="bg-blue-50 text-blue-600"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Passed QC"
          value={passedCount}
          tone="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          icon={PackageCheck}
          label="Ready To Ship"
          value={readyItems.length}
          tone="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <ClipboardCheck size={20} className="text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">Checklist Form</h2>
          </div>

          <fieldset disabled={!permissions.canSubmitQc} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Project</FieldLabel>
              <select
                value={form.projectId}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Work Item</FieldLabel>
              <select
                value={form.workItemId}
                onChange={(event) => handleWorkItemChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {filteredWorkItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.materialName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Warehouse</FieldLabel>
              <input
                value={warehousesById.get(form.warehouseId)?.name || ''}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Material Name</FieldLabel>
              <input
                value={form.materialName}
                onChange={(event) => handleChange('materialName', event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                required
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Length</FieldLabel>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.length}
                  onChange={(event) => handleChange('length', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Width</FieldLabel>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.width}
                  onChange={(event) => handleChange('width', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Thickness</FieldLabel>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.thickness}
                  onChange={(event) => handleChange('thickness', event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>QC Status</FieldLabel>
              <select
                value={form.qcStatus}
                onChange={(event) => handleChange('qcStatus', event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 ${qcStyles[form.qcStatus]}`}
              >
                {QC_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <FieldLabel>Evidence Photo</FieldLabel>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={form.evidencePhoto}
                  onChange={(event) => handleChange('evidencePhoto', event.target.value)}
                  placeholder="qc-evidence-file.jpg"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                required
              />
            </div>
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">{statusHelp[form.qcStatus]}</p>
            <button
              type="submit"
              disabled={!permissions.canSubmitQc}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <ClipboardCheck size={18} />
              Submit Checklist
            </button>
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Inspection Status</h2>
            <p className="text-sm text-slate-500">
              {selectedWorkItem?.materialName} | {projectsById.get(form.projectId)?.code}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">Passed QC</p>
              <p className="text-3xl font-bold text-emerald-800">{passedCount}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">Rework</p>
              <p className="text-3xl font-bold text-rose-800">{reworkCount}</p>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="mb-3 font-bold text-slate-800">Ready Materials</h3>
            <div className="space-y-3">
              {readyItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-800">{item.materialName}</p>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      Ready
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {projectsById.get(item.projectId)?.code} | {warehousesById.get(item.warehouseId)?.code}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-800">QC Checklist History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Material</th>
                <th className="px-5 py-4">Dimension</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Inspector</th>
                <th className="px-5 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.qcChecklists.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">{record.createdAt}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{record.materialName}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {record.length} x {record.width} x {record.thickness}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded border px-2.5 py-1 text-xs font-bold ${qcStyles[record.qcStatus]}`}>
                      {record.qcStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{record.createdBy}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{record.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
