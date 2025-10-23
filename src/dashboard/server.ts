/**
 * Analytics Dashboard Server
 * Express API server for MKAssistant analytics dashboard
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import analytics from '../analytics';
import db from '../database';
import logger from '../utils/logger';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /api/stats/daily
 * Get daily statistics for a specific date
 */
app.get('/api/stats/daily', (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const stats = analytics.getDailyStats(date);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error in /api/stats/daily:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily stats' });
  }
});

/**
 * GET /api/stats/range
 * Get statistics for a date range
 */
app.get('/api/stats/range', (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const stats = analytics.getRangeStats(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error in /api/stats/range:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch range stats' });
  }
});

/**
 * GET /api/report
 * Generate comprehensive performance report
 */
app.get('/api/report', (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const report = analytics.generateReport(days);
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Error in /api/report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

/**
 * GET /api/category-performance
 * Get content performance by category
 */
app.get('/api/category-performance', (req: Request, res: Response) => {
  try {
    const categories = analytics.getCategoryPerformance();
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Error in /api/category-performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category performance' });
  }
});

/**
 * GET /api/export
 * Export analytics data
 */
app.get('/api/export', (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const days = parseInt(req.query.days as string) || 30;

    const data = analytics.exportAnalytics(format, days);

    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename=analytics_${Date.now()}.csv`);
    } else {
      res.header('Content-Type', 'application/json');
      res.header('Content-Disposition', `attachment; filename=analytics_${Date.now()}.json`);
    }

    res.send(data);
  } catch (error) {
    logger.error('Error in /api/export:', error);
    res.status(500).json({ success: false, error: 'Failed to export analytics' });
  }
});

/**
 * GET /api/posts/recent
 * Get recent posts with engagement
 */
app.get('/api/posts/recent', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const posts = db.prepare(`
      SELECT
        id,
        platform,
        SUBSTR(content, 1, 150) as content,
        status,
        post_type as postType,
        engagement_likes as likes,
        engagement_comments as comments,
        engagement_shares as shares,
        engagement_views as views,
        published_time as publishedTime,
        (engagement_likes + engagement_comments + engagement_shares) as totalEngagement
      FROM posts
      WHERE status = 'published'
      ORDER BY published_time DESC
      LIMIT ?
    `).all(limit);

    res.json({ success: true, data: posts });
  } catch (error) {
    logger.error('Error in /api/posts/recent:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent posts' });
  }
});

/**
 * GET /api/overview
 * Get dashboard overview with key metrics
 */
app.get('/api/overview', (req: Request, res: Response) => {
  try {
    // Get 7-day and 30-day reports
    const report7d = analytics.generateReport(7);
    const report30d = analytics.generateReport(30);

    // Get total scheduled posts
    const scheduledCount = db.prepare(`
      SELECT COUNT(*) as count FROM posts WHERE status = 'scheduled'
    `).get() as any;

    // Get posts published today
    const todayPosts = db.prepare(`
      SELECT COUNT(*) as count FROM posts
      WHERE status = 'published'
      AND DATE(published_time) = DATE('now')
    `).get() as any;

    // Get platform count
    const platformCount = db.prepare(`
      SELECT COUNT(DISTINCT platform) as count FROM posts WHERE status != 'deleted'
    `).get() as any;

    const overview = {
      last7Days: report7d,
      last30Days: report30d,
      scheduledPosts: scheduledCount.count,
      todayPosts: todayPosts.count,
      activePlatforms: platformCount.count,
    };

    res.json({ success: true, data: overview });
  } catch (error) {
    logger.error('Error in /api/overview:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/engagement/timeline
 * Get engagement timeline data for charts
 */
app.get('/api/engagement/timeline', (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const timeline = db.prepare(`
      SELECT
        date,
        SUM(total_likes) as likes,
        SUM(total_comments) as comments,
        SUM(total_shares) as shares,
        SUM(total_views) as views,
        SUM(total_posts) as posts
      FROM analytics
      WHERE date >= DATE('now', '-' || ? || ' days')
      GROUP BY date
      ORDER BY date ASC
    `).all(days);

    res.json({ success: true, data: timeline });
  } catch (error) {
    logger.error('Error in /api/engagement/timeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch engagement timeline' });
  }
});

/**
 * GET /api/platforms/comparison
 * Get platform comparison data
 */
app.get('/api/platforms/comparison', (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    const platforms = db.prepare(`
      SELECT
        platform,
        SUM(total_posts) as posts,
        SUM(total_likes) as likes,
        SUM(total_comments) as comments,
        SUM(total_shares) as shares,
        SUM(total_views) as views,
        CAST((SUM(total_likes) + SUM(total_comments) + SUM(total_shares)) AS FLOAT) / NULLIF(SUM(total_posts), 0) as avgEngagement
      FROM analytics
      WHERE date >= DATE('now', '-' || ? || ' days')
      GROUP BY platform
      ORDER BY avgEngagement DESC
    `).all(days);

    res.json({ success: true, data: platforms });
  } catch (error) {
    logger.error('Error in /api/platforms/comparison:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platform comparison' });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Serve dashboard HTML
 */
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Start server
 */
export function startDashboardServer(): void {
  app.listen(PORT, () => {
    logger.info(`📊 Analytics Dashboard Server running on http://localhost:${PORT}`);
    logger.info(`   API: http://localhost:${PORT}/api`);
    logger.info(`   Dashboard: http://localhost:${PORT}`);
  });
}

export default app;

// Start server when file is run directly
if (require.main === module) {
  startDashboardServer();
}
