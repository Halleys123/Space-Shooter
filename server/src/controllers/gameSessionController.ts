import { Request, Response, NextFunction } from 'express';
import { GameSession } from '../models/GameSession';
import { validationResult } from 'express-validator';


export const createGameSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { userId, username, difficulty = 'normal', gameVersion } = req.body;

    
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newSession = new GameSession({
      sessionId,
      userId: userId || null,
      username: username || 'Anonymous',
      difficulty,
      metadata: {
        gameVersion,
        userAgent: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      },
    });

    await newSession.save();

    res.status(201).json({
      status: 'success',
      message: 'Game session created successfully',
      data: {
        sessionId: newSession.sessionId,
        session: {
          id: newSession._id,
          sessionId: newSession.sessionId,
          userId: newSession.userId,
          username: newSession.username,
          difficulty: newSession.difficulty,
          startTime: newSession.startTime,
          isActive: newSession.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const endGameSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { sessionId } = req.params;
    const {
      finalScore = 0,
      finalStage = 1,
      finalCycle = 1,
      totalPlayTime = 0,
      enemiesKilled = 0,
      accuracy = 0,
      powerupsCollected = 0,
      endReason = 'completed',
    } = req.body;

    const session = await GameSession.findOne({ sessionId });

    if (!session) {
      res.status(404).json({
        status: 'error',
        message: 'Game session not found',
      });
      return;
    }

    if (!session.isActive) {
      res.status(409).json({
        status: 'error',
        message: 'Game session already ended',
      });
      return;
    }

    
    session.endTime = new Date();
    session.isActive = false;
    session.finalScore = finalScore;
    session.finalStage = finalStage;
    session.finalCycle = finalCycle;
    session.totalPlayTime = totalPlayTime;
    session.enemiesKilled = enemiesKilled;
    session.accuracy = accuracy;
    session.powerupsCollected = powerupsCollected;
    session.endReason = endReason;

    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Game session ended successfully',
      data: {
        session: {
          id: session._id,
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime,
          totalPlayTime: session.totalPlayTime,
          finalScore: session.finalScore,
          finalStage: session.finalStage,
          finalCycle: session.finalCycle,
          enemiesKilled: session.enemiesKilled,
          accuracy: session.accuracy,
          powerupsCollected: session.powerupsCollected,
          endReason: session.endReason,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getActiveSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const limitNum = Math.min(Math.max(1, Number(limit)), 50);
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * limitNum;

    const [sessions, totalCount] = await Promise.all([
      GameSession.find({ isActive: true })
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-metadata.ipAddress -__v')
        .lean(),
      GameSession.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        sessions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalSessions: totalCount,
          hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await GameSession.findOne({ sessionId }).select(
      '-metadata.ipAddress -__v'
    );

    if (!session) {
      res.status(404).json({
        status: 'error',
        message: 'Game session not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1, isActive } = req.query;

    
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
      });
      return;
    }

    const limitNum = Math.min(Math.max(1, Number(limit)), 50);
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * limitNum;

    
    const query: any = { userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [sessions, totalCount] = await Promise.all([
      GameSession.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-metadata.ipAddress -__v')
        .lean(),
      GameSession.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        sessions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalSessions: totalCount,
          hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getSessionStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeFrame = 'all-time' } = req.query;

    
    let timeFilter = {};
    if (timeFrame === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      timeFilter = { startTime: { $gte: today } };
    } else if (timeFrame === 'this-week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      timeFilter = { startTime: { $gte: weekAgo } };
    }

    const stats = await GameSession.aggregate([
      { $match: timeFilter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
          },
          averagePlayTime: {
            $avg: {
              $cond: [{ $eq: ['$isActive', false] }, '$totalPlayTime', null],
            },
          },
          averageScore: {
            $avg: {
              $cond: [{ $eq: ['$isActive', false] }, '$finalScore', null],
            },
          },
          totalEnemiesKilled: { $sum: '$enemiesKilled' },
          averageAccuracy: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', false] },
                    { $gt: ['$accuracy', 0] },
                  ],
                },
                '$accuracy',
                null,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      averagePlayTime: 0,
      averageScore: 0,
      totalEnemiesKilled: 0,
      averageAccuracy: 0,
    };

    delete result._id;

    res.status(200).json({
      status: 'success',
      data: {
        stats: result,
        timeFrame,
      },
    });
  } catch (error) {
    next(error);
  }
};
