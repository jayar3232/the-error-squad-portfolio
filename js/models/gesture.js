(() => {
  'use strict';
  const api = window.StudioModels ||= {};
  const packageUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304';
  const asset = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
  let activeStop;
  async function createRecognizer() {
    const { FilesetResolver, GestureRecognizer } = await import(packageUrl + '/vision_bundle.mjs');
    const files = await FilesetResolver.forVisionTasks(packageUrl + '/wasm');
    return GestureRecognizer.createFromOptions(files, {
      baseOptions: {modelAssetPath: asset, delegate: 'CPU'},
      runningMode: 'VIDEO',
      numHands: 1
    });
  }
  api.startGestures = async (video, onResult, {signal} = {}) => {
    activeStop?.();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw new Error('Open this page on HTTPS or localhost and allow camera access.');
    let recognizer, stream, frame, timer, rejectPending;
    let stopped = false;
    const cancelled = new Promise((_, reject) => { rejectPending = reject; });
    const stop = () => {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      signal?.removeEventListener('abort', stop);
      window.removeEventListener('pagehide', stop);
      stream?.getTracks().forEach(track => track.stop());
      if (video.srcObject === stream) video.srcObject = null;
      recognizer?.close();
      if (activeStop === stop) activeStop = undefined;
      rejectPending(new DOMException('Camera stopped.', 'AbortError'));
    };
    activeStop = stop;
    // Attach the cancellation handler even when a signal was already aborted.
    const wait = promise => Promise.race([promise, cancelled]);
    cancelled.catch(() => {});
    signal?.addEventListener('abort', stop, {once: true});
    window.addEventListener('pagehide', stop, {once: true});
    try {
      if (signal?.aborted) { stop(); await cancelled; }
      // Request permission from the initiating click. Release tracks if the
      // permission prompt resolves after the visitor has cancelled the startup.
      stream = await wait(navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}},
        audio: false
      }).then(value => {
        if (stopped) value.getTracks().forEach(track => track.stop());
        return value;
      }));
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await wait(video.play());
      const watchdog = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Gesture model timed out. Check your connection or use a sample.')), 45000);
      });
      recognizer = await wait(Promise.race([watchdog, createRecognizer().then(model => {
        if (stopped) model.close();
        return model;
      })]));
      clearTimeout(timer);
      const track = stream.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        if (!stopped) { stop(); onResult({label:'',score:0,landmarks:[],error:'Camera disconnected. Start it again to reconnect.'}); }
      }, {once:true});
      let lastFrame = -1, lastTime = -100;
      function update(time) {
        if (stopped) return;
        try {
          if (video.readyState >= 2 && time - lastTime >= 85 && video.currentTime !== lastFrame) {
            lastTime = time;
            lastFrame = video.currentTime;
            const detection = recognizer.recognizeForVideo(video, time);
            const choice = detection.gestures[0]?.[0];
            const landmarks = detection.landmarks[0] || [];
            const label = choice && choice.categoryName !== 'None'
              ? choice.categoryName.replaceAll('_', ' ')
              : landmarks.length ? 'Unrecognized pose' : 'No hand detected';
            onResult({label, score: choice?.score || 0, landmarks});
          }
          if (!stopped) frame = requestAnimationFrame(update);
        } catch (error) {
          stop();
          onResult({label:'',score:0,landmarks:[],error:error.message || 'Gesture recognition stopped.'});
        }
      }
      frame = requestAnimationFrame(update);
      return stop;
    } catch (error) {
      stop();
      throw error;
    }
  };
})();
