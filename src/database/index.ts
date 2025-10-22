import Database, { Database as DatabaseType, Statement } from 'better-sqlite3';
import config from '../config';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.dirname(config.database.path);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: DatabaseType = new Database(config.database.path, {
  verbose: config.server.nodeEnv === 'development' ? logger.debug.bind(logger) : undefined,
});

// Initialize database schema
export function initDatabase() {
  logger.info('Initializing database...');

  // Posts table - stores all scheduled and published posts
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      platform TEXT NOT NULL,
      post_type TEXT NOT NULL,
      scheduled_time DATETIME NOT NULL,
      published_time DATETIME,
      status TEXT DEFAULT 'pending',
      platform_post_id TEXT,
      engagement_likes INTEGER DEFAULT 0,
      engagement_comments INTEGER DEFAULT 0,
      engagement_shares INTEGER DEFAULT 0,
      engagement_views INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Content templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      template TEXT NOT NULL,
      platform TEXT,
      variables TEXT,
      usage_count INTEGER DEFAULT 0,
      performance_score REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analytics table - aggregated daily stats
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      platform TEXT NOT NULL,
      total_posts INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      total_comments INTEGER DEFAULT 0,
      total_shares INTEGER DEFAULT 0,
      total_views INTEGER DEFAULT 0,
      total_clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, platform)
    )
  `);

  // Email campaigns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      recipient_list TEXT NOT NULL,
      scheduled_time DATETIME NOT NULL,
      sent_time DATETIME,
      status TEXT DEFAULT 'pending',
      total_sent INTEGER DEFAULT 0,
      total_opened INTEGER DEFAULT 0,
      total_clicked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Leads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      source TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      interest_level TEXT,
      last_interaction DATETIME,
      converted BOOLEAN DEFAULT 0,
      conversion_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // SEO content table
  db.exec(`
    CREATE TABLE IF NOT EXISTS seo_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      meta_description TEXT,
      keywords TEXT,
      status TEXT DEFAULT 'draft',
      published_date DATETIME,
      page_views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Platform credentials status
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      is_enabled BOOLEAN DEFAULT 1,
      is_authenticated BOOLEAN DEFAULT 0,
      last_success DATETIME,
      last_error DATETIME,
      error_message TEXT,
      daily_post_count INTEGER DEFAULT 0,
      daily_post_limit INTEGER DEFAULT 20,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled_time ON posts(scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `);

  logger.info('Database initialized successfully');
}

// Helper functions for common operations
export const queries: Record<string, Statement<any[]>> = {
  // Posts
  insertPost: db.prepare(`
    INSERT INTO posts (content, platform, post_type, scheduled_time, status)
    VALUES (?, ?, ?, ?, ?)
  `),

  getScheduledPosts: db.prepare(`
    SELECT * FROM posts
    WHERE status = 'pending' AND scheduled_time <= datetime('now')
    ORDER BY scheduled_time ASC
  `),

  updatePostStatus: db.prepare(`
    UPDATE posts
    SET status = ?, published_time = ?, platform_post_id = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updatePostEngagement: db.prepare(`
    UPDATE posts
    SET engagement_likes = ?, engagement_comments = ?, engagement_shares = ?, engagement_views = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  // Analytics
  insertOrUpdateAnalytics: db.prepare(`
    INSERT INTO analytics (date, platform, total_posts, total_likes, total_comments, total_shares, total_views)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date, platform) DO UPDATE SET
      total_posts = total_posts + excluded.total_posts,
      total_likes = total_likes + excluded.total_likes,
      total_comments = total_comments + excluded.total_comments,
      total_shares = total_shares + excluded.total_shares,
      total_views = total_views + excluded.total_views
  `),

  getAnalyticsByDateRange: db.prepare(`
    SELECT * FROM analytics
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `),

  // Platform Status
  updatePlatformStatus: db.prepare(`
    INSERT INTO platform_status (platform, is_enabled, is_authenticated, last_success, last_error, error_message)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(platform) DO UPDATE SET
      is_enabled = excluded.is_enabled,
      is_authenticated = excluded.is_authenticated,
      last_success = excluded.last_success,
      last_error = excluded.last_error,
      error_message = excluded.error_message,
      updated_at = CURRENT_TIMESTAMP
  `),

  incrementDailyPostCount: db.prepare(`
    UPDATE platform_status
    SET daily_post_count = daily_post_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE platform = ?
  `),

  resetDailyPostCounts: db.prepare(`
    UPDATE platform_status
    SET daily_post_count = 0
  `),

  getPlatformStatus: db.prepare(`
    SELECT * FROM platform_status WHERE platform = ?
  `),

  // Leads
  insertLead: db.prepare(`
    INSERT INTO leads (email, name, source, interest_level, last_interaction)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      last_interaction = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `),

  getLeadsByStatus: db.prepare(`
    SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC
  `),
};

export default db;
