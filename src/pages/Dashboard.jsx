import { Activity, Building2, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, status, statusColor, icon: Icon, iconColor, iconBgColor }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        <Icon className={iconColor} size={24} />
      </div>
    </div>
    <div>
      <p className="text-slate-500 font-medium text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
      <div className="mt-2 flex items-center gap-1.5">
        {statusColor === 'text-emerald-600' && (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        )}
        <span className={`text-sm font-medium ${statusColor}`}>
          {status}
        </span>
      </div>
    </div>
  </div>
);

const ProgressBar = ({ label, sublabel, percentage, colorClass }) => (
  <div className="mb-6">
    <div className="flex justify-between items-end mb-2">
      <div>
        <h4 className="font-semibold text-slate-800">{label}</h4>
        <p className="text-sm text-slate-500">{sublabel}</p>
      </div>
      <span className="font-bold text-slate-800">{percentage}%</span>
    </div>
    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${colorClass}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

export default function Dashboard() {
  const warehouses = [
    { id: 1, label: 'Warehouse 1', sublabel: 'Frame', percentage: 80, colorClass: 'bg-blue-600' },
    { id: 2, label: 'Warehouse 2', sublabel: 'Glass', percentage: 40, colorClass: 'bg-orange-500' },
    { id: 3, label: 'Warehouse 3', sublabel: 'Aluminium Type A', percentage: 95, colorClass: 'bg-emerald-500' },
    { id: 4, label: 'Warehouse 4', sublabel: 'Sealant & Rubber', percentage: 20, colorClass: 'bg-blue-500' }, // Image shows blue for 20%? Wait, let's use blue as per image
    { id: 5, label: 'Warehouse 5', sublabel: 'Hardware (Locks)', percentage: 60, colorClass: 'bg-purple-500' }, // Image shows purple
    { id: 6, label: 'Warehouse 6', sublabel: 'Custom Profiles', percentage: 75, colorClass: 'bg-indigo-500' }, // Image shows dark blue/indigo
    { id: 7, label: 'Warehouse 7', sublabel: 'Packaging Materials', percentage: 90, colorClass: 'bg-emerald-500' },
    { id: 8, label: 'Warehouse 8', sublabel: 'Assembly Stage', percentage: 35, colorClass: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Projects" 
          value="4" 
          status="2 on track"
          statusColor="text-emerald-600"
          icon={Activity}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatCard 
          title="Total Warehouses" 
          value="8" 
          status="All units operational"
          statusColor="text-slate-500"
          icon={Building2}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-50"
        />
        <StatCard 
          title="Pending QC Items" 
          value="142" 
          status="Requires immediate action"
          statusColor="text-rose-600"
          icon={AlertCircle}
          iconColor="text-rose-600"
          iconBgColor="bg-rose-50"
        />
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Building2 size={20} className="text-slate-500" />
            <h3 className="text-lg font-bold">Warehouse Production Progress</h3>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>&gt; 80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span>50-80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>&lt; 50%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
          {warehouses.map(wh => (
            <ProgressBar key={wh.id} {...wh} />
          ))}
        </div>
      </div>
    </div>
  );
}
