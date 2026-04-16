import { useContext } from 'react';
import { SocketContext } from './SocketContext';
import type { Socket } from 'socket.io-client';

export const useSocket = (): Socket | null => {
  return useContext(SocketContext);
};