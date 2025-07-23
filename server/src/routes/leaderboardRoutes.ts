import { Router } from 'express';
import { body, query, param } from 'express-validator';
import {
  getLeaderboard,
  submitScore,
  getUserScores,
  getStats,
} from '../controllers/leaderboardController';

const router = Router();

// Validation middleware
const scoreSubmissionValidation = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Username must be 1-30 characters and contain only letters, numbers, underscores, and hyphens'
    ),
  body('score')
    .isInt({ min: 0, max: 99999999 })
    .withMessage('Score must be a positive integer up to 99,999,999'),
  body('stage')
    .isInt({ min: 1, max: 100 })
    .withMessage('Stage must be between 1 and 100'),
  body('cycle')
    .isInt({ min: 1, max: 50 })
    .withMessage('Cycle must be between 1 and 50'),
  body('playTime')
    .isInt({ min: 1, max: 86400 })
    .withMessage('Play time must be between 1 and 86400 seconds'),
  body('enemiesKilled')
    .isInt({ min: 0 })
    .withMessage('Enemies killed must be a non-negative integer'),
  body('accuracy')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Accuracy must be between 0 and 100'),
  body('powerupsCollected')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Powerups collected must be a non-negative integer'),
  body('gameVersion')
    .isLength({ min: 1, max: 20 })
    .withMessage('Game version is required'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'normal', 'hard', 'expert'])
    .withMessage('Difficulty must be easy, normal, hard, or expert'),
  body('sessionId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Session ID is required'),
];

const leaderboardQueryValidation = [
  query('timeFrame')
    .optional()
    .isIn(['today', 'this-week', 'all-time'])
    .withMessage('Time frame must be today, this-week, or all-time'),
  query('difficulty')
    .optional()
    .isIn(['easy', 'normal', 'hard', 'expert'])
    .withMessage('Difficulty must be easy, normal, hard, or expert'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
];

const usernameParamValidation = [
  param('username')
    .trim()
    .isLength({ min: 1, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid username format'),
];

// Routes
router.get('/', leaderboardQueryValidation, getLeaderboard);
router.post('/submit', scoreSubmissionValidation, submitScore);
router.get('/user/:username', usernameParamValidation, getUserScores);
router.get(
  '/stats',
  query('difficulty').optional().isIn(['easy', 'normal', 'hard', 'expert']),
  getStats
);

export default router;
