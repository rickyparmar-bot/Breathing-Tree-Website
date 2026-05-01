# Breathing-Tree-Website
A website that gently grows and shrinks a tree illustration in sync with your breathing use the microphone to detect your breath or click to simulate it, with soft ambient sounds and a calming color shift. 
# 🌳 Breathing Tree 

An animated fractal tree which responds to your breathing or talking. Say something, exhale or speak into the mic, and watch the branches grow  .

**🔴 [Try the Live Demo Here!](https://rickyparmar-bot.github.io/Breathing-Tree-Website/)**

*(Please note: Microphone permission is required for the tree to respond to audio signals!)*

---

## ✨ Features
- **Audio-Reactive Geometry:** Utilizes the Web Audio API to detect volume levels and apply these values as angles in the tree's branches.
- **Automatic Calibration:** Script listens to your environment for the first 90 seconds to calibrate an initial "silent baseline" to prevent the animation from firing due to ambient noise such as a fan.
- **Recursive Geometry:** Recursively generates each branch from 512 new branches created during every frame render.
- **Smoother Branch Animation:** Uses `lerp` to make sure branches slide smoothly rather than snap suddenly whenever the mic glitch happens.

## 🛠️ Built With
- **HTML5 / CSS3** (For custom UI floating over the canvas)
- **JavaScript (Vanilla)**
- **[p5.js](https://p5js.org/)** (For canvas drawing)
- **p5.sound** (For background noise/Oscillator creation)
