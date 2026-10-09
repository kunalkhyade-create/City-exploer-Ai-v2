import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place, Hazard, PlannedStop } from '../types';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface MapViewProps {
  places: Place[];
  hazards: Hazard[];
  plannedStops?: PlannedStop[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place) => void;
  onSavePlace?: (placeId: string) => void;
  cityCenter?: [number, number];
  cityName?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  hazards,
  plannedStops = [],
  selectedPlace,
  onSelectPlace,
  cityCenter = [18.5204, 73.8567],
  cityName = 'Pune',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Pune center
    const map = L.map(mapContainerRef.current, {
      center: [18.5204, 73.8567],
      zoom: 13,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers, Hazards, and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Add Hazard Circles (Amber / Red alert radius)
    hazards.forEach(h => {
      const circle = L.circle([h.lat, h.lng], {
        radius: h.radius_m,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '4, 4',
      });

      circle.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 180px;">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
            <span style="background:#e11d48;color:white;font-size:9px;font-weight:bold;padding:1px 4px;border-radius:3px;">HAZARD DEMO</span>
            <span style="font-size:10px;color:#f43f5e;font-weight:bold;text-transform:uppercase;">${h.category}</span>
          </div>
          <strong style="color:#0f172a;font-size:13px;display:block;">${h.title}</strong>
          <p style="color:#475569;font-size:11px;margin:4px 0;">${h.description}</p>
          <div style="font-size:10px;color:#64748b;font-style:italic;">Radius: ~${h.radius_m}m | Demo Data</div>
        </div>
      `);
      layerGroup.addLayer(circle);
    });

    // 2. Add Planned Route Polylines if stops exist
    if (plannedStops.length > 0) {
      plannedStops.forEach((stop, index) => {
        if (stop.travelFromPrev?.geometry) {
          const latLngs = stop.travelFromPrev.geometry.coordinates.map(c => [c[1], c[0]] as [number, number]);
          const polyline = L.polyline(latLngs, {
            color: '#f97316',
            weight: 4,
            opacity: 0.85,
            dashArray: stop.travelFromPrev.routeLabel.includes('Estimated') ? '6, 8' : undefined,
          });
          layerGroup.addLayer(polyline);
        } else if (index > 0) {
          // Direct fallback polyline
          const prev = plannedStops[index - 1].place;
          const polyline = L.polyline(
            [[prev.lat, prev.lng], [stop.place.lat, stop.place.lng]],
            { color: '#f97316', weight: 4, opacity: 0.85, dashArray: '6, 8' }
          );
          layerGroup.addLayer(polyline);
        }
      });
    }

    // 3. Add Place Markers
    const bounds: [number, number][] = [];

    // Map of planned stop orders
    const stopOrderMap = new Map<string, number>();
    plannedStops.forEach(s => stopOrderMap.set(s.place.id, s.stopOrder));

    places.forEach(p => {
      const isPlanned = stopOrderMap.has(p.id);
      const stopOrder = stopOrderMap.get(p.id);

      const markerColor = isPlanned ? '#f97316' : '#6366f1';
      const iconHtml = `
        <div style="
          background:${markerColor};
          color:white;
          width:${isPlanned ? '28px' : '22px'};
          height:${isPlanned ? '28px' : '22px'};
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:bold;
          font-size:${isPlanned ? '13px' : '10px'};
          border:2px solid white;
          box-shadow:0 3px 8px rgba(0,0,0,0.4);
        ">
          ${isPlanned ? stopOrder : '•'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'citypulse-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 200px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="background:#f1f5f9;color:#475569;font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;text-transform:uppercase;">${p.category}</span>
            <span style="font-size:11px;font-weight:bold;color:#ea580c;">₹${p.indicative_price_inr}</span>
          </div>
          <strong style="color:#0f172a;font-size:13px;display:block;">${p.name}</strong>
          <p style="color:#64748b;font-size:11px;margin:4px 0;">${p.description}</p>
          <div style="margin-top:6px;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;">
            <span>⏱️ ~${p.visit_minutes} min</span>
            <span>♿ ${p.step_free ? 'Step-Free' : 'Steps'}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(p);
      });

      layerGroup.addLayer(marker);
      bounds.push([p.lat, p.lng]);
    });

    // Center on selected place or bounds
    if (selectedPlace) {
       map.setView([selectedPlace.lat, selectedPlace.lng], 15, { animate: true });
    } else if (plannedStops.length > 0) {
      const stopBounds = plannedStops.map(s => [s.place.lat, s.place.lng] as [number, number]);
      map.fitBounds(stopBounds, { padding: [40, 40] });
    } else if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (cityCenter) {
      map.setView(cityCenter, 13, { animate: true });
    }
  }, [places, hazards, plannedStops, selectedPlace, onSelectPlace, cityCenter]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Friendly Tile Fallback Notice */}
      {tileError && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-3 shadow-lg z-[1000]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Map tiles loading slowly. Interactive pins and route vectors remain fully functional.</span>
          </div>
          <button
            onClick={() => setTileError(false)}
            className="text-amber-400 hover:text-amber-200 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 px-3 py-2 rounded-lg shadow-lg z-[1000] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 border border-white inline-block" />
          <span>Planned Stops</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white inline-block" />
          <span>{cityName} Places</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-200 inline-block" />
          <span>Active Alerts (Demo)</span>
        </div>
      </div>
    </div>
  );
};
