CREATE TABLE IF NOT EXISTS sources (
 id TEXT PRIMARY KEY, publisher TEXT NOT NULL, source_url TEXT NOT NULL UNIQUE,
 source_type TEXT NOT NULL CHECK(source_type IN ('rss','json_api','open_data_json')),
 terms_url TEXT NOT NULL, permission_evidence TEXT NOT NULL,
 permission_status TEXT NOT NULL CHECK(permission_status IN ('pending','approved','revoked')),
 allow_fetch INTEGER NOT NULL DEFAULT 0, allow_republish INTEGER NOT NULL DEFAULT 0,
 allow_translate INTEGER NOT NULL DEFAULT 0, attribution TEXT NOT NULL,
 min_interval_minutes INTEGER NOT NULL DEFAULT 1440, last_checked_at TEXT,
 review_due_at TEXT, enabled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS source_snapshots (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id),
 content_hash TEXT NOT NULL, payload_json TEXT NOT NULL, fetched_at TEXT NOT NULL,
 UNIQUE(source_id,content_hash)
);
CREATE TABLE IF NOT EXISTS update_items (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id),
 category TEXT NOT NULL, region TEXT NOT NULL, title TEXT NOT NULL,
 summary TEXT NOT NULL, official_url TEXT NOT NULL, published_at TEXT NOT NULL,
 source_checked_at TEXT NOT NULL, verification_status TEXT NOT NULL,
 previous_version_id TEXT, is_published INTEGER NOT NULL DEFAULT 0,
 withheld_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_update_items_public ON update_items(is_published,category,region,published_at);
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON sources(enabled,permission_status);
