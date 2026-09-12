// src/core/registry/ModuleRegistry.js
// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// This is the GATEKEEPER of the entire modular system.
//
// Responsibilities:
//   1. Query PostgreSQL `module_registry` table for real-time status.
//   2. Expose isAttached(moduleKey) — used by the EventBus before every dispatch.
//   3. Expose attach() / detach() — used by the Admin API to flip module status.
//   4. Expose getAll() — used by the Frontend to render dynamic navigation.
//
// IMPORTANT: This service uses an in-memory cache (TTL: 5 seconds) to avoid
// hammering the DB on every event. The cache is invalidated on attach/detach.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { query } = require('../../config/db');

// ── Simple in-memory cache ────────────────────────────────────────────────────
const cache = {};
const CACHE_TTL_MS = 5000;

// ── Demo modules returned when DB is unavailable ──────────────────────────────
const DEMO_MODULES = [
  { id: '1', module_key: 'attendance',       display_name: 'Attendance Tracker',  status: 'detached', icon: 'scan-barcode',  frontend_route: '/attendance',  version: '1.0.0', description: 'QR/Barcode check-in system. Emits attendance_logged events.', attached_at: null, detached_at: null },
  { id: '2', module_key: 'fee_management',   display_name: 'Fee Management',       status: 'detached', icon: 'indian-rupee',  frontend_route: '/fees',        version: '1.0.0', description: 'Monthly fee tracking, invoices, and payment history.',         attached_at: null, detached_at: null },
  { id: '3', module_key: 'groq_ai_insights', display_name: 'Groq AI Insights',     status: 'detached', icon: 'brain-circuit', frontend_route: '/ai-reports',  version: '1.0.0', description: 'AI-powered progress email reports via Groq + NodeMailer.',     attached_at: null, detached_at: null },
  { id: '4', module_key: 'exam_grading',     display_name: 'Exam & Grading System',status: 'detached', icon: 'award',         frontend_route: '/exams',       version: '1.0.0', description: 'මාසික පරීක්ෂණ ලකුණු ඇතුලත් කිරීම, Ranks බැලීම සහ විශ්ලේෂණය කිරීම.', attached_at: null, detached_at: null },
  { id: '5', module_key: 'lms_materials',    display_name: 'LMS & Material Hub',   status: 'detached', icon: 'book-open',     frontend_route: '/lms',         version: '1.0.0', description: 'ළමයින්ට Tutes, PDF, Recorded Videos බෙදා හැරීම (Watermark සහිතව).', attached_at: null, detached_at: null },
  { id: '6', module_key: 'seat_booking',     display_name: 'Seat Booking Engine',  status: 'detached', icon: 'ticket',        frontend_route: '/seat-booking',version: '1.0.0', description: 'ළමයින්ට App එක හරහා කලින්ම තමන්ගේ ආසනය (Seat) වෙන් කරගත හැකි පහසුකම.', attached_at: null, detached_at: null },
  { id: '7', module_key: 'staff_payroll',    display_name: 'Staff & Payroll',      status: 'detached', icon: 'briefcase',     frontend_route: '/staff',       version: '1.0.0', description: 'සහයක ගුරුවරුන්ගේ පැමිණීම, වැටුප් සහ දීමනා ස්වයංක්‍රීයව ගණනය කිරීම.', attached_at: null, detached_at: null },
  { id: '8', module_key: 'expense_tracker',  display_name: 'Expense & Profit',     status: 'detached', icon: 'pie-chart',     frontend_route: '/expenses',    version: '1.0.0', description: 'ආදායම්/වියදම් සටහන් කර මාසික ශුද්ධ ලාභය බලා ගැනීමට ඇති Core Accounting අංගය.', attached_at: null, detached_at: null },
];

// In-memory status overrides for demo mode (survives within a server session)
const demoStatusOverrides = {};

function isCacheFresh(moduleKey) {
  if (!cache[moduleKey]) return false;
  return (Date.now() - cache[moduleKey].cachedAt) < CACHE_TTL_MS;
}

// ─────────────────────────────────────────────────────────────────────────────

const ModuleRegistry = {

  async getAll() {
    try {
      const result = await query(
        `SELECT id, module_key, display_name, description, icon, frontend_route,
                status, version, attached_at, detached_at
         FROM module_registry ORDER BY display_name ASC`
      );
      return result.rows;
    } catch {
      // DB unavailable — return demo data with any session overrides applied
      return DEMO_MODULES.map(m => ({
        ...m, status: demoStatusOverrides[m.module_key] ?? m.status
      }));
    }
  },

  async isAttached(moduleKey) {
    if (isCacheFresh(moduleKey)) return cache[moduleKey].status === 'attached';
    try {
      const result = await query(
        `SELECT status FROM module_registry WHERE module_key = $1`, [moduleKey]
      );
      if (!result.rows.length) return false;
      const { status } = result.rows[0];
      cache[moduleKey] = { status, cachedAt: Date.now() };
      return status === 'attached';
    } catch {
      // Demo mode: check in-memory overrides
      const status = demoStatusOverrides[moduleKey] ?? 'detached';
      return status === 'attached';
    }
  },

  async attach(moduleKey) {
    try {
      const result = await query(
        `UPDATE module_registry SET status='attached', attached_at=NOW(), updated_at=NOW()
         WHERE module_key=$1 RETURNING *`, [moduleKey]
      );
      if (!result.rows.length) throw new Error(`Module "${moduleKey}" not found.`);
      delete cache[moduleKey];
      console.log(`[ModuleRegistry] ✅ Module ATTACHED: ${moduleKey}`);
      return result.rows[0];
    } catch (err) {
      if (err.message.includes('not found')) throw err;
      // Demo mode: apply in-memory override
      demoStatusOverrides[moduleKey] = 'attached';
      delete cache[moduleKey];
      const mod = DEMO_MODULES.find(m => m.module_key === moduleKey);
      if (!mod) throw new Error(`Module "${moduleKey}" not found.`);
      console.log(`[ModuleRegistry] ✅ Module ATTACHED (demo): ${moduleKey}`);
      return { ...mod, status: 'attached', attached_at: new Date().toISOString() };
    }
  },

  async detach(moduleKey) {
    try {
      const result = await query(
        `UPDATE module_registry SET status='detached', detached_at=NOW(), updated_at=NOW()
         WHERE module_key=$1 RETURNING *`, [moduleKey]
      );
      if (!result.rows.length) throw new Error(`Module "${moduleKey}" not found.`);
      delete cache[moduleKey];
      console.log(`[ModuleRegistry] 🔌 Module DETACHED: ${moduleKey}`);
      return result.rows[0];
    } catch (err) {
      if (err.message.includes('not found')) throw err;
      // Demo mode
      demoStatusOverrides[moduleKey] = 'detached';
      delete cache[moduleKey];
      const mod = DEMO_MODULES.find(m => m.module_key === moduleKey);
      if (!mod) throw new Error(`Module "${moduleKey}" not found.`);
      console.log(`[ModuleRegistry] 🔌 Module DETACHED (demo): ${moduleKey}`);
      return { ...mod, status: 'detached', detached_at: new Date().toISOString() };
    }
  },

  async getAttachedModules() {
    try {
      const result = await query(
        `SELECT module_key, display_name, icon, frontend_route
         FROM module_registry WHERE status='attached' ORDER BY display_name ASC`
      );
      return result.rows;
    } catch {
      return DEMO_MODULES
        .filter(m => (demoStatusOverrides[m.module_key] ?? m.status) === 'attached')
        .map(({ module_key, display_name, icon, frontend_route }) =>
          ({ module_key, display_name, icon, frontend_route }));
    }
  },

};

module.exports = ModuleRegistry;
