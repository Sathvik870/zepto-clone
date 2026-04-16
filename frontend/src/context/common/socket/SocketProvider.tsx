import { useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContext } from './SocketContext.ts'; 

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL; 
    const newSocket = io(API_URL, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};