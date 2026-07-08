(function () {
  var API_KEY = '9e0501bb814699b809984756f322645d';
  var INIT_FLAG = '__kyunolabAmplitudeInitialized';

  function initAmplitude() {
    if (typeof window === 'undefined' || window[INIT_FLAG]) {
      return;
    }

    var amplitude = window.amplitude;
    if (!amplitude || typeof amplitude.initAll !== 'function') {
      return;
    }

    window[INIT_FLAG] = true;
    amplitude.initAll(API_KEY, { analytics: { autocapture: true } });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmplitude, { once: true });
  } else {
    initAmplitude();
  }
})();
