import { ENEMIES } from "../../../data/enemies.js";
// scenes/EnemyPreviewScene.js
export default class EnemyPreviewScene extends Phaser.Scene {
  constructor() {
    super('EnemyPreviewScene');
  }

  preload() {
    this.load.image('banner', 'assets/backgrounds/forest.png');
    this.load.image('undead', `assets/enemies/undead.png`);
  }

  create(data) {

    console.log(data)
    this.enemyIndex = (data?.enemyIndex ?? this.registry.get('gauntletIndex') ?? 0);
    this.enemyData = ENEMIES[this.enemyIndex];

    const w = this.scale.width;
    const h = this.scale.height;

    this.enemyName = this.enemyData?.name || 'Undead Skeleton';
    this.enemyHearts = data?.hearts || 3;
    this.enemyBreath = data?.breath || 2;

    // === Background ===
    this.bg = this.add.image(w / 2, h / 2, 'banner');
    this.fitToScreen(this.bg);
    this.bg.setAlpha(0.35);

    // === Dark overlay ===
    this.overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55);

    // === Title ===
    this.titleText = this.add.text(w / 2, h * 0.15, `A new enemy appears! ${this.enemyIndex+1}/10`, {
      fontSize: Math.round(h * 0.045) + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: w * 0.8 }
    }).setOrigin(0.5);

    // === Enemy sprite (center) ===
    this.enemySprite = this.add.image(w / 2, h * 0.45, this.enemyData.spriteKey).setOrigin(0.5);
    this.scaleEnemySprite(); // ✅ consistent sizing

    // === Enemy name ===
    this.nameText = this.add.text(w / 2, h * 0.65, this.enemyName, {
      fontSize: Math.round(h * 0.04) + 'px',
      color: '#FFD86B',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: w * 0.7 }
    }).setOrigin(0.5);

    // === Stats line ===
    this.statsText = this.add.text(
      w / 2,
      h * 0.74,
      `❤️ ${this.enemyData.hp}    💨 ${this.enemyData.breaths}`,
      {
        fontSize: Math.round(h * 0.035) + 'px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: w * 0.8 }
      }
    ).setOrigin(0.5);

    // === Tap to continue (MANDATORY) ===
    this.promptText = this.add.text(w / 2, h * 0.88, 'Tap to continue', {
      fontSize: Math.round(h * 0.03) + 'px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: w * 0.8 }
    }).setOrigin(0.5);

    // Pulse effect
    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 👉 Mandatory tap to proceed
    this.input.once('pointerdown', () => this.goToBattle());

    this.scale.on('resize', this.onResize, this);
  }

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

  // ✅ One consistent enemy scaling rule for desktop + mobile
  scaleEnemySprite() {
    const w = this.scale.width;
    const h = this.scale.height;

    // enemy should fit nicely between title and stats on ANY screen
    const maxSize = Math.min(w * 0.55, h * 0.38); // tweak if you want larger/smaller

    // use the larger dimension so tall/wide sprites both fit
    let scale = maxSize / Math.max(this.enemySprite.width, this.enemySprite.height);

    // optional safety: don't upscale beyond native size
    scale = Math.min(scale, 1.0);

    this.enemySprite.setScale(scale);
  }

  goToBattle() {
    this.tweens.add({
      targets: [
        this.bg,
        this.overlay,
        this.enemySprite,
        this.titleText,
        this.nameText,
        this.statsText,
        this.promptText
      ],
      alpha: 0,
      duration: 350,
      onComplete: () => {
        this.scene.start('BattleScene', this.enemyData);
      }
    });
  }

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    this.fitToScreen(this.bg);
    this.overlay.setSize(w, h).setPosition(w / 2, h / 2);

    this.titleText
      .setPosition(w / 2, h * 0.15)
      .setFontSize(Math.round(h * 0.045))
      .setWordWrapWidth(w * 0.8);

    this.enemySprite.setPosition(w / 2, h * 0.45);
    this.scaleEnemySprite(); // ✅ consistent sizing

    this.nameText
      .setPosition(w / 2, h * 0.65)
      .setFontSize(Math.round(h * 0.04))
      .setWordWrapWidth(w * 0.7);

    this.statsText
      .setPosition(w / 2, h * 0.74)
      .setFontSize(Math.round(h * 0.035))
      .setWordWrapWidth(w * 0.8);

    this.promptText
      .setPosition(w / 2, h * 0.88)
      .setFontSize(Math.round(h * 0.03))
      .setWordWrapWidth(w * 0.8);
  }
}
