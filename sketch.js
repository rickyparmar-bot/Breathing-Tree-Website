let micStr = null;
let audCtx = null;
let micSrc = null;
let analyser = null;
let waveBuf = null;

let micOn = false;
let breath = 0;
let brAngle = 18;

let micLvl = 0;
let floorLvl = 0.001;
let ceilLvl = 0.012;
let isCalib = false;
let calibFrames = 0;
let calibSum = 0;
let calibPeak = 0;
let quietFrames = 0;

let toneOsc = null;
let noiseSrc = null;
let lp = null;

let startBtn;
let msgEl;
let breathText;
let angleText;
let rawText;
let senseSlider;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);

  startBtn = document.getElementById("startBtn");
  msgEl = document.getElementById("msg");
  breathText = document.getElementById("breathText");
  angleText = document.getElementById("angleText");
  rawText = document.getElementById("rawText");
  senseSlider = document.getElementById("senseSlider");

  startBtn.onclick = startMic;
}

function draw() {
  if (micOn) {
    if (analyser) {
      if (waveBuf) {
        analyser.getFloatTimeDomainData(waveBuf);
        let sumSquares = 0;
        for (let i = 0; i < waveBuf.length; i++) {
          sumSquares += waveBuf[i] * waveBuf[i];
        }
        micLvl = Math.sqrt(sumSquares / waveBuf.length);

        if (micLvl < 0.00005) {
          quietFrames = quietFrames + 1;
        } else {
          quietFrames = 0;
        }

        if (isCalib) {
          calibFrames = calibFrames + 1;
          calibSum = calibSum + micLvl;
          if (micLvl > calibPeak) {
            calibPeak = micLvl;
          }
          breath = lerp(breath, 0, 0.08);

          if (calibFrames > 90) {
            isCalib = false;
            floorLvl = calibSum / calibFrames + 0.0004;
            ceilLvl = floorLvl + 0.004;
            if (calibPeak * 2.2 > ceilLvl) {
              ceilLvl = calibPeak * 2.2;
            }
            if (ceilLvl < 0.006) {
              ceilLvl = 0.006;
            }
            msgEl.textContent = "Breathe close to the mic";
          }
        } else {
          if (quietFrames > 120) {
            msgEl.textContent = "No mic signal - check browser/input";
          }

          const sense = Number(senseSlider.value);

          if (micLvl < floorLvl) {
            floorLvl = lerp(floorLvl, micLvl, 0.04);
          } else {
            floorLvl = lerp(floorLvl, micLvl, 0.0007);
          }

          if (micLvl > ceilLvl) {
            ceilLvl = lerp(ceilLvl, micLvl, 0.3);
          } else {
            ceilLvl = lerp(ceilLvl, floorLvl + 0.006, 0.006);
          }

          let range = ceilLvl - floorLvl;
          if (range < 0.0025) {
            range = 0.0025;
          }

          let norm = ((micLvl - floorLvl) / range) * sense * 1.6;
          if (norm < 0) norm = 0;
          if (norm > 1) norm = 1;
          norm = Math.sqrt(norm);

          breath = lerp(breath, norm, 0.18);
        }
      } else {
        micLvl = 0;
      }
    } else {
      micLvl = 0;
    }
  } else {
    micLvl = 0;
    let fake = sin(frameCount * 1.2);
    fake = fake + 1;
    fake = fake / 2;
    fake = 0.1 + fake * 0.5;
    breath = lerp(breath, fake, 0.03);
  }

  brAngle = lerp(brAngle, 12 + breath * 56, 0.08);

  if (toneOsc) {
    toneOsc.freq(95 + breath * 35);
    toneOsc.amp(0.015 + breath * 0.025, 0.2);
    noiseSrc.amp(0.005 + breath * 0.02, 0.2);
    lp.freq(400 + breath * 1000);
  }

  const sky = lerpColor(color(7, 21, 19), color(56, 89, 67), breath);
  background(sky);
  noStroke();
  fill(200, 230, 160, 22);
  ellipse(width * 0.5, height * 0.65, 300 + breath * 300, 140 + breath * 150);
  fill(245, 205, 110, 20 + breath * 40);
  ellipse(width * 0.78, height * 0.18, 160, 160);

  push();
  translate(width / 2, height - 35);
  strokeCap(ROUND);

  function branch(len, depth) {
    strokeWeight(1 + (depth / 9) * 13);
    stroke(120 + depth * 8, 95 + depth * 8, 55 + depth * 6);
    line(0, 0, 0, -len);
    translate(0, -len);

    if (depth <= 0 || len < 5) {
      noStroke();
      fill(185, 225, 135, 120 + breath * 90);
      ellipse(0, 0, 6 + breath * 10, 6 + breath * 10);
    } else {
      push();
      rotate(brAngle);
      branch(len * 0.67, depth - 1);
      pop();

      push();
      rotate(-brAngle);
      branch(len * 0.67, depth - 1);
      pop();
    }
  }

  branch(height * 0.25, 9);
  pop();

  breathText.textContent = String(floor(breath * 100));
  rawText.textContent = nf(micLvl, 1, 5);
  angleText.textContent = `${floor(brAngle)} deg`;
}

function startMic() {
  startBtn.disabled = true;
  msgEl.textContent = "Requesting microphone...";

  Promise.resolve(userStartAudio()).then(() => {
    if (navigator.mediaDevices) {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true
          }
        }).then((stream) => {
          micStr = stream;

          audCtx = getAudioContext();
          micSrc = audCtx.createMediaStreamSource(micStr);
          analyser = audCtx.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.2;
          waveBuf = new Float32Array(analyser.fftSize);
          micSrc.connect(analyser);

          micOn = true;
          isCalib = true;
          calibFrames = 0;
          calibSum = 0;
          calibPeak = 0;
          quietFrames = 0;
          floorLvl = 0.001;
          ceilLvl = 0.012;

          if (!toneOsc) {
            toneOsc = new p5.Oscillator("sine");
            noiseSrc = new p5.Noise("brown");
            lp = new p5.LowPass();
            noiseSrc.disconnect();
            noiseSrc.connect(lp);
            toneOsc.amp(0);
            noiseSrc.amp(0);
            toneOsc.start();
            noiseSrc.start();
          }

          startBtn.disabled = false;
          startBtn.textContent = "Recalibrate";
          startBtn.onclick = () => {
            isCalib = true;
            calibFrames = 0;
            calibSum = 0;
            calibPeak = 0;
            quietFrames = 0;
            floorLvl = 0.001;
            ceilLvl = 0.012;
            msgEl.textContent = "Stay quiet... calibrating";
          };

          msgEl.textContent = "Stay quiet... calibrating";
        }).catch((err) => {
          console.error(err);
          startBtn.disabled = false;
          startBtn.textContent = "Start mic";
          startBtn.onclick = startMic;
          msgEl.textContent = "mic failed";
        });
      } else {
        startBtn.disabled = false;
        msgEl.textContent = "mic api missing";
      }
    } else {
      startBtn.disabled = false;
      msgEl.textContent = "no media devices";
    }
  }).catch((err) => {
    console.error(err);
    startBtn.disabled = false;
    startBtn.textContent = "Start mic";
    msgEl.textContent = "audio start failed";
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
