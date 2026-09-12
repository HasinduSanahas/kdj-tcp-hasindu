// src/modules/attendance/attendance.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE MODULE — Express Router
// ─────────────────────────────────────────────────────────────────────────────
// Key endpoint: POST /api/attendance/checkin
//   This is the DEMO of the entire Event-Driven architecture:
//   1. Validates student + session exist in DB.
//   2. Inserts a row into attendance_logs.
//   3. Emits "attendance_logged" on the EventBus.
//   4. EventBus checks if groq_ai_insights is attached → dispatches or skips.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { query }  = require('../../config/db');
const EventBus   = require('../../core/events/EventBus');
const ModuleRegistry = require('../../core/registry/ModuleRegistry');

const router = express.Router();

// ── Middleware: Gate all attendance routes if module is detached ──────────────
router.use(async (req, res, next) => {
  const isActive = await ModuleRegistry.isAttached('attendance');
  if (!isActive) {
    return res.status(403).json({
      success: false,
      error:   'MODULE_DETACHED',
      message: 'The Attendance module is not active. Please attach it from the Admin panel.',
    });
  }
  next();
});

// ── DEMO DATA FALLBACKS ───────────────────────────────────────────────────────
let DEMO_SESSIONS = [];
let DEMO_LOGS = [];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/sessions
router.post('/sessions', async (req, res) => {
  const { class_id } = req.body;
  if (!class_id) return res.status(400).json({ success: false, message: 'class_id is required.' });

  const qr_token = `QR-${uuidv4()}`;

  try {
    const result = await query(
      `INSERT INTO attendance_sessions (class_id, session_date, qr_token) VALUES ($1, CURRENT_DATE, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [class_id, qr_token]
    );
    if (result.rows.length === 0) return res.status(200).json({ success: true, message: 'Session already open.' });
    const session = result.rows[0];
    await EventBus.emit(EventBus.EVENTS.SESSION_OPENED, { sessionId: session.id, classId: session.class_id });
    return res.status(201).json({ success: true, message: 'Session opened.', session });
  } catch (err) {
    // Demo mode fallback
    const session = { id: uuidv4(), class_id, session_date: new Date().toISOString(), opened_at: new Date().toISOString(), closed_at: null, qr_token };
    DEMO_SESSIONS.push(session);
    await EventBus.emit(EventBus.EVENTS.SESSION_OPENED, { sessionId: session.id, classId: session.class_id });
    return res.status(201).json({ success: true, message: '(Demo) Attendance session opened.', session });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/checkin
router.post('/checkin', async (req, res) => {
  const { session_id, student_id, method = 'qr' } = req.body;
  if (!session_id || !student_id) return res.status(400).json({ success: false, message: 'Missing fields.' });

  try {
    const sessionResult = await query(`SELECT * FROM attendance_sessions WHERE id = $1 AND closed_at IS NULL`, [session_id]);
    if (sessionResult.rows.length === 0) throw new Error('DB_FAIL');
    const studentResult = await query(`SELECT * FROM students WHERE id = $1`, [student_id]);
    if (studentResult.rows.length === 0) throw new Error('DB_FAIL');

    const logResult = await query(
      `INSERT INTO attendance_logs (session_id, student_id, method) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *`,
      [session_id, student_id, method]
    );
    if (logResult.rows.length === 0) return res.status(409).json({ success: false, message: 'Already checked in.' });

    const log = logResult.rows[0];
    const student = studentResult.rows[0];

    await EventBus.emit(EventBus.EVENTS.ATTENDANCE_LOGGED, {
      logId: log.id, sessionId: session_id, classId: sessionResult.rows[0].class_id,
      studentId: student.id, studentName: student.full_name, studentEmail: student.email,
      guardianEmail: student.guardian_email, method, checkedInAt: log.checked_in_at
    });

    return res.status(201).json({ success: true, message: `✅ ${student.full_name} checked in!`, log });
  } catch (err) {
    // Demo Mode Fallback
    const session = DEMO_SESSIONS.find(s => s.id === session_id);
    if (!session || session.closed_at) return res.status(404).json({ success: false, message: 'Session not found/closed.' });

    // Read students from demo JSON
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../../../database/demo_students.json');
    let students = [];
    if (fs.existsSync(dbPath)) students = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const student = students.find(s => s.id === student_id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const exists = DEMO_LOGS.find(l => l.session_id === session_id && l.student_id === student_id);
    if (exists) return res.status(409).json({ success: false, message: 'Already checked in.' });

    const log = { id: uuidv4(), session_id, student_id, method, checked_in_at: new Date().toISOString() };
    DEMO_LOGS.push(log);

    await EventBus.emit(EventBus.EVENTS.ATTENDANCE_LOGGED, {
      logId: log.id, sessionId: session.id, classId: session.class_id,
      studentId: student.id, studentName: student.full_name, studentEmail: student.email,
      guardianEmail: student.guardian_email, method, checkedInAt: log.checked_in_at
    });

    return res.status(201).json({ success: true, message: `✅ (Demo) ${student.full_name} checked in!`, log });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/sessions/:sessionId/logs
router.get('/sessions/:sessionId/logs', async (req, res) => {
  try {
    const result = await query(
      `SELECT al.id, al.checked_in_at, al.method, s.full_name AS student_name, s.email AS student_email
       FROM attendance_logs al JOIN students s ON s.id = al.student_id WHERE al.session_id = $1 ORDER BY al.checked_in_at ASC`,
      [req.params.sessionId]
    );
    return res.json({ success: true, logs: result.rows });
  } catch (err) {
    // Demo fallback
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../../../database/demo_students.json');
    let students = [];
    if (fs.existsSync(dbPath)) students = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    const sessionLogs = DEMO_LOGS.filter(l => l.session_id === req.params.sessionId).map(l => {
      const stu = students.find(s => s.id === l.student_id) || {};
      return { ...l, student_name: stu.full_name, student_email: stu.email };
    });
    return res.json({ success: true, logs: sessionLogs });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/sessions/:sessionId/close
router.post('/sessions/:sessionId/close', async (req, res) => {
  try {
    const countResult = await query(`SELECT COUNT(*) FROM attendance_logs WHERE session_id = $1`, [req.params.sessionId]);
    const result = await query(`UPDATE attendance_sessions SET closed_at = NOW() WHERE id = $1 RETURNING *`, [req.params.sessionId]);
    if (result.rows.length === 0) throw new Error('FAIL');
    await EventBus.emit(EventBus.EVENTS.SESSION_CLOSED, { sessionId: result.rows[0].id, classId: result.rows[0].class_id, totalAttended: parseInt(countResult.rows[0].count) });
    return res.json({ success: true, message: `Session closed.`, session: result.rows[0] });
  } catch (err) {
    // Demo fallback
    const session = DEMO_SESSIONS.find(s => s.id === req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    session.closed_at = new Date().toISOString();
    const count = DEMO_LOGS.filter(l => l.session_id === req.params.sessionId).length;
    await EventBus.emit(EventBus.EVENTS.SESSION_CLOSED, { sessionId: session.id, classId: session.class_id, totalAttended: count });
    return res.json({ success: true, message: `(Demo) Session closed. ${count} attended.`, session });
  }
});

module.exports = router;
