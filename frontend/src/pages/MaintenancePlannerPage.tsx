import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import {
  Settings,
  Plus,
  Trash2,
  Clock,
  Wrench,
  Activity,
  Filter,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Database,
  Building2,
  Globe2,
  User,
  ShieldCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CandidatePlansComparison } from '../components/CandidatePlansComparison';
import { MaintenanceOptionSelector } from '../components/MaintenanceOptionSelector';
import { AiDecisionExplanation } from '../components/AiDecisionExplanation';
import { useRailway } from '../context/RailwayContext';
import { useAuth, ZONES } from '../context/AuthContext';

export const MaintenancePlannerPage: React.FC = () => {
  const {
    network,
    maintenanceRequests,
    optimizationPlan,
    metrics,
    candidatePlans,
    breakdownByMaintenance,
    selectedPlanId,
    currentPlan,
    activeAiExplanations,
    loading,
    setSelectedPlanId,
    setSelectedTrackId,
    setShowMaintenanceModal,
    handleOptimize,
    handleDeleteMaintenance,
    handleClearAllMaintenance,
    handleOptionSelect,
  } = useRailway();

  const { user, isHead } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'MY_SECTION' | 'ALL_SECTIONS'>('MY_SECTION');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [optimizingBlockId, setOptimizingBlockId] = useState<string | null>(null);

  // Filter maintenance list with Section & Department Visibility
  const filteredMaintenance = useMemo(() => {
    const list = Array.isArray(maintenanceRequests) ? maintenanceRequests : [];
    return list.filter((req) => {
      let assetName = '';
      let assetZone = req.zone || '';
      if (network) {
        const parts = req.asset_id.split('-');
        if (parts.length === 2) {
          const u = network.nodes.find((n) => n.id === parts[0] || n.code === parts[0]);
          const v = network.nodes.find((n) => n.id === parts[1] || n.code === parts[1]);
          if (u && v) {
            assetName = `${u.name} ${v.name}`;
            if (!assetZone && (u.zone || v.zone)) {
              assetZone = u.zone || v.zone || '';
            }
          }
        }
      }

      // 1. Role-Based Section Visibility: Operators default to their section, Head sees all
      if (!isHead && scopeFilter === 'MY_SECTION') {
        const opZone = user?.assignedZone || 'CR';
        if (opZone !== 'ALL') {
          const matchesZone = !req.zone || req.zone === opZone || assetZone === opZone || req.asset_id.includes(opZone);
          if (!matchesZone) return false;
        }
      } else if (isHead && zoneFilter !== 'ALL') {
        const matchesHeadZone = req.zone === zoneFilter || assetZone === zoneFilter;
        if (!matchesHeadZone) return false;
      }

      // 2. Department Filtering
      if (departmentFilter !== 'ALL') {
        const reqDept = req.department || (req.type.toLowerCase().includes('signal') ? 'S&T' : req.type.toLowerCase().includes('wire') || req.type.toLowerCase().includes('ohe') ? 'OHE' : 'CIVIL');
        if (reqDept !== departmentFilter) return false;
      }

      // 3. Priority Filtering
      const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;
      if (!matchesPriority) return false;

      // 4. Text Search
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        req.id.toLowerCase().includes(query) ||
        req.type.toLowerCase().includes(query) ||
        req.asset_id.toLowerCase().includes(query) ||
        (req.department && req.department.toLowerCase().includes(query)) ||
        (req.created_by && req.created_by.toLowerCase().includes(query)) ||
        (req.zone && req.zone.toLowerCase().includes(query)) ||
        assetName.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [maintenanceRequests, searchQuery, priorityFilter, departmentFilter, zoneFilter, scopeFilter, network, isHead, user]);

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

  const getDepartmentBadge = (dept?: string, type?: string) => {
    const d = dept || (type?.toLowerCase().includes('signal') ? 'S&T' : type?.toLowerCase().includes('wire') || type?.toLowerCase().includes('ohe') ? 'OHE' : 'CIVIL');
    switch (d) {
      case 'S&T':
        return <span className="badge text-white px-2 py-0.5" style={{ backgroundColor: '#7c3aed', fontSize: '0.68rem' }}>S&T (Signals)</span>;
      case 'OHE':
        return <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.68rem' }}>OHE (Traction)</span>;
      case 'TRAFFIC':
        return <span className="badge text-white px-2 py-0.5" style={{ backgroundColor: '#0891b2', fontSize: '0.68rem' }}>TRAFFIC</span>;
      case 'MECHANICAL':
        return <span className="badge bg-secondary text-white px-2 py-0.5" style={{ fontSize: '0.68rem' }}>MECHANICAL</span>;
      case 'CIVIL':
      default:
        return <span className="badge bg-primary text-white px-2 py-0.5" style={{ fontSize: '0.68rem' }}>CIVIL (Track)</span>;
    }
  };

  // Automatically trigger AI optimization on page load if maintenance blocks exist but optimization hasn't run yet
  React.useEffect(() => {
    const list = Array.isArray(maintenanceRequests) ? maintenanceRequests : [];
    if (list.length > 0 && (!metrics || candidatePlans.length === 0)) {
      handleOptimize();
    }
  }, [Array.isArray(maintenanceRequests) ? maintenanceRequests.length : 0]);

  const handleBlockOptimize = async (blockId: string) => {
    setOptimizingBlockId(blockId);
    try {
      if (!metrics || candidatePlans.length === 0 || !breakdownByMaintenance[blockId]) {
        await handleOptimize();
      }
      setExpandedRequestId(expandedRequestId === blockId ? null : blockId);
      const list = Array.isArray(maintenanceRequests) ? maintenanceRequests : [];
      const req = list.find((m) => m.id === blockId);
      if (req) {
        setSelectedTrackId(req.asset_id);
      }
    } catch (err) {
      console.error('Error optimizing block:', err);
    } finally {
      setOptimizingBlockId(null);
    }
  };

  const activeBlockBreakdown = useMemo(() => {
    if (!expandedRequestId) return null;
    return breakdownByMaintenance[expandedRequestId] || null;
  }, [expandedRequestId, breakdownByMaintenance]);

  const activeScheduledBlock = useMemo(() => {
    if (!expandedRequestId) return null;
    return optimizationPlan?.find((p) => p.maintenance_id === expandedRequestId) || null;
  }, [expandedRequestId, optimizationPlan]);

  return (
    <Container fluid className="py-3 px-3">
      <Row className="g-3">
        {/* Left Column: Maintenance Blocks Queue & Slot Selector */}
        <Col lg={5} md={12}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom py-2.5">
              <div className="d-flex align-items-center">
                <Wrench size={18} className="me-2 text-primary" />
                <span className="fw-bold text-dark">Track Maintenance Blocks</span>
                <Badge bg="primary" pill className="ms-2">
                  {maintenanceRequests.length}
                </Badge>
              </div>
              <div className="d-flex align-items-center gap-1">
                {maintenanceRequests.length > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="py-1 px-2 extra-small"
                    onClick={handleClearAllMaintenance}
                    title="Clear all maintenance blocks"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  className="py-1 px-2.5 d-flex align-items-center gap-1 extra-small fw-bold shadow-sm"
                  onClick={() => setShowMaintenanceModal(true)}
                >
                  <Plus size={13} />
                  <span>Add Block</span>
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="p-3 d-flex flex-column custom-scrollbar" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
              
              {/* Jurisdiction & Role-Based Scope Banner */}
              {isHead ? (
                <div className="p-2 px-2.5 mb-2.5 rounded-2 border bg-dark text-white d-flex flex-wrap align-items-center justify-content-between gap-1 extra-small shadow-xs">
                  <div className="d-flex align-items-center gap-1.5">
                    <Globe2 size={13} className="text-warning" />
                    <span><strong>Apex Head of Department:</strong> Pan-India visibility across all zones & departments.</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span className="text-white-50 extra-small">Filter Zone:</span>
                    <select
                      value={zoneFilter}
                      onChange={(e) => setZoneFilter(e.target.value)}
                      className="form-select form-select-sm py-0 px-1 extra-small bg-light text-dark fw-bold border-0"
                      style={{ fontSize: '0.68rem', height: '22px' }}
                    >
                      <option value="ALL">All 18 Zones</option>
                      {ZONES.filter(z => z.code !== 'ALL').map(z => (
                        <option key={z.code} value={z.code}>{z.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-2 px-2.5 mb-2.5 rounded-2 border bg-light text-dark d-flex flex-wrap align-items-center justify-content-between gap-1 extra-small shadow-xs">
                  <div className="d-flex align-items-center gap-1.5">
                    <ShieldCheck size={13} className="text-primary" />
                    <span><strong>Section Operator:</strong> Zone <strong>{user?.assignedZone || 'CR'}</strong> ({user?.sectionName || 'Section Command'})</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className={`btn btn-xs py-0 px-1.5 rounded ${scopeFilter === 'MY_SECTION' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.65rem' }}
                      onClick={() => setScopeFilter('MY_SECTION')}
                    >
                      My Section
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs py-0 px-1.5 rounded ${scopeFilter === 'ALL_SECTIONS' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.65rem' }}
                      onClick={() => setScopeFilter('ALL_SECTIONS')}
                    >
                      All Network
                    </button>
                  </div>
                </div>
              )}

              {/* Search & Department / Priority Filters */}
              <div className="mb-3">
                <InputGroup size="sm" className="mb-2">
                  <InputGroup.Text className="bg-white border-end-0 py-0 px-2">
                    <Search size={12} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    size="sm"
                    placeholder="Search corridor, asset, department, operator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-start-0 ps-1 extra-small"
                    style={{ fontSize: '0.78rem' }}
                  />
                </InputGroup>

                {/* Department Filter Pills */}
                <div className="d-flex align-items-center gap-1 flex-wrap mb-1.5">
                  <Building2 size={11} className="text-muted" />
                  <span className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>Dept:</span>
                  {['ALL', 'CIVIL', 'S&T', 'OHE', 'TRAFFIC', 'MECHANICAL'].map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      className={`btn btn-xs py-0 px-2 rounded-pill ${
                        departmentFilter === dept ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                      onClick={() => setDepartmentFilter(dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                {/* Priority Filter Pills */}
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <Filter size={11} className="text-muted" />
                  <span className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>Priority:</span>
                  {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-xs py-0 px-2 rounded-pill ${
                        priorityFilter === p ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                      onClick={() => setPriorityFilter(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Firebase Cloud Sync Status */}
                <div className="d-flex align-items-center justify-content-between bg-light px-2.5 py-1.5 rounded-2 border mt-2.5 extra-small">
                  <div className="d-flex align-items-center gap-1.5 text-dark">
                    <Database size={12} className="text-success" />
                    <span style={{ fontSize: '0.68rem' }}>
                      <strong>Firebase Cloud Sync:</strong> <code className="text-primary fw-bold" style={{ fontSize: '0.68rem' }}>rail-ai-bcbeb</code>
                    </span>
                  </div>
                  <span className="badge bg-success rounded-pill" style={{ fontSize: '0.6rem', padding: '2px 7px' }}>
                    Firestore Live ({filteredMaintenance.length} Visible)
                  </span>
                </div>
              </div>

              {/* Maintenance Blocks List */}
              <div className="flex-grow-1">
                {filteredMaintenance.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <Wrench size={36} className="opacity-25 mb-2 text-primary" />
                    <h6 className="fw-bold text-dark small">No Maintenance Blocks Scheduled</h6>
                    <p className="extra-small text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                      Click <strong>"Add Block"</strong> to register a new track maintenance request or emergency repair.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="d-flex align-items-center gap-1 mx-auto extra-small fw-bold"
                      onClick={() => setShowMaintenanceModal(true)}
                    >
                      <Plus size={13} />
                      Schedule First Block
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {filteredMaintenance.map((req) => {
                      const breakdown = breakdownByMaintenance[req.id];
                      const scheduledBlock = optimizationPlan?.find((p) => p.maintenance_id === req.id);
                      const isExpanded = expandedRequestId === req.id;

                      let srcName = req.asset_id;
                      let tgtName = '';
                      if (network) {
                        const parts = req.asset_id.split('-');
                        if (parts.length === 2) {
                          const u = network.nodes.find((n) => n.id === parts[0] || n.code === parts[0]);
                          const v = network.nodes.find((n) => n.id === parts[1] || n.code === parts[1]);
                          if (u && v) {
                            srcName = u.name;
                            tgtName = ` ⇄ ${v.name}`;
                          }
                        }
                      }

                      return (
                        <div
                          key={req.id}
                          className="p-3 rounded-3 border bg-white shadow-sm transition-all"
                          style={{
                            borderLeft: req.priority === 'Critical' ? '4px solid #dc3545' : req.priority === 'High' ? '4px solid #f59e0b' : '4px solid #0d6efd',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <div className="fw-bold text-dark small">
                                {srcName}{tgtName}
                              </div>
                              <div className="extra-small text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                                Asset: {req.asset_id} • ID: {req.id}
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              {getPriorityBadge(req.priority)}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="py-0.5 px-1.5 border-0 text-danger hover-bg-danger"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteMaintenance(req.id);
                                }}
                                title="Delete maintenance block"
                                style={{ cursor: 'pointer' }}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>

                          {/* Department & Scheduled Date Badges */}
                          <div className="d-flex align-items-center gap-1.5 my-1.5 flex-wrap">
                            {getDepartmentBadge(req.department, req.type)}
                            <span className="badge bg-light text-dark border extra-small" style={{ fontSize: '0.68rem' }}>
                              ZONE: {req.zone || 'CR'}
                            </span>
                            <span className="badge badge-soft-dark py-1 px-2 d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.7rem' }}>
                              <Calendar size={11} className="text-primary" />
                              <span>{req.scheduled_day || 'Tomorrow'}, {req.scheduled_date || '11 Sep'}</span>
                            </span>
                            {req.advance_notice_days !== undefined && (
                              <span className={`badge ${req.advance_notice_days >= 1 ? 'badge-soft-success' : 'badge-soft-warning'} py-1 px-1.5`} style={{ fontSize: '0.68rem' }}>
                                {req.advance_notice_days === 0 ? '0d Immediate' : `+${req.advance_notice_days}d Notice`}
                              </span>
                            )}
                          </div>

                          {/* Bundled Multi-Task / Department Sub-Tasks */}
                          {req.tasks && req.tasks.length > 1 && (
                            <div className="p-2 my-1.5 rounded-2 bg-light border">
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className="fw-bold extra-small text-dark d-flex align-items-center gap-1">
                                  <Sparkles size={11} className="text-warning" />
                                  <span>Joint Multi-Departmental Block ({req.tasks.length} Tasks)</span>
                                </span>
                                {req.track_time_saved_mins ? (
                                  <span className="badge bg-success extra-small" style={{ fontSize: '0.62rem' }}>
                                    Saved {(req.track_time_saved_mins / 60).toFixed(1)}h Line Closure
                                  </span>
                                ) : null}
                              </div>
                              <div className="d-flex flex-wrap gap-1">
                                {req.tasks.map((st, sidx) => (
                                  <span key={sidx} className="badge bg-white text-dark border extra-small d-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
                                    <strong className="text-primary">{st.department}:</strong> {st.type} ({st.duration_mins}m)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="d-flex align-items-center justify-content-between extra-small text-muted mt-1.5 pt-1 border-top flex-wrap gap-1" style={{ fontSize: '0.72rem' }}>
                            <span className="badge bg-light text-dark border">
                              {req.type}
                            </span>
                            <span className="d-flex align-items-center text-primary fw-semibold">
                              <Clock size={11} className="me-1" /> {(req.duration_mins / 60).toFixed(1)} hrs ({req.duration_mins}m)
                            </span>
                            {scheduledBlock && scheduledBlock.start_time && (
                              <span className="badge badge-soft-success py-1 px-2 d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                                <CheckCircle2 size={11} className="text-success" />
                                <span>Optimal: {scheduledBlock.start_time} - {scheduledBlock.end_time}</span>
                              </span>
                            )}
                          </div>

                          {/* Created By Metadata Tag */}
                          <div className="d-flex align-items-center justify-content-between extra-small text-muted mt-1.5 pt-1 border-top" style={{ fontSize: '0.68rem' }}>
                            <div className="d-flex align-items-center gap-1">
                              <User size={11} className="text-secondary" />
                              <span>Officer: <strong className="text-dark">{req.created_by || 'Section Controller'}</strong> ({req.created_by_designation || (req.created_by_role === 'HEAD' ? 'Apex Head' : 'Section Operator')})</span>
                            </div>
                            <span className="text-success extra-small fw-semibold">
                              Firestore Active
                            </span>
                          </div>

                          {/* Individual AI Optimizer Button for this Block */}
                          <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-1">
                            <Button
                              variant={isExpanded ? "primary" : "outline-primary"}
                              size="sm"
                              className="w-100 py-1.5 px-2.5 d-flex align-items-center justify-content-center gap-1.5 extra-small fw-bold shadow-sm"
                              style={{ fontSize: '0.75rem', ...(isExpanded ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}) }}
                              onClick={() => handleBlockOptimize(req.id)}
                              disabled={loading}
                            >
                              {loading && optimizingBlockId === req.id ? (
                                <>
                                  <Spinner size="sm" animation="border" style={{ width: '12px', height: '12px' }} />
                                  <span>AI Optimizing {srcName}...</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={13} className={isExpanded ? "text-warning" : "text-primary"} />
                                  <span>{breakdown ? (isExpanded ? 'Hide AI Slot Options' : 'Analyze Block with AI Optimizer') : 'Run AI Optimizer on this Block'}</span>
                                  {isExpanded ? <ChevronUp size={13} className="ms-auto" /> : <ChevronDown size={13} className="ms-auto" />}
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Expandable candidate options selector */}
                          {isExpanded && breakdown && (
                            <div className="mt-2 pt-2 border-top">
                              <MaintenanceOptionSelector
                                breakdown={breakdown}
                                selectedOptionId={scheduledBlock?.option_id || breakdown.options[0].id}
                                onSelectOption={handleOptionSelect}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: AI Strategy Matrix, Explanations, & Delay Gains */}
        <Col lg={7} md={12}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Header className="d-flex align-items-center justify-content-between bg-white border-bottom py-2.5">
              <div className="d-flex align-items-center">
                <Sparkles size={18} className="me-2 text-primary" />
                <span className="fw-bold text-dark">AI Optimization & Strategy Matrix</span>
              </div>
              {metrics && (
                <Badge bg="success" pill>
                  Ensemble AI Solved
                </Badge>
              )}
            </Card.Header>

            <Card.Body className="p-3 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
              {!metrics ? (
                <div className="text-center py-5 text-muted">
                  <Activity size={48} className="opacity-25 mb-3 text-primary" />
                  <h6 className="fw-bold text-dark">No Optimization Active</h6>
                  <p className="small mb-3 max-w-md mx-auto">
                    Click <strong>"Run AI Optimization"</strong> to evaluate conflict-free Night Shadow & Daylight windows across the network.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="d-flex align-items-center gap-2 mx-auto shadow-sm fw-bold px-3 py-1.5"
                    onClick={() => handleOptimize()}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" animation="border" /> : <Settings size={15} />}
                    <span>Run AI Schedule Optimization</span>
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* 🎯 Focused Block Recommendation Highlight when a block is expanded / analyzed */}
                  {activeBlockBreakdown && (
                    <div className="p-2.5 rounded-3 border bg-light bg-opacity-50 shadow-xs">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold extra-small text-primary d-flex align-items-center gap-1">
                          <Zap size={13} className="text-warning" />
                          <span>Focused Block Analysis: <strong>{activeBlockBreakdown.maintenance_request.id}</strong></span>
                        </span>
                        <Badge bg="info" className="extra-small">
                          {activeBlockBreakdown.options.length} Candidate Slots
                        </Badge>
                      </div>
                      <div className="text-dark small fw-semibold mb-1">
                        {activeBlockBreakdown.maintenance_request.section_name || activeBlockBreakdown.maintenance_request.asset_id}
                      </div>
                      <div className="extra-small text-muted d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: '0.72rem' }}>
                        <span>Selected Slot: <strong className="text-success">{activeScheduledBlock?.start_time ? `${activeScheduledBlock.start_time} – ${activeScheduledBlock.end_time}` : activeBlockBreakdown.options[0].label}</strong></span>
                        <span>•</span>
                        <span>Delay: <strong className="text-danger">{activeScheduledBlock?.delay_caused || activeBlockBreakdown.options[0].delay_caused}m</strong></span>
                        <span>•</span>
                        <span>ML Risk: <strong className="text-dark">{activeScheduledBlock?.ml_risk_level || activeBlockBreakdown.options[0].ml_risk_level || 'Low Risk'}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* 🤖 AI "Why This Block?" Decision Explanation Card */}
                  {activeAiExplanations && activeAiExplanations.length > 0 && (
                    <AiDecisionExplanation
                      explanations={activeAiExplanations}
                      title="AI DECISION EXPLANATION"
                      badgeLabel={currentPlan?.badge || 'Recommended Block'}
                      variant="card"
                    />
                  )}

                  {/* Multi-Plan Strategy Selector */}
                  {candidatePlans.length > 0 && (
                    <CandidatePlansComparison
                      plans={candidatePlans}
                      selectedPlanId={selectedPlanId}
                      onSelectPlan={(id) => setSelectedPlanId(id)}
                    />
                  )}

                  {/* Optimization Gain Metrics */}
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-uppercase text-secondary fw-bold extra-small" style={{ fontSize: '0.72rem' }}>
                        Optimization Gain (vs Uncoordinated Peak Scheduling)
                      </span>
                    </div>

                    <Row className="g-2 mb-3">
                      <Col xs={6}>
                        <div className="bg-light p-2.5 rounded-3 border text-center">
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
                        <div className="bg-light p-2.5 rounded-3 border text-center">
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
                    <div className="bg-white border rounded-3 p-3" style={{ height: '190px' }}>
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
                          <Bar dataKey="delay" radius={[4, 4, 0, 0]} barSize={42} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
