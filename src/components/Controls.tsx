import React from 'react';
import { Play, Square, Disc, RotateCcw, Trash2, Music, Flame, Zap, Camera, CameraOff, Maximize2, LayoutGrid } from 'lucide-react';

export type Mode = 'piano' | 'drum' | 'freestyle';

export type TriggerEvent = {
  id: number;
  label: string;
  source: 'piano' | 'drum' | 'freestyle';
  x: number;
  y: number;
  color: string;
  timestamp: number;
};

interface ControlsProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  cameraOn: boolean;
  modelReady: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  onReplay: () => void;
  onClear: () => void;
  noteHistory: TriggerEvent[];
  handCount: number;
  fps: number;
  isBottomLayout: boolean;
  onToggleLayout: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  mode,
  setMode,
  cameraOn,
  modelReady,
  onStartCamera,
  onStopCamera,
  isRecording,
  onToggleRecording,
  onReplay,
  onClear,
  noteHistory,
  handCount,
  fps,
  isBottomLayout,
  onToggleLayout,
}) => {
  return (
    <aside className="control-panel glass-panel">
      {/* Wide View / Layout Toggle Button */}
      <div className="layout-toggle-container">
        <button
          className={`btn ${isBottomLayout ? 'btn-primary-glow' : 'btn-secondary'} btn-full`}
          onClick={onToggleLayout}
        >
          {isBottomLayout ? <LayoutGrid size={18} /> : <Maximize2 size={18} />}
          <span>{isBottomLayout ? 'Side Panel View' : 'Wide View (Bottom Controls)'}</span>
        </button>
      </div>

      {/* Primary Camera Control */}
      <div className="control-section">
        <div className="section-title">
          <Camera size={18} className="icon-cyan" />
          <span>CAMERA & SENSOR</span>
        </div>

        <div className="btn-group">
          {!cameraOn ? (
            <button
              className="btn btn-emerald btn-full"
              onClick={onStartCamera}
              disabled={!modelReady}
            >
              <Camera size={20} />
              <span>{modelReady ? 'Start Camera' : 'Loading Tracker...'}</span>
            </button>
          ) : (
            <button className="btn btn-danger btn-full" onClick={onStopCamera}>
              <CameraOff size={20} />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="control-section">
        <div className="section-title">
          <Music size={18} className="icon-pink" />
          <span>INSTRUMENT MODE</span>
        </div>

        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'piano' ? 'active' : ''}`}
            onClick={() => setMode('piano')}
          >
            <Music size={18} />
            <span>Piano</span>
          </button>

          <button
            className={`mode-tab ${mode === 'drum' ? 'active' : ''}`}
            onClick={() => setMode('drum')}
          >
            <Flame size={18} />
            <span>Drum</span>
          </button>

          <button
            className={`mode-tab ${mode === 'freestyle' ? 'active' : ''}`}
            onClick={() => setMode('freestyle')}
          >
            <Zap size={18} />
            <span>Freestyle</span>
          </button>
        </div>
      </div>

      {/* Record & Replay Session Control */}
      <div className="control-section">
        <div className="section-title">
          <Disc size={18} className="icon-cyan" />
          <span>SESSION RECORDER</span>
        </div>

        <div className="btn-group two-col">
          <button
            className={`btn ${isRecording ? 'btn-rec-active' : 'btn-secondary'}`}
            onClick={onToggleRecording}
          >
            {isRecording ? <Square size={16} /> : <Disc size={16} />}
            <span>{isRecording ? 'Stop Rec' : 'Record'}</span>
          </button>

          <button className="btn btn-secondary" onClick={onReplay}>
            <Play size={16} />
            <span>Replay</span>
          </button>
        </div>

        <button className="btn btn-ghost" onClick={onClear} style={{ marginTop: '0.5rem', width: '100%' }}>
          <Trash2 size={16} />
          <span>Clear FX & History</span>
        </button>
      </div>

      {/* Stats Summary Card */}
      <div className="control-section">
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-label">Hands</span>
            <span className="stat-value highlight-cyan">{handCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Mode</span>
            <span className="stat-value highlight-pink">{mode.toUpperCase()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">FPS</span>
            <span className="stat-value">{fps}</span>
          </div>
        </div>
      </div>

      {/* Live Note Trigger Feed */}
      <div className="history-section control-section">
        <div className="section-title">
          <RotateCcw size={16} className="icon-cyan" />
          <span>LIVE NOTE FEED</span>
        </div>

        <ul className="history-list">
          {noteHistory.length === 0 ? (
            <li className="history-empty">Play notes with your hands to view triggers...</li>
          ) : (
            noteHistory.map((evt) => (
              <li key={evt.id} className="history-item">
                <span className="history-dot" style={{ backgroundColor: evt.color, boxShadow: `0 0 10px ${evt.color}` }} />
                <span className="history-label">{evt.label}</span>
                <span className="history-tag">{evt.source}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
};
