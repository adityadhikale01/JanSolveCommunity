import express from 'express';
import {
  updateComment,
  deleteComment,
  reportContent,
} from '../controllers/socialController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  updateCommentSchema,
  reportSchema,
} from '../validations/socialValidation.js';

const router = express.Router();

router.patch(
  '/:id',
  authenticate,
  validateBody(updateCommentSchema),
  updateComment
);
router.delete('/:id', authenticate, deleteComment);
router.post(
  '/:id/report',
  authenticate,
  validateBody(reportSchema),
  (req, res, next) => {
    req.params.targetType = 'comment';
    req.params.targetId = req.params.id;
    reportContent(req, res, next);
  }
);

export default router;
