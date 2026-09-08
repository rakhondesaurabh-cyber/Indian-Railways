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
        sublabel: 'Optimal Minimal-Disruption Maintenance Slot',
        color: '#0284c7', // Sky Blue
        badgeBg: 'bg-info',
        icon: <Moon size={14} className="text-info" />,
        isOptimal: true,
        isWarning: false
      };
    }
    if (h >= 6 && h <= 10) {
      return {
        label: 'Morning Peak Window (06:30 - 10:30)',
        sublabel: 'Heavy Commuter & Express Traffic — Avoid Blocks',
        color: '#ea580c', // Orange
        badgeBg: 'bg-warning text-dark',
        icon: <Flame size={14} className="text-danger" />,
        isOptimal: false,
        isWarning: true
      };
    }
    if (h >= 11 && h <= 15) {
      return {
        label: 'Afternoon Lull Window (11:00 - 15:00)',
        sublabel: 'Off-Peak Daylight Maintenance Window',
        color: '#16a34a', // Emerald Green
        badgeBg: 'bg-success',
        icon: <Sun size={14} className="text-success" />,
        isOptimal: true,
        isWarning: false
      };
    }
    if (h >= 17 && h <= 21) {
      return {
        label: 'Evening Peak Window (17:00 - 21:00)',
        sublabel: 'High Density Express Traffic — Severe Congestion Risk',
        color: '#dc2626', // Red
        badgeBg: 'bg-danger',
        icon: <AlertTriangle size={14} className="text-warning" />,
        isOptimal: false,
        isWarning: true
      };
    }
    return {
      label: 'Transition Window',
      sublabel: 'Moderate Traffic Flow',
      color: '#64748b', // Slate
      badgeBg: 'bg-secondary',
      icon: <Clock size={14} className="text-light" />,
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
        maxWidth: isFullScreen ? '1100px' : '920px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none'
      }}
    >
      <div
        className="card shadow-lg border-0 text-white rounded-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 35px -10px rgba(0,0,0,0.5), 0 0 20px rgba(14, 165, 233, 0.2)',
          pointerEvents: 'auto'
        }}
      >
        {/* Header Bar */}
        <div className="px-3 py-2 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <div
              className="p-1 rounded-circle d-flex align-items-center justify-content-center"
              style={{ background: 'rgba(14, 165, 233, 0.2)' }}
            >
              <Clock size={16} className="text-info animate-pulse" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold tracking-wide" style={{ fontSize: '0.85rem' }}>
                  24-Hour Digital Twin Simulation
                </span>
                <span className={`badge ${windowInfo.badgeBg} extra-small py-1 px-2 rounded-pill d-flex align-items-center gap-1`}>
                  {windowInfo.icon}
                  <span>{windowInfo.label}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Live Metrics at this simulated minute */}
            <div className="d-none d-md-flex align-items-center gap-3 me-2 extra-small">
              <span className="text-white-50 d-flex align-items-center gap-1">
                <TrainIcon size={12} className="text-success" />
                <strong className="text-white">{activeTrainsCount}</strong> Trains in Transit
              </span>
              <span className="text-white-50 d-flex align-items-center gap-1">
                <ShieldAlert size={12} className={activeBlocksCount > 0 ? 'text-warning' : 'text-white-50'} />
                <strong className={activeBlocksCount > 0 ? 'text-warning' : 'text-white'}>{activeBlocksCount}</strong> Active Blocks
              </span>
              {heldTrainsCount > 0 && (
                <span className="text-danger d-flex align-items-center gap-1 fw-bold animate-pulse">
                  <AlertTriangle size={12} />
                  {heldTrainsCount} Regulated / Held
                </span>
              )}
            </div>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill text-white-50 border-0"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Minimize Scrubber' : 'Expand Scrubber'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {/* Close Simulation Button */}
            {onClose && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger py-0 px-1.5 rounded-circle text-white-50 border-0 ms-1"
                onClick={onClose}
                title="Exit Digital Twin Simulation"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Control Body */}
        {isExpanded && (
          <div className="p-3">
            {/* Clock & Playback Ribbon */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
              {/* Big Digital Clock Display */}
              <div className="d-flex align-items-baseline gap-2">
                <span
                  className="font-monospace fw-bold text-info"
                  style={{ fontSize: '1.45rem', letterSpacing: '1px', textShadow: '0 0 10px rgba(56, 189, 248, 0.4)' }}
                >
                  {formatted12}
                </span>
                <span className="text-white-50 extra-small">({formatted24} IST)</span>
                <span className="text-white-50 extra-small ms-1 d-none d-sm-inline">
                  — {windowInfo.sublabel}
                </span>
              </div>

              {/* Playback Controls & Speed Multipliers */}
              <div className="d-flex align-items-center gap-2">
                {/* Step Back Buttons */}
                <button
                  type="button"
                  className="btn btn-xs btn-outline-light py-1 px-2 rounded-2 extra-small"
                  onClick={() => stepTime(-60)}
                  title="Jump Back 1 Hour"
                >
                  -1h
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-light py-1 px-2 rounded-2 extra-small"
                  onClick={() => stepTime(-15)}
                  title="Jump Back 15 Minutes"
                >
                  -15m
                </button>

                {/* Main Play / Pause Button */}
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-1 rounded-pill fw-bold d-flex align-items-center gap-1.5 shadow ${isPlaying ? 'btn-danger' : 'btn-primary'
                    }`}
                  onClick={onTogglePlay}
                  style={{ minWidth: '95px', justifyContent: 'center' }}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={14} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="white" /> Run Simulation
                    </>
                  )}
                </button>

                {/* Step Forward Buttons */}
                <button
                  type="button"
                  className="btn btn-xs btn-outline-light py-1 px-2 rounded-2 extra-small"
                  onClick={() => stepTime(15)}
                  title="Advance 15 Minutes"
                >
                  +15m
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-light py-1 px-2 rounded-2 extra-small"
                  onClick={() => stepTime(60)}
                  title="Advance 1 Hour"
                >
                  +1h
                </button>

                {/* Speed Multipliers */}
                <div className="btn-group btn-group-sm ms-2" role="group">
                  {[1, 5, 15, 60].map(spd => (
                    <button
                      key={spd}
                      type="button"
                      className={`btn btn-xs py-1 px-2 extra-small ${playbackSpeed === spd ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-white-50'
                        }`}
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
              {/* Range Input Slider */}
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
                  accentColor: '#38bdf8'
                }}
              />

              {/* Hour Ticks & Zone Legend */}
              <div className="d-flex justify-content-between text-white-50 extra-small mt-1 px-1 font-monospace" style={{ fontSize: '0.68rem' }}>
                <span className="text-info">00:00 (Night Shadow)</span>
                <span>04:00</span>
                <span className="text-warning">08:00 (Morning Rush)</span>
                <span className="text-success">12:00 (Afternoon Lull)</span>
                <span>16:00</span>
                <span className="text-danger">19:00 (Evening Rush)</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Quick Preset Jumps */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25 extra-small">
              <span className="text-white-50 fw-semibold d-flex align-items-center gap-1">
                <Zap size={12} className="text-warning" />
                Quick-Jump Operational Windows:
              </span>
              <div className="d-flex flex-wrap gap-1.5">
                {quickJumpPresets.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`btn btn-xs py-0.5 px-2 rounded-pill extra-small border ${Math.abs(simulatedMinutes - preset.time) < 45
                      ? 'btn-info text-dark fw-bold border-info'
                      : 'btn-outline-secondary text-white border-secondary border-opacity-50'
                      }`}
                    onClick={() => onSimulatedMinutesChange(preset.time)}
                  >
                    <span className="me-1">{preset.icon}</span>
                    <span>{preset.label}</span>
                    <span className="opacity-75 ms-1">({preset.timeLabel})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
