// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authMiddleware = require('./middleware/authMiddleware');
const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app); // Use http server for Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with frontend URL in production
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// Socket.IO handling
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    // also emit to the room that a user has joined
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('canvas-update', ({ roomId, data, source }) => {
    socket.to(roomId).emit('canvas-update', {canvasData: data, source});
  });

  socket.on("cursor-update", ({ roomId, cursorData }) => {
    socket.to(roomId).emit("cursor-update", {
      socketId: socket.id,
      cursorData
    });
  });

  socket.on('disconnect', () => {
    console.log('🚫 User disconnected:', socket.id);
  });
});

// MongoDB and server start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // Use http server
}).catch(err => console.error(err));
