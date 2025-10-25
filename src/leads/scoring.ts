/**
 * Lead Scoring Engine for TradeFlows Marketing Automation
 *
 * Scores leads based on engagement and behavior to prioritize sales outreach
 */

import db, { queries } from '../database';
import logger from '../utils/logger';

export interface LeadScore {
  email: string;
  score: number;
  factors: {
    emailOpens: number;
    linkClicks: number;
    pricingViews: number;
    trialSignups: number;
    touchpoints: number;
  };
  priority: 'hot' | 'warm' | 'cold';
  lastUpdated: Date;
}

// Scoring weights
const SCORING_WEIGHTS = {
  EMAIL_OPEN: 5,
  LINK_CLICK: 10,
  PRICING_PAGE_VIEW: 15,
  TRIAL_SIGNUP: 50,
  MULTIPLE_TOUCHPOINT: 5,
  FORM_SUBMISSION: 20,
};

// Priority thresholds
const PRIORITY_THRESHOLDS = {
  HOT: 80,  // 80+ points = hot lead
  WARM: 40, // 40-79 points = warm lead
  // < 40 = cold lead
};

/**
 * Calculate lead score based on engagement factors
 */
export function calculateLeadScore(factors: LeadScore['factors']): number {
  let score = 0;

  score += factors.emailOpens * SCORING_WEIGHTS.EMAIL_OPEN;
  score += factors.linkClicks * SCORING_WEIGHTS.LINK_CLICK;
  score += factors.pricingViews * SCORING_WEIGHTS.PRICING_PAGE_VIEW;
  score += factors.trialSignups * SCORING_WEIGHTS.TRIAL_SIGNUP;
  score += factors.touchpoints * SCORING_WEIGHTS.MULTIPLE_TOUCHPOINT;

  return Math.min(score, 100); // Cap at 100
}

/**
 * Determine priority level based on score
 */
export function getPriorityLevel(score: number): LeadScore['priority'] {
  if (score >= PRIORITY_THRESHOLDS.HOT) return 'hot';
  if (score >= PRIORITY_THRESHOLDS.WARM) return 'warm';
  return 'cold';
}

/**
 * Update lead score in database
 */
export function updateLeadScore(email: string, score: number, priority: string): void {
  try {
    const stmt = db.prepare(`
      UPDATE leads
      SET
        interest_level = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `);

    stmt.run(priority, email);
    logger.debug(`Updated lead score for ${email}: ${score} (${priority})`);
  } catch (error) {
    logger.error('Error updating lead score:', error);
    throw error;
  }
}

/**
 * Track email open event
 */
export function trackEmailOpen(email: string): void {
  try {
    // Get current factors
    const lead = db.prepare('SELECT * FROM leads WHERE email = ?').get(email) as any;

    if (!lead) {
      logger.warn(`Lead not found for email: ${email}`);
      return;
    }

    // Increment email opens (stored in notes as JSON for now)
    const factors = parseLeadFactors(lead.notes);
    factors.emailOpens += 1;
    factors.touchpoints += 1;

    const score = calculateLeadScore(factors);
    const priority = getPriorityLevel(score);

    // Update database
    db.prepare(`
      UPDATE leads
      SET
        interest_level = ?,
        notes = ?,
        last_interaction = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(priority, JSON.stringify(factors), email);

    logger.info(`📧 Email open tracked for ${email}, new score: ${score} (${priority})`);

    // Trigger notification for hot leads
    if (priority === 'hot' && lead.interest_level !== 'hot') {
      notifyHotLead(email, score);
    }
  } catch (error) {
    logger.error('Error tracking email open:', error);
  }
}

/**
 * Track link click event
 */
export function trackLinkClick(email: string, linkUrl: string): void {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE email = ?').get(email) as any;

    if (!lead) return;

    const factors = parseLeadFactors(lead.notes);
    factors.linkClicks += 1;
    factors.touchpoints += 1;

    // Bonus for pricing page views
    if (linkUrl.includes('/pricing')) {
      factors.pricingViews += 1;
    }

    const score = calculateLeadScore(factors);
    const priority = getPriorityLevel(score);

    db.prepare(`
      UPDATE leads
      SET
        interest_level = ?,
        notes = ?,
        last_interaction = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(priority, JSON.stringify(factors), email);

    logger.info(`🔗 Link click tracked for ${email}, new score: ${score} (${priority})`);

    if (priority === 'hot' && lead.interest_level !== 'hot') {
      notifyHotLead(email, score);
    }
  } catch (error) {
    logger.error('Error tracking link click:', error);
  }
}

/**
 * Track trial signup (highest value action)
 */
export function trackTrialSignup(email: string): void {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE email = ?').get(email) as any;

    if (!lead) {
      // Create new lead if doesn't exist
      queries.insertLead.run(email, null, 'trial_signup', 'hot');
    }

    const factors = parseLeadFactors(lead?.notes);
    factors.trialSignups += 1;
    factors.touchpoints += 1;

    const score = calculateLeadScore(factors);
    const priority = getPriorityLevel(score); // Will always be 'hot' due to +50 points

    db.prepare(`
      UPDATE leads
      SET
        interest_level = ?,
        notes = ?,
        status = 'trial',
        last_interaction = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(priority, JSON.stringify(factors), email);

    logger.info(`🎉 Trial signup tracked for ${email}, new score: ${score} (${priority})`);
    notifyHotLead(email, score);
  } catch (error) {
    logger.error('Error tracking trial signup:', error);
  }
}

/**
 * Get top hot leads for sales dashboard
 */
export function getHotLeads(limit = 20): LeadScore[] {
  try {
    const leads = db.prepare(`
      SELECT * FROM leads
      WHERE interest_level = 'hot'
      ORDER BY last_interaction DESC
      LIMIT ?
    `).all(limit) as any[];

    return leads.map(lead => {
      const factors = parseLeadFactors(lead.notes);
      const score = calculateLeadScore(factors);

      return {
        email: lead.email,
        score,
        factors,
        priority: 'hot',
        lastUpdated: new Date(lead.updated_at),
      };
    });
  } catch (error) {
    logger.error('Error fetching hot leads:', error);
    return [];
  }
}

/**
 * Get all leads with scores
 */
export function getAllLeadsWithScores(): LeadScore[] {
  try {
    const leads = db.prepare(`
      SELECT * FROM leads
      ORDER BY last_interaction DESC
    `).all() as any[];

    return leads.map(lead => {
      const factors = parseLeadFactors(lead.notes);
      const score = calculateLeadScore(factors);
      const priority = getPriorityLevel(score);

      return {
        email: lead.email,
        score,
        factors,
        priority,
        lastUpdated: new Date(lead.updated_at),
      };
    });
  } catch (error) {
    logger.error('Error fetching all leads:', error);
    return [];
  }
}

/**
 * Parse lead factors from notes JSON
 */
function parseLeadFactors(notesJson?: string): LeadScore['factors'] {
  const defaultFactors: LeadScore['factors'] = {
    emailOpens: 0,
    linkClicks: 0,
    pricingViews: 0,
    trialSignups: 0,
    touchpoints: 0,
  };

  if (!notesJson) return defaultFactors;

  try {
    return { ...defaultFactors, ...JSON.parse(notesJson) };
  } catch {
    return defaultFactors;
  }
}

/**
 * Notify sales team of hot lead (placeholder for integration)
 */
function notifyHotLead(email: string, score: number): void {
  logger.info(`🔥 HOT LEAD ALERT: ${email} scored ${score} points!`);
  // TODO: Send notification via Slack, email, or webhook
  // TODO: Trigger automated follow-up sequence
}

/**
 * Recalculate scores for all leads (maintenance task)
 */
export function recalculateAllScores(): void {
  logger.info('Recalculating scores for all leads...');

  try {
    const leads = db.prepare('SELECT * FROM leads').all() as any[];

    for (const lead of leads) {
      const factors = parseLeadFactors(lead.notes);
      const score = calculateLeadScore(factors);
      const priority = getPriorityLevel(score);

      db.prepare(`
        UPDATE leads
        SET interest_level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(priority, lead.email);
    }

    logger.info(`✅ Recalculated scores for ${leads.length} leads`);
  } catch (error) {
    logger.error('Error recalculating scores:', error);
  }
}
