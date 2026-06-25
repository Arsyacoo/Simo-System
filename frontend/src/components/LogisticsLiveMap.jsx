import { Component, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Clock, LocateFixed, MapPinned, Navigation, RefreshCw, Route, Truck } from 'lucide-react';
import {
  getLatestManifestLocation,
  getManifestLocationHistory,
} from '../services/trackingApi';
import { EmptyState, LoadingState, SectionHeading, StatusBadge, Surface } from './ui';

const DEFAULT_CENTER = [-2.5489, 118.0149];
const POLLING_INTERVAL_MS = 5000;
const HISTORY_LIMIT = 50;
const STALE_SIGNAL_MS = 60_000;

const vehicleIcon = new L.Icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function formatCoordinate(value) {
  return typeof value === 'number' ? value.toFixed(7) : '-';
}

function formatAccuracy(value) {
  return typeof value === 'number' ? `${value.toFixed(1)} m` : '-';
}

function formatDateTime(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function locationToPosition(location) {
  if (!location) {
    return null;
  }

  return [location.latitude, location.longitude];
}

function MapViewport({ latestPosition, routePositions }) {
  const map = useMap();

  useEffect(() => {
    if (routePositions.length > 1) {
      map.fitBounds(routePositions, {
        padding: [36, 36],
        maxZoom: 15,
      });
      return;
    }

    if (latestPosition) {
      map.setView(latestPosition, 14);
      return;
    }

    map.setView(DEFAULT_CENTER, 5);
  }, [latestPosition, map, routePositions]);

  return null;
}

class MapErrorBoundary extends Component {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-rose-200 bg-rose-50 p-5 text-center">
          <MapPinned className="text-rose-600" size={30} />
          <div>
            <p className="font-bold text-rose-800">Unable to load live location. Please retry.</p>
          </div>
          <button
            type="button"
            onClick={this.props.onReset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-sm transition-colors hover:bg-rose-100"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <Icon className="mt-0.5 flex-shrink-0 text-slate-500" size={17} />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function getLocationLoadError(error) {
  if (error?.code === 'NETWORK_ERROR') {
    return 'Backend is unavailable. Please start the backend and retry.';
  }

  if (error?.status === 404) {
    return 'Manifest not found.';
  }

  return 'Unable to load live location. Please retry.';
}

export default function LogisticsLiveMap({ selectedManifest, manifest }) {
  const activeManifest = selectedManifest || manifest;
  const manifestId = activeManifest?.id || '';
  const [latestLocation, setLatestLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!manifestId) {
      setLatestLocation(null);
      setLocationHistory([]);
      setIsLoading(false);
      setIsRefreshing(false);
      setError('');
      return undefined;
    }

    let isActive = true;

    async function loadLocations(showLoading) {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError('');

      try {
        const [latestResponse, historyResponse] = await Promise.all([
          getLatestManifestLocation(manifestId),
          getManifestLocationHistory(manifestId, HISTORY_LIMIT),
        ]);

        if (!isActive) {
          return;
        }

        setLatestLocation(latestResponse.data || null);
        setLocationHistory(historyResponse.data || []);
      } catch (loadError) {
        if (isActive) {
          setError(getLocationLoadError(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    setLatestLocation(null);
    setLocationHistory([]);
    void loadLocations(true);

    const intervalId = window.setInterval(() => {
      void loadLocations(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [manifestId, retryKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const latestPosition = useMemo(() => locationToPosition(latestLocation), [latestLocation]);
  const routePositions = useMemo(
    () => locationHistory.map(locationToPosition).filter(Boolean),
    [locationHistory],
  );
  const firstHistoryLocation = locationHistory[0] || null;
  const latestHistoryLocation = locationHistory.at(-1) || latestLocation;
  const hasHistoryRoute = routePositions.length > 1;
  const mapCenter = latestPosition || DEFAULT_CENTER;
  const mapZoom = latestPosition ? 14 : 5;
  const resetKey = `${manifestId}-${latestLocation?.id || 'empty'}-${mapResetKey}`;
  const latestLocationAgeMs = latestLocation?.createdAt
    ? currentTime - new Date(latestLocation.createdAt).getTime()
    : null;
  const isSignalStale = typeof latestLocationAgeMs === 'number' && latestLocationAgeMs > STALE_SIGNAL_MS;
  const signalStatus = latestLocation
    ? isSignalStale
      ? { label: 'Signal Stale', tone: 'rose', action: 'Ask the driver to keep the tracking page open and check network/GPS.' }
      : { label: 'GPS Live', tone: 'emerald', action: 'Delivery tracking is active. Monitor route progress from this map.' }
    : { label: 'Waiting for GPS', tone: 'amber', action: 'Ask the driver to open the tracking link and start GPS or demo route.' };

  return (
    <Surface padding="p-0" className="overflow-hidden">
      <div className="p-5">
        <SectionHeading
          icon={MapPinned}
          title="Admin Live Map"
          description={activeManifest ? `${activeManifest.manifestNumber} | ${activeManifest.driverName} | ${activeManifest.vehiclePlate}` : 'Select a manifest to view tracking.'}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={signalStatus.tone}>
                {signalStatus.label}
              </StatusBadge>
              {isRefreshing && <StatusBadge tone="blue">Refreshing</StatusBadge>}
              <button
                type="button"
                onClick={() => setRetryKey((current) => current + 1)}
                disabled={!manifestId || isLoading || isRefreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
                Retry
              </button>
            </div>
          }
        />
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[420px] border-y border-slate-200 xl:border-b-0 xl:border-r">
          <MapErrorBoundary
            resetKey={resetKey}
            onReset={() => setMapResetKey((current) => current + 1)}
          >
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom
              className="h-[420px] min-h-[360px] w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewport latestPosition={latestPosition} routePositions={routePositions} />
              {hasHistoryRoute && (
                <Polyline
                  positions={routePositions}
                  pathOptions={{ color: '#2563eb', opacity: 0.8, weight: 4 }}
                />
              )}
              {latestPosition && (
                <Marker position={latestPosition} icon={vehicleIcon}>
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-bold">{activeManifest?.manifestNumber || manifestId}</p>
                      <p>{activeManifest?.driverName || 'Driver'}</p>
                      <p>{activeManifest?.vehiclePlate || '-'}</p>
                      <p>{formatCoordinate(latestLocation.latitude)}, {formatCoordinate(latestLocation.longitude)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </MapErrorBoundary>

          {isLoading && (
            <div className="absolute inset-x-4 top-4 z-[500]">
              <LoadingState text="Loading GPS data..." />
            </div>
          )}

          {!isLoading && !error && !latestLocation && (
            <div className="absolute inset-x-4 bottom-4 z-[500]">
              <EmptyState
                icon={Truck}
                title="No GPS location has been received for this manifest yet."
                description="Ask the driver to open the tracking link and start tracking."
              />
            </div>
          )}

          {error && (
            <div className="absolute inset-x-4 top-4 z-[500] rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold">{error}</p>
                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <RefreshCw size={16} />
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3 p-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Monitoring Insight</p>
              <StatusBadge tone={signalStatus.tone}>{signalStatus.label}</StatusBadge>
            </div>
            <p className="text-sm font-semibold leading-5 text-slate-700">{signalStatus.action}</p>
          </div>
          <DetailRow
            icon={Navigation}
            label="Latitude"
            value={formatCoordinate(latestLocation?.latitude)}
          />
          <DetailRow
            icon={Navigation}
            label="Longitude"
            value={formatCoordinate(latestLocation?.longitude)}
          />
          <DetailRow
            icon={LocateFixed}
            label="Accuracy"
            value={formatAccuracy(latestLocation?.accuracy)}
          />
          <DetailRow
            icon={Clock}
            label="Last Updated"
            value={formatDateTime(latestLocation?.createdAt)}
          />
          <DetailRow
            icon={Clock}
            label="First Recorded"
            value={formatDateTime(firstHistoryLocation?.createdAt)}
          />
          <DetailRow
            icon={Clock}
            label="Latest Recorded"
            value={formatDateTime(latestHistoryLocation?.createdAt)}
          />
          <DetailRow
            icon={Route}
            label="History Points"
            value={String(locationHistory.length)}
          />
        </aside>
      </div>
    </Surface>
  );
}
