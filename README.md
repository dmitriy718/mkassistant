# 🚀 Marketing Assistant (mkassistant)

**Complete Marketing Automation System for Tradeflows Pro**

A comprehensive, enterprise-grade marketing automation platform that handles social media posting, email campaigns, SEO content generation, and lead management - essentially replacing an entire marketing department.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Modules](#modules)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 🎯 Core Social Media Automation
- **Multi-Platform Support**: Twitter, LinkedIn, Facebook, Instagram, Reddit
- **Intelligent Scheduling**: 3-6 posts daily, optimized timing per platform
- **Content Generation**: 30+ templates with smart variations
- **Engagement Tracking**: Real-time metrics and analytics
- **Auto-Publishing**: Fully automated posting workflow

### 📧 Email Marketing Automation
- **Drip Campaigns**: Welcome series, trials, re-engagement
- **Newsletter System**: Automated weekly/monthly newsletters
- **SendGrid Integration**: Professional email delivery
- **Performance Tracking**: Open rates, click rates, conversions

### 📝 SEO Content Generator
- **Blog Post Generation**: AI-powered long-form content
- **SEO Analysis**: Automated quality scoring
- **Content Calendar**: Plan months of content ahead
- **Keyword Optimization**: Built-in SEO best practices

### 🎯 Lead Management & Tracking
- **Lead Capture**: Multi-source lead tracking
- **Lead Scoring**: Intelligent scoring algorithm
- **Conversion Funnel**: Visual funnel analytics
- **Automated Nurturing**: Smart follow-up sequences
- **Hot Lead Alerts**: Never miss high-value prospects

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- SendGrid account (for email)
- Social media API credentials

### Installation

```bash
# Clone or navigate to the project
cd mkassistant

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor

# Build the project
npm run build

# Start in development mode
npm run dev

# Or start in production mode
npm start
```

The application will be available at `http://localhost:3000`

---

## ⚙️ Configuration

### Required Environment Variables

Create a `.env` file with the following:

```env
# Tradeflows Pro Information
TRADEFLOWS_URL=https://tradeflows.net
TRADEFLOWS_FREE_TRIAL_DAYS=14
TRADEFLOWS_PREMIUM_PRICE=29
TRADEFLOWS_PRO_PRICE=99

# Social Media API Keys
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id

# Email Marketing
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=contact@tradeflows.net

# Scheduling
POSTS_PER_DAY_MIN=3
POSTS_PER_DAY_MAX=6
TIMEZONE=America/New_York
```

### Getting API Credentials

#### Twitter/X API
1. Go to https://developer.twitter.com/
2. Create a new app
3. Generate API keys and access tokens
4. Enable OAuth 1.0a with Read/Write permissions

#### LinkedIn API
1. Create app at https://www.linkedin.com/developers/
2. Request Marketing Developer Platform access
3. Generate OAuth 2.0 credentials
4. Set redirect URIs

#### Facebook/Instagram API
1. Create app at https://developers.facebook.com/
2. Add Facebook Login and Instagram Graph API products
3. Generate access tokens
4. Get Page ID from your business page

#### SendGrid
1. Sign up at https://sendgrid.com/
2. Create API key with Mail Send permissions
3. Verify sender email address

---

## 🏗️ Architecture

```
mkassistant/
├── src/
│   ├── analytics/          # Performance tracking & reporting
│   ├── config/             # Configuration management
│   ├── content/            # Content templates & generation
│   ├── database/           # SQLite database layer
│   ├── email/              # Email marketing automation
│   ├── leads/              # Lead management & scoring
│   ├── platforms/          # Social media integrations
│   ├── scheduler/          # Post scheduling engine
│   ├── seo/                # SEO content generation
│   ├── utils/              # Logging & utilities
│   └── index.ts            # Main application entry
├── data/                   # Database storage
├── logs/                   # Application logs
└── dist/                   # Compiled TypeScript
```

### Key Components

**Content Generator**: Creates diverse posts from 30+ templates
**Platform Manager**: Handles authentication and posting to all social networks
**Scheduler**: Distributes 3-6 posts daily at optimal times
**Analytics Engine**: Tracks performance and generates insights
**Email Manager**: Automates drip campaigns and newsletters
**SEO Generator**: Creates blog posts and landing page content
**Lead Manager**: Captures, scores, and nurtures leads

---

## 📡 API Documentation

### Health Check
```
GET /health
```
Returns system status and uptime.

### Platform Management
```
GET /api/platforms/status
```
Get authentication status of all platforms.

```
POST /api/platforms/authenticate
```
Authenticate with all configured platforms.

### Analytics
```
GET /api/analytics/report?days=7
```
Get comprehensive analytics report.

```
GET /api/analytics/categories
```
Get content performance by category.

```
GET /api/analytics/export?format=json&days=30
```
Export analytics data (JSON or CSV).

### Content
```
GET /api/content/stats
```
Get content generation statistics.

### Scheduling
```
POST /api/scheduler/generate
```
Manually trigger schedule generation.

```
POST /api/scheduler/publish
```
Manually trigger post publishing.

---

## 📦 Modules

### 1. Social Media Automation

**Platforms Supported:**
- Twitter/X
- LinkedIn
- Facebook
- Instagram (requires images)
- Reddit

**Features:**
- Automatic posting 3-6 times daily
- Platform-specific formatting
- Optimal timing based on audience
- Engagement tracking
- Error handling and retry logic

**Content Categories:**
- Feature highlights
- Educational tips
- Use cases
- Pricing/promotions
- Community engagement
- Industry insights

### 2. Email Marketing

**Campaign Types:**
- Welcome series (automated 3-email sequence)
- Trial reminders
- Feature announcements
- Re-engagement campaigns
- Educational newsletters

**Metrics Tracked:**
- Emails sent
- Open rates
- Click-through rates
- Conversion rates

### 3. SEO Content Generation

**Content Types:**
- Long-form blog posts (1500-2500 words)
- Product comparisons
- How-to guides
- Industry insights

**SEO Features:**
- Keyword optimization
- Meta description generation
- Title variations
- SEO quality scoring
- Internal linking suggestions

### 4. Lead Management

**Lead Sources Tracked:**
- Organic search
- Social media (all platforms)
- Direct traffic
- Referrals

**Lead Scoring Factors:**
- Source quality (30 points)
- Interest level (25 points)
- Recency (20 points)
- Engagement (25 points)

**Automated Actions:**
- Auto-qualification of high-engagement leads
- Stale lead detection and re-engagement
- Welcome email triggers
- Hot lead notifications

---

## 🎯 Best Practices

### Social Media
1. **Don't over-automate**: Keep some posts manual for authenticity
2. **Monitor engagement**: Respond to comments and questions
3. **A/B test content**: Track which categories perform best
4. **Respect platform limits**: Stay within API rate limits
5. **Follow ToS**: Ensure automation complies with platform policies

### Email Marketing
1. **Segment your list**: Different messages for different audiences
2. **Test subject lines**: A/B test email subjects
3. **Monitor deliverability**: Watch bounce and spam rates
4. **Provide value**: Don't just promote, educate
5. **Easy unsubscribe**: Always include unsubscribe links

### SEO Content
1. **Quality over quantity**: Better to publish 1 great post than 5 mediocre ones
2. **Update regularly**: Refresh old content to keep it relevant
3. **Internal linking**: Link between your content pieces
4. **Track rankings**: Monitor keyword positions
5. **User intent**: Write for humans first, search engines second

### Lead Management
1. **Quick follow-up**: Contact hot leads within 24 hours
2. **Qualify early**: Don't waste time on poor-fit leads
3. **Nurture systematically**: Use automated drip campaigns
4. **Track sources**: Know which channels produce best leads
5. **Regular cleanup**: Archive old/dead leads

---

## 🔧 Troubleshooting

### Posts Not Publishing

**Symptom**: Scheduler running but posts stay "pending"

**Solutions**:
1. Check platform authentication: `GET /api/platforms/status`
2. Verify API credentials in `.env`
3. Check logs for specific errors: `logs/mkassistant.log`
4. Test manual publishing: `POST /api/scheduler/publish`
5. Verify database has scheduled posts: Check `data/mkassistant.db`

### Email Not Sending

**Symptom**: Email campaigns stuck in "pending"

**Solutions**:
1. Verify SendGrid API key is valid
2. Check sender email is verified in SendGrid
3. Review SendGrid dashboard for blocks/bounces
4. Test with a single recipient first
5. Check daily sending limits

### Low Engagement Rates

**Symptom**: Posts publishing but no engagement

**Solutions**:
1. Review content categories: `GET /api/analytics/categories`
2. Experiment with different post times
3. Increase visual content (images/videos)
4. Add more questions and polls
5. Engage with your audience (replies, comments)

### Database Errors

**Symptom**: "Database locked" or corruption errors

**Solutions**:
1. Stop the application
2. Backup `data/mkassistant.db`
3. Run database integrity check
4. Restart application
5. If corrupted, restore from backup

---

## 📊 Monitoring & Maintenance

### Daily Tasks
- Review `/api/analytics/report?days=1`
- Check hot leads dashboard
- Monitor platform authentication status

### Weekly Tasks
- Review full analytics report (7 days)
- Adjust posting schedule if needed
- Update content templates based on performance
- Follow up with qualified leads

### Monthly Tasks
- Generate comprehensive report (30 days)
- Review and optimize content strategy
- Clean up lead database
- Update SEO content
- Analyze ROI and conversions

---

## 🤝 Support & Contributing

### Getting Help
1. Check documentation first
2. Review logs: `logs/mkassistant.log`
3. Check GitHub issues (if applicable)
4. Contact: support@tradeflows.net

### Contributing
This is a proprietary marketing tool for Tradeflows Pro. For feature requests or bug reports, contact the development team.

---

## 📝 License

Proprietary - Tradeflows Pro Marketing System

---

## 🎉 Success Metrics

After deployment, you should see:

- **3-6 posts daily** across all platforms
- **Consistent engagement** (likes, comments, shares)
- **Growing email list** with 20-30% open rates
- **New leads daily** from multiple sources
- **10-15% lead conversion rate**
- **SEO traffic growth** from blog content

---

## 🚀 Deployment Checklist

- [ ] All API credentials configured
- [ ] Database initialized (`data/mkassistant.db` created)
- [ ] Scheduler started and running
- [ ] All platforms authenticated
- [ ] Initial posts scheduled
- [ ] Email templates configured
- [ ] Lead capture forms deployed
- [ ] Analytics dashboard accessible
- [ ] Monitoring and alerts set up
- [ ] Backup strategy in place

---

**Built with ❤️ for Tradeflows Pro**

*Automated marketing at scale - Because you have better things to do than post manually 1000 times.*
