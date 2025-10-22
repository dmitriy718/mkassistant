# 🔧 Marketing Assistant Setup Guide

Complete step-by-step guide to get your marketing automation system up and running.

---

## Part 1: Social Media Platform Setup

### Twitter/X Setup (15 minutes)

1. **Create Developer Account**
   - Visit https://developer.twitter.com/
   - Click "Sign up" and follow the application process
   - You'll need to explain your use case: "Automated marketing for business"

2. **Create a New App**
   - Go to Developer Portal → Projects & Apps
   - Create a new app
   - Name: "Tradeflows Marketing Bot"
   - Description: "Automated marketing posts for Tradeflows Pro"

3. **Generate Credentials**
   - Go to Keys and Tokens
   - Generate:
     - API Key and Secret
     - Access Token and Secret
     - Bearer Token
   - **IMPORTANT**: Copy these immediately - you can't see them again!

4. **Set Permissions**
   - Go to App Settings → User authentication settings
   - Enable OAuth 1.0a
   - Set permissions to "Read and Write"
   - Save

5. **Add to .env**
   ```
   TWITTER_API_KEY=your_api_key_here
   TWITTER_API_SECRET=your_api_secret_here
   TWITTER_ACCESS_TOKEN=your_access_token_here
   TWITTER_ACCESS_SECRET=your_access_secret_here
   TWITTER_BEARER_TOKEN=your_bearer_token_here
   ```

### LinkedIn Setup (20 minutes)

1. **Create LinkedIn Page** (if you don't have one)
   - Go to linkedin.com → Work → Create a Company Page
   - Fill in Tradeflows Pro details

2. **Create Developer App**
   - Visit https://www.linkedin.com/developers/
   - Click "Create app"
   - Fill in details:
     - App name: "Tradeflows Marketing"
     - LinkedIn Page: Select your company page
     - App logo: Upload Tradeflows logo

3. **Request Products Access**
   - In your app, go to Products tab
   - Request access to:
     - "Sign In with LinkedIn"
     - "Share on LinkedIn"
     - "Marketing Developer Platform" (if available)
   - Wait for approval (usually instant for basic access)

4. **Generate Credentials**
   - Go to Auth tab
   - Copy Client ID and Client Secret
   - Add redirect URL: `http://localhost:3000/auth/linkedin/callback`

5. **Generate Access Token**
   - Use LinkedIn's OAuth 2.0 tool or Postman
   - Get long-lived access token
   - Store securely

6. **Add to .env**
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_ACCESS_TOKEN=your_access_token
   ```

### Facebook Setup (20 minutes)

1. **Create Facebook Business Page** (if needed)
   - Go to facebook.com/pages/create
   - Choose "Business or Brand"
   - Fill in Tradeflows Pro details

2. **Create Developer App**
   - Visit https://developers.facebook.com/
   - Click "Create App"
   - Choose "Business" type
   - App name: "Tradeflows Marketing"

3. **Add Products**
   - Add "Facebook Login"
   - Add "Instagram Graph API" (if using Instagram)

4. **Generate Access Token**
   - Go to Tools → Graph API Explorer
   - Select your app
   - Add permissions:
     - `pages_manage_posts`
     - `pages_read_engagement`
     - `instagram_basic`
     - `instagram_content_publish`
   - Generate User Access Token
   - Use Access Token Debugger to extend to long-lived token

5. **Get Page ID**
   - Go to your Facebook page
   - About section → Page ID
   - Or use Graph API Explorer: `/me/accounts`

6. **Add to .env**
   ```
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   FACEBOOK_ACCESS_TOKEN=your_long_lived_token
   FACEBOOK_PAGE_ID=your_page_id
   ```

### Reddit Setup (10 minutes)

1. **Create Reddit App**
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create another app"
   - Choose "script"
   - Name: "Tradeflows Marketing"
   - Redirect URI: `http://localhost:8080`

2. **Get Credentials**
   - Client ID: String below "personal use script"
   - Client Secret: Listed as "secret"

3. **Add to .env**
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   ```

⚠️ **Reddit Notes**:
- Be very careful with Reddit - they have strict anti-spam rules
- Only post to relevant subreddits (r/algotrading, r/Trading, r/stocks)
- Follow each subreddit's self-promotion rules
- Consider manual posting to Reddit initially

### Instagram Setup (15 minutes)

Instagram requires a Facebook Business account and connection.

1. **Connect Instagram to Facebook Page**
   - Go to your Facebook Page settings
   - Instagram → Connect Account
   - Log in to Instagram business account

2. **Get Instagram Account ID**
   - Use Graph API Explorer
   - Query: `/me/accounts` to get Page ID
   - Then query: `/{page-id}?fields=instagram_business_account`

3. **Add to .env**
   ```
   INSTAGRAM_ACCESS_TOKEN=same_as_facebook_token
   INSTAGRAM_ACCOUNT_ID=your_instagram_business_id
   ```

⚠️ **Instagram Notes**:
- Requires Business or Creator account
- Must have at least 100 followers
- All posts require images (handled by platform module)

---

## Part 2: Email Marketing Setup

### SendGrid Setup (10 minutes)

1. **Create SendGrid Account**
   - Visit https://sendgrid.com/
   - Sign up (free tier: 100 emails/day)
   - Verify email address

2. **Create API Key**
   - Go to Settings → API Keys
   - Create API Key
   - Name: "Tradeflows Marketing"
   - Permissions: Full Access (or just Mail Send)
   - Copy the key immediately!

3. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Choose "Single Sender Verification"
   - Add contact@tradeflows.net
   - Check email and verify

4. **Add to .env**
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=contact@tradeflows.net
   ```

---

## Part 3: Application Configuration

### 1. Clone and Install

```bash
cd C:\Users\dmitr\Projects\mkassistant
npm install
```

### 2. Create .env File

```bash
cp .env.example .env
```

Edit `.env` with all your credentials from above.

### 3. Configure Settings

Edit these as needed:
```env
# How many posts per day?
POSTS_PER_DAY_MIN=3
POSTS_PER_DAY_MAX=6

# Your timezone
TIMEZONE=America/New_York

# Database location
DATABASE_PATH=./data/mkassistant.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/mkassistant.log
```

### 4. Build the Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 5. Start the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 6. Verify Setup

1. Open http://localhost:3000 in your browser
2. You should see the dashboard
3. Check platform status: http://localhost:3000/api/platforms/status
4. All platforms should show `authenticated: true`

---

## Part 4: Initial Configuration

### 1. Authenticate All Platforms

```bash
curl -X POST http://localhost:3000/api/platforms/authenticate
```

Or click "Authenticate Platforms" button in dashboard.

### 2. Generate First Schedule

```bash
curl -X POST http://localhost:3000/api/scheduler/generate
```

This creates the posting schedule for today.

### 3. Test Publishing

⚠️ **Testing Mode**: Before going live, test with a single post:

1. Check database for scheduled posts:
   ```sql
   sqlite3 data/mkassistant.db "SELECT * FROM posts WHERE status='pending' LIMIT 1"
   ```

2. Manually publish one post:
   ```bash
   curl -X POST http://localhost:3000/api/scheduler/publish
   ```

3. Verify it appeared on your social accounts

### 4. Monitor First Day

- Check logs: `tail -f logs/mkassistant.log`
- View dashboard: http://localhost:3000
- Check analytics: http://localhost:3000/api/analytics/report?days=1

---

## Part 5: Optional Enhancements

### Add OpenAI Integration (Optional)

For AI-enhanced content generation:

1. Get API key from https://platform.openai.com/
2. Add to `.env`:
   ```
   OPENAI_API_KEY=your_openai_key
   ```
3. Modify content generator to use OpenAI API

### Set Up Webhooks (Optional)

For real-time lead capture from your website:

```javascript
// Add to your website
fetch('http://your-server:3000/api/leads/capture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    source: 'website'
  })
});
```

### Database Backups

Set up automated backups:

```bash
# Linux/Mac - Add to crontab
0 2 * * * cp /path/to/mkassistant/data/mkassistant.db /path/to/backups/mkassistant-$(date +\%Y\%m\%d).db

# Windows - Task Scheduler
copy C:\Users\dmitr\Projects\mkassistant\data\mkassistant.db C:\Backups\mkassistant-%date:~-4,4%%date:~-10,2%%date:~-7,2%.db
```

---

## Troubleshooting Common Setup Issues

### "Authentication failed" for Twitter

**Problem**: Invalid API credentials

**Solution**:
1. Regenerate all tokens in Twitter Developer Portal
2. Make sure app has Read + Write permissions
3. Use the v2 API (not v1.1)
4. Check if Developer account is fully approved

### "Access token expired" for Facebook/LinkedIn

**Problem**: Short-lived tokens expire quickly

**Solution**:
1. Use Graph API Explorer to generate long-lived token (Facebook)
2. For LinkedIn, use OAuth 2.0 flow to get refresh tokens
3. Implement token refresh logic (advanced)

### "Rate limit exceeded"

**Problem**: Too many API requests

**Solution**:
1. Reduce `POSTS_PER_DAY_MAX` in .env
2. Check platform rate limits
3. Add delays between posts (already implemented)

### Database locked errors

**Problem**: Multiple processes accessing database

**Solution**:
1. Ensure only one instance of app is running
2. Check for zombie node processes: `ps aux | grep node`
3. Kill and restart: `killall node && npm start`

### Posts not appearing on social media

**Problem**: Could be many things

**Solutions**:
1. Check logs for specific error messages
2. Verify content meets platform requirements (length, format)
3. Check platform posting permissions
4. Try posting manually through platform's API test console
5. Ensure account isn't shadowbanned or restricted

---

## Next Steps After Setup

1. **Week 1: Monitor and Adjust**
   - Watch daily analytics
   - Fine-tune posting times
   - Adjust content mix based on engagement

2. **Week 2: Optimize Content**
   - Identify best-performing categories
   - Create more similar content
   - A/B test different styles

3. **Week 3: Scale Up**
   - Increase posting frequency if engagement is good
   - Add more platforms
   - Set up email campaigns

4. **Week 4: Automate Fully**
   - Let system run autonomously
   - Weekly check-ins only
   - Focus on lead follow-up

---

## Support

If you encounter issues:

1. Check logs: `logs/mkassistant.log`
2. Review this guide again
3. Check platform-specific documentation
4. Contact: support@tradeflows.net

---

**Congratulations! Your marketing automation system is ready to scale Tradeflows Pro! 🚀**
