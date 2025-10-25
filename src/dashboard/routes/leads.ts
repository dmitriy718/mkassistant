/**
 * Lead Scoring Dashboard API Routes
 */

import { Router, Request, Response } from 'express';
import {
  getHotLeads,
  getAllLeadsWithScores,
  trackEmailOpen,
  trackLinkClick,
  trackTrialSignup,
  recalculateAllScores,
} from '../../leads/scoring';
import logger from '../../utils/logger';

const router = Router();

/**
 * GET /api/leads/hot
 * Get top 20 hot leads for sales dashboard
 */
router.get('/hot', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const hotLeads = getHotLeads(limit);

    res.json({
      success: true,
      count: hotLeads.length,
      leads: hotLeads,
    });
  } catch (error) {
    logger.error('Error fetching hot leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hot leads',
    });
  }
});

/**
 * GET /api/leads/all
 * Get all leads with scores
 */
router.get('/all', (req: Request, res: Response) => {
  try {
    const leads = getAllLeadsWithScores();

    // Group by priority
    const grouped = {
      hot: leads.filter(l => l.priority === 'hot'),
      warm: leads.filter(l => l.priority === 'warm'),
      cold: leads.filter(l => l.priority === 'cold'),
    };

    res.json({
      success: true,
      total: leads.length,
      counts: {
        hot: grouped.hot.length,
        warm: grouped.warm.length,
        cold: grouped.cold.length,
      },
      leads: grouped,
    });
  } catch (error) {
    logger.error('Error fetching all leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
    });
  }
});

/**
 * POST /api/leads/track/email-open
 * Track email open event
 */
router.post('/track/email-open', (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    trackEmailOpen(email);

    res.json({
      success: true,
      message: 'Email open tracked',
    });
  } catch (error) {
    logger.error('Error tracking email open:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track email open',
    });
  }
});

/**
 * POST /api/leads/track/link-click
 * Track link click event
 */
router.post('/track/link-click', (req: Request, res: Response) => {
  try {
    const { email, linkUrl } = req.body;

    if (!email || !linkUrl) {
      return res.status(400).json({
        success: false,
        error: 'Email and linkUrl are required',
      });
    }

    trackLinkClick(email, linkUrl);

    res.json({
      success: true,
      message: 'Link click tracked',
    });
  } catch (error) {
    logger.error('Error tracking link click:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track link click',
    });
  }
});

/**
 * POST /api/leads/track/trial-signup
 * Track trial signup event (highest value)
 */
router.post('/track/trial-signup', (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    trackTrialSignup(email);

    res.json({
      success: true,
      message: 'Trial signup tracked',
    });
  } catch (error) {
    logger.error('Error tracking trial signup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track trial signup',
    });
  }
});

/**
 * POST /api/leads/recalculate
 * Recalculate scores for all leads (maintenance)
 */
router.post('/recalculate', (req: Request, res: Response) => {
  try {
    recalculateAllScores();

    res.json({
      success: true,
      message: 'Scores recalculated for all leads',
    });
  } catch (error) {
    logger.error('Error recalculating scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate scores',
    });
  }
});

export default router;
