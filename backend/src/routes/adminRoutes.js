import express from 'express';
import {
  getDashboardStats,
  getAnalytics,
  getAdminChallenges,
  getAdminChallengeById,
  reviewChallenge,
  updatePublicationStatus,
  getAdminUsers,
  updateUserStatus,
  getContentReports,
  updateContentReport,
  getAuditLogs,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  adminReviewSchema,
  adminPublicationSchema,
} from '../validations/challengeValidation.js';

const router = express.Router();

// Strict administrator protection
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);

// Challenge management
router.get('/challenges', getAdminChallenges);
router.get('/challenges/:id', getAdminChallengeById);
router.patch(
  '/challenges/:id/review',
  validateBody(adminReviewSchema),
  reviewChallenge
);
router.patch(
  '/challenges/:id/publication',
  validateBody(adminPublicationSchema),
  updatePublicationStatus
);

// User management
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);

// Moderation
router.get('/content-reports', getContentReports);
router.patch('/content-reports/:id', updateContentReport);

// Audit trail
router.get('/audit-logs', getAuditLogs);

export default router;
