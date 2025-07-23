import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createGameSession,
  endGameSession,
  getActiveSessions,
  getSessionById,
  getUserSessions,
  getSessionStats,
} from '../controllers/gameSessionController';

const router = Router();

const createSessionValidation = [
  body('userId').optional().isMongoId().withMessage('Invalid user ID format'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Username must be 1-30 characters and contain only letters, numbers, underscores, and hyphens'
    ),
  body('difficulty')
    .optional()
    .isIn(['easy', 'normal', 'hard', 'expert'])
    .withMessage('Difficulty must be easy, normal, hard, or expert'),
  body('gameVersion')
    .isLength({ min: 1, max: 20 })
    .withMessage('Game version is required'),
];

const endSessionValidation = [
  body('finalScore')
    .optional()
    .isInt({ min: 0, max: 99999999 })
    .withMessage('Final score must be a non-negative integer up to 99,999,999'),
  body('finalStage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Final stage must be between 1 and 100'),
  body('finalCycle')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Final cycle must be between 1 and 50'),
  body('totalPlayTime')
    .optional()
    .isInt({ min: 0, max: 86400 })
    .withMessage('Total play time must be between 0 and 86400 seconds'),
  body('enemiesKilled')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Enemies killed must be a non-negative integer'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Accuracy must be between 0 and 100'),
  body('powerupsCollected')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Powerups collected must be a non-negative integer'),
  body('endReason')
    .optional()
    .isIn(['completed', 'quit', 'game-over', 'error'])
    .withMessage('End reason must be completed, quit, game-over, or error'),
];

const sessionIdParamValidation = [
  param('sessionId').isLength({ min: 1 }).withMessage('Session ID is required'),
];

const userIdParamValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
];

const paginationQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
];

const activeSessionQueryValidation = [
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const timeFrameQueryValidation = [
  query('timeFrame')
    .optional()
    .isIn(['today', 'this-week', 'all-time'])
    .withMessage('Time frame must be today, this-week, or all-time'),
];

router.post('/', createSessionValidation, createGameSession);
router.put(
  '/:sessionId/end',
  [...sessionIdParamValidation, ...endSessionValidation],
  endGameSession
);
router.get('/active', paginationQueryValidation, getActiveSessions);
router.get('/stats', timeFrameQueryValidation, getSessionStats);
router.get('/:sessionId', sessionIdParamValidation, getSessionById);
router.get(
  '/user/:userId',
  [
    ...userIdParamValidation,
    ...paginationQueryValidation,
    ...activeSessionQueryValidation,
  ],
  getUserSessions
);

export default router;
