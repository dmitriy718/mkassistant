import axios from 'axios';
import { BasePlatform, PostResult, EngagementMetrics } from './base';

export class RedditPlatform extends BasePlatform {
  private accessToken: string | null = null;
  private username: string;
  private password: string;
  private clientId: string;
  private clientSecret: string;

  constructor(credentials: any) {
    super('reddit', credentials);
    this.username = credentials.username;
    this.password = credentials.password;
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        this.log('warn', 'Reddit credentials not configured');
        return false;
      }

      // Get OAuth token
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'password',
          username: this.username,
          password: this.password
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TradeFlowsMarketingBot/1.0'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.isAuthenticated = true;
      this.log('info', `Authenticated as u/${this.username}`);
      return true;

    } catch (error: any) {
      this.log('error', 'Authentication failed', { error: error.response?.data || error.message });
      this.isAuthenticated = false;
      return false;
    }
  }

  async post(content: string, mediaUrls?: string[], subreddit: string = 'test'): Promise<PostResult> {
    try {
      if (!this.isAuthenticated || !this.accessToken) {
        return {
          success: false,
          error: 'Not authenticated with Reddit'
        };
      }

      // Post to subreddit (requires appropriate subreddit permissions)
      // NOTE: For actual use, you should post to relevant trading subreddits
      // like r/algotrading, r/stocks, r/investing, etc.
      // Make sure to follow each subreddit's rules about self-promotion

      const response = await axios.post(
        'https://oauth.reddit.com/api/submit',
        new URLSearchParams({
          sr: subreddit,
          kind: 'self',
          title: content.split('\n')[0].substring(0, 300), // First line as title
          text: content,
          api_type: 'json'
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'TradeFlowsMarketingBot/1.0',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.json.errors && response.data.json.errors.length > 0) {
        throw new Error(response.data.json.errors[0][1]);
      }

      const postId = response.data.json.data.name;
      this.log('info', `Posted to Reddit successfully`, { postId, subreddit });

      return {
        success: true,
        postId: postId,
        platformData: response.data
      };

    } catch (error: any) {
      this.log('error', 'Failed to post to Reddit', { error: error.response?.data || error.message });
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to post to Reddit'
      };
    }
  }

  async getEngagement(postId: string): Promise<EngagementMetrics | null> {
    try {
      if (!this.isAuthenticated || !this.accessToken) {
        return null;
      }

      // Get post info
      const response = await axios.get(
        `https://oauth.reddit.com/api/info`,
        {
          params: {
            id: postId
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'TradeFlowsMarketingBot/1.0'
          }
        }
      );

      const post = response.data.data.children[0]?.data;
      if (!post) {
        return null;
      }

      return {
        likes: post.ups || 0,
        comments: post.num_comments || 0,
        shares: 0, // Reddit doesn't track shares
        views: 0, // Reddit doesn't provide view count via API
      };

    } catch (error: any) {
      this.log('error', 'Failed to get engagement metrics', { error: error.message, postId });
      return null;
    }
  }
}
