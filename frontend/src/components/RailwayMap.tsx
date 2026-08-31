import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type {
  RailwayNetwork,
  StationNode,
  MaintenanceRequest,
  ScheduledBlock,
  StationSearchResult,
  CorridorSearchResult,
  CorridorStation,
  LiveTrainData
} from '../types';
import {
  MapPin,
  Maximize2,
  Minimize2,
  Train as TrainIcon,
  Wrench,
  Search,
  X,
  Activity,
  ShieldAlert,
  Navigation,
  Compass,
  Layers,
  Route
} from 'lucide-react';
import { Badge, Button, Form, InputGroup } from 'react-bootstrap';

// Fix default Leaflet icon paths in React/Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Auto invalidate map size on container resize / fullscreen toggle
function InvalidateSizeEffect({ isFullScreen }: { isFullScreen?: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

// Component to handle auto-fit bounds and camera panning
function MapController({
  nodes,
  selectedStationId,
  selectedTrackId,
  network,
  searchTargetCoords,
  activeCorridor,
  searchedLiveTrain,
}: {
  nodes: StationNode[];
  selectedStationId?: string | null;
  selectedTrackId?: string | null;
  network: RailwayNetwork | null;
  searchTargetCoords?: [number, number] | null;
  activeCorridor?: CorridorSearchResult | null;
  searchedLiveTrain?: LiveTrainData | null;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  useEffect(() => {
    // Initial auto-fit when network nodes load for the first time
    if (!initialFitDone.current && nodes.length > 0 && !activeCorridor && !searchedLiveTrain && !selectedStationId && !selectedTrackId && !searchTargetCoords) {
      initialFitDone.current = true;
      const bounds = L.latLngBounds(nodes.map((n) => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [35, 35] });
      return;
    }

    // 1. If an active corridor is selected, fit bounds to that entire corridor
    if (activeCorridor && activeCorridor.track_coordinates.length > 0) {
      const bounds = L.latLngBounds(activeCorridor.track_coordinates.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
      return;
    }

    // 2. If a specific live train is searched, fly to its route / current location
    if (searchedLiveTrain && searchedLiveTrain.route && searchedLiveTrain.route.length > 0) {
      const curr = searchedLiveTrain.route.find(r => r.status === 'upcoming') || searchedLiveTrain.route[0];
      if (curr) {
        // Find matching node coordinates if available
        const node = nodes.find(n => n.code === curr.stationCode);
        if (node) {
          map.flyTo([node.lat, node.lng], 9, { duration: 1.2 });
          return;
        }
      }
    }

    // 3. Search target coordinates
    if (searchTargetCoords) {
      map.flyTo(searchTargetCoords, 9, { duration: 1.4 });
      return;
    }

    // 4. Selected Station
    if (selectedStationId) {
      const station = nodes.find((n) => n.id === selectedStationId || n.code === selectedStationId);
      if (station) {
        map.flyTo([station.lat, station.lng], 8, { duration: 1.2 });
        return;
      }
    }

    // 5. Selected Track
    if (selectedTrackId && network) {
      const edge = network.edges.find((e) => e.id === selectedTrackId || e.id === selectedTrackId.split('-').reverse().join('-'));
      if (edge) {
        const src = network.nodes.find((n) => n.id === edge.source || n.code === edge.source);
        const tgt = network.nodes.find((n) => n.id === edge.target || n.code === edge.target);
        if (src && tgt) {
          const bounds = L.latLngBounds([
            [src.lat, src.lng],
            [tgt.lat, tgt.lng],
          ]);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 9 });
          return;
        }
      }
    }
  }, [activeCorridor, searchedLiveTrain, selectedStationId, selectedTrackId, searchTargetCoords, nodes, network, map]);

  return null;
}

// Reset camera to India network bounds & Fullscreen toggle toolbar
function MapTopRightControls({
  nodes,
  isFullScreen,
  onToggleFullScreen,
}: {
  nodes: StationNode[];
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}) {
  const map = useMap();

  const handleReset = () => {
    if (nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map((n) => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '12px', marginRight: '12px', pointerEvents: 'auto', zIndex: 1000 }}>
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          onClick={handleReset}
          title="Fit Entire Indian Railway Network"
          className="btn btn-sm btn-light bg-white border shadow-sm d-flex align-items-center gap-1 py-1 px-2 text-dark fw-semibold"
          style={{ fontSize: '0.78rem' }}
        >
          <Compass size={14} className="text-primary" /> Fit Network
        </button>

        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen Mode (Esc)' : 'Expand Map to Full Screen for National Analysis'}
            className={`btn btn-sm shadow-sm d-flex align-items-center gap-1 py-1 px-2 fw-semibold ${isFullScreen ? 'btn-dark text-white border-white' : 'btn-primary text-white'
              }`}
            style={{ fontSize: '0.78rem' }}
          >
            {isFullScreen ? (
              <>
                <Minimize2 size={14} /> Exit Full Screen (Esc)
              </>
            ) : (
              <>
                <Maximize2 size={14} /> Full Screen Map
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface RailwayMapProps {
  network: RailwayNetwork | null;
  maintenanceRequests: MaintenanceRequest[];
  optimizationPlan?: ScheduledBlock[] | null;
  emergencyActive: boolean;
  emergencyAssetId?: string | null;
  selectedStationId?: string | null;
  selectedTrackId?: string | null;
  networkMode?: 'major' | 'hdn' | 'full';
  activeCorridor?: CorridorSearchResult | null;
  searchedLiveTrain?: LiveTrainData | null;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onClearActiveCorridor?: () => void;
  onClearLiveTrain?: () => void;
  onToggleNetworkMode?: (mode: 'major' | 'hdn' | 'full') => void;
  onSelectStation?: (stationId: string | null) => void;
  onSelectTrack?: (trackId: string | null) => void;
  onInjectEmergencyForTrack?: (trackId: string) => void;
  onScheduleMaintenanceForTrack?: (trackId: string) => void;
}

export const RailwayMap: React.FC<RailwayMapProps> = ({
  network,
  maintenanceRequests,
  emergencyActive,
  emergencyAssetId,
  selectedStationId,
  selectedTrackId,
  networkMode = 'major',
  activeCorridor,
  searchedLiveTrain,
  isFullScreen = false,
  onToggleFullScreen,
  onClearActiveCorridor,
  onClearLiveTrain,
  onToggleNetworkMode,
  onSelectStation,
  onSelectTrack,
  onInjectEmergencyForTrack,
  onScheduleMaintenanceForTrack,
}) => {
  // Layer visibility toggles
  const [showTrackLines, setShowTrackLines] = useState<boolean>(false);
  const [showMaintenance, setShowMaintenance] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Station search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StationSearchResult[]>([]);
  const [searchTargetCoords, setSearchTargetCoords] = useState<[number, number] | null>(null);

  // Listen to Escape key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen && onToggleFullScreen) {
        onToggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onToggleFullScreen]);

  // Search autocomplete handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/network/stations/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error searching stations:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const nodes = network?.nodes || [];
  const edges = network?.edges || [];

  const nodeMap = useMemo(() => {
    const map = new Map<string, StationNode>();
    nodes.forEach((n) => {
      map.set(n.id, n);
      if (n.code) map.set(n.code, n);
    });
    return map;
  }, [nodes]);

  // Center coordinates of India
  const centerPosition: [number, number] = [21.7679, 78.8718];
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // Custom Station Icon Generator for National Hubs
  const createStationIcon = (node: StationNode, isSelected: boolean) => {
    const isJunction = node.is_junction || (node.train_count && node.train_count > 30);
    const color = isSelected ? '#ef4444' : isJunction ? '#0b3a75' : '#2563eb';
    const radius = isSelected ? 9.5 : isJunction ? 7.5 : 5.5;
    const stroke = '#ffffff';

    const html = `
      <div class="custom-station-pin ${isSelected ? 'selected-pin' : ''}">
        <div class="station-halo ${isJunction ? 'junction-halo' : ''}"></div>
        <svg width="24" height="24" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
          <circle cx="12" cy="12" r="${radius}" fill="${color}" stroke="${stroke}" stroke-width="2.2" />
          <circle cx="12" cy="12" r="${isSelected ? 3.5 : 2.5}" fill="#ffffff" />
        </svg>
        ${showLabels
        ? `<div class="station-tag-label ${isSelected ? 'highlight' : ''}">${node.code || node.name}</div>`
        : ''
      }
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  // Custom Station Icon for Intermediate Corridor Stations
  const createCorridorStationIcon = (stn: CorridorStation, isEnd: boolean, isSelected: boolean) => {
    const color = isSelected ? '#ff5722' : isEnd ? '#0d6efd' : '#475569';
    const radius = isEnd ? 8 : 5;
    const stroke = '#ffffff';

    const html = `
      <div class="custom-station-pin ${isSelected ? 'selected-pin' : ''}">
        <div class="station-halo" style="${isEnd ? 'box-shadow: 0 0 8px #0d6efd;' : ''}"></div>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="${radius}" fill="${color}" stroke="${stroke}" stroke-width="2" />
          ${isEnd ? '<circle cx="12" cy="12" r="2.5" fill="#ffffff" />' : ''}
        </svg>
        ${showLabels || isEnd
        ? `<div class="station-tag-label ${isEnd ? 'highlight' : ''}" style="font-size: ${isEnd ? '0.75rem' : '0.68rem'}">${stn.code}</div>`
        : ''
      }
      </div>
    `;

    return L.divIcon({
      html,
      className: 'station-div-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    });
  };

  // Live Train Beacon Icon for Searched Train Only
  const createSearchedTrainBeaconIcon = (trainData: LiveTrainData) => {
    const isDelayed = (trainData.current_status?.delay_mins || 0) > 0;
    const badgeColor = isDelayed ? '#dc3545' : '#198754';

    const html = `
      <div class="custom-train-marker active-searched-train" title="${trainData.train.name} (${trainData.train.number})">
        <div class="train-pulse-ring" style="border-color: ${badgeColor}; animation-duration: 1.2s; transform: scale(1.4);"></div>
        <div class="train-icon-badge shadow" style="background-color: ${badgeColor}; width: 26px; height: 26px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="16" height="16" x="4" y="3" rx="2"/>
            <path d="M4 11h16"/>
            <path d="M12 3v8"/>
            <path d="m8 19-2 3"/>
            <path d="m18 22-2-3"/>
            <circle cx="8" cy="15" r="1"/>
            <circle cx="16" cy="15" r="1"/>
          </svg>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'train-div-icon',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13],
    });
  };

  // Resolve coordinates of live searched train
  const searchedTrainPosition: [number, number] | null = useMemo(() => {
    if (!searchedLiveTrain || !searchedLiveTrain.route || searchedLiveTrain.route.length === 0) return null;

    // Find current active halt station or first upcoming
    const upcoming = searchedLiveTrain.route.find(r => r.status === 'upcoming') || searchedLiveTrain.route[0];
    if (!upcoming) return null;

    // Check if in nodeMap
    const foundNode = nodeMap.get(upcoming.stationCode);
    if (foundNode) return [foundNode.lat, foundNode.lng];

    // Check if in active corridor stations
    if (activeCorridor) {
      const corrStn = activeCorridor.stations.find(s => s.code === upcoming.stationCode);
      if (corrStn) return [corrStn.lat, corrStn.lng];
    }

    return null;
  }, [searchedLiveTrain, nodeMap, activeCorridor]);

  return (
    <div className={`position-relative w-100 h-100 ${isFullScreen ? 'fullscreen-map-wrapper' : ''}`} ref={mapContainerRef}>
      {/* Full-Screen Mode Header Ribbon */}
      {isFullScreen && (
        <div
          className="position-absolute top-0 start-50 translate-middle-x mt-2 px-3 py-1 bg-dark text-white rounded-pill shadow-lg border border-secondary d-flex align-items-center gap-2 extra-small"
          style={{ zIndex: 1050, opacity: 0.95 }}
        >
          <Layers size={13} className="text-warning" />
          <span className="fw-semibold">Full-Screen National Track Inspection Mode</span>
          <span className="text-white-50">|</span>
          <span className="text-info extra-small">Showing {nodes.length} Stations & {edges.length} Trunk Tracks</span>
          <button
            type="button"
            className="btn btn-xs btn-outline-light py-0 px-2 rounded-pill ms-2 extra-small d-flex align-items-center gap-1"
            onClick={onToggleFullScreen}
          >
            <Minimize2 size={11} /> Exit Full Screen (Esc)
          </button>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div
        className="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2"
        style={{ zIndex: 1000, maxWidth: isFullScreen ? '460px' : '380px' }}
      >
        {/* Network Mode Switcher */}
        <div className="bg-white rounded-3 shadow-sm border p-2 d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-1 extra-small fw-bold text-secondary">
            <Activity size={14} className="text-primary" />
            <span>Map Scope:</span>
          </div>
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn btn-xs py-1 px-2 ${networkMode === 'major' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => onToggleNetworkMode?.('major')}
              title="Only major national hub junctions (Fastest, zero lag)"
            >
              Major Hubs ({networkMode === 'major' ? nodes.length : '76'})
            </button>
            <button
              type="button"
              className={`btn btn-xs py-1 px-2 ${networkMode === 'hdn' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => onToggleNetworkMode?.('hdn')}
              title="High-density network corridors"
            >
              Trunk HDN (200)
            </button>
            <button
              type="button"
              className={`btn btn-xs py-1 px-2 ${networkMode === 'full' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => onToggleNetworkMode?.('full')}
              title="Full network (all stations)"
            >
              All (4,300+)
            </button>
          </div>
        </div>

        {/* Station Autocomplete Quick Jump */}
        <div className="position-relative">
          <InputGroup size="sm" className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0 py-1">
              <Search size={13} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Quick jump station (e.g. NDLS, CNB, SBC, AK, NGP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-start-0 ps-0"
              style={{ fontSize: '0.82rem' }}
            />
            {searchQuery && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="bg-white border-start-0 py-0 px-2"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </Button>
            )}
          </InputGroup>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div
              className="position-absolute start-0 w-100 mt-1 bg-white rounded-3 shadow-lg border overflow-auto"
              style={{ maxHeight: '200px', zIndex: 1050 }}
            >
              {searchResults.map((stn) => (
                <div
                  key={stn.code}
                  className="px-3 py-2 border-bottom station-search-item d-flex justify-content-between align-items-center"
                  style={{ cursor: 'pointer', fontSize: '0.78rem' }}
                  onClick={() => {
                    setSearchTargetCoords([stn.lat, stn.lng]);
                    onSelectStation?.(stn.code);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <div>
                    <span className="fw-bold text-primary me-2">{stn.code}</span>
                    <span className="text-dark">{stn.name}</span>
                  </div>
                  <Badge bg="light" text="dark" className="border extra-small">
                    {stn.zone || 'IR'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Corridor Notification Pill */}
        {activeCorridor && (
          <div className="bg-primary text-white p-2 rounded-3 shadow-sm d-flex justify-content-between align-items-center extra-small">
            <div className="d-flex align-items-center gap-1">
              <Navigation size={13} className="text-warning" />
              <span>
                Corridor: <strong>{activeCorridor.from_station.code || activeCorridor.from_station.name} ⇄ {activeCorridor.to_station.code || activeCorridor.to_station.name}</strong> ({activeCorridor.stations_count} Halts • {activeCorridor.total_distance_km} km)
              </span>
            </div>
            {onClearActiveCorridor && (
              <button
                type="button"
                className="btn btn-xs btn-outline-light py-0 px-1 border-0"
                onClick={onClearActiveCorridor}
                title="Exit corridor and view national network"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Active Searched Train Live Status Pill */}
        {searchedLiveTrain && (
          <div className="bg-dark text-white p-2 rounded-3 shadow-sm d-flex justify-content-between align-items-center extra-small border border-success">
            <div className="d-flex align-items-center gap-1">
              <TrainIcon size={14} className="text-success" />
              <span>
                Live Track: <strong>#{searchedLiveTrain.train.number}</strong> ({searchedLiveTrain.train.name})
              </span>
              <span className="badge bg-success bg-opacity-75 ms-1">
                {searchedLiveTrain.current_status?.status || 'Active'}
              </span>
            </div>
            {onClearLiveTrain && (
              <button
                type="button"
                className="btn btn-xs btn-outline-light py-0 px-1 border-0"
                onClick={onClearLiveTrain}
                title="Clear live train tracking"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Layer Visibility Pills */}
      <div
        className="position-absolute bottom-0 start-0 m-3 d-flex gap-2"
        style={{ zIndex: 1000 }}
      >
        <button
          type="button"
          onClick={() => setShowTrackLines(!showTrackLines)}
          className={`btn btn-sm shadow-sm d-flex align-items-center gap-1 ${showTrackLines ? 'btn-primary text-white fw-bold' : 'btn-light border text-secondary'
            }`}
          style={{ fontSize: '0.75rem' }}
          title="Toggle railway track lines ON/OFF (Kept OFF by default to eliminate lag and heavy page load)"
        >
          <Route size={13} /> Track Lines: {showTrackLines ? 'ON' : 'OFF (Fast)'}
        </button>
        <button
          type="button"
          onClick={() => setShowMaintenance(!showMaintenance)}
          className={`btn btn-sm shadow-sm d-flex align-items-center gap-1 ${showMaintenance ? 'btn-warning text-dark fw-semibold' : 'btn-light border'
            }`}
          style={{ fontSize: '0.75rem' }}
        >
          <Wrench size={13} /> Maintenance Blocks ({maintenanceRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setShowLabels(!showLabels)}
          className={`btn btn-sm shadow-sm d-flex align-items-center gap-1 ${showLabels ? 'btn-secondary text-white' : 'btn-light border'
            }`}
          style={{ fontSize: '0.75rem' }}
        >
          <MapPin size={13} /> Station Labels
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={centerPosition}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        style={{ width: '100%', height: '100%', backgroundColor: '#f0f4f8' }}
      >
        <InvalidateSizeEffect isFullScreen={isFullScreen} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />

        <MapController
          nodes={nodes}
          selectedStationId={selectedStationId}
          selectedTrackId={selectedTrackId}
          network={network}
          searchTargetCoords={searchTargetCoords}
          activeCorridor={activeCorridor}
          searchedLiveTrain={searchedLiveTrain}
        />

        <MapTopRightControls
          nodes={nodes}
          isFullScreen={isFullScreen}
          onToggleFullScreen={onToggleFullScreen}
        />

        {/* 1. RENDER ACTIVE SEARCHED CORRIDOR (If an operator has searched 2 junctions or scheduled maintenance) */}
        {activeCorridor && activeCorridor.track_coordinates.length > 1 && (() => {
          const isEmergency = emergencyActive && (emergencyAssetId === activeCorridor.corridor_id || emergencyAssetId === activeCorridor.corridor_id.split('-').reverse().join('-'));
          const hasMaintenance = (activeCorridor.active_blocks && activeCorridor.active_blocks.length > 0) || maintenanceRequests.some(
            (m) => m.asset_id === activeCorridor.corridor_id || m.asset_id === activeCorridor.corridor_id.split('-').reverse().join('-')
          );
          const blockColor = isEmergency ? '#dc2626' : hasMaintenance ? '#f59e0b' : '#0d6efd';
          const isDashed = isEmergency || hasMaintenance;

          return (
            <Polyline
              positions={activeCorridor.track_coordinates}
              pathOptions={{
                color: blockColor,
                weight: 6.0,
                opacity: 0.95,
                dashArray: isDashed ? '8, 8' : undefined,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontSize: '0.82rem' }}>
                  <strong>{activeCorridor.from_station.name} ➔ {activeCorridor.to_station.name}</strong>
                  <br />
                  <span>Corridor: {activeCorridor.corridor_id} ({activeCorridor.stations_count} Stations)</span>
                  <br />
                  <span>Distance: ~{activeCorridor.total_distance_km} km | Travel Time: ~{activeCorridor.avg_travel_time_mins} mins</span>
                  {hasMaintenance && (
                    <div className="text-warning fw-bold mt-1">⚠️ Active Maintenance Block on Corridor</div>
                  )}
                  {isEmergency && (
                    <div className="text-danger fw-bold mt-1">🚨 Emergency Track Failure on Corridor</div>
                  )}
                </div>
              </Tooltip>
            </Polyline>
          );
        })()}

        {/* 1b. Render Intermediate Stations on the Active Searched Corridor */}
        {activeCorridor &&
          activeCorridor.stations.map((stn, idx) => {
            const isEnd = idx === 0 || idx === activeCorridor.stations.length - 1;
            const isSelected = selectedStationId === stn.code;
            return (
              <Marker
                key={`corr-stn-${stn.code}-${idx}`}
                position={[stn.lat, stn.lng]}
                icon={createCorridorStationIcon(stn, isEnd, isSelected)}
                eventHandlers={{
                  click: () => onSelectStation?.(stn.code),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', fontSize: '0.85rem' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold fs-6 text-primary">{stn.name}</span>
                      <Badge bg="primary">{stn.code}</Badge>
                    </div>
                    <div className="text-muted small mb-1">
                      Corridor Halt #{stn.sequence} | Zone: {stn.zone || 'IR'}
                    </div>
                    <div className="extra-small text-secondary mb-2">
                      Distance: {stn.distance_km} km from origin
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="w-100 py-0"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => onSelectStation?.(stn.code)}
                    >
                      Inspect Station
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 2. RENDER TRACKS (When showTrackLines is ON or when active maintenance / emergency / selected track exists) */}
        {!activeCorridor &&
          edges
            .filter((edge) => {
              const isSelected = selectedTrackId === edge.id;
              const isEmergency = emergencyActive && (emergencyAssetId === edge.id || emergencyAssetId === `${edge.target}-${edge.source}`);
              const hasMaintenance = showMaintenance && maintenanceRequests.some(
                (m) => m.asset_id === edge.id || m.asset_id === `${edge.target}-${edge.source}`
              );
              return showTrackLines || isSelected || isEmergency || hasMaintenance;
            })
            .map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isSelected = selectedTrackId === edge.id;
              const isEmergency = emergencyActive && (emergencyAssetId === edge.id || emergencyAssetId === `${edge.target}-${edge.source}`);
              const hasMaintenance = showMaintenance && maintenanceRequests.some(
                (m) => m.asset_id === edge.id || m.asset_id === `${edge.target}-${edge.source}`
              );

              const strokeColor = isEmergency ? '#dc2626' : hasMaintenance ? '#f59e0b' : '#ec4899';
              const strokeWidth = isEmergency ? 5 : isSelected ? 4.5 : 4;
              const strokeOpacity = 0.95;
              const dashArray = isEmergency || hasMaintenance ? '6, 6' : undefined;

              return (
                <Polyline
                  key={edge.id}
                  positions={[
                    [src.lat, src.lng],
                    [tgt.lat, tgt.lng],
                  ]}
                  pathOptions={{
                    color: strokeColor,
                    weight: strokeWidth,
                    opacity: strokeOpacity,
                    dashArray: dashArray,
                  }}
                  eventHandlers={{
                    click: () => onSelectTrack?.(edge.id),
                  }}
                >
                  <Tooltip sticky>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>{src.name} ➔ {tgt.name}</strong>
                      <br />
                      <span className="text-muted">Corridor: {edge.id}</span>
                      <br />
                      <span>Distance: {edge.distance_km || 150} km | Time: {edge.travel_time_mins} mins</span>
                      {hasMaintenance && <div className="text-warning fw-bold mt-1">⚠️ Active Maintenance Block</div>}
                      {isEmergency && <div className="text-danger fw-bold mt-1">🚨 CRITICAL TRACK FAILURE</div>}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth: '220px', fontSize: '0.85rem' }}>
                      <div className="fw-bold fs-6 text-primary mb-1">
                        {src.name} ➔ {tgt.name}
                      </div>
                      <div className="text-muted small mb-2">
                        Corridor Code: <code>{edge.id}</code>
                        <br />
                        Distance: {edge.distance_km || 150} km | Travel Time: {edge.travel_time_mins} mins
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <Button
                          size="sm"
                          variant="primary"
                          className="py-1"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => {
                            onSelectTrack?.(edge.id);
                            onScheduleMaintenanceForTrack?.(edge.id);
                          }}
                        >
                          <Wrench size={12} className="me-1" /> Schedule Planned Maintenance
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="py-1"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => {
                            onSelectTrack?.(edge.id);
                            onInjectEmergencyForTrack?.(edge.id);
                          }}
                        >
                          <ShieldAlert size={12} className="me-1" /> Inject Track Emergency
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}

        {/* 2b. RENDER DEFAULT NETWORK STATIONS (When no specific corridor is active) */}
        {!activeCorridor &&
          nodes.map((node) => {
            const isSelected = selectedStationId === node.id || selectedStationId === node.code;
            return (
              <Marker
                key={node.id}
                position={[node.lat, node.lng]}
                icon={createStationIcon(node, isSelected)}
                eventHandlers={{
                  click: () => onSelectStation?.(node.id),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', fontSize: '0.85rem' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold fs-6 text-primary">{node.name}</span>
                      <Badge bg="primary">{node.code}</Badge>
                    </div>
                    <div className="text-muted small mb-2">Zone: {node.zone || 'IR'} | Connected Degree: {node.degree || 2}</div>
                    <div className="d-flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="w-100 py-0"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => onSelectStation?.(node.id)}
                      >
                        Inspect Station
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 3. RENDER SINGLE SEARCHED LIVE TRAIN BEACON (ON-DEMAND ONLY) */}
        {searchedLiveTrain && searchedTrainPosition && (
          <Marker
            position={searchedTrainPosition}
            icon={createSearchedTrainBeaconIcon(searchedLiveTrain)}
          >
            <Popup>
              <div style={{ minWidth: '220px', fontSize: '0.85rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark">{searchedLiveTrain.train.name}</span>
                  <Badge bg={(searchedLiveTrain.current_status?.delay_mins || 0) > 0 ? 'danger' : 'success'}>
                    #{searchedLiveTrain.train.number}
                  </Badge>
                </div>
                <div className="text-muted small mb-1">
                  Route: <strong>{searchedLiveTrain.train.source?.name}</strong> ➔ <strong>{searchedLiveTrain.train.destination?.name}</strong>
                </div>
                <div className="small text-success fw-medium mb-2">
                  Status: {searchedLiveTrain.current_status?.status || 'Running On-Time'}
                </div>
                {onClearLiveTrain && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="w-100 py-0 extra-small"
                    onClick={onClearLiveTrain}
                  >
                    Close Live Tracking
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
