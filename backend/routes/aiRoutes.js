// ─────────────────────────────────────────────────────────────────────────────
// FILE: backend/routes/aiRoutes.js
// PURPOSE: Routes for AI chatbot endpoints
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const {
  protect,
  authorize,
  requireApproval
} = require('../middleware/authMiddleware');

const {
  chat,
  getSuggestions
} = require('../controllers/aiController');

// All AI routes require:
// 1. Valid JWT
// 2. Student role
// 3. Approved account
router.use(
  protect,
  authorize('student'),
  requireApproval
);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Chat with PlaceTrack AI assistant
 */
router.post('/chat', chat);

/**
 * @swagger
 * /api/ai/suggestions:
 *   get:
 *     tags: [AI]
 *     summary: Get personalized quick suggestions
 */
router.get('/suggestions', getSuggestions);

module.exports = router;