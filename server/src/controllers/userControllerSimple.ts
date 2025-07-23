import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Username, email, and password are required',
      });
      return;
    }

    const existingUser = await User.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'User already exists with this username or email',
      });
      return;
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        username: newUser.username,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          registrationDate: newUser.registrationDate,
        },
        token,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        status: 'error',
        message: 'Username or email already exists',
      });
      return;
    }
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Username and password are required',
      });
      return;
    }

    const user = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() },
      ],
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
      return;
    }

    user.lastLoginDate = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          registrationDate: user.registrationDate,
          lastLoginDate: user.lastLoginDate,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findById(userId).select('-passwordHash -__v');

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          registrationDate: user.registrationDate,
          lastLoginDate: user.lastLoginDate,
          settings: user.settings,
          stats: user.stats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    user.settings = {
      ...user.settings,
      ...settings,
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Settings updated successfully',
      data: {
        settings: user.settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { stats } = req.body;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    user.stats = {
      ...user.stats,
      ...stats,
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Stats updated successfully',
      data: {
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
      });
      return;
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'User account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
