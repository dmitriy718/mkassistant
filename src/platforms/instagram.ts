import axios from 'axios';
import { BasePlatform, PostResult, EngagementMetrics } from './base';

export class InstagramPlatform extends BasePlatform {
  private accessToken: string;
  private accountId: string;

  constructor(credentials: any) {
    super('instagram', credentials);
    this.accessToken = credentials.accessToken;
    this.accountId = credentials.accountId;
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        this.log('warn', 'Instagram credentials not configured');
        return false;
      }

      // Verify account access
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${this.accountId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'username,id'
          }
        }
      );

      this.isAuthenticated = true;
      this.log('info', `Authenticated as @${response.data.username}`);
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
          error: 'Not authenticated with Instagram'
        };
      }

      // Instagram requires an image URL for posts
      if (!mediaUrls || mediaUrls.length === 0) {
        this.log('warn', 'Instagram posts require media URLs');
        return {
          success: false,
          error: 'Instagram posts require at least one image or video'
        };
      }

      // Create media container
      const containerResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.accountId}/media`,
        {
          image_url: mediaUrls[0],
          caption: content,
          access_token: this.accessToken
        }
      );

      const creationId = containerResponse.data.id;

      // Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.accountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken
        }
      );

      const postId = publishResponse.data.id;
      this.log('info', `Posted to Instagram successfully`, { postId });

      return {
        success: true,
        postId: postId,
        platformData: publishResponse.data
      };

    } catch (error: any) {
      this.log('error', 'Failed to post to Instagram', { error: error.response?.data || error.message });
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to post to Instagram'
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
            fields: 'like_count,comments_count,media_type'
          }
        }
      );

      return {
        likes: response.data.like_count || 0,
        comments: response.data.comments_count || 0,
        shares: 0, // Instagram doesn't provide share count
        views: 0, // Would need insights API for views
      };

    } catch (error: any) {
      this.log('error', 'Failed to get engagement metrics', { error: error.message, postId });
      return null;
    }
  }
}
