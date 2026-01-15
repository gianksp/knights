class MainScene extends Phaser.Scene {
      constructor() {
        super('MainScene');
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor('#1e1e26');

        this.add.text(w / 2, h / 2, 'Empty Phaser Layout', {
          fontSize: '32px',
          color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.08, 'Top UI area', {
          fontSize: '18px',
          color: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.92, 'Bottom UI area', {
          fontSize: '18px',
          color: '#aaaaaa'
        }).setOrigin(0.5);

        this.scale.on('resize', this.onResize, this);
      }

      onResize(gameSize) {
        // Easiest for now: rebuild layout on resize/orientation change
        this.scene.restart();
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      backgroundColor: '#000000',
      scene: [MainScene],
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
        navigator.serviceWorker.register('sw.js')
          .catch(err => console.log('SW registration failed:', err));
      });
}