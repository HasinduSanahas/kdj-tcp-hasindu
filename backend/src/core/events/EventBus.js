// src/core/events/EventBus.js
// ─────────────────────────────────────────────────────────────────────────────
// THE EVENT BUS — Heart of the Modular Architecture
// ─────────────────────────────────────────────────────────────────────────────
//
// How it works:
//   1. Modules register their handlers at startup via EventBus.subscribe().
//      Each subscription declares which moduleKey it belongs to.
//
//   2. When the Core emits an event via EventBus.emit(), the Bus:
//      a. Looks up all subscribers for that event name.
//      b. For each subscriber, calls ModuleRegistry.isAttached(moduleKey).
//      c. If ATTACHED  → executes the handler with the event payload.
//      d. If DETACHED  → skips silently. Core is unaffected.
//
//   3. This means: attaching/detaching a module in the DB instantly
//      changes which handlers fire — no server restart needed.
//
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { EventEmitter } = require('events');
const ModuleRegistry   = require('../registry/ModuleRegistry');

// Node.js native EventEmitter as the underlying engine
const emitter = new EventEmitter();
emitter.setMaxListeners(50); // Allow many module subscriptions

// ── Subscriber Registry ───────────────────────────────────────────────────────
// Shape: { [eventName]: [ { moduleKey, handler, description }, ... ] }
const subscribers = {};

// ─────────────────────────────────────────────────────────────────────────────

const EventBus = {

  // ── List of all named events in the system (for documentation / admin UI) ──
  EVENTS: {
    // Attendance Module
    ATTENDANCE_LOGGED:    'attendance_logged',    // payload: { studentId, sessionId, classId, method }
    SESSION_OPENED:       'session_opened',       // payload: { sessionId, classId, teacherId }
    SESSION_CLOSED:       'session_closed',       // payload: { sessionId, classId, summary }

    // Fee Management Module
    INVOICE_GENERATED:    'invoice_generated',    // payload: { invoiceId, studentId, amount }
    PAYMENT_RECEIVED:     'payment_received',     // payload: { paymentId, invoiceId, amount }
    FEE_OVERDUE:          'fee_overdue',          // payload: { invoiceId, studentId, daysOverdue }

    // Core Events
    STUDENT_ENROLLED:     'student_enrolled',     // payload: { studentId, classId }
    STUDENT_REGISTERED:   'student_registered',   // payload: { studentId, fullName, email }
  },

  /**
   * Subscribe a module handler to a named event.
   * Called ONCE at server startup from each module's index.js.
   *
   * @param {string}   eventName   - One of EventBus.EVENTS.*
   * @param {string}   moduleKey   - e.g. 'groq_ai_insights' (must match module_registry)
   * @param {Function} handler     - async (payload) => void
   * @param {string}   description - Human-readable description (for admin/debug)
   */
  subscribe(eventName, moduleKey, handler, description = '') {
    if (!subscribers[eventName]) {
      subscribers[eventName] = [];
    }

    subscribers[eventName].push({ moduleKey, handler, description });

    console.log(
      `[EventBus] 📡 Subscribed: [${moduleKey}] listening on "${eventName}"` +
      (description ? ` — ${description}` : '')
    );
  },

  /**
   * Emit a named event from the Core.
   * The Bus checks ModuleRegistry before calling any handler.
   *
   * @param {string} eventName - The event to fire (use EventBus.EVENTS.*)
   * @param {Object} payload   - Data to pass to the handlers
   */
  async emit(eventName, payload = {}) {
    const handlers = subscribers[eventName] || [];

    console.log(
      `[EventBus] 🔔 Event fired: "${eventName}" | ` +
      `${handlers.length} subscriber(s) registered`
    );

    // ── Dispatch to each subscriber with registry check ─────────────────────
    const dispatches = handlers.map(async ({ moduleKey, handler, description }) => {
      try {
        // THE CORE CHECK: Is this module currently attached?
        const attached = await ModuleRegistry.isAttached(moduleKey);

        if (!attached) {
          console.log(
            `[EventBus] ⏭️  Skipped: [${moduleKey}] is DETACHED — ` +
            `"${eventName}" not delivered`
          );
          return;
        }

        console.log(
          `[EventBus] ⚡ Dispatching "${eventName}" → [${moduleKey}]` +
          (description ? ` (${description})` : '')
        );

        // Execute the module handler asynchronously
        await handler(payload);

      } catch (err) {
        // Handler errors MUST NOT crash the Core
        console.error(
          `[EventBus] ❌ Handler error in [${moduleKey}] for "${eventName}":`,
          err.message
        );
      }
    });

    // Run all dispatches in parallel
    await Promise.allSettled(dispatches);
  },

  /**
   * Returns all registered subscriptions.
   * Used by the admin debug endpoint: GET /api/events/subscriptions
   */
  getSubscriptions() {
    return Object.entries(subscribers).map(([eventName, subs]) => ({
      event:       eventName,
      subscribers: subs.map(s => ({
        moduleKey:   s.moduleKey,
        description: s.description,
      })),
    }));
  },

};

module.exports = EventBus;
