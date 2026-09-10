import { useState } from 'react';
import {
  Play,
  Pause,
  Clock,
  Sun,
  Moon,
  Zap,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Train as TrainIcon,
  X
} from 'lucide-react';

export interface TimeScrubberProps {
  simulatedMinutes: number; // 0 - 1439
  onSimulatedMinutesChange: (minutes: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number; // 1, 5, 15, 60
  onSpeedChange: (speed: number) => void;
  activeTrainsCount: number;
  activeBlocksCount: number;
  heldTrainsCount: number;
  isFullScreen?: boolean;
  onClose?: () => void;
}

export function TimeScrubberSlider({
  simulatedMinutes,
  onSimulatedMinutesChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  activeTrainsCount,
  activeBlocksCount,
  heldTrainsCount,
  isFullScreen = false,
  onClose,
}: TimeScrubberProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Convert minutes to HH:MM formatted string
  const formatTime = (minutes: number) => {
    const totalM = Math.floor(minutes) % 1440;
    const h = Math.floor(totalM / 60);
    const m = totalM % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const hh24 = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return {
      formatted12: `${displayH.toString().padStart(2, '0')}:${mm} ${period}`,
      formatted24: `${hh24}:${mm}`,
      hour: h,
      minute: m
    };
  };

  const { formatted12, formatted24, hour } = formatTime(simulatedMinutes);

  // Classify current simulation hour window
  const getWindowClassification = (h: number) => {
    if (h >= 0 && h < 5) {
      return {
        label: 'Night Shadow Window (00:00 - 05:00)',
        sublabel: 'Optimal Minimal-Disruption Maintenance Window',
        color: '#0284c7',
        badgeClass: 'badge-soft-primary',
        icon: <Moon size={13} className="text-primary" />,
        isOptimal: true,
        isWarning: false
      };
    }
    if (h >= 6 && h <= 10) {
      return {
        label: 'Morning Peak Window (06:30 - 10:30)',
        sublabel: 'Heavy Commuter & Express Traffic — Caution',
        color: '#d97706',
        badgeClass: 'badge-soft-warning',
        icon: <Flame size={13} className="text-warning" />,
        isOptimal: false,
        isWarning: true
      };
    }
    if (h >= 11 && h <= 15) {
      return {
        label: 'Afternoon Lull Window (11:00 - 15:00)',
        sublabel: 'Off-Peak Daylight Maintenance Window',
        color: '#16a34a',
        badgeClass: 'badge-soft-success',
        icon: <Sun size={13} className="text-success" />,
        isOptimal: true,
        isWarning: false
      };
    }
    if (h >= 17 && h <= 21) {
      return {
        label: 'Evening Peak Window (17:00 - 21:00)',
        sublabel: 'High Density Express Traffic — Avoid Blocks',
        color: '#dc2626',
        badgeClass: 'badge-soft-danger',
        icon: <AlertTriangle size={13} className="text-danger" />,
        isOptimal: false,
        isWarning: true
      };
    }
    return {
      label: 'Transition Window',
      sublabel: 'Moderate Traffic Flow',
      color: '#475569',
      badgeClass: 'badge-soft-dark',
      icon: <Clock size={13} className="text-secondary" />,
      isOptimal: false,
      isWarning: false
    };
  };

  const windowInfo = getWindowClassification(hour);

  const stepTime = (deltaMins: number) => {
    let next = (simulatedMinutes + deltaMins) % 1440;
    if (next < 0) next += 1440;
    onSimulatedMinutesChange(next);
  };

  const quickJumpPresets = [
    { label: 'Night Shadow', time: 150, timeLabel: '02:30 AM', icon: '🌙' },
    { label: 'Morning Peak', time: 510, timeLabel: '08:30 AM', icon: '🌅' },
    { label: 'Afternoon Lull', time: 780, timeLabel: '01:00 PM', icon: '☀️' },
    { label: 'Evening Peak', time: 1110, timeLabel: '06:30 PM', icon: '🌆' }
  ];

  return (
    <div
      className={`position-absolute bottom-0 start-50 translate-middle-x mb-3 w-100 px-3`}
      style={{
        zIndex: 1010,
        maxWidth: isFullScreen ? '1100px' : '940px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none'
      }}
    >
      <div
        className="card shadow-lg rounded-4 overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 12px 30px -5px rgba(10, 61, 98, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08)',
          borderTop: '3px solid var(--gov-accent)',
          pointerEvents: 'auto'
        }}
      >
        {/* Header Bar */}
        <div className="px-3 py-2 d-flex align-items-center justify-content-between bg-white border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div
              className="p-1 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{ background: 'var(--gov-blue-light)', width: '28px', height: '28px' }}
            >
              <Clock size={16} style={{ color: 'var(--gov-blue)' }} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fw-black text-uppercase tracking-wide" style={{ fontSize: '0.85rem', color: 'var(--gov-blue)', letterSpacing: '0.3px' }}>
                  24-Hour Digital Twin Simulation
                </span>
                <span className={`badge ${windowInfo.badgeClass} extra-small py-0.5 px-2 rounded-pill d-flex align-items-center gap-1`}>
                  {windowInfo.icon}
                  <span>{windowInfo.label}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Live Metrics at this simulated minute */}
            <div className="d-none d-md-flex align-items-center gap-2.5 me-2 extra-small">
              <span className="badge badge-soft-dark py-1 px-2 d-flex align-items-center gap-1">
                <TrainIcon size={12} className="text-primary" />
                <strong className="text-dark">{activeTrainsCount}</strong> Trains Active
              </span>
              
              <span className={`badge ${activeBlocksCount > 0 ? 'badge-soft-warning' : 'badge-soft-dark'} py-1 px-2 d-flex align-items-center gap-1`}>
                <ShieldAlert size={12} />
                <strong>{activeBlocksCount}</strong> Active Blocks
              </span>

              {heldTrainsCount > 0 && (
                <span className="badge badge-soft-danger py-1 px-2 d-flex align-items-center gap-1 fw-bold animate-pulse">
                  <AlertTriangle size={12} />
                  <span>{heldTrainsCount} Regulated / Held</span>
                </span>
              )}
            </div>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              className="btn btn-sm btn-light border py-0 px-2 rounded-pill text-dark hover-bg-light"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Minimize Scrubber' : 'Expand Scrubber'}
              style={{ height: '26px' }}
            >
              {isExpanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>

            {/* Close Simulation Button */}
            {onClose && (
              <button
                type="button"
                className="btn btn-sm btn-light border py-0 px-1.5 rounded-circle text-danger hover-bg-light ms-1"
                onClick={onClose}
                title="Exit Digital Twin Simulation"
                style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Control Body */}
        {isExpanded && (
          <div className="p-3 bg-white">
            {/* Clock & Playback Ribbon */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5 mb-2.5">
              {/* Big Digital Clock Display */}
              <div className="d-flex align-items-baseline gap-2">
                <span
                  className="font-monospace fw-black"
                  style={{ fontSize: '1.5rem', letterSpacing: '1px', color: 'var(--gov-blue)' }}
                >
                  {formatted12}
                </span>
                <span className="text-muted extra-small fw-semibold">({formatted24} IST)</span>
                <span className="text-secondary extra-small ms-1 d-none d-sm-inline">
                  — {windowInfo.sublabel}
                </span>
              </div>

              {/* Playback Controls & Speed Multipliers */}
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                {/* Step Back Buttons */}
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-1 px-2 rounded-2 extra-small fw-bold"
                  onClick={() => stepTime(-60)}
                  title="Jump Back 1 Hour"
                >
                  -1h
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-1 px-2 rounded-2 extra-small fw-bold"
                  onClick={() => stepTime(-15)}
                  title="Jump Back 15 Minutes"
                >
                  -15m
                </button>

                {/* Main Play / Pause Button */}
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-1 rounded-pill fw-bold d-flex align-items-center gap-1.5 shadow-sm ${
                    isPlaying ? 'btn-danger' : 'btn-primary'
                  }`}
                  onClick={onTogglePlay}
                  style={{
                    minWidth: '110px',
                    justifyContent: 'center',
                    backgroundColor: isPlaying ? '#dc2626' : 'var(--gov-blue)',
                    borderColor: isPlaying ? '#dc2626' : 'var(--gov-blue)',
                    fontSize: '0.8rem'
                  }}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={14} /> Pause Simulation
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" /> Run Simulation
                    </>
                  )}
                </button>

                {/* Step Forward Buttons */}
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-1 px-2 rounded-2 extra-small fw-bold"
                  onClick={() => stepTime(15)}
                  title="Advance 15 Minutes"
                >
                  +15m
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-1 px-2 rounded-2 extra-small fw-bold"
                  onClick={() => stepTime(60)}
                  title="Advance 1 Hour"
                >
                  +1h
                </button>

                {/* Speed Multipliers */}
                <div className="btn-group btn-group-sm ms-1.5" role="group">
                  {[1, 5, 15, 60].map(spd => (
                    <button
                      key={spd}
                      type="button"
                      className={`btn btn-xs py-1 px-2 extra-small fw-bold ${
                        playbackSpeed === spd
                          ? 'btn-primary text-white shadow-sm'
                          : 'btn-outline-secondary text-dark'
                      }`}
                      style={playbackSpeed === spd ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}}
                      onClick={() => onSpeedChange(spd)}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive 24-Hour Slider */}
            <div className="position-relative py-1">
              <input
                type="range"
                className="form-range custom-simulation-range w-100"
                min="0"
                max="1439"
                step="1"
                value={simulatedMinutes}
                onChange={e => onSimulatedMinutesChange(Number(e.target.value))}
                style={{
                  height: '8px',
                  cursor: 'pointer',
                  accentColor: 'var(--gov-blue)'
                }}
              />

              {/* Hour Ticks & Zone Legend */}
              <div className="d-flex justify-content-between text-muted extra-small mt-1 px-1 font-monospace fw-bold" style={{ fontSize: '0.68rem' }}>
                <span style={{ color: '#0284c7' }}>00:00 (Night Shadow)</span>
                <span>04:00</span>
                <span style={{ color: '#d97706' }}>08:00 (Morning Rush)</span>
                <span style={{ color: '#16a34a' }}>12:00 (Afternoon Lull)</span>
                <span>16:00</span>
                <span style={{ color: '#dc2626' }}>19:00 (Evening Rush)</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Quick Preset Jumps */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-2 border-top extra-small">
              <span className="text-dark fw-bold d-flex align-items-center gap-1">
                <Zap size={13} className="text-warning" />
                <span>Quick-Jump Operational Windows:</span>
              </span>
              <div className="d-flex flex-wrap gap-1.5">
                {quickJumpPresets.map(preset => {
                  const isCurrent = Math.abs(simulatedMinutes - preset.time) < 45;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className={`btn btn-xs py-1 px-2.5 rounded-pill extra-small border ${
                        isCurrent
                          ? 'btn-primary text-white fw-bold shadow-sm'
                          : 'btn-light text-dark bg-white border'
                      }`}
                      style={isCurrent ? { backgroundColor: 'var(--gov-blue)', borderColor: 'var(--gov-blue)' } : {}}
                      onClick={() => onSimulatedMinutesChange(preset.time)}
                    >
                      <span className="me-1">{preset.icon}</span>
                      <span>{preset.label}</span>
                      <span className={isCurrent ? 'text-white-50 ms-1' : 'text-muted ms-1'}>
                        ({preset.timeLabel})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
