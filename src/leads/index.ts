import { format, differenceInDays } from 'date-fns';
import logger from '../utils/logger';
import db, { queries } from '../database';
import emailManager from '../email';

export interface Lead {
  id?: number;
  email: string;
  name?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  interestLevel?: 'low' | 'medium' | 'high';
  lastInteraction?: Date;
  converted?: boolean;
  conversionDate?: Date;
  notes?: string;
}

export interface LeadScore {
  score: number;
  factors: Record<string, number>;
  recommendation: string;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
}

export class LeadManager {
  /**
   * Capture a new lead
   */
  public async captureLead(
    email: string,
    name: string | null,
    source: string,
    interestLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<number | null> {
    try {
      const result = queries.insertLead.run(email, name, source, interestLevel);

      logger.info(`Captured new lead: ${email} from ${source}`);

      // Trigger welcome email campaign
      if (name) {
        await emailManager.setupWelcomeDripCampaign(email, name);
      }

      return result.lastInsertRowid as number;

    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        logger.info(`Lead ${email} already exists, updated interaction time`);
        return null;
      }
      logger.error('Error capturing lead:', error);
      return null;
    }
  }

  /**
   * Update lead status
   */
  public updateLeadStatus(
    leadId: number,
    status: Lead['status'],
    notes?: string
  ): boolean {
    try {
      db.prepare(`
        UPDATE leads
        SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, notes, leadId);

      logger.info(`Updated lead ${leadId} status to ${status}`);
      return true;

    } catch (error) {
      logger.error('Error updating lead status:', error);
      return false;
    }
  }

  /**
   * Mark lead as converted
   */
  public convertLead(leadId: number, conversionNotes?: string): boolean {
    try {
      db.prepare(`
        UPDATE leads
        SET
          status = 'converted',
          converted = 1,
          conversion_date = CURRENT_TIMESTAMP,
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(conversionNotes, leadId);

      logger.info(`Lead ${leadId} converted successfully! 🎉`);
      return true;

    } catch (error) {
      logger.error('Error converting lead:', error);
      return false;
    }
  }

  /**
   * Calculate lead score based on various factors
   */
  public calculateLeadScore(leadId: number): LeadScore {
    try {
      const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(leadId) as any;

      if (!lead) {
        return {
          score: 0,
          factors: {},
          recommendation: 'Lead not found'
        };
      }

      const factors: Record<string, number> = {};
      let totalScore = 0;

      // Source quality (max 30 points)
      const sourceScores: Record<string, number> = {
        'organic_search': 30,
        'linkedin': 25,
        'twitter': 20,
        'reddit': 18,
        'facebook': 15,
        'instagram': 12,
        'referral': 35,
        'direct': 25
      };
      const sourceScore = sourceScores[lead.source] || 15;
      factors['source_quality'] = sourceScore;
      totalScore += sourceScore;

      // Interest level (max 25 points)
      const interestScores: Record<string, number> = { 'high': 25, 'medium': 15, 'low': 5 };
      const interestScore = interestScores[lead.interest_level as string] || 15;
      factors['interest_level'] = interestScore;
      totalScore += interestScore;

      // Recency (max 20 points)
      const lastInteraction = lead.last_interaction
        ? new Date(lead.last_interaction)
        : new Date(lead.created_at);
      const daysSinceInteraction = differenceInDays(new Date(), lastInteraction);

      let recencyScore = 0;
      if (daysSinceInteraction < 1) recencyScore = 20;
      else if (daysSinceInteraction < 7) recencyScore = 15;
      else if (daysSinceInteraction < 30) recencyScore = 10;
      else recencyScore = 5;

      factors['recency'] = recencyScore;
      totalScore += recencyScore;

      // Engagement (max 25 points)
      // Check email opens, clicks, website visits (simulated for now)
      const engagementScore = Math.min(25, Math.floor(Math.random() * 25));
      factors['engagement'] = engagementScore;
      totalScore += engagementScore;

      // Generate recommendation
      let recommendation = '';
      if (totalScore >= 80) {
        recommendation = '🔥 HOT LEAD - Contact immediately with personalized demo offer';
      } else if (totalScore >= 60) {
        recommendation = '⚡ WARM LEAD - Schedule follow-up call or send premium trial offer';
      } else if (totalScore >= 40) {
        recommendation = '👀 INTERESTED - Continue nurturing with educational content';
      } else {
        recommendation = '🥶 COLD LEAD - Add to long-term drip campaign';
      }

      return {
        score: totalScore,
        factors,
        recommendation
      };

    } catch (error) {
      logger.error('Error calculating lead score:', error);
      return {
        score: 0,
        factors: {},
        recommendation: 'Error calculating score'
      };
    }
  }

  /**
   * Get leads by status
   */
  public getLeadsByStatus(status: Lead['status']): Lead[] {
    try {
      return queries.getLeadsByStatus.all(status) as Lead[];
    } catch (error) {
      logger.error('Error getting leads by status:', error);
      return [];
    }
  }

  /**
   * Get hot leads (high score leads that need immediate attention)
   */
  public getHotLeads(): Array<Lead & { score: number }> {
    try {
      const recentLeads = db.prepare(`
        SELECT * FROM leads
        WHERE status IN ('new', 'contacted', 'qualified')
        AND created_at > datetime('now', '-30 days')
        ORDER BY created_at DESC
      `).all() as Lead[];

      const hotLeads = recentLeads
        .map(lead => {
          const scoreData = this.calculateLeadScore(lead.id!);
          return {
            ...lead,
            score: scoreData.score
          };
        })
        .filter(lead => lead.score >= 70)
        .sort((a, b) => b.score - a.score);

      logger.info(`Found ${hotLeads.length} hot leads`);
      return hotLeads;

    } catch (error) {
      logger.error('Error getting hot leads:', error);
      return [];
    }
  }

  /**
   * Get conversion funnel statistics
   */
  public getConversionFunnel(): ConversionFunnel[] {
    try {
      const stats = db.prepare(`
        SELECT
          status,
          COUNT(*) as count
        FROM leads
        GROUP BY status
        ORDER BY
          CASE status
            WHEN 'new' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'qualified' THEN 3
            WHEN 'converted' THEN 4
            WHEN 'lost' THEN 5
          END
      `).all() as Array<{ status: string; count: number }>;

      const totalLeads = stats.reduce((sum, s) => sum + s.count, 0);
      let previousCount = totalLeads;

      const funnel: ConversionFunnel[] = stats.map((stat, index) => {
        const conversionRate = index === 0
          ? 100
          : (stat.count / previousCount) * 100;

        previousCount = stat.count;

        return {
          stage: stat.status,
          count: stat.count,
          conversionRate: Math.round(conversionRate * 100) / 100
        };
      });

      return funnel;

    } catch (error) {
      logger.error('Error getting conversion funnel:', error);
      return [];
    }
  }

  /**
   * Get lead statistics
   */
  public getLeadStats(): any {
    try {
      return db.prepare(`
        SELECT
          COUNT(*) as total_leads,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
          SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_leads,
          SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_leads,
          SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted_leads,
          SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_leads,
          CAST(SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) AS FLOAT) /
            NULLIF(COUNT(*), 0) * 100 as conversion_rate
        FROM leads
      `).get();

    } catch (error) {
      logger.error('Error getting lead stats:', error);
      return null;
    }
  }

  /**
   * Get lead sources performance
   */
  public getSourcePerformance(): any[] {
    try {
      return db.prepare(`
        SELECT
          source,
          COUNT(*) as total_leads,
          SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
          CAST(SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) AS FLOAT) /
            NULLIF(COUNT(*), 0) * 100 as conversion_rate
        FROM leads
        GROUP BY source
        ORDER BY conversions DESC, total_leads DESC
      `).all();

    } catch (error) {
      logger.error('Error getting source performance:', error);
      return [];
    }
  }

  /**
   * Automated lead nurturing - move leads through the funnel
   */
  public async automatedNurturing(): Promise<void> {
    try {
      logger.info('Running automated lead nurturing...');

      // Get stale leads (not contacted in 7+ days) and mark as lost
      const staleLeads = db.prepare(`
        SELECT * FROM leads
        WHERE status IN ('new', 'contacted')
        AND last_interaction < datetime('now', '-7 days')
      `).all() as Lead[];

      for (const lead of staleLeads) {
        // One more attempt before marking as lost
        if (lead.status === 'new') {
          this.updateLeadStatus(lead.id!, 'contacted', 'Automated re-engagement attempt');
        } else if (lead.status === 'contacted') {
          this.updateLeadStatus(lead.id!, 'lost', 'No response after multiple attempts');
        }
      }

      logger.info(`Processed ${staleLeads.length} stale leads`);

      // Auto-qualify leads with high engagement
      const highEngagementLeads = db.prepare(`
        SELECT * FROM leads
        WHERE status = 'contacted'
        AND interest_level = 'high'
        AND last_interaction > datetime('now', '-3 days')
      `).all() as Lead[];

      for (const lead of highEngagementLeads) {
        this.updateLeadStatus(lead.id!, 'qualified', 'Auto-qualified: High engagement');
      }

      logger.info(`Auto-qualified ${highEngagementLeads.length} leads`);

    } catch (error) {
      logger.error('Error in automated nurturing:', error);
    }
  }

  /**
   * Generate lead report
   */
  public generateLeadReport(): {
    summary: any;
    funnel: ConversionFunnel[];
    hotLeads: Array<Lead & { score: number }>;
    sourcePerformance: any[];
    recommendations: string[];
  } {
    const summary = this.getLeadStats();
    const funnel = this.getConversionFunnel();
    const hotLeads = this.getHotLeads();
    const sourcePerformance = this.getSourcePerformance();

    const recommendations: string[] = [];

    // Generate recommendations based on data
    if (summary && summary.conversion_rate < 10) {
      recommendations.push('⚠️ Conversion rate is below 10%. Review lead qualification process.');
    }

    if (hotLeads.length > 10) {
      recommendations.push(`🔥 You have ${hotLeads.length} hot leads! Prioritize follow-ups immediately.`);
    }

    if (sourcePerformance.length > 0) {
      const bestSource = sourcePerformance[0];
      recommendations.push(`📊 Best performing source: ${bestSource.source} (${bestSource.conversion_rate.toFixed(1)}% conversion). Double down on this channel!`);
    }

    const newLeadsCount = summary?.new_leads || 0;
    if (newLeadsCount > 20) {
      recommendations.push(`📬 ${newLeadsCount} new leads awaiting contact. Consider automating initial outreach.`);
    }

    return {
      summary,
      funnel,
      hotLeads,
      sourcePerformance,
      recommendations
    };
  }

  /**
   * Track lead interaction (website visit, email open, etc.)
   */
  public trackInteraction(email: string, interactionType: string): boolean {
    try {
      db.prepare(`
        UPDATE leads
        SET last_interaction = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(email);

      logger.debug(`Tracked ${interactionType} interaction for ${email}`);
      return true;

    } catch (error) {
      logger.error('Error tracking interaction:', error);
      return false;
    }
  }

  /**
   * Bulk import leads from CSV data
   */
  public async bulkImportLeads(
    leads: Array<{ email: string; name?: string; source: string }>
  ): Promise<{ imported: number; failed: number }> {
    let imported = 0;
    let failed = 0;

    for (const lead of leads) {
      const result = await this.captureLead(
        lead.email,
        lead.name || null,
        lead.source,
        'medium'
      );

      if (result) {
        imported++;
      } else {
        failed++;
      }
    }

    logger.info(`Bulk import completed: ${imported} imported, ${failed} failed`);
    return { imported, failed };
  }
}

// Export singleton instance
export default new LeadManager();
