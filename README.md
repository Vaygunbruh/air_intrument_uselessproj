# Air Piano - Play the Invisible

A browser-based hand-tracking instrument demo built with React, Vite, OpenCV-free browser MediaPipe, and Tone.js.

## What this app does

- Shows your webcam in the browser.
- Tracks both hands in real time using MediaPipe Hand Landmarker.
- Lets you play piano notes by moving fingertips into virtual piano key zones.
- Lets you switch to an air drum mode with draggable-zone-style percussion pads.
- Lets you enter freestyle mode with a glowing fingertip trail.
- Plays generated sounds with Tone.js.
- Shows visual glow effects and a recent note history.

## Requirements

- Node.js 18+
- A webcam connected to your laptop
- A modern browser such as Chrome or Edge

## Install

From the project root:

```bash
cd air-piano
npm install
```

## Run locally

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
```

## Controls

- Start Camera: turn on webcam access.
- Stop Camera: stop the live stream.
- Mode selector: switch between Piano, Drum, and Freestyle.
- Sound On/Off: enable or mute instrument output.
- Visuals On/Off: toggle glow effects and particles.
- Clear: clear the note history and visual effects.
- Record: capture note events with timestamps.
- Replay: replay the recorded performance.

## Notes

The app runs locally from VS Code and uses the browser's webcam. You may need to allow camera permissions in the browser the first time you use it.
