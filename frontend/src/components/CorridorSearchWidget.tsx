import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { Search, ArrowRightLeft, MapPin, X, Navigation, CheckCircle2, Wrench } from 'lucide-react';
import type { StationSearchResult, CorridorSearchResult } from '../types';

interface CorridorSearchWidgetProps {
  onSearchCorridor: (fromCode: string, toCode: string) => void;
  activeCorridor: CorridorSearchResult | null;
  onClearCorridor: () => void;
  onScheduleMaintenance?: (assetId: string) => void;
  loading?: boolean;
}

const POPULAR_CORRIDORS = [
  { from: 'NDLS', to: 'CNB', label: 'NDLS ⇄ CNB (Delhi-Kanpur)' },
  { from: 'MMCT', to: 'ADI', label: 'MMCT ⇄ ADI (Mumbai-Ahmedabad)' },
  { from: 'MAS', to: 'BZA', label: 'MAS ⇄ BZA (Chennai-Vijayawada)' },
  { from: 'SBC', to: 'MAS', label: 'SBC ⇄ MAS (Bangalore-Chennai)' },
  { from: 'HWH', to: 'PNBE', label: 'HWH ⇄ PNBE (Howrah-Patna)' },
];

export const CorridorSearchWidget: React.FC<CorridorSearchWidgetProps> = ({
  onSearchCorridor,
  activeCorridor,
  onClearCorridor,
  onScheduleMaintenance,
  loading = false,
}) => {
  const [fromQuery, setFromQuery] = useState<string>('');
  const [toQuery, setToQuery] = useState<string>('');
  
  const [fromCode, setFromCode] = useState<string>('');
  const [toCode, setToCode] = useState<string>('');

  const [fromResults, setFromResults] = useState<StationSearchResult[]>([]);
  const [toResults, setToResults] = useState<StationSearchResult[]>([]);

  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Sync state if active corridor changes
  useEffect(() => {
    if (activeCorridor) {
      const fromC = activeCorridor.from_station.code || activeCorridor.corridor_id.split('-')[0] || '';
      const toC = activeCorridor.to_station.code || activeCorridor.corridor_id.split('-')[1] || '';
      const fromN = activeCorridor.from_station.name || fromC;
      const toN = activeCorridor.to_station.name || toC;
      setFromQuery(`${fromC} - ${fromN}`);
      setToQuery(`${toC} - ${toN}`);
      setFromCode(fromC);
      setToCode(toC);
    }
  }, [activeCorridor]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete for From input
  useEffect(() => {
    if (!fromQuery.trim() || fromCode) {
      setFromResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/network/stations/search?q=${encodeURIComponent(fromQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setFromResults(data);
          setShowFromDropdown(true);
        }
      } catch (e) {
        console.error('Error searching source station:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [fromQuery, fromCode]);

  // Autocomplete for To input
  useEffect(() => {
    if (!toQuery.trim() || toCode) {
      setToResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/network/stations/search?q=${encodeURIComponent(toQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setToResults(data);
          setShowToDropdown(true);
        }
      } catch (e) {
        console.error('Error searching destination station:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [toQuery, toCode]);

  const handleSwap = () => {
    const tempQuery = fromQuery;
    const tempCode = fromCode;
    setFromQuery(toQuery);
    setFromCode(toCode);
    setToQuery(tempQuery);
    setToCode(tempCode);

    if (toCode && tempCode) {
      onSearchCorridor(toCode, tempCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFrom = fromCode || fromQuery.split(' ')[0].trim().toUpperCase();
    const finalTo = toCode || toQuery.split(' ')[0].trim().toUpperCase();
    if (finalFrom && finalTo && finalFrom !== finalTo) {
      onSearchCorridor(finalFrom, finalTo);
    }
  };

  const handleQuickPick = (from: string, to: string) => {
    setFromCode(from);
    setToCode(to);
    setFromQuery(from);
    setToQuery(to);
    onSearchCorridor(from, to);
  };

  const handleClear = () => {
    setFromQuery('');
    setToQuery('');
    setFromCode('');
    setToCode('');
    onClearCorridor();
  };

  return (
    <div className="bg-white rounded-3 shadow-sm border p-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 bg-primary bg-opacity-10 text-primary rounded">
            <Navigation size={16} />
          </div>
          <span className="fw-bold text-dark small">Junction Corridor Route Finder</span>
        </div>
        {activeCorridor && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="py-0 px-2 d-flex align-items-center gap-1 extra-small"
            style={{ fontSize: '0.72rem' }}
            onClick={handleClear}
          >
            <X size={12} /> Clear Corridor
          </Button>
        )}
      </div>

      <Form onSubmit={handleSubmit}>
        <div className="d-flex flex-column gap-2 mb-2">
          {/* From Station Input */}
          <div className="position-relative" ref={fromRef}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-light border-end-0 py-1 px-2">
                <MapPin size={13} className="text-success" />
              </InputGroup.Text>
              <Form.Control
                placeholder="From Junction (e.g. NDLS, MMCT, MAS)"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setFromCode('');
                }}
                onFocus={() => setShowFromDropdown(true)}
                className="border-start-0 ps-1"
                style={{ fontSize: '0.82rem' }}
              />
              {fromQuery && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="bg-white border-start-0 py-0 px-2"
                  onClick={() => {
                    setFromQuery('');
                    setFromCode('');
                  }}
                >
                  <X size={12} />
                </Button>
              )}
            </InputGroup>

            {/* From Autocomplete Dropdown */}
            {showFromDropdown && fromResults.length > 0 && (
              <div
                className="position-absolute start-0 w-100 mt-1 bg-white rounded-3 shadow-lg border overflow-auto"
                style={{ maxHeight: '180px', zIndex: 1100 }}
              >
                {fromResults.map((stn) => (
                  <div
                    key={stn.code}
                    className="px-3 py-2 border-bottom station-search-item d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer', fontSize: '0.78rem' }}
                    onClick={() => {
                      setFromCode(stn.code);
                      setFromQuery(`${stn.code} - ${stn.name}`);
                      setShowFromDropdown(false);
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

          {/* Swap Button Divider */}
          <div className="d-flex align-items-center justify-content-center my-0 position-relative">
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle shadow-xs border p-1 text-primary d-flex align-items-center justify-content-center"
              style={{ width: '26px', height: '26px' }}
              onClick={handleSwap}
              title="Swap Junctions"
            >
              <ArrowRightLeft size={13} />
            </button>
          </div>

          {/* To Station Input */}
          <div className="position-relative" ref={toRef}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-light border-end-0 py-1 px-2">
                <MapPin size={13} className="text-danger" />
              </InputGroup.Text>
              <Form.Control
                placeholder="To Junction (e.g. CNB, ADI, BZA)"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setToCode('');
                }}
                onFocus={() => setShowToDropdown(true)}
                className="border-start-0 ps-1"
                style={{ fontSize: '0.82rem' }}
              />
              {toQuery && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="bg-white border-start-0 py-0 px-2"
                  onClick={() => {
                    setToQuery('');
                    setToCode('');
                  }}
                >
                  <X size={12} />
                </Button>
              )}
            </InputGroup>

            {/* To Autocomplete Dropdown */}
            {showToDropdown && toResults.length > 0 && (
              <div
                className="position-absolute start-0 w-100 mt-1 bg-white rounded-3 shadow-lg border overflow-auto"
                style={{ maxHeight: '180px', zIndex: 1100 }}
              >
                {toResults.map((stn) => (
                  <div
                    key={stn.code}
                    className="px-3 py-2 border-bottom station-search-item d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer', fontSize: '0.78rem' }}
                    onClick={() => {
                      setToCode(stn.code);
                      setToQuery(`${stn.code} - ${stn.name}`);
                      setShowToDropdown(false);
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
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm"
          disabled={loading || (!fromQuery.trim() || !toQuery.trim())}
          style={{ fontSize: '0.82rem' }}
        >
          {loading ? <Spinner size="sm" animation="border" /> : <Search size={14} />}
          Inspect Corridor & Stations
        </Button>
      </Form>

      {/* Popular Fast Corridor Presets */}
      <div className="mt-2 pt-2 border-top">
        <div className="text-muted extra-small mb-1 fw-semibold" style={{ fontSize: '0.7rem' }}>
          Popular Trunk Corridors:
        </div>
        <div className="d-flex flex-wrap gap-1">
          {POPULAR_CORRIDORS.map((c) => {
            const isCurrent = activeCorridor?.corridor_id === `${c.from}-${c.to}` || activeCorridor?.corridor_id === `${c.to}-${c.from}`;
            return (
              <button
                key={c.label}
                type="button"
                className={`btn btn-xs py-0 px-2 rounded-pill ${
                  isCurrent ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary'
                }`}
                style={{ fontSize: '0.7rem' }}
                onClick={() => handleQuickPick(c.from, c.to)}
                disabled={loading}
              >
                {c.from} ⇄ {c.to}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Corridor Summary Ribbon */}
      {activeCorridor && (
        <div className="mt-2 p-2 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25 extra-small">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold text-primary d-flex align-items-center gap-1">
              <CheckCircle2 size={13} className="text-success" /> Active Corridor Focus
            </span>
            <Badge bg="primary" pill>
              {activeCorridor.stations_count} Stations
            </Badge>
          </div>
          <div className="text-dark fw-medium small mb-1">
            {activeCorridor.from_station.name} ⇄ {activeCorridor.to_station.name}
          </div>
          <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.72rem' }}>
            <span>Distance: ~{activeCorridor.total_distance_km} km</span>
            <span>Running Trains: <strong>{activeCorridor.trains_count}</strong></span>
          </div>
          {onScheduleMaintenance && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="w-100 fw-bold d-flex align-items-center justify-content-center gap-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => onScheduleMaintenance(activeCorridor.corridor_id)}
            >
              <Wrench size={12} /> Schedule Maintenance on this Corridor
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
