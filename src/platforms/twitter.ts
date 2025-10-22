import { TwitterApi } from 'twitter-api-v2';
import { BasePlatform, PostResult, EngagementMetrics } from './base';

export class TwitterPlatform extends BasePlatform {
  private client: TwitterApi | null = null;

  constructor(credentials: any) {
    super('twitter', credentials);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        this.log('warn', 'Twitter credentials not configured');
        return false;
      }

      // Initialize Twitter client with v2 API
      this.client = new TwitterApi({
        appKey: this.credentials.apiKey,
        appSecret: this.credentials.apiSecret,
        accessToken: this.credentials.accessToken,
        accessSecret: this.credentials.accessSecret,
      });

      // Test authentication by getting user info
      const me = await this.client.v2.me();
      this.isAuthenticated = true;
      this.log('info', `Authenticated as @${me.data.username}`);
      return true;

    } catch (error: any) {
      this.log('error', 'Authentication failed', { error: error.message });
      this.isAuthenticated = false;
      return false;
    }
  }

  async post(content: string, mediaUrls?: string[]): Promise<PostResult> {
    try {
      if (!this.isAuthenticated || !this.client) {
        return {
          success: false,
          error: 'Not authenticated with Twitter'
        };
      }

      // For now, post text only (media upload would require additional implementation)
      const tweet = await this.client.v2.tweet(content);

      this.log('info', `Posted tweet successfully`, { tweetId: tweet.data.id });

      return {
        success: true,
        postId: tweet.data.id,
        platformData: tweet.data
      };

    } catch (error: any) {
      this.log('error', 'Failed to post tweet', { error: error.message });
      return {
        success: false,
        error: error.message || 'Failed to post tweet'
      };
    }
  }

  async getEngagement(postId: string): Promise<EngagementMetrics | null> {
    try {
      if (!this.isAuthenticated || !this.client) {
        return null;
      }

      const tweet = await this.client.v2.singleTweet(postId, {
        'tweet.fields': ['public_metrics']
      });

      const metrics = tweet.data.public_metrics;

      return {
        likes: metrics?.like_count || 0,
        comments: metrics?.reply_count || 0,
        shares: metrics?.retweet_count || 0,
        views: metrics?.impression_count || 0,
      };

    } catch (error: any) {
      this.log('error', 'Failed to get engagement metrics', { error: error.message, postId });
      return null;
    }
  }
}
