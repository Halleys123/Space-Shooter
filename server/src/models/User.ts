import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginDate: Date;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    difficulty: 'easy' | 'normal' | 'hard' | 'expert';
    showFPS: boolean;
    showParticles: boolean;
    keyBindings: {
      [key: string]: string;
    };
  };
  stats: {
    totalGamesPlayed: number;
    totalPlayTime: number;
    highestScore: number;
    totalEnemiesKilled: number;
    bestAccuracy: number;
    favoriteWeapon: string;
  };
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens',
      ],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginDate: {
      type: Date,
      default: Date.now,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    settings: {
      masterVolume: { type: Number, default: 1.0, min: 0, max: 1 },
      sfxVolume: { type: Number, default: 1.0, min: 0, max: 1 },
      musicVolume: { type: Number, default: 1.0, min: 0, max: 1 },
      difficulty: {
        type: String,
        enum: ['easy', 'normal', 'hard', 'expert'],
        default: 'normal',
      },
      showFPS: { type: Boolean, default: false },
      showParticles: { type: Boolean, default: true },
      keyBindings: {
        type: Map,
        of: String,
        default: new Map([
          ['moveLeft', 'ArrowLeft'],
          ['moveRight', 'ArrowRight'],
          ['moveUp', 'ArrowUp'],
          ['moveDown', 'ArrowDown'],
          ['fire', 'Space'],
          ['pause', 'Escape'],
        ]),
      },
    },
    stats: {
      totalGamesPlayed: { type: Number, default: 0, min: 0 },
      totalPlayTime: { type: Number, default: 0, min: 0 },
      highestScore: { type: Number, default: 0, min: 0 },
      totalEnemiesKilled: { type: Number, default: 0, min: 0 },
      bestAccuracy: { type: Number, default: 0, min: 0, max: 100 },
      favoriteWeapon: { type: String, default: 'basic' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ registrationDate: -1 });

export const User = mongoose.model<IUser>('User', userSchema);
