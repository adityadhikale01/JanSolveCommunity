import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createConversationSchema,
  sendMessageSchema,
} from '../validations/socialValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getConversations);
router.post('/', validateBody(createConversationSchema), createConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', validateBody(sendMessageSchema), sendMessage);
router.patch('/:id/read', markConversationRead);

export default router;
