import mongoose, { Document, Schema } from 'mongoose';

export interface IGameSession extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  username: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  startTime: Date;
  endTime?: Date;
  totalPlayTime: number; // in seconds
  finalScore: number;
  finalStage: number;
  finalCycle: number;
  enemiesKilled: number;
  accuracy: number;
  powerupsCollected: number;
  isActive: boolean;
  endReason?: 'completed' | 'quit' | 'game-over' | 'error';
  metadata: {
    gameVersion: string;
    userAgent: string;
    ipAddress: string;
  };
}

const gameSessionSchema = new Schema<IGameSession>(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'normal', 'hard', 'expert'],
      default: 'normal',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
      required: false,
    },
    totalPlayTime: {
      type: Number,
      default: 0,
      min: [0, 'Play time cannot be negative'],
    },
    finalScore: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
    },
    finalStage: {
      type: Number,
      default: 1,
      min: [1, 'Stage must be at least 1'],
    },
    finalCycle: {
      type: Number,
      default: 1,
      min: [1, 'Cycle must be at least 1'],
    },
    enemiesKilled: {
      type: Number,
      default: 0,
      min: [0, 'Enemies killed cannot be negative'],
    },
    accuracy: {
      type: Number,
      default: 0,
      min: [0, 'Accuracy cannot be negative'],
      max: [100, 'Accuracy cannot exceed 100%'],
    },
    powerupsCollected: {
      type: Number,
      default: 0,
      min: [0, 'Powerups collected cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    endReason: {
      type: String,
      enum: ['completed', 'quit', 'game-over', 'error'],
      required: false,
    },
    metadata: {
      gameVersion: {
        type: String,
        required: true,
        trim: true,
      },
      userAgent: {
        type: String,
        required: true,
        trim: true,
      },
      ipAddress: {
        type: String,
        required: true,
        trim: true,
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

// Indexes
gameSessionSchema.index({ sessionId: 1 });
gameSessionSchema.index({ userId: 1, startTime: -1 });
gameSessionSchema.index({ username: 1, startTime: -1 });
gameSessionSchema.index({ startTime: -1 });
gameSessionSchema.index({ finalScore: -1 });
gameSessionSchema.index({ isActive: 1 });
gameSessionSchema.index({ difficulty: 1 });

// Auto-delete old sessions after 30 days
gameSessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

export const GameSession = mongoose.model<IGameSession>(
  'GameSession',
  gameSessionSchema
);
