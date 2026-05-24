import { ShieldCheck, Info, User, Truck, MapPin, Navigation } from 'lucide-react';

export default function Logistics() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Live Fleet Tracking</h2>
        <p className="text-slate-500">Monitor logistics to IKN Project in real-time</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">
        {/* Map Area */}
        <div className="flex-1 relative bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          {/* Abstract map representation */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: `40px 40px`
          }}></div>
          
          {/* Geofence Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center">
            <span className="bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded shadow-sm">IKN Zone</span>
          </div>

          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path d="M 100 400 Q 200 300 400 300 T 700 200" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="8 8" />
          </svg>

          {/* Map Pin */}
          <div className="absolute top-[40%] left-[60%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <MapPin size={32} className="text-rose-500 fill-rose-500" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Map Legends */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-4 text-sm font-medium shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Active Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500"></div>
              <span>Geofence</span>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Status Banner */}
          <div className="bg-[#eefcf4] border border-[#d1f4e0] rounded-xl p-4 flex gap-3">
            <div className="mt-0.5">
              <ShieldCheck className="text-emerald-600" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-800 text-sm">Status: Aman</h4>
              <p className="text-emerald-600 text-xs mt-0.5">Kendaraan dalam jalur yang sesuai</p>
            </div>
          </div>

          {/* Manifest Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex gap-2">
                <Info size={18} className="text-blue-600 mt-0.5" />
                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                  Detail Manifest<br/>Pengiriman
                </h3>
              </div>
              <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-1.5 rounded text-center leading-none">
                TRK-<br/>882
              </span>
            </div>

            <div className="p-5 space-y-6">
              {/* Driver */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Driver</p>
                  <p className="font-bold text-slate-800 text-sm">Ahmad Riyadi</p>
                  <p className="text-xs text-slate-400">ID: DRV-4092</p>
                </div>
              </div>

              {/* License Plate */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">License Plate Number</p>
                  <p className="font-bold text-slate-800 text-sm">B 9021 KJA</p>
                  <p className="text-xs text-slate-400">Hino Ranger 500</p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Destination</p>
                  <p className="font-bold text-slate-800 text-sm">IKN Project (Sector 4)</p>
                  <p className="text-xs text-slate-400">Est. Arrival: 14:30 WIB</p>
                </div>
              </div>

              {/* Current Status */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Navigation size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Current Status</p>
                  <p className="font-bold text-slate-800 text-sm">On Route (Moving)</p>
                  <p className="text-xs text-slate-400">Speed: 60 km/h</p>
                </div>
              </div>
            </div>

            {/* Cargo Contents */}
            <div className="p-5 mt-auto">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-3">Cargo Contents</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Aluminium Frame (A)</span>
                    <span className="text-sm font-bold text-slate-800">120 pcs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Tempered Glass 8mm</span>
                    <span className="text-sm font-bold text-slate-800">40 pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
