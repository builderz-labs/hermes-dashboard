import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.HERMES_DB_PATH || path.join(process.cwd(), 'hermes.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('busy_timeout = 5000');
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_posts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      format TEXT NOT NULL,
      pillar INTEGER,
      text_preview TEXT,
      full_content TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_for DATETIME,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      impressions INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      reposts INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      title TEXT,
      company TEXT,
      company_size TEXT,
      industry_segment TEXT,
      source TEXT,
      email TEXT,
      linkedin_url TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      score INTEGER,
      tier TEXT,
      last_touch_at DATETIME,
      next_action_at DATETIME,
      sequence_name TEXT,
      reply_type TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sequences (
      id TEXT PRIMARY KEY,
      lead_id TEXT REFERENCES leads(id),
      sequence_name TEXT,
      step INTEGER,
      subject TEXT,
      body TEXT,
      status TEXT,
      tier TEXT,
      scheduled_for DATETIME,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppression (
      email TEXT PRIMARY KEY,
      type TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS engagements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT,
      action_type TEXT,
      target_url TEXT,
      target_username TEXT,
      our_text TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      type TEXT,
      username TEXT,
      tweet_url TEXT,
      summary TEXT,
      relevance TEXT,
      action_taken TEXT,
      likes INTEGER,
      impressions INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week INTEGER,
      hypothesis TEXT,
      action TEXT,
      metric TEXT,
      win_threshold TEXT,
      status TEXT,
      results TEXT,
      winner TEXT,
      margin TEXT,
      decision TEXT,
      learning TEXT,
      next_action TEXT,
      proposed_at DATETIME,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS learnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      learning TEXT,
      validated_week INTEGER,
      confidence TEXT,
      applied_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_metrics (
      date TEXT PRIMARY KEY,
      x_posts INTEGER DEFAULT 0,
      x_threads INTEGER DEFAULT 0,
      linkedin_drafts INTEGER DEFAULT 0,
      x_replies INTEGER DEFAULT 0,
      x_quote_tweets INTEGER DEFAULT 0,
      x_follows INTEGER DEFAULT 0,
      linkedin_comments INTEGER DEFAULT 0,
      discoveries INTEGER DEFAULT 0,
      enrichments INTEGER DEFAULT 0,
      sends INTEGER DEFAULT 0,
      replies_triaged INTEGER DEFAULT 0,
      opt_outs INTEGER DEFAULT 0,
      bounces INTEGER DEFAULT 0,
      total_impressions INTEGER DEFAULT 0,
      total_engagement INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts DATETIME,
      action TEXT,
      detail TEXT,
      result TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_content_status ON content_posts(status);
    CREATE INDEX IF NOT EXISTS idx_content_platform ON content_posts(platform);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier);
    CREATE INDEX IF NOT EXISTS idx_sequences_status ON sequences(status);
    CREATE INDEX IF NOT EXISTS idx_sequences_lead ON sequences(lead_id);
    CREATE INDEX IF NOT EXISTS idx_engagements_platform ON engagements(platform);
    CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);
    CREATE INDEX IF NOT EXISTS idx_signals_date ON signals(date);
    CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
    CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
    CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(ts);

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      title TEXT,
      message TEXT NOT NULL,
      data TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

    CREATE TABLE IF NOT EXISTS seed_registry (
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      PRIMARY KEY (table_name, record_id)
    );
  `);
}
