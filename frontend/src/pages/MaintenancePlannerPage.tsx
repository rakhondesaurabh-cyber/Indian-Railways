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
  ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CandidatePlansComparison } from '../components/CandidatePlansComparison';
import { MaintenanceOptionSelector } from '../components/MaintenanceOptionSelector';
import { AiDecisionExplanation } from '../components/AiDecisionExplanation';
import { useRailway } from '../context/RailwayContext';

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
    setShowMaintenanceModal,
    handleOptimize,
    handleDeleteMaintenance,
    handleClearAllMaintenance,
    handleOptionSelect,
  } = useRailway();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [optimizingBlockId, setOptimizingBlockId] = useState<string | null>(null);

  // Filter maintenance list
  const filteredMaintenance = useMemo(() => {
    return maintenanceRequests.filter((req) => {
      let assetName = '';
      if (network) {
        const parts = req.asset_id.split('-');
        if (parts.length === 2) {
          const u = network.nodes.find((n) => n.id === parts[0] || n.code === parts[0]);
          const v = network.nodes.find((n) => n.id === parts[1] || n.code === parts[1]);
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

  const handleBlockOptimize = async (blockId: string) => {
    setOptimizingBlockId(blockId);
    try {
      if (!metrics) {
        await handleOptimize();
      }
      setExpandedRequestId(expandedRequestId === blockId ? null : blockId);
    } finally {
      setOptimizingBlockId(null);
    }
  };

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
              {/* Search & Filters */}
              <div className="mb-3">
                <InputGroup size="sm" className="mb-2">
                  <InputGroup.Text className="bg-white border-end-0 py-0 px-2">
                    <Search size={12} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    size="sm"
                    placeholder="Search corridor, asset, block ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-start-0 ps-1 extra-small"
                    style={{ fontSize: '0.78rem' }}
                  />
                </InputGroup>

                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <Filter size={11} className="text-muted" />
                  <span className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>
                    Priority:
                  </span>
                  {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-xs py-0 px-2 rounded-pill ${
                        priorityFilter === p ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '0.7rem' }}
                      onClick={() => setPriorityFilter(p)}
                    >
                      {p}
                    </button>
                  ))}
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
                                className="py-0 px-1 border-0"
                                onClick={() => handleDeleteMaintenance(req.id)}
                                title="Delete maintenance request"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between extra-small text-muted mt-2 pt-1 border-top flex-wrap gap-1" style={{ fontSize: '0.72rem' }}>
                            <span className="badge bg-light text-dark border">
                              {req.type}
                            </span>
                            <span className="d-flex align-items-center text-primary fw-semibold">
                              <Clock size={11} className="me-1" /> {req.duration_mins / 60} hrs ({req.duration_mins}m)
                            </span>
                            {scheduledBlock && (
                              <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 extra-small py-0.5 px-1.5 d-flex align-items-center gap-1">
                                <CheckCircle2 size={10} />
                                <span>{scheduledBlock.start_time} - {scheduledBlock.end_time}</span>
                              </span>
                            )}
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
                    onClick={handleOptimize}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" animation="border" /> : <Settings size={15} />}
                    <span>Run AI Schedule Optimization</span>
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
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
