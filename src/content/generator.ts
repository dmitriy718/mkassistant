import { contentTemplates, platformSpecs, ContentTemplate } from './templates';
import logger from '../utils/logger';
import db, { queries } from '../database';

export interface GeneratedPost {
  content: string;
  platform: string;
  category: string;
  hashtags: string[];
  hasMedia: boolean;
}

export class ContentGenerator {
  private usedTemplatesRecently: Set<string> = new Set();
  private recentlyUsedWindow: number = 10; // Don't repeat templates within 10 posts

  constructor() {
    this.loadRecentlyUsedTemplates();
  }

  /**
   * Load recently used templates from database to avoid repetition
   */
  private loadRecentlyUsedTemplates() {
    try {
      const recentPosts = db.prepare(`
        SELECT post_type FROM posts
        WHERE created_at > datetime('now', '-7 days')
        ORDER BY created_at DESC
        LIMIT ?
      `).all(this.recentlyUsedWindow);

      this.usedTemplatesRecently = new Set(
        recentPosts.map((p: any) => p.post_type)
      );

      logger.info(`Loaded ${this.usedTemplatesRecently.size} recently used templates`);
    } catch (error) {
      logger.error('Error loading recently used templates:', error);
    }
  }

  /**
   * Generate a post for a specific platform with intelligent template selection
   */
  public generatePost(
    platform: string,
    preferredCategory?: string
  ): GeneratedPost | null {
    try {
      // Filter templates suitable for this platform
      let availableTemplates = contentTemplates.filter(
        t => t.platform.includes(platform)
      );

      // Apply category filter if specified
      if (preferredCategory) {
        const categoryTemplates = availableTemplates.filter(
          t => t.category === preferredCategory
        );
        if (categoryTemplates.length > 0) {
          availableTemplates = categoryTemplates;
        }
      }

      // Filter out recently used templates to ensure variety
      const freshTemplates = availableTemplates.filter(
        t => !this.usedTemplatesRecently.has(t.id)
      );

      // Use fresh templates if available, otherwise use any template
      const templatePool = freshTemplates.length > 0 ? freshTemplates : availableTemplates;

      if (templatePool.length === 0) {
        logger.warn(`No templates available for platform: ${platform}`);
        return null;
      }

      // Randomly select a template
      const template = templatePool[Math.floor(Math.random() * templatePool.length)];

      // Generate the post content
      const post = this.buildPost(template, platform);

      // Track this template as used
      this.usedTemplatesRecently.add(template.id);
      if (this.usedTemplatesRecently.size > this.recentlyUsedWindow) {
        const firstItem = this.usedTemplatesRecently.values().next().value;
        if (firstItem) {
          this.usedTemplatesRecently.delete(firstItem);
        }
      }

      logger.info(`Generated ${platform} post from template: ${template.id}`);
      return post;

    } catch (error) {
      logger.error(`Error generating post for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Build the final post with platform-specific formatting
   */
  private buildPost(template: ContentTemplate, platform: string): GeneratedPost {
    let content = template.template;

    // Add call-to-action if available
    if (template.callToAction) {
      content += `\n\n${template.callToAction}`;
    }

    // Add hashtags based on platform specs
    const platformSpec = platformSpecs[platform as keyof typeof platformSpecs];
    let hashtags = template.hashtags || [];

    if (platform !== 'reddit' && hashtags.length > 0) {
      const maxHashtags = platformSpec?.optimalHashtags || 3;
      const selectedHashtags = this.selectHashtags(hashtags, maxHashtags);

      if (selectedHashtags.length > 0) {
        content += '\n\n' + selectedHashtags.map(tag => `#${tag}`).join(' ');
      }
    }

    // Trim content to platform limits if necessary
    if (platformSpec?.maxLength && content.length > platformSpec.maxLength) {
      content = content.substring(0, platformSpec.maxLength - 3) + '...';
    }

    return {
      content,
      platform,
      category: template.category,
      hashtags: hashtags,
      hasMedia: template.mediaType === 'image' || template.mediaType === 'video' || platform === 'instagram',
    };
  }

  /**
   * Intelligently select hashtags (varies the selection for diversity)
   */
  private selectHashtags(hashtags: string[], maxCount: number): string[] {
    if (hashtags.length <= maxCount) {
      return hashtags;
    }

    // Shuffle and take the first maxCount
    const shuffled = [...hashtags].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, maxCount);
  }

  /**
   * Generate multiple posts for a campaign
   */
  public generateCampaign(
    platforms: string[],
    postsPerPlatform: number = 1,
    categoryMix?: string[]
  ): GeneratedPost[] {
    const posts: GeneratedPost[] = [];

    for (const platform of platforms) {
      for (let i = 0; i < postsPerPlatform; i++) {
        const category = categoryMix && categoryMix.length > 0
          ? categoryMix[Math.floor(Math.random() * categoryMix.length)]
          : undefined;

        const post = this.generatePost(platform, category);
        if (post) {
          posts.push(post);
        }
      }
    }

    logger.info(`Generated campaign: ${posts.length} posts across ${platforms.length} platforms`);
    return posts;
  }

  /**
   * Get optimal posting time for a platform
   */
  public getOptimalPostTime(platform: string, timeIndex: number = 0): string {
    const platformSpec = platformSpecs[platform as keyof typeof platformSpecs] as any;
    if (!platformSpec || !platformSpec.bestPostTimes) {
      return '09:00'; // Default fallback
    }

    const times = platformSpec.bestPostTimes;
    return times[timeIndex % times.length];
  }

  /**
   * Get content distribution strategy (category mix for the day)
   */
  public getDailyContentMix(totalPosts: number): string[] {
    // Strategic mix: More promotional/feature content, balanced with education and engagement
    const categoryWeights = {
      feature: 0.25,           // 25% feature highlights
      pricing: 0.15,           // 15% pricing/value
      education: 0.20,         // 20% educational
      usecase: 0.15,           // 15% use cases
      promotion: 0.10,         // 10% promotions/trials
      engagement: 0.10,        // 10% community engagement
      comparison: 0.05,        // 5% comparisons
    };

    const mix: string[] = [];
    const categories = Object.keys(categoryWeights);

    for (let i = 0; i < totalPosts; i++) {
      const rand = Math.random();
      let cumulative = 0;

      for (const [category, weight] of Object.entries(categoryWeights)) {
        cumulative += weight;
        if (rand <= cumulative) {
          mix.push(category);
          break;
        }
      }
    }

    return mix;
  }

  /**
   * Get statistics about available content
   */
  public getContentStats(): {
    totalTemplates: number;
    templatesByPlatform: Record<string, number>;
    templatesByCategory: Record<string, number>;
  } {
    const stats = {
      totalTemplates: contentTemplates.length,
      templatesByPlatform: {} as Record<string, number>,
      templatesByCategory: {} as Record<string, number>,
    };

    contentTemplates.forEach(template => {
      // Count by platform
      template.platform.forEach(platform => {
        stats.templatesByPlatform[platform] = (stats.templatesByPlatform[platform] || 0) + 1;
      });

      // Count by category
      stats.templatesByCategory[template.category] =
        (stats.templatesByCategory[template.category] || 0) + 1;
    });

    return stats;
  }
}

// Export a singleton instance
export default new ContentGenerator();
