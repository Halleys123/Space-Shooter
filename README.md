# Space Shooter Game

A modern web-based space shooter game with user authentication, leaderboards, and backend score tracking.

## Features

### Game Features

- Classic space shooter gameplay
- Multiple enemy types with different behaviors
- Power-ups and special abilities
- Progressive difficulty stages
- Particle effects and animations
- Responsive controls (WASD + Mouse)

### Backend Features

- User authentication (register/login)
- Secure JWT-based sessions
- Global leaderboards with multiple metrics
- Personal score tracking
- RESTful API
- MongoDB database storage
- Rate limiting and security features

### Frontend Features

- Responsive design
- Real-time leaderboard updates
- User profiles with statistics
- Offline fallback for local scores
- Modern UI with animations
- Cross-browser compatibility

## Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate limiting** - DDoS protection

### Frontend

- **Vanilla JavaScript** - Core game logic
- **HTML5 Canvas** - Game rendering
- **CSS3** - Styling and animations
- **Web APIs** - Local storage, fetch, etc.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd space-shooter
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the `server` directory:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/space-shooter

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   # Security
   BCRYPT_ROUNDS=12

   # CORS
   CLIENT_URL=http://localhost:3000
   ```

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - The application will create collections automatically
   - No manual database setup required

### Running the Application

#### Development Mode

```bash
# Run both client and server concurrently
npm run dev

# Or run separately:
# Terminal 1 - Backend server (port 5000)
npm run dev:server

# Terminal 2 - Frontend client (port 3000)
npm run dev:client
```

#### Production Mode

```bash
# Build and start the server
npm run build
npm start

# Serve client files with a web server
```

### Access the Application

- **Game**: http://localhost:3000
- **API**: http://localhost:5000/api

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/stats` - Get user statistics

### Leaderboard

- `GET /api/leaderboard` - Get leaderboard entries
- `POST /api/leaderboard` - Submit new score
- `GET /api/leaderboard/user/:userId` - Get user scores
- `GET /api/leaderboard/stats` - Get leaderboard statistics

### Game Sessions

- `POST /api/sessions` - Create game session
- `PUT /api/sessions/:sessionId/end` - End game session
- `GET /api/sessions/user/:userId` - Get user sessions

## Game Controls

### Movement

- **W** - Move Up
- **S** - Move Down
- **A** - Move Left
- **D** - Move Right

### Combat

- **SPACE** - Shoot
- **Mouse** - Aim/Rotate Ship

### Game Controls

- **ESC** - Pause Game
- **H** - Show/Hide Help
- **P** - Performance Monitor

### Debug Controls (Development)

- **G** - Heal Player (+10 HP)
- **Z** - Add Score (+1000)
- **N** - Force Next Stage

## Game Features

### Authentication System

- Secure user registration and login
- Persistent sessions with JWT tokens
- User profiles with personal statistics
- Guest mode with local storage fallback

### Leaderboard System

- Global leaderboards across multiple timeframes
- Detailed score metrics (level, duration, enemies killed)
- Personal score history
- Real-time updates
- Difficulty-based rankings

### Scoring System

- Points for enemy elimination
- Bonus points for level completion
- Multiplier effects for consecutive hits
- Power-up collection bonuses

## Project Structure

```
space-shooter/
├── client/                 # Frontend files
│   ├── assets/            # Game assets
│   │   ├── audio/         # Sound effects and music
│   │   ├── sprites/       # Game sprites
│   │   ├── backgrounds/   # Background images
│   │   └── ui/           # UI elements
│   ├── css/              # Stylesheets
│   ├── js/               # Game scripts
│   │   ├── api-service.js       # Backend API service
│   │   ├── auth-ui.js          # Authentication UI
│   │   └── leaderboard-manager.js # Leaderboard management
│   ├── *.js              # Core game modules
│   └── index.html        # Main game page
├── server/               # Backend files
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── server.ts     # Main server file
│   ├── dist/            # Compiled JavaScript
│   └── package.json     # Server dependencies
└── package.json         # Root package file
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Rate Limiting** - Prevents brute force attacks
- **Input Validation** - Validates and sanitizes all inputs
- **CORS Protection** - Configurable cross-origin policies
- **Helmet Security** - Security headers and protection
- **MongoDB Injection Prevention** - Input sanitization

## Development

### Adding New Features

1. Backend changes go in `server/src/`
2. Frontend changes go in `client/`
3. Follow the existing code structure
4. Update API documentation

### Testing

```bash
cd server
npm test
```

### Building for Production

```bash
cd server
npm run build
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check MongoDB is running
   - Verify MONGODB_URI in .env file
   - Check network connectivity

2. **CORS Errors**

   - Verify CLIENT_URL in .env matches your frontend URL
   - Check browser console for specific CORS errors

3. **Authentication Issues**

   - Clear browser localStorage
   - Check JWT_SECRET is set in .env
   - Verify token expiration settings

4. **Game Performance Issues**
   - Press 'P' to cycle performance levels
   - Disable particle effects in settings
   - Check browser console for errors

### Logs and Debugging

- Server logs are output to console
- Browser console shows client-side errors
- Check Network tab for API request issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- [ ] Multiplayer support
- [ ] More enemy types and boss battles
- [ ] Achievement system
- [ ] Social features (friend lists, challenges)
- [ ] Mobile app version
- [ ] Advanced graphics and effects
- [ ] Tournament mode
- [ ] Replay system
