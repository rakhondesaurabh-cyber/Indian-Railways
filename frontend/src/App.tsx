import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RailwayProvider, useRailway } from './context/RailwayContext';
import { NavigationHeader } from './components/NavigationHeader';
import { AuthPortalPage } from './pages/AuthPortalPage';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { MaintenancePlannerPage } from './pages/MaintenancePlannerPage';
import { DispatchDeskPage } from './pages/DispatchDeskPage';
import { CorridorExplorerPage } from './pages/CorridorExplorerPage';
import { AboutUsPage } from './pages/AboutUsPage';
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

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Authenticating Officer...</span>
        </div>
        <div className="fw-bold fs-5">Authenticating Rail Officer Credentials...</div>
        <div className="text-muted extra-small mt-1">Connecting to Indian Railways Operations Desk</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Authenticated Main App Layout
function AppLayout() {
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
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <GlobalModals />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RailwayProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<AuthPortalPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </RailwayProvider>
    </AuthProvider>
  );
}
