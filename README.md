<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# Air Instruments Pro v2.0 🎯


## Basic Details
### Team Name: [Chads]


### Team Members
- Team Lead: Savio Sajeev - Jyothi Eng College
- Member 2: Nived Krishna - Jyothi Eng College

### Project Description
Air Piano is an interactive web application that uses real-time hand tracking to turn hand movements into a virtual musical instrument. Even though its not that useless or anything ehe,  Users can play piano notes, create effects, and interact with the interface using only their hands, without touching a physical keyboard.

### The Problem (that doesn't exist)
People who have allergies to physical musical instruments suffers a lot. And many other who really want to up their skill in a sudden urge.

### The Solution (that nobody asked for)
Thats why we have Air Instrument pro. Instead of buying a any musical instruments, we simply point a webcam at your hands and convince the computer that the air is a piano or a drum ehe

## Technical Details
### Technologies/Components Used
For Software:
- Languages used: TypeScript,TSX (TypeScript + JSX), CSS, HTML
- Frameworks used: React 18, Vite 5
- Libraries used: Tone.js, MediaPipe Hands
- Tools used: Node.js, TypeScript Compiler, Vite CLI, MediaPipe WASM, Browser WebRTC, Web Audio API, MediaRecorder API, Canvas 2D API, reqAnimationframe 

### Implementation
For Software:
# Installation
```bash
git clone <your-repo-url>
cd air-instruments
npm install
```

# Run
```bash
# start the dev server (opens on http://localhost:3000)
npm run dev

# build a production bundle
npm run build

# preview the production build locally
npm run preview
```

### Project Documentation
For Software:

# Screenshots (Add at least 3)
<img src="C:\Users\ADMIN\OneDrive\Pictures\Screenshots\druminterface.png"> 
*Drum mode with six air-triggered pads. The side panel shows live hand count, active mode, and FPS, plus a running Live Note Feed of every hit.*

![Wide View / Side Panel Layout](./screenshots/wideview.png)
*drum pads get the full width of the screen by using wide view— useful for demoing on a projector or larger display.*

<img src="./screenshots/piano-interface.png"> 
*Piano mode mapped across a C4–E5 range. Each key lights up in its own color when played, and the Session Recorder (Record / Replay) sits in the side panel alongside the mode switcher.*

<img src="./screenshots/freestyle-interface.png"> 
*Freestyle mode running live with the camera on. MediaPipe's 21-point hand skeleton is overlaid in real time, and on-screen text maps each gesture: wand movement for a melodic stream, index-finger pinch for chords, middle-finger pinch for bells, and two hands together for sub bass.*

# Diagrams
<img src="./downloads/Air-Instruments.png"> 
*The flow from opening the browser to hearing a note: the webcam feed is read locally, MediaPipe turns it into hand landmarks, those landmarks are mapped to whichever instrument mode is active, and every trigger fans out to sound (Tone.js), visuals (Canvas), the live feed, and — if recording — the session recorder.*

### Project Demo
# Video
[Add your demo video link here]
*Explain what the video demonstrates*

# Additional Demos
[Add any extra demo materials/links]

## Team Contributions
- [Name 1]: [Specific contributions]
- [Name 2]: [Specific contributions]
- [Name 3]: [Specific contributions]

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
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
