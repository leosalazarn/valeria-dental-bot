-- ==========================================
-- 🦷 Valeria Dental Bot — Security & Policies (DCL)
-- ==========================================

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 1. Conversations Policies
-- Allow 'anon' and 'authenticated' roles to perform all operations
-- (Necessary for the Node.js server using the anon/service key)
CREATE POLICY "Enable all operations for app access on conversations" ON conversations
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Patients Policies
CREATE POLICY "Enable all operations for app access on patients" ON patients
    FOR ALL USING (true) WITH CHECK (true);

-- Note: In a production environment with patient-facing web apps,
-- you would replace 'USING (true)' with specific phone-based filters.
