// src/core/routes/module.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// CORE — Module Registry API Routes
// ─────────────────────────────────────────────────────────────────────────────
// These endpoints power:
//   - The Admin Panel (attach/detach modules)
//   - The Frontend (dynamic sidebar — fetch active modules)
//   - The Debug dashboard (event subscriptions)
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const express        = require('express');
const ModuleRegistry = require('../registry/ModuleRegistry');
const EventBus       = require('../events/EventBus');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/modules
// Returns ALL modules and their current status.
// Used by: Frontend sidebar, Admin Panel.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const modules = await ModuleRegistry.getAll();
    return res.json({ success: true, modules });
  } catch (err) {
    console.error('[Module API] getAll error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch modules.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/modules/attached
// Returns ONLY attached modules with their frontend_route and icon.
// Used by: Frontend to know which sidebar nav items to render.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/attached', async (req, res) => {
  try {
    const modules = await ModuleRegistry.getAttachedModules();
    return res.json({ success: true, modules });
  } catch (err) {
    console.error('[Module API] getAttachedModules error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch attached modules.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/modules/:moduleKey/attach
// Attaches a module — makes it active in the event system + UI.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:moduleKey/attach', async (req, res) => {
  const { moduleKey } = req.params;
  try {
    const module = await ModuleRegistry.attach(moduleKey);
    return res.json({
      success: true,
      message: `Module "${module.display_name}" is now ATTACHED. ✅`,
      module,
    });
  } catch (err) {
    console.error(`[Module API] attach error (${moduleKey}):`, err.message);
    return res.status(404).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/modules/:moduleKey/detach
// Detaches a module — silences its event handlers. Core is unaffected.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:moduleKey/detach', async (req, res) => {
  const { moduleKey } = req.params;
  try {
    const module = await ModuleRegistry.detach(moduleKey);
    return res.json({
      success: true,
      message: `Module "${module.display_name}" has been DETACHED. 🔌`,
      module,
    });
  } catch (err) {
    console.error(`[Module API] detach error (${moduleKey}):`, err.message);
    return res.status(404).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/modules/debug/subscriptions
// Returns all EventBus subscriptions — for admin debugging.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/debug/subscriptions', (req, res) => {
  const subscriptions = EventBus.getSubscriptions();
  return res.json({ success: true, subscriptions });
});

module.exports = router;
