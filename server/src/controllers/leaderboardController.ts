import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { LeaderboardEntry } from '../models/LeaderboardEntry';

export interface LeaderboardQuery {
  timeFrame?: 'today' | 'this-week' | 'all-time';
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert';
  limit?: number;
  page?: number;
}

// Get leaderboard entries
export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      timeFrame = 'all-time',
      difficulty = 'normal',
      limit = 10,
      page = 1,
    } = req.query as LeaderboardQuery;

    // Build query
    const query: any = {
      isValid: true,
      'metadata.difficulty': difficulty,
    };

    // Add time-based filtering
    if (timeFrame === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    } else if (timeFrame === 'this-week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.date = { $gte: weekAgo };
    }

    // Calculate pagination
    const limitNum = Math.min(Math.max(1, Number(limit)), 100);
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * limitNum;

    // Get entries and total count
    const [entries, totalCount] = await Promise.all([
      LeaderboardEntry.find(query)
        .sort({ score: -1, date: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-metadata.sessionId -__v')
        .lean(),
      LeaderboardEntry.countDocuments(query),
    ]);

    // Add rank to each entry
    const entriesWithRank = entries.map((entry: any, index: number) => ({
      ...entry,
      rank: skip + index + 1,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        entries: entriesWithRank,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalEntries: totalCount,
        },
        filters: {
          timeFrame,
          difficulty,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit a new score
export const submitScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Validation Error',
        errors: errors.array(),
      });
      return;
    }

    const {
      username,
      score,
      stage,
      cycle,
      playTime,
      enemiesKilled,
      accuracy,
      powerupsCollected = 0,
      gameVersion,
      difficulty = 'normal',
      sessionId,
    } = req.body;

    // Basic validation
    if (!username || score < 0 || playTime < 1) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid input data',
      });
      return;
    }

    // Check for duplicate session
    const existingEntry = await LeaderboardEntry.findOne({
      'metadata.sessionId': sessionId,
    });

    if (existingEntry) {
      res.status(409).json({
        status: 'error',
        message: 'Score already submitted for this session',
      });
      return;
    }

    // Basic anti-cheat validation
    const scorePerSecond = score / playTime;
    const isValid = scorePerSecond <= 1000 && accuracy <= 100;

    // Create new entry
    const newEntry = new LeaderboardEntry({
      username: username.trim(),
      score,
      stage,
      cycle,
      playTime,
      enemiesKilled,
      accuracy,
      powerupsCollected,
      isValid,
      metadata: {
        gameVersion,
        difficulty,
        sessionId,
      },
    });

    await newEntry.save();

    // Get rank
    const rank =
      (await LeaderboardEntry.countDocuments({
        isValid: true,
        'metadata.difficulty': difficulty,
        score: { $gt: score },
      })) + 1;

    res.status(201).json({
      status: 'success',
      message: 'Score submitted successfully',
      data: {
        entry: {
          ...newEntry.toJSON(),
          rank,
        },
        isValid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's best scores
export const getUserScores = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;
    const { difficulty = 'normal', limit = 10 } = req.query;

    if (!username) {
      res.status(400).json({
        status: 'error',
        message: 'Username is required',
      });
      return;
    }

    const limitNum = Math.min(Math.max(1, Number(limit)), 50);

    const entries = await LeaderboardEntry.find({
      username: username.trim(),
      isValid: true,
      'metadata.difficulty': difficulty,
    })
      .sort({ score: -1, date: -1 })
      .limit(limitNum)
      .select('-metadata.sessionId -__v')
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        username,
        entries,
        difficulty,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard statistics
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { difficulty = 'normal' } = req.query;

    const stats = await LeaderboardEntry.aggregate([
      {
        $match: {
          isValid: true,
          'metadata.difficulty': difficulty,
        },
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          averageAccuracy: { $avg: '$accuracy' },
          totalEnemiesKilled: { $sum: '$enemiesKilled' },
        },
      },
    ]);

    const result = stats[0] || {
      totalEntries: 0,
      averageScore: 0,
      highestScore: 0,
      averageAccuracy: 0,
      totalEnemiesKilled: 0,
    };

    delete result._id;

    res.status(200).json({
      status: 'success',
      data: {
        stats: result,
        difficulty,
      },
    });
  } catch (error) {
    next(error);
  }
};
