import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Button, Dropdown, Modal, Form } from 'react-bootstrap';
import {
  Train as TrainIcon,
  MapPin,
  Settings,
  Radio,
  Navigation,
  Plus,
  ShieldAlert,
  LogOut,
  Globe2,
  Sliders,
  Menu,
  Info,
  Server
} from 'lucide-react';
import { useRailway } from '../context/RailwayContext';
import { useAuth, ZONES } from '../context/AuthContext';
import { getApiBaseUrl, setCustomApiUrl } from '../config';

export const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isHead, logout, switchZone, activeZone } = useAuth();
  const {
    maintenanceRequests,
    dispatchDirectives,
    setShowMaintenanceModal,
    setShowEmergencyModal
  } = useRailway();

  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());

  const isMap = location.pathname === '/' || location.pathname === '/map';
  const isPlanner = location.pathname === '/planner';
  const isDispatch = location.pathname === '/dispatch';
  const isCorridor = location.pathname === '/corridor';
  const isAbout = location.pathname === '/about';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="navbar-gov sticky-top py-1">
      <Container fluid className="px-2 px-md-3">

        {/* Left Section: Brand & Zonal/HQ Jurisdiction Badge */}
        <div className="d-flex align-items-center me-2">
          <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center py-0 me-2 text-decoration-none">
            <div
              className="bg-primary text-white rounded p-1 me-2 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
              style={{ width: '32px', height: '32px', backgroundColor: 'var(--gov-blue)' }}
            >
              <TrainIcon size={18} />
            </div>
            <div className="text-nowrap">
              <div className="fw-black text-uppercase lh-1" style={{ fontSize: '0.92rem', letterSpacing: '0.4px', color: 'var(--gov-blue)' }}>
                INDIAN RAILWAYS
              </div>
              <div className="fw-bold extra-small" style={{ fontSize: '0.62rem', letterSpacing: '0.2px', color: 'var(--gov-accent)' }}>
                RAIL-AI Portal
              </div>
            </div>
          </Navbar.Brand>

          {/* User Role & Operational Zone Switcher / Badge */}
          {user && (
            <div className="d-flex align-items-center border-start ps-2 text-nowrap">
              {isHead ? (
                <Dropdown align="start">
                  <Dropdown.Toggle
                    size="sm"
                    variant="outline-primary"
                    className="py-0 px-2 extra-small d-flex align-items-center gap-1 fw-bold"
                    style={{ fontSize: '0.7rem', height: '26px' }}
                  >
                    <Globe2 size={11} className="text-primary" />
                    <span>HQ: {activeZone === 'ALL' ? 'Pan-India' : activeZone}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow-lg border-0 extra-small" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Dropdown.Header className="extra-small fw-bold text-uppercase">Switch Command Zone</Dropdown.Header>
                    {ZONES.map((z) => (
                      <Dropdown.Item
                        key={z.code}
                        active={activeZone === z.code}
                        onClick={() => switchZone(z.code)}
                        className="extra-small py-1.5"
                      >
                        <strong>{z.code}</strong> — {z.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <span className="badge badge-soft-success extra-small py-1 px-2 d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                  <Sliders size={11} />
                  <span>ZONE: {user.assignedZone || 'CR'}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <Navbar.Toggle aria-controls="railway-navbar-nav" className="border-0 p-1 ms-auto d-lg-none">
          <Menu size={20} className="text-dark" />
        </Navbar.Toggle>

        {/* Responsive Navbar Content */}
        <Navbar.Collapse id="railway-navbar-nav" className="my-2 my-lg-0">
          
          {/* Center Section: Workspace Navigation Tabs */}
          <Nav className="nav-pills d-flex align-items-lg-center flex-column flex-lg-row text-nowrap gap-1 mx-auto my-2 my-lg-0">
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
              <span>AI Maintenance</span>
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
                  {dispatchDirectives.length}
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

            <NavLink
              to="/about"
              className={`nav-tab-pill ${isAbout ? 'active' : ''}`}
            >
              <Info size={13} />
              <span>About & Architecture</span>
            </NavLink>
          </Nav>

          {/* Right Section: Quick Action Controls & User Account */}
          <div className="d-flex align-items-center flex-wrap gap-1.5 ms-lg-2 pt-2 pt-lg-0 border-top border-lg-0">
            
            {/* Schedule Block Modal Trigger */}
            <Button
              variant="outline-primary"
              size="sm"
              className="py-1 px-2.5 d-flex align-items-center gap-1 extra-small text-nowrap"
              style={{ fontSize: '0.72rem', height: '30px' }}
              onClick={() => setShowMaintenanceModal(true)}
              title="Schedule Maintenance Block"
            >
              <Plus size={13} />
              <span>Block</span>
            </Button>

            {/* Emergency Track Failure Modal Trigger */}
            <Button
              variant="outline-danger"
              size="sm"
              className="py-1 px-2.5 d-flex align-items-center gap-1 extra-small text-nowrap"
              style={{ fontSize: '0.72rem', height: '30px' }}
              onClick={() => setShowEmergencyModal(true)}
              title="Simulate Track Failure & Detour"
            >
              <ShieldAlert size={13} />
              <span>Fail Track</span>
            </Button>

            {/* Backend Server Connection Settings Trigger */}
            <Button
              variant="outline-secondary"
              size="sm"
              className="py-1 px-2 d-flex align-items-center gap-1 extra-small text-nowrap"
              style={{ fontSize: '0.72rem', height: '30px' }}
              onClick={() => {
                setServerUrlInput(getApiBaseUrl());
                setShowServerModal(true);
              }}
              title="Backend Server Engine Connection"
            >
              <Server size={13} className="text-success" />
              <span className="d-none d-sm-inline">API</span>
            </Button>

            {/* User Profile Info & Logout */}
            {user && (
              <div className="d-flex align-items-center gap-1 border-start ps-2 ms-1">
                <div
                  className="d-flex flex-column text-end lh-1 cursor-default me-1"
                  title={`${user.displayName} - ${user.designation} (${user.email})`}
                >
                  <span className="fw-bold text-dark extra-small" style={{ fontSize: '0.72rem', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName.split(' ')[0]}
                  </span>
                  <span className="text-muted extra-small" style={{ fontSize: '0.6rem' }}>
                    {isHead ? 'Apex Head' : `${user.assignedZone} Op`}
                  </span>
                </div>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-1 px-2 d-flex align-items-center gap-1 extra-small text-danger border-0 hover-bg-light"
                  style={{ fontSize: '0.72rem', height: '30px' }}
                  onClick={handleLogout}
                  title={`Sign Out (${user.email})`}
                >
                  <LogOut size={13} />
                </Button>
              </div>
            )}

          </div>

        </Navbar.Collapse>

      </Container>

      {/* Backend API Engine Connection Modal */}
      <Modal show={showServerModal} onHide={() => setShowServerModal(false)} centered>
        <Modal.Header closeButton className="py-2.5 bg-light">
          <Modal.Title className="h6 mb-0 d-flex align-items-center gap-2">
            <Server size={18} className="text-primary" />
            <span className="fw-bold text-dark">Backend API Connection</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          <div className="mb-3 p-2.5 rounded border bg-light">
            <div className="extra-small text-muted mb-1">Active Backend URL:</div>
            <code className="text-primary fw-bold extra-small text-break">{getApiBaseUrl()}</code>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small text-dark">
              Render / Custom Backend URL:
            </Form.Label>
            <Form.Control
              type="url"
              size="sm"
              placeholder="e.g. https://your-app.onrender.com"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
            />
            <Form.Text className="extra-small text-muted">
              Enter your Render backend service URL (e.g., <code>https://rail-opt-backend.onrender.com</code>).
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="extra-small"
              onClick={() => {
                setCustomApiUrl('http://localhost:8000/api');
              }}
            >
              Reset to Localhost
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="light" size="sm" onClick={() => setShowServerModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCustomApiUrl(serverUrlInput);
            }}
          >
            Save & Connect
          </Button>
        </Modal.Footer>
      </Modal>
    </Navbar>
  );
};
