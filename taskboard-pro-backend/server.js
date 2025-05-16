const express = require('express');
const http = require('http'); 
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require("./routes/authRoutes")
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require("./routes/taskRoutes");
const automationRoutes = require("./routes/automationRoutes");
const notificationRoutes = require("./routes/notificationRoutes")

// Initialize Express app
const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize Socket.io
const socketService = require('./services/socketService');
const schedulerService = require('./services/schedulerService');
socketService.init(server);

// Connect to MongoDB
connectDB();
schedulerService.init();

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/notifications' , notificationRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  res.status(status).json({ message });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { // Use server instead of app
  console.log(`Server running on port ${PORT}`);
});