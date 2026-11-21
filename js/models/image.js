// Load the classifier only after someone asks for an image prediction.
(() => {
  'use strict';
  const api = window.StudioModels ||= {};
  let modelPromise;
  function script(url, exportedName) {
    if (window[exportedName]) return Promise.resolve(window[exportedName]);
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      const fail = () => {
        clearTimeout(timer);
        tag.onload = tag.onerror = null;
        tag.remove();
        reject(new Error('Classifier download failed. Check the connection or use the sample activity.'));
      };
      const timer = setTimeout(fail, 22000);
      tag.onload = () => {
        if (!window[exportedName]) return fail();
        clearTimeout(timer);
        resolve(window[exportedName]);
      };
      tag.onerror = fail;
      tag.src = url;
      tag.crossOrigin = 'anonymous';
      document.head.append(tag);
    });
  }
  async function load() {
    const tf = await script('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'tf');
    await tf.ready();
    const mobilenet = await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js', 'mobilenet');
    return mobilenet.load({version: 2, alpha: 1});
  }
  api.classifyImage = async image => {
    if (!image || !image.naturalWidth || !image.naturalHeight) throw new Error('Choose a readable image first.');
    modelPromise ||= load().catch(error => { modelPromise = undefined; throw error; });
    let timer;
    try {
      const model = await Promise.race([modelPromise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Model download is taking too long. Try again or explore a sample.')), 45000);
      })]);
      // Decoding a phone photo at its original resolution can exhaust a mobile GPU.
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(scale * image.naturalWidth));
      canvas.height = Math.max(1, Math.round(scale * image.naturalHeight));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const predictions = await model.classify(canvas, 3);
      return predictions.map(({className, probability}) => ({label: className, score: probability}));
    } finally { clearTimeout(timer); }
  };
})();
