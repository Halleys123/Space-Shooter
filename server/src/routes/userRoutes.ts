import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserSettings,
  updateUserStats,
  deleteUser,
} from '../controllers/userController';

const router = Router();

const userRegistrationValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'
    ),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must be 8-128 characters with at least one lowercase letter, one uppercase letter, and one number'
    ),
];

const userLoginValidation = [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username or email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

const userIdParamValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
];

const userSettingsValidation = [
  body('settings.masterVolume')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Master volume must be between 0 and 1'),
  body('settings.sfxVolume')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('SFX volume must be between 0 and 1'),
  body('settings.musicVolume')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Music volume must be between 0 and 1'),
  body('settings.difficulty')
    .optional()
    .isIn(['easy', 'normal', 'hard', 'expert'])
    .withMessage('Difficulty must be easy, normal, hard, or expert'),
  body('settings.showFPS')
    .optional()
    .isBoolean()
    .withMessage('Show FPS must be a boolean'),
  body('settings.showParticles')
    .optional()
    .isBoolean()
    .withMessage('Show particles must be a boolean'),
  body('settings.keyBindings')
    .optional()
    .isObject()
    .withMessage('Key bindings must be an object'),
];

const userStatsValidation = [
  body('stats.totalGamesPlayed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total games played must be a non-negative integer'),
  body('stats.totalPlayTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total play time must be a non-negative integer'),
  body('stats.highestScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Highest score must be a non-negative integer'),
  body('stats.totalEnemiesKilled')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total enemies killed must be a non-negative integer'),
  body('stats.bestAccuracy')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Best accuracy must be between 0 and 100'),
  body('stats.favoriteWeapon')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Favorite weapon must be a string up to 50 characters'),
];

router.post('/register', userRegistrationValidation, registerUser);
router.post('/login', userLoginValidation, loginUser);
router.get('/:userId', userIdParamValidation, getUserProfile);
router.put(
  '/:userId/settings',
  [...userIdParamValidation, ...userSettingsValidation],
  updateUserSettings
);
router.put(
  '/:userId/stats',
  [...userIdParamValidation, ...userStatsValidation],
  updateUserStats
);
router.delete('/:userId', userIdParamValidation, deleteUser);

export default router;
