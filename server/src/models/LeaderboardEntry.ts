import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  username: string;
  score: number;
  stage: number;
  cycle: number;
  playTime: number; // in seconds
  enemiesKilled: number;
  accuracy: number; // percentage
  powerupsCollected: number;
  date: Date;
  isValid: boolean;
  userId?: mongoose.Types.ObjectId;
  metadata: {
    gameVersion: string;
    difficulty: string;
    sessionId: string;
  };
}

const leaderboardSchema = new Schema<ILeaderboardEntry>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [1, 'Username cannot be empty'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9_\s-]+$/, 'Username contains invalid characters'],
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
      max: [99999999, 'Score exceeds maximum allowed value'],
    },
    stage: {
      type: Number,
      required: [true, 'Stage is required'],
      min: [1, 'Stage must be at least 1'],
      max: [50, 'Stage exceeds maximum allowed value'],
    },
    cycle: {
      type: Number,
      required: [true, 'Cycle is required'],
      min: [1, 'Cycle must be at least 1'],
      max: [20, 'Cycle exceeds maximum allowed value'],
    },
    playTime: {
      type: Number,
      required: [true, 'Play time is required'],
      min: [1, 'Play time must be at least 1 second'],
      max: [86400, 'Play time cannot exceed 24 hours'], // 24 hours in seconds
    },
    enemiesKilled: {
      type: Number,
      required: [true, 'Enemies killed count is required'],
      min: [0, 'Enemies killed cannot be negative'],
      max: [50000, 'Enemies killed exceeds reasonable limit'],
    },
    accuracy: {
      type: Number,
      required: [true, 'Accuracy is required'],
      min: [0, 'Accuracy cannot be negative'],
      max: [100, 'Accuracy cannot exceed 100%'],
    },
    powerupsCollected: {
      type: Number,
      default: 0,
      min: [0, 'Powerups collected cannot be negative'],
      max: [1000, 'Powerups collected exceeds reasonable limit'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    metadata: {
      gameVersion: {
        type: String,
        required: [true, 'Game version is required'],
        trim: true,
        maxlength: [20, 'Game version cannot exceed 20 characters'],
      },
      difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: ['easy', 'normal', 'hard', 'expert'],
        default: 'normal',
      },
      sessionId: {
        type: String,
        required: [true, 'Session ID is required'],
        trim: true,
        maxlength: [100, 'Session ID cannot exceed 100 characters'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queries
leaderboardSchema.index({ score: -1, date: -1 }); // For top scores
leaderboardSchema.index({ date: -1 }); // For recent scores
leaderboardSchema.index({ username: 1, score: -1 }); // For user's best scores
leaderboardSchema.index({ isValid: 1, score: -1 }); // For valid scores only
leaderboardSchema.index({
  'metadata.difficulty': 1,
  score: -1,
}); // For difficulty-based leaderboards

// Validation middleware
leaderboardSchema.pre('save', function (next) {
  // Validate that the score makes sense relative to other stats
  const scorePerSecond = this.score / this.playTime;
  const maxReasonableScorePerSecond = 1000; // Adjust based on your game mechanics

  if (scorePerSecond > maxReasonableScorePerSecond) {
    this.isValid = false;
  }

  // Validate accuracy makes sense
  if (this.accuracy > 100 || this.accuracy < 0) {
    this.isValid = false;
  }

  next();
});

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>(
  'LeaderboardEntry',
  leaderboardSchema
);
