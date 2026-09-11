import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Train as TrainIcon,
  Globe2,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AuthPortalPage: React.FC = () => {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
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
          displayName || 'Head of Indian Railways',
          'HEAD',
          'ALL',
          designation || 'Apex Operations Director',
          'National Rail Operations Center (Rail Bhavan)'
        );
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-gov-bg">
      
      {/* Top Government Navbar matching Website Header */}
      <header className="navbar-gov d-flex align-items-center justify-content-between px-3 px-md-4 py-2 shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <div 
            className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center shadow-sm" 
            style={{ width: '34px', height: '34px', backgroundColor: 'var(--gov-blue)' }}
          >
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

      {/* Main Centered Login Section */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-4">
        <div className="w-100" style={{ maxWidth: '480px' }}>
          
          {/* Centered Government Card */}
          <div className="card border-0 shadow-lg rounded-3 overflow-hidden bg-white">
            
            {/* Top Identity Header */}
            <div 
              className="p-4 text-white position-relative"
              style={{ 
                background: 'linear-gradient(135deg, #0f2042 0%, #1e3a8a 100%)',
                borderBottom: '3px solid var(--gov-accent)'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center shadow"
                  style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}
                >
                  <Globe2 size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="fw-black text-white mb-0" style={{ fontSize: '1.35rem', letterSpacing: '-0.3px' }}>
                    Head of Indian Railways
                  </h3>
                  <div className="text-white text-opacity-75 extra-small">
                    Apex HQ / Railway Board • Rail Bhavan, New Delhi
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body p-4">

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger py-2 px-3 extra-small d-flex align-items-center gap-2 my-3">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mode Toggle (Sign In / Register) */}
              <div className="d-flex justify-content-center mb-3">
                <div className="btn-group btn-group-sm p-1 bg-light rounded-pill border">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${mode === 'login' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`}
                    style={{ fontSize: '0.75rem', ...(mode === 'login' ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}) }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${mode === 'signup' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`}
                    style={{ fontSize: '0.75rem', ...(mode === 'signup' ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}) }}
                  >
                    Register Officer
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                        <User size={12} className="text-primary" />
                        <span>Officer Full Name</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-white text-dark border py-2"
                        placeholder="e.g. Shri Amitabh Sharma"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label extra-small text-dark fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                        <Building size={12} className="text-primary" />
                        <span>Apex Designation</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-white text-dark border py-2"
                        placeholder="e.g. Member (Operations) / CEO Railway Board"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>
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
                    placeholder="chairman.railboard@gov.in"
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
                  className="btn w-100 py-2.5 fw-bold text-white shadow-sm mt-1 d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' }}
                >
                  {loading ? (
                    <span>Authenticating Officer...</span>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>{mode === 'login' ? 'Sign In as Head of Indian Railways' : 'Register & Authorize Apex Desk'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Security Clearance Footer */}
              <div className="d-flex align-items-center justify-content-center gap-2 mt-4 pt-3 border-top text-muted extra-small text-center">
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                <span>
                  CRIS RailNet Security Level 5 • Authorized for Apex HQ & SIH Evaluation.
                </span>
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
