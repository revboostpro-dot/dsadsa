import { useEffect, useCallback } from 'react';
import { workersApi } from '../services/api';
import useStore from '../store/useStore';

export function useWorkers() {
  const {
    workers, workersLoading, stats,
    setWorkers, setStats, setWorkersLoading,
    searchQuery, statusFilter, supervisorFilter,
  } = useStore();

  const fetchWorkers = useCallback(async () => {
    setWorkersLoading(true);
    try {
      const params = {};
      if (searchQuery)      params.search     = searchQuery;
      if (statusFilter)     params.status     = statusFilter;
      if (supervisorFilter) params.supervisorId = supervisorFilter;

      const res = await workersApi.list(params);
      setWorkers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setWorkersLoading(false);
    }
  }, [searchQuery, statusFilter, supervisorFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await workersApi.stats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh stats every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { workers, workersLoading, stats, refetch: fetchWorkers, refetchStats: fetchStats };
}
