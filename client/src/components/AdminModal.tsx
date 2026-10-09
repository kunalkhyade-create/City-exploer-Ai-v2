import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, AlertOctagon, RefreshCw, Key, Filter, Check, Eye } from 'lucide-react';
import { api } from '../api/client';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState('admin_secret_pune_2026');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('Verified');
  const [moderatorNote, setModeratorNote] = useState('Verified by Pune city pulse moderator team');
  const [authError, setAuthError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAdminReports = async (t: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const data = await api.getAdminReports(t);
      setReports(data.items || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Check ADMIN_TOKEN.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    fetchAdminReports(token);
  };

  const handleUpdateStatus = async (reportId: string) => {
    if (!moderatorNote.trim()) return;
    setIsLoading(true);
    setActionSuccess('');
    try {
      await api.updateReportStatus(token, reportId, newStatus, moderatorNote);
      setActionSuccess(`Report ${reportId} marked as ${newStatus}`);
      setSelectedReport(null);
      await fetchAdminReports(token);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update report status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pune Citizen Report Moderator Portal
              </h3>
              <p className="text-[11px] text-slate-400">
                Constant-Time Secure ADMIN_TOKEN Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-6 sm:p-8 max-w-md mx-auto w-full space-y-4 text-xs">
            <div className="text-center space-y-1">
              <Key className="w-8 h-8 text-orange-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Enter Administrator Token</h4>
              <p className="text-slate-400 text-[11px]">
                Authorized municipal moderators only. Checks constant-time Bearer token.
              </p>
            </div>

            <div>
              <input
                type="password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ADMIN_TOKEN"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 font-mono text-center tracking-wider focus:outline-none focus:border-orange-500"
              />
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2.5 rounded-lg text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition shadow-md"
            >
              {isLoading ? 'Verifying...' : 'Access Portal'}
            </button>
          </form>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5 text-xs">
            {actionSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-2 rounded-lg mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* List of Reports */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">
                  No citizen reports submitted yet.
                </div>
              ) : (
                reports.map(r => (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-xl border transition ${
                      r.status === 'Pending'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : r.status === 'Verified'
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : r.status === 'Rejected'
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-slate-800/40 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'Verified'
                              ? 'bg-emerald-500 text-white'
                              : r.status === 'Pending'
                              ? 'bg-amber-500 text-black'
                              : r.status === 'Rejected'
                              ? 'bg-rose-500 text-white'
                              : 'bg-sky-500 text-white'
                          }`}>
                            {r.status}
                          </span>
                          <span className="text-slate-400 text-[11px] font-semibold uppercase">{r.category}</span>
                          <span className="text-slate-500 text-[10px]">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h5 className="font-bold text-slate-200 text-sm">{r.title}</h5>
                        <p className="text-slate-300 mt-1 leading-relaxed">{r.description}</p>
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-3">
                          <span>📍 Coords: {r.lat.toFixed(4)}, {r.lng.toFixed(4)}</span>
                          <span>📎 Attachments: {r.media_count || 0}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setNewStatus(r.status === 'Pending' ? 'Verified' : r.status);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-medium transition shrink-0"
                      >
                        Moderate
                      </button>
                    </div>

                    {/* Moderate Drawer inside card if selected */}
                    {selectedReport?.id === r.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 bg-slate-950/40 p-3 rounded-lg space-y-2.5">
                        <div className="flex items-center gap-3">
                          <label className="text-slate-400 font-semibold">Change Status:</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          >
                            <option value="Verified">Verified (Confirmed Fact)</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 font-semibold block mb-1">Audit Note (Logged to History):</label>
                          <input
                            type="text"
                            value={moderatorNote}
                            onChange={(e) => setModeratorNote(e.target.value)}
                            placeholder="Reason for verification or rejection..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setSelectedReport(null)}
                            className="px-3 py-1 bg-slate-800 text-slate-400 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id)}
                            disabled={isLoading}
                            className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded shadow transition"
                          >
                            Commit Status Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
