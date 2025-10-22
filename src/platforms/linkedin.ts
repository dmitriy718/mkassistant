import axios from 'axios';
import { BasePlatform, PostResult, EngagementMetrics } from './base';

export class LinkedInPlatform extends BasePlatform {
  private accessToken: string;
  private personUrn: string | null = null;

  constructor(credentials: any) {
    super('linkedin', credentials);
    this.accessToken = credentials.accessToken;
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        this.log('warn', 'LinkedIn credentials not configured');
        return false;
      }

      // Get user profile to verify authentication
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      this.personUrn = `urn:li:person:${response.data.id}`;
      this.isAuthenticated = true;
      this.log('info', `Authenticated as ${response.data.localizedFirstName} ${response.data.localizedLastName}`);
      return true;

    } catch (error: any) {
      this.log('error', 'Authentication failed', { error: error.message });
      this.isAuthenticated = false;
      return false;
    }
  }

  async post(content: string, mediaUrls?: string[]): Promise<PostResult> {
    try {
      if (!this.isAuthenticated || !this.personUrn) {
        return {
          success: false,
          error: 'Not authenticated with LinkedIn'
        };
      }

      // Create a LinkedIn share (UGC Post)
      const shareData = {
        author: this.personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        shareData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const postId = response.data.id;
      this.log('info', `Posted to LinkedIn successfully`, { postId });

      return {
        success: true,
        postId: postId,
        platformData: response.data
      };

    } catch (error: any) {
      this.log('error', 'Failed to post to LinkedIn', { error: error.response?.data || error.message });
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to post to LinkedIn'
      };
    }
  }

  async getEngagement(postId: string): Promise<EngagementMetrics | null> {
    try {
      if (!this.isAuthenticated) {
        return null;
      }

      // Get post statistics
      const response = await axios.get(
        `https://api.linkedin.com/v2/socialActions/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        likes: response.data.likesSummary?.totalLikes || 0,
        comments: response.data.commentsSummary?.totalComments || 0,
        shares: response.data.sharesSummary?.totalShares || 0,
        views: 0, // LinkedIn API doesn't provide view count easily
      };

    } catch (error: any) {
      this.log('error', 'Failed to get engagement metrics', { error: error.message, postId });
      return null;
    }
  }
}
