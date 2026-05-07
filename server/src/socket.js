export default function initSockets(io) {
  const nsp = io.of('/api/track/live');

  nsp.on('connection', (socket) => {
    // Client should emit join with rideId to receive updates
    socket.on('join', ({ rideId }) => {
      if (rideId) socket.join(rideId);
    });

    // Drivers emit location updates
    socket.on('location', ({ rideId, coords }) => {
      if (!rideId || !coords) return;
      // Broadcast to all riders in the same ride room
      socket.to(rideId).emit('location', { rideId, coords, ts: Date.now() });
    });

    socket.on('disconnect', () => {});
  });

  // Generic channel for notifications: join by userId
  io.on('connection', (socket) => {
    socket.on('join:user', ({ userId }) => {
      if (userId) socket.join(String(userId));
    });
    socket.on('leave:user', ({ userId }) => {
      if (userId) socket.leave(String(userId));
    });

    // Join ride room for booking notifications
    socket.on('join:ride', ({ rideId }) => {
      if (rideId) socket.join(String(rideId));
    });

    // Leave ride room
    socket.on('leave:ride', ({ rideId }) => {
      if (rideId) socket.leave(String(rideId));
    });
  });
}
