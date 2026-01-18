export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // === Background (COVER) ===
    this.bg = this.add.image(w / 2, h / 2, 'win_bg');
    this.fitCover(this.bg);

    // === Foreground (CONTAIN) ===
    this.fg = this.add.image(w / 2, h * 0.52, 'win_fg');
    this.fitContain(this.fg, 0.92, 0.78);

    // === Tap to continue ===
    this.tapText = this.add.text(
      w / 2,
      h * 0.9,
      'Tap to return to menu',
      {
        fontSize: Math.round(h * 0.04) + 'px',
        color: '#ffffff',
      }
    ).setOrigin(0.5);

    // Input
    this.input.once('pointerdown', () => {
      this.scene.start('MainScene');
    });

    // Resize handling
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this);
    });
  }

  // === Helpers ===

  fitCover(image) {
    const w = this.scale.width;
    const h = this.scale.height;
    const tex = image.texture.getSourceImage();

    const scale = Math.max(w / tex.width, h / tex.height);
    image.setScale(scale);
    image.setPosition(w / 2, h / 2);
  }

  fitContain(image, maxWidthRatio = 1, maxHeightRatio = 1) {
    const w = this.scale.width * maxWidthRatio;
    const h = this.scale.height * maxHeightRatio;
    const tex = image.texture.getSourceImage();

    const scale = Math.min(w / tex.width, h / tex.height);
    image.setScale(scale);
  }

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    this.bg.setPosition(w / 2, h / 2);
    this.fitCover(this.bg);

    this.fg.setPosition(w / 2, h * 0.52);
    this.fitContain(this.fg, 0.92, 0.78);

    this.tapText
      .setPosition(w / 2, h * 0.9)
      .setFontSize(Math.round(h * 0.04));
  }
}
