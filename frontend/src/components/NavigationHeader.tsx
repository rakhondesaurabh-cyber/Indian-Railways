import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import {
  Train as TrainIcon,
  MapPin,
  Settings,
  Radio,
  Navigation,
  Play,
  Plus,
  ShieldAlert,
  Zap,
  Activity
} from 'lucide-react';
import { useRailway } from '../context/RailwayContext';

export const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const {
    trains,
    maintenanceRequests,
    dispatchDirectives,
    dispatchStats,
    emergencyActive,
    showSimulation,
    setShowSimulation,
    setShowMaintenanceModal,
    setShowEmergencyModal,
    handleOptimize,
    loading
  } = useRailway();

  const isMap = location.pathname === '/' || location.pathname === '/map';
  const isPlanner = location.pathname === '/planner';
  const isDispatch = location.pathname === '/dispatch';
  const isCorridor = location.pathname === '/corridor';

  const totalSaved = dispatchStats?.total_delay_saved_mins ?? dispatchDirectives.reduce((sum, d) => sum + (d.delay_saved_mins || 0), 0);

  return (
    <Navbar className="navbar-gov sticky-top">
      <Container fluid className="px-2 d-flex align-items-center justify-content-between flex-nowrap h-100">
        
        {/* Left Section: Brand & Compact Live Telemetry Strip */}
        <div className="d-flex align-items-center flex-nowrap flex-shrink-0 me-3">
          <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center py-0 me-2 text-decoration-none">
            <div className="bg-primary text-white rounded p-1 me-2 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '32px', height: '32px' }}>
              <TrainIcon size={18} />
            </div>
            <div className="text-nowrap">
              <div className="fw-black text-dark text-uppercase lh-1" style={{ fontSize: '0.92rem', letterSpacing: '0.4px' }}>
                INDIAN RAILWAYS
              </div>
              <div className="text-primary fw-bold extra-small" style={{ fontSize: '0.62rem', letterSpacing: '0.2px' }}>
                RAIL-AI Portal
              </div>
            </div>
          </Navbar.Brand>

          {/* Compact Telemetry Badges (Single-line, non-breaking) */}
          <div className="d-none d-xl-flex align-items-center gap-1.5 border-start ps-2 text-nowrap flex-nowrap">
            <span className="badge bg-light text-dark border extra-small py-1 px-2 d-flex align-items-center gap-1">
              <span className="badge bg-success rounded-circle p-0" style={{ width: '5px', height: '5px' }}></span>
              HQ / Central
            </span>

            <span className="badge bg-light text-dark border extra-small py-1 px-2 d-flex align-items-center gap-1">
              <Activity size={10} className="text-primary" />
              {trains.length > 0 ? `${trains.length} Trains` : '1,840 Trains'}
            </span>

            {maintenanceRequests.length > 0 && (
              <span className="badge bg-warning text-dark border extra-small py-1 px-2">
                {maintenanceRequests.length} Block{maintenanceRequests.length > 1 ? 's' : ''}
              </span>
            )}

            {totalSaved > 0 && (
              <span className="badge bg-success extra-small py-1 px-2 d-flex align-items-center gap-1">
                <Zap size={10} /> +{totalSaved}m Saved
              </span>
            )}

            {emergencyActive && (
              <span className="badge bg-danger animate-pulse extra-small py-1 px-2 d-flex align-items-center gap-1">
                <ShieldAlert size={10} /> Failed
              </span>
            )}
          </div>
        </div>

        {/* Center Section: Workspace Navigation Tabs (Fixed size, single line, no wrapping) */}
        <Nav className="nav-pills d-flex align-items-center flex-nowrap text-nowrap gap-1 mx-auto flex-shrink-0">
          <NavLink
            to="/"
            className={`nav-tab-pill ${isMap ? 'active' : ''}`}
          >
            <MapPin size={13} />
            <span>GIS Network & Twin</span>
          </NavLink>

          <NavLink
            to="/planner"
            className={`nav-tab-pill ${isPlanner ? 'active' : ''}`}
          >
            <Settings size={13} />
            <span>AI Maintenance Planner</span>
            {maintenanceRequests.length > 0 && (
              <span className={`badge rounded-pill ${isPlanner ? 'bg-light text-dark' : 'bg-primary text-white'}`} style={{ fontSize: '0.62rem', padding: '2px 5px' }}>
                {maintenanceRequests.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/dispatch"
            className={`nav-tab-pill ${isDispatch ? 'active' : ''}`}
          >
            <Radio size={13} />
            <span>Dispatch Desk</span>
            {dispatchDirectives && dispatchDirectives.length > 0 && (
              <span className={`badge rounded-pill ${isDispatch ? 'bg-light text-danger' : 'bg-danger text-white animate-pulse'}`} style={{ fontSize: '0.62rem', padding: '2px 5px' }}>
                {dispatchDirectives.length} Orders
              </span>
            )}
          </NavLink>

          <NavLink
            to="/corridor"
            className={`nav-tab-pill ${isCorridor ? 'active' : ''}`}
          >
            <Navigation size={13} />
            <span>Corridor Explorer</span>
          </NavLink>
        </Nav>

        {/* Right Section: Action Controls (Fixed size, single line) */}
        <div className="d-flex align-items-center gap-1.5 flex-nowrap text-nowrap flex-shrink-0 ms-3">
          <Button
            variant={showSimulation ? "info" : "outline-primary"}
            size="sm"
            className={`py-1 px-2 d-flex align-items-center gap-1 extra-small text-nowrap ${showSimulation ? 'text-dark fw-bold shadow-sm' : ''}`}
            style={{ fontSize: '0.72rem', height: '30px' }}
            onClick={() => setShowSimulation((prev) => !prev)}
            title="Toggle 24-Hour Digital Twin Simulation Scrubber"
          >
            <Play size={11} fill={showSimulation ? 'currentColor' : 'none'} />
            <span>{showSimulation ? 'Simulation ON' : 'Digital Twin'}</span>
          </Button>

          <Button
            variant="outline-primary"
            size="sm"
            className="py-1 px-2 d-flex align-items-center gap-1 extra-small text-nowrap"
            style={{ fontSize: '0.72rem', height: '30px' }}
            onClick={() => setShowMaintenanceModal(true)}
          >
            <Plus size={12} />
            <span>Schedule Block</span>
          </Button>

          <Button
            variant="outline-danger"
            size="sm"
            className="py-1 px-2 d-flex align-items-center gap-1 extra-small text-nowrap"
            style={{ fontSize: '0.72rem', height: '30px' }}
            onClick={() => setShowEmergencyModal(true)}
          >
            <ShieldAlert size={12} />
            <span>Fail Track</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="py-1 px-2.5 d-flex align-items-center gap-1 extra-small fw-bold shadow-sm text-nowrap"
            style={{ fontSize: '0.72rem', height: '30px' }}
            onClick={handleOptimize}
            disabled={loading}
          >
            <Zap size={12} />
            <span>{loading ? 'Optimizing...' : 'Run AI'}</span>
          </Button>
        </div>

      </Container>
    </Navbar>
  );
};
