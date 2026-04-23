import Phaser from 'phaser';
import { SERVER_URL } from '../config.js';

export default class TeacherDashboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TeacherDashboardScene' });
    this.teacherName = '';
    this.teacherId = null;
    this.studentStats = [];
    this.sortBy = 'name'; // name, total, accuracy
    this.sortAscending = true;
    this.filterStruggling = false; // Show only students with <70% accuracy
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0f0f23).setOrigin(0);

    // Check if logged in as teacher
    const storedUser = localStorage.getItem('wormsTeacher');
    if (storedUser) {
      const teacher = JSON.parse(storedUser);
      this.teacherName = teacher.username;
      this.teacherId = teacher.id;
      this.showDashboard();
    } else {
      this.showLoginForm();
    }
  }

  showLoginForm() {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, 80, 'LÆRER LOGIN', {
      fontSize: '56px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Login container
    const loginContainer = this.add.container(width / 2, height / 2 - 50);

    const bg = this.add.rectangle(0, 0, 500, 350, 0x1a1a2e);
    bg.setStrokeStyle(4, 0x3a86ff);

    const title = this.add.text(0, -140, 'Lærer Adgang', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    const instruction = this.add.text(0, -80, 'Brugernavn:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // Username input field
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = 'Lærer brugernavn...';
    inputElement.maxLength = 20;
    inputElement.style.position = 'absolute';
    inputElement.style.left = `${width / 2 - 150}px`;
    inputElement.style.top = `${height / 2 - 80}px`;
    inputElement.style.width = '300px';
    inputElement.style.height = '40px';
    inputElement.style.fontSize = '20px';
    inputElement.style.padding = '8px';
    inputElement.style.borderRadius = '8px';
    inputElement.style.border = '2px solid #3a86ff';
    inputElement.style.backgroundColor = '#0f0f23';
    inputElement.style.color = '#FFFFFF';
    inputElement.style.textAlign = 'center';
    document.body.appendChild(inputElement);
    inputElement.focus();

    this.inputElement = inputElement;

    // Password input field
    const passwordElement = document.createElement('input');
    passwordElement.type = 'password';
    passwordElement.placeholder = 'Adgangskode...';
    passwordElement.maxLength = 50;
    passwordElement.style.position = 'absolute';
    passwordElement.style.left = `${width / 2 - 150}px`;
    passwordElement.style.top = `${height / 2 - 20}px`;
    passwordElement.style.width = '300px';
    passwordElement.style.height = '40px';
    passwordElement.style.fontSize = '20px';
    passwordElement.style.padding = '8px';
    passwordElement.style.borderRadius = '8px';
    passwordElement.style.border = '2px solid #3a86ff';
    passwordElement.style.backgroundColor = '#0f0f23';
    passwordElement.style.color = '#FFFFFF';
    passwordElement.style.textAlign = 'center';
    document.body.appendChild(passwordElement);

    this.passwordElement = passwordElement;

    // Login button
    const loginButton = this.createButton(0, 80, 280, 60, 'LOG IND', () => {
      const username = inputElement.value.trim();
      const password = passwordElement.value.trim();
      if (username.length >= 3) {
        this.login(username, password);
      } else {
        this.showError('Brugernavn skal være mindst 3 tegn');
      }
    });

    // Back button
    const backButton = this.createButton(0, 150, 280, 50, 'TILBAGE', () => {
      this.cleanupInputs();
      this.scene.start('LobbyScene');
    }, 0x888888);

    loginContainer.add([bg, title, instruction, loginButton, backButton]);

    // Error text
    this.errorText = this.add.text(width / 2, height / 2 + 180, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FF0000'
    }).setOrigin(0.5);

    // Handle Enter key
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        loginButton.emit('pointerdown');
      }
    };
    inputElement.addEventListener('keypress', handleEnter);
    passwordElement.addEventListener('keypress', handleEnter);
  }

  async login(username, password) {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (data.success) {
        // Check if user is a teacher
        if (data.user.role !== 'teacher') {
          this.showError('Kun lærere kan tilgå dette område');
          return;
        }

        // Store teacher data
        localStorage.setItem('wormsTeacher', JSON.stringify(data.user));
        this.teacherName = data.user.username;
        this.teacherId = data.user.id;

        // Clean up and show dashboard
        this.cleanupInputs();
        this.scene.restart();
      } else {
        this.showError('Bruger ikke fundet. Kontakt administrator.');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Kunne ikke oprette forbindelse til serveren');
    }
  }

  showError(message) {
    if (this.errorText) {
      this.errorText.setText(message);
      this.time.delayedCall(3000, () => {
        if (this.errorText) {
          this.errorText.setText('');
        }
      });
    }
  }

  async showDashboard() {
    const { width, height } = this.cameras.main;

    // Header section
    this.add.text(width / 2, 40, 'LÆRER DASHBOARD - 5.A', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 85, `Lærer: ${this.teacherName}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // Buttons
    const refreshBtn = this.createButton(width - 300, 40, 140, 45, 'OPDATER', () => {
      this.refreshStats();
    }, 0x00AA00);

    const logoutBtn = this.createButton(width - 140, 40, 120, 45, 'LOG UD', () => {
      localStorage.removeItem('wormsTeacher');
      this.scene.start('LobbyScene');
    }, 0xAA0000);

    // Sort and filter controls
    const controlsY = 130;

    this.add.text(50, controlsY, 'Sorter:', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    });

    this.createButton(140, controlsY, 120, 35, 'Navn', () => this.setSortBy('name'), 0x555555);
    this.createButton(270, controlsY, 140, 35, 'Spørgsmål', () => this.setSortBy('total'), 0x555555);
    this.createButton(420, controlsY, 130, 35, 'Korrekt %', () => this.setSortBy('accuracy'), 0x555555);

    // Filter toggle
    this.filterToggleBtn = this.createButton(width - 320, controlsY, 280, 35,
      'Vis kun elever <70% korrekt',
      () => this.toggleFilter(),
      this.filterStruggling ? 0xAA5500 : 0x555555
    );

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Henter data...', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Fetch stats
    await this.fetchStats();
  }

  async fetchStats() {
    try {
      const response = await fetch(`${SERVER_URL}/api/quiz/teacher/stats');
      const data = await response.json();

      if (data.success) {
        // Process the stats data
        this.processStats(data.stats);
        this.displayStats();
      } else {
        this.showError('Kunne ikke hente statistik');
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
      this.showError('Kunne ikke oprette forbindelse til serveren');
    }
  }

  processStats(stats) {
    // Get user data for each student
    this.studentStats = stats.byUser.map(userStat => {
      const byTopic = {
        division: userStat.byTopic['division'] || { correct: 0, total: 0, accuracy: 0 },
        brøker: userStat.byTopic['brøker'] || { correct: 0, total: 0, accuracy: 0 },
        geometri: userStat.byTopic['geometri'] || { correct: 0, total: 0, accuracy: 0 },
        problemregning: userStat.byTopic['problemregning'] || { correct: 0, total: 0, accuracy: 0 }
      };

      return {
        userId: userStat.userId,
        username: userStat.username || 'Ukendt', // Will be fetched separately
        totalAttempts: userStat.total,
        correctCount: userStat.correct,
        accuracy: userStat.accuracy,
        byTopic: byTopic
      };
    });

    // Fetch usernames for all students
    this.fetchUsernames();
  }

  async fetchUsernames() {
    // Fetch all users to get usernames
    try {
      const usernames = {};

      for (const student of this.studentStats) {
        try {
          const response = await fetch(`${SERVER_URL}/api/auth/user/${student.userId}`);
          const data = await response.json();
          if (data.success) {
            usernames[student.userId] = data.user.username;
          }
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      }

      // Update student stats with usernames
      this.studentStats.forEach(student => {
        if (usernames[student.userId]) {
          student.username = usernames[student.userId];
        }
      });

      // Redisplay with usernames
      this.displayStats();
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  }

  displayStats() {
    const { width, height } = this.cameras.main;

    // Clear loading text
    if (this.loadingText) {
      this.loadingText.destroy();
    }

    // Clear previous stats display
    if (this.statsContainer) {
      this.statsContainer.destroy();
    }

    // Apply sorting
    this.sortStudents();

    // Apply filtering
    let displayStudents = [...this.studentStats];
    if (this.filterStruggling) {
      displayStudents = displayStudents.filter(s => s.accuracy < 70);
    }

    // Create stats container
    this.statsContainer = this.add.container(0, 0);

    const tableY = 180;
    const rowHeight = 40;
    const startX = 30;

    // Table header
    const headerBg = this.add.rectangle(width / 2, tableY, width - 60, 50, 0x2a2a4e);
    headerBg.setStrokeStyle(2, 0x5a5a8e);

    const headers = [
      { text: 'Elev', x: startX + 20, width: 150 },
      { text: 'Spørgsmål', x: startX + 180, width: 90 },
      { text: 'Korrekt%', x: startX + 280, width: 90 },
      { text: 'Division', x: startX + 380, width: 130 },
      { text: 'Brøker', x: startX + 520, width: 130 },
      { text: 'Geometri', x: startX + 660, width: 130 },
      { text: 'Problemregning', x: startX + 800, width: 160 }
    ];

    headers.forEach(header => {
      this.add.text(header.x, tableY, header.text, {
        fontSize: '18px',
        fontFamily: 'Arial Black',
        color: '#FFD700'
      }).setOrigin(0, 0.5);
    });

    this.statsContainer.add(headerBg);

    // Student rows
    const maxRows = Math.min(displayStudents.length, 12); // Max 12 rows visible
    const startRow = 0;

    for (let i = startRow; i < startRow + maxRows && i < displayStudents.length; i++) {
      const student = displayStudents[i];
      const y = tableY + 60 + (i - startRow) * rowHeight;

      // Row background (alternating colors)
      const rowBg = this.add.rectangle(width / 2, y, width - 60, rowHeight - 2,
        i % 2 === 0 ? 0x1a1a2e : 0x252540
      );
      rowBg.setStrokeStyle(1, 0x3a3a5e);
      this.statsContainer.add(rowBg);

      // Student name
      const nameColor = this.getAccuracyColor(student.accuracy);
      this.add.text(startX + 20, y, student.username, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: nameColor
      }).setOrigin(0, 0.5);

      // Total questions
      this.add.text(startX + 180, y, student.totalAttempts.toString(), {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }).setOrigin(0, 0.5);

      // Accuracy percentage
      this.add.text(startX + 280, y, `${student.accuracy}%`, {
        fontSize: '16px',
        fontFamily: 'Arial Bold',
        color: nameColor
      }).setOrigin(0, 0.5);

      // Topic stats
      const topics = ['division', 'brøker', 'geometri', 'problemregning'];
      const topicXPositions = [startX + 380, startX + 520, startX + 660, startX + 800];

      topics.forEach((topic, idx) => {
        const topicData = student.byTopic[topic];
        const topicText = `${topicData.correct}/${topicData.total}`;
        const topicAccuracy = topicData.total > 0
          ? Math.round((topicData.correct / topicData.total) * 100)
          : 0;
        const topicColor = this.getAccuracyColor(topicAccuracy);

        // Highlight weakest topic
        const isWeakest = this.isWeakestTopic(student, topic);
        if (isWeakest && topicData.total > 0) {
          const highlight = this.add.rectangle(topicXPositions[idx] + 40, y, 120, rowHeight - 4, 0x660000, 0.3);
          this.statsContainer.add(highlight);
        }

        this.add.text(topicXPositions[idx], y, topicText, {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: topicColor
        }).setOrigin(0, 0.5);

        // Show percentage in parentheses
        if (topicData.total > 0) {
          this.add.text(topicXPositions[idx] + 70, y, `(${topicAccuracy}%)`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: topicColor
          }).setOrigin(0, 0.5);
        }
      });
    }

    // Summary stats at bottom
    const summaryY = height - 60;
    this.add.text(width / 2, summaryY,
      `Total elever: ${displayStudents.length} | Gennemsnitlig nøjagtighed: ${this.calculateAverageAccuracy(displayStudents)}%`,
      {
        fontSize: '20px',
        fontFamily: 'Arial Bold',
        color: '#FFD700'
      }
    ).setOrigin(0.5);

    // No data message
    if (displayStudents.length === 0) {
      this.add.text(width / 2, height / 2,
        this.filterStruggling
          ? 'Ingen elever med <70% korrekt'
          : 'Ingen elevdata tilgængelig',
        {
          fontSize: '28px',
          fontFamily: 'Arial',
          color: '#AAAAAA'
        }
      ).setOrigin(0.5);
    }
  }

  getAccuracyColor(accuracy) {
    if (accuracy >= 80) return '#00FF00'; // Green
    if (accuracy >= 60) return '#FFAA00'; // Yellow
    return '#FF0000'; // Red
  }

  isWeakestTopic(student, topic) {
    const topics = ['division', 'brøker', 'geometri', 'problemregning'];
    let lowestAccuracy = 100;
    let weakestTopic = null;

    topics.forEach(t => {
      const data = student.byTopic[t];
      if (data.total > 0) {
        const acc = Math.round((data.correct / data.total) * 100);
        if (acc < lowestAccuracy) {
          lowestAccuracy = acc;
          weakestTopic = t;
        }
      }
    });

    return weakestTopic === topic;
  }

  calculateAverageAccuracy(students) {
    if (students.length === 0) return 0;
    const sum = students.reduce((acc, student) => acc + student.accuracy, 0);
    return Math.round(sum / students.length);
  }

  sortStudents() {
    this.studentStats.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'total':
          comparison = a.totalAttempts - b.totalAttempts;
          break;
        case 'accuracy':
          comparison = a.accuracy - b.accuracy;
          break;
      }

      return this.sortAscending ? comparison : -comparison;
    });
  }

  setSortBy(sortBy) {
    if (this.sortBy === sortBy) {
      // Toggle sort direction
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortBy = sortBy;
      this.sortAscending = sortBy === 'name'; // Name ascending by default, others descending
    }
    this.displayStats();
  }

  toggleFilter() {
    this.filterStruggling = !this.filterStruggling;

    // Update button appearance
    if (this.filterToggleBtn) {
      const buttonBg = this.filterToggleBtn.list[0];
      buttonBg.setFillStyle(this.filterStruggling ? 0xAA5500 : 0x555555);
    }

    this.displayStats();
  }

  async refreshStats() {
    if (this.loadingText) {
      this.loadingText.setText('Opdaterer...');
      this.loadingText.setVisible(true);
    } else {
      const { width, height } = this.cameras.main;
      this.loadingText = this.add.text(width / 2, height / 2, 'Opdaterer...', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }).setOrigin(0.5);
    }

    await this.fetchStats();
  }

  createButton(x, y, width, height, text, callback, color = 0x3a86ff) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, color);
    bg.setInteractive({ useHandCursor: true });

    const textObj = this.add.text(0, 0, text, {
      fontSize: Math.min(18, Math.floor(height / 3)),
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    container.add([bg, textObj]);

    // Store references for updates
    container.setBgColor = (newColor) => {
      bg.setFillStyle(newColor);
    };

    // Hover effects
    bg.on('pointerover', () => {
      const lighter = Phaser.Display.Color.ValueToColor(color);
      lighter.lighten(20);
      bg.setFillStyle(lighter.color);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color);
    });

    bg.on('pointerdown', () => {
      const darker = Phaser.Display.Color.ValueToColor(color);
      darker.darken(20);
      bg.setFillStyle(darker.color);
      if (callback) callback();
    });

    bg.on('pointerup', () => {
      const lighter = Phaser.Display.Color.ValueToColor(color);
      lighter.lighten(20);
      bg.setFillStyle(lighter.color);
    });

    return container;
  }

  cleanupInputs() {
    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }
    if (this.passwordElement) {
      this.passwordElement.remove();
      this.passwordElement = null;
    }
  }

  shutdown() {
    this.cleanupInputs();
  }
}
