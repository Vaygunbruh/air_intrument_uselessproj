import React from 'react';
import { X, Play, Music, Sparkles, Hand, ShieldCheck, Zap } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCamera: () => void;
  cameraOn: boolean;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onStartCamera,
  cameraOn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles className="icon-cyan" size={24} />
            <h2>Welcome to Air Instruments Pro v2.0</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="guide-card">
            <div className="guide-icon"><Hand size={28} /></div>
            <div>
              <h3>1. Camera & Positioning</h3>
              <p>Place your hands in front of your webcam. Position fingertips above the virtual key zones to play easily.</p>
            </div>
          </div>

          <div className="guide-card">
            <div className="guide-icon"><Music size={28} /></div>
            <div>
              <h3>2. Virtual Instrument Layout</h3>
              <p><strong>Piano:</strong> Keys are located at the top half of the screen.<br />
                 <strong>Air Drum:</strong> 6 drum pads (Tom top-left, Crash top-right, Middle Cowbell, Kick, Snare & Hi-Hat bottom).</p>
            </div>
          </div>

          <div className="guide-card">
            <div className="guide-icon"><Zap size={28} /></div>
            <div>
              <h3>3. Continuous Freestyle Mode</h3>
              <p>Continuous continuous beep synth. Bring index fingers closer together for high-speed intensity sweeps, or pull them apart for lower tone frequency sweeps!</p>
            </div>
          </div>

          <div className="guide-card">
            <div className="guide-icon"><ShieldCheck size={28} /></div>
            <div>
              <h3>4. Live Audio Recording</h3>
              <p>Click <strong>Record</strong> to capture live audio playing. When you click <strong>Stop Rec</strong>, your performance automatically downloads as an audio file!</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {!cameraOn ? (
            <button className="btn btn-primary" onClick={() => { onClose(); onStartCamera(); }}>
              <Play size={18} /> Start Camera & Play
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              Got It! Let's Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
