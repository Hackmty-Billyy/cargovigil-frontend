import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Trip } from '../../types/logistics';
import { AlertTriangle } from 'lucide-react';

interface LogisticsMapProps {
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (trip: Trip) => void;
  onOpenSummary?: (trip: Trip) => void;
}

type MapStyle = 'dark' | 'voyager' | 'satellite';

// Custom Leaflet Icons for Multimodal Assets (emojis on map markers for quick vehicle type recognition)
const createVehicleIcon = (type: string, status: string, isStuck: boolean) => {
  let color = '#38bdf8';
  let symbol = '🚛';
  const lowerType = type?.toLowerCase() || '';

  if (lowerType.includes('ship') || lowerType.includes('barco') || lowerType.includes('mar')) {
    color = '#3b82f6';
    symbol = '🚢';
  } else if (lowerType.includes('plane') || lowerType.includes('avion') || lowerType.includes('avión') || lowerType.includes('air')) {
    color = '#a855f7';
    symbol = '✈️';
  } else if (lowerType.includes('train') || lowerType.includes('tren') || lowerType.includes('ferro')) {
    color = '#eab308';
    symbol = '🚆';
  } else if (lowerType.includes('van') || lowerType.includes('camioneta')) {
    color = '#38bdf8';
    symbol = '🚐';
  } else {
    color = '#38bdf8';
    symbol = '🚛';
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
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.95);
      border: 2.5px solid ${color};
      box-shadow: 0 0 ${isStuck ? '18px rgba(239, 68, 68, 0.95)' : '12px rgba(56, 189, 248, 0.7)'};
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      transition: transform 0.2s ease;
    ">
      ${
        isStuck
          ? `<div style="position:absolute; top:-2px; right:-2px; width:13px; height:13px; border-radius:50%; background:#ef4444; border:2px solid white; box-shadow: 0 0 8px #ef4444;"></div>`
          : ''
      }
      <span>${symbol}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

// Ensures map does not glitch or remain gray/cut-off on mount or resize
const MapResizeHandler: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 600);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
};

const MapCenterController: React.FC<{ selectedTrip: Trip | undefined }> = ({ selectedTrip }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedTrip && selectedTrip.current_lat && selectedTrip.current_lng) {
      map.flyTo([selectedTrip.current_lat, selectedTrip.current_lng], Math.max(map.getZoom(), 7), {
        duration: 1.2,
      });
    }
  }, [selectedTrip, map]);
  return null;
};

export const LogisticsMap: React.FC<LogisticsMapProps> = ({
  trips,
  selectedTripId,
  onSelectTrip,
  onOpenSummary,
}) => {
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const mapKey =
    import.meta.env.VITE_MAP_KEY ||
    (import.meta.env as unknown as { MAP_KEY?: string }).MAP_KEY ||
    'cb1_3i53_1_0d91ca717c82cb8ae76cd874';

  const tileLayerConfigs: Record<
    MapStyle,
    { url: string; attribution: string; subdomains?: string; maxZoom?: number }
  > = {
    dark: {
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${mapKey}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    },
    voyager: {
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${mapKey}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    },
    satellite: {
      url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?key=${mapKey}`,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    },
  };

  const activeTile = tileLayerConfigs[mapStyle];

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-gray-800 shadow-xs bg-gray-950">
      <MapContainer
        center={[23.6345, -102.5528]} // Center corridor
        zoom={5}
        scrollWheelZoom={true}
        preferCanvas={true}
        className="w-full h-full z-10"
        style={{ background: '#090d16' }}
      >
        <TileLayer
          key={mapStyle}
          attribution={activeTile.attribution}
          url={activeTile.url}
          subdomains={activeTile.subdomains || 'abc'}
          maxZoom={activeTile.maxZoom || 19}
          tileSize={256}
        />

        <MapResizeHandler />
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
              ? '#3b82f6'
              : trip.status === 'completed'
                ? '#10b981'
                : '#0284c7';

          return (
            <React.Fragment key={`route-${trip.id}`}>
              {/* Outer halo / glow if selected or stuck */}
              {(isSelected || trip.is_stuck) && (
                <Polyline
                  positions={[
                    [origLat, origLng],
                    [destLat, destLng],
                  ]}
                  pathOptions={{
                    color: trip.is_stuck ? '#ef4444' : '#3b82f6',
                    weight: 8,
                    opacity: 0.25,
                  }}
                />
              )}
              {/* Full route trajectory */}
              <Polyline
                positions={[
                  [origLat, origLng],
                  [destLat, destLng],
                ]}
                pathOptions={{
                  color: routeColor,
                  weight: isSelected ? 4 : 2.5,
                  dashArray: trip.status === 'completed' ? undefined : '6, 8',
                  opacity: isSelected ? 0.95 : 0.6,
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
                <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 min-w-[220px] shadow-lg text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                    <span className="font-bold text-gray-100">{trip.tracking_code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        trip.is_stuck
                          ? 'bg-red-900/40 text-red-300 border border-red-800/50'
                          : trip.status === 'completed'
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'
                            : 'bg-blue-900/40 text-blue-300 border border-blue-800/50'
                      }`}
                    >
                      {trip.is_stuck ? 'Atascado' : trip.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-gray-300">
                      {trip.vehicle_identifier || trip.vehicle_type?.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {trip.route_origin} &rarr; {trip.route_destination}
                    </p>
                  </div>

                  {trip.is_stuck && trip.stuck_reason && (
                    <div className="p-2 rounded bg-red-950/60 border border-red-900/60 text-red-300 text-[11px] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{trip.stuck_reason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800 text-[10px]">
                    <div>
                      <span className="text-gray-400 block">Progreso</span>
                      <span className="font-bold text-white">{trip.progress_percentage.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Flete Pactado</span>
                      <span className="font-bold text-emerald-400">
                        ${trip.agreed_freight_price.toLocaleString()} {trip.currency}
                      </span>
                    </div>
                  </div>

                  {onOpenSummary && (trip.status === 'completed' || trip.progress_percentage >= 100) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSummary(trip);
                      }}
                      className="w-full mt-2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md text-[11px] text-center transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Ver Resumen de Cierre</span>
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating telemetry control overlay (Flowbite Minimalist) */}
      <div className="absolute top-3 left-3 z-20 bg-gray-900/90 backdrop-blur-xs border border-gray-800 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-white">Radar Multimodal</span>
        </div>
        <div className="h-3 w-px bg-gray-700" />
        <span className="text-xs text-gray-400 font-mono">
          {trips.length} {trips.length === 1 ? 'en mapa' : 'en mapa'}
        </span>
      </div>

      {/* Map Style Selector Overlay (Flowbite Minimalist Segmented) */}
      <div className="absolute top-3 right-3 z-20 bg-gray-900/90 backdrop-blur-xs border border-gray-800 p-1 rounded-lg shadow-xs flex items-center gap-1">
        <button
          onClick={() => setMapStyle('dark')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
            mapStyle === 'dark'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Modo Oscuro Cyber (Alta Resolución)"
        >
          Dark
        </button>
        <button
          onClick={() => setMapStyle('voyager')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
            mapStyle === 'voyager'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Modo Rutas & Calles HD"
        >
          Rutas
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
            mapStyle === 'satellite'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Modo Satelital Esri HD"
        >
          Satélite
        </button>
      </div>

      {/* Map Legend (Flowbite Minimalist) */}
      <div className="absolute bottom-3 right-3 z-20 bg-gray-900/90 backdrop-blur-xs border border-gray-800 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-3 text-[11px] text-gray-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>En ruta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Fricción</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Completado</span>
        </div>
      </div>
    </div>
  );
};
