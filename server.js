const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: "*" })); // Adjust origin for production, if needed

const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 1800000, // 30 minutes
  pingInterval: 25000,  // 25 seconds
});

io.on('connection', (socket) => {
  console.log('[DEBUG] New client connected:', socket.id);

  // Join a room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`[DEBUG] Socket ${socket.id} joined room: ${roomId}`);
    socket.to(roomId).emit('roomMessage', `User ${socket.id} has joined the room.`);
  });

  // Handle chat messages
  socket.on('chatMessage', ({ roomId, message }) => {
    console.log(`[DEBUG] Message in room ${roomId}: ${message}`);
    io.to(roomId).emit('roomMessage', `User ${socket.id}: ${message}`);
  });

  // *************************
  // VIDEO SYNC EVENTS
  // *************************
  
  // When a client plays the video
  socket.on('video:play', ({ roomId, currentTime }) => {
    console.log(`[DEBUG] video:play from socket ${socket.id}, currentTime=${currentTime}`);
    // Broadcast to everyone else in the room
    socket.to(roomId).emit('video:play', { currentTime });
  });

  // When a client pauses the video
  socket.on('video:pause', ({ roomId, currentTime }) => {
    console.log(`[DEBUG] video:pause from socket ${socket.id}, currentTime=${currentTime}`);
    socket.to(roomId).emit('video:pause', { currentTime });
  });

  // When a client seeks the video
  socket.on('video:seek', ({ roomId, currentTime }) => {
    console.log(`[DEBUG] video:seek from socket ${socket.id}, currentTime=${currentTime}`);
    socket.to(roomId).emit('video:seek', { currentTime });
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log('[DEBUG] Client disconnected:', socket.id, 'Reason:', reason);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log('[DEBUG] video-sharing-backend is running on http://localhost:' + PORT);
});
