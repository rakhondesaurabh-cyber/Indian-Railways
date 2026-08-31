import React, { useState, useMemo } from 'react';
import { Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import {
  Train as TrainIcon,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { AffectedTrain, UnaffectedTrain, CorridorTrain, RailwayNetwork, ScheduledBlock, CorridorSearchResult } from '../types';

interface Props {
  affectedTrains: AffectedTrain[];
  unaffectedTrains: UnaffectedTrain[];
  selectedTrackId?: string | null;
  network?: RailwayNetwork | null;
  scheduledBlocks?: ScheduledBlock[] | null;
  corridorTrainsByAsset?: Record<string, CorridorTrain[]>;
  activeCorridor?: CorridorSearchResult | null;
  onSelectTrack?: (trackId: string) => void;
  onClearTrackFilter?: () => void;
  onViewSchedule?: (trainNumber: string, trainName: string) => void;
  onTrackLiveTrain?: (trainNumber: string) => void;
}

export const TrainImpactList: React.FC<Props> = ({
  affectedTrains = [],
  unaffectedTrains = [],
  selectedTrackId,
  network,
  scheduledBlocks,
  corridorTrainsByAsset,
  activeCorridor,
  onSelectTrack,
  onClearTrackFilter,
  onViewSchedule,
  onTrackLiveTrain,
}) => {
  const [activeTab, setActiveTab] = useState<'corridor' | 'all' | 'affected' | 'unaffected'>(
    activeCorridor || selectedTrackId ? 'corridor' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Sync activeTab when activeCorridor or selectedTrackId changes
  React.useEffect(() => {
    if (activeCorridor || selectedTrackId) {
      setActiveTab('corridor');
    }
  }, [activeCorridor, selectedTrackId]);

  const totalTrains = affectedTrains.length + unaffectedTrains.length;

  // Resolve track human name
  const trackInfo = useMemo(() => {
    if (!selectedTrackId || !network) return null;
    const edge = network.edges.find(
      (e) => e.id === selectedTrackId || e.id === selectedTrackId.split('-').reverse().join('-')
    );
    if (!edge) return null;
    const src = network.nodes.find((n) => n.id === edge.source);
    const tgt = network.nodes.find((n) => n.id === edge.target);
    const scheduled = scheduledBlocks?.find(
      (b) => b.asset_id === edge.id || b.asset_id === `${edge.target}-${edge.source}`
    );
    return { edge, src, tgt, scheduled };
  }, [selectedTrackId, network, scheduledBlocks]);

  // Extract corridor trains for the selected track or active searched corridor
  const corridorTrains: CorridorTrain[] = useMemo(() => {
    // 1. If active corridor searched, use its train list
    if (activeCorridor && activeCorridor.trains && activeCorridor.trains.length > 0) {
      return activeCorridor.trains.map((t) => ({
        train_id: t.train_id,
        train_number: t.train_number,
        train_name: t.train_name,
        name: t.name,
        type: t.type,
        priority: t.priority,
        asset_id: activeCorridor.corridor_id,
        start_cross: t.departure_time || '',
        end_cross: t.arrival_time || '',
        start_cross_time: t.departure_time || 'Scheduled',
        end_cross_time: t.arrival_time || '',
        is_delayed: t.delay_mins > 0,
        delay_mins: t.delay_mins,
        status_label: t.status || 'On-Time',
        status_code: t.delay_mins > 0 ? 'delayed' : 'before_block',
        origin: t.origin,
        destination: t.destination,
        route: t.subroute || [],
      }));
    }

    if (!selectedTrackId) return [];
    
    // Check if scheduled block has specific corridor trains
    const scheduled = scheduledBlocks?.find(
      (b) => b.asset_id === selectedTrackId || b.asset_id === selectedTrackId.split('-').reverse().join('-')
    );
    if (scheduled?.corridor_trains && scheduled.corridor_trains.length > 0) {
      return scheduled.corridor_trains;
    }

    // Check precomputed corridor trains by asset
    if (corridorTrainsByAsset && selectedTrackId) {
      if (corridorTrainsByAsset[selectedTrackId]) return corridorTrainsByAsset[selectedTrackId];
      const revId = selectedTrackId.split('-').reverse().join('-');
      if (corridorTrainsByAsset[revId]) return corridorTrainsByAsset[revId];
      const matchKey = Object.keys(corridorTrainsByAsset).find(
        (k) => k.toUpperCase() === selectedTrackId.toUpperCase() || k.toUpperCase() === revId.toUpperCase()
      );
      if (matchKey && corridorTrainsByAsset[matchKey]) return corridorTrainsByAsset[matchKey];
    }

    // Fallback: derive from affected and unaffected trains matching route
    const parts = selectedTrackId.split('-');
    if (parts.length === 2) {
      const [u, v] = parts;
      const delayed = affectedTrains
        .filter((t) => t.route && (t.route.includes(u) && t.route.includes(v)))
        .map((t) => ({
          train_id: t.train_id,
          train_number: t.train_number,
          train_name: t.train_name,
          name: t.name,
          type: t.type,
          priority: t.priority,
          asset_id: selectedTrackId,
          start_cross: t.start_cross || '',
          end_cross: t.end_cross || '',
          start_cross_time: t.start_cross ? new Date(t.start_cross).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled',
          end_cross_time: t.end_cross ? new Date(t.end_cross).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          is_delayed: true,
          delay_mins: t.delay_mins,
          status_label: `Delayed (+${t.delay_mins}m)`,
          status_code: 'delayed',
          origin: t.origin,
          destination: t.destination,
          route: t.route || [],
        }));

      const ontime = unaffectedTrains
        .filter((t) => t.route && (t.route.includes(u) && t.route.includes(v)))
        .map((t) => ({
          train_id: t.train_id,
          train_number: t.train_number,
          train_name: t.train_name,
          name: t.name,
          type: t.type,
          priority: t.priority,
          asset_id: selectedTrackId,
          start_cross: t.start_time || '',
          end_cross: '',
          start_cross_time: t.start_time ? new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On-Time',
          end_cross_time: '',
          is_delayed: false,
          delay_mins: 0,
          status_label: 'On-Time (Conflict-Free)',
          status_code: 'before_block',
          origin: t.origin,
          destination: t.destination,
          route: t.route || [],
        }));

      return [...delayed, ...ontime];
    }

    return [];
  }, [selectedTrackId, scheduledBlocks, corridorTrainsByAsset, affectedTrains, unaffectedTrains]);

  // Filters for corridor trains
  const filteredCorridorTrains = useMemo(() => {
    return corridorTrains.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.train_number.toLowerCase().includes(q) ||
        t.train_name.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.origin && t.origin.toLowerCase().includes(q)) ||
        (t.destination && t.destination.toLowerCase().includes(q)) ||
        (t.route && t.route.some((r) => r.toLowerCase().includes(q)));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [corridorTrains, searchQuery, priorityFilter]);

  const filteredAffected = useMemo(() => {
    return affectedTrains.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.train_number.toLowerCase().includes(q) ||
        t.train_name.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.origin && t.origin.toLowerCase().includes(q)) ||
        (t.destination && t.destination.toLowerCase().includes(q)) ||
        (t.asset_id && t.asset_id.toLowerCase().includes(q)) ||
        (t.route && t.route.some((r) => r.toLowerCase().includes(q)));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [affectedTrains, searchQuery, priorityFilter]);

  const filteredUnaffected = useMemo(() => {
    return unaffectedTrains.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.train_number.toLowerCase().includes(q) ||
        t.train_name.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.origin && t.origin.toLowerCase().includes(q)) ||
        (t.destination && t.destination.toLowerCase().includes(q)) ||
        (t.route && t.route.some((r) => r.toLowerCase().includes(q)));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [unaffectedTrains, searchQuery, priorityFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <Badge bg="danger" className="extra-small px-1">
            High Priority
          </Badge>
        );
      case 'Medium':
        return (
          <Badge bg="warning" text="dark" className="extra-small px-1">
            Medium
          </Badge>
        );
      case 'Low':
        return (
          <Badge bg="secondary" className="extra-small px-1">
            Low
          </Badge>
        );
      default:
        return (
          <Badge bg="info" className="extra-small px-1">
            {priority}
          </Badge>
        );
    }
  };

  return (
    <div className="mt-3 pt-3 border-top">
      {/* Track Corridor Focus Banner if a track is active */}
      {trackInfo && (
        <Alert variant="primary" className="p-2 mb-2 border border-primary border-opacity-50 shadow-sm">
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <MapPin size={14} className="text-primary flex-shrink-0" />
              <span className="fw-bold text-dark extra-small" style={{ fontSize: '0.78rem' }}>
                Corridor: {trackInfo.src?.name} ⇄ {trackInfo.tgt?.name} ({trackInfo.edge.id})
              </span>
            </div>
            {onClearTrackFilter && (
              <button
                type="button"
                className="btn btn-xs btn-outline-secondary p-0 px-1 border-0"
                onClick={onClearTrackFilter}
                title="Show all network tracks"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="d-flex align-items-center gap-2 mt-1 extra-small flex-wrap" style={{ fontSize: '0.72rem' }}>
            <span className="badge bg-primary text-white">
              {corridorTrains.length} Corridor Trains
            </span>
            <span className={corridorTrains.filter(t => t.is_delayed).length > 0 ? "badge bg-danger text-white" : "badge bg-success text-white"}>
              {corridorTrains.filter(t => t.is_delayed).length} Delayed / {corridorTrains.filter(t => !t.is_delayed).length} On-Time
            </span>
            {trackInfo.scheduled?.ai_explanation && (
              <span className="badge bg-dark text-info border border-info border-opacity-50 d-flex align-items-center gap-1">
                🤖 AI Score: {trackInfo.scheduled.ai_explanation.optimization_score.toFixed(1)}/100
              </span>
            )}
            {trackInfo.scheduled && (
              <span className="text-muted ms-auto">
                Block: {new Date(trackInfo.scheduled.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(trackInfo.scheduled.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </Alert>
      )}

      {/* Section Header */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-1">
          <TrainIcon size={16} className="text-primary" />
          <span className="fw-bold text-dark small">Train Schedule Impact</span>
        </div>
        <Badge bg="dark" pill className="extra-small">
          {totalTrains} Network Trains
        </Badge>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-1 mb-2 p-1 bg-light rounded border flex-wrap">
        {selectedTrackId && corridorTrains.length > 0 && (
          <button
            type="button"
            className={`btn btn-xs flex-grow-1 py-1 rounded d-flex align-items-center justify-content-center gap-1 ${
              activeTab === 'corridor' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-light text-primary fw-semibold'
            }`}
            style={{ fontSize: '0.72rem' }}
            onClick={() => setActiveTab('corridor')}
          >
            <MapPin size={11} />
            Corridor ({corridorTrains.length})
          </button>
        )}

        <button
          type="button"
          className={`btn btn-xs flex-grow-1 py-1 rounded ${
            activeTab === 'all' ? 'btn-white bg-white fw-bold shadow-sm text-dark' : 'btn-light text-muted'
          }`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => setActiveTab('all')}
        >
          All Network ({totalTrains})
        </button>

        <button
          type="button"
          className={`btn btn-xs flex-grow-1 py-1 rounded d-flex align-items-center justify-content-center gap-1 ${
            activeTab === 'affected'
              ? 'btn-danger text-white fw-bold shadow-sm'
              : 'btn-light text-danger fw-semibold'
          }`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => setActiveTab('affected')}
        >
          <AlertTriangle size={11} />
          Delayed ({affectedTrains.length})
        </button>

        <button
          type="button"
          className={`btn btn-xs flex-grow-1 py-1 rounded d-flex align-items-center justify-content-center gap-1 ${
            activeTab === 'unaffected'
              ? 'btn-success text-white fw-bold shadow-sm'
              : 'btn-light text-success fw-semibold'
          }`}
          style={{ fontSize: '0.72rem' }}
          onClick={() => setActiveTab('unaffected')}
        >
          <CheckCircle size={11} />
          On-Time ({unaffectedTrains.length})
        </button>
      </div>

      {/* Search & Priority Controls */}
      <div className="mb-2">
        <InputGroup size="sm" className="mb-1">
          <InputGroup.Text className="bg-white border-end-0 py-0 px-2">
            <Search size={12} className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            size="sm"
            placeholder="Search train no, name, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-start-0 ps-1 extra-small"
            style={{ fontSize: '0.75rem' }}
          />
        </InputGroup>

        <div className="d-flex align-items-center gap-1">
          <Filter size={11} className="text-muted" />
          <span className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>
            Priority:
          </span>
          {['ALL', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-xs py-0 px-2 rounded-pill ${
                priorityFilter === p ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '0.68rem' }}
              onClick={() => setPriorityFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Train List Display */}
      <div className="d-flex flex-column gap-2">
        {/* Corridor Trains Tab (Specific to the chosen maintenance corridor) */}
        {activeTab === 'corridor' && (
          <>
            <div className="d-flex align-items-center justify-content-between extra-small text-muted mb-1">
              <span>Timetable for <strong>{selectedTrackId}</strong> corridor:</span>
              <span>{filteredCorridorTrains.length} trains</span>
            </div>

            {filteredCorridorTrains.map((t) => (
              <div
                key={t.train_id}
                className="p-2 rounded border bg-white shadow-sm transition-all"
                style={{
                  borderLeft: t.is_delayed ? '4px solid #dc3545' : '4px solid #198754',
                }}
              >
                {/* Train Header */}
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    <button 
                      className="btn btn-dark text-white fw-bold px-2 py-0 extra-small rounded-pill d-flex align-items-center gap-1"
                      onClick={() => onViewSchedule && onViewSchedule(t.train_number, t.train_name)}
                      title="View Live Schedule"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <Clock size={10} /> #{t.train_number}
                    </button>
                    {onTrackLiveTrain && (
                      <button
                        className="btn btn-outline-primary fw-bold px-2 py-0 extra-small rounded-pill d-flex align-items-center gap-1"
                        onClick={() => onTrackLiveTrain(t.train_number)}
                        title="Track Live Train Position on Map"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <TrainIcon size={10} /> Track Live
                      </button>
                    )}
                    <span className="fw-bold text-dark small">{t.train_name}</span>
                  </div>
                  {t.is_delayed ? (
                    <Badge bg="danger" className="d-flex align-items-center gap-1 extra-small px-1">
                      <Clock size={10} /> +{t.delay_mins}m Delay
                    </Badge>
                  ) : (
                    <Badge bg="success" className="d-flex align-items-center gap-1 extra-small px-1">
                      <CheckCircle size={10} /> On-Time
                    </Badge>
                  )}
                </div>

                {/* Corridor Timetable & Status */}
                <div className="d-flex flex-wrap align-items-center gap-1 mb-1 extra-small">
                  {getPriorityBadge(t.priority)}
                  <span className="badge bg-light text-secondary border">{t.type}</span>
                  <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <Clock size={10} /> Crossing: {t.start_cross_time}{t.end_cross_time ? ` - ${t.end_cross_time}` : ''}
                  </span>
                  <span className={`badge ${t.is_delayed ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'}`}>
                    {t.status_label}
                  </span>
                </div>

                {/* Route */}
                {t.route && t.route.length > 0 && (
                  <div className="d-flex align-items-center text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                    <span className="fw-semibold text-dark">{t.origin || t.route[0]}</span>
                    <ArrowRight size={11} className={t.is_delayed ? "mx-1 text-danger" : "mx-1 text-success"} />
                    <span className="fw-semibold text-dark">{t.destination || t.route[t.route.length - 1]}</span>
                    <span className="ms-auto text-muted fst-italic">
                      ({t.route.join(' ➔ ')})
                    </span>
                  </div>
                )}
              </div>
            ))}

            {filteredCorridorTrains.length === 0 && (
              <div className="p-3 text-center text-muted small">
                No trains match filter on this corridor.
              </div>
            )}
          </>
        )}

        {/* Affected Trains Tab */}
        {(activeTab === 'all' || activeTab === 'affected') && (
          <>
            {activeTab === 'all' && filteredAffected.length > 0 && (
              <div className="d-flex align-items-center justify-content-between mt-1 text-danger fw-bold extra-small">
                <span className="d-flex align-items-center gap-1">
                  <ShieldAlert size={12} /> Affected / Delayed Trains ({filteredAffected.length})
                </span>
              </div>
            )}

            {filteredAffected.map((t) => (
              <div
                key={t.train_id}
                className="p-2 rounded border border-danger bg-white shadow-sm transition-all"
                style={{ borderLeft: '4px solid #dc3545' }}
              >
                {/* Train Header: Number & Name */}
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    <button 
                      className="btn btn-dark text-white fw-bold px-2 py-0 extra-small rounded-pill d-flex align-items-center gap-1"
                      onClick={() => onViewSchedule && onViewSchedule(t.train_number, t.train_name)}
                      title="View Live Schedule"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <Clock size={10} /> #{t.train_number}
                    </button>
                    {onTrackLiveTrain && (
                      <button
                        className="btn btn-outline-danger fw-bold px-2 py-0 extra-small rounded-pill d-flex align-items-center gap-1"
                        onClick={() => onTrackLiveTrain(t.train_number)}
                        title="Track Live Train on Map"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <TrainIcon size={10} /> Track Live
                      </button>
                    )}
                    <span className="fw-bold text-dark small">{t.train_name}</span>
                  </div>
                  <Badge bg="danger" className="d-flex align-items-center gap-1 extra-small px-1">
                    <Clock size={10} /> +{t.delay_mins}m Delay
                  </Badge>
                </div>

                {/* Priority & Type & Block Info */}
                <div className="d-flex flex-wrap align-items-center gap-1 mb-1 extra-small">
                  {getPriorityBadge(t.priority)}
                  <span className="badge bg-light text-secondary border">{t.type}</span>
                  {t.asset_id && (
                    <button
                      type="button"
                      className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1 p-1"
                      onClick={() => onSelectTrack && onSelectTrack(t.asset_id.split(',')[0].trim())}
                      title="Inspect conflicting track segment on map"
                      style={{ cursor: 'pointer' }}
                    >
                      <MapPin size={10} /> Block on {t.asset_id}
                    </button>
                  )}
                  {t.maintenance_id && (
                    <span className="badge bg-secondary bg-opacity-10 text-dark border">
                      Req: {t.maintenance_id}
                    </span>
                  )}
                </div>

                {/* Route Information */}
                {t.route && t.route.length > 0 && (
                  <div className="d-flex align-items-center text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                    <span className="fw-semibold text-dark">{t.origin || t.route[0]}</span>
                    <ArrowRight size={11} className="mx-1 text-danger" />
                    <span className="fw-semibold text-dark">{t.destination || t.route[t.route.length - 1]}</span>
                    <span className="ms-auto text-muted fst-italic">
                      ({t.route.join(' ➔ ')})
                    </span>
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'affected' && filteredAffected.length === 0 && (
              <div className="p-3 text-center bg-success bg-opacity-10 border border-success border-opacity-25 rounded my-2">
                <ShieldCheck size={28} className="text-success mb-1" />
                <div className="fw-bold text-success small">Zero Trains Delayed!</div>
                <div className="text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                  This maintenance window operates conflict-free across the network.
                </div>
              </div>
            )}
          </>
        )}

        {/* Unaffected Trains Tab */}
        {(activeTab === 'all' || activeTab === 'unaffected') && (
          <>
            {activeTab === 'all' && filteredUnaffected.length > 0 && (
              <div className="d-flex align-items-center justify-content-between mt-2 text-success fw-bold extra-small">
                <span className="d-flex align-items-center gap-1">
                  <ShieldCheck size={12} /> On-Time / Unaffected Trains ({filteredUnaffected.length})
                </span>
              </div>
            )}

            {filteredUnaffected.map((t) => (
              <div
                key={t.train_id}
                className="p-2 rounded border bg-white shadow-sm transition-all"
                style={{ borderLeft: '4px solid #198754' }}
              >
                {/* Train Header: Number & Name */}
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    <button 
                      className="btn btn-secondary text-white fw-bold px-2 py-0 extra-small rounded-pill d-flex align-items-center gap-1"
                      onClick={() => onViewSchedule && onViewSchedule(t.train_number, t.train_name)}
                      title="View Live Schedule"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <Clock size={10} /> #{t.train_number}
                    </button>
                    {onTrackLiveTrain && (
                      <button
                        className="btn btn-outline-success fw-bold px-2 py-0 extra-small rounded-pill d-flex align-items-center gap-1"
                        onClick={() => onTrackLiveTrain(t.train_number)}
                        title="Track Live Train on Map"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <TrainIcon size={10} /> Track Live
                      </button>
                    )}
                    <span className="fw-bold text-dark small">{t.train_name}</span>
                  </div>
                  <Badge bg="success" className="d-flex align-items-center gap-1 extra-small px-1">
                    <CheckCircle size={10} /> On-Time
                  </Badge>
                </div>

                {/* Priority & Type */}
                <div className="d-flex flex-wrap align-items-center gap-1 mb-1 extra-small">
                  {getPriorityBadge(t.priority)}
                  <span className="badge bg-light text-secondary border">{t.type}</span>
                  {t.start_time && (
                    <span className="badge bg-light text-muted border d-flex align-items-center gap-1">
                      <Clock size={10} />
                      Dep: {new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                    Clear Corridor
                  </span>
                </div>

                {/* Route Information */}
                {t.route && t.route.length > 0 && (
                  <div className="d-flex align-items-center text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                    <span className="fw-semibold text-dark">{t.origin || t.route[0]}</span>
                    <ArrowRight size={11} className="mx-1 text-success" />
                    <span className="fw-semibold text-dark">{t.destination || t.route[t.route.length - 1]}</span>
                    <span className="ms-auto text-muted fst-italic">
                      ({t.route.join(' ➔ ')})
                    </span>
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'unaffected' && filteredUnaffected.length === 0 && (
              <div className="p-3 text-center text-muted small">
                No unaffected trains matching filters.
              </div>
            )}
          </>
        )}

        {/* Global Empty Search State */}
        {filteredAffected.length === 0 && filteredUnaffected.length === 0 && filteredCorridorTrains.length === 0 && (
          <div className="p-3 text-center text-muted small">
            No trains found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
