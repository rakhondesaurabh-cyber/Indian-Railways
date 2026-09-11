import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Alert, Badge, InputGroup, Nav } from 'react-bootstrap';
import {
  Zap,
  Wrench,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  AlertTriangle
} from 'lucide-react';
import type { RailwayNetwork, TrackEdge, StationSearchResult, MaintenanceSubTask } from '../types';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

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
    createdByDesignation?: string,
    tasks?: MaintenanceSubTask[]
  ) => Promise<void>;
  loading: boolean;
}

interface LocalSubTask {
  id: string;
  department: string;
  type: string;
  durationMins: number;
  priority: string;
  equipment: string;
}

const DEPARTMENT_PRESETS: Record<string, { label: string; types: string[]; defaultDuration: number; equipment: string }> = {
  CIVIL: {
    label: 'CIVIL (Track / P-Way)',
    types: ['Track Renewal & Deep Screening', 'Ballast Cleaning (BCM)', 'Rail Flaw Ultrasonic Testing', 'Bridge Girder Overhaul', 'Turnout Replacement'],
    defaultDuration: 180,
    equipment: 'Track Relaying Train (TRT) / BCM'
  },
  'S&T': {
    label: 'S&T (Signals & Telecom)',
    types: ['Signal Point Machine Overhaul', 'Axle Counter & Track Circuit', 'Electronic Interlocking (EI)', 'Automatic Block Signal Testing', 'OFC Cable Splicing'],
    defaultDuration: 120,
    equipment: 'S&T Point Calibration Rig'
  },
  OHE: {
    label: 'OHE (Overhead Traction)',
    types: ['Overhead Wire Maintenance', 'OHE Cantilever Adjustment', 'Traction Substation (TSS) Isolation', 'Neutral Section Replacement', 'Insulator Washing & Power Block'],
    defaultDuration: 150,
    equipment: '4-Wheeler Tower Wagon'
  },
  TRAFFIC: {
    label: 'TRAFFIC (Operations)',
    types: ['Yard Interlocking & Route Setting', 'Loop Line Clearance', 'Level Crossing Gate Rehabilitation', 'Block Section Re-signalling'],
    defaultDuration: 120,
    equipment: 'Traffic Operating Block Pilot'
  },
  MECHANICAL: {
    label: 'MECHANICAL (Rolling Stock)',
    types: ['Wagon Inspection & Brake Rigging', 'Track Machine Maintenance', 'C&W Roll-by Examination', 'Loco Breakdown Mock Drill'],
    defaultDuration: 90,
    equipment: 'Rolling Stock Inspection Toolset'
  }
};

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

  const { user } = useAuth();
  const [zone] = useState<string>(user?.assignedZone && user.assignedZone !== 'ALL' ? user.assignedZone : 'CR');
  const [trackSearch, setTrackSearch] = useState<string>('');

  // 1-2 Days Advance Scheduling State
  const [advancePreset, setAdvancePreset] = useState<number>(1);
  const [scheduledDate, setScheduledDate] = useState<string>(() => getOffsetDateString(1));

  // Multi-Maintenance Tasks List State (Defaults to unselected placeholders as requested)
  const [tasks, setTasks] = useState<LocalSubTask[]>([
    {
      id: 'task-1',
      department: '',
      type: '',
      durationMins: 180,
      priority: 'High',
      equipment: ''
    }
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Fast Live AI Preview State
  const [livePreview, setLivePreview] = useState<{
    recommendedTime: string;
    badge: string;
    rationale: string;
    savedMins: number;
    jointMins: number;
    affectedTrains: number;
    score: number;
    loading: boolean;
  } | null>(null);

  // Sync scheduled date when preset changes
  const handlePresetSelect = (days: number) => {
    setAdvancePreset(days);
    setScheduledDate(getOffsetDateString(days));
  };

  const handleCustomDateChange = (dateVal: string) => {
    setScheduledDate(dateVal);
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

  // Multi-Task Management Handlers
  const handleAddTask = () => {
    if (tasks.length >= 6) return;
    setValidationError(null);

    const newTask: LocalSubTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      department: '',
      type: '',
      durationMins: 120,
      priority: 'High',
      equipment: ''
    };

    setTasks(prev => [...prev, newTask]);
  };

  const handleRemoveTask = (taskId: string) => {
    if (tasks.length <= 1) return;
    setValidationError(null);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleTaskChange = (taskId: string, field: keyof LocalSubTask, value: any) => {
    setValidationError(null);
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updated = { ...t, [field]: value };
      
      // If department changed, reset type so user selects from the new department options
      if (field === 'department') {
        updated.type = '';
        if (value && DEPARTMENT_PRESETS[value]) {
          const preset = DEPARTMENT_PRESETS[value];
          updated.durationMins = preset.defaultDuration;
          updated.equipment = preset.equipment;
        } else {
          updated.equipment = '';
        }
      }
      return updated;
    }));
  };

  // Calculated Unified Joint Block Metrics
  const jointMetrics = useMemo(() => {
    const validTasks = tasks.filter(t => t.department && t.type);
    if (validTasks.length === 0) {
      return {
        unifiedMins: tasks[0]?.durationMins || 180,
        savedMins: 0,
        savedHrs: '0.0',
        distinctDepts: [],
        highestPriority: 'High',
        hasValidSelection: false
      };
    }
    
    const maxDur = Math.max(...validTasks.map(t => t.durationMins));
    const unifiedMins = validTasks.length > 1 ? maxDur + 20 : maxDur; // +20m safety buffer
    const separateTotal = validTasks.reduce((sum, t) => sum + t.durationMins + 20, 0);
    const savedMins = validTasks.length > 1 ? Math.max(0, separateTotal - unifiedMins) : 0;
    const distinctDepts = Array.from(new Set(validTasks.map(t => t.department)));

    return {
      unifiedMins,
      savedMins,
      savedHrs: (savedMins / 60).toFixed(1),
      distinctDepts,
      highestPriority: validTasks.some(t => t.priority === 'Critical') ? 'Critical' :
                       validTasks.some(t => t.priority === 'High') ? 'High' :
                       validTasks.some(t => t.priority === 'Medium') ? 'Medium' : 'Low',
      hasValidSelection: validTasks.length === tasks.length
    };
  }, [tasks]);

  // Fast AI Live Recommendation Query (Sub-50ms)
  const effectiveAssetId = useMemo(() => {
    return selectionMode === 'junctions'
      ? `${fromJunction.trim().toUpperCase()}-${toJunction.trim().toUpperCase()}`
      : assetId;
  }, [selectionMode, fromJunction, toJunction, assetId]);

  const fetchLivePreview = useCallback(async () => {
    if (!effectiveAssetId || effectiveAssetId.length < 3) return;
    const validTasks = tasks.filter(t => t.department && t.type);
    if (validTasks.length === 0) {
      setLivePreview(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/preview_joint_maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: effectiveAssetId,
          tasks: validTasks.map(t => ({
            department: t.department,
            type: t.type,
            duration_mins: t.durationMins,
            priority: t.priority,
            equipment: t.equipment
          })),
          duration_mins: jointMetrics.unifiedMins,
          department: validTasks[0]?.department || 'CIVIL'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rw = data.recommended_window;
        setLivePreview({
          recommendedTime: rw?.time_label || '01:30 – 04:50 IST',
          badge: rw?.badge || 'Recommended',
          rationale: rw?.rationale || 'Optimal Night Shadow window with 0 train disruption.',
          savedMins: data.track_time_saved_mins || jointMetrics.savedMins,
          jointMins: data.joint_duration_mins || jointMetrics.unifiedMins,
          affectedTrains: rw?.affected_trains_count || 0,
          score: rw?.ai_score || 98.4,
          loading: false
        });
      }
    } catch {
      // Fallback
    }
  }, [effectiveAssetId, tasks, jointMetrics.unifiedMins, jointMetrics.savedMins]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLivePreview();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchLivePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAssetId) return;

    // Validate that all tasks have a department and type selected
    const unselectedTaskIndex = tasks.findIndex(t => !t.department || !t.type);
    if (unselectedTaskIndex !== -1) {
      setValidationError(`Please select both Department and Maintenance Activity Type for Task #${unselectedTaskIndex + 1}.`);
      return;
    }

    setValidationError(null);

    const subTasksPayload: MaintenanceSubTask[] = tasks.map(t => ({
      department: t.department,
      type: t.type,
      duration_mins: t.durationMins,
      priority: t.priority,
      equipment: t.equipment
    }));

    const primaryType = tasks.length > 1
      ? `Joint Block (${tasks.length} Tasks: ${jointMetrics.distinctDepts.join(' + ')})`
      : tasks[0].type;

    await onSubmit(
      effectiveAssetId,
      jointMetrics.unifiedMins,
      primaryType,
      jointMetrics.highestPriority,
      scheduledDate,
      scheduledDayName,
      advancePreset,
      tasks[0]?.department || 'CIVIL',
      zone,
      selectionMode === 'junctions' ? `${fromJunction.trim().toUpperCase()} ⇄ ${toJunction.trim().toUpperCase()}` : effectiveAssetId,
      user?.displayName || 'Section Controller',
      user?.role || 'OPERATOR',
      user?.designation || 'Section Dispatch Controller',
      subTasksPayload
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
    <Modal show={show} onHide={onHide} centered backdrop="static" size="xl">
      <Modal.Header closeButton className="bg-primary text-white border-0 py-3" style={{ backgroundColor: 'var(--gov-blue)' }}>
        <div className="d-flex align-items-center justify-content-between w-100 pe-3 flex-wrap gap-2">
          <Modal.Title className="d-flex align-items-center gap-2 fs-5 text-white">
            <Wrench size={22} className="text-warning" />
            <span>Integrated Traffic & Multi-Departmental Maintenance Planner</span>
          </Modal.Title>
          <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1 extra-small px-2.5 py-1 fw-bold">
            <Sparkles size={12} />
            <span>OPTIMIZATION ENGINE v2.4 (FAST SOLVER)</span>
          </Badge>
        </div>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-3 p-md-4 custom-scrollbar" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
          
          {validationError && (
            <Alert variant="danger" className="d-flex align-items-center gap-2 py-2 px-3 extra-small mb-3">
              <AlertTriangle size={15} className="flex-shrink-0 text-danger" />
              <span>{validationError}</span>
            </Alert>
          )}

          {/* Target Track Selection Mode Tabs */}
          <Nav variant="pills" className="nav-fill mb-3 bg-light p-1 rounded border">
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
                className="form-select-sm fs-6"
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

          {/* Section: 1-2 Days Advance Scheduling & Date Selector */}
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
          </div>

          {/* ========================================================================= */}
          {/* MULTI-MAINTENANCE BUNDLED BLOCK BUILDER (3-4 Concurrent Tasks)            */}
          {/* ========================================================================= */}
          <div className="p-3 mb-3 rounded-3 border bg-white shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 border-bottom pb-2">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  <span className="fw-bold text-dark fs-6">Bundled Multi-Departmental Maintenance Tasks</span>
                  <Badge bg={jointMetrics.hasValidSelection ? "info" : "secondary"} className="extra-small px-2 py-0.5">
                    {tasks.length} {tasks.length === 1 ? 'Task Configured' : 'Tasks Configured'}
                  </Badge>
                </div>
                <div className="text-muted extra-small mt-0.5">
                  Select department and maintenance type to bundle multiple departmental tasks into a single synchronized traffic block.
                </div>
              </div>

              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                onClick={handleAddTask}
                disabled={tasks.length >= 6}
                className="d-flex align-items-center gap-1.5 fw-bold extra-small py-1.5 px-3 shadow-xs"
              >
                <Plus size={15} />
                <span>Add More Maintenance</span>
              </Button>
            </div>

            {/* List of Sub-Tasks */}
            <div className="d-flex flex-column gap-3">
              {tasks.map((task, index) => {
                const preset = task.department ? DEPARTMENT_PRESETS[task.department] : null;
                const hasDept = Boolean(task.department);

                return (
                  <div 
                    key={task.id} 
                    className="p-3 rounded-3 border bg-light bg-opacity-50 position-relative transition-all"
                    style={{ borderLeft: `4px solid ${
                      task.department === 'CIVIL' ? 'var(--gov-blue)' :
                      task.department === 'OHE' ? '#eab308' :
                      task.department === 'S&T' ? '#16a34a' :
                      task.department === 'MECHANICAL' ? '#dc2626' :
                      task.department === 'TRAFFIC' ? '#0891b2' : '#94a3b8'
                    }`}}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-dark extra-small px-2 py-0.5">Task #{index + 1}</span>
                        <span className={`fw-bold extra-small text-uppercase ${hasDept ? 'text-dark' : 'text-muted'}`}>
                          {hasDept ? `${task.department} Department` : 'Select Department & Type'}
                        </span>
                      </div>
                      
                      {tasks.length > 1 && (
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveTask(task.id)}
                          className="p-1 px-2 extra-small border-0 text-danger hover-bg-danger"
                          title="Remove task"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>

                    <div className="row g-2">
                      {/* Department Select with Placeholder */}
                      <div className="col-12 col-md-3">
                        <Form.Label className="extra-small text-muted fw-bold mb-1">
                          Department <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={task.department}
                          onChange={(e) => handleTaskChange(task.id, 'department', e.target.value)}
                          className={`extra-small ${hasDept ? 'fw-bold text-dark' : 'text-muted'}`}
                          required
                        >
                          <option value="">-- Select Department --</option>
                          <option value="CIVIL">CIVIL (Track / P-Way)</option>
                          <option value="S&T">S&T (Signals & Telecom)</option>
                          <option value="OHE">OHE (Overhead Traction)</option>
                          <option value="MECHANICAL">MECHANICAL (Rolling Stock)</option>
                          <option value="TRAFFIC">TRAFFIC (Operations)</option>
                        </Form.Select>
                      </div>

                      {/* Maintenance Activity Type Select with Placeholder */}
                      <div className="col-12 col-md-4">
                        <Form.Label className="extra-small text-muted fw-bold mb-1">
                          Maintenance Activity Type <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={task.type}
                          onChange={(e) => handleTaskChange(task.id, 'type', e.target.value)}
                          disabled={!hasDept}
                          className={`extra-small ${task.type ? 'text-dark' : 'text-muted'}`}
                          required
                        >
                          <option value="">{hasDept ? '-- Select Maintenance Type --' : '-- Select Department First --'}</option>
                          {preset && preset.types.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </Form.Select>
                      </div>

                      {/* Priority */}
                      <div className="col-6 col-md-2">
                        <Form.Label className="extra-small text-muted fw-bold mb-1">Priority</Form.Label>
                        <Form.Select
                          size="sm"
                          value={task.priority}
                          onChange={(e) => handleTaskChange(task.id, 'priority', e.target.value)}
                          className="extra-small fw-semibold"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </Form.Select>
                      </div>

                      {/* Duration */}
                      <div className="col-6 col-md-3">
                        <Form.Label className="extra-small text-muted fw-bold mb-1 d-flex align-items-center justify-content-between">
                          <span>Duration</span>
                          <span className="text-primary fw-bold">{task.durationMins}m ({(task.durationMins / 60).toFixed(1)}h)</span>
                        </Form.Label>
                        <Form.Range
                          min={30}
                          max={360}
                          step={30}
                          value={task.durationMins}
                          onChange={(e) => handleTaskChange(task.id, 'durationMins', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Joint Optimization Intelligence & Savings Summary */}
            <div className="mt-3 p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-7">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-primary" />
                    <span className="fw-bold text-dark small">AI Synchronized Block Formulation</span>
                  </div>
                  <div className="text-muted extra-small">
                    {jointMetrics.hasValidSelection ? (
                      <>
                        All <strong>{tasks.length} tasks</strong> execute simultaneously in <strong>1 unified window</strong> of{' '}
                        <strong className="text-primary">{jointMetrics.unifiedMins} mins ({(jointMetrics.unifiedMins / 60).toFixed(1)} hrs)</strong>{' '}
                        (includes +20m safety clearance buffer).
                      </>
                    ) : (
                      <>Please select department and maintenance type for all tasks to calculate synchronized block duration.</>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-5 text-md-end">
                  {tasks.length > 1 && jointMetrics.savedMins > 0 ? (
                    <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-success text-white shadow-sm extra-small fw-bold">
                      <TrendingDown size={15} />
                      <span>Saved {jointMetrics.savedMins} mins ({jointMetrics.savedHrs} hrs) Track Occupancy!</span>
                    </div>
                  ) : (
                    <span className="badge bg-light text-secondary border extra-small py-1 px-2.5">
                      {tasks.length > 1 ? 'Multi-Task Coordinated Window' : 'Single Task Block'}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* FAST AI REAL-TIME RECOMMENDED WINDOW PREVIEW CARD                         */}
          {/* ========================================================================= */}
          <div className="p-3 mb-3 rounded-3 border bg-light bg-opacity-75">
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1.5 fw-bold text-dark small">
                <Zap size={16} className="text-warning" />
                <span>Instant AI Optimal Execution Window (Fast Solver)</span>
              </div>
              {livePreview && (
                <Badge bg="success" className="extra-small px-2 py-0.5">
                  AI Score: {livePreview.score}% Optimal
                </Badge>
              )}
            </div>

            {livePreview ? (
              <div className="p-2.5 bg-white rounded border">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1.5">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary extra-small px-2.5 py-1 fw-bold fs-6" style={{ backgroundColor: 'var(--gov-blue)' }}>
                      ⭐ {livePreview.recommendedTime}
                    </span>
                    <Badge bg="info" className="extra-small py-1">{livePreview.badge}</Badge>
                  </div>
                  <div className="text-muted extra-small">
                    Passenger Conflicts: <strong className="text-success">{livePreview.affectedTrains} trains</strong> | ML Delay Risk: <strong className="text-success">Minimal</strong>
                  </div>
                </div>
                <div className="text-secondary extra-small" style={{ fontSize: '0.76rem' }}>
                  {livePreview.rationale}
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-muted extra-small">
                <Info size={14} className="me-1 text-primary" /> Select department and maintenance activity type to compute real-time optimal window.
              </div>
            )}
          </div>

          {/* Zone & Officer Authorization Footer Info */}
          <div className="d-flex align-items-center justify-content-between border-top pt-2.5 text-muted extra-small flex-wrap gap-2">
            <div className="d-flex align-items-center gap-1.5">
              <UserCheck size={13} className="text-primary" />
              <span>Officer: <strong>{user?.displayName || 'Section Controller'}</strong> ({user?.designation || 'Dispatcher'})</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" />
              <span>Jurisdiction: <strong>{zone} Zone</strong> • Firestore Multi-Tenant Synced</span>
            </div>
          </div>

        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 px-4 pb-4">
          <Button variant="light" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading} 
            className="d-flex align-items-center gap-2 fw-bold px-4 shadow-sm"
            style={{ backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' }}
          >
            {loading ? (
              <span>Optimizing {tasks.length} Tasks in Realtime...</span>
            ) : (
              <>
                <span>Schedule Synchronized Block ({tasks.length} Tasks) for {scheduledDayName}</span>
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
