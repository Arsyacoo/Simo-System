import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, MapPin, RefreshCw, Truck, User } from 'lucide-react';
import {
  createDeliveryCheckin,
  getLogisticsManifests,
  updateLogisticsManifestStatus,
} from '../services/logisticsApi';
import { useBackendApi } from '../services/apiClient';

const statusOptions = ['Prepared', 'On Delivery', 'Arrived', 'Issue'];

const statusStyles = {
  Prepared: 'bg-slate-100 text-slate-700 border-slate-200',
  'On Delivery': 'bg-blue-50 text-blue-700 border-blue-200',
  Arrived: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Issue: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status] || statusStyles.Prepared}`}>
      {status}
    </span>
  );
}

export default function Logistics() {
  const [manifests, setManifests] = useState([]);
  const [selectedManifestId, setSelectedManifestId] = useState('');
  const [statusValue, setStatusValue] = useState('On Delivery');
  const [checkinStatus, setCheckinStatus] = useState('On Delivery');
  const [locationText, setLocationText] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const useApi = useBackendApi;

  const selectedManifest = useMemo(
    () => manifests.find((manifest) => manifest.id === selectedManifestId) || manifests[0],
    [manifests, selectedManifestId],
  );

  const loadManifests = useCallback(async function loadManifests() {
    setIsLoading(true);
    setError('');

    if (!useApi) {
      setManifests([]);
      setSelectedManifestId('');
      setMessage('Data logistik belum tersedia saat ini.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await getLogisticsManifests();
      setManifests(response.data || []);
      setSelectedManifestId((current) => current || response.data?.[0]?.id || '');
    } catch (err) {
      if (err.code === 'NETWORK_ERROR') {
        setError('Layanan logistik sedang tidak dapat dihubungi. Silakan coba beberapa saat lagi.');
      } else if (err.status === 503) {
        setError('Data logistik belum dapat diproses saat ini. Silakan coba beberapa saat lagi.');
      } else {
        setError(err.message || 'Manifest pengiriman belum dapat dimuat. Silakan coba beberapa saat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [useApi]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadManifests();
  }, [loadManifests]);


  async function handleStatusUpdate(event) {
    event.preventDefault();
    if (!useApi || !selectedManifest) return;

    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      await updateLogisticsManifestStatus(selectedManifest.id, statusValue);
      await loadManifests();
      setMessage('Status pengiriman berhasil diperbarui.');
    } catch (err) {
      setError(err.message || 'Failed to update delivery status.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCheckinSubmit(event) {
    event.preventDefault();
    if (!useApi || !selectedManifest) return;

    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      await createDeliveryCheckin(selectedManifest.id, {
        status: checkinStatus,
        locationText,
        notes,
      });
      setLocationText('');
      setNotes('');
      await loadManifests();
      setMessage('Check-in pengiriman berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Failed to save check-in.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Logistics Manifest</h2>
          <p className="text-slate-500">Pantau manifest, kendaraan, rute, dan perkembangan pengiriman CV Mugi Jaya.</p>
        </div>
        <button
          type="button"
          onClick={loadManifests}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} /> {useApi ? 'Retry' : 'Refresh'}
        </button>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">Shipment Manifests</h3>
            <p className="text-sm text-slate-500">Manifest number, driver, route, latest check-in, and status.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Manifest</th>
                  <th className="px-5 py-3">Driver / Vehicle</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Latest Check-in</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Loading logistics data...</td></tr>
                ) : manifests.length === 0 ? (
                  <tr><td className="px-5 py-6 text-slate-500" colSpan="6">{useApi ? 'Belum ada manifest pengiriman.' : 'Data logistik belum tersedia saat ini.'}</td></tr>
                ) : manifests.map((manifest) => (
                  <tr
                    key={manifest.id}
                    onClick={() => {
                      setSelectedManifestId(manifest.id);
                      setStatusValue(manifest.deliveryStatus);
                      setCheckinStatus(manifest.deliveryStatus);
                    }}
                    className={`cursor-pointer hover:bg-blue-50/60 ${selectedManifest?.id === manifest.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{manifest.manifestNumber}</p>
                      <p className="text-xs text-slate-500">{manifest.projectName || 'No project'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">{manifest.driverName}</p>
                      <p className="text-xs text-slate-500">{manifest.vehiclePlate} · {manifest.vehicleType || '-'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{manifest.origin}</p>
                      <p className="text-xs text-slate-400">to {manifest.destination}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={manifest.deliveryStatus} /></td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{manifest.latestCheckin?.locationText || '-'}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(manifest.latestCheckin?.checkedInAt)}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDateTime(manifest.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-800">Selected Manifest</h3>
            {selectedManifest ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3"><Truck className="mt-0.5 text-blue-600" size={18} /><div><p className="font-bold">{selectedManifest.manifestNumber}</p><p className="text-slate-500">{selectedManifest.projectName}</p></div></div>
                <div className="flex items-start gap-3"><User className="mt-0.5 text-slate-500" size={18} /><div><p className="font-semibold">{selectedManifest.driverName}</p><p className="text-slate-500">{selectedManifest.driverPhone || '-'} · {selectedManifest.vehiclePlate}</p></div></div>
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 text-slate-500" size={18} /><div><p>{selectedManifest.origin}</p><p className="text-slate-500">{selectedManifest.destination}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="mt-0.5 text-slate-500" size={18} /><div><p>Departure: {formatDateTime(selectedManifest.departureTime)}</p><p className="text-slate-500">Arrival: {formatDateTime(selectedManifest.arrivalTime)}</p></div></div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a manifest to update delivery progress.</p>
            )}
          </div>

          <form onSubmit={handleStatusUpdate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-800">Update Delivery Status</h3>
            <label className="block text-sm font-semibold text-slate-600">Delivery status</label>
            <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button disabled={!useApi || !selectedManifest || isSaving} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">Save Status</button>
          </form>

          <form onSubmit={handleCheckinSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800"><AlertCircle size={18} /> Manual Check-in</h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-600">Manifest</label>
              <select value={selectedManifest?.id || ''} onChange={(event) => {
                  const manifest = manifests.find((item) => item.id === event.target.value);
                  setSelectedManifestId(event.target.value);
                  setStatusValue(manifest?.deliveryStatus || 'Prepared');
                  setCheckinStatus(manifest?.deliveryStatus || 'Prepared');
                }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {manifests.map((manifest) => <option key={manifest.id} value={manifest.id}>{manifest.manifestNumber}</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-600">Check-in status</label>
              <select value={checkinStatus} onChange={(event) => setCheckinStatus(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-600">Location text</label>
              <input value={locationText} onChange={(event) => setLocationText(event.target.value)} required placeholder="e.g. Rest Area KM 57" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label className="block text-sm font-semibold text-slate-600">Notes</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" placeholder="Manual delivery notes" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button disabled={!useApi || !selectedManifest || isSaving} className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Submit Check-in</button>
          </form>
        </aside>
      </div>
    </div>
  );
}


