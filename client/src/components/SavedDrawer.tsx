import React from 'react';
import { X, Bookmark, Trash2, MapPin, IndianRupee } from 'lucide-react';
import { Place } from '../types';

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlaces: Place[];
  onRemove: (placeId: string) => void;
  onSelectPlace: (place: Place) => void;
}

export const SavedDrawer: React.FC<SavedDrawerProps> = ({
  isOpen,
  onClose,
  savedPlaces,
  onRemove,
  onSelectPlace,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Saved Places</h3>
            <span className="text-xs bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full">
              {savedPlaces.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          {savedPlaces.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Bookmark className="w-10 h-10 stroke-1 text-slate-600 mb-2" />
              <p className="font-medium">No saved places yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Click the bookmark icon on any stop or place card to save it to your session.
              </p>
            </div>
          ) : (
            savedPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  onSelectPlace(place);
                  onClose();
                }}
                className="bg-slate-950/50 border border-slate-800 hover:border-orange-500/50 p-3.5 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {place.category}
                    </span>
                    <span className="text-orange-400 font-semibold text-xs">₹{place.indicative_price_inr}</span>
                  </div>
                  <h4 className="font-bold text-slate-200 group-hover:text-orange-400 transition text-sm">
                    {place.name}
                  </h4>
                  <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{place.description}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(place.id);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0 ml-2"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
