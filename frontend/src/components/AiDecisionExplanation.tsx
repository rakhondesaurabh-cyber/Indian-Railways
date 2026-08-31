import React from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';
import { Bot, Check, Clock, MapPin, Sparkles, Award } from 'lucide-react';
import type { AiExplanation } from '../types';

interface Props {
  explanation?: AiExplanation | null;
  explanations?: AiExplanation[] | null;
  title?: string;
  badgeLabel?: string;
  variant?: 'card' | 'compact' | 'inline';
}

export const AiDecisionExplanation: React.FC<Props> = ({
  explanation,
  explanations,
  title = 'AI DECISION EXPLANATION',
  badgeLabel = 'Recommended Block',
  variant = 'card',
}) => {
  const items = explanations && explanations.length > 0 ? explanations : explanation ? [explanation] : [];

  if (items.length === 0) return null;

  return (
    <div className="d-flex flex-column gap-2 mb-3">
      {items.map((item, idx) => {
        const score = item.optimization_score || 94.2;
        const isHigh = score >= 90;
        const isMed = score >= 70 && score < 90;
        const scoreVariant = isHigh ? 'success' : isMed ? 'warning' : 'danger';

        if (variant === 'inline' || variant === 'compact') {
          return (
            <div
              key={idx}
              className="p-2 rounded border bg-light bg-opacity-75 shadow-sm transition-all"
              style={{ borderLeft: '4px solid #0d6efd' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold extra-small text-primary d-flex align-items-center gap-1">
                  <Bot size={13} className="text-primary" />
                  🤖 {title}
                </span>
                <Badge bg={scoreVariant} className="extra-small px-2 py-0">
                  Score: {score.toFixed(1)} / 100
                </Badge>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2 extra-small text-dark">
                <span className="fw-semibold d-flex align-items-center gap-1">
                  <MapPin size={11} className="text-secondary" />
                  {item.section_name}
                </span>
                <span className="badge bg-white text-dark border d-flex align-items-center gap-1">
                  <Clock size={10} className="text-muted" />
                  {item.time_window}
                </span>
              </div>

              <div className="text-muted extra-small mb-1 fw-semibold">Reasons:</div>
              <div className="d-flex flex-column gap-1">
                {item.reasons.map((reason, rIdx) => (
                  <div
                    key={rIdx}
                    className="d-flex align-items-start gap-1 extra-small text-dark"
                    style={{ fontSize: '0.72rem', lineHeight: '1.25' }}
                  >
                    <Check size={12} className="text-success flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <Card
            key={idx}
            className="border-0 shadow-sm rounded-3 overflow-hidden text-white"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2744 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Header */}
            <div
              className="px-3 py-2 d-flex justify-content-between align-items-center border-bottom"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-1 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                >
                  <Bot size={15} className="text-info" />
                </div>
                <div>
                  <div className="fw-bold tracking-wider extra-small text-info text-uppercase d-flex align-items-center gap-1" style={{ letterSpacing: '0.05em' }}>
                    🤖 {title}
                  </div>
                  <div className="extra-small text-white-50" style={{ fontSize: '0.65rem' }}>
                    RailOpt AI Autonomous Dispatch
                  </div>
                </div>
              </div>
              <Badge
                bg="info"
                text="dark"
                className="fw-bold extra-small px-2 py-1 d-flex align-items-center gap-1 shadow-sm"
                style={{ fontSize: '0.7rem' }}
              >
                <Sparkles size={10} /> {badgeLabel}
              </Badge>
            </div>

            <Card.Body className="p-3">
              {/* Section & Time Window Banner */}
              <div
                className="p-2 rounded-2 mb-2 d-flex justify-content-between align-items-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div>
                  <div className="text-white-50 extra-small" style={{ fontSize: '0.68rem' }}>
                    Recommended Block
                  </div>
                  <div className="fw-bold text-white small d-flex align-items-center gap-1">
                    <MapPin size={13} className="text-warning flex-shrink-0" />
                    {item.section_name}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-white-50 extra-small" style={{ fontSize: '0.68rem' }}>
                    Optimal Slot
                  </div>
                  <div className="badge bg-primary bg-opacity-75 text-white fw-bold px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
                    <Clock size={11} /> {item.time_window}
                  </div>
                </div>
              </div>

              {/* Reasons List */}
              <div className="mb-2">
                <div className="text-info fw-bold extra-small mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                  <span>Reasons:</span>
                </div>
                <div className="d-flex flex-column gap-1.5 ps-1">
                  {item.reasons.map((reason, rIdx) => (
                    <div
                      key={rIdx}
                      className="d-flex align-items-start gap-2 text-light"
                      style={{ fontSize: '0.75rem', lineHeight: '1.3' }}
                    >
                      <span
                        className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 p-0 px-1 d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                        style={{ width: '15px', height: '15px', borderRadius: '4px' }}
                      >
                        ✓
                      </span>
                      <span className="text-light">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimization Score Bar & Badge */}
              <div
                className="pt-2 mt-2 border-top d-flex flex-column gap-1"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="extra-small text-white-50 d-flex align-items-center gap-1">
                    <Award size={13} className="text-warning" /> Optimization Score:
                  </span>
                  <span
                    className="fw-bolder"
                    style={{
                      color: isHigh ? '#4ade80' : isMed ? '#fbbf24' : '#f87171',
                      fontSize: '0.92rem',
                    }}
                  >
                    {score.toFixed(1)} <span className="text-white-50 fw-normal" style={{ fontSize: '0.75rem' }}>/ 100</span>
                  </span>
                </div>
                <ProgressBar
                  now={score}
                  variant={scoreVariant}
                  style={{ height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                />
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};
