import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RailwayProvider, useRailway } from './context/RailwayContext';
import { NavigationHeader } from './components/NavigationHeader';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { MaintenancePlannerPage } from './pages/MaintenancePlannerPage';
import { DispatchDeskPage } from './pages/DispatchDeskPage';
import { CorridorExplorerPage } from './pages/CorridorExplorerPage';
import { EmergencyModal } from './components/EmergencyModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { TrainScheduleModal } from './components/TrainScheduleModal';

// Modal and Global Overlay Container
const GlobalModals: React.FC = () => {
  const {
    network,
    selectedTrackId,
    showEmergencyModal,
    showMaintenanceModal,
    scheduleModalOpen,
    selectedTrainForSchedule,
    loading,
    setShowEmergencyModal,
    setShowMaintenanceModal,
    setScheduleModalOpen,
    setSelectedTrainForSchedule,
    handleEmergencySubmit,
    handleMaintenanceSubmit,
  } = useRailway();

  return (
    <>
      {/* Emergency Track Failure Injection Modal */}
      <EmergencyModal
        show={showEmergencyModal}
        onHide={() => setShowEmergencyModal(false)}
        network={network}
        selectedTrackId={selectedTrackId}
        onSubmit={handleEmergencySubmit}
        loading={loading}
      />

      {/* Planned Maintenance Scheduling Modal */}
      <MaintenanceModal
        show={showMaintenanceModal}
        onHide={() => setShowMaintenanceModal(false)}
        network={network}
        selectedTrackId={selectedTrackId}
        onSubmit={handleMaintenanceSubmit}
        loading={loading}
      />

      {/* Live Train Route Schedule Modal */}
      <TrainScheduleModal
        show={scheduleModalOpen}
        onHide={() => {
          setScheduleModalOpen(false);
          setSelectedTrainForSchedule(null);
        }}
        trainNumber={selectedTrainForSchedule?.number || null}
        trainName={selectedTrainForSchedule?.name}
      />
    </>
  );
};

// Main App Layout
function AppContent() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-gov-bg">
      <NavigationHeader />
      <main className="flex-grow-1 position-relative">
        <Routes>
          <Route path="/" element={<NetworkMapPage />} />
          <Route path="/map" element={<NetworkMapPage />} />
          <Route path="/planner" element={<MaintenancePlannerPage />} />
          <Route path="/dispatch" element={<DispatchDeskPage />} />
          <Route path="/corridor" element={<CorridorExplorerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <GlobalModals />
    </div>
  );
}

export default function App() {
  return (
    <RailwayProvider>
      <Router>
        <AppContent />
      </Router>
    </RailwayProvider>
  );
}
