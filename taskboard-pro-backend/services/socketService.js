const socketIO = require('socket.io');
const socketAuth = require("../middleware/socketAuth")

let io;

exports.init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Apply authentication middleware
  io.use(socketAuth);

  // Socket connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Join a project room
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });
    
    // Leave a project room
    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project:${projectId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Function to emit task updates to project room
exports.emitTaskUpdate = (projectId, task) => {
  if (io) {
    io.to(`project:${projectId}`).emit('task-updated', task);
  }
};

// Function to emit task creation to project room
exports.emitTaskCreated = (projectId, task) => {
  if (io) {
    io.to(`project:${projectId}`).emit('task-created', task);
  }
};

// Function to emit task deletion to project room
exports.emitTaskDeleted = (projectId, taskId) => {
  if (io) {
    io.to(`project:${projectId}`).emit('task-deleted', taskId);
  }
};

// Function to emit comment creation to project room
exports.emitCommentAdded = (projectId, taskId, comment) => {
  if (io) {
    io.to(`project:${projectId}`).emit('comment-added', { taskId, comment });
  }
};

// Function to emit project update to project members
exports.emitProjectUpdate = (projectId, project) => {
  if (io) {
    io.to(`project:${projectId}`).emit('project-updated', project);
  }
};

// Function to emit notifications to specific users
exports.emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Get singleton instance
exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};