// assets/js/player.js
// Legacy shim: this file no longer exposes ESM exports directly.
// It dynamically loads the modern player module and attaches its public API
// to the window for older code paths that expect globals.
(function attachPlayerModule(){
  if (typeof window === 'undefined') return;

  function load(){
    let importer;
    try {
      importer = Function('path', 'return import(path);');
    } catch (err) {
      console.error('[player] Dynamic import is not supported in this environment.', err);
      return;
    }

    const script = document.currentScript;
    const url = script ? new URL('./player-module.js', script.src).href : new URL('./player-module.js', window.location.href).href;

    importer(url)
      .then((mod) => {
        if (!mod) return;
        const { openPlayer, bindPlayer } = mod;
        if (!window.openPlayer) window.openPlayer = openPlayer;
        if (!window.bindPlayer) window.bindPlayer = bindPlayer;
        window.PlayerModule = mod;
      })
      .catch((err) => {
        console.error('[player] Failed to load player module.', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
