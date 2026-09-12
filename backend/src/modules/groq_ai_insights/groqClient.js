// src/modules/groq_ai_insights/groqClient.js
// ─────────────────────────────────────────────────────────────────────────────
// GROQ API CLIENT
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper around the groq-sdk package.
// Exposes a single function: generateStudentReport(studentData)
// which returns AI-generated personalized progress text.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

require('dotenv').config();
const Groq = require('groq-sdk');

// Initialise Groq client once — reused across all requests
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Generates a personalised student progress email body using Groq AI.
 *
 * @param {Object} studentData
 * @param {string} studentData.studentName      - Full name of the student
 * @param {string} studentData.className        - Name of the class attended
 * @param {string} studentData.subject          - Subject of the class
 * @param {number} studentData.totalSessions    - Total sessions held so far
 * @param {number} studentData.attendedSessions - Sessions the student attended
 * @param {string} studentData.teacherName      - Teacher's name
 * @param {string} studentData.checkedInAt      - ISO timestamp of today's check-in
 *
 * @returns {Promise<{ subject: string, body: string }>}
 */
async function generateStudentReport(studentData) {
  const {
    studentName,
    className,
    subject,
    totalSessions    = 1,
    attendedSessions = 1,
    teacherName      = 'Your Teacher',
    checkedInAt,
  } = studentData;

  const attendanceRate = Math.round((attendedSessions / totalSessions) * 100);
  const checkInTime    = checkedInAt
    ? new Date(checkedInAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'today';

  // ── Build the prompt ────────────────────────────────────────────────────────
  const prompt = `
You are a warm, encouraging educational assistant for "Hasi Tuition Classes".

Write a short, personalized attendance update email for a parent/guardian.
Keep it friendly, positive, and professional. Use simple English (no jargon).

Student Details:
- Student Name: ${studentName}
- Class: ${className} (${subject})
- Teacher: ${teacherName}
- Checked In At: ${checkInTime}
- Sessions Attended: ${attendedSessions} out of ${totalSessions} total sessions
- Attendance Rate: ${attendanceRate}%

Instructions:
1. Start with a warm greeting addressing the parent/guardian.
2. Confirm today's attendance with the exact check-in time.
3. Mention the current attendance rate with a short positive remark.
4. If attendance rate >= 80%, praise the student's consistency.
   If attendance rate is 60-79%, gently encourage more regularity.
   If attendance rate < 60%, kindly express concern and encourage improvement.
5. End with a motivational closing line from Hasi Tuition.
6. Do NOT use placeholders like [Parent Name] — write naturally without them.
7. Keep it under 200 words.

Write ONLY the email body (no subject line, no "Email Body:" prefix).
`.trim();

  // ── Call Groq API ───────────────────────────────────────────────────────────
  const chatCompletion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role:    'system',
        // /no_think suppresses chain-of-thought reasoning tags in qwen models
        content: '/no_think\nYou are a helpful assistant for Hasi Tuition Classes. Write concise, warm, professional emails to parents about their child\'s attendance. Output ONLY the email body — no preamble, no reasoning, no <think> tags.',
      },
      {
        role:    'user',
        content: prompt,
      },
    ],
    temperature:  0.7,   // Slightly creative but still professional
    max_tokens:   400,   // Keep emails concise
  });

  // Strip any residual <think>...</think> blocks from qwen chain-of-thought
  let body = chatCompletion.choices[0]?.message?.content?.trim() || '';
  body = body.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // ── Generate a matching subject line ────────────────────────────────────────
  const subjectLine = `📚 Attendance Update: ${studentName} checked in to ${className}`;

  console.log(`[Groq] ✅ Report generated for "${studentName}" | ${MODEL} | ${chatCompletion.usage?.total_tokens} tokens used`);

  return {
    subject: subjectLine,
    body,
    tokensUsed: chatCompletion.usage?.total_tokens || 0,
  };
}

/**
 * Quick test function — call this directly to verify the Groq connection.
 * Run: node src/modules/groq_ai_insights/groqClient.js
 */
async function testGroqConnection() {
  console.log('[Groq Test] Sending test request to Groq API...');
  const result = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: 'Reply with exactly: "Groq connection successful for Hasi Tuition!"' }],
    max_tokens: 30,
  });
  console.log('[Groq Test] Response:', result.choices[0].message.content);
}

// Allow direct testing: node groqClient.js
if (require.main === module) {
  testGroqConnection().catch(console.error);
}

module.exports = { generateStudentReport };
