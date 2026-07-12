(function () {
  const state = {
    recording: false,
    recorder: null,
    chunks: [],
    blob: null,
    interval: null,
    seconds: 0,
    mimeType: 'audio/webm',
  };

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function toggleClass(node, className, enabled) {
    if (!node) return;
    node.classList[enabled ? 'add' : 'remove'](className);
  }

  function show(node, visible) {
    if (!node) return;
    node.classList[visible ? 'remove' : 'add']('hidden');
  }

  async function toggleRecording(elements) {
    if (state.recording) {
      if (state.recorder) state.recorder.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm');

      state.recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      state.mimeType = mimeType || 'audio/webm';
      state.chunks = [];
      state.recording = true;
      state.seconds = 0;

      setText(elements.label, 'Detener');
      toggleClass(elements.button, 'recording-pulse', true);
      show(elements.timer, true);
      setText(elements.status, 'Grabando…');

      state.interval = setInterval(() => {
        state.seconds += 1;
        const m = String(Math.floor(state.seconds / 60)).padStart(2, '0');
        const s = String(state.seconds % 60).padStart(2, '0');
        setText(elements.timer, `${m}:${s}`);
      }, 1000);

      state.recorder.ondataavailable = function (event) {
        if (event.data && event.data.size > 0) state.chunks.push(event.data);
      };

      state.recorder.onstop = function () {
        clearInterval(state.interval);
        state.recording = false;
        setText(elements.label, 'Grabar nota');
        toggleClass(elements.button, 'recording-pulse', false);
        show(elements.timer, false);
        setText(elements.status, '✔ Grabación lista');
        stream.getTracks().forEach(track => track.stop());

        state.blob = new Blob(state.chunks, { type: state.mimeType });
        if (elements.player) {
          elements.player.src = URL.createObjectURL(state.blob);
        }
        show(elements.preview, true);
      };

      state.recorder.start();
    } catch (error) {
      setText(elements.status, `Error micrófono: ${error.message}`);
    }
  }

  function buildRecordedFile() {
    if (!state.blob) return null;
    return new File([state.blob], `nota_${Date.now()}.webm`, { type: state.blob.type || state.mimeType || 'audio/webm' });
  }

  function clearRecording(elements) {
    state.blob = null;
    state.chunks = [];
    if (elements?.player) elements.player.src = '';
    show(elements?.preview, false);
    setText(elements?.status, '');
    setText(elements?.label, 'Grabar nota');
    toggleClass(elements?.button, 'recording-pulse', false);
    show(elements?.timer, false);
  }

  window.DIEGO_VOICE = {
    toggleRecording,
    buildRecordedFile,
    clearRecording,
    hasRecording: function () { return !!state.blob; },
  };
})();
