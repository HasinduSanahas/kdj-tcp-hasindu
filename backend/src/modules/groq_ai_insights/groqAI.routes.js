// src/modules/groq_ai_insights/groqAI.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// GROQ AI INSIGHTS MODULE — Express Router
// ─────────────────────────────────────────────────────────────────────────────
// Provides endpoints for:
//   - Manually triggering an AI report for any student
//   - Viewing AI job history and email logs
//   - Testing the Groq API connection from the admin panel
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const express  = require('express');
const { query }  = require('../../config/db');
const ModuleRegistry = require('../../core/registry/ModuleRegistry');
const { generateStudentReport } = require('./groqClient');
const { sendProgressEmail }     = require('./emailService');
const { handleAttendanceLogged } = require('./groqAI.handler');

const router = express.Router();

// ── Module gate middleware ────────────────────────────────────────────────────
router.use(async (req, res, next) => {
  const isActive = await ModuleRegistry.isAttached('groq_ai_insights');
  if (!isActive) {
    return res.status(403).json({
      success: false,
      error:   'MODULE_DETACHED',
      message: 'The Groq AI Insights module is not active. Attach it from the Admin panel.',
    });
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/test-groq
// Tests Groq API connectivity with a sample report.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/test-groq', async (req, res) => {
  try {
    const result = await generateStudentReport({
      studentName:      'Arjun Kumar (Test Student)',
      className:        'Advanced Mathematics',
      subject:          'Mathematics',
      totalSessions:    20,
      attendedSessions: 18,
      teacherName:      'Mr. Ramesh',
      checkedInAt:      new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: '✅ Groq API is working perfectly!',
      preview: {
        subject:    result.subject,
        body:       result.body,
        tokensUsed: result.tokensUsed,
        model:      process.env.GROQ_MODEL,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Groq API connection failed.',
      error:   err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/trigger/:studentId
// Manually triggers an AI report + email for a specific student.
// Useful for admin: "Send report now" button in the UI.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/trigger/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { classId }   = req.body;

  if (!classId) {
    return res.status(400).json({ success: false, message: 'classId is required in request body.' });
  }

  try {
    // Fetch student details
    const studentResult = await query(
      `SELECT id, full_name, email, guardian_email FROM students WHERE id = $1`,
      [studentId]
    );

    if (!studentResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = studentResult.rows[0];

    // Fire the handler directly (simulates an event with manual trigger)
    await handleAttendanceLogged({
      studentId:     student.id,
      studentName:   student.full_name,
      studentEmail:  student.email,
      guardianEmail: student.guardian_email,
      classId,
      sessionId:     null,
      checkedInAt:   new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `✅ AI report triggered for "${student.full_name}". Check ai_report_jobs for results.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/jobs
// Returns all AI report jobs with their status.
// ── GET /jobs ──────────────────────────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const result = await query(
      `SELECT aj.id, aj.trigger_event, aj.status, aj.triggered_at, s.full_name AS student_name
       FROM ai_report_jobs aj JOIN students s ON s.id = aj.student_id ORDER BY aj.triggered_at DESC LIMIT 20`
    );
    return res.json({ success: true, jobs: result.rows });
  } catch (err) {
    const jobs = global.DEMO_AI_JOBS || [];
    
    // Read student names from demo DB
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../../../database/demo_students.json');
    let students = [];
    if (fs.existsSync(dbPath)) students = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    const mapped = jobs.map(j => {
      const stu = students.find(s => s.id === j.student_id) || { full_name: 'Unknown Student' };
      return { ...j, student_name: stu.full_name };
    }).sort((a,b) => new Date(b.triggered_at) - new Date(a.triggered_at));
    
    return res.json({ success: true, jobs: mapped });
  }
});

// ── GET /jobs/:jobId/email ───────────────────────────────────────────────────
router.get('/jobs/:jobId/email', async (req, res) => {
  const { jobId } = req.params;
  try {
    const result = await query(
      `SELECT subject, email_body, status, error_message, sent_at, recipient_email FROM ai_email_logs WHERE job_id = $1`, [jobId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Email log not found.' });
    return res.json({ success: true, email: result.rows[0] });
  } catch (err) {
    const job = (global.DEMO_AI_JOBS || []).find(j => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.json({
      success: true,
      email: {
        subject: `Weekly Progress Report (Demo)`,
        email_body: job.groq_response || 'Still processing or failed...',
        status: job.status === 'completed' ? 'sent' : job.status,
        recipient_email: 'demo@example.com'
      }
    });
  }
});

module.exports = router;
