-- ============================================================================
-- AODS - Autonomous Orchestration of Digital Systems
-- Neon.tech Database Initialization Script (Free Tier Compatible)
-- Revisi: hapus pgvector, timescaledb, hypertable calls
-- ============================================================================

-- Extensions yang tersedia di Neon Free tier
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pgvector  : TIDAK tersedia di Free tier (butuh upgrade)
-- timescaledb: TIDAK tersedia di Free tier (butuh upgrade)

-- ============================================================================
-- SCHEMA 1: sys_identity - Authentication & Authorization
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS sys_identity;

-- Users table
CREATE TABLE IF NOT EXISTS sys_identity.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address  VARCHAR(64)  UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE,
    username        VARCHAR(100) UNIQUE NOT NULL,
    display_name    VARCHAR(200),
    avatar_url      TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    kyc_status      VARCHAR(20)  DEFAULT 'pending'
                        CHECK (kyc_status IN ('pending','verified','rejected')),
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    mfa_secret      TEXT,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata        JSONB DEFAULT '{}'
);

-- Roles
CREATE TABLE IF NOT EXISTS sys_identity.roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-role mapping
CREATE TABLE IF NOT EXISTS sys_identity.user_roles (
    user_id     UUID REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    role_id     UUID REFERENCES sys_identity.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES sys_identity.users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sys_identity.sessions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys
CREATE TABLE IF NOT EXISTS sys_identity.api_keys (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    key_hash     VARCHAR(128) NOT NULL,
    permissions  JSONB DEFAULT '[]',
    is_active    BOOLEAN DEFAULT TRUE,
    expires_at   TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes sys_identity
CREATE INDEX IF NOT EXISTS idx_sessions_user_id  ON sys_identity.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires   ON sys_identity.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_active    ON sys_identity.api_keys(is_active);

-- ============================================================================
-- SCHEMA 2: core_orchestration - System State & Configuration
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS core_orchestration;

-- Microservices registry
CREATE TABLE IF NOT EXISTS core_orchestration.services (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           VARCHAR(100) UNIQUE NOT NULL,
    language       VARCHAR(50)  NOT NULL,
    version        VARCHAR(50)  NOT NULL,
    endpoint       TEXT         NOT NULL,
    health_status  VARCHAR(20)  DEFAULT 'unknown'
                       CHECK (health_status IN ('healthy','degraded','critical','unknown')),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    metadata       JSONB DEFAULT '{}',
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflows
CREATE TABLE IF NOT EXISTS core_orchestration.workflows (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    definition   JSONB NOT NULL,
    status       VARCHAR(20) DEFAULT 'active'
                     CHECK (status IN ('active','inactive','draft')),
    trigger_type VARCHAR(50) NOT NULL,
    created_by   UUID REFERENCES sys_identity.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS core_orchestration.workflow_executions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id   UUID REFERENCES core_orchestration.workflows(id) ON DELETE CASCADE,
    status        VARCHAR(20) DEFAULT 'pending'
                      CHECK (status IN ('pending','running','completed','failed','cancelled')),
    input_data    JSONB,
    output_data   JSONB,
    started_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at  TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- System configuration
CREATE TABLE IF NOT EXISTS core_orchestration.config (
    key         VARCHAR(200) PRIMARY KEY,
    value       JSONB NOT NULL,
    description TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by  UUID REFERENCES sys_identity.users(id) ON DELETE SET NULL
);

-- Message queue
CREATE TABLE IF NOT EXISTS core_orchestration.message_queue (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_name   VARCHAR(100) NOT NULL,
    message      JSONB NOT NULL,
    priority     INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status       VARCHAR(20) DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','completed','failed')),
    attempts     INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_queue_poll
    ON core_orchestration.message_queue(queue_name, status, priority, created_at);

-- ============================================================================
-- SCHEMA 3: holo_assets - 3D Assets & Metadata
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS holo_assets;

-- Categories (self-referencing)
CREATE TABLE IF NOT EXISTS holo_assets.categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id   UUID REFERENCES holo_assets.categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D Assets
CREATE TABLE IF NOT EXISTS holo_assets.assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    category_id     UUID REFERENCES holo_assets.categories(id) ON DELETE SET NULL,
    asset_type      VARCHAR(50) NOT NULL,
    file_format     VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT,
    storage_url     TEXT,
    thumbnail_url   TEXT,
    metadata        JSONB DEFAULT '{}',
    creator_id      UUID REFERENCES sys_identity.users(id) ON DELETE SET NULL,
    is_public       BOOLEAN DEFAULT FALSE,
    download_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset versions
CREATE TABLE IF NOT EXISTS holo_assets.asset_versions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id       UUID NOT NULL REFERENCES holo_assets.assets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_url    TEXT NOT NULL,
    changelog      TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (asset_id, version_number)
);

-- User asset ownership
CREATE TABLE IF NOT EXISTS holo_assets.user_assets (
    user_id          UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    asset_id         UUID NOT NULL REFERENCES holo_assets.assets(id) ON DELETE CASCADE,
    acquired_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acquisition_type VARCHAR(50) DEFAULT 'purchase'
                         CHECK (acquisition_type IN ('purchase','gift','reward','free')),
    PRIMARY KEY (user_id, asset_id)
);

-- Tags
CREATE TABLE IF NOT EXISTS holo_assets.tags (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Asset-tag mapping
CREATE TABLE IF NOT EXISTS holo_assets.asset_tags (
    asset_id UUID REFERENCES holo_assets.assets(id) ON DELETE CASCADE,
    tag_id   UUID REFERENCES holo_assets.tags(id)   ON DELETE CASCADE,
    PRIMARY KEY (asset_id, tag_id)
);

-- ============================================================================
-- SCHEMA 4: ai_brain_vector - AI Models & Predictions
-- (pgvector tidak tersedia di Free tier — embedding disimpan sebagai JSONB)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS ai_brain_vector;

-- AI Models registry
CREATE TABLE IF NOT EXISTS ai_brain_vector.models (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    model_type          VARCHAR(50)  NOT NULL,
    version             VARCHAR(50)  NOT NULL,
    architecture        VARCHAR(100),
    parameters_count    BIGINT,
    storage_path        TEXT,
    is_active           BOOLEAN DEFAULT FALSE,
    performance_metrics JSONB DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings (JSONB sebagai pengganti VECTOR — upgrade ke pgvector jika naik plan)
CREATE TABLE IF NOT EXISTS ai_brain_vector.embeddings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type  VARCHAR(50) NOT NULL,
    source_id    UUID        NOT NULL,
    model_id     UUID REFERENCES ai_brain_vector.models(id) ON DELETE SET NULL,
    embedding    JSONB,        -- placeholder untuk VECTOR(1536)
    text_content TEXT,
    metadata     JSONB DEFAULT '{}',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_source
    ON ai_brain_vector.embeddings(source_type, source_id);

-- Training datasets
CREATE TABLE IF NOT EXISTS ai_brain_vector.training_data (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_name VARCHAR(200) NOT NULL,
    data_type    VARCHAR(50)  NOT NULL,
    content      JSONB NOT NULL,
    labels       JSONB,
    is_labeled   BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI predictions log
CREATE TABLE IF NOT EXISTS ai_brain_vector.predictions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id         UUID REFERENCES ai_brain_vector.models(id) ON DELETE SET NULL,
    input_data       JSONB NOT NULL,
    output_data      JSONB NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
    explanation      TEXT,
    user_feedback    INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA 5: fintech_ledger - Financial Transactions
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS fintech_ledger;

-- Subscription plans (dibuat duluan karena direferensikan subscriptions)
CREATE TABLE IF NOT EXISTS fintech_ledger.subscription_plans (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(200) NOT NULL,
    description   TEXT,
    price         DECIMAL(20,2) NOT NULL CHECK (price >= 0),
    currency      VARCHAR(10) DEFAULT 'IDR',
    billing_cycle VARCHAR(20) NOT NULL
                      CHECK (billing_cycle IN ('monthly','yearly','lifetime')),
    features      JSONB DEFAULT '[]',
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts
CREATE TABLE IF NOT EXISTS fintech_ledger.accounts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    account_type  VARCHAR(50) NOT NULL,
    currency      VARCHAR(10) DEFAULT 'IDR',
    balance       DECIMAL(20,2) DEFAULT 0 CHECK (balance >= 0),
    frozen_amount DECIMAL(20,2) DEFAULT 0 CHECK (frozen_amount >= 0),
    status        VARCHAR(20) DEFAULT 'active'
                      CHECK (status IN ('active','frozen','closed')),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, account_type, currency)
);

-- Transactions
CREATE TABLE IF NOT EXISTS fintech_ledger.transactions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id            UUID REFERENCES fintech_ledger.accounts(id) ON DELETE SET NULL,
    transaction_type      VARCHAR(50) NOT NULL,
    amount                DECIMAL(20,2) NOT NULL,
    currency              VARCHAR(10) DEFAULT 'IDR',
    description           TEXT,
    reference_id          VARCHAR(200),
    mayar_transaction_id  VARCHAR(200),
    status                VARCHAR(20) DEFAULT 'pending'
                              CHECK (status IN ('pending','completed','failed','refunded')),
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at          TIMESTAMP WITH TIME ZONE
);

-- Mayar payment records
CREATE TABLE IF NOT EXISTS fintech_ledger.mayar_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mayar_id        VARCHAR(200) UNIQUE,
    account_id      UUID REFERENCES fintech_ledger.accounts(id) ON DELETE SET NULL,
    amount          DECIMAL(20,2) NOT NULL CHECK (amount > 0),
    currency        VARCHAR(10) DEFAULT 'IDR',
    payment_method  VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','failed','expired','refunded')),
    webhook_payload JSONB,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS fintech_ledger.subscriptions (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    plan_id              UUID REFERENCES fintech_ledger.subscription_plans(id) ON DELETE SET NULL,
    status               VARCHAR(20) DEFAULT 'active'
                             CHECK (status IN ('active','cancelled','expired','paused')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end   TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user   ON fintech_ledger.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON fintech_ledger.transactions(account_id, created_at);

-- ============================================================================
-- SCHEMA 6: governance_audit - Compliance & Audit Trails
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS governance_audit;

-- Audit logs (plain table, tanpa hypertable — timescaledb tidak tersedia)
CREATE TABLE IF NOT EXISTS governance_audit.audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action          VARCHAR(100) NOT NULL,
    actor_type      VARCHAR(50)  NOT NULL,
    actor_id        UUID,
    resource_type   VARCHAR(100) NOT NULL,
    resource_id     UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    compliance_tags VARCHAR(50)[],
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor    ON governance_audit.audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON governance_audit.audit_logs(resource_type, resource_id);

-- Compliance rules
CREATE TABLE IF NOT EXISTS governance_audit.compliance_rules (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard         VARCHAR(50)  NOT NULL,
    control_id       VARCHAR(50)  NOT NULL,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    automated_check  BOOLEAN DEFAULT FALSE,
    check_query      TEXT,
    severity         VARCHAR(20) DEFAULT 'medium'
                         CHECK (severity IN ('low','medium','high','critical')),
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (standard, control_id)
);

-- Compliance assessments
CREATE TABLE IF NOT EXISTS governance_audit.assessments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id     UUID REFERENCES governance_audit.compliance_rules(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL
                    CHECK (status IN ('pass','fail','partial','not_applicable')),
    findings    JSONB,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessed_by UUID REFERENCES sys_identity.users(id) ON DELETE SET NULL
);

-- Security incidents
CREATE TABLE IF NOT EXISTS governance_audit.security_incidents (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity             VARCHAR(20) NOT NULL
                             CHECK (severity IN ('low','medium','high','critical')),
    incident_type        VARCHAR(100) NOT NULL,
    description          TEXT NOT NULL,
    affected_resources   JSONB,
    mitigation_actions   JSONB,
    status               VARCHAR(20) DEFAULT 'open'
                             CHECK (status IN ('open','investigating','resolved','closed')),
    detected_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at          TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SCHEMA 7: telemetry_stream - Real-time Monitoring Data
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS telemetry_stream;

-- Metrics (plain table, tanpa hypertable)
CREATE TABLE IF NOT EXISTS telemetry_stream.metrics (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    metric_name  VARCHAR(200) NOT NULL,
    metric_value DECIMAL(20,6) NOT NULL,
    unit         VARCHAR(50),
    tags         JSONB,
    recorded_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_service ON telemetry_stream.metrics(service_name, metric_name, recorded_at);

-- System events
CREATE TABLE IF NOT EXISTS telemetry_stream.events (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type   VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    severity     VARCHAR(20) DEFAULT 'info'
                     CHECK (severity IN ('debug','info','warning','error','critical')),
    message      TEXT,
    context      JSONB,
    recorded_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_service ON telemetry_stream.events(service_name, severity, recorded_at);

-- User sessions telemetry
CREATE TABLE IF NOT EXISTS telemetry_stream.user_sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES sys_identity.users(id) ON DELETE SET NULL,
    session_id    VARCHAR(200),
    platform      VARCHAR(50),
    device_type   VARCHAR(50),
    entry_point   VARCHAR(200),
    actions_count INTEGER DEFAULT 0,
    started_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at      TIMESTAMP WITH TIME ZONE
);

-- Performance benchmarks
CREATE TABLE IF NOT EXISTS telemetry_stream.performance (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation     VARCHAR(200) NOT NULL,
    duration_ms   INTEGER NOT NULL CHECK (duration_ms >= 0),
    success       BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    context       JSONB,
    recorded_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA 8: blockchain_indexer - Decentralized Data Index
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS blockchain_indexer;

-- Indexed blocks
CREATE TABLE IF NOT EXISTS blockchain_indexer.blocks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_number      BIGINT UNIQUE NOT NULL,
    block_hash        VARCHAR(66) UNIQUE NOT NULL,
    parent_hash       VARCHAR(66),
    timestamp         TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    gas_used          BIGINT,
    gas_limit         BIGINT,
    indexed_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexed transactions
CREATE TABLE IF NOT EXISTS blockchain_indexer.transactions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash      VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT REFERENCES blockchain_indexer.blocks(block_number) ON DELETE SET NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address   VARCHAR(42),
    value        DECIMAL(50,0),
    gas_price    BIGINT,
    gas_used     BIGINT,
    status       VARCHAR(20) CHECK (status IN ('success','failed','pending')),
    input_data   TEXT,
    indexed_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart contract events
CREATE TABLE IF NOT EXISTS blockchain_indexer.contract_events (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42)  NOT NULL,
    event_name       VARCHAR(100) NOT NULL,
    tx_hash          VARCHAR(66) REFERENCES blockchain_indexer.transactions(tx_hash) ON DELETE SET NULL,
    block_number     BIGINT,
    log_index        INTEGER,
    event_data       JSONB,
    indexed_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet balances cache
CREATE TABLE IF NOT EXISTS blockchain_indexer.wallet_balances (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL,
    token_address  VARCHAR(42),
    balance        DECIMAL(50,0) DEFAULT 0,
    last_updated   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (wallet_address, token_address)
);

-- NFT ownership
CREATE TABLE IF NOT EXISTS blockchain_indexer.nft_ownership (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42)  NOT NULL,
    token_id         VARCHAR(100) NOT NULL,
    owner_address    VARCHAR(42)  NOT NULL,
    metadata_uri     TEXT,
    acquired_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (contract_address, token_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE sys_identity.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.api_keys     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_ledger.accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_ledger.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_ledger.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holo_assets.user_assets   ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON sys_identity.users
    FOR ALL TO PUBLIC
    USING (
        id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.is_admin', TRUE)::TEXT = 'true'
    );

CREATE POLICY account_isolation ON fintech_ledger.accounts
    FOR ALL TO PUBLIC
    USING (
        user_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.is_admin', TRUE)::TEXT = 'true'
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON sys_identity.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON core_orchestration.workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON holo_assets.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mayar_payments_updated_at
    BEFORE UPDATE ON fintech_ledger.mayar_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON fintech_ledger.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO governance_audit.audit_logs (
        action, actor_type, actor_id, resource_type, resource_id,
        old_values, new_values, compliance_tags
    ) VALUES (
        TG_OP,
        COALESCE(current_setting('app.actor_type', TRUE), 'system'),
        CASE
            WHEN current_setting('app.actor_id', TRUE) IS NOT NULL
             AND current_setting('app.actor_id', TRUE) != ''
            THEN current_setting('app.actor_id', TRUE)::UUID
            ELSE NULL
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        ARRAY['ISO27001', 'COBIT']
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW sys_identity.user_dashboard AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.is_verified,
    u.kyc_status,
    u.created_at,
    COALESCE(a.balance, 0)                                                        AS account_balance,
    COALESCE(sp.name, 'Free')                                                     AS subscription_plan
FROM sys_identity.users u
LEFT JOIN fintech_ledger.accounts a
       ON a.user_id = u.id AND a.status = 'active'
LEFT JOIN fintech_ledger.subscriptions s
       ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN fintech_ledger.subscription_plans sp
       ON sp.id = s.plan_id;

CREATE OR REPLACE VIEW core_orchestration.system_health AS
SELECT
    s.name            AS service_name,
    s.language,
    s.health_status,
    s.last_heartbeat,
    CASE
        WHEN s.last_heartbeat > NOW() - INTERVAL '5 minutes'  THEN 'healthy'
        WHEN s.last_heartbeat > NOW() - INTERVAL '15 minutes' THEN 'degraded'
        ELSE 'critical'
    END AS overall_status
FROM core_orchestration.services s;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

INSERT INTO sys_identity.roles (name, description, permissions) VALUES
    ('admin',      'System Administrator', '["*"]'),
    ('user',       'Standard User',        '["read:assets","read:profile","write:profile"]'),
    ('developer',  'Application Developer','["read:assets","write:assets","read:api"]'),
    ('enterprise', 'Enterprise Customer',  '["read:assets","write:assets","read:analytics","write:workflows"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO fintech_ledger.subscription_plans (name, description, price, billing_cycle, features) VALUES
    ('Free',       'Basic access to AODS metaverse',    0,      'monthly', '["basic_3d","limited_assets"]'),
    ('Pro',        'Professional metaverse tools',      99000,  'monthly', '["advanced_3d","unlimited_assets","ai_assistant","vr_access"]'),
    ('Enterprise', 'Full enterprise orchestration',     499000, 'monthly', '["all_features","dedicated_support","custom_integrations","sla_guarantee"]')
ON CONFLICT DO NOTHING;

INSERT INTO core_orchestration.config (key, value, description) VALUES
    ('system.name',               '"AODS - Autonomous Orchestration of Digital Systems"', 'System display name'),
    ('system.version',            '"1.0.0"',  'Current system version'),
    ('system.maintenance_mode',   'false',    'Maintenance mode flag'),
    ('ai.autoscaling.enabled',    'true',     'Enable AI auto-scaling'),
    ('telemetry.retention_days',  '90',       'Telemetry data retention period in days'),
    ('mayar.sandbox_mode',        'true',     'Mayar API sandbox mode')
ON CONFLICT (key) DO NOTHING;

INSERT INTO governance_audit.compliance_rules (standard, control_id, title, description, automated_check, severity) VALUES
    ('ISO27001', 'A.9.1.1',  'Access Control Policy',         'User access should be restricted based on roles',   TRUE,  'high'),
    ('ISO27001', 'A.9.4.1',  'Information Access Restriction','Sensitive data access logging required',            TRUE,  'high'),
    ('COBIT',    'APO01.05', 'IT Governance Framework',       'IT processes aligned with business goals',          FALSE, 'medium'),
    ('COBIT',    'DSS05.04', 'Data Security',                 'End-to-end encryption for sensitive data',          TRUE,  'high')
ON CONFLICT (standard, control_id) DO NOTHING;

-- ============================================================================
-- VERIFY INSTALLATION
-- ============================================================================
-- Jalankan query ini setelah script selesai untuk verifikasi:
-- SELECT schemaname, COUNT(*) as table_count
-- FROM pg_tables
-- WHERE schemaname IN (
--   'sys_identity','core_orchestration','holo_assets',
--   'ai_brain_vector','fintech_ledger','governance_audit',
--   'telemetry_stream','blockchain_indexer'
-- )
-- GROUP BY schemaname ORDER BY schemaname;
-- ============================================================================
