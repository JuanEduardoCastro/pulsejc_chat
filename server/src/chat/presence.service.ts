import { Injectable } from '@nestjs/common';

const GRACE_PERIOD_MS = 5000; // 5 seconds

@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, Set<string>>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  addConnection(userId: string, socketId: string): boolean {
    const pendingTimer = this.disconnectTimers.get(userId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.disconnectTimers.delete(userId);
    }

    const wasOffline = !this.onlineUsers.get(userId)?.size;

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);

    return wasOffline;
  }

  removeConnection(userId: string, socketId: string, onGoOffline: () => void) {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size > 0) return;

    const timer = setTimeout(() => {
      const current = this.onlineUsers.get(userId);
      if (current && current.size === 0) {
        this.onlineUsers.delete(userId);
        onGoOffline();
      }
      this.disconnectTimers.delete(userId);
    }, GRACE_PERIOD_MS);
    this.disconnectTimers.set(userId, timer);
  }

  isOnline(userId: string): boolean {
    return !!this.onlineUsers.get(userId)?.size;
  }
}
