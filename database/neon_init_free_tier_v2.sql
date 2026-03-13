-- ============================================================================
-- AODS - neon_init_free_tier_v2.sql
-- INCREMENTAL MIGRATION — jalankan SETELAH neon_init_free_tier.sql
-- Menambahkan dukungan Login/Signup dengan email+password
-- ============================================================================

-- ============================================================================
-- 1. TAMBAH KOLOM KE sys_identity.users
--    (wallet_address sekarang opsional — user bisa daftar via email)
-- ============================================================================

-- Buat wallet_address tidak wajib (nullable) agar user bisa signup tanpa wallet
ALTER TABLE sys_identity.users
    ALTER COLUMN wallet_address DROP NOT NULL;

-- Tambah kolom password untuk login tradisional
ALTER TABLE sys_identity.users
    ADD COLUMN IF NOT EXISTS password_hash      TEXT,
    ADD COLUMN IF NOT EXISTS email_verified     BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS auth_provider      VARCHAR(20) DEFAULT 'email'
                                                    CHECK (auth_provider IN ('email','wallet','google','github')),
    ADD COLUMN IF NOT EXISTS bio                TEXT,
    ADD COLUMN IF NOT EXISTS website            TEXT,
    ADD COLUMN IF NOT EXISTS twitter_handle     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS github_handle      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS xp_points          INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS level              INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS profile_video_url  TEXT;

-- Index baru
CREATE INDEX IF NOT EXISTS idx_users_email          ON sys_identity.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider  ON sys_identity.users(auth_provider);

-- ============================================================================
-- 2. email_verifications
--    Untuk link verifikasi email saat signup
-- ============================================================================
CREATE TABLE IF NOT EXISTS sys_identity.email_verifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    token       VARCHAR(128) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL
                    DEFAULT (NOW() + INTERVAL '24 hours'),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verif_token
    ON sys_identity.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verif_user
    ON sys_identity.email_verifications(user_id);

-- ============================================================================
-- 3. password_reset_tokens
--    Untuk fitur "Lupa Password"
-- ============================================================================
CREATE TABLE IF NOT EXISTS sys_identity.password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    token       VARCHAR(128) NOT NULL UNIQUE,
    used        BOOLEAN DEFAULT FALSE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL
                    DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_token
    ON sys_identity.password_reset_tokens(token);

-- ============================================================================
-- 4. oauth_providers
--    Untuk login via Google / GitHub di masa depan
-- ============================================================================
CREATE TABLE IF NOT EXISTS sys_identity.oauth_providers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    provider        VARCHAR(20) NOT NULL CHECK (provider IN ('google','github','discord')),
    provider_user_id VARCHAR(200) NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    expires_at      TIMESTAMP WITH TIME ZONE,
    profile_data    JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

-- ============================================================================
-- 5. login_attempts
--    Untuk keamanan — brute force protection
-- ============================================================================
CREATE TABLE IF NOT EXISTS sys_identity.login_attempts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier  VARCHAR(255) NOT NULL,  -- email atau wallet address
    ip_address  INET,
    success     BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier
    ON sys_identity.login_attempts(identifier, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
    ON sys_identity.login_attempts(ip_address, attempted_at);

-- ============================================================================
-- 6. user_preferences
--    Untuk settings halaman profile (notifikasi, bahasa, dark mode, dll)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sys_identity.user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    language            VARCHAR(10) DEFAULT 'id'
                            CHECK (language IN ('id','en','zh','jp')),
    dark_mode           BOOLEAN DEFAULT TRUE,
    animations_enabled  BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications  BOOLEAN DEFAULT FALSE,
    transaction_alerts  BOOLEAN DEFAULT TRUE,
    two_fa_enabled      BOOLEAN DEFAULT FALSE,
    two_fa_secret       TEXT,
    profile_visibility  VARCHAR(20) DEFAULT 'public'
                            CHECK (profile_visibility IN ('public','private','friends')),
    show_wallet_address BOOLEAN DEFAULT FALSE,
    show_activity       BOOLEAN DEFAULT TRUE,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. user_active_sessions
--    Untuk halaman "Active Sessions" di Profile > Security
-- ============================================================================
CREATE TABLE IF NOT EXISTS sys_identity.user_active_sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    session_token VARCHAR(128) NOT NULL UNIQUE,
    device_name  VARCHAR(200),
    browser      VARCHAR(100),
    os           VARCHAR(100),
    ip_address   INET,
    location     VARCHAR(200),
    is_current   BOOLEAN DEFAULT FALSE,
    last_active  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at   TIMESTAMP WITH TIME ZONE
                     DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user
    ON sys_identity.user_active_sessions(user_id, expires_at);

-- ============================================================================
-- 8. TRIGGER — auto-buat user_preferences saat user baru dibuat
-- ============================================================================
CREATE OR REPLACE FUNCTION sys_identity.on_user_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Buat preferences default
    INSERT INTO sys_identity.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Assign role 'user' secara otomatis
    INSERT INTO sys_identity.user_roles (user_id, role_id)
    SELECT NEW.id, id FROM sys_identity.roles WHERE name = 'user'
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_on_user_created ON sys_identity.users;
CREATE TRIGGER trigger_on_user_created
    AFTER INSERT ON sys_identity.users
    FOR EACH ROW EXECUTE FUNCTION sys_identity.on_user_created();

-- ============================================================================
-- 9. TRIGGER — update updated_at di user_preferences
-- ============================================================================
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON sys_identity.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. FUNCTION — cek brute force (max 5 gagal per 15 menit)
-- ============================================================================
CREATE OR REPLACE FUNCTION sys_identity.check_brute_force(
    p_identifier VARCHAR,
    p_ip         INET
) RETURNS BOOLEAN AS $$
DECLARE
    fail_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fail_count
    FROM sys_identity.login_attempts
    WHERE (identifier = p_identifier OR ip_address = p_ip)
      AND success = FALSE
      AND attempted_at > NOW() - INTERVAL '15 minutes';

    RETURN fail_count >= 5;  -- TRUE = diblokir
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. VIEW — user profile lengkap untuk frontend
-- ============================================================================
CREATE OR REPLACE VIEW sys_identity.user_profile_full AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.email,
    u.avatar_url,
    u.profile_video_url,
    u.bio,
    u.website,
    u.twitter_handle,
    u.github_handle,
    u.xp_points,
    u.level,
    u.is_verified,
    u.email_verified,
    u.kyc_status,
    u.mfa_enabled,
    u.auth_provider,
    u.wallet_address,
    u.created_at,
    u.last_login_at,
    -- Preferences
    p.language,
    p.dark_mode,
    p.animations_enabled,
    p.email_notifications,
    p.push_notifications,
    p.transaction_alerts,
    p.two_fa_enabled,
    p.profile_visibility,
    p.show_wallet_address,
    p.show_activity,
    -- Subscription
    COALESCE(sp.name, 'Free')       AS subscription_plan,
    COALESCE(a.balance, 0)          AS account_balance,
    -- Role
    r.name                          AS role
FROM sys_identity.users u
LEFT JOIN sys_identity.user_preferences p   ON p.user_id = u.id
LEFT JOIN fintech_ledger.subscriptions s    ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN fintech_ledger.subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN fintech_ledger.accounts a         ON a.user_id = u.id AND a.status = 'active'
LEFT JOIN sys_identity.user_roles ur        ON ur.user_id = u.id
LEFT JOIN sys_identity.roles r              ON r.id = ur.role_id;

-- ============================================================================
-- 12. RLS untuk tabel baru
-- ============================================================================
ALTER TABLE sys_identity.email_verifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.password_reset_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.user_preferences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.user_active_sessions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY pref_isolation ON sys_identity.user_preferences
    FOR ALL TO PUBLIC
    USING (
        user_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.is_admin', TRUE)::TEXT = 'true'
    );

CREATE POLICY session_isolation ON sys_identity.user_active_sessions
    FOR ALL TO PUBLIC
    USING (
        user_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.is_admin', TRUE)::TEXT = 'true'
    );

-- ============================================================================
-- VERIFIKASI — jalankan ini setelah script selesai
-- ============================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'sys_identity' AND table_name = 'users'
-- ORDER BY ordinal_position;
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'sys_identity'
-- ORDER BY table_name;
-- ============================================================================
