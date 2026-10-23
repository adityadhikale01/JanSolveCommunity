import express from 'express';
import { getMyBookmarks } from '../controllers/socialController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyBookmarks);

export default router;
