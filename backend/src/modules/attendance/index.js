// src/modules/attendance/index.js
// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE MODULE — Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
// This file is the module's entry point. It:
//   1. Registers this module's event SUBSCRIPTIONS on the EventBus.
//   2. Exports the module's Express router for mounting in server.js.
//
// The Core server imports this file at startup. If this module is detached,
// its routes still mount (for API consistency), but its event handlers
// won't execute because the EventBus checks the registry first.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const EventBus = require('../../core/events/EventBus');
const router   = require('./attendance.routes');

const MODULE_KEY = 'attendance';

/**
 * Bootstrap function — called ONCE at server startup.
 * Registers all event subscriptions for this module.
 */
function bootstrap() {
  // The Attendance module listens to STUDENT_ENROLLED
  // (e.g., to pre-populate student in the check-in session)
  EventBus.subscribe(
    EventBus.EVENTS.STUDENT_ENROLLED,
    MODULE_KEY,
    async (payload) => {
      console.log(
        `[Attendance Module] New student enrolled (id: ${payload.studentId}) ` +
        `in class (id: ${payload.classId}). Ready for check-in.`
      );
      // Future: pre-register student in upcoming sessions
    },
    'Log new enrollment for attendance preparation'
  );

  console.log('[Attendance Module] ✅ Bootstrap complete — subscriptions registered.');
}

module.exports = { bootstrap, router, MODULE_KEY };
