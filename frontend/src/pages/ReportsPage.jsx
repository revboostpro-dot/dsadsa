import { useState, useEffect } from 'react';
import { BarChart2, Calendar, FileText, Download, TrendingUp } from 'lucide-react';
import { reportsApi } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function TabBtn({ id, active, onClick, children }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-primary text-bg' : 'text-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'daily')   res = await reportsApi.daily({ date });
      if (tab === 'weekly')  res = await reportsApi.weekly({});
      if (tab === 'payroll') res = await reportsApi.payroll();
      setReport(res.data.data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [tab, date]);

  const exportCSV = (data, filename) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div className="page-content px-4 pt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Reports</h1>
        <BarChart2 className="w-5 h-5 text-primary" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-bg-elevated p-1 rounded-xl">
        <TabBtn id="tab-daily"   active={tab === 'daily'}   onClick={() => setTab('daily')}>📅 Daily</TabBtn>
        <TabBtn id="tab-weekly"  active={tab === 'weekly'}  onClick={() => setTab('weekly')}>📆 Weekly</TabBtn>
        <TabBtn id="tab-payroll" active={tab === 'payroll'} onClick={() => setTab('payroll')}>💰 Payroll</TabBtn>
      </div>

      {tab === 'daily' && (
        <div className="mb-4">
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : !report ? null : (
        <div className="animate-fade-in">
          {/* Daily Summary */}
          {tab === 'daily' && report.summary && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="stat-card">
                  <p className="text-text-muted text-xs">Batches</p>
                  <p className="text-text-primary text-2xl font-bold">{report.summary.batchCount}</p>
                </div>
                <div className="stat-card">
                  <p className="text-text-muted text-xs">Passed</p>
                  <p className="text-primary text-2xl font-bold">{report.summary.totalPassed}</p>
                </div>
                <div className="stat-card">
                  <p className="text-text-muted text-xs">Failed</p>
                  <p className="text-red-400 text-2xl font-bold">{report.summary.totalFailed}</p>
                </div>
                <div className="stat-card">
                  <p className="text-text-muted text-xs">Payments</p>
                  <p className="text-purple-400 text-2xl font-bold">₹{report.summary.totalPayments?.toFixed(0)}</p>
                </div>
              </div>

              {/* Batches list */}
              {report.batches?.length > 0 && (
                <div className="card p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-text-primary">Batches</h3>
                    <button
                      id="export-batches-csv"
                      onClick={() => exportCSV(report.batches.map((b) => ({
                        Worker: b.worker?.workerId,
                        Name: b.worker?.name,
                        Passed: b.passed,
                        Failed: b.failed,
                        Supervisor: b.supervisor?.name,
                        Time: b.finishedAt,
                      })), `batches-${date}.csv`)}
                      className="flex items-center gap-1 text-text-muted text-xs"
                    >
                      <Download className="w-3 h-3" /> CSV
                    </button>
                  </div>
                  <div className="flex flex-col divide-y divide-bg-border">
                    {report.batches.map((b, i) => (
                      <div key={i} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="text-text-primary text-sm font-medium">{b.worker?.workerId} — {b.worker?.name}</p>
                          <p className="text-text-muted text-xs">{b.supervisor?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary text-sm font-bold">{b.passed} ✓</p>
                          <p className="text-red-400 text-xs">{b.failed} ✗</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Weekly Chart */}
          {tab === 'weekly' && report.days && (
            <div className="card p-4 mb-4">
              <h3 className="font-semibold text-text-primary mb-4">Weekly Overview</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(report.days).map(([day, data]) => (
                  <div key={day} className="flex items-center gap-3">
                    <p className="text-text-muted text-xs w-20">{format(new Date(day), 'EEE dd MMM')}</p>
                    <div className="flex-1">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min((data.passed / 50) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p className="text-text-primary text-xs font-medium">{data.passed} ✓</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payroll */}
          {tab === 'payroll' && report.payroll && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="stat-card">
                  <p className="text-text-muted text-xs">Total Pending</p>
                  <p className="text-primary text-2xl font-bold">₹{report.totalPending?.toFixed(0)}</p>
                </div>
                <div className="stat-card">
                  <p className="text-text-muted text-xs">Total Paid</p>
                  <p className="text-text-secondary text-2xl font-bold">₹{report.totalPaid?.toFixed(0)}</p>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-text-primary">Payroll ({report.payroll.length} workers)</h3>
                  <button
                    id="export-payroll-csv"
                    onClick={() => exportCSV(report.payroll, 'payroll.csv')}
                    className="flex items-center gap-1 text-text-muted text-xs"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-bg-border">
                  {report.payroll
                    .filter((w) => w.balance > 0)
                    .map((w, i) => (
                      <div key={i} className="py-3 flex justify-between items-start">
                        <div>
                          <p className="text-text-primary font-medium text-sm">{w.workerId} — {w.name}</p>
                          <p className="text-text-muted text-xs">{w.upiId || w.phone || 'No payment info'}</p>
                        </div>
                        <p className="text-primary font-bold">₹{w.balance?.toFixed(0)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
