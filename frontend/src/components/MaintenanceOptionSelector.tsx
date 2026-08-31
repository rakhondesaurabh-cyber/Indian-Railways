import React, { useState } from 'react';
import { Badge, Form, Button } from 'react-bootstrap';
import { Clock, Train as TrainIcon, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { AiDecisionExplanation } from './AiDecisionExplanation';
import type { BreakdownByMaintenance, MaintenanceRequest } from '../types';

interface Props {
  breakdown: BreakdownByMaintenance;
  selectedOptionId: string;
  onSelectOption: (optionId: string, maintenanceId: string) => void;
}

export const MaintenanceOptionSelector: React.FC<Props> = ({ breakdown, selectedOptionId, onSelectOption }) => {
  const req: MaintenanceRequest = breakdown.maintenance_request;
  const options = breakdown.options;
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  if (!options || options.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-top">
      <div className="text-secondary fw-semibold extra-small mb-2 d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem' }}>
        <span>AI Candidate Windows for {req.id}:</span>
        <span className="badge bg-light text-primary border">3 AI Options</span>
      </div>
      <div className="d-flex flex-column gap-2">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isExpOpen = expandedExplanationId === opt.id;
          let badgeColor = 'secondary';
          if (opt.badge === 'Recommended') badgeColor = 'success';
          else if (opt.badge === 'High Disruption') badgeColor = 'danger';
          else if (opt.badge === 'Feasible') badgeColor = 'warning';

          return (
            <div
              key={opt.id}
              className={`p-2 rounded border transition-all ${
                isSelected ? 'border-primary bg-white shadow-sm' : 'border-light bg-light opacity-90'
              }`}
            >
              <div
                className="d-flex align-items-start gap-2"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectOption(opt.id, req.id)}
              >
                <Form.Check
                  type="radio"
                  id={opt.id}
                  checked={isSelected}
                  onChange={() => onSelectOption(opt.id, req.id)}
                  className="mt-1"
                />
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className={`fw-bold small ${isSelected ? 'text-primary' : 'text-dark'}`}>
                      {opt.label} ({new Date(opt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(opt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                    {opt.badge && (
                      <Badge bg={badgeColor} text={badgeColor === 'warning' ? 'dark' : 'white'} className="extra-small px-1">
                        {opt.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted extra-small mb-1" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
                    {opt.rationale}
                  </div>
                  <div className="d-flex justify-content-between align-items-center extra-small fw-medium gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <span className={opt.delay_caused > 60 ? 'text-danger' : 'text-success'}>
                        <Clock size={11} className="me-1" /> {opt.delay_caused}m Delay
                      </span>
                      <span className="text-primary fw-semibold">
                        <TrainIcon size={11} className="me-1" /> {opt.corridor_trains?.length || opt.affected_trains.length} Trains on Track
                      </span>
                      <span className={`badge ${opt.affected_trains.length > 0 ? 'bg-danger text-white' : 'bg-success text-white'} extra-small py-0 px-1`}>
                        {opt.affected_trains.length} Delayed • {Math.max(0, (opt.corridor_trains?.length || opt.affected_trains.length) - opt.affected_trains.length)} On-Time
                      </span>
                    </div>

                    {opt.ai_explanation && (
                      <Button
                        variant={isExpOpen ? "primary" : "outline-primary"}
                        size="sm"
                        className="py-0 px-1 extra-small d-flex align-items-center gap-1"
                        style={{ fontSize: '0.68rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedExplanationId(isExpOpen ? null : opt.id);
                        }}
                      >
                        <Bot size={10} />
                        {isExpOpen ? 'Hide Rationale' : 'Why This Block?'}
                        {isExpOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline AI Explanation Card */}
              {isExpOpen && opt.ai_explanation && (
                <div className="mt-2 pt-2 border-top">
                  <AiDecisionExplanation
                    explanation={opt.ai_explanation}
                    title="WHY THIS BLOCK?"
                    badgeLabel={`${opt.label} Analysis`}
                    variant="inline"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

