import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ZONES } from '../context/AuthContext';
import type { UserRole } from '../types';
import {
  ShieldCheck,
  Train as TrainIcon,
  Globe2,
  Sliders,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export const AuthPortalPage: React.FC = () => {
  const { login, signup, loginDemoUser, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('HEAD');
  const [selectedZone, setSelectedZone] = useState<string>('CR');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [sectionName, setSectionName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(
          email,
          password,
          displayName || (selectedRole === 'HEAD' ? 'Railway Board Officer' : 'Section Controller'),
          selectedRole,
          selectedRole === 'HEAD' ? 'ALL' : selectedZone,
          designation || (selectedRole === 'HEAD' ? 'Apex Operations Director' : `${selectedZone} Section Controller`),
          sectionName || (selectedRole === 'HEAD' ? 'National Rail Control Center' : `${selectedZone} Divisional Desk`)
        );
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again or use 1-Click Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: UserRole, zone?: string) => {
    loginDemoUser(role, zone);
    navigate('/');
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-gov-bg">
      
      {/* Top Government Navbar matching Website Header */}
      <header className="navbar-gov d-flex align-items-center justify-content-between px-3 px-md-4">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '34px', height: '34px', backgroundColor: 'var(--gov-blue)' }}>
            <TrainIcon size={20} />
          </div>
          <div>
            <div className="fw-black text-uppercase lh-1" style={{ fontSize: '0.98rem', letterSpacing: '0.5px', color: 'var(--gov-blue)' }}>
              INDIAN RAILWAYS
            </div>
            <div className="fw-bold extra-small" style={{ fontSize: '0.65rem', color: 'var(--gov-accent)', letterSpacing: '0.3px' }}>
              RAIL-AI Operational Management System
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border extra-small py-1 px-2.5 d-flex align-items-center gap-1.5 shadow-sm">
            <span className="badge bg-success rounded-circle p-0" style={{ width: '6px', height: '6px' }}></span>
            <span className="text-secondary fw-semibold">CRIS Engine v2.4:</span>
            <strong className="text-success">ONLINE</strong>
          </span>
        </div>
      </header>

      {/* Main Dual Portal Content Area */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-4">
        <div className="container" style={{ maxWidth: '1140px' }}>
          
          {/* Section Hero Banner */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border border-primary border-opacity-25 text-primary extra-small fw-bold mb-2 shadow-sm">
              <Sparkles size={13} className="text-warning" />
              <span>ROLE-BASED ACCESS CONTROL (RBAC) PORTAL</span>
            </div>
            <h2 className="fw-black text-dark mb-1" style={{ fontSize: '1.75rem', letterSpacing: '-0.4px', color: 'var(--gov-blue)' }}>
              Rail Operations Command & Control Gateway
            </h2>
            <p className="text-muted small mb-0" style={{ maxWidth: '680px', margin: '0 auto' }}>
              Select your operational jurisdiction to access the <strong>Apex National Rail Desk (Head of IR)</strong> or your designated <strong>Zonal Section Control Office</strong>.
            </p>
          </div>

          <div className="row g-4 justify-content-center align-items-stretch">
            
            {/* Left Card: 1-Click Instant Demo Portals (For SIH Jury & Quick Evaluation) */}
            <div className="col-12 col-lg-5">
              <div className="card h-100 border-0 shadow-sm">
                
                <div className="card-header bg-white border-bottom py-3 px-3.5 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2 text-dark fw-bold small text-uppercase">
                    <Zap size={16} className="text-warning" />
                    <span style={{ color: 'var(--gov-blue)' }}>1-Click Evaluation Profiles</span>
                  </div>
                  <span className="badge bg-warning bg-opacity-20 text-dark border border-warning border-opacity-30 extra-small px-2 py-0.5 fw-bold">
                    SIH JURY READY
                  </span>
                </div>

                <div className="card-body p-3.5 d-flex flex-column gap-2.5">
                  <p className="text-muted extra-small mb-1">
                    Select a pre-configured officer role to instantly test zonal filtering, GIS network views, and AI dispatching:
                  </p>

                  {/* Profile 1: Head of Indian Railways */}
                  <div 
                    onClick={() => handleDemoLogin('HEAD')}
                    className="p-3 rounded-3 border bg-light bg-opacity-50 hover-lift cursor-pointer transition-all border-primary border-opacity-30"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease', borderLeft: '4px solid var(--gov-blue)' }}
                  >
                    <div className="d-flex align-items-start justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div className="text-white p-1.5 rounded-2 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--gov-blue)', width: '32px', height: '32px' }}>
                          <Globe2 size={18} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark fs-6 lh-1">Head of Indian Railways</div>
                          <div className="text-muted extra-small mt-0.5">Apex HQ / Railway Board (New Delhi)</div>
                        </div>
                      </div>
                      <span className="badge text-white extra-small" style={{ backgroundColor: 'var(--gov-blue)' }}>PAN-INDIA</span>
                    </div>
                    <p className="text-secondary extra-small mb-2" style={{ fontSize: '0.74rem' }}>
                      Full national network visibility, pan-India AI congestion forecasting, cross-zonal freight corridors & macro metrics.
                    </p>
                    <div className="d-flex align-items-center fw-bold extra-small gap-1" style={{ color: 'var(--gov-blue)' }}>
                      <span>Launch HQ Command Center</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Profile 2: Operator - Central Railway (CR) */}
                  <div 
                    onClick={() => handleDemoLogin('OPERATOR', 'CR')}
                    className="p-3 rounded-3 border bg-light bg-opacity-50 hover-lift cursor-pointer transition-all"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease', borderLeft: '4px solid #16a34a' }}
                  >
                    <div className="d-flex align-items-start justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-success text-white p-1.5 rounded-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <Sliders size={18} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark fs-6 lh-1">Operator — Central Railway</div>
                          <div className="text-muted extra-small mt-0.5">Mumbai CST, Itarsi & Nagpur Corridor</div>
                        </div>
                      </div>
                      <span className="badge bg-success text-white extra-small">ZONE: CR</span>
                    </div>
                    <p className="text-secondary extra-small mb-2" style={{ fontSize: '0.74rem' }}>
                      Section controller co-pilot, local loop-line precedence directives, S&T block scheduling & emergency detour overrides.
                    </p>
                    <div className="d-flex align-items-center text-success fw-bold extra-small gap-1">
                      <span>Launch Central Railway Desk</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Profile 3: Operator - Northern Railway (NR) */}
                  <div 
                    onClick={() => handleDemoLogin('OPERATOR', 'NR')}
                    className="p-3 rounded-3 border bg-light bg-opacity-50 hover-lift cursor-pointer transition-all"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease', borderLeft: '4px solid #0284c7' }}
                  >
                    <div className="d-flex align-items-start justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div className="text-white p-1.5 rounded-2 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0284c7', width: '32px', height: '32px' }}>
                          <Activity size={18} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark fs-6 lh-1">Operator — Northern Railway</div>
                          <div className="text-muted extra-small mt-0.5">Delhi, Ambala & Lucknow Corridor</div>
                        </div>
                      </div>
                      <span className="badge text-white extra-small" style={{ backgroundColor: '#0284c7' }}>ZONE: NR</span>
                    </div>
                    <p className="text-secondary extra-small mb-2" style={{ fontSize: '0.74rem' }}>
                      Northern high-density passenger trunk dispatching, Vande Bharat punctuality priority & interlocking track blocks.
                    </p>
                    <div className="d-flex align-items-center fw-bold extra-small gap-1" style={{ color: '#0284c7' }}>
                      <span>Launch Northern Railway Desk</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Profile 4: Operator - Western Railway (WR) */}
                  <div 
                    onClick={() => handleDemoLogin('OPERATOR', 'WR')}
                    className="p-3 rounded-3 border bg-light bg-opacity-50 hover-lift cursor-pointer transition-all"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease', borderLeft: '4px solid var(--gov-accent)' }}
                  >
                    <div className="d-flex align-items-start justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div className="text-white p-1.5 rounded-2 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--gov-accent)', width: '32px', height: '32px' }}>
                          <TrainIcon size={18} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark fs-6 lh-1">Operator — Western Railway</div>
                          <div className="text-muted extra-small mt-0.5">Mumbai Central & Ahmedabad DFC Track</div>
                        </div>
                      </div>
                      <span className="badge text-white extra-small" style={{ backgroundColor: 'var(--gov-accent)' }}>ZONE: WR</span>
                    </div>
                    <div className="d-flex align-items-center fw-bold extra-small gap-1 mt-1" style={{ color: 'var(--gov-accent)' }}>
                      <span>Launch Western Railway Desk</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Card: Official Officer Authentication Portal */}
            <div className="col-12 col-lg-7">
              <div className="card h-100 border-0 shadow-sm">
                
                {/* Header with Mode Switcher */}
                <div className="card-header bg-white border-bottom p-4">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <ShieldCheck size={20} className="text-primary" />
                      <span className="fw-bold text-dark fs-6">Official Officer Authentication</span>
                    </div>
                    
                    <div className="btn-group btn-group-sm p-1 bg-light rounded-pill border">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className={`btn btn-sm rounded-pill px-3 py-1 ${mode === 'login' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`}
                        style={{ fontSize: '0.78rem', ...(mode === 'login' ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}) }}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className={`btn btn-sm rounded-pill px-3 py-1 ${mode === 'signup' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`}
                        style={{ fontSize: '0.78rem', ...(mode === 'signup' ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}) }}
                      >
                        Register Officer
                      </button>
                    </div>
                  </div>

                  {/* Role Switcher Cards */}
                  <div className="row g-2">
                    <div className="col-6">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('HEAD')}
                        className={`btn w-100 p-2.5 text-start rounded-3 border d-flex align-items-center gap-2 transition-all ${
                          selectedRole === 'HEAD'
                            ? 'btn-primary text-white shadow-sm'
                            : 'btn-light bg-white text-dark border'
                        }`}
                        style={selectedRole === 'HEAD' ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}}
                      >
                        <Globe2 size={18} className={selectedRole === 'HEAD' ? 'text-white' : 'text-primary'} />
                        <div>
                          <div className="fw-bold extra-small lh-1">HEAD OF RAILWAYS</div>
                          <div className={`extra-small ${selectedRole === 'HEAD' ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                            All-India Apex HQ
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="col-6">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('OPERATOR')}
                        className={`btn w-100 p-2.5 text-start rounded-3 border d-flex align-items-center gap-2 transition-all ${
                          selectedRole === 'OPERATOR'
                            ? 'btn-success text-white shadow-sm'
                            : 'btn-light bg-white text-dark border'
                        }`}
                      >
                        <Sliders size={18} className={selectedRole === 'OPERATOR' ? 'text-white' : 'text-success'} />
                        <div>
                          <div className="fw-bold extra-small lh-1">SECTION OPERATOR</div>
                          <div className={`extra-small ${selectedRole === 'OPERATOR' ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                            Zonal Desk Control
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Body */}
                <div className="card-body p-4">
                  {error && (
                    <div className="alert alert-danger py-2 px-3 extra-small d-flex align-items-center gap-2 mb-3">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                    
                    {/* Zone Dropdown (for Operator) */}
                    {selectedRole === 'OPERATOR' && (
                      <div>
                        <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                          <Building size={12} className="text-primary" />
                          <span>Assigned Railway Zone / Jurisdiction</span>
                        </label>
                        <select
                          className="form-select form-select-sm bg-white text-dark border py-2"
                          value={selectedZone}
                          onChange={(e) => setSelectedZone(e.target.value)}
                          required
                        >
                          {ZONES.filter(z => !z.isHeadOnly).map((z) => (
                            <option key={z.code} value={z.code}>
                              {z.code} — {z.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {mode === 'signup' && (
                      <>
                        <div className="row g-2">
                          <div className="col-12 col-md-6">
                            <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                              <User size={12} className="text-primary" />
                              <span>Officer Full Name</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm bg-white text-dark border py-2"
                              placeholder="e.g. S. K. Mukherjee"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                              <Building size={12} className="text-primary" />
                              <span>Official Designation</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm bg-white text-dark border py-2"
                              placeholder={selectedRole === 'HEAD' ? 'Principal Executive Director' : 'Chief Section Controller'}
                              value={designation}
                              onChange={(e) => setDesignation(e.target.value)}
                            />
                          </div>
                        </div>

                        {selectedRole === 'OPERATOR' && (
                          <div>
                            <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                              <Sliders size={12} className="text-primary" />
                              <span>Operating Division / Section</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm bg-white text-dark border py-2"
                              placeholder="e.g. Bhusawal - Itarsi Quad Section Desk"
                              value={sectionName}
                              onChange={(e) => setSectionName(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Email Input */}
                    <div>
                      <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                        <Mail size={12} className="text-primary" />
                        <span>Official Railnet / Gov Email Address</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-sm bg-white text-dark border py-2"
                        placeholder={selectedRole === 'HEAD' ? 'head.operations@railboard.gov.in' : `controller.${selectedZone.toLowerCase()}@railnet.gov.in`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                        <Lock size={12} className="text-primary" />
                        <span>Security Password</span>
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-sm bg-white text-dark border py-2"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`btn w-100 py-2.5 fw-bold text-white shadow-sm mt-2 d-flex align-items-center justify-content-center gap-2 ${
                        selectedRole === 'HEAD' ? 'btn-primary' : 'btn-success'
                      }`}
                      style={selectedRole === 'HEAD' ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}}
                    >
                      {loading ? (
                        <span>Authenticating Officer...</span>
                      ) : (
                        <>
                          <span>{mode === 'login' ? 'Access Operations Desk' : 'Register & Authorize Desk'}</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Security Clearance Footer */}
                  <div className="d-flex align-items-center gap-2 mt-4 pt-3 border-top text-muted extra-small">
                    <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                    <span>
                      Authorized for Ministry of Railways, Zonal Control Offices & SIH 2024 Evaluation.
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Government Footer */}
      <footer className="border-top py-2.5 px-4 bg-white text-center text-muted extra-small shadow-sm">
        <span>© 2026 Ministry of Railways & Centre for Railway Information Systems (CRIS) | Intelligent Traffic Management System (ITMS)</span>
      </footer>

    </div>
  );
};
