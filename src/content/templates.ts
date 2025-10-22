export interface ContentTemplate {
  id: string;
  category: string;
  platform: string[];
  template: string;
  hashtags?: string[];
  callToAction?: string;
  mediaType?: 'text' | 'image' | 'video';
}

// Comprehensive template library for Tradeflows Pro
export const contentTemplates: ContentTemplate[] = [
  // Feature Highlights
  {
    id: 'feature_realtime_charts',
    category: 'feature',
    platform: ['twitter', 'linkedin', 'facebook'],
    template: '📊 Real-time market data at your fingertips! TradeFlows Pro delivers professional-grade charts with multiple timeframes (1m to 1d). Make informed decisions with live data powered by Alpaca Markets.',
    hashtags: ['TradingPlatform', 'StockMarket', 'MarketData', 'TradingTools'],
    callToAction: 'Start your 14-day free trial: https://tradeflows.net',
  },
  {
    id: 'feature_ai_strategies',
    category: 'feature',
    platform: ['twitter', 'linkedin'],
    template: '🤖 AI-Powered Trading Strategies: RSI Mean Reversion, MACD Trend Following, Bollinger Band Breakouts & Momentum Flash Signals. Let TradeFlows Pro\'s algorithms work for you!',
    hashtags: ['AITrading', 'AlgoTrading', 'TradingStrategy', 'AutomatedTrading'],
    callToAction: 'Try AI strategies free for 14 days: https://tradeflows.net',
  },
  {
    id: 'feature_portfolio_mgmt',
    category: 'feature',
    platform: ['linkedin', 'facebook'],
    template: '💼 Complete Portfolio Management Suite: Track multiple portfolios, monitor real-time P&L, visualize asset allocation, and maintain detailed transaction history. Professional portfolio tools at your command.',
    hashtags: ['PortfolioManagement', 'InvestmentTools', 'WealthManagement'],
    callToAction: 'Elevate your portfolio management: https://tradeflows.net',
  },
  {
    id: 'feature_backtesting',
    category: 'feature',
    platform: ['twitter', 'linkedin'],
    template: '⚡ Backtest before you invest! TradeFlows Pro\'s backtesting engine lets you validate strategies with historical data & performance metrics. Trade with confidence, backed by data.',
    hashtags: ['Backtesting', 'TradingStrategy', 'DataDrivenTrading', 'SmartInvesting'],
    callToAction: 'Test drive our backtesting engine: https://tradeflows.net',
  },

  // Use Cases & Success Stories
  {
    id: 'usecase_daytrader',
    category: 'usecase',
    platform: ['twitter', 'reddit'],
    template: 'Day traders: Imagine having 4 AI strategies running in parallel, scanning markets 24/7. TradeFlows Pro turns your trading desk into a command center with real-time signals and instant alerts.',
    hashtags: ['DayTrading', 'ActiveTrading', 'TradingSignals'],
    callToAction: '14-day free trial, no credit card: https://tradeflows.net',
  },
  {
    id: 'usecase_swing_trader',
    category: 'usecase',
    platform: ['linkedin', 'facebook'],
    template: 'Swing traders, this is your edge: Set up price alerts, analyze multiple timeframes, and let AI strategies identify opportunities while you focus on the big picture. Professional tools, simplified.',
    hashtags: ['SwingTrading', 'TradingStrategy', 'Investing'],
    callToAction: 'Discover your trading edge: https://tradeflows.net',
  },
  {
    id: 'usecase_portfolio_investor',
    category: 'usecase',
    platform: ['linkedin', 'facebook'],
    template: 'Long-term investors: Track all your positions in one place, monitor performance with visual analytics, and get alerts when your holdings hit key levels. TradeFlows Pro is your investment control center.',
    hashtags: ['Investing', 'PortfolioTracking', 'WealthBuilding', 'SmartInvesting'],
    callToAction: 'Start managing smarter: https://tradeflows.net',
  },

  // Educational Content
  {
    id: 'education_rsi',
    category: 'education',
    platform: ['twitter', 'linkedin', 'reddit'],
    template: '📚 Trading Tip: RSI (Relative Strength Index) helps identify overbought/oversold conditions. TradeFlows Pro\'s RSI Mean Reversion strategy automatically spots these opportunities. Learn more about how momentum indicators can improve your trading!',
    hashtags: ['TradingEducation', 'RSI', 'TechnicalAnalysis', 'LearnToTrade'],
    callToAction: 'Experience AI-powered RSI analysis: https://tradeflows.net',
  },
  {
    id: 'education_macd',
    category: 'education',
    platform: ['twitter', 'linkedin'],
    template: '📈 MACD Explained: Moving Average Convergence Divergence is a trend-following indicator that shows momentum strength. Our MACD strategy identifies trend changes automatically, so you never miss a move!',
    hashtags: ['MACD', 'TradingEducation', 'TechnicalAnalysis', 'TradingStrategy'],
    callToAction: 'See MACD in action with our free trial: https://tradeflows.net',
  },
  {
    id: 'education_diversification',
    category: 'education',
    platform: ['linkedin', 'facebook'],
    template: '💡 Portfolio Wisdom: Diversification isn\'t just about different stocks—it\'s about strategies too! TradeFlows Pro lets you run multiple AI strategies simultaneously, spreading your approach across momentum, trend-following, and mean reversion.',
    hashtags: ['InvestmentStrategy', 'Diversification', 'SmartInvesting'],
    callToAction: 'Build a diversified strategy portfolio: https://tradeflows.net',
  },

  // Value Propositions & Pricing
  {
    id: 'value_free_tier',
    category: 'pricing',
    platform: ['twitter', 'facebook', 'reddit'],
    template: '🎁 FREE Forever: Get started with TradeFlows Pro\'s free tier! Professional charts, 3 watchlists, and real-time data. Zero cost, zero commitment. Upgrade only when you\'re ready for AI strategies.',
    hashtags: ['FreeTradingTools', 'StockMarket', 'FreeTrading'],
    callToAction: 'Sign up free today: https://tradeflows.net',
  },
  {
    id: 'value_premium',
    category: 'pricing',
    platform: ['twitter', 'linkedin'],
    template: '⚡ Premium Plan: $29/month unlocks 4 AI trading strategies, unlimited watchlists, and advanced analytics. That\'s less than $1/day for professional-grade trading intelligence. Try it free for 14 days!',
    hashtags: ['TradingPlan', 'InvestmentTools', 'TradingSoftware'],
    callToAction: 'Start your 14-day free trial: https://tradeflows.net',
  },
  {
    id: 'value_pro_tier',
    category: 'pricing',
    platform: ['linkedin', 'facebook'],
    template: '🚀 Pro Tier ($99/mo): Custom strategies, advanced analytics, priority support, and unlimited API requests. Built for serious traders who demand enterprise-grade tools. 14-day free trial included.',
    hashtags: ['ProfessionalTrading', 'TradingTools', 'EnterpriseGrade'],
    callToAction: 'Unlock Pro features: https://tradeflows.net',
  },

  // Comparison & Differentiation
  {
    id: 'comparison_traditional',
    category: 'comparison',
    platform: ['twitter', 'linkedin'],
    template: 'Traditional platforms charge $100+/month for basic features. TradeFlows Pro delivers AI strategies, real-time data, and portfolio management starting at FREE. Professional tools shouldn\'t break the bank.',
    hashtags: ['TradingValue', 'AffordableTrading', 'SmartChoice'],
    callToAction: 'Compare for yourself: https://tradeflows.net',
  },
  {
    id: 'comparison_manual_vs_ai',
    category: 'comparison',
    platform: ['linkedin', 'reddit'],
    template: 'Manual analysis vs. AI-powered: While you\'re analyzing one chart, TradeFlows Pro\'s AI scans hundreds of signals across multiple strategies. It\'s not about replacing your judgment—it\'s about enhancing it with data-driven insights.',
    hashtags: ['AITrading', 'SmartTrading', 'TradingEdge'],
    callToAction: 'See the AI advantage: https://tradeflows.net',
  },

  // Social Proof & Testimonials (generic until you have real ones)
  {
    id: 'social_proof_features',
    category: 'social_proof',
    platform: ['twitter', 'facebook'],
    template: 'What traders love about TradeFlows Pro: ✅ Real-time data that\'s actually real-time ✅ AI strategies that actually work ✅ Pricing that\'s actually fair. Join traders who are leveling up their game.',
    hashtags: ['TradingCommunity', 'TraderLife', 'StockTrading'],
    callToAction: 'Join the community: https://tradeflows.net',
  },

  // Promotions & Urgency
  {
    id: 'promo_trial',
    category: 'promotion',
    platform: ['twitter', 'facebook', 'reddit'],
    template: '⏰ 14-Day Free Trial: Full access to Premium features. No credit card required. Cancel anytime. Test AI strategies, unlimited watchlists, and advanced analytics risk-free. What do you have to lose?',
    hashtags: ['FreeTrial', 'TradingTools', 'TryBeforeYouBuy'],
    callToAction: 'Start your free trial: https://tradeflows.net',
  },
  {
    id: 'promo_new_platform',
    category: 'promotion',
    platform: ['twitter', 'linkedin', 'facebook'],
    template: '🎉 TradeFlows Pro is now live! We\'ve built the trading platform we wished existed: AI-powered strategies, real-time data, portfolio management, all starting FREE. Built by traders, for traders.',
    hashtags: ['NewPlatform', 'TradingLaunch', 'TradingTools'],
    callToAction: 'Explore the platform: https://tradeflows.net',
  },

  // Problem/Solution Posts
  {
    id: 'problem_missed_signals',
    category: 'problem_solution',
    platform: ['twitter', 'reddit'],
    template: 'Tired of missing trades because you weren\'t watching? TradeFlows Pro\'s AI strategies monitor markets 24/7 and send instant alerts when opportunities appear. Never miss a signal again.',
    hashtags: ['TradingAlerts', 'SmartTrading', 'TradingSignals'],
    callToAction: 'Set up your AI watchdog: https://tradeflows.net',
  },
  {
    id: 'problem_expensive_tools',
    category: 'problem_solution',
    platform: ['linkedin', 'facebook'],
    template: 'Professional trading tools shouldn\'t cost $500/month. TradeFlows Pro brings enterprise-grade features to individual traders at a fraction of traditional platform costs. Premium tier: just $29/month.',
    hashtags: ['AffordableTrading', 'TradingValue', 'SmartInvesting'],
    callToAction: 'See our transparent pricing: https://tradeflows.net',
  },

  // Technical Features for Developers/Power Users
  {
    id: 'technical_performance',
    category: 'technical',
    platform: ['twitter', 'reddit'],
    template: '⚡ Built for speed: React 19, TypeScript, Web Workers for calculations, and LightWeight Charts for blazing-fast visualization. TradeFlows Pro is engineered for performance. Sub-100ms chart updates, even with complex indicators.',
    hashtags: ['TradingTech', 'PerformanceMatters', 'ModernTrading'],
    callToAction: 'Experience the speed: https://tradeflows.net',
  },
  {
    id: 'technical_stack',
    category: 'technical',
    platform: ['twitter', 'linkedin'],
    template: '🛠️ Tech stack: Built with React 19, TypeScript, Vite, and professional-grade charting. Open architecture, real-time WebSocket connections, and Web Workers for non-blocking calculations. Modern tech for modern trading.',
    hashtags: ['TradingPlatform', 'TechStack', 'ModernArchitecture'],
    callToAction: 'Built by devs who trade: https://tradeflows.net',
  },

  // Engagement & Questions
  {
    id: 'engagement_strategy_poll',
    category: 'engagement',
    platform: ['twitter', 'linkedin'],
    template: 'Question for traders: What\'s your primary trading strategy? A) Momentum/Trend Following B) Mean Reversion C) Breakouts D) Mix of multiple strategies\n\nTradeFlows Pro supports all of these with AI-powered execution!',
    hashtags: ['TradingStrategy', 'TradingPoll', 'TraderCommunity'],
    callToAction: 'Try all strategies with our free trial: https://tradeflows.net',
  },
  {
    id: 'engagement_biggest_challenge',
    category: 'engagement',
    platform: ['reddit', 'twitter'],
    template: 'What\'s your biggest challenge in trading? For us, it was finding tools that were powerful yet affordable. That\'s why we built TradeFlows Pro. What pain points are you dealing with?',
    hashtags: ['TradingCommunity', 'TradingLife', 'TraderProblems'],
    callToAction: 'See if we solved your problem: https://tradeflows.net',
  },

  // Weekend/Casual Posts
  {
    id: 'casual_weekend',
    category: 'casual',
    platform: ['twitter', 'facebook'],
    template: '📊 Weekend prep: Use TradeFlows Pro to review your watchlists, check strategy performance, and set up alerts for Monday. Smart traders plan ahead. The markets wait for no one.',
    hashtags: ['WeekendTrading', 'TradingPrep', 'MarketReady'],
    callToAction: 'Get market-ready: https://tradeflows.net',
  },
  {
    id: 'casual_motivation',
    category: 'casual',
    platform: ['twitter', 'facebook', 'instagram'],
    template: '💪 Every expert trader was once a beginner. The difference? They had the right tools and kept learning. TradeFlows Pro gives you the professional-grade tools. You bring the dedication.',
    hashtags: ['TradingMotivation', 'InvestingJourney', 'TraderMindset'],
    callToAction: 'Start your journey: https://tradeflows.net',
  },

  // Specific Feature Deep Dives
  {
    id: 'deepdive_watchlists',
    category: 'feature_deepdive',
    platform: ['linkedin', 'reddit'],
    template: 'Watchlist Management Done Right: Organize by sector, strategy, or risk level. Set price alerts, track daily changes, and analyze patterns. Premium users get unlimited watchlists. Keep every opportunity on your radar.',
    hashtags: ['Watchlist', 'StockTracking', 'MarketWatch'],
    callToAction: 'Build your ultimate watchlist: https://tradeflows.net',
  },
  {
    id: 'deepdive_alerts',
    category: 'feature_deepdive',
    platform: ['twitter', 'facebook'],
    template: '🔔 Smart Alerts: Price crosses a threshold? Get notified. Strategy generates a signal? Get notified. Portfolio hits a P&L target? Get notified. TradeFlows Pro keeps you informed without overwhelming you.',
    hashtags: ['TradingAlerts', 'PriceAlerts', 'SmartNotifications'],
    callToAction: 'Never miss a move: https://tradeflows.net',
  },

  // Industry News Commentary (evergreen)
  {
    id: 'industry_volatility',
    category: 'industry',
    platform: ['twitter', 'linkedin'],
    template: 'Market volatility = opportunity for prepared traders. TradeFlows Pro\'s AI strategies excel in volatile conditions, identifying signals that manual analysis might miss. Are you prepared for the next big move?',
    hashtags: ['MarketVolatility', 'TradingOpportunity', 'SmartTrading'],
    callToAction: 'Prepare with professional tools: https://tradeflows.net',
  },
  {
    id: 'industry_retail_traders',
    category: 'industry',
    platform: ['linkedin', 'reddit'],
    template: 'The democratization of trading tools is here. What used to require $10K+ institutional software is now accessible to retail traders. TradeFlows Pro is part of this revolution: professional tools, retail pricing.',
    hashtags: ['RetailTrading', 'TradingRevolution', 'FinTech'],
    callToAction: 'Join the trading revolution: https://tradeflows.net',
  },
];

// Platform-specific character limits and best practices
export const platformSpecs = {
  twitter: {
    maxLength: 280,
    optimalHashtags: 2-4,
    bestPostTimes: ['9:00', '12:00', '17:00', '20:00'], // EST
  },
  linkedin: {
    maxLength: 3000,
    optimalHashtags: 3-5,
    bestPostTimes: ['7:00', '12:00', '17:00'], // EST, business hours
  },
  facebook: {
    maxLength: 63206,
    optimalHashtags: 2-3,
    bestPostTimes: ['13:00', '15:00', '19:00'], // EST
  },
  instagram: {
    maxLength: 2200,
    optimalHashtags: 8-11,
    bestPostTimes: ['11:00', '14:00', '19:00'], // EST
    requiresImage: true,
  },
  reddit: {
    maxLength: 40000,
    optimalHashtags: 0, // Reddit doesn't use hashtags
    bestPostTimes: ['6:00', '8:00', '16:00', '21:00'], // EST
  },
};
