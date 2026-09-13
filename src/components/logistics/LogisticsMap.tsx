import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Trip } from '../../types/logistics';
import { AlertTriangle } from 'lucide-react';

interface LogisticsMapProps {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (trip: Trip) => void;
}

// Custom Leaflet Icons for Multimodal Assets
const createVehicleIcon = (type: string, status: string, isStuck: boolean) => {
  let color = '#38bdf8'; // light blue truck
  let symbol = '🚛';
  if (type === 'ship') {
    color = '#3b82f6';
    symbol = '🚢';
  } else if (type === 'plane') {
    color = '#a855f7';
    symbol = '✈️';
  }

  if (isStuck) {
    color = '#ef4444'; // red pulse
  } else if (status === 'completed') {
    color = '#10b981'; // green
  } else if (status === 'delayed') {
    color = '#f59e0b'; // amber
  }

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.9);
      border: 2px solid ${color};
      box-shadow: 0 0 ${isStuck ? '16px rgba(239, 68, 68, 0.9)' : '10px rgba(56, 189, 248, 0.6)'};
      cursor: pointer;
      font-size: 18px;
    ">
      ${isStuck ? `<div style="position:absolute; -top:4px; -right:4px; width:12px; height:12px; border-radius:50%; background:#ef4444; border:2px solid white; animation: pulse 1s infinite;"></div>` : ''}
      <span>${symbol}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const MapCenterController: React.FC<{ selectedTrip: Trip | undefined }> = ({ selectedTrip }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedTrip && selectedTrip.current_lat && selectedTrip.current_lng) {
      map.flyTo([selectedTrip.current_lat, selectedTrip.current_lng], 7, { duration: 1.5 });
    }
  }, [selectedTrip, map]);
  return null;
};

export const LogisticsMap: React.FC<LogisticsMapProps> = ({ trips, selectedTripId, onSelectTrip }) => {
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={[23.6345, -102.5528]} // Center of Mexico / North America corridor
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ background: '#090d16' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAP_KEY || ''}`}
          tileSize={512}
          zoomOffset={-1}
          minZoom={1}
        />

        <MapCenterController selectedTrip={selectedTrip} />

        {/* Polylines for each trip route */}
        {trips.map((trip) => {
          const origLat = trip.origin_lat || 25.6866;
          const origLng = trip.origin_lng || -100.3161;
          const destLat = trip.dest_lat || 27.4864;
          const destLng = trip.dest_lng || -99.5076;

          const isSelected = trip.id === selectedTripId;
          const routeColor = trip.is_stuck
            ? '#ef4444'
            : isSelected
              ? '#776de8'
              : trip.status === 'completed'
                ? '#10b981'
                : '#0284c7';

          return (
            <React.Fragment key={`route-${trip.id}`}>
              {/* Full route trajectory */}
              <Polyline
                positions={[
                  [origLat, origLng],
                  [destLat, destLng],
                ]}
                pathOptions={{
                  color: routeColor,
                  weight: isSelected ? 4 : 2,
                  dashArray: trip.status === 'completed' ? undefined : '6, 8',
                  opacity: isSelected ? 0.9 : 0.45,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Markers for real-time positions of trips */}
        {trips.map((trip) => {
          const lat = trip.current_lat || trip.origin_lat || 25.6866;
          const lng = trip.current_lng || trip.origin_lng || -100.3161;

          return (
            <Marker
              key={trip.id}
              position={[lat, lng]}
              icon={createVehicleIcon(trip.vehicle_type || 'truck', trip.status, trip.is_stuck)}
              eventHandlers={{
                click: () => onSelectTrip(trip),
              }}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 min-w-[220px] shadow-xl text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-slate-100">{trip.tracking_code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${trip.is_stuck
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : trip.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                    >
                      {trip.is_stuck ? 'Atascado' : trip.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-300">
                      {trip.vehicle_identifier || trip.vehicle_type?.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {trip.route_origin} ➔ {trip.route_destination}
                    </p>
                  </div>

                  {trip.is_stuck && trip.stuck_reason && (
                    <div className="p-2 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-[11px] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{trip.stuck_reason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Progreso</span>
                      <span className="font-bold text-white">{trip.progress_percentage.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Flete Pactado</span>
                      <span className="font-bold text-emerald-400">
                        ${trip.agreed_freight_price.toLocaleString()} {trip.currency}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTrip(trip)}
                    className="w-full py-1.5 bg-[#776de8] hover:bg-[#685dd8] text-white font-medium rounded-lg text-center transition cursor-pointer"
                  >
                    Ver Telemetría y Costos
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating telemetry control overlay */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-white">Radar Multimodal Activo</span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <span className="text-xs text-slate-300 font-mono">
          {trips.length} {trips.length === 1 ? 'viaje monitoreado' : 'viajes monitoreados'}
        </span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg flex items-center gap-3 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>En ruta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Fricción / Atasco</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Llegada</span>
        </div>
      </div>
    </div>
  );
};
