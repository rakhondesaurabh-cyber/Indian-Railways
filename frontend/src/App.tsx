import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Navbar, Badge, Spinner, Form, InputGroup } from 'react-bootstrap';
import {
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  ShieldAlert,
  RotateCcw,
  Search,
  Filter,
  Train as TrainIcon,
  MapPin,
  Trash2,
  Plus,
  Wrench,
  Database,
  Navigation,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RailwayMap } from './components/RailwayMap';
import { CorridorSearchWidget } from './components/CorridorSearchWidget';
import { EmergencyModal } from './components/EmergencyModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { CandidatePlansComparison } from './components/CandidatePlansComparison';
import { MaintenanceOptionSelector } from './components/MaintenanceOptionSelector';
import { TrainImpactList } from './components/TrainImpactList';
import { TrainScheduleModal } from './components/TrainScheduleModal';
import { AiDecisionExplanation } from './components/AiDecisionExplanation';
import type {
  RailwayNetwork,
  Train,
  MaintenanceRequest,
  ScheduledBlock,
  OptimizationMetrics,
  OptimizationResponse,
  CandidatePlan,
  BreakdownByMaintenance,
  AffectedTrain,
  UnaffectedTrain,
  CorridorTrain,
  CorridorSearchResult,
  LiveTrainData,
  AiExplanation,
} from './types';

const API_URL = 'http://localhost:8000/api';

function App() {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [network, setNetwork] = useState<RailwayNetwork | null>(null);
  const [networkMode, setNetworkMode] = useState<'major' | 'hdn' | 'full'>('major');
  const [trains, setTrains] = useState<Train[]>([]);
  const [optimizationPlan, setOptimizationPlan] = useState<ScheduledBlock[] | null>(null);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  
  // Multi-Plan & Train Disruption State
  const [candidatePlans, setCandidatePlans] = useState<CandidatePlan[]>([]);
  const [breakdownByMaintenance, setBreakdownByMaintenance] = useState<Record<string, BreakdownByMaintenance>>({});
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [affectedTrains, setAffectedTrains] = useState<AffectedTrain[]>([]);
  const [unaffectedTrains, setUnaffectedTrains] = useState<UnaffectedTrain[]>([]);
  const [corridorTrainsByAsset, setCorridorTrainsByAsset] = useState<Record<string, CorridorTrain[]>>({});
  
  const [loading, setLoading] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [emergencyAssetId, setEmergencyAssetId] = useState<string | null>(null);

  // Operator Two-Junction Corridor Route Focus State
  const [activeCorridor, setActiveCorridor] = useState<CorridorSearchResult | null>(null);
  const [corridorLoading, setCorridorLoading] = useState<boolean>(false);

  // On-Demand Single Train Live Tracking State
  const [searchedLiveTrain, setSearchedLiveTrain] = useState<LiveTrainData | null>(null);
  const [liveTrainSearchQuery, setLiveTrainSearchQuery] = useState<string>('');
  const [liveTrainLoading, setLiveTrainLoading] = useState<boolean>(false);

  // Full Screen Map Mode State
  const [isFullScreenMap, setIsFullScreenMap] = useState<boolean>(false);
  const handleToggleFullScreen = () => setIsFullScreenMap((prev) => !prev);

  // Map & Inspector selections
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);

  // Train Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);
  const [selectedTrainForSchedule, setSelectedTrainForSchedule] = useState<{ number: string; name: string } | null>(null);

  // Search & Filters for Maintenance
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  // Expand/Collapse state for maintenance cards
  const [expandedMaintenanceId, setExpandedMaintenanceId] = useState<string | null>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data (default: major hubs view)
  const fetchData = async (mode: 'major' | 'hdn' | 'full' = networkMode) => {
    try {
      const [maintRes, netRes, trainsRes] = await Promise.all([
        fetch(`${API_URL}/maintenance`),
        fetch(`${API_URL}/network?mode=${mode}`),
        fetch(`${API_URL}/trains?limit=100`),
      ]);

      if (maintRes.ok) {
        const data = await maintRes.json();
        setMaintenanceRequests(data);
      }
      if (netRes.ok) {
        const data = await netRes.json();
        setNetwork(data);
      }
      if (trainsRes.ok) {
        const data = await trainsRes.json();
        setTrains(data);
      }
    } catch (e) {
      console.error('Error fetching initial railway data:', e);
    }
  };

  useEffect(() => {
    fetchData(networkMode);
  }, []);

  const handleToggleNetworkMode = async (mode: 'major' | 'hdn' | 'full') => {
    setNetworkMode(mode);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/network?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setNetwork(data);
      }
    } catch (e) {
      console.error('Error toggling network mode:', e);
    } finally {
      setLoading(false);
    }
  };

  // Search 2-Junction Corridor Route
  const handleSearchCorridor = async (fromCode: string, toCode: string) => {
    setCorridorLoading(true);
    try {
      const res = await fetch(`${API_URL}/network/corridor?from_stn=${encodeURIComponent(fromCode)}&to_stn=${encodeURIComponent(toCode)}`);
      if (res.ok) {
        const data: CorridorSearchResult = await res.json();
        setActiveCorridor(data);
        setSelectedTrackId(data.corridor_id);
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not find corridor between specified stations.');
      }
    } catch (e) {
      console.error('Error searching corridor:', e);
    } finally {
      setCorridorLoading(false);
    }
  };

  const handleClearCorridor = () => {
    setActiveCorridor(null);
    setSelectedTrackId(null);
  };

  // On-Demand Single Train Live Telemetry Search
  const handleTrackLiveTrain = async (trainNumber: string) => {
    if (!trainNumber) return;
    setLiveTrainLoading(true);
    try {
      const cleanNum = trainNumber.trim().split(' ')[0].replace('#', '');
      const res = await fetch(`${API_URL}/trains/${encodeURIComponent(cleanNum)}/live`);
      if (res.ok) {
        const result = await res.json();
        const data: LiveTrainData = result.data ? result.data : result;
        setSearchedLiveTrain(data);
        setLiveTrainSearchQuery(`${data.train.number} - ${data.train.name}`);
      } else {
        alert(`Live tracking information for Train #${trainNumber} not found.`);
      }
    } catch (e) {
      console.error('Error tracking live train:', e);
    } finally {
      setLiveTrainLoading(false);
    }
  };

  const handleClearLiveTrain = () => {
    setSearchedLiveTrain(null);
    setLiveTrainSearchQuery('');
  };

  // Update optimization view based on selected plan
  useEffect(() => {
    if (selectedPlanId && candidatePlans.length > 0) {
      const plan = candidatePlans.find(p => p.id === selectedPlanId);
      if (plan && metrics) {
        setOptimizationPlan(plan.plan);
        setMetrics({
          before: metrics.before,
          after: plan.metrics
        });
        setAffectedTrains(plan.affected_trains || []);
        setUnaffectedTrains(plan.unaffected_trains || []);
        if (plan.corridor_trains_by_asset) {
          setCorridorTrainsByAsset(plan.corridor_trains_by_asset);
        }
      }
    }
  }, [selectedPlanId, candidatePlans]);

  const handleOptimizationResponse = (data: OptimizationResponse) => {
    if (data.candidate_plans) setCandidatePlans(data.candidate_plans);
    if (data.breakdown_by_maintenance) setBreakdownByMaintenance(data.breakdown_by_maintenance);
    if (data.recommended_plan_id) setSelectedPlanId(data.recommended_plan_id);
    if (data.corridor_trains_by_asset) setCorridorTrainsByAsset(data.corridor_trains_by_asset);
    
    setOptimizationPlan(data.plan);
    setMetrics(data.metrics);
    setAffectedTrains(data.affected_trains || []);
    setUnaffectedTrains(data.unaffected_trains || []);
  };

  // Run AI Optimization
  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_delay: 0.35, weight_affected_trains: 0.25 }),
      });
      const data: OptimizationResponse = await res.json();
      handleOptimizationResponse(data);
      setEmergencyActive(false);
      setEmergencyAssetId(null);
    } catch (e) {
      console.error('Optimization error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Emergency Injection
  const handleEmergencySubmit = async (
    assetId: string,
    durationMins: number,
    failureType: string,
    priority: string
  ) => {
    setLoading(true);
    setEmergencyActive(true);
    setEmergencyAssetId(assetId);
    setSelectedTrackId(assetId);

    try {
      const res = await fetch(`${API_URL}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          duration_mins: durationMins,
          type: failureType,
          priority: priority,
        }),
      });
      const data = await res.json();
      handleOptimizationResponse(data);

      const resMaint = await fetch(`${API_URL}/maintenance`);
      if (resMaint.ok) {
        const updatedMaint = await resMaint.json();
        setMaintenanceRequests(updatedMaint);
      }

      // Auto-load and render full corridor track with intermediate stations
      const parts = assetId.split('-');
      if (parts.length === 2) {
        handleSearchCorridor(parts[0], parts[1]);
      }
    } catch (e) {
      console.error('Emergency injection error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Scheduled Maintenance
  const handleMaintenanceSubmit = async (
    assetId: string,
    durationMins: number,
    failureType: string,
    priority: string
  ) => {
    setLoading(true);
    setSelectedTrackId(assetId);

    try {
      const res = await fetch(`${API_URL}/schedule_maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          duration_mins: durationMins,
          type: failureType,
          priority: priority,
        }),
      });
      const data = await res.json();
      handleOptimizationResponse(data);

      const resMaint = await fetch(`${API_URL}/maintenance`);
      if (resMaint.ok) {
        const updatedMaint = await resMaint.json();
        setMaintenanceRequests(updatedMaint);
      }

      // Auto-load and render full corridor track with intermediate stations
      const parts = assetId.split('-');
      if (parts.length === 2) {
        handleSearchCorridor(parts[0], parts[1]);
      }
    } catch (e) {
      console.error('Maintenance scheduling error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Delete individual maintenance request
  const handleDeleteMaintenance = async (maintId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/maintenance/${maintId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceRequests(data.maintenance_requests || []);
        if (!data.maintenance_requests || data.maintenance_requests.length === 0) {
          setOptimizationPlan(null);
          setMetrics(null);
          setCandidatePlans([]);
          setBreakdownByMaintenance({});
          setSelectedPlanId('');
          setAffectedTrains([]);
          setUnaffectedTrains([]);
        } else {
          handleOptimizationResponse(data);
        }
      }
    } catch (err) {
      console.error('Error deleting maintenance request:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear all maintenance requests
  const handleClearAllMaintenance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/maintenance`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMaintenanceRequests([]);
        setOptimizationPlan(null);
        setMetrics(null);
        setCandidatePlans([]);
        setBreakdownByMaintenance({});
        setSelectedPlanId('');
        setAffectedTrains([]);
        setUnaffectedTrains([]);
      }
    } catch (err) {
      console.error('Error clearing maintenance requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset System State
  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceRequests(data.maintenance_requests || []);
        setEmergencyActive(false);
        setEmergencyAssetId(null);
        setSelectedTrackId(null);
        setSelectedStationId(null);
        setActiveCorridor(null);
        setSearchedLiveTrain(null);
        if (data.candidate_plans) setCandidatePlans(data.candidate_plans);
        if (data.recommended_plan_id) setSelectedPlanId(data.recommended_plan_id);
      }
    } catch (e) {
      console.error('Error resetting system:', e);
    } finally {
      setLoading(false);
    }
  };

  // Select a specific candidate option for an individual block
  const handleOptionSelect = (optionId: string, maintenanceId: string) => {
    if (!optimizationPlan || !breakdownByMaintenance[maintenanceId]) return;

    const breakdown = breakdownByMaintenance[maintenanceId];
    const selectedOpt = breakdown.options.find(o => o.id === optionId);
    if (!selectedOpt) return;

    const newPlan = optimizationPlan.map(block => {
      if (block.maintenance_id === maintenanceId) {
        return {
          ...block,
          start_time: selectedOpt.start_time,
          end_time: selectedOpt.end_time,
          affected_trains: selectedOpt.affected_trains,
          affected_train_details: selectedOpt.affected_train_details,
          corridor_trains: selectedOpt.corridor_trains,
          delay_caused: selectedOpt.delay_caused,
          ml_predicted_delay: selectedOpt.ml_predicted_delay,
          ml_risk_level: selectedOpt.ml_risk_level,
          option_id: selectedOpt.id
        };
      }
      return block;
    });

    const planAffectedMap: Record<string, AffectedTrain> = {};
    newPlan.forEach(block => {
      (block.affected_train_details || []).forEach(t => {
        if (!planAffectedMap[t.train_id]) {
          planAffectedMap[t.train_id] = { ...t };
        } else {
          planAffectedMap[t.train_id].delay_mins += t.delay_mins;
        }
      });
    });

    const newAffectedList = Object.values(planAffectedMap);
    const affectedIds = new Set(Object.keys(planAffectedMap));

    const totalDelay = newAffectedList.reduce((sum, t) => sum + t.delay_mins, 0);
    const newMetrics = {
      before: metrics?.before || { trains_affected: 0, delay_mins: 0 },
      after: {
        trains_affected: newAffectedList.length,
        delay_mins: totalDelay
      }
    };

    const newUnaffectedList: UnaffectedTrain[] = trains
      .filter(trn => !affectedIds.has(trn.id))
      .map(trn => {
        const trainNum = trn.train_number || trn.id.replace('TRN-', '');
        const cleanName = trn.train_name || trn.name?.split(' #')[0] || trn.id;
        return {
          train_id: trn.id,
          train_number: trainNum,
          train_name: cleanName,
          name: trn.name || `${cleanName} #${trainNum}`,
          type: trn.type,
          priority: trn.priority,
          origin: trn.origin || (trn.route && trn.route[0]) || '',
          destination: trn.destination || (trn.route && trn.route[trn.route.length - 1]) || '',
          route: trn.route,
          start_time: trn.start_time,
          status: 'On-Time / Unaffected',
          delay_mins: 0
        };
      });

    setOptimizationPlan(newPlan);
    setMetrics(newMetrics);
    setAffectedTrains(newAffectedList);
    setUnaffectedTrains(newUnaffectedList);
    if (selectedPlanId !== 'custom') {
      setSelectedPlanId('custom');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Badge bg="danger">Critical</Badge>;
      case 'High':
        return <Badge bg="warning" text="dark">High</Badge>;
      case 'Medium':
        return <Badge bg="info">Medium</Badge>;
      default:
        return <Badge bg="success">Low</Badge>;
    }
  };

  // Filtered maintenance list
  const filteredMaintenance = useMemo(() => {
    return maintenanceRequests.filter((req) => {
      let assetName = '';
      if (network) {
        const parts = req.asset_id.split('-');
        if (parts.length === 2) {
          const u = network.nodes.find(n => n.id === parts[0] || n.code === parts[0]);
          const v = network.nodes.find(n => n.id === parts[1] || n.code === parts[1]);
          if (u && v) {
            assetName = `${u.name} ${v.name}`;
          }
        }
      }

      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assetName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [maintenanceRequests, searchQuery, priorityFilter, network]);

  // Selected track details for inspection
  const selectedTrackDetails = useMemo(() => {
    if (!selectedTrackId || !network) return null;
    const edge = network.edges.find((e) => e.id === selectedTrackId || e.id === selectedTrackId.split('-').reverse().join('-'));
    if (!edge) return null;
    const src = network.nodes.find((n) => n.id === edge.source || n.code === edge.source);
    const tgt = network.nodes.find((n) => n.id === edge.target || n.code === edge.target);
    const scheduled = optimizationPlan?.find((p) => p.asset_id === edge.id || p.asset_id === `${edge.target}-${edge.source}`);
    const isFailed = emergencyActive && (emergencyAssetId === edge.id || emergencyAssetId === `${edge.target}-${edge.source}`);
    return { edge, src, tgt, scheduled, isFailed };
  }, [selectedTrackId, network, optimizationPlan, emergencyActive, emergencyAssetId]);

  // Selected candidate plan object
  const currentPlan = useMemo(() => {
    return candidatePlans.find((p) => p.id === selectedPlanId) || candidatePlans[0] || null;
  }, [candidatePlans, selectedPlanId]);

  // AI Decision Explanation for active plan/blocks
  const activeAiExplanations = useMemo(() => {
    if (currentPlan && currentPlan.ai_explanations && currentPlan.ai_explanations.length > 0) {
      return currentPlan.ai_explanations;
    }
    if (currentPlan && currentPlan.ai_explanation) {
      return [currentPlan.ai_explanation];
    }
    if (optimizationPlan && optimizationPlan.length > 0) {
      const exps = optimizationPlan
        .map((b) => b.ai_explanation)
        .filter(Boolean) as AiExplanation[];
      if (exps.length > 0) return exps;
    }
    return null;
  }, [currentPlan, optimizationPlan]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Official Railway Header */}
      <Navbar className="navbar-gov px-4 py-2 shadow-sm text-white sticky-top">
        <Container fluid className="px-2">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white p-2 rounded text-primary d-flex align-items-center justify-content-center shadow-sm">
              <Zap size={22} className="text-primary" />
            </div>
            <div>
              <Navbar.Brand href="#home" className="text-white fw-bold mb-0 fs-5 d-flex align-items-center gap-2">
                RailOpt AI <span className="badge bg-warning text-dark fs-6 py-0 px-2 fw-semibold">National Engine</span>
              </Navbar.Brand>
              <div className="d-flex align-items-center gap-2 extra-small text-white-50" style={{ fontSize: '0.75rem' }}>
                <span className="d-flex align-items-center gap-1">
                  <Database size={11} className="text-info" /> {networkMode === 'major' ? 'Major National Hubs' : networkMode === 'hdn' ? 'Trunk HDN Network' : '4,344 Stations'} • 2,810 Active Trains
                </span>
                <span>•</span>
                <span className="text-warning d-flex align-items-center gap-1">
                  <Clock size={11} /> {currentTime || '12:00:00'} IST
                </span>
                <span>•</span>
                <span className="badge bg-success bg-opacity-75">ONLINE (HIGH-EFFICIENCY)</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* On-Demand Single Train Live Tracking Search Box */}
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (liveTrainSearchQuery) handleTrackLiveTrain(liveTrainSearchQuery);
              }}
              className="d-none d-md-flex align-items-center me-2"
            >
              <InputGroup size="sm" style={{ width: '220px' }}>
                <Form.Control
                  placeholder="Track Train (e.g. 12004)"
                  value={liveTrainSearchQuery}
                  onChange={(e) => setLiveTrainSearchQuery(e.target.value)}
                  className="bg-white bg-opacity-25 text-white border-0 extra-small"
                  style={{ fontSize: '0.78rem' }}
                />
                <Button
                  variant="warning"
                  type="submit"
                  disabled={liveTrainLoading || !liveTrainSearchQuery.trim()}
                  className="py-0 px-2 fw-semibold text-dark extra-small d-flex align-items-center gap-1"
                >
                  {liveTrainLoading ? <Spinner size="sm" animation="border" /> : <TrainIcon size={12} />}
                  Track
                </Button>
                {searchedLiveTrain && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="py-0 px-1"
                    onClick={handleClearLiveTrain}
                    title="Clear Live Train Marker"
                  >
                    <X size={12} />
                  </Button>
                )}
              </InputGroup>
            </Form>

            <Button
              variant={isFullScreenMap ? "warning" : "outline-light"}
              size="sm"
              className="d-flex align-items-center gap-1 fw-semibold shadow-sm"
              onClick={handleToggleFullScreen}
              title={isFullScreenMap ? "Exit Full Screen Mode (Esc)" : "Expand Map to Full Screen for National Track Analysis"}
            >
              {isFullScreenMap ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullScreenMap ? "Exit Full Screen" : "Full Screen Map"}
            </Button>

            <Button
              variant="outline-light"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={handleReset}
              disabled={loading}
              title="Reset schedule and clear disruptions"
            >
              <RotateCcw size={14} />
              Reset
            </Button>

            <Button
              variant="danger"
              size="sm"
              className="btn-danger-gov d-flex align-items-center gap-2 shadow-sm"
              onClick={() => setShowEmergencyModal(true)}
              disabled={loading}
            >
              {loading && emergencyActive ? <Spinner size="sm" animation="border" /> : <ShieldAlert size={16} />}
              Inject Track Failure
            </Button>

            <Button
              variant="light"
              size="sm"
              className="d-flex align-items-center gap-2 shadow-sm fw-bold text-primary"
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading && !emergencyActive ? <Spinner size="sm" animation="border" /> : <Settings size={16} />}
              Generate Optimal Plan
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* Main Operations Grid */}
      <Container fluid className={`px-4 py-3 flex-grow-1 ${isFullScreenMap ? 'p-0' : ''}`}>
        <Row className="g-3 h-100">
          {/* Left Panel: Junction Corridor Search & Maintenance Requests */}
          <Col lg={3} md={4} className={`d-flex flex-column gap-3 ${isFullScreenMap ? 'd-none' : ''}`}>
            {/* 1. Junction-to-Junction Corridor Finder */}
            <CorridorSearchWidget
              onSearchCorridor={handleSearchCorridor}
              activeCorridor={activeCorridor}
              onClearCorridor={handleClearCorridor}
              onScheduleMaintenance={(assetId) => {
                 setSelectedTrackId(assetId);
                 setShowMaintenanceModal(true);
              }}
              loading={corridorLoading}
            />

            {/* 2. Pending Maintenance Backlog */}
            <Card className="flex-grow-1 shadow-sm border-0 rounded-2">
              <Card.Header className="d-flex align-items-center justify-content-between bg-white border-bottom border-primary border-2 py-2">
                <div className="d-flex align-items-center">
                  <AlertTriangle size={17} className="me-2 text-warning" />
                  <span className="fw-bold">Maintenance Requests</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Badge bg={maintenanceRequests.length > 0 ? "primary" : "secondary"} pill>
                    {maintenanceRequests.length}
                  </Badge>
                  {maintenanceRequests.length > 0 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="py-0 px-1 d-flex align-items-center extra-small ms-1"
                      style={{ fontSize: '0.7rem' }}
                      onClick={handleClearAllMaintenance}
                      title="Clear All Maintenance Requests"
                      disabled={loading}
                    >
                      <Trash2 size={11} className="me-1" /> Clear
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    className="py-0 px-2 d-flex align-items-center extra-small ms-1"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setShowMaintenanceModal(true)}
                    title="Schedule New Track Maintenance"
                    disabled={loading}
                  >
                    <Plus size={12} className="me-1" /> Add
                  </Button>
                </div>
              </Card.Header>

              <Card.Body className="p-2 d-flex flex-column" style={{ maxHeight: 'calc(100vh - 430px)', overflowY: 'auto' }}>
                {/* Search & Filter Controls */}
                {maintenanceRequests.length > 0 && (
                  <div className="mb-2">
                    <InputGroup size="sm" className="mb-2">
                      <InputGroup.Text className="bg-light border-end-0">
                        <Search size={13} className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search ID, track, or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-start-0 ps-0"
                      />
                    </InputGroup>

                    <div className="d-flex align-items-center gap-1">
                      <Filter size={12} className="text-muted" />
                      <span className="text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                        Priority:
                      </span>
                      {['ALL', 'Critical', 'High', 'Medium'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`btn btn-xs py-0 px-2 rounded-pill ${
                            priorityFilter === p ? 'btn-dark' : 'btn-outline-secondary'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setPriorityFilter(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backlog List */}
                <div className="custom-scrollbar flex-grow-1 overflow-y-auto pe-1">
                  {maintenanceRequests.length === 0 ? (
                    <div className="text-center text-muted p-3 d-flex flex-column align-items-center justify-content-center h-100">
                      <div className="bg-light p-2 rounded-circle mb-2 border shadow-sm">
                        <Wrench size={22} className="text-primary opacity-75" />
                      </div>
                      <div className="fw-bold text-dark small mb-1">No Maintenance Scheduled</div>
                      <p className="text-muted extra-small mb-2" style={{ fontSize: '0.74rem' }}>
                        Schedule maintenance on any corridor to analyze AI timetable dispatch.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="d-flex align-items-center gap-1 extra-small shadow-sm"
                        onClick={() => setShowMaintenanceModal(true)}
                        disabled={loading}
                      >
                        <Plus size={13} /> Schedule Maintenance
                      </Button>
                    </div>
                  ) : filteredMaintenance.length === 0 ? (
                    <div className="text-center text-muted p-4 small">No maintenance requests match filter.</div>
                  ) : (
                    <ul className="list-group list-group-flush gap-2">
                      {filteredMaintenance.map((req) => {
                        const isSelectedTrack = selectedTrackId === req.asset_id;
                        const isExpanded = expandedMaintenanceId === req.id;
                        const isEmg = req.id.startsWith('EMG') || req.id.startsWith('EMERGENCY');
                        const breakdown = breakdownByMaintenance[req.id];
                        const scheduledBlock = optimizationPlan?.find(p => p.maintenance_id === req.id);

                        return (
                          <li
                            key={req.id}
                            className={`list-group-item p-2 rounded border transition-all ${
                              isEmg
                                ? 'border-danger bg-danger bg-opacity-10'
                                : isSelectedTrack
                                ? 'border-primary bg-primary bg-opacity-10'
                                : 'border-light-subtle bg-white'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span 
                                  className="fw-bold text-dark small d-flex align-items-center gap-1"
                                  onClick={() => {
                                    setSelectedTrackId(req.asset_id);
                                    setExpandedMaintenanceId(isExpanded ? null : req.id);
                                    const parts = req.asset_id.split('-');
                                    if (parts.length === 2) {
                                      handleSearchCorridor(parts[0], parts[1]);
                                    }
                                  }}
                                >
                                  {isEmg && <ShieldAlert size={14} className="text-danger" />}
                                  {req.id}
                                </span>
                                <div className="d-flex align-items-center gap-1">
                                  {getPriorityBadge(req.priority)}
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-danger p-0 px-1 border-0"
                                    style={{ lineHeight: 1 }}
                                    onClick={(e) => handleDeleteMaintenance(req.id, e)}
                                    title="Delete this maintenance request"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <div 
                                className="text-dark small fw-medium mb-1"
                                onClick={() => {
                                  setSelectedTrackId(req.asset_id);
                                  setExpandedMaintenanceId(isExpanded ? null : req.id);
                                  const parts = req.asset_id.split('-');
                                  if (parts.length === 2) {
                                    handleSearchCorridor(parts[0], parts[1]);
                                  }
                                }}
                              >
                                {req.type}
                              </div>

                              <div 
                                className="d-flex justify-content-between align-items-center text-muted extra-small" 
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => {
                                  setSelectedTrackId(req.asset_id);
                                  setExpandedMaintenanceId(isExpanded ? null : req.id);
                                  const parts = req.asset_id.split('-');
                                  if (parts.length === 2) {
                                    handleSearchCorridor(parts[0], parts[1]);
                                  }
                                }}
                              >
                                <div className="d-flex align-items-center gap-1 flex-wrap">
                                  <span className="badge bg-secondary bg-opacity-25 text-dark border">
                                    Track: {req.asset_id}
                                  </span>
                                  {(scheduledBlock?.corridor_trains?.length || corridorTrainsByAsset[req.asset_id]?.length) ? (
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                                      <TrainIcon size={10} className="me-1" />
                                      {scheduledBlock?.corridor_trains?.length || corridorTrainsByAsset[req.asset_id]?.length} Trains on Corridor
                                    </span>
                                  ) : null}
                                </div>
                                <span className="d-flex align-items-center">
                                  <Clock size={12} className="me-1" /> {req.duration_mins / 60} hrs ({req.duration_mins}m)
                                </span>
                              </div>
                            </div>
                            
                            {/* Expandable options viewer if AI optimization has run */}
                            {isExpanded && breakdown && scheduledBlock && (
                              <MaintenanceOptionSelector 
                                breakdown={breakdown}
                                selectedOptionId={scheduledBlock.option_id || breakdown.options[0].id}
                                onSelectOption={handleOptionSelect}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Center Panel: Interactive Leaflet Railway Map */}
          <Col lg={isFullScreenMap ? 12 : 6} md={isFullScreenMap ? 12 : 8} className={isFullScreenMap ? 'p-0' : ''}>
            <Card className={`${isFullScreenMap ? 'fullscreen-map-overlay' : 'h-100 shadow-sm border-0 rounded-2'} d-flex flex-column`}>
              {!isFullScreenMap && (
                <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom border-primary border-2 py-2">
                  <div className="d-flex align-items-center gap-2">
                    <TrainIcon size={18} className="text-primary" />
                    <span className="fw-bold">
                      {activeCorridor ? `Corridor: ${activeCorridor.from_station.name} ⇄ ${activeCorridor.to_station.name}` : 'Geographic Railway Graph & Hubs'}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {emergencyActive ? (
                      <Badge bg="danger" className="animate-pulse d-flex align-items-center px-2 py-1">
                        <ShieldAlert size={13} className="me-1" /> TRACK DISRUPTION ACTIVE
                      </Badge>
                    ) : activeCorridor ? (
                      <Badge bg="primary" className="d-flex align-items-center px-2 py-1">
                        <Navigation size={13} className="me-1" /> CORRIDOR INSPECTOR ACTIVE
                      </Badge>
                    ) : optimizationPlan ? (
                      <Badge bg="success" className="d-flex align-items-center px-2 py-1">
                        <CheckCircle size={13} className="me-1" /> AI SCHEDULE OPTIMAL
                      </Badge>
                    ) : (
                      <Badge bg="secondary" className="px-2 py-1">
                        READY FOR OPTIMIZATION
                      </Badge>
                    )}

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="py-0 px-2 d-flex align-items-center gap-1 extra-small"
                      style={{ fontSize: '0.74rem' }}
                      onClick={handleToggleFullScreen}
                      title="Expand Map to Full Screen for National Analysis"
                    >
                      <Maximize2 size={12} />
                      Full Screen
                    </Button>
                  </div>
                </Card.Header>
              )}

              {/* Selected Track Inspector Strip */}
              {selectedTrackDetails && (
                <div className="bg-light border-bottom px-3 py-1 d-flex align-items-center justify-content-between extra-small" style={{ fontSize: '0.8rem' }}>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={13} className="text-primary" />
                    <span>
                      Selected Track: <strong>{selectedTrackDetails.src?.name || selectedTrackDetails.edge.source} ⇄ {selectedTrackDetails.tgt?.name || selectedTrackDetails.edge.target}</strong> (<code>{selectedTrackDetails.edge.id}</code>)
                    </span>
                    <Badge bg="info" className="text-dark">
                      {selectedTrackDetails.edge.travel_time_mins} mins
                    </Badge>
                    {selectedTrackDetails.isFailed && <Badge bg="danger">FAILED</Badge>}
                    {selectedTrackDetails.scheduled && <Badge bg="warning" text="dark">BLOCK SCHEDULED</Badge>}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setShowMaintenanceModal(true)}
                    >
                      Schedule Block
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setShowEmergencyModal(true)}
                    >
                      Fail Track
                    </Button>
                    <button
                      type="button"
                      className="btn-close"
                      style={{ fontSize: '0.65rem' }}
                      onClick={() => setSelectedTrackId(null)}
                    />
                  </div>
                </div>
              )}

              <Card.Body className="p-0 flex-grow-1 position-relative" style={{ height: isFullScreenMap ? 'calc(100vh - 45px)' : 'calc(100vh - 170px)' }}>
                <RailwayMap
                  network={network}
                  maintenanceRequests={maintenanceRequests}
                  optimizationPlan={optimizationPlan}
                  emergencyActive={emergencyActive}
                  emergencyAssetId={emergencyAssetId}
                  selectedStationId={selectedStationId}
                  selectedTrackId={selectedTrackId}
                  networkMode={networkMode}
                  activeCorridor={activeCorridor}
                  searchedLiveTrain={searchedLiveTrain}
                  isFullScreen={isFullScreenMap}
                  onToggleFullScreen={handleToggleFullScreen}
                  onClearActiveCorridor={handleClearCorridor}
                  onClearLiveTrain={handleClearLiveTrain}
                  onToggleNetworkMode={handleToggleNetworkMode}
                  onSelectStation={(stId) => setSelectedStationId(stId)}
                  onSelectTrack={(trId) => setSelectedTrackId(trId)}
                  onInjectEmergencyForTrack={(trId) => {
                    setSelectedTrackId(trId);
                    setShowEmergencyModal(true);
                  }}
                  onScheduleMaintenanceForTrack={(trId) => {
                    setSelectedTrackId(trId);
                    setShowMaintenanceModal(true);
                  }}
                />
              </Card.Body>
            </Card>
          </Col>

          {/* Right Panel: AI Optimization & Impact Analytics */}
          <Col lg={3} md={12} className={isFullScreenMap ? 'd-none' : ''}>
            <Card className="h-100 shadow-sm border-0 rounded-2">
              <Card.Header className="d-flex align-items-center justify-content-between bg-white border-bottom border-primary border-2 py-2">
                <div className="d-flex align-items-center">
                  <CheckCircle size={17} className="me-2 text-success" />
                  <span className="fw-bold">{activeCorridor ? 'Corridor Timetable & Delays' : 'AI Impact & Strategies'}</span>
                </div>
                {metrics && (
                  <Badge bg="success" pill>
                    Ensemble AI Solved
                  </Badge>
                )}
              </Card.Header>

              <Card.Body className="custom-scrollbar p-3" style={{ maxHeight: 'calc(100vh - 170px)', overflowY: 'auto' }}>
                {!metrics && !activeCorridor ? (
                  <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted h-100 py-5">
                    <Activity size={48} className="opacity-25 mb-3 text-primary" />
                    <h6 className="fw-bold text-dark">No Optimization Active</h6>
                    <p className="small mb-3">
                      Search any two junctions on the left or click <strong>"Generate Optimal Plan"</strong> to evaluate conflict-free windows across Indian Railways.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="d-flex align-items-center gap-2 shadow-sm"
                      onClick={handleOptimize}
                      disabled={loading}
                    >
                      {loading ? <Spinner size="sm" animation="border" /> : <Settings size={15} />}
                      Run AI Schedule Optimization
                    </Button>
                  </div>
                ) : (
                  <div>
                    {/* 🤖 AI "Why This Block?" Decision Explanation Card */}
                    {activeAiExplanations && activeAiExplanations.length > 0 && (
                      <AiDecisionExplanation
                        explanations={activeAiExplanations}
                        title="AI DECISION EXPLANATION"
                        badgeLabel={currentPlan?.badge || "Recommended Block"}
                        variant="card"
                      />
                    )}

                    {/* Multi-Plan Strategy Selector (if optimization active) */}
                    {candidatePlans.length > 0 && (
                      <CandidatePlansComparison 
                        plans={candidatePlans}
                        selectedPlanId={selectedPlanId}
                        onSelectPlan={(id) => setSelectedPlanId(id)}
                      />
                    )}

                    {/* Delay Reduction Metric Cards (if optimization active) */}
                    {metrics && (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-uppercase text-secondary fw-bold extra-small" style={{ fontSize: '0.72rem' }}>
                            Optimization Gain (vs Uncoordinated Peak)
                          </span>
                        </div>

                        <Row className="g-2 mb-3">
                          <Col xs={6}>
                            <div className="bg-light p-2 rounded border text-center">
                              <div className="extra-small text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                                Trains Affected
                              </div>
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <span className="text-danger fw-bold fs-6">{metrics.before.trains_affected}</span>
                                <span className="text-muted">➔</span>
                                <span className="text-success fw-bold fs-5">{metrics.after.trains_affected}</span>
                              </div>
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="bg-light p-2 rounded border text-center">
                              <div className="extra-small text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                                Total Delay Mins
                              </div>
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <span className="text-danger fw-bold fs-6">{metrics.before.delay_mins}m</span>
                                <span className="text-muted">➔</span>
                                <span className="text-success fw-bold fs-5">{metrics.after.delay_mins}m</span>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        {/* Chart */}
                        <div className="mb-3 bg-white border rounded p-2" style={{ height: '170px' }}>
                          <div className="extra-small text-muted fw-semibold mb-1" style={{ fontSize: '0.7rem' }}>
                            Cumulative Delay Impact (Minutes)
                          </div>
                          <ResponsiveContainer width="100%" height="85%">
                            <BarChart
                              data={[
                                { name: 'Before AI', delay: metrics.before.delay_mins, fill: '#dc3545' },
                                { name: 'After AI', delay: metrics.after.delay_mins, fill: '#198754' },
                              ]}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                                formatter={(val) => [`${val} mins`, 'Delay']}
                              />
                              <Bar dataKey="delay" radius={[4, 4, 0, 0]} barSize={36} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}

                    {/* Train Operation Impact (Affected & Unaffected Trains Breakdown & Corridor Timetable) */}
                    <TrainImpactList
                      affectedTrains={affectedTrains}
                      unaffectedTrains={unaffectedTrains}
                      selectedTrackId={selectedTrackId}
                      network={network}
                      scheduledBlocks={optimizationPlan}
                      corridorTrainsByAsset={corridorTrainsByAsset}
                      activeCorridor={activeCorridor}
                      onSelectTrack={(trackId) => setSelectedTrackId(trackId)}
                      onClearTrackFilter={() => {
                        setSelectedTrackId(null);
                        setActiveCorridor(null);
                      }}
                      onViewSchedule={(trainNum, trainName) => {
                        setSelectedTrainForSchedule({ number: trainNum, name: trainName });
                        setScheduleModalOpen(true);
                      }}
                      onTrackLiveTrain={handleTrackLiveTrain}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Emergency Track Failure Modal */}
      <EmergencyModal
        show={showEmergencyModal}
        onHide={() => setShowEmergencyModal(false)}
        network={network}
        selectedTrackId={selectedTrackId}
        onSubmit={handleEmergencySubmit}
        loading={loading}
      />

      {/* Planned Maintenance Modal */}
      <MaintenanceModal
        show={showMaintenanceModal}
        onHide={() => setShowMaintenanceModal(false)}
        network={network}
        selectedTrackId={selectedTrackId}
        onSubmit={handleMaintenanceSubmit}
        loading={loading}
      />

      {/* Train Schedule Modal */}
      <TrainScheduleModal
        show={scheduleModalOpen}
        onHide={() => {
          setScheduleModalOpen(false);
          setSelectedTrainForSchedule(null);
        }}
        trainNumber={selectedTrainForSchedule?.number || null}
        trainName={selectedTrainForSchedule?.name}
      />
    </div>
  );
}

export default App;
