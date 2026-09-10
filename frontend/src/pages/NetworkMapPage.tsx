import React from 'react';
import { Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import {
  Train as TrainIcon,
  Maximize2,
  ShieldAlert,
  Navigation,
  CheckCircle,
  Play,
  MapPin,
  Search,
  X
} from 'lucide-react';
import { RailwayMap } from '../components/RailwayMap';
import { useRailway } from '../context/RailwayContext';

export const NetworkMapPage: React.FC = () => {
  const {
    network,
    networkMode,
    trains,
    maintenanceRequests,
    optimizationPlan,
    candidatePlans,
    selectedPlanId,
    affectedTrains,
    emergencyActive,
    emergencyAssetId,
    selectedStationId,
    selectedTrackId,
    selectedTrackDetails,
    activeCorridor,
    searchedLiveTrain,
    liveTrainSearchQuery,
    isFullScreenMap,
    showSimulation,
    setSelectedStationId,
    setSelectedTrackId,
    setShowEmergencyModal,
    setShowMaintenanceModal,
    setShowSimulation,
    setIsFullScreenMap,
    setLiveTrainSearchQuery,
    handleClearCorridor,
    handleTrackLiveTrain,
    handleClearLiveTrain,
    handleToggleNetworkMode
  } = useRailway();

  return (
    <div className={`d-flex flex-column ${isFullScreenMap ? 'p-0' : 'p-2'}`} style={{ height: 'calc(100vh - 65px)' }}>
      <Card className={`${isFullScreenMap ? 'fullscreen-map-overlay' : 'h-100 shadow-sm border-0 rounded-3'} d-flex flex-column`}>
        {!isFullScreenMap && (
          <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom py-2 px-3 flex-wrap gap-2">
            {/* Title & Status */}
            <div className="d-flex align-items-center gap-2">
              <TrainIcon size={18} className="text-primary" />
              <span className="fw-bold text-dark small">
                {activeCorridor
                  ? `Corridor Route: ${activeCorridor.from_station.name} ⇄ ${activeCorridor.to_station.name}`
                  : 'National Railway Network & Digital Twin Map'}
              </span>

              {emergencyActive ? (
                <Badge bg="danger" className="animate-pulse d-flex align-items-center px-2 py-1 extra-small">
                  <ShieldAlert size={12} className="me-1" /> TRACK FAILURE ACTIVE
                </Badge>
              ) : activeCorridor ? (
                <Badge bg="primary" className="d-flex align-items-center px-2 py-1 extra-small">
                  <Navigation size={12} className="me-1" /> CORRIDOR INSPECTOR ACTIVE
                </Badge>
              ) : optimizationPlan ? (
                <Badge bg="success" className="d-flex align-items-center px-2 py-1 extra-small">
                  <CheckCircle size={12} className="me-1" /> AI SCHEDULE OPTIMAL
                </Badge>
              ) : (
                <Badge bg="secondary" className="px-2 py-1 extra-small">
                  READY
                </Badge>
              )}
            </div>

            {/* Controls Bar: Live Search, Network Modes, Simulation, Fullscreen */}
            <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
              {/* Live Train Search */}
              <div style={{ width: '230px' }}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0 py-0 px-2">
                    <Search size={12} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    size="sm"
                    placeholder="Search Live Train #..."
                    value={liveTrainSearchQuery}
                    onChange={(e) => setLiveTrainSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTrackLiveTrain(liveTrainSearchQuery);
                    }}
                    className="border-start-0 ps-1 extra-small"
                    style={{ fontSize: '0.74rem' }}
                  />
                  {searchedLiveTrain && (
                    <Button variant="outline-secondary" size="sm" className="py-0 px-1.5" onClick={handleClearLiveTrain}>
                      <X size={12} />
                    </Button>
                  )}
                </InputGroup>
              </div>

              {/* Network Level Mode Switcher */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn btn-xs py-1 px-2 ${networkMode === 'major' ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => handleToggleNetworkMode('major')}
                >
                  Major Hubs
                </button>
                <button
                  type="button"
                  className={`btn btn-xs py-1 px-2 ${networkMode === 'hdn' ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => handleToggleNetworkMode('hdn')}
                >
                  HDN Corridors
                </button>
                <button
                  type="button"
                  className={`btn btn-xs py-1 px-2 ${networkMode === 'full' ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => handleToggleNetworkMode('full')}
                >
                  All India
                </button>
              </div>

              {/* Digital Twin Button */}
              <Button
                variant={showSimulation ? 'primary' : 'outline-primary'}
                size="sm"
                className={`py-1 px-2.5 d-flex align-items-center gap-1 extra-small ${showSimulation ? 'shadow-sm text-white fw-bold' : 'fw-semibold'}`}
                style={{ fontSize: '0.72rem' }}
                onClick={() => setShowSimulation((prev) => !prev)}
              >
                <Play size={11} fill={showSimulation ? 'currentColor' : 'none'} />
                <span>{showSimulation ? 'Simulation ON' : 'Digital Twin'}</span>
              </Button>

              {/* Fullscreen Button */}
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 d-flex align-items-center gap-1 extra-small"
                style={{ fontSize: '0.72rem' }}
                onClick={() => setIsFullScreenMap((prev) => !prev)}
              >
                <Maximize2 size={12} />
              </Button>
            </div>
          </Card.Header>
        )}

        {/* Selected Track Inspector Ribbon */}
        {selectedTrackDetails && (
          <div className="bg-light border-bottom px-3 py-1.5 d-flex align-items-center justify-content-between extra-small flex-wrap gap-2" style={{ fontSize: '0.78rem' }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <MapPin size={13} className="text-primary" />
              <span>
                Selected Track: <strong>{selectedTrackDetails.src?.name || selectedTrackDetails.edge.source} ⇄ {selectedTrackDetails.tgt?.name || selectedTrackDetails.edge.target}</strong> (<code>{selectedTrackDetails.edge.id}</code>)
              </span>
              <Badge bg="info" text="dark">
                {selectedTrackDetails.edge.travel_time_mins} mins
              </Badge>
              {selectedTrackDetails.isFailed && <Badge bg="danger">FAILED</Badge>}
              {selectedTrackDetails.scheduled && <Badge bg="warning" text="dark">BLOCK SCHEDULED</Badge>}
            </div>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button
                variant="outline-primary"
                size="sm"
                className="py-0 px-2 extra-small"
                style={{ fontSize: '0.72rem' }}
                onClick={() => setShowMaintenanceModal(true)}
              >
                Schedule Block
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="py-0 px-2 extra-small"
                style={{ fontSize: '0.72rem' }}
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

        {/* Leaflet Map Body */}
        <Card.Body className="p-0 flex-grow-1 position-relative">
          <RailwayMap
            network={network}
            maintenanceRequests={maintenanceRequests}
            trains={trains}
            optimizationPlan={optimizationPlan}
            candidatePlans={candidatePlans}
            selectedPlanId={selectedPlanId}
            affectedTrains={affectedTrains}
            emergencyActive={emergencyActive}
            emergencyAssetId={emergencyAssetId}
            selectedStationId={selectedStationId}
            selectedTrackId={selectedTrackId}
            networkMode={networkMode}
            activeCorridor={activeCorridor}
            searchedLiveTrain={searchedLiveTrain}
            isFullScreen={isFullScreenMap}
            showSimulation={showSimulation}
            onToggleSimulation={() => setShowSimulation((prev) => !prev)}
            onToggleFullScreen={() => setIsFullScreenMap((prev) => !prev)}
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
    </div>
  );
};
