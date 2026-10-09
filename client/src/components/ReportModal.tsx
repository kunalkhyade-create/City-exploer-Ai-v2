import React, { useState } from 'react';
import { X, AlertTriangle, Upload, Mic, Camera, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
  initialCoords?: { lat: number; lng: number };
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
  initialCoords = { lat: 18.5204, lng: 73.8567 },
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('waterlogging');
  const [lat, setLat] = useState(initialCoords.lat);
  const [lng, setLng] = useState(initialCoords.lng);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('lat', String(lat));
      formData.append('lng', String(lng));

      files.forEach(f => {
        formData.append('files', f);
      });

      const res = await api.submitReport(formData);
      setResult(res);
      onReportSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPiiPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b\d{10}\b/gi.test(
    `${title} ${description}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t('report_modal.title')}
              </h3>
              <p className="text-[11px] text-slate-400">Pune Citizen Community Watch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {result ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">Report Successfully Received</h4>
            <p className="text-xs text-slate-300">
              Report ID: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-400">{result.id}</code>
            </p>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="text-amber-400 font-semibold">Pending Moderator Review</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PII Redacted:</span>
                <span className={result.piiRedacted ? 'text-emerald-400' : 'text-slate-400'}>
                  {result.piiRedacted ? 'Yes (Protected)' : 'None detected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Media files processed:</span>
                <span className="text-slate-200">{result.mediaFilesSaved}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {t('report_modal.disclaimer')} Descriptions remain confidential until verified by moderators.
              </span>
            </div>

            {hasPiiPattern && (
              <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-lg text-sky-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Phone numbers and email addresses will be automatically masked upon intake.</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {t('report_modal.field_title')} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Road digging near Alka Talkies underpass"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {t('report_modal.field_category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="waterlogging">Waterlogging (Monsoon flood)</option>
                <option value="road work">Road Work / Metro Construction</option>
                <option value="poor lighting">Street Light Outage / Poor Lighting</option>
                <option value="closure">Road or Bridge Closure</option>
                <option value="traffic choke">Severe Traffic Chokepoint</option>
                <option value="general">General Safety / Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {t('report_modal.field_desc')} *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide accurate description, severity, landmark or approximate duration..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300"
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Attach Media (Optional: Photo max 5MB, Audio max 8MB)</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,audio/mp3,audio/wav,audio/webm,audio/ogg"
                onChange={handleFileChange}
                className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-orange-400 hover:file:bg-slate-700 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Magic byte inspection strips EXIF data for citizen privacy before storage.
              </p>
            </div>

            {errorMsg && (
              <div className="text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : t('report_modal.btn_submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
