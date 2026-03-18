-- djbrain schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'dj',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    duration_ms INTEGER,
    file_size_bytes BIGINT,
    file_hash TEXT,
    server_path TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dj_metadata (
    track_id UUID PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
    notes TEXT DEFAULT '',
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT '#444444',
    is_permanent BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS track_tags (
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, tag_id)
);

-- Trigger to auto-update last_modified on dj_metadata
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_dj_metadata_last_modified ON dj_metadata;

CREATE TRIGGER trigger_update_dj_metadata_last_modified
BEFORE UPDATE ON dj_metadata
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;
