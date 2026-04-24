import Phaser from 'phaser';
import { platformBridge } from '../sdk/platformBridge.js';
import { networkManager } from '../utils/networkManager.js';

/**
 * EmbedBootScene
 * Entry scene when running inside the platform iframe.
 * Sends `ready`, awaits `init`, then routes the player into the game flow.
 */
export default class EmbedBootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EmbedBootScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        this.add.rectangle(0, 0, width, height, 0x0f0f23).setOrigin(0);

        this.add.text(width / 2, height / 2 - 40, 'Worms Math', {
            fontSize: '48px', fontFamily: 'Arial Black',
            color: '#FFD700', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.statusText = this.add.text(width / 2, height / 2 + 30, 'Forbinder til platform...', {
            fontSize: '20px', fontFamily: 'Arial', color: '#cccccc'
        }).setOrigin(0.5);

        this.timeoutText = this.add.text(width / 2, height / 2 + 70, '', {
            fontSize: '14px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5);

        // Safety timeout — show an error if init never arrives
        let secs = 30;
        const tick = () => {
            secs -= 1;
            if (secs <= 0) {
                this.statusText.setText('Platformen svarede ikke');
                this.timeoutText.setText('Genindlæs siden eller kontakt din lærer.');
                this.timeoutTimer.remove();
            } else {
                this.timeoutText.setText(`Venter på initialisering... (${secs}s)`);
            }
        };
        this.timeoutTimer = this.time.addEvent({ delay: 1000, callback: tick, loop: true });

        // Trigger handshake
        platformBridge.init().then((init) => {
            this.timeoutTimer.remove();
            if (!init) {
                // Standalone mode (e.g. someone opened the embed URL directly)
                this.statusText.setText('Direkte adgang ikke understøttet');
                this.timeoutText.setText('Åbn dette spil via Matematik-platformen.');
                return;
            }
            this._routeFromInit(init);
        });
    }

    _routeFromInit(init) {
        this.statusText.setText(`Klar — ${init.mode === 'solo' ? 'solo' : 'klasse'} session`);
        platformBridge.sendEvent('boot_complete', { mode: init.mode, locale: init.locale });

        // Establish socket connection (used for both solo and class)
        networkManager.connect();

        const baseSceneData = {
            embedded: true,
            studentId: init.studentId,
            classId: init.classId,
            topicId: init.topicId,
            learningGoals: init.learningGoals,
            mode: init.mode,
        };

        if (init.mode === 'solo') {
            // Solo: skip waiting room, jump straight to QuizScene as a single-player session
            this.time.delayedCall(500, () => {
                this.scene.start('QuizScene', { ...baseSceneData, soloMode: true });
            });
        } else {
            // Class: join a room keyed by classId, then waiting room
            const roomCode = `class_${init.classId}`;
            networkManager.send('room:join_or_create', {
                roomCode,
                playerName: init.studentId,
                userId: init.studentId,
                isClassRoom: true,
            });
            this.time.delayedCall(500, () => {
                this.scene.start('WaitingRoomScene', { ...baseSceneData, roomCode });
            });
        }
    }
}
