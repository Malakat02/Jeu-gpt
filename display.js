// UI scale is independent of world coordinates, collisions and touch controls.
globalThis.ForestDisplay = {
  scale: 1,
  apply(value) {
    this.scale = Math.max(.8, Math.min(1.5, Number(value) || 1));
    document.documentElement.style.setProperty('--ui-scale', this.scale);
    try { localStorage.setItem('forest-ui-scale', String(this.scale)); } catch {}
  }
};
try { ForestDisplay.apply(localStorage.getItem('forest-ui-scale')); } catch { ForestDisplay.apply(1); }
