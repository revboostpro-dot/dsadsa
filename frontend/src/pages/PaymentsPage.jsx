import { useState, useEffect } from 'react';
import { CreditCard, TrendingDown, Users, ArrowDownLeft } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, summaryRes] = await Promise.all([
          paymentsApi.list({ limit: 100 }),
          paymentsApi.summary(),
        ]);
        setPayments(paymentsRes.data.data);
        setSummary(summaryRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Payments</h1>
        <CreditCard className="w-5 h-5 text-primary" />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <p className="text-text-muted text-xs">Today Paid</p>
            <p className="text-primary text-xl font-bold">₹{summary.todayPaid?.toFixed(0)}</p>
          </div>
          <div className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-text-muted text-xs">Pending Workers</p>
            <p className="text-orange-400 text-xl font-bold">{summary.pendingWorkers}</p>
          </div>
          <div className="stat-card col-span-2">
            <p className="text-text-muted text-xs">Total Pending Amount</p>
            <p className="text-red-400 text-2xl font-bold">₹{summary.pendingAmount?.toFixed(0)}</p>
          </div>
        </div>
      )}

      {/* Payments List */}
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Recent Payments
      </h2>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center">
          <CreditCard className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No payments yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <div key={payment.id} className="card p-4 flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm truncate">
                  {payment.worker?.workerId} — {payment.worker?.name}
                </p>
                <p className="text-text-muted text-xs">
                  {payment.paidBy?.name} • {format(new Date(payment.paidAt), 'dd MMM, HH:mm')}
                </p>
                {payment.note && <p className="text-text-secondary text-xs mt-0.5 truncate">{payment.note}</p>}
              </div>
              <p className="text-primary font-bold flex-shrink-0">₹{payment.amount?.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
