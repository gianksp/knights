// scenes/WelcomeScene.js
export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.image('banner', 'assets/backgrounds/forest.png');
    // this.load.image('banner', 'assets/images/tutorial.png');

    this.load.image('win_bg', 'assets/images/background.png');
    this.load.image('win_fg', 'assets/images/foreground.png');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // === Background Banner ===
    this.banner = this.add.image(w / 2, h / 2, 'banner');
    this.fitToScreen(this.banner);

    // === Tap to Start ===
    this.startText = this.add.text(w / 2, h * 0.8, 'Tap to Start', {
      fontSize: Math.round(h * 0.04) + 'px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startText.on('pointerdown', () => {

      // MainScene start button
      this.registry.set('gauntletIndex', 0);


      this.scene.start('EnemyPreviewScene', { enemyIndex: 0 });
    });

    // Listen to screen size changes
    this.scale.on('resize', this.onResize, this);
  }

  // Scale banner to fill screen like CSS background-size: cover
  fitToScreen(image) {
    const w = this.scale.width;
    const h = this.scale.height;
    const tex = image.texture.getSourceImage();

    const scaleX = w / tex.width;
    const scaleY = h / tex.height;
    const scale = Math.max(scaleX, scaleY);

    image.setScale(scale);
    image.setPosition(w / 2, h / 2);
  }

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    this.fitToScreen(this.banner);

    // Update title + start text positions
    this.title.setPosition(w / 2, h * 0.15).setFontSize(h * 0.08);
    this.startText.setPosition(w / 2, h * 0.80).setFontSize(h * 0.04);
  }
}
