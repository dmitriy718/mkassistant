import express from 'express';
import config from './config';
import logger from './utils/logger';
import { initDatabase } from './database';
import platformManager from './platforms';
import scheduler from './scheduler';
import analyticsManager from './analytics';
import contentGenerator from './content/generator';

class MarketingAssistant {
  private app: express.Application;
  private isInitialized: boolean = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Basic logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    // Get platform status
    this.app.get('/api/platforms/status', (req, res) => {
      const platforms = platformManager.getAllPlatformNames();
      const status = platforms.map(name => ({
        platform: name,
        configured: platformManager.getPlatform(name)?.isConfigured() || false,
        authenticated: platformManager.isPlatformReady(name),
      }));

      res.json({ platforms: status });
    });

    // Trigger manual authentication
    this.app.post('/api/platforms/authenticate', async (req, res) => {
      try {
        const results = await platformManager.authenticateAll();
        const status = Array.from(results.entries()).map(([platform, success]) => ({
          platform,
          success,
        }));

        res.json({ results: status });
      } catch (error: any) {
        logger.error('Error during authentication:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get analytics report
    this.app.get('/api/analytics/report', (req, res) => {
      const days = parseInt(req.query.days as string) || 7;
      const report = analyticsManager.generateReport(days);
      res.json(report);
    });

    // Get content statistics
    this.app.get('/api/content/stats', (req, res) => {
      const stats = contentGenerator.getContentStats();
      res.json(stats);
    });

    // Get category performance
    this.app.get('/api/analytics/categories', (req, res) => {
      const performance = analyticsManager.getCategoryPerformance();
      res.json({ categories: performance });
    });

    // Export analytics data
    this.app.get('/api/analytics/export', (req, res) => {
      const format = (req.query.format as 'json' | 'csv') || 'json';
      const days = parseInt(req.query.days as string) || 30;

      const data = analyticsManager.exportAnalytics(format, days);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(data);
    });

    // Manually trigger schedule generation
    this.app.post('/api/scheduler/generate', async (req, res) => {
      try {
        await scheduler.generateScheduleNow();
        res.json({ success: true, message: 'Schedule generated successfully' });
      } catch (error: any) {
        logger.error('Error generating schedule:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Manually trigger post publishing
    this.app.post('/api/scheduler/publish', async (req, res) => {
      try {
        await scheduler.publishNow();
        res.json({ success: true, message: 'Posts published successfully' });
      } catch (error: any) {
        logger.error('Error publishing posts:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Dashboard
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Marketing Assistant - Tradeflows Pro</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .card {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              background: #667eea;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin-right: 10px;
              text-decoration: none;
              display: inline-block;
            }
            .button:hover {
              background: #764ba2;
            }
            .endpoint {
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              margin: 10px 0;
              font-family: monospace;
            }
            .status-indicator {
              display: inline-block;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              margin-right: 8px;
            }
            .status-ok { background: #10b981; }
            .status-error { background: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 Marketing Assistant</h1>
            <p>Automated Marketing System for Tradeflows Pro</p>
          </div>

          <div class="card">
            <h2>System Status</h2>
            <p><span class="status-indicator status-ok"></span>System Running</p>
            <p><span class="status-indicator status-ok"></span>Scheduler Active</p>
            <p><span class="status-indicator status-ok"></span>Database Connected</p>
          </div>

          <div class="card">
            <h2>Quick Actions</h2>
            <button class="button" onclick="fetch('/api/platforms/authenticate', {method: 'POST'}).then(r => r.json()).then(d => alert(JSON.stringify(d)))">
              Authenticate Platforms
            </button>
            <button class="button" onclick="fetch('/api/scheduler/generate', {method: 'POST'}).then(r => r.json()).then(d => alert('Schedule generated!'))">
              Generate Schedule
            </button>
            <button class="button" onclick="fetch('/api/scheduler/publish', {method: 'POST'}).then(r => r.json()).then(d => alert('Posts published!'))">
              Publish Now
            </button>
            <a href="/api/analytics/report" class="button">View Report</a>
          </div>

          <div class="card">
            <h2>API Endpoints</h2>
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">GET /api/platforms/status - Platform status</div>
            <div class="endpoint">POST /api/platforms/authenticate - Authenticate all platforms</div>
            <div class="endpoint">GET /api/analytics/report?days=7 - Analytics report</div>
            <div class="endpoint">GET /api/analytics/categories - Category performance</div>
            <div class="endpoint">GET /api/analytics/export?format=json&days=30 - Export data</div>
            <div class="endpoint">GET /api/content/stats - Content statistics</div>
            <div class="endpoint">POST /api/scheduler/generate - Generate schedule</div>
            <div class="endpoint">POST /api/scheduler/publish - Publish posts now</div>
          </div>

          <div class="card">
            <h2>About</h2>
            <p><strong>Marketing Assistant</strong> automates social media marketing for Tradeflows Pro across multiple platforms.</p>
            <p><strong>Features:</strong></p>
            <ul>
              <li>Automated posting to Twitter, LinkedIn, Facebook, Instagram, and Reddit</li>
              <li>Intelligent content generation with 30+ templates</li>
              <li>Smart scheduling (3-6 posts daily)</li>
              <li>Real-time engagement tracking</li>
              <li>Comprehensive analytics and reporting</li>
            </ul>
          </div>
        </body>
        </html>
      `);
    });
  }

  /**
   * Initialize the application
   */
  public async initialize() {
    if (this.isInitialized) {
      logger.warn('Application already initialized');
      return;
    }

    logger.info('='.repeat(60));
    logger.info('MARKETING ASSISTANT - TRADEFLOWS PRO');
    logger.info('='.repeat(60));

    try {
      // Initialize database
      logger.info('Initializing database...');
      initDatabase();

      // Authenticate with all platforms
      logger.info('Authenticating with social media platforms...');
      const authResults = await platformManager.authenticateAll();

      let successCount = 0;
      for (const [platform, success] of authResults) {
        if (success) {
          logger.info(`✓ ${platform} authenticated successfully`);
          successCount++;
        } else {
          logger.warn(`✗ ${platform} authentication failed (check credentials)`);
        }
      }

      logger.info(`Authenticated with ${successCount}/${authResults.size} platforms`);

      if (successCount === 0) {
        logger.warn('⚠️  No platforms authenticated! Please configure credentials in .env file');
        logger.warn('The system will run in demo mode without posting to social media');
      }

      // Start the scheduler
      logger.info('Starting post scheduler...');
      scheduler.start();

      this.isInitialized = true;
      logger.info('✓ Application initialized successfully');
      logger.info('='.repeat(60));

    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Start the web server
   */
  public start() {
    const port = config.server.port;

    this.app.listen(port, () => {
      logger.info(`=`.repeat(60));
      logger.info(`🚀 Marketing Assistant is running!`);
      logger.info(`📊 Dashboard: http://localhost:${port}`);
      logger.info(`📡 API: http://localhost:${port}/api`);
      logger.info(`=`.repeat(60));
    });
  }

  /**
   * Graceful shutdown
   */
  public async shutdown() {
    logger.info('Shutting down gracefully...');

    // Stop the scheduler
    scheduler.stop();

    logger.info('✓ Shutdown complete');
    process.exit(0);
  }
}

// Create and start the application
const app = new MarketingAssistant();

// Handle shutdown signals
process.on('SIGINT', () => app.shutdown());
process.on('SIGTERM', () => app.shutdown());

// Initialize and start
(async () => {
  try {
    await app.initialize();
    app.start();
  } catch (error) {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
  }
})();

export default app;
