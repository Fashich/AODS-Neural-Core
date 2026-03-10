-- ============================================================================
-- AODS - Autonomous Orchestration of Digital Systems
-- Neon.tech Database Initialization Script
-- Database: aods_neural_core
-- ============================================================================
-- Execute this script in Neon.tech SQL Editor to initialize the entire database
-- This creates all 8 schemas with proper extensions for enterprise metaverse
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================================================
-- SCHEMA 1: sys_identity - Authentication & Authorization
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS sys_identity;

-- Users table with Web4 decentralized identity support
CREATE TABLE IF NOT EXISTS sys_identity.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'pending',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Roles and permissions
CREATE TABLE IF NOT EXISTS sys_identity.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-role mapping
CREATE TABLE IF NOT EXISTS sys_identity.user_roles (
    user_id UUID REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES sys_identity.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID,
    PRIMARY KEY (user_id, role_id)
);

-- Session management
CREATE TABLE IF NOT EXISTS sys_identity.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES sys_identity.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys for service-to-service authentication
CREATE TABLE IF NOT EXISTS sys_identity.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(128) NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA 2: core_orchestration - System State & Configuration
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS core_orchestration;

-- Microservices registry
CREATE TABLE IF NOT EXISTS core_orchestration.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    language VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    endpoint TEXT NOT NULL,
    health_status VARCHAR(20) DEFAULT 'unknown',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orchestration workflows
CREATE TABLE IF NOT EXISTS core_orchestration.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    trigger_type VARCHAR(50) NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS core_orchestration.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES core_orchestration.workflows(id),
    status VARCHAR(20) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- System configuration
CREATE TABLE IF NOT EXISTS core_orchestration.config (
    key VARCHAR(200) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- Message queue for inter-service communication
CREATE TABLE IF NOT EXISTS core_orchestration.message_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_name VARCHAR(100) NOT NULL,
    message JSONB NOT NULL,
    priority INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for message queue polling
CREATE INDEX IF NOT EXISTS idx_message_queue_poll 
ON core_orchestration.message_queue(queue_name, status, priority, created_at);

-- ============================================================================
-- SCHEMA 3: holo_assets - 3D Assets & Metadata
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS holo_assets;

-- Asset categories
CREATE TABLE IF NOT EXISTS holo_assets.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES holo_assets.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D Assets
CREATE TABLE IF NOT EXISTS holo_assets.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES holo_assets.categories(id),
    asset_type VARCHAR(50) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT,
    storage_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    creator_id UUID,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset versions
CREATE TABLE IF NOT EXISTS holo_assets.asset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES holo_assets.assets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_url TEXT NOT NULL,
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User asset ownership
CREATE TABLE IF NOT EXISTS holo_assets.user_assets (
    user_id UUID,
    asset_id UUID REFERENCES holo_assets.assets(id) ON DELETE CASCADE,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acquisition_type VARCHAR(50) DEFAULT 'purchase',
    PRIMARY KEY (user_id, asset_id)
);

-- Asset tags
CREATE TABLE IF NOT EXISTS holo_assets.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Asset-tag mapping
CREATE TABLE IF NOT EXISTS holo_assets.asset_tags (
    asset_id UUID REFERENCES holo_assets.assets(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES holo_assets.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_id, tag_id)
);

-- ============================================================================
-- SCHEMA 4: ai_brain_vector - AI Embeddings & Vector Search
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS ai_brain_vector;

-- AI Models registry
CREATE TABLE IF NOT EXISTS ai_brain_vector.models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    architecture VARCHAR(100),
    parameters_count BIGINT,
    storage_path TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS ai_brain_vector.embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    model_id UUID REFERENCES ai_brain_vector.models(id),
    embedding VECTOR(1536),
    text_content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON ai_brain_vector.embeddings USING ivfflat (embedding vector_cosine_ops);

-- Training datasets
CREATE TABLE IF NOT EXISTS ai_brain_vector.training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    labels JSONB,
    is_labeled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI predictions/decisions log
CREATE TABLE IF NOT EXISTS ai_brain_vector.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ai_brain_vector.models(id),
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    explanation TEXT,
    user_feedback INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA 5: fintech_ledger - Financial Transactions
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS fintech_ledger;

-- Accounts
CREATE TABLE IF NOT EXISTS fintech_ledger.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    balance DECIMAL(20,2) DEFAULT 0,
    frozen_amount DECIMAL(20,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS fintech_ledger.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fintech_ledger.accounts(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    description TEXT,
    reference_id VARCHAR(200),
    mayar_transaction_id VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Mayar payment records
CREATE TABLE IF NOT EXISTS fintech_ledger.mayar_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mayar_id VARCHAR(200) UNIQUE,
    account_id UUID REFERENCES fintech_ledger.accounts(id),
    amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    webhook_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS fintech_ledger.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    billing_cycle VARCHAR(20) NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS fintech_ledger.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES fintech_ledger.subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA 6: governance_audit - Compliance & Audit Trails
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS governance_audit;

-- Audit logs
CREATE TABLE IF NOT EXISTS governance_audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    actor_type VARCHAR(50) NOT NULL,
    actor_id UUID,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    compliance_tags VARCHAR(50)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('governance_audit.audit_logs', 'created_at', if_not_exists => TRUE);

-- Compliance rules
CREATE TABLE IF NOT EXISTS governance_audit.compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard VARCHAR(50) NOT NULL,
    control_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    automated_check BOOLEAN DEFAULT FALSE,
    check_query TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance assessments
CREATE TABLE IF NOT EXISTS governance_audit.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES governance_audit.compliance_rules(id),
    status VARCHAR(20) NOT NULL,
    findings JSONB,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessed_by UUID
);

-- Security incidents
CREATE TABLE IF NOT EXISTS governance_audit.security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity VARCHAR(20) NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    affected_resources JSONB,
    mitigation_actions JSONB,
    status VARCHAR(20) DEFAULT 'open',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SCHEMA 7: telemetry_stream - Real-time Monitoring Data
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS telemetry_stream;

-- Metrics time-series data
CREATE TABLE IF NOT EXISTS telemetry_stream.metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_value DECIMAL(20,6) NOT NULL,
    unit VARCHAR(50),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('telemetry_stream.metrics', 'recorded_at', if_not_exists => TRUE);

-- System events
CREATE TABLE IF NOT EXISTS telemetry_stream.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    message TEXT,
    context JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('telemetry_stream.events', 'recorded_at', if_not_exists => TRUE);

-- User sessions telemetry
CREATE TABLE IF NOT EXISTS telemetry_stream.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id VARCHAR(200),
    platform VARCHAR(50),
    device_type VARCHAR(50),
    entry_point VARCHAR(200),
    actions_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Performance benchmarks
CREATE TABLE IF NOT EXISTS telemetry_stream.performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation VARCHAR(200) NOT NULL,
    duration_ms INTEGER NOT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    context JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('telemetry_stream.performance', 'recorded_at', if_not_exists => TRUE);

-- ============================================================================
-- SCHEMA 8: blockchain_indexer - Decentralized Data Index
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS blockchain_indexer;

-- Indexed blocks
CREATE TABLE IF NOT EXISTS blockchain_indexer.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_number BIGINT UNIQUE NOT NULL,
    block_hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    gas_used BIGINT,
    gas_limit BIGINT,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexed transactions
CREATE TABLE IF NOT EXISTS blockchain_indexer.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT REFERENCES blockchain_indexer.blocks(block_number),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value DECIMAL(50,0),
    gas_price BIGINT,
    gas_used BIGINT,
    status VARCHAR(20),
    input_data TEXT,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart contract events
CREATE TABLE IF NOT EXISTS blockchain_indexer.contract_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    tx_hash VARCHAR(66) REFERENCES blockchain_indexer.transactions(tx_hash),
    block_number BIGINT,
    log_index INTEGER,
    event_data JSONB,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet balances cache
CREATE TABLE IF NOT EXISTS blockchain_indexer.wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL,
    token_address VARCHAR(42),
    balance DECIMAL(50,0) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, token_address)
);

-- NFT ownership
CREATE TABLE IF NOT EXISTS blockchain_indexer.nft_ownership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42) NOT NULL,
    token_id VARCHAR(100) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    metadata_uri TEXT,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_address, token_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sys_identity.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_identity.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_ledger.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_ledger.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_ledger.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holo_assets.user_assets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_isolation ON sys_identity.users
    FOR ALL TO PUBLIC
    USING (id = current_setting('app.current_user_id', TRUE)::UUID OR 
           current_setting('app.is_admin', TRUE)::BOOLEAN);

-- Account isolation
CREATE POLICY account_isolation ON fintech_ledger.accounts
    FOR ALL TO PUBLIC
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID OR 
           current_setting('app.is_admin', TRUE)::BOOLEAN);

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default roles
INSERT INTO sys_identity.roles (name, description, permissions) VALUES
    ('admin', 'System Administrator', '["*"]'),
    ('user', 'Standard User', '["read:assets", "read:profile", "write:profile"]'),
    ('developer', 'Application Developer', '["read:assets", "write:assets", "read:api"]'),
    ('enterprise', 'Enterprise Customer', '["read:assets", "write:assets", "read:analytics", "write:workflows"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default subscription plans
INSERT INTO fintech_ledger.subscription_plans (name, description, price, billing_cycle, features) VALUES
    ('Free', 'Basic access to AODS metaverse', 0, 'monthly', '["basic_3d", "limited_assets"]'),
    ('Pro', 'Professional metaverse tools', 99000, 'monthly', '["advanced_3d", "unlimited_assets", "ai_assistant", "vr_access"]'),
    ('Enterprise', 'Full enterprise orchestration', 499000, 'monthly', '["all_features", "dedicated_support", "custom_integrations", "sla_guarantee"]')
ON CONFLICT DO NOTHING;

-- Insert default configuration
INSERT INTO core_orchestration.config (key, value, description) VALUES
    ('system.name', '"AODS - Autonomous Orchestration of Digital Systems"', 'System display name'),
    ('system.version', '"1.0.0"', 'Current system version'),
    ('system.maintenance_mode', 'false', 'Maintenance mode flag'),
    ('ai.autoscaling.enabled', 'true', 'Enable AI auto-scaling'),
    ('telemetry.retention_days', '90', 'Telemetry data retention period'),
    ('mayar.sandbox_mode', 'true', 'Mayar API sandbox mode')
ON CONFLICT (key) DO NOTHING;

-- Insert compliance rules for ISO 27001 and COBIT
INSERT INTO governance_audit.compliance_rules (standard, control_id, title, description, automated_check, severity) VALUES
    ('ISO27001', 'A.9.1.1', 'Access Control Policy', 'User access should be restricted based on roles', TRUE, 'high'),
    ('ISO27001', 'A.9.4.1', 'Information Access Restriction', 'Sensitive data access logging required', TRUE, 'high'),
    ('COBIT', 'APO01.05', 'IT Governance Framework', 'IT processes aligned with business goals', FALSE, 'medium'),
    ('COBIT', 'DSS05.04', 'Data Security', 'End-to-end encryption for sensitive data', TRUE, 'high')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON sys_identity.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON core_orchestration.workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON holo_assets.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mayar_payments_updated_at BEFORE UPDATE ON fintech_ledger.mayar_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON fintech_ledger.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO governance_audit.audit_logs (
        action, actor_type, actor_id, resource_type, resource_id,
        old_values, new_values, compliance_tags
    ) VALUES (
        TG_OP,
        current_setting('app.actor_type', TRUE),
        current_setting('app.actor_id', TRUE)::UUID,
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
-- VIEWS FOR CONVENIENCE
-- ============================================================================

-- User dashboard view
CREATE OR REPLACE VIEW sys_identity.user_dashboard AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.created_at,
    COALESCE(a.balance, 0) as account_balance,
    COALESCE(s.plan_id, (SELECT id FROM fintech_ledger.subscription_plans WHERE name = 'Free')) as subscription_plan
FROM sys_identity.users u
LEFT JOIN fintech_ledger.accounts a ON a.user_id = u.id
LEFT JOIN fintech_ledger.subscriptions s ON s.user_id = u.id AND s.status = 'active';

-- System health view
CREATE OR REPLACE VIEW core_orchestration.system_health AS
SELECT 
    s.name as service_name,
    s.language,
    s.health_status,
    s.last_heartbeat,
    CASE 
        WHEN s.last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 'healthy'
        WHEN s.last_heartbeat > NOW() - INTERVAL '15 minutes' THEN 'degraded'
        ELSE 'critical'
    END as overall_status
FROM core_orchestration.services s;

-- ============================================================================
-- END OF INITIALIZATION SCRIPT
-- ============================================================================
-- Run this command in Neon.tech to verify installation:
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname LIKE '%aods%' OR schemaname IN ('sys_identity', 'core_orchestration', 'holo_assets', 'ai_brain_vector', 'fintech_ledger', 'governance_audit', 'telemetry_stream', 'blockchain_indexer');
-- ============================================================================
