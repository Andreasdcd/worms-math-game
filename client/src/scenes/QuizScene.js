import Phaser from 'phaser';
import { quizManager } from '../utils/quizManager.js';

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizScene' });
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.correctAnswers = 0;
    this.startTime = 0;
    this.timerDuration = 60; // 60 seconds total
    this.completedPlayers = [];
    this.hasCompleted = false;
  }

  init(data) {
    this.socket = data.socket;
    this.playerName = data.playerName;
    this.roomCode = data.roomCode;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Title
    this.add.text(width / 2, 40, 'MATEMATIK QUIZ', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Timer display (top-right)
    this.timerText = this.add.text(width - 120, 40, '60', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#00FF00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width - 120, 90, 'sekunder', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Completion sidebar (left)
    this.completionContainer = this.add.container(20, 120);
    this.completionTitle = this.add.text(0, 0, 'FÆRDIGE:', {
      fontSize: '24px',
      fontFamily: 'Arial Black',
      color: '#FFD700'
    }).setOrigin(0);
    this.completionContainer.add(this.completionTitle);

    this.completionListTexts = [];

    // Question display area
    this.questionText = this.add.text(width / 2, 150, '', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: width - 400 }
    }).setOrigin(0.5);

    // Question counter
    this.questionCounter = this.add.text(width / 2, 220, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // Answer buttons (2x2 grid)
    this.answerButtons = [];
    const buttonWidth = 400;
    const buttonHeight = 80;
    const buttonSpacing = 20;
    const startX = width / 2 - buttonWidth - buttonSpacing / 2;
    const startY = 320;

    const buttonLabels = ['A', 'B', 'C', 'D'];
    const positions = [
      { x: startX, y: startY },
      { x: startX + buttonWidth + buttonSpacing, y: startY },
      { x: startX, y: startY + buttonHeight + buttonSpacing },
      { x: startX + buttonWidth + buttonSpacing, y: startY + buttonHeight + buttonSpacing }
    ];

    for (let i = 0; i < 4; i++) {
      const button = this.createAnswerButton(
        positions[i].x,
        positions[i].y,
        buttonWidth,
        buttonHeight,
        buttonLabels[i],
        i
      );
      this.answerButtons.push(button);
    }

    // Feedback text
    this.feedbackText = this.add.text(width / 2, height - 80, '', {
      fontSize: '28px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5).setVisible(false);

    // Initialize quiz
    this.startQuiz();

    // Socket listeners
    this.setupSocketListeners();
  }

  createAnswerButton(x, y, width, height, label, index) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, 0x3a86ff)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    const labelText = this.add.text(20, height / 2, label + '.', {
      fontSize: '28px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0, 0.5);

    const answerText = this.add.text(60, height / 2, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      wordWrap: { width: width - 80 }
    }).setOrigin(0, 0.5);

    container.add([bg, labelText, answerText]);

    // Hover effect
    bg.on('pointerover', () => {
      if (!this.hasCompleted) {
        bg.setFillStyle(0x5aa3ff);
      }
    });

    bg.on('pointerout', () => {
      if (!this.hasCompleted) {
        bg.setFillStyle(0x3a86ff);
      }
    });

    bg.on('pointerdown', () => {
      if (!this.hasCompleted) {
        this.selectAnswer(index);
      }
    });

    container.bg = bg;
    container.answerText = answerText;

    return container;
  }

  startQuiz() {
    // Select 5 random questions
    this.questions = quizManager.selectRandomQuestions(5);
    this.currentQuestionIndex = 0;
    this.correctAnswers = 0;
    this.startTime = Date.now();
    this.hasCompleted = false;

    // Start timer
    this.timeRemaining = this.timerDuration;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    this.displayQuestion();
  }

  displayQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.completeQuiz();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];

    this.questionText.setText(question.question);
    this.questionCounter.setText(`Spørgsmål ${this.currentQuestionIndex + 1} af ${this.questions.length}`);

    // Update answer buttons
    for (let i = 0; i < 4; i++) {
      this.answerButtons[i].answerText.setText(question.options[i]);
      this.answerButtons[i].bg.setFillStyle(0x3a86ff);
    }

    this.feedbackText.setVisible(false);
  }

  selectAnswer(answerIndex) {
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = quizManager.checkAnswer(question.id, answerIndex);

    if (isCorrect) {
      this.correctAnswers++;
      this.showFeedback(true, answerIndex);
    } else {
      this.showFeedback(false, answerIndex, question.correct_answer);
    }

    // Move to next question after brief delay
    this.time.delayedCall(1500, () => {
      this.currentQuestionIndex++;
      this.displayQuestion();
    });
  }

  showFeedback(isCorrect, selectedIndex, correctIndex = null) {
    if (isCorrect) {
      this.answerButtons[selectedIndex].bg.setFillStyle(0x00FF00);
      this.feedbackText.setText('RIGTIGT! ✓')
        .setColor('#00FF00')
        .setVisible(true);

      // Flash effect
      this.cameras.main.flash(200, 0, 255, 0);
    } else {
      this.answerButtons[selectedIndex].bg.setFillStyle(0xFF0000);
      if (correctIndex !== null) {
        this.answerButtons[correctIndex].bg.setFillStyle(0x00FF00);
      }
      this.feedbackText.setText('FORKERT ✗')
        .setColor('#FF0000')
        .setVisible(true);

      // Shake effect
      this.cameras.main.shake(200, 0.005);
    }
  }

  updateTimer() {
    this.timeRemaining--;

    this.timerText.setText(this.timeRemaining.toString());

    // Change color when time is running out
    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#FF0000');
    } else if (this.timeRemaining <= 20) {
      this.timerText.setColor('#FFA500');
    }

    // Time's up
    if (this.timeRemaining <= 0) {
      this.timerEvent.remove();
      if (!this.hasCompleted) {
        this.completeQuiz();
      }
    }
  }

  completeQuiz() {
    this.hasCompleted = true;
    const completionTime = Math.round((Date.now() - this.startTime) / 1000);
    const score = quizManager.calculateScore();

    // Disable all buttons
    this.answerButtons.forEach(button => {
      button.bg.disableInteractive();
      button.bg.setFillStyle(0x666666);
    });

    // Show completion message
    this.feedbackText.setText(`DU ER FÆRDIG! Score: ${this.correctAnswers}/${this.questions.length}`)
      .setColor('#FFD700')
      .setFontSize('32px')
      .setVisible(true);

    // Notify server
    this.socket.emit('quiz:completed', {
      roomCode: this.roomCode,
      playerName: this.playerName,
      score: this.correctAnswers,
      completionTime: completionTime
    });

    console.log(`Quiz completed - Score: ${this.correctAnswers}/${this.questions.length}, Time: ${completionTime}s`);
  }

  setupSocketListeners() {
    // Listen for other players completing
    this.socket.on('quiz:player_completed', (data) => {
      this.addCompletedPlayer(data);
    });

    // Listen for all players completing
    this.socket.on('quiz:all_completed', (data) => {
      console.log('All players completed quiz. Turn order:', data.turnOrder);

      // Show final leaderboard
      this.time.delayedCall(3000, () => {
        this.scene.start('GameScene', {
          socket: this.socket,
          playerName: this.playerName,
          roomCode: this.roomCode,
          turnOrder: data.turnOrder
        });
      });
    });
  }

  addCompletedPlayer(playerData) {
    this.completedPlayers.push(playerData);

    // Update completion list
    this.updateCompletionList();
  }

  updateCompletionList() {
    // Clear existing texts
    this.completionListTexts.forEach(text => text.destroy());
    this.completionListTexts = [];

    // Sort by completion time
    const sorted = [...this.completedPlayers].sort((a, b) => a.completionTime - b.completionTime);

    // Display each completed player
    sorted.forEach((player, index) => {
      const yPos = 40 + (index * 35);
      const text = this.add.text(10, yPos,
        `${index + 1}. ${player.playerName} - ${player.completionTime}s`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }).setOrigin(0);

      this.completionContainer.add(text);
      this.completionListTexts.push(text);
    });
  }

  shutdown() {
    // Clean up socket listeners
    this.socket.off('quiz:player_completed');
    this.socket.off('quiz:all_completed');

    // Clean up timer
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
  }
}
