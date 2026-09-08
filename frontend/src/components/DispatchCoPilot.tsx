import React, { useState } from 'react';
import { Badge, Button, ButtonGroup, Row, Col, Alert } from 'react-bootstrap';
import {
  Radio,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  GitMerge,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Zap,
  Filter,
} from 'lucide-react';
import type { DispatchDirective, DispatchStats } from '../types';

interface DispatchCoPilotProps {
  directives?: DispatchDirective[];
  stats?: DispatchStats;
  onStationSelect?: (stationCode: string) => void;
  selectedPlanName?: string;
}

export const DispatchCoPilot: React.FC<DispatchCoPilotProps> = ({
  directives = [],
  stats,
  onStationSelect,
  selectedPlanName = 'Active Plan',
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [expandedMemoId, setExpandedMemoId] = useState<string | null>(null);

  const handleToggleAcknowledge = (id: string) => {
    setAcknowledgedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAcknowledgeAll = () => {
    const newMap: Record<string, boolean> = {};
    directives.forEach((d) => {
      newMap[d.id] = true;
    });
    setAcknowledgedMap(newMap);
  };

  const handleCopyMemo = (id: string, memoText: string) => {
    navigator.clipboard.writeText(memoText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAllMemos = () => {
    const allText = directives
      .map((d) => d.coa_memo_text)
      .join('\n\n============================================================\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const filteredDirectives = directives.filter((d) => {
    if (filterType === 'ALL') return true;
    return d.type === filterType;
  });

  const totalSaved =
    stats?.total_delay_saved_mins ??
    directives.reduce((sum, d) => sum + (d.delay_saved_mins || 0), 0);
  const acknowledgedCount = Object.values(acknowledgedMap).filter(Boolean).length;

  if (!directives || directives.length === 0) {
    return (
      <Alert variant="secondary" className="p-4 text-center my-3 border shadow-sm">
        <div className="d-flex justify-content-center mb-2">
          <ShieldCheck size={32} className="text-primary opacity-75" />
        </div>
        <h6 className="fw-bold text-dark mb-1">No Active Regulation Orders Required</h6>
        <p className="extra-small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
          The selected schedule operates with minimal passenger interference. All trains are clear for normal signal progression.
        </p>
      </Alert>
    );
  }

  return (
    <div className="d-flex flex-column gap-2 mb-3">
      {/* Top Controller Banner */}
      <div className="dispatch-banner">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span className="badge bg-danger rounded-circle p-1 animate-pulse" style={{ width: '8px', height: '8px' }}></span>
              <span className="fw-bold text-white small d-flex align-items-center gap-1">
                <Radio size={14} className="text-info" />
                Section Controller Dispatch Co-Pilot
              </span>
              <Badge bg="info" text="dark" className="extra-small">
                AI Precedence Engine
              </Badge>
            </div>
            <div className="extra-small text-light opacity-75" style={{ fontSize: '0.72rem' }}>
              Loop-line regulations, Form T/D 602 pilotage orders & chord detours for <strong>{selectedPlanName}</strong>.
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="d-flex align-items-center gap-1 flex-wrap">
            <div className="dispatch-stat-box">
              <div className="extra-small text-light opacity-75" style={{ fontSize: '0.62rem' }}>ORDERS</div>
              <div className="fw-bold text-white small">{directives.length}</div>
            </div>
            <div className="dispatch-stat-box" style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981' }}>
              <div className="extra-small text-success fw-bold" style={{ fontSize: '0.62rem' }}>DELAY SAVED</div>
              <div className="fw-bold text-success small d-flex align-items-center justify-content-center gap-1">
                <Zap size={11} /> {totalSaved}m
              </div>
            </div>
            <div className="dispatch-stat-box">
              <div className="extra-small text-light opacity-75" style={{ fontSize: '0.62rem' }}>LOGGED</div>
              <div className="fw-bold text-info small">{acknowledgedCount}/{directives.length}</div>
            </div>
          </div>
        </div>

        {/* Global Action & Filter Bar */}
        <div className="d-flex justify-content-between align-items-center gap-1 flex-wrap pt-2 border-top border-secondary border-opacity-50">
          {/* Filters */}
          <div className="d-flex align-items-center gap-1 flex-wrap">
            <Filter size={11} className="text-light opacity-75 me-1" />
            <ButtonGroup size="sm">
              <Button
                variant={filterType === 'ALL' ? 'primary' : 'outline-light'}
                className="py-0 px-2 extra-small"
                style={{ fontSize: '0.7rem' }}
                onClick={() => setFilterType('ALL')}
              >
                All ({directives.length})
              </Button>
              <Button
                variant={filterType === 'LOOP_HOLD' ? 'primary' : 'outline-light'}
                className="py-0 px-2 extra-small"
                style={{ fontSize: '0.7rem' }}
                onClick={() => setFilterType('LOOP_HOLD')}
              >
                Loop Holds ({directives.filter((d) => d.type === 'LOOP_HOLD').length})
              </Button>
              <Button
                variant={filterType === 'TSLW_WORKING' ? 'warning' : 'outline-light'}
                className="py-0 px-2 extra-small"
                style={{ fontSize: '0.7rem' }}
                onClick={() => setFilterType('TSLW_WORKING')}
              >
                TSLW ({directives.filter((d) => d.type === 'TSLW_WORKING').length})
              </Button>
              {directives.some((d) => d.type === 'CHORD_DETOUR') && (
                <Button
                  variant={filterType === 'CHORD_DETOUR' ? 'success' : 'outline-light'}
                  className="py-0 px-2 extra-small"
                  style={{ fontSize: '0.7rem' }}
                  onClick={() => setFilterType('CHORD_DETOUR')}
                >
                  Detours ({directives.filter((d) => d.type === 'CHORD_DETOUR').length})
                </Button>
              )}
            </ButtonGroup>
          </div>

          {/* Bulk Buttons */}
          <div className="d-flex align-items-center gap-1 ms-auto">
            <Button
              variant="outline-light"
              size="sm"
              className="py-0 px-2 extra-small d-flex align-items-center gap-1"
              style={{ fontSize: '0.7rem' }}
              onClick={handleCopyAllMemos}
              title="Copy all official COA Memos to clipboard"
            >
              {copiedAll ? <Check size={11} className="text-success" /> : <Copy size={11} />}
              {copiedAll ? 'All Copied!' : 'Copy All Memos'}
            </Button>
            {acknowledgedCount < directives.length && (
              <Button
                variant="success"
                size="sm"
                className="py-0 px-2 extra-small d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem' }}
                onClick={handleAcknowledgeAll}
              >
                <CheckCircle2 size={11} />
                Acknowledge All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Directives Cards List */}
      <div className="d-flex flex-column gap-2">
        {filteredDirectives.map((d) => {
          const isAck = !!acknowledgedMap[d.id];
          const isCopied = copiedId === d.id;
          const isMemoExpanded = expandedMemoId === d.id;

          const isLoopHold = d.type === 'LOOP_HOLD';
          const isTSLW = d.type === 'TSLW_WORKING';
          const isDetour = d.type === 'CHORD_DETOUR';

          const cardTypeClass = isTSLW ? 'card-tslw' : isDetour ? 'card-detour' : 'card-loop';

          return (
            <div
              key={d.id}
              className={`dispatch-card ${cardTypeClass} ${isAck ? 'card-acknowledged' : ''}`}
            >
              {/* Header row */}
              <div className="d-flex justify-content-between align-items-center gap-1 flex-wrap pb-1 mb-2 border-bottom">
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  {/* Type Badge */}
                  {isTSLW && (
                    <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1 extra-small px-1">
                      <AlertTriangle size={10} /> TSLW PILOTAGE ORDER
                    </Badge>
                  )}
                  {isDetour && (
                    <Badge bg="success" className="d-flex align-items-center gap-1 extra-small px-1">
                      <GitMerge size={10} /> CHORD DETOUR
                    </Badge>
                  )}
                  {isLoopHold && (
                    <Badge bg="primary" className="d-flex align-items-center gap-1 extra-small px-1">
                      <Radio size={10} /> LOOP REGULATION
                    </Badge>
                  )}

                  {/* Directive ID */}
                  <span className="badge bg-light text-dark border font-monospace extra-small">
                    {d.id}
                  </span>

                  {/* Station Focus Button */}
                  <button
                    type="button"
                    onClick={() => onStationSelect && onStationSelect(d.target_station_code)}
                    className="btn btn-xs btn-outline-secondary py-0 px-1 d-flex align-items-center gap-1 extra-small"
                    style={{ fontSize: '0.7rem' }}
                    title={`Click to focus ${d.target_station_code} on Railway Map`}
                  >
                    <span>📍 {d.target_station}</span>
                    <ExternalLink size={9} className="text-muted" />
                  </button>

                  {/* Assigned Line */}
                  <span className="badge bg-secondary bg-opacity-10 text-dark border extra-small">
                    {d.assigned_line}
                  </span>
                </div>

                {/* Delay Saved Badge & Acknowledged State */}
                <div className="d-flex align-items-center gap-1">
                  <Badge bg="success" className="d-flex align-items-center gap-1 extra-small px-1">
                    <Zap size={10} /> +{d.delay_saved_mins}m Saved
                  </Badge>
                  {isAck && (
                    <Badge bg="dark" className="d-flex align-items-center gap-1 extra-small px-1 text-success">
                      <Check size={10} /> Transmitted
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Title & Instructions */}
              <div className="mb-2">
                <div className="fw-bold text-dark small mb-1">
                  {d.action_title}
                </div>
                <div className="bg-light p-2 rounded border text-muted extra-small" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {d.action_instruction}
                </div>
              </div>

              {/* 2-Column Train Precedence Comparison Grid */}
              <Row className="g-2 mb-2">
                {/* Left Column: Held / Regulated Train */}
                <Col xs={12} md={6}>
                  <div className="dispatch-train-box h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="extra-small text-danger fw-bold text-uppercase mb-0.5 d-flex align-items-center gap-1" style={{ fontSize: '0.66rem' }}>
                        <span className="badge bg-danger rounded-circle p-0" style={{ width: '6px', height: '6px' }}></span>
                        {isLoopHold ? 'Train Held on Loop' : isTSLW ? 'Section Traffic' : 'Detoured Train'}
                      </div>
                      <div className="fw-bold text-dark extra-small" style={{ fontSize: '0.78rem' }}>
                        #{d.held_train.number} {d.held_train.name}
                      </div>
                      <div className="extra-small text-muted" style={{ fontSize: '0.68rem' }}>
                        Type: {d.held_train.type} • Priority: {d.held_train.priority}
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-top d-flex justify-content-between align-items-center extra-small" style={{ fontSize: '0.68rem' }}>
                      <span className="text-muted">Window:</span>
                      <span className="fw-bold text-warning font-monospace">
                        <Clock size={9} className="me-1" />
                        {d.holding_window.start} – {d.holding_window.end} ({d.holding_window.duration_mins}m)
                      </span>
                    </div>
                  </div>
                </Col>

                {/* Right Column: Precedence Train */}
                <Col xs={12} md={6}>
                  <div className="dispatch-train-box h-100 d-flex flex-column justify-content-between" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div>
                      <div className="extra-small text-success fw-bold text-uppercase mb-0.5 d-flex align-items-center gap-1" style={{ fontSize: '0.66rem' }}>
                        <ArrowRight size={10} className="text-success" />
                        {isLoopHold ? 'Mainline 1 Precedence' : isTSLW ? 'Pilot Authority' : 'Bypass Route'}
                      </div>
                      <div className="fw-bold text-success extra-small" style={{ fontSize: '0.78rem' }}>
                        #{d.precedence_train.number} {d.precedence_train.name}
                      </div>
                      <div className="extra-small text-muted" style={{ fontSize: '0.68rem' }}>
                        Priority: {d.precedence_train.priority} • Green Signal Authority
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-top d-flex justify-content-between align-items-center extra-small" style={{ fontSize: '0.68rem' }}>
                      <span className="text-muted">Protocol:</span>
                      <span className="fw-bold text-success font-monospace">
                        {isTSLW ? 'Form T/D 602' : 'Absolute Block 1'}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Collapsible Official COA Memo View */}
              {isMemoExpanded && (
                <div className="dispatch-memo-container mb-2">
                  <div className="d-flex justify-content-between align-items-center pb-1 mb-1 border-bottom border-secondary border-opacity-50">
                    <span className="fw-bold text-info font-monospace extra-small" style={{ fontSize: '0.68rem' }}>
                      OFFICIAL CONTROL OFFICE APPLICATION (COA) MEMO
                    </span>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-light py-0 px-1 extra-small"
                      style={{ fontSize: '0.68rem' }}
                      onClick={() => handleCopyMemo(d.id, d.coa_memo_text)}
                    >
                      {isCopied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="dispatch-memo-pre">
                    {d.coa_memo_text}
                  </pre>
                </div>
              )}

              {/* Directive Actions Footer */}
              <div className="d-flex justify-content-between align-items-center pt-1 border-top gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="py-0 px-2 extra-small d-flex align-items-center gap-1"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => handleCopyMemo(d.id, d.coa_memo_text)}
                  >
                    {isCopied ? (
                      <>
                        <Check size={11} className="text-success" />
                        <span className="text-success fw-bold">Memo Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy COA Memo</span>
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    className="btn btn-link p-0 text-muted extra-small text-decoration-underline"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setExpandedMemoId(isMemoExpanded ? null : d.id)}
                  >
                    {isMemoExpanded ? 'Hide Memo' : 'View Full Memo'}
                  </button>
                </div>

                <Button
                  variant={isAck ? 'outline-success' : 'primary'}
                  size="sm"
                  className="py-0 px-2 extra-small d-flex align-items-center gap-1 fw-bold shadow-sm"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => handleToggleAcknowledge(d.id)}
                >
                  {isAck ? (
                    <>
                      <CheckCircle2 size={11} className="text-success" />
                      <span>Transmitted & Logged</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>Transmit Directive to SM</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
