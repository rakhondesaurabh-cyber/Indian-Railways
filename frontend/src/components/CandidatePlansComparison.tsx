import React from 'react';
import { Badge, Card, Row, Col } from 'react-bootstrap';
import { Activity, Clock, CheckCircle, Train as TrainIcon, ShieldCheck, Sparkles } from 'lucide-react';
import type { CandidatePlan } from '../types';

interface Props {
  plans: CandidatePlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

export const CandidatePlansComparison: React.FC<Props> = ({ plans, selectedPlanId, onSelectPlan }) => {
  if (!plans || plans.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="text-uppercase text-secondary fw-bold mb-0 small d-flex align-items-center gap-1">
          <Activity size={14} className="text-primary" /> AI Candidate Strategies
        </h6>
        <Badge bg="light" text="dark" className="border extra-small d-flex align-items-center gap-1">
          <Sparkles size={11} className="text-warning" /> XGBoost ML Ensemble
        </Badge>
      </div>
      <div className="d-flex flex-column gap-2">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          let badgeColor = 'secondary';
          if (plan.badge === 'Recommended') badgeColor = 'success';
          else if (plan.badge === 'High Disruption') badgeColor = 'danger';
          else if (plan.badge === 'Feasible') badgeColor = 'warning';
          else if (plan.badge === 'Efficient') badgeColor = 'info';

          return (
            <Card
              key={plan.id}
              className={`border transition-all shadow-sm ${
                isSelected ? 'border-primary border-2 bg-primary bg-opacity-10' : 'border-light-subtle bg-white'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectPlan(plan.id)}
            >
              <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    {isSelected && <CheckCircle size={14} className="text-primary" />}
                    <span className={`fw-bold ${isSelected ? 'text-primary' : 'text-dark'}`}>{plan.name}</span>
                  </div>
                  {plan.badge && (
                    <Badge bg={badgeColor} text={badgeColor === 'warning' ? 'dark' : 'white'} className="extra-small">
                      {plan.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-muted extra-small mb-2" style={{ fontSize: '0.75rem', lineHeight: '1.25' }}>
                  {plan.description}
                </div>
                <Row className="g-1 text-center mb-1">
                  <Col xs={6}>
                    <div className="bg-light rounded p-1 border">
                      <div className="fw-bold fs-6" style={{ color: plan.metrics.delay_mins > 100 ? '#dc3545' : '#198754' }}>
                        {plan.metrics.delay_mins}m
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.65rem' }}>
                        <Clock size={10} className="me-1" /> Delay Impact
                      </div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="bg-light rounded p-1 border">
                      <div className="fw-bold fs-6" style={{ color: plan.metrics.trains_affected > 5 ? '#dc3545' : '#198754' }}>
                        {plan.metrics.trains_affected}
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.65rem' }}>
                        <TrainIcon size={10} className="me-1" /> Trains Affected
                      </div>
                    </div>
                  </Col>
                </Row>
                {plan.metrics.ml_risk_score && (
                  <div className="d-flex align-items-center justify-content-between pt-1 border-top extra-small text-muted" style={{ fontSize: '0.7rem' }}>
                    <span className="d-flex align-items-center gap-1">
                      <ShieldCheck size={12} className="text-success" /> ML Risk Assessment:
                    </span>
                    <span className="fw-semibold text-dark">{plan.metrics.ml_risk_score}</span>
                  </div>
                )}

                {isSelected && plan.ai_explanation && (
                  <div className="mt-2 pt-1 border-top extra-small">
                    <div className="d-flex justify-content-between align-items-center text-primary fw-bold mb-1" style={{ fontSize: '0.7rem' }}>
                      <span>🤖 AI Score: {plan.ai_explanation.optimization_score.toFixed(1)} / 100</span>
                      <span className="text-muted">{plan.ai_explanation.time_window}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem', lineHeight: '1.2' }}>
                      ✓ {plan.ai_explanation.reasons.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
