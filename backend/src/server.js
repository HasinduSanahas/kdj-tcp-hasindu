// src/server.js
// ─────────────────────────────────────────────────────────────────────────────
// HASI TUITION — Main Server Entry Point
// ─────────────────────────────────────────────────────────────────────────────
//
// STARTUP SEQUENCE:
//   1. Load environment variables.
//   2. Initialize Express app with middleware.
//   3. Mount Core API routes (students, modules).
//   4. Bootstrap each module → registers their EventBus subscriptions.
//   5. Mount module API routes.
//   6. Attach global error handler.
//   7. Start listening.
//
// MODULE REGISTRATION PATTERN:
//   To add a NEW module in the future, simply:
//     a. Create /src/modules/<name>/index.js  (bootstrap + router)
//     b. Add one line in the "Bootstrap Modules" section below.
//     c. Add one line in the "Mount Module Routes" section below.
//     d. Insert a row in the module_registry DB table.
//   That's it. Zero changes to core logic.
//
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

// ── Core infrastructure ───────────────────────────────────────────────────────
const { pool }       = require('./config/db');
const EventBus       = require('./core/events/EventBus');

// ── Core routes ───────────────────────────────────────────────────────────────
const moduleRoutes  = require('./core/routes/module.routes');
const studentRoutes = require('./core/routes/student.routes');

// ── Module imports ────────────────────────────────────────────────────────────
const AttendanceModule = require('./modules/attendance/index');
const GroqAIModule     = require('./modules/groq_ai_insights/index');
// Future modules follow the same pattern:
// const FeeModule        = require('./modules/fee_management/index');

// ─────────────────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check (no auth required) ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    service:   'Hasi Tuition Backend',
  });
});

// ── Core API Routes (always mounted — handle DB failures internally) ──────────
app.use('/api/modules',  moduleRoutes);
app.use('/api/students', studentRoutes);

// ── Module API Routes ─────────────────────────────────────────────────────────
app.use('/api/attendance', AttendanceModule.router);
app.use('/api/ai',         GroqAIModule.router);

// ─────────────────────────────────────────────────────────────────────────────
// BOOTSTRAP MODULES
// Each module registers its EventBus subscriptions here.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Server] 🔧 Bootstrapping modules...');

AttendanceModule.bootstrap();
GroqAIModule.bootstrap();

console.log('[Server] ✅ All modules bootstrapped.\n');

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('[Server] ✅ PostgreSQL connected.');
  } catch (dbErr) {
    console.warn('[Server] ⚠️  PostgreSQL unavailable — running in DEMO MODE.');
    console.warn('[Server] 👉 Set correct DB_PASSWORD in .env to enable full features.\n');
  }

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║         HASI TUITION MANAGEMENT SYSTEM — BACKEND        ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Server  : http://localhost:${PORT}                    ║
║  📡 EventBus: ${Object.keys(EventBus.EVENTS).length} named events registered            ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Closing DB pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n[Server] SIGINT received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();
