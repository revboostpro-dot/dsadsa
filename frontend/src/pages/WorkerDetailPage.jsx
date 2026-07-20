import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Wallet, CheckCircle2, XCircle,
  Clock, CreditCard, StickyNote, Play, Plus, Minus,
  Check, X, DollarSign, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { workersApi, batchesApi } from '../services/api';
import useStore from '../store/useStore';
import PaymentModal from '../components/PaymentModal';
import ProgressCard from '../components/ProgressCard';
import WorkerHistory from '../components/WorkerHistory';
import StatusBadge from '../components/StatusBadge';

export default function WorkerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateWorker } = useStore();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('progress'); // progress | history

  const fetchWorker = useCallback(async () => {
    try {
      const res = await workersApi.get(id);
      setWorker(res.data.data);
    } catch (err) {
      toast.error('Failed to load worker');
      navigate('/workers');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  // Listen to global store updates for this worker
  const storeWorkers = useStore((s) => s.workers);
  useEffect(() => {
    const updated = storeWorkers.find((w) => w.id === id);
    if (updated) {
      setWorker((prev) => prev ? { ...prev, ...updated } : prev);
    }
  }, [storeWorkers, id]);

  const activeBatch = worker?.batches?.find((b) => b.status === 'ACTIVE');
  const isMyWorker  = worker?.lockedById === user?.id;
  const canControl  = worker?.status === 'LOCKED' && isMyWorker;

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      let res;
      switch (action) {
        case 'start':
          res = await batchesApi.start(worker.id);
          setWorker((prev) => ({ ...prev, ...res.data.data }));
          toast.success('Batch started!');
          break;
        case 'done':
        case 'undo':
          res = await batchesApi.progress(worker.id, action);
          setWorker((prev) => ({
            ...prev,
            ...res.data.data.worker,
            batches: prev.batches.map((b) =>
              b.id === res.data.data.batch.id ? { ...b, ...res.data.data.batch } : b
            ),
          }));
          break;
        case 'finish':
          res = await batchesApi.finish(worker.id);
          toast.success(`Batch finished! Earned ₹${res.data.data.earned}`);
          fetchWorker();
          break;
        case 'cancel':
          res = await batchesApi.cancel(worker.id);
          toast('Batch cancelled', { icon: '❌' });
          fetchWorker();
          break;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || `Action failed`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content px-4 pt-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="flex-1">
            <div className="skeleton h-5 w-32 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 mb-3 rounded-2xl" />)}
      </div>
    );
  }

  if (!worker) return null;

  const progress    = activeBatch?.progress ?? 0;
  const maxProgress = activeBatch?.maxProgress ?? 5;

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button id="worker-back-btn" className="btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{worker.workerId}</h1>
            <StatusBadge status={worker.status} />
          </div>
          <p className="text-text-secondary text-sm">{worker.name}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-text-muted text-xs">Balance</p>
              <p className="text-primary font-bold">₹{worker.balance?.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-text-muted text-xs">Lifetime Passed</p>
              <p className="text-green-400 font-bold">{worker.lifetimePassed}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-text-muted text-xs">Lifetime Failed</p>
              <p className="text-red-400 font-bold">{worker.lifetimeFailed}</p>
            </div>
          </div>
          {worker.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Phone</p>
                <p className="text-text-primary text-sm font-medium">{worker.phone}</p>
              </div>
            </div>
          )}
          {worker.upiId && (
            <div className="flex items-center gap-3 col-span-2">
              <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-text-muted text-xs">UPI ID</p>
                <p className="text-text-primary text-sm font-medium">{worker.upiId}</p>
              </div>
            </div>
          )}
        </div>

        {worker.status === 'LOCKED' && (
          <div className="mt-3 pt-3 border-t border-bg-border">
            <p className="text-yellow-400 text-xs font-medium">
              🔒 Locked by {worker.lockedBy?.name || 'someone'}
            </p>
          </div>
        )}

        {worker.status === 'COOLDOWN' && worker.cooldownUntil && (
          <div className="mt-3 pt-3 border-t border-bg-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-xs font-medium">
              Cooldown until {new Date(worker.cooldownUntil).toLocaleTimeString()}
            </p>
          </div>
        )}

        {worker.notes && (
          <div className="mt-3 pt-3 border-t border-bg-border flex items-start gap-2">
            <StickyNote className="w-4 h-4 text-text-muted mt-0.5" />
            <p className="text-text-secondary text-xs">{worker.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-bg-elevated p-1 rounded-xl">
        {['progress', 'history'].map((tab) => (
          <button
            key={tab}
            id={`worker-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary text-bg shadow-glow-sm'
                : 'text-text-secondary'
            }`}
          >
            {tab === 'progress' ? '⚡ Batch' : '📋 History'}
          </button>
        ))}
      </div>

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="animate-fade-in">
          <ProgressCard
            progress={progress}
            maxProgress={maxProgress}
            status={worker.status}
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-4">
            {/* Start Batch */}
            {worker.status === 'AVAILABLE' && (
              <button
                id="batch-start-btn"
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 animate-bounce-in"
                onClick={() => handleAction('start')}
                disabled={actionLoading}
              >
                <Play className="w-5 h-5" />
                Start Batch
              </button>
            )}

            {/* Batch Controls */}
            {canControl && (
              <div className="flex flex-col gap-3 animate-slide-up">
                {/* Done & Undo */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="batch-undo-btn"
                    className="btn-secondary py-4 flex items-center justify-center gap-2"
                    onClick={() => handleAction('undo')}
                    disabled={actionLoading || progress === 0}
                  >
                    <Minus className="w-5 h-5" />
                    Undo
                  </button>
                  <button
                    id="batch-done-btn"
                    className="btn-primary py-4 flex items-center justify-center gap-2"
                    onClick={() => handleAction('done')}
                    disabled={actionLoading || progress >= maxProgress}
                  >
                    <Plus className="w-5 h-5" />
                    + Done
                  </button>
                </div>

                {/* Finish & Cancel */}
                <button
                  id="batch-finish-btn"
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                  onClick={() => handleAction('finish')}
                  disabled={actionLoading}
                >
                  <Check className="w-5 h-5" />
                  Finish Batch ({progress} passed)
                </button>

                <button
                  id="batch-cancel-btn"
                  className="btn-danger w-full py-3 flex items-center justify-center gap-2"
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading}
                >
                  <X className="w-4 h-4" />
                  Cancel Batch
                </button>
              </div>
            )}

            {/* Locked by someone else */}
            {worker.status === 'LOCKED' && !isMyWorker && (
              <div className="card p-4 text-center animate-fade-in">
                <p className="text-yellow-400 font-medium">
                  🔒 Worker locked by {worker.lockedBy?.name}
                </p>
                <p className="text-text-muted text-xs mt-1">Wait for them to finish</p>
              </div>
            )}

            {/* Cooldown message */}
            {worker.status === 'COOLDOWN' && (
              <div className="card p-4 text-center animate-fade-in">
                <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-medium">Worker on Cooldown</p>
                <p className="text-text-muted text-xs mt-1">
                  Available at {worker.cooldownUntil ? new Date(worker.cooldownUntil).toLocaleString() : 'soon'}
                </p>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="mt-5 card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Payment</h3>
              {worker.balance > 0 && (
                <span className="badge-available">₹{worker.balance?.toFixed(0)} pending</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-text-muted text-xs mb-1">Balance</p>
                <p className="text-primary font-bold text-lg">₹{worker.balance?.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs mb-1">Paid</p>
                <p className="text-text-secondary font-bold text-lg">₹{worker.alreadyPaid?.toFixed(0) || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs mb-1">Lifetime</p>
                <p className="text-text-primary font-bold text-lg">₹{worker.lifetimeEarnings?.toFixed(0) || 0}</p>
              </div>
            </div>
            <button
              id="pay-worker-btn"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              onClick={() => setShowPayment(true)}
              disabled={worker.balance <= 0}
            >
              <DollarSign className="w-4 h-4" />
              Pay Worker
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <WorkerHistory
          batches={worker.batches || []}
          payments={worker.payments || []}
          history={worker.history || []}
        />
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          worker={worker}
          onClose={() => setShowPayment(false)}
          onSuccess={(updatedWorker) => {
            setWorker((prev) => ({ ...prev, ...updatedWorker }));
            setShowPayment(false);
          }}
        />
      )}
    </div>
  );
}
