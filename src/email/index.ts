import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import db, { queries } from '../database';
import { format, addDays } from 'date-fns';

export interface EmailCampaign {
  id?: number;
  name: string;
  subject: string;
  content: string;
  recipientList: string[];
  scheduledTime: Date;
  status?: 'pending' | 'sent' | 'failed';
}

export interface EmailTemplate {
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export class EmailMarketingManager {
  private sendgridApiKey: string;
  private fromEmail: string;

  constructor() {
    this.sendgridApiKey = config.email.sendgridApiKey;
    this.fromEmail = config.email.sendgridFromEmail;
  }

  /**
   * Email templates for different campaigns
   */
  private getTemplates(): EmailTemplate[] {
    return [
      {
        name: 'welcome_series_1',
        subject: 'Welcome to TradeFlows Pro! 🚀 Start Your Trading Journey',
        content: `
Hi {{firstName}},

Welcome to TradeFlows Pro! We're excited to have you join our community of smart traders.

You now have access to:
✅ Real-time market data and professional charts
✅ AI-powered trading strategies
✅ Portfolio management tools
✅ Unlimited watchlists (Premium)
✅ 14-day free trial of all Premium features

🎯 Quick Start Guide:
1. Set up your first watchlist
2. Explore our 4 AI trading strategies
3. Connect your portfolio
4. Set up price alerts

Ready to dive in? Visit your dashboard: {{dashboardUrl}}

Questions? Hit reply - we're here to help!

Best regards,
The TradeFlows Team

P.S. Your 14-day Premium trial is already active. No credit card required!
        `,
        variables: ['firstName', 'dashboardUrl']
      },
      {
        name: 'welcome_series_2',
        subject: '💡 3 Strategies Every Trader Should Know',
        content: `
Hi {{firstName}},

Day 2 of your TradeFlows Pro journey! Let's talk strategy.

Here are the 3 most popular trading strategies on our platform:

1. **RSI Mean Reversion** 📊
   Perfect for: Identifying overbought/oversold conditions
   Win rate: ~68% in backtests

2. **MACD Trend Following** 📈
   Perfect for: Catching strong trends early
   Win rate: ~72% in trending markets

3. **Bollinger Band Breakouts** ⚡
   Perfect for: Volatility-based opportunities
   Win rate: ~65% across all market conditions

💡 Pro Tip: Combine multiple strategies for better coverage!

Try them now: {{strategiesUrl}}

Tomorrow, we'll show you how to backtest these strategies with your own data.

Happy trading!
The TradeFlows Team
        `,
        variables: ['firstName', 'strategiesUrl']
      },
      {
        name: 'trial_reminder',
        subject: '⏰ Your Premium Trial Ends in 3 Days',
        content: `
Hi {{firstName}},

Just a friendly reminder that your TradeFlows Pro Premium trial ends in 3 days.

Your trial has been amazing so far:
📊 {{postsViewed}} strategies tested
💼 {{portfoliosCreated}} portfolios created
🔔 {{alertsSet}} alerts configured

Want to keep all these Premium features?

Continue with Premium ($29/month):
✅ 4 AI Trading Strategies
✅ Unlimited Watchlists
✅ Advanced Analytics
✅ Priority Support
✅ Real-time Signals

Upgrade now and save: {{upgradeUrl}}

Or, you can always continue with our Free plan (basic charts + 3 watchlists).

Questions? Reply to this email anytime.

Best,
The TradeFlows Team
        `,
        variables: ['firstName', 'postsViewed', 'portfoliosCreated', 'alertsSet', 'upgradeUrl']
      },
      {
        name: 'feature_announcement',
        subject: '🎉 New Feature: AI Strategy Builder',
        content: `
Hi {{firstName}},

Big news! We just launched something you're going to love...

**Custom AI Strategy Builder** is now live! 🤖

Now you can create your own AI trading strategies by combining:
- Multiple technical indicators
- Custom entry/exit rules
- Risk management parameters
- Backtesting validation

This is a Pro tier feature, but all users can try it free for 7 days.

Watch the tutorial: {{tutorialUrl}}
Start building: {{builderUrl}}

We can't wait to see what strategies you create!

Trade smart,
The TradeFlows Team
        `,
        variables: ['firstName', 'tutorialUrl', 'builderUrl']
      },
      {
        name: 'reengagement',
        subject: 'We Miss You at TradeFlows Pro! 💙',
        content: `
Hi {{firstName}},

It's been a while since we've seen you on TradeFlows Pro.

Since you last logged in, we've added:
✨ New AI momentum strategy
✨ Enhanced portfolio analytics
✨ Mobile-responsive charts
✨ 50+ new stock/crypto symbols

Your account is still active and ready to go!

What we've kept for you:
- Your {{watchlistCount}} watchlists
- All your portfolio data
- Your saved strategies

Come back and see what's new: {{loginUrl}}

Still the same pricing:
- Free tier: Always free
- Premium: Just $29/month
- 14-day trial available

We'd love to have you back!

Best regards,
The TradeFlows Team

P.S. Reply to this email if there's anything we can do better.
        `,
        variables: ['firstName', 'watchlistCount', 'loginUrl']
      },
      {
        name: 'educational_newsletter',
        subject: '📚 This Week in Trading: Market Insights & Tips',
        content: `
Hi {{firstName}},

Your weekly TradeFlows Pro newsletter is here!

**This Week's Market Summary:**
{{marketSummary}}

**Trading Tip of the Week:** 💡
Diversification isn't just about different assets - it's about different strategies too.
Running multiple AI strategies simultaneously helps you catch opportunities across different market conditions.

**Most Popular Strategy This Week:**
{{topStrategy}} - Try it on your dashboard!

**Community Highlight:**
Traders using TradeFlows Pro's portfolio tracker saw an average {{avgGain}}% better organization and clarity in their trading decisions.

**Upcoming Webinar:** 🎓
"Mastering AI Trading Strategies" - {{webinarDate}}
Register: {{webinarUrl}}

Keep trading smart!
The TradeFlows Team

P.S. Have a topic you'd like us to cover? Hit reply and let us know!
        `,
        variables: ['firstName', 'marketSummary', 'topStrategy', 'avgGain', 'webinarDate', 'webinarUrl']
      }
    ];
  }

  /**
   * Create and schedule an email campaign
   */
  public async createCampaign(campaign: EmailCampaign): Promise<number | null> {
    try {
      const result = db.prepare(`
        INSERT INTO email_campaigns (name, subject, content, recipient_list, scheduled_time, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        campaign.name,
        campaign.subject,
        campaign.content,
        JSON.stringify(campaign.recipientList),
        format(campaign.scheduledTime, 'yyyy-MM-dd HH:mm:ss'),
        'pending'
      );

      logger.info(`Created email campaign: ${campaign.name} (ID: ${result.lastInsertRowid})`);
      return result.lastInsertRowid as number;

    } catch (error) {
      logger.error('Error creating campaign:', error);
      return null;
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendEmailViaSendGrid(
    to: string,
    subject: string,
    content: string
  ): Promise<boolean> {
    try {
      if (!this.sendgridApiKey || this.sendgridApiKey.length === 0) {
        logger.warn('SendGrid API key not configured');
        return false;
      }

      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject
            }
          ],
          from: {
            email: this.fromEmail,
            name: 'TradeFlows Pro'
          },
          content: [
            {
              type: 'text/plain',
              value: content
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.sendgridApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;

    } catch (error: any) {
      logger.error('SendGrid error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send a campaign to all recipients
   */
  public async sendCampaign(campaignId: number): Promise<{ sent: number; failed: number }> {
    try {
      const campaign = db.prepare(`
        SELECT * FROM email_campaigns WHERE id = ?
      `).get(campaignId) as any;

      if (!campaign) {
        logger.error(`Campaign ${campaignId} not found`);
        return { sent: 0, failed: 0 };
      }

      const recipients = JSON.parse(campaign.recipient_list);
      let sentCount = 0;
      let failedCount = 0;

      logger.info(`Sending campaign "${campaign.name}" to ${recipients.length} recipients`);

      for (const email of recipients) {
        const success = await this.sendEmailViaSendGrid(
          email,
          campaign.subject,
          campaign.content
        );

        if (success) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update campaign status
      db.prepare(`
        UPDATE email_campaigns
        SET status = 'sent', sent_time = CURRENT_TIMESTAMP, total_sent = ?
        WHERE id = ?
      `).run(sentCount, campaignId);

      logger.info(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

      return { sent: sentCount, failed: failedCount };

    } catch (error) {
      logger.error('Error sending campaign:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Create automated drip campaign for new users
   */
  public async setupWelcomeDripCampaign(userEmail: string, firstName: string): Promise<void> {
    try {
      const templates = this.getTemplates();
      const baseUrl = config.tradeflows.url;

      // Day 1: Welcome email
      const day1 = templates.find(t => t.name === 'welcome_series_1');
      if (day1) {
        await this.createCampaign({
          name: `Welcome Day 1 - ${userEmail}`,
          subject: day1.subject,
          content: day1.content
            .replace('{{firstName}}', firstName)
            .replace('{{dashboardUrl}}', `${baseUrl}/dashboard`),
          recipientList: [userEmail],
          scheduledTime: new Date(), // Send immediately
        });
      }

      // Day 2: Strategy education
      const day2 = templates.find(t => t.name === 'welcome_series_2');
      if (day2) {
        await this.createCampaign({
          name: `Welcome Day 2 - ${userEmail}`,
          subject: day2.subject,
          content: day2.content
            .replace('{{firstName}}', firstName)
            .replace('{{strategiesUrl}}', `${baseUrl}/strategies`),
          recipientList: [userEmail],
          scheduledTime: addDays(new Date(), 1),
        });
      }

      logger.info(`Welcome drip campaign set up for ${userEmail}`);

    } catch (error) {
      logger.error('Error setting up welcome drip campaign:', error);
    }
  }

  /**
   * Send newsletter to all subscribers
   */
  public async sendNewsletter(
    recipientList: string[],
    customContent?: Record<string, string>
  ): Promise<void> {
    try {
      const template = this.getTemplates().find(t => t.name === 'educational_newsletter');
      if (!template) return;

      // Create campaign with custom content
      let content = template.content;
      if (customContent) {
        for (const [key, value] of Object.entries(customContent)) {
          content = content.replace(`{{${key}}}`, value);
        }
      }

      const campaignId = await this.createCampaign({
        name: `Newsletter - ${format(new Date(), 'yyyy-MM-dd')}`,
        subject: template.subject,
        content: content,
        recipientList: recipientList,
        scheduledTime: new Date(),
      });

      if (campaignId) {
        await this.sendCampaign(campaignId);
      }

    } catch (error) {
      logger.error('Error sending newsletter:', error);
    }
  }

  /**
   * Get campaign statistics
   */
  public getCampaignStats(): any {
    try {
      return db.prepare(`
        SELECT
          COUNT(*) as total_campaigns,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_campaigns,
          SUM(total_sent) as total_emails_sent,
          SUM(total_opened) as total_emails_opened,
          SUM(total_clicked) as total_emails_clicked,
          CAST(SUM(total_opened) AS FLOAT) / NULLIF(SUM(total_sent), 0) * 100 as open_rate,
          CAST(SUM(total_clicked) AS FLOAT) / NULLIF(SUM(total_sent), 0) * 100 as click_rate
        FROM email_campaigns
      `).get();

    } catch (error) {
      logger.error('Error getting campaign stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new EmailMarketingManager();
