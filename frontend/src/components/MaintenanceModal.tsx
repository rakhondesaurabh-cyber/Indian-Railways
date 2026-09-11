import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge, InputGroup, Nav } from 'react-bootstrap';
import { Zap, Clock, Wrench, Search, MapPin, Calendar, CheckCircle2, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import type { RailwayNetwork, TrackEdge, StationSearchResult } from '../types';
import { API_BASE_URL } from '../config';
import { useAuth, ZONES } from '../context/AuthContext';

interface MaintenanceModalProps {
  show: boolean;
  onHide: () => void;
  network: RailwayNetwork | null;
  selectedTrackId?: string | null;
  onSubmit: (
    assetId: string,
    durationMins: number,
    failureType: string,
    priority: string,
    scheduledDate?: string,
    scheduledDay?: string,
    advanceNoticeDays?: number,
    department?: string,
    zone?: string,
    sectionName?: string,
    createdBy?: string,
    createdByRole?: string,
    createdByDesignation?: string
  ) => Promise<void>;
  loading: boolean;
}

// Helpers for formatted date calculation
const getOffsetDateString = (offsetDays: number = 1): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const getDayNameFromDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
  } catch {
    return 'Friday';
  }
};

const getHumanReadableDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  show,
  onHide,
  network,
  selectedTrackId,
  onSubmit,
  loading,
}) => {
  const [selectionMode, setSelectionMode] = useState<'preset' | 'junctions'>('preset');
  const [assetId, setAssetId] = useState<string>(selectedTrackId || (network?.edges[0]?.id || 'NDLS-CNB'));
  const [fromJunction, setFromJunction] = useState<string>('NDLS');
  const [toJunction, setToJunction] = useState<string>('CNB');
  const [fromSearchResults, setFromSearchResults] = useState<StationSearchResult[]>([]);
  const [toSearchResults, setToSearchResults] = useState<StationSearchResult[]>([]);

  const { user, isHead } = useAuth();
  const [durationMins, setDurationMins] = useState<number>(180);
  const [failureType, setFailureType] = useState<string>('Track Renewal');
  const [department, setDepartment] = useState<string>(user?.department && user.department !== 'ALL' ? user.department : 'CIVIL');
  const [zone, setZone] = useState<string>(user?.assignedZone && user.assignedZone !== 'ALL' ? user.assignedZone : 'CR');
  const [priority, setPriority] = useState<string>('High');
  const [trackSearch, setTrackSearch] = useState<string>('');

  // 1-2 Days Advance Scheduling State
  const [advancePreset, setAdvancePreset] = useState<number>(1); // Default: Tomorrow (+1 day)
  const [scheduledDate, setScheduledDate] = useState<string>(() => getOffsetDateString(1));

  // Sync scheduled date when preset changes
  const handlePresetSelect = (days: number) => {
    setAdvancePreset(days);
    setScheduledDate(getOffsetDateString(days));
  };

  const handleCustomDateChange = (dateVal: string) => {
    setScheduledDate(dateVal);
    // Calculate difference in days from today
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [y, m, d] = dateVal.split('-').map(Number);
      const chosen = new Date(y, m - 1, d);
      const diffTime = chosen.getTime() - today.getTime();
      const diffDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      setAdvancePreset(diffDays);
    } catch {
      setAdvancePreset(1);
    }
  };

  const scheduledDayName = useMemo(() => getDayNameFromDate(scheduledDate), [scheduledDate]);
  const formattedScheduledDate = useMemo(() => getHumanReadableDate(scheduledDate), [scheduledDate]);

  // Keep state in sync if prop changes
  useEffect(() => {
    if (selectedTrackId) {
      setAssetId(selectedTrackId);
      const parts = selectedTrackId.split('-');
      if (parts.length === 2) {
        setFromJunction(parts[0]);
        setToJunction(parts[1]);
      }
    } else if (network?.edges.length && !assetId) {
      setAssetId(network.edges[0].id);
    }
  }, [selectedTrackId, network]);

  // Autocomplete for custom junctions
  useEffect(() => {
    if (fromJunction.length >= 1) {
      fetch(`${API_BASE_URL}/network/stations/search?q=${encodeURIComponent(fromJunction.trim())}`)
        .then(res => res.json())
        .then(data => setFromSearchResults(data.slice(0, 5)))
        .catch(() => { });
    }
  }, [fromJunction]);

  useEffect(() => {
    if (toJunction.length >= 1) {
      fetch(`${API_BASE_URL}/network/stations/search?q=${encodeURIComponent(toJunction.trim())}`)
        .then(res => res.json())
        .then(data => setToSearchResults(data.slice(0, 5)))
        .catch(() => { });
    }
  }, [toJunction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAssetId = selectionMode === 'junctions'
      ? `${fromJunction.trim().toUpperCase()}-${toJunction.trim().toUpperCase()}`
      : assetId;

    if (!finalAssetId) return;
    await onSubmit(
      finalAssetId,
      durationMins,
      failureType,
      priority,
      scheduledDate,
      scheduledDayName,
      advancePreset,
      department,
      zone,
      selectionMode === 'junctions' ? `${fromJunction.trim().toUpperCase()} ⇄ ${toJunction.trim().toUpperCase()}` : finalAssetId,
      user?.displayName || 'Section Controller',
      user?.role || 'OPERATOR',
      user?.designation || 'Section Dispatch Controller'
    );
    onHide();
  };

  const getNodeName = (id: string) => {
    return network?.nodes.find((n) => n.id === id || n.code === id)?.name || id;
  };

  const getTrackLabel = (edge: TrackEdge) => {
    const src = getNodeName(edge.source);
    const tgt = getNodeName(edge.target);
    return `${src} ⇄ ${tgt} (${edge.id})`;
  };

  const filteredEdges = useMemo(() => {
    const edges = network?.edges || [];
    if (!trackSearch.trim()) return edges.slice(0, 100);
    const q = trackSearch.trim().toLowerCase();
    return edges.filter((e) => {
      const src = getNodeName(e.source).toLowerCase();
      const tgt = getNodeName(e.target).toLowerCase();
      return src.includes(q) || tgt.includes(q) || e.id.toLowerCase().includes(q);
    }).slice(0, 100);
  }, [network, trackSearch]);

  const todayMinDate = useMemo(() => getOffsetDateString(0), []);

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-primary text-white border-0" style={{ backgroundColor: 'var(--gov-blue)' }}>
        <Modal.Title className="d-flex align-items-center gap-2 fs-5">
          <Wrench size={22} />
          Schedule Planned Track Maintenance
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4 custom-scrollbar" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          
          <Alert variant="info" className="d-flex align-items-start gap-2 mb-3 py-2 small">
            <Zap size={18} className="flex-shrink-0 mt-1 text-info" />
            <div>
              <strong>AI Corridor Schedule Optimizer:</strong> Scheduling maintenance evaluates optimal Night Shadow & Daylight windows, computes train conflict reroutes, and issues advance caution orders.
            </div>
          </Alert>

          {/* Target Track Selection Mode Tabs */}
          <Nav variant="pills" className="nav-fill mb-3 bg-light p-1 rounded">
            <Nav.Item>
              <Nav.Link
                active={selectionMode === 'preset'}
                onClick={() => setSelectionMode('preset')}
                className="py-1 extra-small fw-bold"
                style={{ cursor: 'pointer' }}
              >
                Select Trunk Corridor Track
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={selectionMode === 'junctions'}
                onClick={() => setSelectionMode('junctions')}
                className="py-1 extra-small fw-bold"
                style={{ cursor: 'pointer' }}
              >
                Custom Two-Junctions Route (e.g. AK ⇄ NGP)
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {selectionMode === 'preset' ? (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-secondary">Target Railway Corridor Track</Form.Label>
              <InputGroup size="sm" className="mb-2">
                <InputGroup.Text className="bg-white">
                  <Search size={13} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter corridors (e.g. NDLS, Mumbai, Howrah, Akola)..."
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
              </InputGroup>
              <Form.Select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
                className="form-select-lg fs-6"
              >
                {filteredEdges.map((edge) => (
                  <option key={edge.id} value={edge.id}>
                    {getTrackLabel(edge)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          ) : (
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Group className="position-relative">
                  <Form.Label className="fw-semibold small text-secondary">From Junction / Station</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light">
                      <MapPin size={13} className="text-success" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="e.g. AK (Akola), NDLS, MMCT"
                      value={fromJunction}
                      onChange={(e) => setFromJunction(e.target.value)}
                      required
                    />
                  </InputGroup>
                  {fromSearchResults.length > 0 && fromJunction.length < 5 && (
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {fromSearchResults.map(s => (
                        <Badge
                          key={s.code}
                          bg="light"
                          text="dark"
                          className="border extra-small"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setFromJunction(s.code);
                            setFromSearchResults([]);
                          }}
                        >
                          {s.code} ({s.name})
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="position-relative">
                  <Form.Label className="fw-semibold small text-secondary">To Junction / Station</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light">
                      <MapPin size={13} className="text-danger" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="e.g. NGP (Nagpur), CNB, ADI"
                      value={toJunction}
                      onChange={(e) => setToJunction(e.target.value)}
                      required
                    />
                  </InputGroup>
                  {toSearchResults.length > 0 && toJunction.length < 5 && (
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {toSearchResults.map(s => (
                        <Badge
                          key={s.code}
                          bg="light"
                          text="dark"
                          className="border extra-small"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setToJunction(s.code);
                            setToSearchResults([]);
                          }}
                        >
                          {s.code} ({s.name})
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>
          )}

          {/* Section: 1-2 Days Advance Scheduling & Date / Day Selector */}
          <div className="p-3 mb-3 rounded-3 border bg-light bg-opacity-75">
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1.5 fw-bold text-dark small">
                <Calendar size={16} className="text-primary" />
                <span>Scheduled Execution Date & Day (Advance Notice)</span>
              </div>
              <Badge bg="primary" className="extra-small px-2 py-1">
                {advancePreset === 0 ? 'Immediate (0d Notice)' : `${advancePreset} Day${advancePreset > 1 ? 's' : ''} Advance Notice`}
              </Badge>
            </div>

            {/* Quick Presets: Today / Tomorrow (+1d) / Day After (+2d) / +3d */}
            <div className="d-flex flex-wrap gap-1.5 mb-2.5">
              <Button
                type="button"
                variant={advancePreset === 0 ? "primary" : "outline-secondary"}
                size="sm"
                className="extra-small py-1 px-2.5"
                onClick={() => handlePresetSelect(0)}
              >
                Today (Immediate)
              </Button>
              <Button
                type="button"
                variant={advancePreset === 1 ? "primary" : "outline-secondary"}
                size="sm"
                className="extra-small py-1 px-2.5 fw-bold"
                onClick={() => handlePresetSelect(1)}
              >
                ⭐ Tomorrow (+1 Day Notice)
              </Button>
              <Button
                type="button"
                variant={advancePreset === 2 ? "primary" : "outline-secondary"}
                size="sm"
                className="extra-small py-1 px-2.5"
                onClick={() => handlePresetSelect(2)}
              >
                Day After Tomorrow (+2 Days Notice)
              </Button>
              <Button
                type="button"
                variant={advancePreset === 3 ? "primary" : "outline-secondary"}
                size="sm"
                className="extra-small py-1 px-2.5"
                onClick={() => handlePresetSelect(3)}
              >
                +3 Days Notice
              </Button>
            </div>

            {/* Date Picker Input and Live Computed Day Indicator */}
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6">
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white">
                    <Calendar size={13} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    min={todayMinDate}
                    value={scheduledDate}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    required
                    className="extra-small fw-semibold"
                  />
                </InputGroup>
              </div>
              
              <div className="col-12 col-md-6">
                <div className="p-1.5 px-2 bg-white rounded border d-flex align-items-center justify-content-between extra-small">
                  <span className="text-muted">Target Day:</span>
                  <span className="fw-bold text-dark d-flex align-items-center gap-1">
                    <CheckCircle2 size={13} className="text-success" />
                    <span>{scheduledDayName}, {formattedScheduledDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Indian Railways Advance Planning Advisory Note */}
            <div className="extra-small text-muted mt-2 pt-1 border-top" style={{ fontSize: '0.73rem' }}>
              <span className="text-success fw-bold">✓ IR Traffic Circular Protocol:</span> Scheduling 1-2 days in advance pre-queues Caution Orders (T/409) and allows cross-zonal freight trains to be rerouted ahead of time.
            </div>
          </div>

          {/* Department & Operational Jurisdiction (RBAC) */}
          <div className="row g-3 mb-3 p-2.5 rounded-3 border bg-white shadow-xs">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold small text-secondary d-flex align-items-center gap-1">
                  <Building2 size={13} className="text-primary" />
                  <span>Executing Department</span>
                </Form.Label>
                <Form.Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  size="sm"
                  className="fw-bold"
                >
                  <option value="CIVIL">CIVIL — Permanent Way (P-Way / Track)</option>
                  <option value="S&T">S&T — Signal & Telecommunication</option>
                  <option value="OHE">OHE — Traction Power / Overhead Electrification</option>
                  <option value="TRAFFIC">TRAFFIC — Operating & Block Section</option>
                  <option value="MECHANICAL">MECHANICAL — Rolling Stock & C&W</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold small text-secondary d-flex align-items-center gap-1">
                  <ShieldCheck size={13} className="text-success" />
                  <span>Operational Zone / Command</span>
                </Form.Label>
                {isHead ? (
                  <Form.Select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    size="sm"
                    className="fw-bold"
                  >
                    {ZONES.filter(z => z.code !== 'ALL').map(z => (
                      <option key={z.code} value={z.code}>
                        {z.code} — {z.name}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <div className="form-control form-control-sm bg-light fw-bold text-dark d-flex align-items-center justify-content-between">
                    <span>ZONE: {zone} ({user?.sectionName || 'Section Command'})</span>
                    <Badge bg="primary" style={{ fontSize: '0.62rem' }}>Section Locked</Badge>
                  </div>
                )}
              </Form.Group>
            </div>

            {/* Live Visibility & Persistence Tag */}
            <div className="col-12 mt-2 pt-1 border-top extra-small text-muted d-flex flex-wrap align-items-center justify-content-between gap-1">
              <div className="d-flex align-items-center gap-1">
                <UserCheck size={12} className="text-primary" />
                <span>Scheduling Officer: <strong>{user?.displayName || 'Section Controller'}</strong> ({user?.designation || 'Dispatcher'})</span>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.65rem' }}>
                ✓ Stored in Firestore & Visible to {zone} {department} & Main Head
              </span>
            </div>
          </div>

          {/* Maintenance Type & Priority */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold small text-secondary">Maintenance Type</Form.Label>
                <Form.Select
                  value={failureType}
                  onChange={(e) => setFailureType(e.target.value)}
                  size="sm"
                >
                  <option value="Track Renewal">Track Renewal</option>
                  <option value="Overhead Wire Maintenance">OHE Maintenance</option>
                  <option value="Signal Upgrades">Signal System Upgrades</option>
                  <option value="Bridge Maintenance">Bridge Maintenance</option>
                  <option value="Ballast Cleaning">Ballast Cleaning</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold small text-secondary">Priority Level</Form.Label>
                <Form.Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  size="sm"
                >
                  <option value="Critical">Critical Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          {/* Block Duration Slider */}
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="fw-semibold small text-secondary mb-0">
                Block Duration: <span className="text-primary fw-bold">{durationMins / 60} hrs ({durationMins} mins)</span>
              </Form.Label>
              <Badge bg="secondary" className="d-flex align-items-center gap-1">
                <Clock size={12} /> {durationMins}m
              </Badge>
            </div>
            <Form.Range
              min={30}
              max={480}
              step={30}
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
            />
            <div className="d-flex justify-content-between text-muted extra-small" style={{ fontSize: '0.75rem' }}>
              <span>30m</span>
              <span>2h</span>
              <span>4h</span>
              <span>6h</span>
              <span>8h</span>
            </div>
          </Form.Group>

          {/* Quick Preset Scenarios */}
          <div className="bg-light p-2 rounded border">
            <div className="extra-small fw-bold text-uppercase text-muted mb-1.5" style={{ fontSize: '0.72rem' }}>
              Quick Scenarios:
            </div>
            <div className="d-flex flex-wrap gap-1.5">
              <Button
                variant="outline-secondary"
                size="sm"
                className="extra-small py-1"
                onClick={() => {
                  setDurationMins(120);
                  setFailureType('Signal Upgrades');
                  setPriority('Medium');
                }}
              >
                2h Routine Signal
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="extra-small py-1"
                onClick={() => {
                  setDurationMins(240);
                  setFailureType('Track Renewal');
                  setPriority('Critical');
                }}
              >
                4h Major Track Renewal
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="extra-small py-1"
                onClick={() => {
                  setDurationMins(360);
                  setFailureType('Bridge Maintenance');
                  setPriority('High');
                }}
              >
                6h Bridge Overhaul
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 px-4 pb-4">
          <Button variant="light" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} style={{ backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' }}>
            {loading ? 'Optimizing Schedule & Loading Corridor...' : `Schedule Block for ${scheduledDayName} & View Corridor`}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
