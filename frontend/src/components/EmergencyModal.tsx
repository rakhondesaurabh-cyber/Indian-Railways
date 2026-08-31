import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge, InputGroup, Nav } from 'react-bootstrap';
import { AlertTriangle, ShieldAlert, Clock, Search, MapPin } from 'lucide-react';
import type { RailwayNetwork, TrackEdge, StationSearchResult } from '../types';
import { API_BASE_URL } from '../config';

interface EmergencyModalProps {
  show: boolean;
  onHide: () => void;
  network: RailwayNetwork | null;
  selectedTrackId?: string | null;
  onSubmit: (assetId: string, durationMins: number, failureType: string, priority: string) => Promise<void>;
  loading: boolean;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
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

  const [durationMins, setDurationMins] = useState<number>(180);
  const [failureType, setFailureType] = useState<string>('Track Failure');
  const [priority, setPriority] = useState<string>('Critical');
  const [trackSearch, setTrackSearch] = useState<string>('');

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
    await onSubmit(finalAssetId, durationMins, failureType, priority);
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

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-danger text-white border-0">
        <Modal.Title className="d-flex align-items-center gap-2 fs-5">
          <ShieldAlert size={22} />
          Inject Emergency Track Failure / Block
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <Alert variant="warning" className="d-flex align-items-start gap-2 mb-3 py-2 small">
            <AlertTriangle size={18} className="flex-shrink-0 mt-1 text-warning" />
            <div>
              <strong>Live Track Disruption Simulation:</strong> Injecting an unscheduled emergency will immediately highlight the corridor and its intermediate stations on the map, and trigger the AI Dispatch Engine in real-time.
            </div>
          </Alert>

          {/* Mode Tabs */}
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
              <Form.Label className="fw-semibold small text-secondary">Target Railway Track Segment</Form.Label>
              <InputGroup size="sm" className="mb-2">
                <InputGroup.Text className="bg-white">
                  <Search size={13} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter corridors (e.g. NDLS, CNB, HWH, Akola)..."
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
                          onClick={() => setFromJunction(s.code)}
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
                          onClick={() => setToJunction(s.code)}
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

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold small text-secondary">Disruption Event Type</Form.Label>
                <Form.Select
                  value={failureType}
                  onChange={(e) => setFailureType(e.target.value)}
                >
                  <option value="Track Failure">Track Fracture / Failure</option>
                  <option value="Signal Interlocking Collapse">Signal Interlocking Failure</option>
                  <option value="Overhead Wire Snag">OHE Power Snag</option>
                  <option value="Landslide / Waterlogging">Landslide / Flood Disruption</option>
                  <option value="Derailment Investigation">Emergency Investigation</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold small text-secondary">Emergency Severity</Form.Label>
                <Form.Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Critical">Critical (Immediate Halt)</option>
                  <option value="High">High (Speed Restriction)</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="fw-semibold small text-secondary mb-0">
                Estimated Restoration Time: <span className="text-danger fw-bold">{durationMins / 60} hrs ({durationMins} mins)</span>
              </Form.Label>
              <Badge bg="danger" className="d-flex align-items-center gap-1">
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

          {/* Quick Preset Buttons */}
          <div className="bg-light p-2 rounded border">
            <div className="extra-small fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.75rem' }}>
              Emergency Presets:
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Button
                variant="outline-danger"
                size="sm"
                className="extra-small py-1"
                onClick={() => {
                  setDurationMins(90);
                  setFailureType('Signal Interlocking Collapse');
                  setPriority('High');
                }}
              >
                90m Signal Trip
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="extra-small py-1"
                onClick={() => {
                  setDurationMins(240);
                  setFailureType('Track Failure');
                  setPriority('Critical');
                }}
              >
                4h Rail Fracture
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="extra-small py-1"
                onClick={() => {
                  setDurationMins(360);
                  setFailureType('Overhead Wire Snag');
                  setPriority('Critical');
                }}
              >
                6h OHE Power Snag
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 px-4 pb-4">
          <Button variant="light" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? 'Simulating AI Dispatch...' : 'Inject Failure & Render Corridor on Map'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
