import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { Radio, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DispatchCoPilot } from '../components/DispatchCoPilot';
import { useRailway } from '../context/RailwayContext';

export const DispatchDeskPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    dispatchDirectives,
    dispatchStats,
    currentPlan,
    setSelectedStationId,
    handleOptimize,
    loading,
  } = useRailway();

  const handleStationFocus = (stationCode: string) => {
    setSelectedStationId(stationCode);
    navigate('/');
  };

  return (
    <Container fluid className="py-3 px-3">
      <Card className="shadow-sm border-0 rounded-3">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom py-2.5 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Radio size={20} className="text-primary" />
            <div>
              <span className="fw-bold text-dark fs-6">Section Controller Dispatch Operations Desk</span>
              <div className="text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                Active Precedence Directives • Form T/D 602 Single-Line Working • Emergency Chord Detours
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              className="py-1 px-2.5 extra-small d-flex align-items-center gap-1.5"
              style={{ fontSize: '0.74rem' }}
              onClick={() => handleOptimize()}
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Recalculating...' : 'Re-Evaluate Directives'}</span>
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-3 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 145px)', overflowY: 'auto' }}>
          <DispatchCoPilot
            directives={dispatchDirectives}
            stats={dispatchStats}
            onStationSelect={handleStationFocus}
            selectedPlanName={currentPlan?.name || 'Active Schedule Plan'}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};
