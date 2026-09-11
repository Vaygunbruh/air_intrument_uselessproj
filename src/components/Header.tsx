import React from 'react';
import { Volume2, VolumeX, Eye, EyeOff, HelpCircle, Activity, Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface HeaderProps {
  status: string;
  handCount: number;
  cameraOn: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  visualEffectsOn: boolean;
  setVisualEffectsOn: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  handCount,
  cameraOn,
  soundEnabled,
  setSoundEnabled,
  visualEffectsOn,
  setVisualEffectsOn,
  volume,
  setVolume,
  onOpenGuide,
}) => {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  const toggleMute = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      audioEngine.setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      audioEngine.setSoundEnabled(true);
    }
  };

  return (
    <header className="app-header glass-panel">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Sparkles className="brand-icon" size={26} />
        </div>
        <div>
          <div className="brand-tag">AI MULTI-INSTRUMENT SUITE</div>
          <h1 className="brand-title">AIR INSTRUMENTS <span className="version-badge">PRO v2.0</span></h1>
        </div>
      </div>

      <div className="status-container">
        <div className={`status-pill ${cameraOn ? 'active' : 'standby'}`}>
          <span className={`status-dot ${cameraOn ? (handCount > 0 ? 'tracking' : 'on') : 'off'}`} />
          <span className="status-text">{status}</span>
          {cameraOn && (
            <span className="hand-count-chip">
              <Activity size={14} /> {handCount} {handCount === 1 ? 'Hand' : 'Hands'}
            </span>
          )}
        </div>
      </div>

      <div className="header-actions">
        {/* Volume Slider & Toggle */}
        <div className="volume-control">
          <button className="icon-btn" onClick={toggleMute} title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled && volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={soundEnabled ? volume : 0}
            onChange={handleVolumeChange}
            className="volume-slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>

        {/* Visual FX Toggle */}
        <button
          className={`btn btn-secondary ${visualEffectsOn ? 'active-toggle' : ''}`}
          onClick={() => setVisualEffectsOn(!visualEffectsOn)}
          title="Toggle Visual Effects"
        >
          {visualEffectsOn ? <Eye size={18} /> : <EyeOff size={18} />}
          <span>FX</span>
        </button>

        {/* How to Play Guide Button */}
        <button className="btn btn-primary-glow" onClick={onOpenGuide}>
          <HelpCircle size={18} />
          <span>Guide</span>
        </button>
      </div>
    </header>
  );
};
