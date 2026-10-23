import express from 'express';
import {
  getPublicProfile,
  getUserChallenges,
  searchUsers,
} from '../controllers/userController.js';
import { reportContent } from '../controllers/socialController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { reportSchema } from '../validations/socialValidation.js';

const router = express.Router();

router.get('/', optionalAuth, searchUsers);
router.get('/:id', getPublicProfile);
router.get('/:id/challenges', getUserChallenges);
router.post(
  '/:id/report',
  authenticate,
  validateBody(reportSchema),
  (req, res, next) => {
    req.params.targetType = 'user';
    req.params.targetId = req.params.id;
    reportContent(req, res, next);
  }
);

export default router;
