import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { SOCKET_URL } from '../services/api';

let socketInstance = null;

export function useSocket() {
  const { isAuth, updateWorker, addWorker, removeWorker, addActivity, setStats } = useStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuth || initialized.current) return;
    initialized.current = true;

    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    // ─── Worker Events ──────────────────────────────────────────────────────
    socketInstance.on('worker:updated', (worker) => {
      updateWorker(worker);
    });

    socketInstance.on('worker:created', (worker) => {
      addWorker(worker);
      toast.success(`New worker ${worker.workerId} added`);
    });

    socketInstance.on('worker:deleted', ({ id }) => {
      removeWorker(id);
    });

    // ─── Activity Events ────────────────────────────────────────────────────
    socketInstance.on('activity:new', (event) => {
      addActivity(event);

      // Show toast for important events
      const toastMap = {
        batch_started:  { msg: event.details?.message || 'Batch started',    icon: '🚀' },
        batch_finished: { msg: event.details?.message || 'Batch finished',   icon: '✅' },
        batch_cancelled:{ msg: event.details?.message || 'Batch cancelled',  icon: '❌' },
        payment_made:   { msg: event.details?.message || 'Payment recorded', icon: '💰' },
        cooldown_reset: { msg: event.details?.message || 'Cooldown reset',   icon: '⏰' },
        force_unlocked: { msg: event.details?.message || 'Worker unlocked',  icon: '🔓' },
      };

      const t = toastMap[event.action];
      if (t) toast(t.msg, { icon: t.icon });
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        initialized.current = false;
      }
    };
  }, [isAuth]);

  return socketInstance;
}

export function subscribeToWorker(workerId) {
  socketInstance?.emit('worker:subscribe', workerId);
}

export function unsubscribeFromWorker(workerId) {
  socketInstance?.emit('worker:unsubscribe', workerId);
}
