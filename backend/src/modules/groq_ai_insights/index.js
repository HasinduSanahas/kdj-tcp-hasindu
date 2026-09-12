// src/modules/groq_ai_insights/index.js
// ─────────────────────────────────────────────────────────────────────────────
// GROQ AI INSIGHTS MODULE — Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
// Entry point for the Groq AI Insights module.
// Registers all EventBus subscriptions and exports the Express router.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const EventBus     = require('../../core/events/EventBus');
const router       = require('./groqAI.routes');
const { handleAttendanceLogged } = require('./groqAI.handler');
const { verifySmtpConnection }   = require('./emailService');

const MODULE_KEY = 'groq_ai_insights';

/**
 * Bootstrap — called once at server startup.
 * Registers all event subscriptions for this module.
 */
async function bootstrap() {
  // ── Subscribe to Core Events ──────────────────────────────────────────────

  // 1. React to every student check-in → generate AI report → send email
  EventBus.subscribe(
    EventBus.EVENTS.ATTENDANCE_LOGGED,
    MODULE_KEY,
    handleAttendanceLogged,
    'Generate Groq AI progress report and email parent/guardian'
  );

  // 2. React to session close → could generate daily summary (future feature)
  EventBus.subscribe(
    EventBus.EVENTS.SESSION_CLOSED,
    MODULE_KEY,
    async (payload) => {
      console.log(
        `[Groq AI Module] Session closed for class ${payload.classId}. ` +
        `${payload.totalAttended} students attended. (Daily summary — coming soon)`
      );
    },
    'Log session closure for future daily digest email'
  );

  // Verify SMTP on startup (non-blocking)
  verifySmtpConnection().catch(() => {}); // Errors already logged inside

  console.log('[Groq AI Module] ✅ Bootstrap complete — subscriptions registered.');
}

module.exports = { bootstrap, router, MODULE_KEY };
