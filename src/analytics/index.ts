import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import db from '../database';
import logger from '../utils/logger';

export interface DailyStats {
  date: string;
  platform: string;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  engagementRate: number;
}

export interface PerformanceReport {
  period: string;
  platforms: PlatformPerformance[];
  topPosts: TopPost[];
  overallStats: OverallStats;
  recommendations: string[];
}

export interface PlatformPerformance {
  platform: string;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  avgEngagement: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TopPost {
  id: number;
  platform: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  publishedTime: string;
  engagementScore: number;
}

export interface OverallStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  avgEngagementPerPost: number;
  successRate: number;
}

export class AnalyticsManager {
  /**
   * Get daily statistics
   */
  public getDailyStats(date: string = format(new Date(), 'yyyy-MM-dd')): DailyStats[] {
    try {
      const stats = db.prepare(`
        SELECT
          date,
          platform,
          total_posts as totalPosts,
          total_likes as totalLikes,
          total_comments as totalComments,
          total_shares as totalShares,
          total_views as totalViews,
          CAST((total_likes + total_comments + total_shares) AS FLOAT) / total_posts as engagementRate
        FROM analytics
        WHERE date = ?
        ORDER BY platform
      `).all(date) as DailyStats[];

      return stats;

    } catch (error) {
      logger.error('Error getting daily stats:', error);
      return [];
    }
  }

  /**
   * Get stats for a date range
   */
  public getRangeStats(startDate: string, endDate: string): DailyStats[] {
    try {
      const stats = db.prepare(`
        SELECT
          date,
          platform,
          total_posts as totalPosts,
          total_likes as totalLikes,
          total_comments as totalComments,
          total_shares as totalShares,
          total_views as totalViews,
          CAST((total_likes + total_comments + total_shares) AS FLOAT) / total_posts as engagementRate
        FROM analytics
        WHERE date BETWEEN ? AND ?
        ORDER BY date DESC, platform
      `).all(startDate, endDate) as DailyStats[];

      return stats;

    } catch (error) {
      logger.error('Error getting range stats:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive performance report
   */
  public generateReport(days: number = 7): PerformanceReport {
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      // Get platform performance
      const platformStats = db.prepare(`
        SELECT
          platform,
          SUM(total_posts) as posts,
          SUM(total_likes) as likes,
          SUM(total_comments) as comments,
          SUM(total_shares) as shares,
          SUM(total_views) as views,
          CAST((SUM(total_likes) + SUM(total_comments) + SUM(total_shares)) AS FLOAT) / SUM(total_posts) as avgEngagement
        FROM analytics
        WHERE date BETWEEN ? AND ?
        GROUP BY platform
        ORDER BY avgEngagement DESC
      `).all(startDate, endDate) as any[];

      const platforms: PlatformPerformance[] = platformStats.map(stat => ({
        platform: stat.platform,
        posts: stat.posts,
        likes: stat.likes,
        comments: stat.comments,
        shares: stat.shares,
        views: stat.views,
        avgEngagement: stat.avgEngagement || 0,
        trend: this.calculateTrend(stat.platform, days),
      }));

      // Get top performing posts
      const topPosts = db.prepare(`
        SELECT
          id,
          platform,
          SUBSTR(content, 1, 100) as content,
          engagement_likes as likes,
          engagement_comments as comments,
          engagement_shares as shares,
          published_time as publishedTime,
          (engagement_likes + engagement_comments * 2 + engagement_shares * 3) as engagementScore
        FROM posts
        WHERE status = 'published'
        AND published_time BETWEEN ? AND ?
        ORDER BY engagementScore DESC
        LIMIT 10
      `).all(startDate + ' 00:00:00', endDate + ' 23:59:59') as TopPost[];

      // Get overall stats
      const overall = db.prepare(`
        SELECT
          SUM(total_posts) as totalPosts,
          SUM(total_likes) as totalLikes,
          SUM(total_comments) as totalComments,
          SUM(total_shares) as totalShares,
          SUM(total_views) as totalViews
        FROM analytics
        WHERE date BETWEEN ? AND ?
      `).get(startDate, endDate) as any;

      const successCount = db.prepare(`
        SELECT COUNT(*) as count FROM posts
        WHERE status = 'published'
        AND published_time BETWEEN ? AND ?
      `).get(startDate + ' 00:00:00', endDate + ' 23:59:59') as any;

      const failedCount = db.prepare(`
        SELECT COUNT(*) as count FROM posts
        WHERE status = 'failed'
        AND created_at BETWEEN ? AND ?
      `).get(startDate + ' 00:00:00', endDate + ' 23:59:59') as any;

      const totalAttempts = successCount.count + failedCount.count;
      const successRate = totalAttempts > 0 ? (successCount.count / totalAttempts) * 100 : 0;

      const overallStats: OverallStats = {
        totalPosts: overall.totalPosts || 0,
        totalLikes: overall.totalLikes || 0,
        totalComments: overall.totalComments || 0,
        totalShares: overall.totalShares || 0,
        totalViews: overall.totalViews || 0,
        avgEngagementPerPost:
          overall.totalPosts > 0
            ? (overall.totalLikes + overall.totalComments + overall.totalShares) / overall.totalPosts
            : 0,
        successRate,
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(platforms, topPosts, overallStats);

      return {
        period: `${startDate} to ${endDate}`,
        platforms,
        topPosts,
        overallStats,
        recommendations,
      };

    } catch (error) {
      logger.error('Error generating report:', error);
      return {
        period: '',
        platforms: [],
        topPosts: [],
        overallStats: {
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          avgEngagementPerPost: 0,
          successRate: 0,
        },
        recommendations: ['Error generating report. Please check logs.'],
      };
    }
  }

  /**
   * Calculate trend for a platform
   */
  private calculateTrend(platform: string, days: number): 'up' | 'down' | 'stable' {
    try {
      const halfPoint = Math.floor(days / 2);
      const today = format(new Date(), 'yyyy-MM-dd');
      const midDate = format(subDays(new Date(), halfPoint), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const recentStats = db.prepare(`
        SELECT SUM(total_likes + total_comments + total_shares) as engagement
        FROM analytics
        WHERE platform = ? AND date BETWEEN ? AND ?
      `).get(platform, midDate, today) as any;

      const olderStats = db.prepare(`
        SELECT SUM(total_likes + total_comments + total_shares) as engagement
        FROM analytics
        WHERE platform = ? AND date BETWEEN ? AND ?
      `).get(platform, startDate, midDate) as any;

      const recent = recentStats?.engagement || 0;
      const older = olderStats?.engagement || 0;

      if (older === 0) return 'stable';

      const change = ((recent - older) / older) * 100;

      if (change > 10) return 'up';
      if (change < -10) return 'down';
      return 'stable';

    } catch (error) {
      return 'stable';
    }
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    platforms: PlatformPerformance[],
    topPosts: TopPost[],
    overall: OverallStats
  ): string[] {
    const recommendations: string[] = [];

    // Recommendation based on success rate
    if (overall.successRate < 90) {
      recommendations.push(
        `⚠️ Success rate is ${overall.successRate.toFixed(1)}%. Check platform authentication and API limits.`
      );
    }

    // Recommendation based on platform performance
    const bestPlatform = platforms[0];
    const worstPlatform = platforms[platforms.length - 1];

    if (bestPlatform && worstPlatform && bestPlatform.avgEngagement > worstPlatform.avgEngagement * 2) {
      recommendations.push(
        `📊 ${bestPlatform.platform} is performing 2x better than ${worstPlatform.platform}. Consider increasing posts on ${bestPlatform.platform}.`
      );
    }

    // Recommendation based on top posts
    if (topPosts.length > 0) {
      // Create safe parameterized query with placeholders
      const placeholders = topPosts.map(() => '?').join(',');
      const postIds = topPosts.map(p => p.id);

      const topCategories = db.prepare(`
        SELECT post_type, COUNT(*) as count
        FROM posts
        WHERE id IN (${placeholders})
        GROUP BY post_type
        ORDER BY count DESC
        LIMIT 1
      `).get(...postIds) as any;

      if (topCategories) {
        recommendations.push(
          `🔥 "${topCategories.post_type}" content performs best. Create more content in this category.`
        );
      }
    }

    // Recommendation based on engagement
    if (overall.avgEngagementPerPost < 5) {
      recommendations.push(
        `💡 Average engagement is low (${overall.avgEngagementPerPost.toFixed(1)} per post). Try more engaging content types like questions, polls, or value-driven posts.`
      );
    }

    // Recommendation for trending platforms
    const trendingUp = platforms.filter(p => p.trend === 'up');
    if (trendingUp.length > 0) {
      recommendations.push(
        `📈 Trending up: ${trendingUp.map(p => p.platform).join(', ')}. Momentum is building!`
      );
    }

    const trendingDown = platforms.filter(p => p.trend === 'down');
    if (trendingDown.length > 0) {
      recommendations.push(
        `📉 Attention needed: ${trendingDown.map(p => p.platform).join(', ')} showing declining engagement. Review content strategy.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Everything looks good! Keep up the consistent posting.');
    }

    return recommendations;
  }

  /**
   * Get content performance by category
   */
  public getCategoryPerformance(): any[] {
    try {
      return db.prepare(`
        SELECT
          post_type as category,
          COUNT(*) as posts,
          AVG(engagement_likes) as avgLikes,
          AVG(engagement_comments) as avgComments,
          AVG(engagement_shares) as avgShares,
          AVG(engagement_likes + engagement_comments + engagement_shares) as avgEngagement
        FROM posts
        WHERE status = 'published'
        AND published_time > datetime('now', '-30 days')
        GROUP BY post_type
        ORDER BY avgEngagement DESC
      `).all();

    } catch (error) {
      logger.error('Error getting category performance:', error);
      return [];
    }
  }

  /**
   * Export analytics data for external use
   */
  public exportAnalytics(exportFormat: 'json' | 'csv' = 'json', days: number = 30): string {
    try {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const data = this.getRangeStats(startDate, endDate);

      if (exportFormat === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // CSV format
        const headers = ['date', 'platform', 'totalPosts', 'totalLikes', 'totalComments', 'totalShares', 'totalViews', 'engagementRate'];
        const csv = [
          headers.join(','),
          ...data.map(row =>
            headers.map(h => row[h as keyof DailyStats]).join(',')
          )
        ].join('\n');

        return csv;
      }

    } catch (error) {
      logger.error('Error exporting analytics:', error);
      return '';
    }
  }
}

// Export singleton instance
export default new AnalyticsManager();
