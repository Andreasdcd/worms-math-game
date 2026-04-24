import Phaser from 'phaser';
import { networkManager } from '../utils/networkManager.js';
import { platformBridge } from '../sdk/platformBridge.js';

/**
 * QuizScene
 * Server-authoritative pre-match quiz that determines who goes first.
 * Transitions to GameScene with { firstTurnUserId, roomCode } when done.
 */
export default class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizScene' });
  }

  init(data) {
    this.roomCode = data.roomCode || '';
    // socket is still passed through for backwards compat but we use networkManager
    this._socket = data.socket || null;
    this.playerName = data.playerName || '';
    this.buttonsDisabled = true;
    this.timerEvent = null;
    this.timerBarTween = null;

    // Embed-mode props (forwarded by EmbedBootScene → WaitingRoomScene → here)
    this.embedded = !!data.embedded;
    this.studentId = data.studentId || null;
    this.classId = data.classId || null;
    this.topicId = data.topicId || null;
    this.learningGoals = data.learningGoals || null;
    this.soloMode = !!data.soloMode;
    this.embedMode = data.mode || null;
  }

  create() {
    const { width, height } = this.cameras.main;

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // ── Title ───────────────────────────────────────────────────────────────
    this.add.text(width / 2, 36, 'MATEMATIK QUIZ', {
      fontSize: '40px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    // ── Question counter ─────────────────────────────────────────────────────
    this.questionCounterText = this.add.text(width / 2, 80, '', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // ── Timer label ──────────────────────────────────────────────────────────
    this.add.text(width / 2, 110, 'Tid tilbage', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#CCCCCC'
    }).setOrigin(0.5);

    // ── Timer bar ───────────────────────────────────────────────────────────
    const barW = 600;
    const barH = 20;
    const barX = (width - barW) / 2;
    const barY = 128;

    this.add.rectangle(barX, barY, barW, barH, 0x333333).setOrigin(0);
    this.timerBarFill = this.add.rectangle(barX, barY, barW, barH, 0x00e676).setOrigin(0);

    // ── Question text ────────────────────────────────────────────────────────
    this.questionText = this.add.text(width / 2, 220, '', {
      fontSize: '52px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    // ── Answer buttons (2 × 2 grid) ──────────────────────────────────────────
    const bW = 340;
    const bH = 80;
    const gapX = 20;
    const gapY = 16;
    const gridLeft = width / 2 - bW - gapX / 2;
    const gridTop = 310;

    this.optionButtons = [];

    const positions = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 }
    ];

    const labels = ['A', 'B', 'C', 'D'];

    positions.forEach(({ col, row }, i) => {
      const x = gridLeft + col * (bW + gapX);
      const y = gridTop + row * (bH + gapY);

      const btn = this._makeButton(x, y, bW, bH, labels[i], i);
      this.optionButtons.push(btn);
    });

    // ── Feedback text ────────────────────────────────────────────────────────
    this.feedbackText = this.add.text(width / 2, gridTop + 2 * (bH + gapY) + 30, '', {
      fontSize: '28px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5).setVisible(false);

    // ── Scoreboard container (hidden until quiz:complete) ────────────────────
    this.scoreboardContainer = this.add.container(0, 0).setVisible(false);

    // ── Register network listeners ───────────────────────────────────────────
    this._onQuestion = this._handleQuestion.bind(this);
    this._onComplete = this._handleComplete.bind(this);
    networkManager.on('quiz:question', this._onQuestion);
    networkManager.on('quiz:complete', this._onComplete);

    // ── Kick off quiz ────────────────────────────────────────────────────────
    // For solo mode without a roomCode, use the studentId as a synthetic room
    if (this.soloMode && !this.roomCode) {
      this.roomCode = `solo_${this.studentId || Date.now()}`;
    }
    const startPayload = { roomCode: this.roomCode };
    if (this.learningGoals) startPayload.learningGoals = this.learningGoals;
    networkManager.send('quiz:start', startPayload);

    if (this.embedded) platformBridge.sendEvent('quiz_started', { topicId: this.topicId });
  }

  // ── Button factory ─────────────────────────────────────────────────────────

  _makeButton(x, y, bW, bH, label, index) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, bW, bH, 0x3a86ff).setOrigin(0).setInteractive({ useHandCursor: true });

    const labelTxt = this.add.text(18, bH / 2, `${label}.`, {
      fontSize: '26px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0, 0.5);

    const valueTxt = this.add.text(60, bH / 2, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      wordWrap: { width: bW - 70 }
    }).setOrigin(0, 0.5);

    container.add([bg, labelTxt, valueTxt]);
    container._bg = bg;
    container._value = valueTxt;
    container._index = index;

    bg.on('pointerover', () => {
      if (!this.buttonsDisabled) bg.setFillStyle(0x5aa3ff);
    });
    bg.on('pointerout', () => {
      if (!this.buttonsDisabled) bg.setFillStyle(0x3a86ff);
    });
    bg.on('pointerdown', () => {
      if (!this.buttonsDisabled) this._submitAnswer(index);
    });

    return container;
  }

  // ── Network event handlers ─────────────────────────────────────────────────

  _handleQuestion(data) {
    const { number, total, question, options, timeLimit } = data;

    // Show question UI, hide scoreboard
    this.scoreboardContainer.setVisible(false);
    this.feedbackText.setVisible(false);
    this.buttonsDisabled = false;

    // Update counter
    this.questionCounterText.setText(`Spørgsmål ${number}/${total}`);

    // Update question text
    this.questionText.setText(question);

    // Update button labels
    this.optionButtons.forEach((btn, i) => {
      btn._value.setText(String(options[i]));
      btn._bg.setFillStyle(0x3a86ff);
      btn._bg.setInteractive({ useHandCursor: true });
      // Store the raw option value so we can send it on click
      btn._optionValue = options[i];
    });

    // Animate timer bar from full → empty
    const barW = 600;
    if (this.timerBarTween) this.timerBarTween.stop();
    this.timerBarFill.width = barW;
    this.timerBarFill.setFillStyle(0x00e676);

    this.timerBarTween = this.tweens.add({
      targets: this.timerBarFill,
      width: 0,
      duration: timeLimit * 1000,
      ease: 'Linear',
      onUpdate: () => {
        const pct = this.timerBarFill.width / barW;
        if (pct < 0.25) {
          this.timerBarFill.setFillStyle(0xff1744);
        } else if (pct < 0.5) {
          this.timerBarFill.setFillStyle(0xff9100);
        } else {
          this.timerBarFill.setFillStyle(0x00e676);
        }
      }
    });
  }

  _submitAnswer(buttonIndex) {
    if (this.buttonsDisabled) return;
    this.buttonsDisabled = true;

    // Stop timer bar
    if (this.timerBarTween) {
      this.timerBarTween.stop();
      this.timerBarTween = null;
    }

    const btn = this.optionButtons[buttonIndex];
    const answer = btn._optionValue;

    // Highlight selected button
    btn._bg.setFillStyle(0xffd700);

    // Disable all buttons visually
    this.optionButtons.forEach((b) => {
      b._bg.disableInteractive();
    });

    // Send answer to server (server checks correctness)
    networkManager.send('quiz:answer', { roomCode: this.roomCode, answer });

    if (this.embedded) {
      platformBridge.sendProgress('opgaver_besvaret',
        (this._answeredCount = (this._answeredCount || 0) + 1));
    }
  }

  // ── Quiz complete ──────────────────────────────────────────────────────────

  _handleComplete(data) {
    const { scores, winnerUserId } = data;

    // Stop timer bar
    if (this.timerBarTween) {
      this.timerBarTween.stop();
      this.timerBarTween = null;
    }
    this.buttonsDisabled = true;

    // Hide question UI
    this.questionText.setVisible(false);
    this.questionCounterText.setVisible(false);
    this.feedbackText.setVisible(false);
    this.optionButtons.forEach(b => b.setVisible(false));
    this.timerBarFill.setVisible(false);

    // ── Build scoreboard ──────────────────────────────────────────────────
    this.scoreboardContainer.removeAll(true);
    this.scoreboardContainer.setVisible(true);

    const { width, height } = this.cameras.main;

    // Find winner name
    const winner = scores[0];
    const winnerName = winner ? winner.username : 'Ingen';

    const titleTxt = this.add.text(width / 2, 80, `${winnerName} vandt quizzen!`, {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    this.scoreboardContainer.add(titleTxt);

    // Header
    const headerTxt = this.add.text(width / 2, 140, 'Stilling', {
      fontSize: '26px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.scoreboardContainer.add(headerTxt);

    scores.forEach((entry, idx) => {
      const yPos = 190 + idx * 60;
      const isWinner = idx === 0;

      const rowBg = this.add.rectangle(width / 2, yPos, 600, 50,
        isWinner ? 0x2d6a4f : 0x2a2a3e).setOrigin(0.5);
      this.scoreboardContainer.add(rowBg);

      const rankTxt = this.add.text(width / 2 - 270, yPos,
        `${idx + 1}.`, {
        fontSize: '22px',
        fontFamily: 'Arial Black',
        color: isWinner ? '#FFD700' : '#CCCCCC'
      }).setOrigin(0, 0.5);
      this.scoreboardContainer.add(rankTxt);

      const nameTxt = this.add.text(width / 2 - 230, yPos,
        entry.username, {
        fontSize: '22px',
        fontFamily: 'Arial Black',
        color: isWinner ? '#FFD700' : '#FFFFFF'
      }).setOrigin(0, 0.5);
      this.scoreboardContainer.add(nameTxt);

      const scoreTxt = this.add.text(width / 2 + 150, yPos,
        `${entry.correct} rigtige / ${entry.wrong} forkerte`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#AAAAAA'
      }).setOrigin(0, 0.5);
      this.scoreboardContainer.add(scoreTxt);
    });

    // Winner banner
    const bannerY = 190 + scores.length * 60 + 40;
    const bannerTxt = this.add.text(width / 2, bannerY,
      `${winnerName} får første tur!`, {
      fontSize: '30px',
      fontFamily: 'Arial Black',
      color: '#00e676',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.scoreboardContainer.add(bannerTxt);

    // ── Embed: emit per-question stats and route based on mode ─────────────
    if (this.embedded) {
      // Find this student's score so we can build perGoal
      const myScore = scores.find(s => s.userId === this.studentId)
                   || scores.find(s => s.username === this.studentId)
                   || scores[0] || { correct: 0, wrong: 0, perGoal: {} };

      platformBridge.sendEvent('quiz_complete', {
        winnerUserId,
        myCorrect: myScore.correct,
        myWrong: myScore.wrong
      });

      if (this.soloMode) {
        // Solo mode ends here — emit complete and show a "tak" screen.
        const totalAnswered = myScore.correct + myScore.wrong;
        const score = totalAnswered > 0
          ? Math.round((myScore.correct / totalAnswered) * 100)
          : 0;
        platformBridge.sendComplete(score, 1.0, {
          perGoal: myScore.perGoal || {},
          gameSpecific: { mode: 'solo', totalAnswered }
        });
        this._showSoloEndScreen(myScore);
        return;
      }
    }

    // Class mode (or non-embedded): transition to GameScene after 3s
    this.time.delayedCall(3000, () => {
      this.scene.start('GameScene', {
        firstTurnUserId: winnerUserId,
        roomCode: this.roomCode,
        // forward embed context so GameScene/VictoryScene can emit complete
        embedded: this.embedded,
        studentId: this.studentId,
        classId: this.classId,
        topicId: this.topicId,
        learningGoals: this.learningGoals,
        quizPerGoal: scores.reduce((acc, s) => {
          acc[s.userId] = s.perGoal || {};
          return acc;
        }, {})
      });
    });
  }

  _showSoloEndScreen(myScore) {
    const { width, height } = this.cameras.main;
    this.scoreboardContainer.setVisible(false);
    this.questionText.setText('');
    this.optionButtons.forEach(b => b.setVisible(false));

    this.add.text(width / 2, height / 2 - 30, 'Tak for din quiz!', {
      fontSize: '38px', fontFamily: 'Arial Black', color: '#FFD700',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 30,
      `${myScore.correct} rigtige / ${myScore.wrong} forkerte`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 70, 'Du kan lukke vinduet.', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  shutdown() {
    networkManager.off('quiz:question', this._onQuestion);
    networkManager.off('quiz:complete', this._onComplete);

    if (this.timerBarTween) {
      this.timerBarTween.stop();
      this.timerBarTween = null;
    }
  }
}
