import * as cron from 'node-cron';
import { addHours, addMinutes, format, startOfDay } from 'date-fns';
import config from '../config';
import logger from '../utils/logger';
import db, { queries } from '../database';
import contentGenerator from '../content/generator';
import platformManager from '../platforms';
import { BasePlatform } from '../platforms/base';

export class PostScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor() {
    logger.info('Post Scheduler initialized');
  }

  /**
   * Start the scheduler
   */
  public start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    // Schedule daily post generation (runs at 00:01 AM)
    const dailyJob = cron.schedule('1 0 * * *', () => {
      this.generateDailySchedule();
    });
    this.jobs.set('daily_generation', dailyJob);

    // Schedule post publisher (runs every 5 minutes to check for pending posts)
    const publishJob = cron.schedule('*/5 * * * *', () => {
      this.publishScheduledPosts();
    });
    this.jobs.set('post_publisher', publishJob);

    // Schedule engagement tracker (runs every hour)
    const engagementJob = cron.schedule('0 * * * *', () => {
      this.updateEngagementMetrics();
    });
    this.jobs.set('engagement_tracker', engagementJob);

    // Schedule daily analytics aggregation (runs at 23:55 PM)
    const analyticsJob = cron.schedule('55 23 * * *', () => {
      this.aggregateDailyAnalytics();
    });
    this.jobs.set('daily_analytics', analyticsJob);

    // Generate initial schedule if none exists
    this.ensureScheduleExists();

    this.isRunning = true;
    logger.info('Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  public stop() {
    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    }
    this.jobs.clear();
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Ensure there's a schedule for today, if not generate one
   */
  private async ensureScheduleExists() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayPosts = db.prepare(`
        SELECT COUNT(*) as count FROM posts
        WHERE DATE(scheduled_time) = ?
      `).get(today) as any;

      if (todayPosts.count === 0) {
        logger.info('No posts scheduled for today, generating schedule...');
        await this.generateDailySchedule();
      }
    } catch (error) {
      logger.error('Error ensuring schedule exists:', error);
    }
  }

  /**
   * Generate the posting schedule for the day
   */
  public async generateDailySchedule() {
    try {
      logger.info('Generating daily posting schedule...');

      // Get authenticated platforms
      const platforms = platformManager.getAuthenticatedPlatforms();
      if (platforms.length === 0) {
        logger.warn('No authenticated platforms available for posting');
        return;
      }

      // Determine number of posts for the day (between min and max)
      const min = config.scheduling.postsPerDayMin;
      const max = config.scheduling.postsPerDayMax;
      const totalPostsToday = Math.floor(Math.random() * (max - min + 1)) + min;

      logger.info(`Planning ${totalPostsToday} posts for today across ${platforms.length} platforms`);

      // Get content category mix for the day
      const categoryMix = contentGenerator.getDailyContentMix(totalPostsToday);

      // Distribute posts across platforms
      const postsPerPlatform = this.distributePosts(platforms, totalPostsToday);

      // Generate and schedule posts
      let postCount = 0;
      const today = startOfDay(new Date());

      for (const platform of platforms) {
        const platformName = platform.getPlatformName();
        const numPosts = postsPerPlatform.get(platformName) || 0;

        for (let i = 0; i < numPosts && postCount < totalPostsToday; i++) {
          // Generate post content
          const category = categoryMix[postCount];
          const generatedPost = contentGenerator.generatePost(platformName, category);

          if (!generatedPost) {
            logger.warn(`Failed to generate post for ${platformName}`);
            continue;
          }

          // Calculate optimal time for this post
          const postTime = this.calculatePostTime(platformName, i, numPosts, today);

          // Insert into database
          queries.insertPost.run(
            generatedPost.content,
            platformName,
            generatedPost.category,
            format(postTime, 'yyyy-MM-dd HH:mm:ss'),
            'pending'
          );

          postCount++;
          logger.info(`Scheduled ${platformName} post (${generatedPost.category}) for ${format(postTime, 'HH:mm')}`);
        }
      }

      logger.info(`Daily schedule generated: ${postCount} posts scheduled`);

    } catch (error) {
      logger.error('Error generating daily schedule:', error);
    }
  }

  /**
   * Distribute posts intelligently across platforms
   */
  private distributePosts(platforms: BasePlatform[], totalPosts: number): Map<string, number> {
    const distribution = new Map<string, number>();

    // Priority platforms get more posts
    const platformPriority: Record<string, number> = {
      'twitter': 0.30,    // 30% of posts
      'linkedin': 0.25,   // 25% of posts
      'facebook': 0.20,   // 20% of posts
      'reddit': 0.15,     // 15% of posts
      'instagram': 0.10,  // 10% of posts
    };

    let remaining = totalPosts;

    for (const platform of platforms) {
      const name = platform.getPlatformName();
      const priority = platformPriority[name] || 0.1;
      const count = Math.max(1, Math.floor(totalPosts * priority));

      distribution.set(name, Math.min(count, remaining));
      remaining -= count;

      if (remaining <= 0) break;
    }

    // Distribute any remaining posts
    if (remaining > 0) {
      const firstPlatform = platforms[0].getPlatformName();
      distribution.set(firstPlatform, (distribution.get(firstPlatform) || 0) + remaining);
    }

    return distribution;
  }

  /**
   * Calculate optimal posting time based on platform best practices
   */
  private calculatePostTime(
    platform: string,
    postIndex: number,
    totalPostsForPlatform: number,
    baseDate: Date
  ): Date {
    // Get optimal times for this platform
    const optimalTime = contentGenerator.getOptimalPostTime(platform, postIndex);
    const [hours, minutes] = optimalTime.split(':').map(Number);

    // Add some randomization (+/- 30 minutes) to avoid exact timing patterns
    const randomOffset = Math.floor(Math.random() * 60) - 30;

    let postTime = addHours(baseDate, hours);
    postTime = addMinutes(postTime, minutes + randomOffset);

    return postTime;
  }

  /**
   * Publish posts that are scheduled for now or past
   */
  public async publishScheduledPosts() {
    try {
      const pendingPosts = queries.getScheduledPosts.all();

      if (pendingPosts.length === 0) {
        return; // No posts to publish
      }

      logger.info(`Found ${pendingPosts.length} posts ready to publish`);

      for (const post of pendingPosts as any[]) {
        await this.publishPost(post);
      }

    } catch (error) {
      logger.error('Error publishing scheduled posts:', error);
    }
  }

  /**
   * Publish a single post
   */
  private async publishPost(post: any) {
    try {
      const platform = platformManager.getPlatform(post.platform);

      if (!platform) {
        logger.error(`Platform not found: ${post.platform}`);
        queries.updatePostStatus.run('failed', null, null, 'Platform not available', post.id);
        return;
      }

      if (!platform.isAuth()) {
        logger.error(`Platform not authenticated: ${post.platform}`);
        queries.updatePostStatus.run('failed', null, null, 'Platform not authenticated', post.id);
        return;
      }

      logger.info(`Publishing post ${post.id} to ${post.platform}...`);

      // Attempt to post
      const result = await platform.post(post.content);

      if (result.success) {
        queries.updatePostStatus.run(
          'published',
          format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          result.postId,
          null,
          post.id
        );

        logger.info(`Successfully published post ${post.id} to ${post.platform} (${result.postId})`);
      } else {
        queries.updatePostStatus.run(
          'failed',
          null,
          null,
          result.error || 'Unknown error',
          post.id
        );

        logger.error(`Failed to publish post ${post.id} to ${post.platform}: ${result.error}`);
      }

    } catch (error: any) {
      logger.error(`Error publishing post ${post.id}:`, error);
      queries.updatePostStatus.run(
        'failed',
        null,
        null,
        error.message || 'Unknown error',
        post.id
      );
    }
  }

  /**
   * Update engagement metrics for published posts
   */
  public async updateEngagementMetrics() {
    try {
      // Get published posts from the last 7 days
      const recentPosts = db.prepare(`
        SELECT * FROM posts
        WHERE status = 'published'
        AND published_time > datetime('now', '-7 days')
        AND platform_post_id IS NOT NULL
      `).all();

      logger.info(`Updating engagement metrics for ${recentPosts.length} posts`);

      for (const post of recentPosts as any[]) {
        const platform = platformManager.getPlatform(post.platform);

        if (!platform || !platform.isAuth()) {
          continue;
        }

        try {
          const metrics = await platform.getEngagement(post.platform_post_id);

          if (metrics) {
            queries.updatePostEngagement.run(
              metrics.likes,
              metrics.comments,
              metrics.shares,
              metrics.views,
              post.id
            );

            logger.debug(`Updated engagement for post ${post.id}: ${metrics.likes} likes, ${metrics.comments} comments`);
          }
        } catch (error) {
          logger.debug(`Could not fetch engagement for post ${post.id}`);
        }
      }

    } catch (error) {
      logger.error('Error updating engagement metrics:', error);
    }
  }

  /**
   * Aggregate daily analytics
   */
  private async aggregateDailyAnalytics() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get today's stats per platform
      const platforms = ['twitter', 'linkedin', 'facebook', 'reddit', 'instagram'];

      for (const platform of platforms) {
        const stats = db.prepare(`
          SELECT
            COUNT(*) as total_posts,
            SUM(engagement_likes) as total_likes,
            SUM(engagement_comments) as total_comments,
            SUM(engagement_shares) as total_shares,
            SUM(engagement_views) as total_views
          FROM posts
          WHERE platform = ?
          AND DATE(published_time) = ?
          AND status = 'published'
        `).get(platform, today) as any;

        if (stats.total_posts > 0) {
          queries.insertOrUpdateAnalytics.run(
            today,
            platform,
            stats.total_posts,
            stats.total_likes || 0,
            stats.total_comments || 0,
            stats.total_shares || 0,
            stats.total_views || 0
          );

          logger.info(`Aggregated analytics for ${platform}: ${stats.total_posts} posts, ${stats.total_likes} likes`);
        }
      }

    } catch (error) {
      logger.error('Error aggregating daily analytics:', error);
    }
  }

  /**
   * Manually trigger post generation (useful for testing)
   */
  public async generateScheduleNow() {
    await this.generateDailySchedule();
  }

  /**
   * Manually trigger post publishing (useful for testing)
   */
  public async publishNow() {
    await this.publishScheduledPosts();
  }
}

// Export singleton instance
export default new PostScheduler();
