import axios from 'axios';
import { BasePlatform, PostResult, EngagementMetrics } from './base';

export class FacebookPlatform extends BasePlatform {
  private accessToken: string;
  private pageId: string;

  constructor(credentials: any) {
    super('facebook', credentials);
    this.accessToken = credentials.accessToken;
    this.pageId = credentials.pageId;
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        this.log('warn', 'Facebook credentials not configured');
        return false;
      }

      // Verify page access
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${this.pageId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'name,id'
          }
        }
      );

      this.isAuthenticated = true;
      this.log('info', `Authenticated with page: ${response.data.name}`);
      return true;

    } catch (error: any) {
      this.log('error', 'Authentication failed', { error: error.response?.data || error.message });
      this.isAuthenticated = false;
      return false;
    }
  }

  async post(content: string, mediaUrls?: string[]): Promise<PostResult> {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated with Facebook'
        };
      }

      // Post to Facebook page
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
        {
          message: content,
          access_token: this.accessToken
        }
      );

      const postId = response.data.id;
      this.log('info', `Posted to Facebook successfully`, { postId });

      return {
        success: true,
        postId: postId,
        platformData: response.data
      };

    } catch (error: any) {
      this.log('error', 'Failed to post to Facebook', { error: error.response?.data || error.message });
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to post to Facebook'
      };
    }
  }

  async getEngagement(postId: string): Promise<EngagementMetrics | null> {
    try {
      if (!this.isAuthenticated) {
        return null;
      }

      // Get post insights
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${postId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'likes.summary(true),comments.summary(true),shares'
          }
        }
      );

      return {
        likes: response.data.likes?.summary?.total_count || 0,
        comments: response.data.comments?.summary?.total_count || 0,
        shares: response.data.shares?.count || 0,
        views: 0, // Would need insights API for views
      };

    } catch (error: any) {
      this.log('error', 'Failed to get engagement metrics', { error: error.message, postId });
      return null;
    }
  }
}
