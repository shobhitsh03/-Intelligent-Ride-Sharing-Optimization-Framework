import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Socket.IO hook for live ride tracking
export function useRideTracking(rideId, userId) {
  const [location, setLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!rideId || !userId) return;

    // Connect to the live tracking namespace
    const socket = io('/api/track/live', {
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to ride tracking');
      setIsConnected(true);
      setError(null);
      
      // Join the ride room to receive updates
      socket.emit('join', { rideId });
      
      // Also join user room for notifications
      socket.emit('join:user', { userId });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from ride tracking');
      setIsConnected(false);
    });

    // Listen for location updates
    socket.on('location', (data) => {
      if (data.rideId === rideId) {
        setLocation({
          lat: data.coords.lat,
          lng: data.coords.lng,
          timestamp: data.ts,
        });
      }
    });

    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to live tracking');
      setIsConnected(false);
    });

    return () => {
      // Clean up on unmount
      if (socketRef.current) {
        socketRef.current.emit('leave:user', { userId });
        socketRef.current.disconnect();
      }
    };
  }, [rideId, userId]);

  // Function to send location (for drivers)
  const sendLocation = (coords) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('location', {
        rideId,
        coords: {
          lat: coords.lat,
          lng: coords.lng,
        },
      });
    }
  };

  return {
    location,
    isConnected,
    error,
    sendLocation,
  };
}

// Hook for getting user's current location
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLoading(false);
      },
      (error) => {
        setError(error.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // Watch position continuously
  const watchPosition = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        setPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    watchPosition,
  };
}
