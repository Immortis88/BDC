import { queryClient } from '../queryClient.js';

const CHANNEL_NAME = 'bdc_camp_channel';
const STORAGE_KEY = 'bdc_camp_updated_at';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  // BroadcastChannel not available in environment
}

/**
 * Notifies all query caches, listeners, and other browser tabs that
 * camp details or live-camp status were modified.
 */
export function notifyCampUpdated(data = {}) {
  // 1. Invalidate current tab's active queries
  queryClient.invalidateQueries({ queryKey: ['camps'] });
  queryClient.invalidateQueries({ queryKey: ['public'] });

  // 2. Broadcast to other tabs via modern BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CAMP_UPDATED', timestamp: Date.now(), ...data });
    } catch (e) {
      // ignore
    }
  }

  // 3. Fallback for cross-tab sync via localStorage storage event
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, `${Date.now()}_${Math.random()}`);
    }
  } catch (e) {
    // ignore
  }

  // 4. In-page custom event for non-react listeners
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdc:camp-updated', { detail: data }));
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Subscribes to camp update events across browser tabs and within the current page.
 * Returns an unregister function.
 */
export function subscribeToCampUpdates(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event) => {
    callback(event?.data || {});
  };

  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      callback({ type: 'STORAGE_SYNC', timestamp: Date.now() });
    }
  };

  const handleCustom = (event) => {
    callback(event?.detail || {});
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);
  window.addEventListener('bdc:camp-updated', handleCustom);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('bdc:camp-updated', handleCustom);
  };
}
