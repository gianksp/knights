import BattleScene from "./scenes/BattleScene.js";
import EnemyPreviewScene from "./scenes/EnemyPreviewScene.js";
import MainScene from "./scenes/MainScene.js";
import WinScene from "./scenes/WinScene.js";

// =========================
// Game config
// =========================
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [MainScene, EnemyPreviewScene, BattleScene, WinScene], // <-- start at WelcomeScene
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

// Keep Phaser aware of window resizes
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// =========================
// PWA: register service worker
// =========================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .catch(err => console.log('SW registration failed:', err));
  });
}
