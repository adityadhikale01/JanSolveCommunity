import express from 'express';
import {
  createChallenge,
  getPublicChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  getMyChallenges,
  getNearbyChallenges,
} from '../controllers/challengeController.js';
import {
  voteChallenge,
  toggleBookmark,
  reportContent,
  getComments,
  createComment,
} from '../controllers/socialController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { upload } from '../config/multer.js';
import {
  createChallengeSchema,
  updateChallengeSchema,
} from '../validations/challengeValidation.js';
import {
  voteSchema,
  reportSchema,
  createCommentSchema,
} from '../validations/socialValidation.js';

const router = express.Router();

// Specific routes before :id
router.get('/', optionalAuth, getPublicChallenges);
router.get('/mine', authenticate, getMyChallenges);
router.get('/nearby', getNearbyChallenges);

// Create Challenge with optional multipart file uploads
router.post(
  '/',
  authenticate,
  upload.array('media', 5),
  (req, res, next) => {
    // If sent as form-data, parse JSON fields if needed
    if (typeof req.body.coordinates === 'string') {
      try {
        req.body.coordinates = JSON.parse(req.body.coordinates);
      } catch {
        // ignore
      }
    }
    if (typeof req.body.evidence === 'string') {
      try {
        req.body.evidence = JSON.parse(req.body.evidence);
      } catch {
        // ignore
      }
    }
    next();
  },
  validateBody(createChallengeSchema),
  createChallenge
);

// Detail, Update, Delete
router.get('/:id', optionalAuth, getChallengeById);
router.patch(
  '/:id',
  authenticate,
  validateBody(updateChallengeSchema),
  updateChallenge
);
router.delete('/:id', authenticate, deleteChallenge);

// Social interactions on Challenge
router.post('/:id/vote', authenticate, validateBody(voteSchema), voteChallenge);
router.post('/:id/bookmark', authenticate, toggleBookmark);
router.post(
  '/:id/report',
  authenticate,
  validateBody(reportSchema),
  (req, res, next) => {
    req.params.targetType = 'challenge';
    req.params.targetId = req.params.id;
    reportContent(req, res, next);
  }
);

// Comments nested under Challenge
router.get('/:id/comments', getComments);
router.post(
  '/:id/comments',
  authenticate,
  validateBody(createCommentSchema),
  (req, res, next) => {
    req.params.challengeId = req.params.id;
    createComment(req, res, next);
  }
);

export default router;
