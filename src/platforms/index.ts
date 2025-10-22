import config from '../config';
import { TwitterPlatform } from './twitter';
import { LinkedInPlatform } from './linkedin';
import { FacebookPlatform } from './facebook';
import { InstagramPlatform } from './instagram';
import { RedditPlatform } from './reddit';
import { BasePlatform } from './base';
import logger from '../utils/logger';

export class PlatformManager {
  private platforms: Map<string, BasePlatform> = new Map();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    // Initialize Twitter
    const twitter = new TwitterPlatform(config.twitter);
    this.platforms.set('twitter', twitter);

    // Initialize LinkedIn
    const linkedin = new LinkedInPlatform(config.linkedin);
    this.platforms.set('linkedin', linkedin);

    // Initialize Facebook
    const facebook = new FacebookPlatform(config.facebook);
    this.platforms.set('facebook', facebook);

    // Initialize Instagram
    const instagram = new InstagramPlatform(config.instagram);
    this.platforms.set('instagram', instagram);

    // Initialize Reddit
    const reddit = new RedditPlatform(config.reddit);
    this.platforms.set('reddit', reddit);

    logger.info(`Initialized ${this.platforms.size} platform connectors`);
  }

  /**
   * Authenticate all configured platforms
   */
  public async authenticateAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name, platform] of this.platforms) {
      if (platform.isConfigured()) {
        try {
          const success = await platform.authenticate();
          results.set(name, success);
        } catch (error) {
          logger.error(`Failed to authenticate ${name}:`, error);
          results.set(name, false);
        }
      } else {
        logger.warn(`Platform ${name} not configured, skipping authentication`);
        results.set(name, false);
      }
    }

    return results;
  }

  /**
   * Get a specific platform instance
   */
  public getPlatform(name: string): BasePlatform | undefined {
    return this.platforms.get(name);
  }

  /**
   * Get all authenticated platforms
   */
  public getAuthenticatedPlatforms(): BasePlatform[] {
    return Array.from(this.platforms.values()).filter(p => p.isAuth());
  }

  /**
   * Get all platform names
   */
  public getAllPlatformNames(): string[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Check if a platform is ready to post
   */
  public isPlatformReady(name: string): boolean {
    const platform = this.platforms.get(name);
    return platform ? platform.isConfigured() && platform.isAuth() : false;
  }
}

// Export singleton instance
export default new PlatformManager();
