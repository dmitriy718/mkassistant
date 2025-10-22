import logger from '../utils/logger';

export interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
  platformData?: any;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface PlatformCredentials {
  [key: string]: string;
}

export abstract class BasePlatform {
  protected platformName: string;
  protected credentials: PlatformCredentials;
  protected isAuthenticated: boolean = false;

  constructor(platformName: string, credentials: PlatformCredentials) {
    this.platformName = platformName;
    this.credentials = credentials;
  }

  /**
   * Authenticate with the platform
   */
  abstract authenticate(): Promise<boolean>;

  /**
   * Post content to the platform
   */
  abstract post(content: string, mediaUrls?: string[]): Promise<PostResult>;

  /**
   * Get engagement metrics for a post
   */
  abstract getEngagement(postId: string): Promise<EngagementMetrics | null>;

  /**
   * Check if the platform is properly configured
   */
  public isConfigured(): boolean {
    return Object.values(this.credentials).every(val => val && val.length > 0);
  }

  /**
   * Get platform name
   */
  public getPlatformName(): string {
    return this.platformName;
  }

  /**
   * Check authentication status
   */
  public isAuth(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Log platform activity
   */
  protected log(level: string, message: string, meta?: any) {
    const logMessage = `[${this.platformName}] ${message}`;
    switch (level) {
      case 'info':
        logger.info(logMessage, meta);
        break;
      case 'warn':
        logger.warn(logMessage, meta);
        break;
      case 'error':
        logger.error(logMessage, meta);
        break;
      default:
        logger.debug(logMessage, meta);
    }
  }
}
