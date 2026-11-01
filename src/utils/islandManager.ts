export interface IslandNotification {
  id: string;
  type: 'check' | 'cloud' | 'pin' | 'bill' | 'lang' | 'wallet' | 'sync';
  title: string;
  subtitle?: string;
  duration?: number;
}

type Listener = (notification: IslandNotification | null) => void;

let currentNotification: IslandNotification | null = null;
let listeners: Set<Listener> = new Set();
let timer: any = null;

export const islandManager = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(currentNotification);
    return () => {
      listeners.delete(listener);
    };
  },

  notify(notification: Omit<IslandNotification, 'id'>) {
    if (timer) clearTimeout(timer);

    const fullNotif: IslandNotification = {
      ...notification,
      id: 'island_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      duration: notification.duration || 3200,
    };

    currentNotification = fullNotif;
    listeners.forEach((l) => l(currentNotification));

    timer = setTimeout(() => {
      currentNotification = null;
      listeners.forEach((l) => l(null));
      timer = null;
    }, fullNotif.duration);
  },

  clear() {
    if (timer) clearTimeout(timer);
    currentNotification = null;
    listeners.forEach((l) => l(null));
    timer = null;
  },
};
