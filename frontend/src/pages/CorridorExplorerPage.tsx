import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Navigation, Clock } from 'lucide-react';
import { CorridorSearchWidget } from '../components/CorridorSearchWidget';
import { TrainImpactList } from '../components/TrainImpactList';
import { useRailway } from '../context/RailwayContext';

export const CorridorExplorerPage: React.FC = () => {
  const {
    network,
    affectedTrains,
    unaffectedTrains,
    selectedTrackId,
    optimizationPlan,
    corridorTrainsByAsset,
    activeCorridor,
    corridorLoading,
    dispatchDirectives,
    dispatchStats,
    currentPlan,
    setSelectedTrackId,
    setSelectedStationId,
    setSelectedTrainForSchedule,
    setScheduleModalOpen,
    handleSearchCorridor,
    handleClearCorridor,
    handleTrackLiveTrain,
  } = useRailway();

  return (
    <Container fluid className="py-3 px-3">
      <Row className="g-3">
        {/* Left Column: 2-Junction Corridor Route Search & Telemetry */}
        <Col lg={5} md={12}>
          <div className="d-flex flex-column gap-3">
            {/* Search Widget */}
            <CorridorSearchWidget
              onSearchCorridor={handleSearchCorridor}
              activeCorridor={activeCorridor}
              onClearCorridor={handleClearCorridor}
              loading={corridorLoading}
            />

            {/* Corridor Telemetry Card if corridor active */}
            {activeCorridor && (
              <Card className="shadow-sm border-0 rounded-3">
                <Card.Header className="bg-white border-bottom py-2.5 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-1.5">
                    <Navigation size={16} className="text-primary" />
                    <span className="fw-bold text-dark small">Corridor Infrastructure Telemetry</span>
                  </div>
                  <Badge bg="primary" pill>
                    {activeCorridor.stations_count} Stations
                  </Badge>
                </Card.Header>

                <Card.Body className="p-3">
                  <Row className="g-2 text-center mb-3">
                    <Col xs={4}>
                      <div className="bg-light p-2 rounded border">
                        <div className="extra-small text-muted mb-0.5" style={{ fontSize: '0.68rem' }}>Total Distance</div>
                        <div className="fw-bold text-dark small">{activeCorridor.total_distance_km} km</div>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="bg-light p-2 rounded border">
                        <div className="extra-small text-muted mb-0.5" style={{ fontSize: '0.68rem' }}>Avg Run Time</div>
                        <div className="fw-bold text-primary small">
                          {(activeCorridor.avg_travel_time_mins / 60).toFixed(1)} hrs
                        </div>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="bg-light p-2 rounded border">
                        <div className="extra-small text-muted mb-0.5" style={{ fontSize: '0.68rem' }}>Crossing Trains</div>
                        <div className="fw-bold text-success small">{activeCorridor.trains_count} Trains</div>
                      </div>
                    </Col>
                  </Row>

                  {/* Stations Sequence Badges */}
                  <div className="extra-small text-muted fw-bold mb-1.5" style={{ fontSize: '0.72rem' }}>
                    Route Stations & Key Junctions:
                  </div>
                  <div className="d-flex flex-wrap gap-1 mb-2 custom-scrollbar" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {activeCorridor.stations.map((stn, idx) => (
                      <button
                        key={stn.code}
                        type="button"
                        onClick={() => setSelectedStationId(stn.code)}
                        className={`badge ${stn.is_junction ? 'bg-primary text-white' : 'bg-light text-dark border'} p-1.5 extra-small`}
                        style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                        title={`${stn.name} (${stn.distance_km} km)`}
                      >
                        {idx + 1}. {stn.name} ({stn.code})
                      </button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </Col>

        {/* Right Column: Timetable & Crossing Delays Impact */}
        <Col lg={7} md={12}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Header className="d-flex align-items-center justify-content-between bg-white border-bottom py-2.5">
              <div className="d-flex align-items-center gap-1.5">
                <Clock size={17} className="text-primary" />
                <span className="fw-bold text-dark">
                  {activeCorridor ? `Corridor Timetable: ${activeCorridor.from_station.name} ⇄ ${activeCorridor.to_station.name}` : 'Network Timetable & Delays'}
                </span>
              </div>
              <Badge bg="dark" pill>
                {affectedTrains.length + unaffectedTrains.length} Network Trains
              </Badge>
            </Card.Header>

            <Card.Body className="p-3 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
              <TrainImpactList
                affectedTrains={affectedTrains}
                unaffectedTrains={unaffectedTrains}
                selectedTrackId={selectedTrackId}
                network={network}
                scheduledBlocks={optimizationPlan}
                corridorTrainsByAsset={corridorTrainsByAsset}
                activeCorridor={activeCorridor}
                dispatchDirectives={dispatchDirectives}
                dispatchStats={dispatchStats}
                selectedPlanName={currentPlan?.name || 'Optimal Schedule'}
                onSelectStation={(stnCode) => setSelectedStationId(stnCode)}
                onSelectTrack={(trackId) => setSelectedTrackId(trackId)}
                onClearTrackFilter={() => {
                  setSelectedTrackId(null);
                  handleClearCorridor();
                }}
                onViewSchedule={(trainNum, trainName) => {
                  setSelectedTrainForSchedule({ number: trainNum, name: trainName });
                  setScheduleModalOpen(true);
                }}
                onTrackLiveTrain={handleTrackLiveTrain}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
