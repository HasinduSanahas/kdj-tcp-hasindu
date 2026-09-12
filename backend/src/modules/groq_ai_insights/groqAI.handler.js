// src/modules/groq_ai_insights/groqAI.handler.js
// ─────────────────────────────────────────────────────────────────────────────
// GROQ AI INSIGHTS — Core Event Handler
// ─────────────────────────────────────────────────────────────────────────────
//
// This is the BRAIN of the Groq AI module.
// It listens to events emitted by the Core and:
//   1. Fetches enriched student + attendance data from the DB.
//   2. Calls Groq AI to generate a personalised progress report.
//   3. Sends the email via NodeMailer.
//   4. Logs the job result to ai_report_jobs + ai_email_logs tables.
//
// ISOLATION GUARANTEE:
//   - This handler is ONLY called by EventBus if module status = 'attached'.
//   - All errors are caught locally — they NEVER propagate to the Core.
//   - If Groq API is down, the job logs as 'failed' — the Core is unaffected.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { query }               = require('../../config/db');
const { generateStudentReport } = require('./groqClient');
const { sendProgressEmail }     = require('./emailService');

/**
 * Handles the "attendance_logged" event.
 * Full pipeline: DB fetch → Groq AI → Email → DB log.
 *
 * @param {Object} payload - Emitted by attendance.routes.js on check-in
 * @param {string} payload.studentId
 * @param {string} payload.studentName
 * @param {string} payload.studentEmail
 * @param {string} payload.guardianEmail
 * @param {string} payload.classId
 * @param {string} payload.sessionId
 * @param {string} payload.checkedInAt
 */
async function handleAttendanceLogged(payload) {
  const {
    studentId,
    studentName,
    studentEmail,
    guardianEmail,
    classId,
    sessionId,
    checkedInAt,
  } = payload;

  console.log(`[Groq AI Module] 🧠 Processing attendance_logged for "${studentName}"...`);

  // ── Step 1: Create a pending job record in DB ─────────────────────────────
  let jobId;
  let useDemoMode = false;
  try {
    const jobResult = await query(
      `INSERT INTO ai_report_jobs (student_id, trigger_event, status)
       VALUES ($1, 'attendance_logged', 'processing')
       RETURNING id`,
      [studentId]
    );
    jobId = jobResult.rows[0].id;
    console.log(`[Groq AI Module] 📋 Job created: ${jobId}`);
  } catch (dbErr) {
    console.warn('[Groq AI Module] ⚠️ Database unavailable. Using DEMO IN-MEMORY mode for AI job.');
    const { v4: uuidv4 } = require('uuid');
    jobId = `demo-job-${uuidv4()}`;
    useDemoMode = true;
    
    // Ensure global demo arrays exist
    if (!global.DEMO_AI_JOBS) global.DEMO_AI_JOBS = [];
    global.DEMO_AI_JOBS.push({ id: jobId, student_id: studentId, trigger_event: 'attendance_logged', status: 'processing', triggered_at: new Date().toISOString() });
  }

  try {
    // ── Step 2: Fetch enriched data from DB ──────────────────────────────────
    let classInfo = { class_name: 'Science Demo Class', subject: 'Science', teacher_name: 'Hasi Tuition' };
    let totalSessions = 1;
    let attendedSessions = 1;
    
    if (!useDemoMode) {
      // Get class details
      const classResult = await query(
        `SELECT c.class_name, c.subject, t.full_name AS teacher_name
         FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.id = $1`,
        [classId]
      );
      if (classResult.rows[0]) classInfo = classResult.rows[0];

      // Get attendance statistics for this student in this class
      const statsResult = await query(
        `SELECT COUNT(DISTINCT ats.id) AS total_sessions, COUNT(DISTINCT al.id) AS attended_sessions
         FROM attendance_sessions ats LEFT JOIN attendance_logs al ON al.session_id = ats.id AND al.student_id = $1
         WHERE ats.class_id = $2`,
        [studentId, classId]
      );
      
      const stats = statsResult.rows[0];
      totalSessions    = parseInt(stats.total_sessions)    || 1;
      attendedSessions = parseInt(stats.attended_sessions) || 1;
    }

    // ── Step 3: Call Groq AI ──────────────────────────────────────────────────
    const { subject, body, tokensUsed } = await generateStudentReport({
      studentName,
      className:       classInfo.class_name,
      subject:         classInfo.subject,
      totalSessions,
      attendedSessions,
      teacherName:     classInfo.teacher_name,
      checkedInAt,
    });

    console.log(`[Groq AI Module] ✨ AI report generated (${tokensUsed} tokens)`);

    // ── Step 4: Update job with generated content ─────────────────────────────
    if (!useDemoMode) {
      await query(`UPDATE ai_report_jobs SET status = 'completed', groq_response = $1, completed_at = NOW() WHERE id = $2`, [body, jobId]);
    } else {
      const job = global.DEMO_AI_JOBS.find(j => j.id === jobId);
      if (job) { job.status = 'completed'; job.groq_response = body; job.completed_at = new Date().toISOString(); }
    }

    // ── Step 5: Determine recipient email ─────────────────────────────────────
    const recipientEmail = guardianEmail || studentEmail;
    const recipientType  = guardianEmail ? 'guardian' : 'student';
    if (!recipientEmail) return;

    // ── Step 6: Create email log entry ──────────────────────────────
    let emailLogId = `demo-email-${Date.now()}`;
    if (!useDemoMode) {
      const emailLogResult = await query(
        `INSERT INTO ai_email_logs (job_id, recipient_email, recipient_type, subject, email_body, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
        [jobId, recipientEmail, recipientType, subject, body]
      );
      emailLogId = emailLogResult.rows[0].id;
    }

    // ── Step 7: Send the email ────────────────────────────────────────────────
    const sendResult = await sendProgressEmail({ to: recipientEmail, subject, body, studentName });

    // ── Step 8: Update email log with result ──────────────────────────────────
    if (!useDemoMode) {
      if (sendResult?.skipped) {
        await query(`UPDATE ai_email_logs SET status = 'sent', sent_at = NOW(), error_message = 'SMTP skipped' WHERE id = $1`, [emailLogId]);
      } else {
        await query(`UPDATE ai_email_logs SET status = 'sent', sent_at = NOW() WHERE id = $1`, [emailLogId]);
      }
    }
    console.log(`[Groq AI Module] 📧 Email processed for ${recipientEmail}`);

  } catch (err) {
    console.error('[Groq AI Module] ❌ Pipeline error:', err.message);
    if (!useDemoMode) {
      await query(`UPDATE ai_report_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`, [err.message, jobId])
        .catch(logErr => console.error(logErr.message));
    } else {
      const job = global.DEMO_AI_JOBS?.find(j => j.id === jobId);
      if (job) { job.status = 'failed'; job.error_message = err.message; }
    }
  }
}

module.exports = { handleAttendanceLogged };
