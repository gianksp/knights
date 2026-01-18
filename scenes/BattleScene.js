import { ENEMIES } from "../data/enemies.js";

// scenes/BattleScene.js
export default class BattleScene extends Phaser.Scene {
  
  constructor() {
    super("BattleScene");

    // this.init();
  }

  init() {
    this.buttons = {};
    this.turnLocked = false;

    // ===== Round / selection system =====
    this.round = 0;
    this.playerWins = false;
    // Selected moves
    // playerChoice: { type: "ATTACK"|"DEFEND"|"BREATHE", spend?: number }
    // enemyChoice:  { type: "ATTACK"|"DEFEND"|"BREATHE", spend?: number }
    this.playerChoice = null;
    this.enemyChoice = null;

    // ===== Horizontal history (icons only) =====
    this.maxHistory = 10;
    this.playerMoveHistory = []; // newest first
    this.enemyMoveHistory = [];
    this.playerHistoryTexts = [];
    this.enemyHistoryTexts = [];

    // ===== Attack spend popup =====
    this.attackPopup = null; // container
    this.attackSpend = 1;

    // ===== End-of-match popup =====
    this.endPopup = null;
    this.endPopupShown = false;
  }

  preload() {
    this.load.image("enemyUndead", "assets/enemies/undead.png");
    this.load.image("knight", "assets/characters/knight.png");
    this.load.image("forestBg", "assets/backgrounds/forest.png");
  }

  create(enemyData) {
    this.enemyData = enemyData;
    this.init();
    const w = this.scale.width;
    const h = this.scale.height;

    // ===== Config =====
    this.playerName = "Knight";
    this.enemyName = enemyData.name;

    this.playerMaxHearts = 3;
    this.enemyMaxHearts = enemyData.hp;

    // Breath is used as "stamina" to attack/defend
    this.playerBreathMax = 3;
    this.enemyBreathMax = enemyData.breaths;
    console.log(enemyData.breaths)

    // ===== State =====
    this.playerHearts = this.playerMaxHearts;
    this.enemyHearts = this.enemyMaxHearts;

    this.playerBreath = 2;
    this.enemyBreath = this.enemyBreathMax;
    console.log(this.enemyBreath)

    // ===== Background =====
    this.bg = this.add.image(w / 2, h / 2, "forestBg");
    this.fitBackground(this.bg, w, h);
    this.overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.22);

    // ===== Sprites (player LEFT, enemy RIGHT) =====
    this.playerSprite = this.add.image(0, 0, "knight");
    this.enemySprite = this.add.image(0, 0, "enemyUndead");
    this.enemySprite.setFlipX(false);

    // ===== Under-character UI =====
    this.playerNameText = this.add
      .text(0, 0, this.playerName, { fontSize: "32px", color: "#ffffff" })
      .setOrigin(0.5);

    this.playerStatsText = this.add
      .text(0, 0, "", { fontSize: "26px", color: "#ffffff", align: "left" })
      .setOrigin(0.5);

    this.enemyNameText = this.add
      .text(0, 0, this.enemyName, { fontSize: "32px", color: "#ffffff" })
      .setOrigin(0.5);

    this.enemyStatsText = this.add
      .text(0, 0, "", { fontSize: "26px", color: "#ffffff", align: "left" })
      .setOrigin(0.5);

    // ===== Message box (top) =====
    this.messageBox = this.add
      .rectangle(0, 0, 10, 10, 0x000000, 0.45)
      .setStrokeStyle(2, 0xffffff, 0.6);

    this.messageText = this.add
      .text(0, 0, "", {
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 10 },
      })
      .setOrigin(0.5);

    // ===== Buttons =====
    this.createButtons();

    // ===== Round UI + horizontal history =====
    this.createRoundUI();

    // ===== Attack spend popup =====
    this.createAttackPopup();

    // ===== End-of-match popup =====
    this.createEndPopup();

    // Initial layout + stat render
    this.layout(w, h);
    this.updateStatsText();
    this.setMessage("Choose your move. Round resolves when both have picked.");

    // Start Round 1
    this.startRound();

    this.scale.on("resize", this.onResize, this);
  }

  // ==========================================================
  // Responsive layout
  // ==========================================================

  layout(w, h) {
    const pad = Math.max(10, Math.min(w, h) * 0.02);
    const uiScale = Phaser.Math.Clamp(Math.min(w / 420, h / 760), 0.75, 1.45);

    // Background + overlay
    this.fitBackground(this.bg, w, h);
    this.bg.setPosition(w / 2, h / 2);
    this.overlay.setPosition(w / 2, h / 2).setSize(w, h);

    // Stage Y
    const shortScreen = h < 650;
    this.stageY = h * 0.45;

    // Fighter scale by aspect
    const aspect = w / h;
    let fighterFrac = 0.26;
    if (aspect < 0.75) fighterFrac = 0.34;
    else if (aspect < 1.1) fighterFrac = 0.30;
    else if (aspect > 1.9) fighterFrac = 0.24;

    this.fitFighter(this.playerSprite, w, fighterFrac);
    this.fitFighter(this.enemySprite, w, fighterFrac);

    this.playerSprite.y = this.stageY;
    this.enemySprite.y = this.stageY;

    // Face-off
    this.positionFaceOff(w, pad);

    // Under-character UI offset
    const belowFighter = (this.playerSprite.displayHeight || 0) * 0.65;
    const uiOffsetY = Math.max(70, belowFighter);

    const nameSize = Math.round(28 * uiScale);
    const statsSize = Math.round(22 * uiScale);

    this.playerNameText.setFontSize(nameSize);
    this.enemyNameText.setFontSize(nameSize);
    this.playerStatsText.setFontSize(statsSize);
    this.enemyStatsText.setFontSize(statsSize);

    this.playerNameText.setPosition(this.playerSprite.x, this.stageY + uiOffsetY);
    this.playerStatsText.setPosition(this.playerSprite.x, this.stageY + uiOffsetY + Math.round(34 * uiScale));

    this.enemyNameText.setPosition(this.enemySprite.x, this.stageY + uiOffsetY);
    this.enemyStatsText.setPosition(this.enemySprite.x, this.stageY + uiOffsetY + Math.round(34 * uiScale));

    // Message box
    const msgH = Math.round(64 * uiScale);
    const msgW = Math.min(w - pad * 2, w * 0.94);
    const msgY = pad + msgH * 0.7;

    this.messageBox.setPosition(w / 2, msgY).setSize(msgW, msgH);

    const msgFont = Math.round(18 * uiScale);
    this.messageText.setFontSize(msgFont);
    this.messageText.setPosition(w / 2, msgY);
    this.messageText.setWordWrapWidth(msgW * 0.92);

    // Buttons: row or stacked
    const narrow = w < 520 || aspect < 0.85;
    const btnW = narrow ? Math.min(w - pad * 2, w * 0.86) : Math.min(w * 0.22, 260);
    const btnH = Math.round((narrow ? 58 : 52) * uiScale);
    const btnFont = Math.round(22 * uiScale);

    const bottomY = h - pad - btnH * 0.8;

    if (narrow) {
      const gapY = Math.round(12 * uiScale);
      const startY = bottomY - (btnH + gapY) * 2;

      this.layoutButton("Attack", w / 2, startY + (btnH + gapY) * 0, btnW, btnH, btnFont);
      this.layoutButton("Defend", w / 2, startY + (btnH + gapY) * 1, btnW, btnH, btnFont);
      this.layoutButton("Breathe", w / 2, startY + (btnH + gapY) * 2, btnW, btnH, btnFont);
    } else {
      const spacing = Math.max(btnW + pad, w * 0.26);
      this.layoutButton("Attack", w / 2 - spacing, bottomY, btnW, btnH, btnFont);
      this.layoutButton("Defend", w / 2, bottomY, btnW, btnH, btnFont);
      this.layoutButton("Breathe", w / 2 + spacing, bottomY, btnW, btnH, btnFont);
    }

    // Round UI positioning
    const fighterTopY = this.stageY - (this.playerSprite.displayHeight || 200) * 0.80;
    const roundY = Math.max(msgY + msgH * 0.95, fighterTopY);

    const roundFont = Math.round(22 * uiScale);
    const moveFont = Math.round(20 * uiScale);
    const histFont = Math.round(18 * uiScale);

    this.roundText.setFontSize(roundFont).setPosition(w / 2, roundY);

    this.playerPickText.setFontSize(moveFont).setPosition(this.playerSprite.x, roundY + Math.round(32 * uiScale));
    this.enemyPickText.setFontSize(moveFont).setPosition(this.enemySprite.x, roundY + Math.round(32 * uiScale));

    // Horizontal history: icons march away from round number
    const gapX = Math.round(26 * uiScale);

    for (let i = 0; i < this.maxHistory; i++) {
      this.playerHistoryTexts[i].setFontSize(histFont);
      this.playerHistoryTexts[i].setPosition(w / 2 - gapX * (i + 1), roundY);

      this.enemyHistoryTexts[i].setFontSize(histFont);
      this.enemyHistoryTexts[i].setPosition(w / 2 + gapX * (i + 1), roundY);
    }

    // Attack popup centered
    if (this.attackPopup) {
      this.attackPopup.setPosition(w / 2, h / 2);
      this.updateAttackPopupUI();
    }

    // End popup sizing/centering (ensure dim covers new size)
    if (this.endPopup) {
      this.endPopupDim.setSize(w, h);
      this.endTitle.setPosition(w / 2, h / 2 - Math.round(38 * uiScale));
      this.endHint.setPosition(w / 2, h / 2 + Math.round(24 * uiScale));
      this.endTitle.setFontSize(Math.round(44 * uiScale));
      this.endHint.setFontSize(Math.round(20 * uiScale));
    }
  }

  layoutButton(label, x, y, width, height, fontSize) {
    const btn = this.buttons[label];
    if (!btn) return;
    btn.rect.setPosition(x, y).setSize(width, height);
    btn.txt.setPosition(x, y).setFontSize(fontSize);
  }

  // ==========================================================
  // Layout helpers
  // ==========================================================

  fitBackground(img, w, h) {
    const src = img.texture.getSourceImage();
    const iw = src.width || img.width;
    const ih = src.height || img.height;
    const s = Math.max(w / iw, h / ih);
    img.setScale(s);
  }

  fitFighter(img, w, widthFrac = 0.26) {
    const targetW = w * widthFrac;
    const src = img.texture.getSourceImage();
    const iw = src.width || img.width;
    const s = targetW / iw;
    img.setScale(s);
  }

  positionFaceOff(w, pad = 12) {
    const playerHalf = (this.playerSprite.displayWidth || this.playerSprite.width) / 2;
    const enemyHalf = (this.enemySprite.displayWidth || this.enemySprite.width) / 2;

    const gap = Phaser.Math.Clamp(w * 0.03, 14, 34);
    const center = w / 2;

    this.playerSprite.x = center - (playerHalf + gap / 2);
    this.enemySprite.x = center + (enemyHalf + gap / 2);

    const leftMin = pad + playerHalf;
    const rightMax = w - pad - enemyHalf;

    if (this.playerSprite.x < leftMin) {
      const shift = leftMin - this.playerSprite.x;
      this.playerSprite.x += shift;
      this.enemySprite.x += shift;
    }
    if (this.enemySprite.x > rightMax) {
      const shift = this.enemySprite.x - rightMax;
      this.playerSprite.x -= shift;
      this.enemySprite.x -= shift;
    }

    const minDist = playerHalf + enemyHalf + gap;
    const dist = this.enemySprite.x - this.playerSprite.x;
    if (dist < minDist) {
      const push = (minDist - dist) / 2;
      this.playerSprite.x -= push;
      this.enemySprite.x += push;
    }
  }

  // ==========================================================
  // UI helpers
  // ==========================================================

  createButtons() {
    this.buttons = {};
    this.createButton("Attack", 0, 0, () => this.onPressAttack());
    this.createButton("Defend", 0, 0, () => this.selectPlayerMove({ type: "DEFEND" }));
    this.createButton("Breathe", 0, 0, () => this.selectPlayerMove({ type: "BREATHE" }));
  }

  createButton(label, x, y, callback) {
    const rect = this.add
      .rectangle(x, y, 10, 10, 0x2e8b57, 1)
      .setStrokeStyle(2, 0x173f2b)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, { fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);

    rect.on("pointerdown", () => {
      if (this.turnLocked) return;

      this.tweens.add({
        targets: [rect, txt],
        scaleX: 0.96,
        scaleY: 0.96,
        yoyo: true,
        duration: 80,
      });

      callback();
    });

    rect.on("pointerover", () => rect.setFillStyle(0x35a56a, 1));
    rect.on("pointerout", () => rect.setFillStyle(0x2e8b57, 1));

    this.buttons[label] = { rect, txt };
  }

  createRoundUI() {
    this.roundText = this.add.text(0, 0, "", { fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);

    this.playerPickText = this.add
      .text(0, 0, "Pick: —", { fontSize: "20px", color: "#ffffff" })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.enemyPickText = this.add
      .text(0, 0, "Pick: ?", { fontSize: "20px", color: "#ffffff" })
      .setOrigin(0.5)
      .setAlpha(0.9);

    // Icon history slots
    for (let i = 0; i < this.maxHistory; i++) {
      const lt = this.add.text(0, 0, "", { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5).setAlpha(0.9);
      const rt = this.add.text(0, 0, "", { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5).setAlpha(0.9);
      this.playerHistoryTexts.push(lt);
      this.enemyHistoryTexts.push(rt);
    }
    this.renderHistory();
  }

  renderHistory() {
    for (let i = 0; i < this.maxHistory; i++) {
      const lp = this.playerMoveHistory[i] || "";
      const rp = this.enemyMoveHistory[i] || "";
      this.playerHistoryTexts[i].setText(lp).setVisible(!!lp);
      this.enemyHistoryTexts[i].setText(rp).setVisible(!!rp);
    }
  }

  // ==========================================================
  // End-of-match popup
  // ==========================================================

  createEndPopup() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.endPopupDim = this.add.rectangle(0, 0, w, h, 0x000000, 0.72).setOrigin(0);
    this.endPopupDim.setInteractive({ useHandCursor: true });

    this.endTitle = this.add
      .text(w / 2, h / 2 - 44, "", { fontSize: "44px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5);

    this.endHint = this.add
      .text(w / 2, h / 2 + 26, "Tap to continue", { fontSize: "20px", color: "#ffffff" })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.endPopup = this.add.container(0, 0, [this.endPopupDim, this.endTitle, this.endHint]);
    this.endPopup.setDepth(10000);
    this.endPopup.setVisible(false);

    this.endPopupDim.on("pointerdown", () => {
      // avoid double-start
      if (!this.endPopupShown) return;
      if (this.playerWins) {
        //More fights?
        if (this.enemyData.id + 1 === ENEMIES.length) {
          this.scene.start('WinScene');
        } else {
            this.scene.start('EnemyPreviewScene', { enemyIndex: this.enemyData.id + 1 });
        }
        
      } else {
        // Restart
        this.scene.start('EnemyPreviewScene', { enemyIndex: 0 });
      }
      
    });
  }

  showEndPopup(win) {
    if (this.endPopupShown) return;
    this.endPopupShown = true;

    this.turnLocked = true;
    this.hideAttackPopup();

    // Disable buttons visually & logically
    Object.values(this.buttons).forEach(({ rect, txt }) => {
      rect.disableInteractive();
      rect.setAlpha(0.4);
      txt.setAlpha(0.4);
    });

    this.endTitle.setText(win ? "YOU WIN 🎉" : "YOU LOSE 💀");
    this.endPopup.setVisible(true);

    // Small pop-in animation (optional but nice)
    this.endPopup.setAlpha(0);
    this.tweens.add({
      targets: this.endPopup,
      alpha: 1,
      duration: 180,
      ease: "Sine.easeOut",
    });
  }

  updateStatsText() {
    const hearts = (n) => "❤️".repeat(Math.max(0, n));
    const breaths = (n) => "💨".repeat(Math.max(0, n));

    this.playerStatsText.setText(`${hearts(this.playerHearts)}\n${breaths(this.playerBreath)}`);
    this.enemyStatsText.setText(`${hearts(this.enemyHearts)}\n${breaths(this.enemyBreath)}`);

    // Breath gating: cannot Attack/Defend at 0 breath
    const canSpend = this.playerBreath > 0;

    if (this.buttons.Attack) {
      this.buttons.Attack.rect.setAlpha(canSpend ? 1 : 0.4);
      this.buttons.Attack.rect[canSpend ? "setInteractive" : "disableInteractive"]({ useHandCursor: true });
      this.buttons.Attack.txt.setAlpha(canSpend ? 1 : 0.4);
    }
    if (this.buttons.Defend) {
      this.buttons.Defend.rect.setAlpha(canSpend ? 1 : 0.4);
      this.buttons.Defend.rect[canSpend ? "setInteractive" : "disableInteractive"]({ useHandCursor: true });
      this.buttons.Defend.txt.setAlpha(canSpend ? 1 : 0.4);
    }

    // End detection -> show popup + lock
    if (this.playerHearts <= 0) {
      this.setMessage("You are defeated...");
      this.playerWins = false;
      this.showEndPopup(false);
    } else if (this.enemyHearts <= 0) {
      this.setMessage("Enemy defeated! 🎉");
      this.playerWins = true;
      this.showEndPopup(true);
    }
  }

  setMessage(msg) {
    this.messageText.setText(msg);
  }

  disableButtons() {
    Object.values(this.buttons).forEach(({ rect, txt }) => {
      rect.disableInteractive();
      rect.setAlpha(0.4);
      txt.setAlpha(0.4);
    });
    this.turnLocked = true;
    this.hideAttackPopup();
  }

  // ==========================================================
  // Attack spend popup (simple +/- and Confirm)
  // ==========================================================

  createAttackPopup() {
    const bg = this.add.rectangle(0, 0, 320, 220, 0x000000, 0.75).setStrokeStyle(2, 0xffffff, 0.6);
    const title = this.add.text(0, -78, "Attack Power", { fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);

    this.attackSpendText = this.add.text(0, -28, "", { fontSize: "28px", color: "#ffffff" }).setOrigin(0.5);

    const minus = this.add
      .text(-70, -28, "−", { fontSize: "42px", color: "#ffffff" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const plus = this.add
      .text(70, -28, "+", { fontSize: "42px", color: "#ffffff" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const confirmRect = this.add
      .rectangle(0, 60, 220, 52, 0x2e8b57, 1)
      .setStrokeStyle(2, 0x173f2b)
      .setInteractive({ useHandCursor: true });

    const confirmTxt = this.add.text(0, 60, "Confirm", { fontSize: "22px", color: "#ffffff" }).setOrigin(0.5);

    const cancelTxt = this.add
      .text(0, 100, "Cancel", { fontSize: "18px", color: "#ffffff" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.9);

    minus.on("pointerdown", () => {
      if (!this.attackPopup?.visible) return;
      this.attackSpend = Math.max(1, this.attackSpend - 1);
      this.updateAttackPopupUI();
    });

    plus.on("pointerdown", () => {
      if (!this.attackPopup?.visible) return;
      const max = Math.max(1, this.playerBreath);
      this.attackSpend = Math.min(max, this.attackSpend + 1);
      this.updateAttackPopupUI();
    });

    confirmRect.on("pointerdown", () => {
      if (!this.attackPopup?.visible) return;
      const spend = Phaser.Math.Clamp(this.attackSpend, 1, Math.max(1, this.playerBreath));
      this.hideAttackPopup();
      this.selectPlayerMove({ type: "ATTACK", spend });
    });

    cancelTxt.on("pointerdown", () => {
      this.hideAttackPopup();
      this.setMessage("Choose a move.");
    });

    this.attackPopup = this.add.container(this.scale.width / 2, this.scale.height / 2, [
      bg,
      title,
      this.attackSpendText,
      minus,
      plus,
      confirmRect,
      confirmTxt,
      cancelTxt,
    ]);

    this.attackPopup.setDepth(9999);
    this.attackPopup.setVisible(false);
    this.updateAttackPopupUI();
  }

  updateAttackPopupUI() {
    if (!this.attackSpendText) return;
    const max = Math.max(1, this.playerBreath);
    this.attackSpend = Phaser.Math.Clamp(this.attackSpend, 1, max);
    this.attackSpendText.setText(`${this.attackSpend} 💨`);
  }

  showAttackPopup() {
    if (this.turnLocked) return;

    if (this.playerBreath <= 0) {
      this.setMessage("Out of breath — you can only Breathe.");
      return;
    }

    this.attackSpend = Math.max(1, Math.min(this.attackSpend, this.playerBreath));
    this.updateAttackPopupUI();
    this.attackPopup.setVisible(true);

    // Lock other inputs while popup is open
    this.turnLocked = true;
  }

  hideAttackPopup() {
    if (!this.attackPopup) return;
    this.attackPopup.setVisible(false);

    // Unlock if battle not ended AND no end popup
    if (this.playerHearts > 0 && this.enemyHearts > 0 && !this.endPopupShown) {
      this.turnLocked = false;
    }
  }

  onPressAttack() {
    // Must have breath to attack
    if (this.playerBreath <= 0) {
      this.setMessage("Out of breath — you can only Breathe.");
      return;
    }
    this.showAttackPopup();
  }

  // ==========================================================
  // Round system (resolve when both have selected)
  // ==========================================================

  startRound() {
    if (this.playerHearts <= 0 || this.enemyHearts <= 0) return;

    this.round += 1;
    this.playerChoice = null;
    this.enemyChoice = null;

    this.roundText.setText(`Round ${this.round}`);

    this.playerPickText.setText("Pick: —");
    this.enemyPickText.setText("Pick: ?");

    this.turnLocked = false;
    this.hideAttackPopup();
    this.updateStatsText();
  }

  selectPlayerMove(choice) {
    // choice is object: {type, spend?}
    if (this.turnLocked) return;
    if (this.endPopupShown) return;

    // Breath gating: cannot Attack/Defend at 0 breath
    if ((choice.type === "ATTACK" || choice.type === "DEFEND") && this.playerBreath <= 0) {
      this.setMessage("Out of breath — you can only Breathe.");
      return;
    }

    this.playerChoice = choice;
    this.playerPickText.setText(`Pick: ${this.icon(choice)}`);

    // Enemy picks immediately (secret)
    this.enemyChoice = this.pickEnemyMove();
    this.enemyPickText.setText("Pick: ?");

    // Resolve
    this.resolveRoundAndAdvance();
  }

  pickEnemyMove() {
    // If enemy has no breath, it must breathe
    if (this.enemyBreath <= 0) return { type: "BREATHE" };

    // Enemy can ATTACK/DEFEND if has breath
    const intents = ["ATTACK", "DEFEND", "BREATHE"];
    const type = Phaser.Utils.Array.GetRandom(intents);

    if (type === "ATTACK") {
      const spend = Phaser.Math.Between(1, Math.max(1, this.enemyBreath));
      return { type: "ATTACK", spend };
    }
    if (type === "DEFEND") return { type: "DEFEND" };
    return { type: "BREATHE" };
  }

  resolveRoundAndAdvance() {
    if (!this.playerChoice || !this.enemyChoice) return;

    this.turnLocked = true;
    this.hideAttackPopup();

    const p = this.playerChoice;
    const e = this.enemyChoice;

    // Reveal enemy pick now
    this.enemyPickText.setText(`Pick: ${this.icon(e)}`);

    const summary = this.resolveRound(p, e);

    // Push icons into horizontal history (newest closest to round number)
    this.playerMoveHistory.unshift(this.icon(p));
    this.enemyMoveHistory.unshift(this.icon(e));
    this.playerMoveHistory = this.playerMoveHistory.slice(0, this.maxHistory);
    this.enemyMoveHistory = this.enemyMoveHistory.slice(0, this.maxHistory);

    this.renderHistory();
    this.updateStatsText();
    this.setMessage(summary);

    // If match ended, do NOT start next round; popup handles continue
    if (this.playerHearts <= 0 || this.enemyHearts <= 0) return;

    // Next round
    this.time.delayedCall(700, () => {
      if (this.playerHearts <= 0 || this.enemyHearts <= 0) return;
      if (this.endPopupShown) return;
      this.startRound();
    });
  }

  // ==========================================================
  // Rules
  // ==========================================================

  resolveRound(p, e) {
    if (this.playerHearts <= 0 || this.enemyHearts <= 0) return "Battle over.";

    // Normalize spends
    const pType = p.type;
    const eType = e.type;

    const pAttackSpend =
      pType === "ATTACK" ? Phaser.Math.Clamp(p.spend ?? 1, 1, Math.max(1, this.playerBreath)) : 0;

    const eAttackSpend =
      eType === "ATTACK" ? Phaser.Math.Clamp(e.spend ?? 1, 1, Math.max(1, this.enemyBreath)) : 0;

    const pBlocks = pType === "DEFEND" && eType === "ATTACK";
    const eBlocks = eType === "DEFEND" && pType === "ATTACK";

    // Breath costs:
    if (pType === "ATTACK") this.playerBreath = Math.max(0, this.playerBreath - pAttackSpend);
    if (eType === "ATTACK") this.enemyBreath = Math.max(0, this.enemyBreath - eAttackSpend);

    // Defend costs 1 breath ONLY if it did NOT block an attack
    if (pType === "DEFEND" && !pBlocks) this.playerBreath = Math.max(0, this.playerBreath - 1);
    if (eType === "DEFEND" && !eBlocks) this.enemyBreath = Math.max(0, this.enemyBreath - 1);

    // Breathe recovers +1 breath (cap)
    if (pType === "BREATHE") this.playerBreath = Math.min(this.playerBreathMax, this.playerBreath + 1);
    if (eType === "BREATHE") this.enemyBreath = Math.min(this.enemyBreathMax, this.enemyBreath + 1);

    // Damage:
    const dmgToEnemy = pType === "ATTACK" && !eBlocks ? pAttackSpend : 0;
    const dmgToPlayer = eType === "ATTACK" && !pBlocks ? eAttackSpend : 0;

    if (dmgToEnemy > 0) this.enemyHearts = Math.max(0, this.enemyHearts - dmgToEnemy);
    if (dmgToPlayer > 0) this.playerHearts = Math.max(0, this.playerHearts - dmgToPlayer);

    // Summary
    const lines = [];
    lines.push(
      `You ${this.moveName(p)}${pType === "ATTACK" ? ` (${pAttackSpend})` : ""} • ` +
        `Enemy ${this.moveName(e)}${eType === "ATTACK" ? ` (${eAttackSpend})` : ""}`
    );

    if (pBlocks) lines.push(`🛡️ You block! Enemy wastes ${eAttackSpend} 💨.`);
    if (eBlocks) lines.push(`🛡️ Enemy blocks! You waste ${pAttackSpend} 💨.`);
    if (!pBlocks && dmgToPlayer > 0) lines.push(`You take ${dmgToPlayer} ❤️.`);
    if (!eBlocks && dmgToEnemy > 0) lines.push(`Enemy takes ${dmgToEnemy} ❤️.`);

    if (pType === "BREATHE") lines.push("You recover +1 💨.");
    if (eType === "BREATHE") lines.push("Enemy recovers +1 💨.");

    if (pType === "DEFEND" && !pBlocks) lines.push("You brace (costs 1 💨).");
    if (eType === "DEFEND" && !eBlocks) lines.push("Enemy braces (costs 1 💨).");

    if (this.enemyHearts <= 0) lines.push("Enemy defeated! 🎉");
    if (this.playerHearts <= 0) lines.push("You are defeated...");

    return lines.join("\n");
  }

  // ==========================================================
  // Icons / names
  // ==========================================================

  icon(choiceOrMove) {
    const t = typeof choiceOrMove === "string" ? choiceOrMove : choiceOrMove.type;
    if (t === "ATTACK") return "⚔️";
    if (t === "DEFEND") return "🛡️";
    return "🌬️";
  }

  moveName(choiceOrMove) {
    const t = typeof choiceOrMove === "string" ? choiceOrMove : choiceOrMove.type;
    if (t === "ATTACK") return "attack";
    if (t === "DEFEND") return "defend";
    return "breathe";
  }

  // ==========================================================
  // Resize
  // ==========================================================

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    this.layout(w, h);
  }
}
