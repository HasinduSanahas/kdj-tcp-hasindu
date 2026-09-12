-- =============================================================================
-- HASI TUITION CLASS MANAGEMENT SYSTEM
-- Database Schema: Step 1 — Core Tables
-- =============================================================================
-- DESIGN PRINCIPLE:
--   Core tables are immutable foundations. Modules NEVER alter core tables.
--   Instead, modules own their own tables and point FK → Core.
--   The Core has zero knowledge of any module's existence.
-- =============================================================================

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: CORE TABLES (Base Core Engine — Cannot Be Detached)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: teachers
-- Stores all teaching staff. Referenced by classes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20),
    subject         VARCHAR(100),           -- Primary subject taught
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teachers IS 'Core table: All teaching staff. Managed only by the Core engine.';

-- -----------------------------------------------------------------------------
-- Table: students
-- The heart of the system. All module tables reference this via FK.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    guardian_name   VARCHAR(150),
    guardian_phone  VARCHAR(20),
    guardian_email  VARCHAR(255),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    enrolled_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Core table: All student records. Referenced by every module that needs student context.';

-- -----------------------------------------------------------------------------
-- Table: classes
-- A class belongs to a teacher and can have many students via enrollments.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name      VARCHAR(150)    NOT NULL,
    subject         VARCHAR(100)    NOT NULL,
    teacher_id      UUID            NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    schedule_day    VARCHAR(20),            -- e.g., 'Monday', 'Wednesday'
    schedule_time   TIME,                   -- e.g., 14:30:00
    duration_mins   SMALLINT        DEFAULT 60,
    max_capacity    SMALLINT        DEFAULT 30,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE classes IS 'Core table: Class sessions managed by the Core engine.';

-- -----------------------------------------------------------------------------
-- Table: enrollments  (Core — Junction between students and classes)
-- Represents a student's membership in a class.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID            NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id        UUID            NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    enrolled_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)     NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'suspended', 'completed')),
    UNIQUE (student_id, class_id)   -- Prevent duplicate enrollments
);

COMMENT ON TABLE enrollments IS 'Core table: Maps students to classes. The many-to-many bridge.';


-- =============================================================================
-- SECTION 2: MODULE REGISTRY TABLE (The Plug-and-Play Control Plane)
-- =============================================================================
-- DESIGN PRINCIPLE:
--   This is the single source of truth for which modules are active.
--   The Backend Event Emitter checks this table before routing any event
--   to a module's handler. If status = 'detached', the handler is never called.
-- =============================================================================

CREATE TABLE IF NOT EXISTS module_registry (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Unique machine-readable key used by the Event Emitter to look up modules
    module_key      VARCHAR(50)     NOT NULL UNIQUE,
                                    -- e.g., 'attendance', 'fee_management', 'groq_ai_insights'

    -- Human-readable display name for the Frontend UI
    display_name    VARCHAR(100)    NOT NULL,
                                    -- e.g., 'Attendance Tracker', 'Groq AI Insights'

    -- Short description shown in the module marketplace / admin panel
    description     TEXT,

    -- The icon identifier for the Frontend sidebar (e.g., a Lucide icon name)
    icon            VARCHAR(50)     DEFAULT 'puzzle',

    -- Route prefix for the frontend (e.g., '/attendance', '/ai-reports')
    frontend_route  VARCHAR(100),

    -- *** THE CORE ATTACH/DETACH FIELD ***
    -- The Event Emitter checks this before executing any module logic.
    status          VARCHAR(20)     NOT NULL DEFAULT 'detached'
                        CHECK (status IN ('attached', 'detached')),

    -- Semantic version of the installed module
    version         VARCHAR(20)     DEFAULT '1.0.0',

    -- Timestamps for audit trail
    attached_at     TIMESTAMPTZ,    -- Set when status flips to 'attached'
    detached_at     TIMESTAMPTZ,    -- Set when status flips to 'detached'
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE module_registry IS
    'Control plane: Single source of truth for module attach/detach status.
     The Backend Event Emitter queries this table before dispatching events to module handlers.
     Adding a module here with status=attached activates its full feature set instantly.';

-- Seed the initial three MVP modules (all start as "detached")
INSERT INTO module_registry (module_key, display_name, description, icon, frontend_route, status, version)
VALUES
    (
        'attendance',
        'Attendance Tracker',
        'QR/Barcode-based student check-in system. Emits attendance_logged events consumed by other modules.',
        'scan-barcode',
        '/attendance',
        'detached',
        '1.0.0'
    ),
    (
        'fee_management',
        'Fee Management',
        'Monthly fee tracking, digital invoice generation, and full payment history per student.',
        'indian-rupee',
        '/fees',
        'detached',
        '1.0.0'
    ),
    (
        'groq_ai_insights',
        'Groq AI Insights',
        'Analyzes attendance and performance data via Groq API. Dispatches personalized progress emails via NodeMailer.',
        'brain-circuit',
        '/ai-reports',
        'detached',
        '1.0.0'
    ),
    (
        'exam_grading',
        'Exam & Grading System',
        'මාසික පරීක්ෂණ වල ලකුණු ඇතුලත් කිරීම, Ranks බැලීම සහ ලකුණු විශ්ලේෂණය කිරීම.',
        'award',
        '/exams',
        'detached',
        '1.0.0'
    ),
    (
        'lms_materials',
        'LMS & Material Hub',
        'ළමයින්ට Tutes, PDF, Past Papers සහ Recorded Videos බෙදා හැරීම (Watermark සහිතව).',
        'book-open',
        '/lms',
        'detached',
        '1.0.0'
    ),
    (
        'seat_booking',
        'Seat Booking Engine',
        'ළමයින්ට App එක හරහා කලින්ම තමන්ගේ ආසනය (Seat) වෙන් කරගත හැකි පහසුකම.',
        'ticket',
        '/seat-booking',
        'detached',
        '1.0.0'
    ),
    (
        'staff_payroll',
        'Staff & Payroll Management',
        'සහයක ගුරුවරුන්ගේ පැමිණීම, වැටුප් සහ දීමනා ස්වයංක්‍රීයව ගණනය කිරීම.',
        'briefcase',
        '/staff',
        'detached',
        '1.0.0'
    ),
    (
        'expense_tracker',
        'Expense & Profit Tracker',
        'ආදායම්/වියදම් සටහන් කර මාසික ශුද්ධ ලාභය බලා ගැනීමට ඇති Core Accounting අංගය.',
        'pie-chart',
        '/expenses',
        'detached',
        '1.0.0'
    )
ON CONFLICT (module_key) DO NOTHING;


-- =============================================================================
-- SECTION 3: MODULE-OWNED TABLES
-- Each module owns its own schema. The Core has ZERO knowledge of these tables.
-- Modules point their FKs → Core tables, never the reverse.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MODULE: attendance
-- Owns: attendance_sessions, attendance_logs
-- -----------------------------------------------------------------------------

-- A class session on a specific date (created by the Attendance module)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id        UUID            NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date    DATE            NOT NULL,
    opened_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,            -- NULL means session is still open
    qr_token        VARCHAR(255),           -- Rotating QR code token for the session
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, session_date)
);

COMMENT ON TABLE attendance_sessions IS
    'MODULE: attendance — A specific class session opened for check-in.
     Entirely owned by the Attendance module. Core knows nothing about this table.';

-- Individual student check-in record for a session
CREATE TABLE IF NOT EXISTS attendance_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID            NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      UUID            NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    checked_in_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    method          VARCHAR(20)     NOT NULL DEFAULT 'qr'
                        CHECK (method IN ('qr', 'barcode', 'manual')),
    UNIQUE (session_id, student_id)     -- A student can only check in once per session
);

COMMENT ON TABLE attendance_logs IS
    'MODULE: attendance — Individual check-in record.
     When a row is inserted here, the backend emits the "attendance_logged" event.
     Any attached module (e.g., groq_ai_insights) may react to this event.';

-- -----------------------------------------------------------------------------
-- MODULE: fee_management
-- Owns: fee_plans, fee_invoices, fee_payments
-- -----------------------------------------------------------------------------

-- Defines the fee structure per class (monthly, per-session, etc.)
CREATE TABLE IF NOT EXISTS fee_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id        UUID            NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    plan_name       VARCHAR(100)    NOT NULL,   -- e.g., 'Monthly Standard', 'Per Session'
    amount          NUMERIC(10, 2)  NOT NULL,
    currency        VARCHAR(5)      NOT NULL DEFAULT 'INR',
    billing_cycle   VARCHAR(20)     NOT NULL DEFAULT 'monthly'
                        CHECK (billing_cycle IN ('monthly', 'per_session', 'yearly')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fee_plans IS 'MODULE: fee_management — Defines fee structures per class.';

-- A generated invoice for a specific student enrollment + billing period
CREATE TABLE IF NOT EXISTS fee_invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID            NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id   UUID            NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    fee_plan_id     UUID            NOT NULL REFERENCES fee_plans(id) ON DELETE RESTRICT,
    invoice_number  VARCHAR(50)     NOT NULL UNIQUE,    -- e.g., 'INV-2026-001'
    amount_due      NUMERIC(10, 2)  NOT NULL,
    amount_paid     NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    due_date        DATE            NOT NULL,
    billing_period  VARCHAR(20),                        -- e.g., 'September 2026'
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    issued_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fee_invoices IS 'MODULE: fee_management — Generated invoices per student per billing cycle.';

-- Individual payment transactions against an invoice
CREATE TABLE IF NOT EXISTS fee_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID            NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
    amount          NUMERIC(10, 2)  NOT NULL,
    payment_method  VARCHAR(30)     NOT NULL DEFAULT 'cash'
                        CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'other')),
    transaction_ref VARCHAR(100),               -- UPI transaction ID, etc.
    paid_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fee_payments IS 'MODULE: fee_management — Individual payment transactions.';

-- -----------------------------------------------------------------------------
-- MODULE: groq_ai_insights
-- Owns: ai_report_jobs, ai_email_logs
-- -----------------------------------------------------------------------------

-- Tracks each AI analysis job triggered by an event
CREATE TABLE IF NOT EXISTS ai_report_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID            NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    trigger_event   VARCHAR(100)    NOT NULL,   -- e.g., 'attendance_logged', 'manual_trigger'
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    groq_prompt     TEXT,                       -- The prompt sent to Groq API
    groq_response   TEXT,                       -- Raw AI-generated content
    error_message   TEXT,                       -- Populated if status = 'failed'
    triggered_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_report_jobs IS
    'MODULE: groq_ai_insights — Tracks Groq API analysis jobs.
     Each job is triggered when the module receives a core event and its status is attached.';

-- Tracks email delivery history
CREATE TABLE IF NOT EXISTS ai_email_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID            NOT NULL REFERENCES ai_report_jobs(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255)    NOT NULL,
    recipient_type  VARCHAR(20)     NOT NULL DEFAULT 'guardian'
                        CHECK (recipient_type IN ('student', 'guardian', 'teacher')),
    subject         VARCHAR(255)    NOT NULL,
    email_body      TEXT,
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_email_logs IS
    'MODULE: groq_ai_insights — Tracks every email dispatched after AI analysis.';


-- =============================================================================
-- SECTION 4: UTILITY — AUTO-UPDATE updated_at TRIGGER
-- =============================================================================

-- Generic trigger function to auto-update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with an updated_at column
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'teachers', 'students', 'classes', 'enrollments',
        'module_registry', 'fee_invoices'
    ]
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I;
             CREATE TRIGGER set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
            tbl, tbl
        );
    END LOOP;
END;
$$;


-- =============================================================================
-- SECTION 5: INDEXES (Performance for common query patterns)
-- =============================================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_students_email         ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_is_active     ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student    ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class      ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher        ON classes(teacher_id);

-- Module Registry: fast lookup by module_key (the hot path in Event Emitter)
CREATE INDEX IF NOT EXISTS idx_module_registry_key    ON module_registry(module_key);
CREATE INDEX IF NOT EXISTS idx_module_registry_status ON module_registry(status);

-- Attendance module indexes
CREATE INDEX IF NOT EXISTS idx_att_sessions_class     ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_att_sessions_date      ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_att_logs_session       ON attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_att_logs_student       ON attendance_logs(student_id);

-- Fee module indexes
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student   ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status    ON fee_invoices(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice   ON fee_payments(invoice_id);

-- AI module indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_student        ON ai_report_jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status         ON ai_report_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_email_logs_job      ON ai_email_logs(job_id);


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
