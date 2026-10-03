import React, { useState } from 'react';
import { Insect, PlayerState } from '../types/game';
import { Bug, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { sound } from '../utils/audio';

interface InsectGuideModalProps {
  insects: Insect[];
  player: PlayerState;
  onClose: () => void;
  onCatchInsect: (insectId: string) => void;
  onReleaseAll: () => void;
}

export const InsectGuideModal: React.FC<InsectGuideModalProps> = ({
  insects,
  player,
  onClose,
  onCatchInsect,
  onReleaseAll,
}) => {
  const [selectedInsect, setSelectedInsect] = useState<Insect>(insects[0]);
  const caughtCount = insects.filter((i) => i.caught).length;

  const handleCatchDirectly = (ins: Insect) => {
    sound.playInsectCatch();
    onCatchInsect(ins.id);
  };

  const getEmoji = (species: Insect['species']) => {
    switch (species) {
      case 'butterfly': return '🦋';
      case 'bee': return '🐝';
      case 'ladybug': return '🐞';
      case 'dragonfly': return '🪲';
      case 'firefly': return '✨';
      default: return '🐛';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-emerald-100 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-black tracking-wider text-emerald-100">
                Naturalist Field Guide
              </span>
              <h2 className="text-xl font-extrabold leading-tight">Neighborhood Insects & Pollinators</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Insect Grid (left 2 cols) */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Cataloged: {caughtCount} / {insects.length}</span>
              <span className="text-[11px] text-emerald-600 font-extrabold">
                {Math.round((caughtCount / insects.length) * 100)}% Complete
              </span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {insects.map((ins) => {
                const isSelected = ins.id === selectedInsect.id;
                return (
                  <button
                    key={ins.id}
                    onClick={() => {
                      setSelectedInsect(ins);
                      sound.playInsectFlutter();
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : ins.caught
                        ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                        : 'border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{getEmoji(ins.species)}</span>
                      <div>
                        <div className="text-xs truncate">{ins.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{ins.rarity}</div>
                      </div>
                    </div>
                    {ins.caught ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                        Wild
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {caughtCount > 0 && (
              <button
                onClick={() => {
                  sound.playInsectFlutter();
                  onReleaseAll();
                }}
                className="w-full mt-3 py-2 px-3 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Release All Back to Gardens</span>
              </button>
            )}
          </div>

          {/* Selected Insect Details (right 3 cols) */}
          <div className="md:col-span-3 bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800">
                  {selectedInsect.rarity} species
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  Family: {selectedInsect.species}
                </span>
              </div>

              <div className="text-center py-4 bg-white rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
                <div className="text-6xl animate-pulse">
                  {getEmoji(selectedInsect.species)}
                </div>
                <h3 className="text-lg font-black text-slate-800 mt-2">
                  {selectedInsect.name}
                </h3>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Field Guide Observation Notes
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">
                  {selectedInsect.fact}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              {selectedInsect.caught ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold justify-center">
                  <Sparkles className="w-4 h-4" />
                  <span>Documented in your Naturalist Log!</span>
                </div>
              ) : (
                <button
                  onClick={() => handleCatchDirectly(selectedInsect)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  <span>Observe & Document with Bug Net</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
