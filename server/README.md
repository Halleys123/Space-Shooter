# Space Shooter Backend API

A secure and scalable backend server for the Space Shooter game built with TypeScript, Express.js, MongoDB, and comprehensive security measures.

## Features

- **User Management**: Registration, authentication, profile management
- **Leaderboard System**: Score submission, rankings, statistics
- **Game Session Tracking**: Session management, analytics
- **Security**: JWT authentication, rate limiting, input validation, CORS, helmet protection
- **Data Protection**: MongoDB sanitization, HPP protection, bcrypt password hashing
- **Error Handling**: Comprehensive error handling with proper status codes
- **Logging**: Morgan logging for development and production
- **Validation**: Express-validator for input validation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Input Sanitization
- **Validation**: Express-validator
- **Password Hashing**: bcryptjs
- **Logging**: Morgan
- **Environment**: dotenv

## Project Structure

```
server/
├── src/
│   ├── controllers/        # Route controllers
│   │   ├── leaderboardController.ts
│   │   ├── userController.ts
│   │   └── gameSessionController.ts
│   ├── models/            # MongoDB models
│   │   ├── User.ts
│   │   ├── LeaderboardEntry.ts
│   │   └── GameSession.ts
│   ├── routes/            # API routes
│   │   ├── leaderboardRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── gameSessionRoutes.ts
│   ├── middleware/        # Custom middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   └── server.ts          # Main server file
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

### User Management (`/api/users`)

- `POST /register` - Register new user
- `POST /login` - User authentication
- `GET /:userId` - Get user profile
- `PUT /:userId/settings` - Update user settings
- `PUT /:userId/stats` - Update user statistics
- `DELETE /:userId` - Delete user account

### Leaderboard (`/api/leaderboard`)

- `GET /` - Get leaderboard entries (with filtering)
- `POST /submit` - Submit new score
- `GET /user/:username` - Get user's best scores
- `GET /stats` - Get leaderboard statistics

### Game Sessions (`/api/sessions`)

- `POST /` - Create new game session
- `PUT /:sessionId/end` - End game session
- `GET /active` - Get active sessions
- `GET /:sessionId` - Get session by ID
- `GET /user/:userId` - Get user sessions
- `GET /stats` - Get session statistics

## Installation

1. **Clone and navigate to server directory**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   - Install and run MongoDB locally, or
   - Use MongoDB Atlas cloud service

5. **Run the server**

   ```bash
   # Development
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/space-shooter
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:8080
BCRYPT_ROUNDS=12
```

## Security Features

- **Authentication**: JWT-based authentication with secure token handling
- **Rate Limiting**: Different limits for general API, authentication, and game data
- **Input Validation**: Comprehensive validation using express-validator
- **Data Sanitization**: MongoDB injection prevention and HPP protection
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers and CSP configuration
- **Password Security**: bcrypt hashing with configurable rounds

## Data Models

### User Model

- Username, email, password (hashed)
- Game settings and statistics
- Registration and login timestamps

### Leaderboard Entry

- Score, stage, cycle, play time
- Accuracy, enemies killed, powerups collected
- Anti-cheat validation flags

### Game Session

- Session tracking from start to end
- Real-time game metrics
- End reason and final statistics

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Game Data**: 30 requests per minute

## Error Handling

Standardized error responses with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run linting
npm run lint

# Run production build
npm start
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Use strong JWT secret
4. Configure proper CORS origins
5. Set up reverse proxy (nginx/Apache)
6. Enable HTTPS
7. Configure proper logging
8. Set up monitoring and health checks

## License

This project is part of the Space Shooter game.
