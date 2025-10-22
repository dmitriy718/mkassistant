import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface AppConfig {
  tradeflows: {
    url: string;
    freeTrialDays: number;
    premiumPrice: number;
    proPrice: number;
  };
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
    bearerToken: string;
  };
  linkedin: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
  };
  facebook: {
    appId: string;
    appSecret: string;
    accessToken: string;
    pageId: string;
  };
  instagram: {
    accessToken: string;
    accountId: string;
  };
  reddit: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
  };
  email: {
    sendgridApiKey: string;
    sendgridFromEmail: string;
    mailchimpApiKey: string;
    mailchimpListId: string;
  };
  openai: {
    apiKey: string;
  };
  scheduling: {
    postsPerDayMin: number;
    postsPerDayMax: number;
    timezone: string;
  };
  database: {
    path: string;
  };
  logging: {
    level: string;
    file: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
}

const config: AppConfig = {
  tradeflows: {
    url: process.env.TRADEFLOWS_URL || 'https://tradeflows.net',
    freeTrialDays: parseInt(process.env.TRADEFLOWS_FREE_TRIAL_DAYS || '14'),
    premiumPrice: parseInt(process.env.TRADEFLOWS_PREMIUM_PRICE || '29'),
    proPrice: parseInt(process.env.TRADEFLOWS_PRO_PRICE || '99'),
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    accountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    username: process.env.REDDIT_USERNAME || '',
    password: process.env.REDDIT_PASSWORD || '',
  },
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || '',
    mailchimpApiKey: process.env.MAILCHIMP_API_KEY || '',
    mailchimpListId: process.env.MAILCHIMP_LIST_ID || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  scheduling: {
    postsPerDayMin: parseInt(process.env.POSTS_PER_DAY_MIN || '3'),
    postsPerDayMax: parseInt(process.env.POSTS_PER_DAY_MAX || '6'),
    timezone: process.env.TIMEZONE || 'America/New_York',
  },
  database: {
    path: process.env.DATABASE_PATH || path.join(__dirname, '../../data/mkassistant.db'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/mkassistant.log'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

export default config;
