import { Activity, Building2, CheckCircle2, ClipboardList, PackageCheck } from 'lucide-react';
import { useAppData } from '../context/AppDataCore';

const toneByPercentage = (percentage) => {
  if (percentage >= 80) {
    return {
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    };
  }

  if (percentage >= 50) {
    return {
      bar: 'bg-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-600',
    };
  }

  return {
    bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  };
};

const StatCard = ({ title, value, status, icon: Icon, iconColor, iconBgColor }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between">
      <div className={`rounded-lg p-3 ${iconBgColor}`}>
        <Icon className={iconColor} size={24} />
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <h3 className="mt-1 text-3xl font-bold text-slate-800">{value}</h3>
    <p className="mt-2 text-sm font-medium text-slate-500">{status}</p>
  </div>
);

const ProgressBar = ({ percentage }) => {
  const tone = toneByPercentage(percentage);

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const ProgressRow = ({ title, subtitle, total, completed, percentage, rightLabel }) => {
  const tone = toneByPercentage(percentage);

  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-slate-800">{title}</h4>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className={`rounded border px-2 py-1 text-xs font-bold ${tone.badge}`}>
          {percentage}%
        </span>
      </div>
      <ProgressBar percentage={percentage} />
      <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          {completed}/{total} done
        </span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data, metrics } = useAppData();
  const qcQueue = data.workItems.filter((item) => item.status === 'Done' && !item.readyToShip);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Production Dashboard</h1>
          <p className="text-slate-500">SIMO Mugi Jaya operational snapshot</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Live demo data
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={metrics.totalProjects}
          status={`${metrics.totalWarehouses} warehouses assigned`}
          icon={Activity}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatCard
          title="Total Work Items"
          value={metrics.totalWorkItems}
          status={`${metrics.completedWorkItems} completed`}
          icon={ClipboardList}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-50"
        />
        <StatCard
          title="Production Progress"
          value={`${metrics.progressPercentage}%`}
          status="Based on completed work items"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <StatCard
          title="Ready To Ship"
          value={metrics.readyToShipItems}
          status={`${metrics.pendingQcItems} completed items blocked by QC`}
          icon={PackageCheck}
          iconColor="text-rose-600"
          iconBgColor="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-slate-500" />
              <h2 className="text-lg font-bold text-slate-800">Project Progress</h2>
            </div>
            <span className="text-sm font-semibold text-slate-500">{metrics.totalProjects} projects</span>
          </div>

          <div>
            {metrics.projectProgress.map((project) => (
              <ProgressRow
                key={project.id}
                title={`${project.code} - ${project.name}`}
                subtitle={`${project.client} | Due ${project.dueDate}`}
                total={project.totalWorkItems}
                completed={project.completedWorkItems}
                percentage={project.progressPercentage}
                rightLabel={project.priority}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-slate-500" />
              <h2 className="text-lg font-bold text-slate-800">Warehouse Progress</h2>
            </div>
            <span className="text-sm font-semibold text-slate-500">{metrics.totalWarehouses} warehouses</span>
          </div>

          <div>
            {metrics.warehouseProgress.map((warehouse) => (
              <ProgressRow
                key={warehouse.id}
                title={`${warehouse.code} - ${warehouse.name}`}
                subtitle={warehouse.category}
                total={warehouse.totalWorkItems}
                completed={warehouse.completedWorkItems}
                percentage={warehouse.progressPercentage}
                rightLabel={warehouse.projectCodes.join(', ') || 'No project'}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">QC Shipping Gate</h2>
            <p className="text-sm text-slate-500">Completed materials require Passed QC before shipping.</p>
          </div>
          <span className="rounded border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700">
            {qcQueue.length} blocked
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {qcQueue.map((item) => {
            const project = data.projects.find((entry) => entry.id === item.projectId);
            const warehouse = data.warehouses.find((entry) => entry.id === item.warehouseId);

            return (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-800">{item.materialName}</h3>
                  <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                    {item.qcStatus}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{project?.code} | {warehouse?.code}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
