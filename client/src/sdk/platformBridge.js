/**
 * Platform Bridge — postMessage SDK for embedding worms-math-game in the
 * Matematik-platform via iframe.
 *
 * Contract: see AGENT_COMMS.md
 *   ready  → { type, sdkVersion, capabilities, supportedGoals }
 *   init   ← { type, sessionId, studentId, classId, topicId, learningGoals, mode, locale, token }
 *   progress, event, complete, error → up
 */

const SDK_VERSION = '1.0.0';

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://staging.matematik-platform.dk',
    'https://matematik-platform.dk',
];

const CAPABILITIES = ['solo', 'class'];
const SUPPORTED_GOALS = ['add_0_100', 'sub_0_100', 'mul_table_2_12', 'div_table_2_12'];

class PlatformBridge {
    constructor() {
        this.isEmbedded = window.parent !== window;
        this.sessionData = null;
        this.parentOrigin = null;
        this._initResolve = null;
        this.initPromise = new Promise((resolve) => { this._initResolve = resolve; });
        this._initialized = false;
    }

    /**
     * Begin the handshake. Sends `ready` upward and resolves initPromise on `init`.
     * Returns the same initPromise on repeated calls (idempotent).
     */
    init() {
        if (this._initialized) return this.initPromise;
        this._initialized = true;

        if (!this.isEmbedded) {
            // Standalone mode — resolve with null so callers can branch
            this._initResolve(null);
            return this.initPromise;
        }

        window.addEventListener('message', this._handleMessage.bind(this));

        this._postUp({
            type: 'ready',
            sdkVersion: SDK_VERSION,
            capabilities: CAPABILITIES,
            supportedGoals: SUPPORTED_GOALS,
        }, '*'); // first message uses '*' since we don't know the parent origin yet

        return this.initPromise;
    }

    _handleMessage(event) {
        if (!ALLOWED_ORIGINS.includes(event.origin)) {
            // Silently reject untrusted origins
            return;
        }
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'init') {
            this.sessionData = {
                sessionId: msg.sessionId,
                studentId: msg.studentId,
                classId: msg.classId,
                topicId: msg.topicId,
                learningGoals: msg.learningGoals || [],
                mode: msg.mode || 'class',
                locale: msg.locale || 'da',
                token: msg.token || null,
            };
            this.parentOrigin = event.origin;
            this._initResolve(this.sessionData);
        } else if (msg.type === 'shutdown') {
            this.sendEvent('shutdown_received', {});
            // Caller should listen separately if it needs to react
        }
    }

    _postUp(msg, originOverride) {
        if (!this.isEmbedded) return;
        const target = originOverride || this.parentOrigin || '*';
        const payload = this.sessionData
            ? { ...msg, sessionId: this.sessionData.sessionId }
            : msg;
        try {
            window.parent.postMessage(payload, target);
        } catch (err) {
            console.warn('[PlatformBridge] postMessage failed:', err);
        }
    }

    /** @param {string} metric  @param {number} value */
    sendProgress(metric, value) {
        this._postUp({ type: 'progress', metric, value });
    }

    /** @param {string} eventType  @param {object} payload */
    sendEvent(eventType, payload = {}) {
        this._postUp({ type: 'event', eventType, payload });
    }

    /**
     * @param {number} score          0–100 normalised
     * @param {number} completionPct  0.0–1.0
     * @param {object} details        { perGoal: { code: { correct, total } }, gameSpecific?: {} }
     */
    sendComplete(score, completionPct, details = {}) {
        this._postUp({
            type: 'complete',
            score: Math.max(0, Math.min(100, Math.round(score))),
            completionPct: Math.max(0, Math.min(1, completionPct)),
            details,
        });
    }

    /** @param {string} code  @param {string} message */
    sendError(code, message) {
        this._postUp({ type: 'error', code, message });
    }
}

export const platformBridge = new PlatformBridge();
export { SDK_VERSION, ALLOWED_ORIGINS, CAPABILITIES, SUPPORTED_GOALS };
