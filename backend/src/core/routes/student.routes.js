// src/core/routes/student.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// CORE — Student & Class CRUD Routes (With Demo Fallback)
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const express  = require('express');
const { query } = require('../../config/db');
const EventBus  = require('../events/EventBus');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const DB_FILE = path.join(__dirname, '../../../../database/demo_students.json');

function getDemoStudents() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  const initial = [
    { id: uuidv4(), full_name: 'Pasindu Kumara', email: 'mkpasindu69@gmail.com', phone: '0775961945', guardian_name: 'Thanuja', guardian_email: 'mkpasindu69@gmail.com', is_active: true, enrolled_at: new Date(Date.now() - 86400000).toISOString() },
    { id: uuidv4(), full_name: 'Nethmi Silva', email: 'nethmi@example.com', phone: '0759876543', guardian_name: 'Mrs. Silva', guardian_email: 'parent2@example.com', is_active: true, enrolled_at: new Date(Date.now() - 259200000).toISOString() }
  ];
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

function saveDemoStudents(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── GET /api/students ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, date_of_birth,
              guardian_name, guardian_email, is_active, enrolled_at
       FROM students
       WHERE is_active = true
       ORDER BY full_name ASC`
    );
    return res.json({ success: true, students: result.rows });
  } catch (err) {
    // Fallback to demo data
    return res.json({ success: true, students: getDemoStudents() });
  }
});

// ── GET /api/students/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM students WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.json({ success: true, student: result.rows[0] });
  } catch (err) {
    const student = getDemoStudents().find(s => s.id === req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.json({ success: true, student });
  }
});

// ── POST /api/students ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { full_name, email, phone, date_of_birth,
          guardian_name, guardian_phone, guardian_email } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ success: false, message: 'full_name and email are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO students
         (full_name, email, phone, date_of_birth, guardian_name, guardian_phone, guardian_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [full_name, email, phone, date_of_birth, guardian_name, guardian_phone, guardian_email]
    );

    const student = result.rows[0];
    await EventBus.emit(EventBus.EVENTS.STUDENT_REGISTERED, { studentId: student.id, fullName: student.full_name, email: student.email });
    return res.status(201).json({ success: true, student });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email already registered.' });
    
    // DB failure -> fallback to demo mode
    const newStudent = {
      id: uuidv4(), full_name, email, phone, date_of_birth, guardian_name, guardian_phone, guardian_email,
      is_active: true, enrolled_at: new Date().toISOString()
    };
    
    const currentStudents = getDemoStudents();
    currentStudents.unshift(newStudent);
    saveDemoStudents(currentStudents);
    
    // Still emit event even in demo mode
    await EventBus.emit(EventBus.EVENTS.STUDENT_REGISTERED, { studentId: newStudent.id, fullName: newStudent.full_name, email: newStudent.email });
    
    return res.status(201).json({ success: true, student: newStudent });
  }
});

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { full_name, email, phone, guardian_name, guardian_email } = req.body;
  try {
    const result = await query(
      `UPDATE students SET full_name = $1, email = $2, phone = $3, guardian_name = $4, guardian_email = $5 WHERE id = $6 RETURNING *`,
      [full_name, email, phone, guardian_name, guardian_email, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.json({ success: true, student: result.rows[0] });
  } catch (err) {
    const students = getDemoStudents();
    const index = students.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Not found.' });
    students[index] = { ...students[index], full_name, email, phone, guardian_name, guardian_email };
    saveDemoStudents(students);
    return res.json({ success: true, student: students[index] });
  }
});

// ── DELETE /api/students/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM students WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    let students = getDemoStudents();
    const len = students.length;
    students = students.filter(s => s.id !== req.params.id);
    if (students.length === len) return res.status(404).json({ success: false, message: 'Not found.' });
    saveDemoStudents(students);
    return res.json({ success: true, message: 'Deleted' });
  }
});

// ── POST /api/students/:id/enroll ─────────────────────────────────────────────
router.post('/:id/enroll', async (req, res) => {
  const { class_id } = req.body;
  const student_id   = req.params.id;

  if (!class_id) return res.status(400).json({ success: false, message: 'class_id is required.' });

  try {
    const result = await query(
      `INSERT INTO enrollments (student_id, class_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [student_id, class_id]
    );
    if (!result.rows.length) return res.status(409).json({ success: false, message: 'Student already enrolled.' });
    
    await EventBus.emit(EventBus.EVENTS.STUDENT_ENROLLED, { studentId: student_id, classId: class_id });
    return res.status(201).json({ success: true, enrollment: result.rows[0] });
  } catch (err) {
    // Demo mode success
    await EventBus.emit(EventBus.EVENTS.STUDENT_ENROLLED, { studentId: student_id, classId: class_id });
    return res.status(201).json({ success: true, enrollment: { student_id, class_id, status: 'active' } });
  }
});

module.exports = router;
