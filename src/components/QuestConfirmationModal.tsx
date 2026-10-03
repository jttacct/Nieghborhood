import React from 'react';
import { QuestStep } from '../types/game';
import { CheckCircle2, ChevronRight, Sparkles, Award, Compass, Shield, Mail, Flame, ShoppingBag, Heart, Bug } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface QuestConfirmationModalProps {
  quest: QuestStep | null;
  allQuests: QuestStep[];
  onConfirmAdvance: (questId: string) => void;
  onDismiss: () => void;
  onSelectQuest: (questId: string) => void;
}

export const QuestConfirmationModal: React.FC<QuestConfirmationModalProps> = ({
  quest,
  allQuests,
  onConfirmAdvance,
  onDismiss,
  onSelectQuest,
}) => {
  if (!quest) return null;

  const handleConfirm = () => {
    sound.playCompleteFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onConfirmAdvance(quest.id);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'mail': return <Mail className="w-6 h-6 text-blue-500" />;
      case 'shield': return <Shield className="w-6 h-6 text-indigo-500" />;
      case 'flame': return <Flame className="w-6 h-6 text-red-500" />;
      case 'shopping-bag': return <ShoppingBag className="w-6 h-6 text-emerald-500" />;
      case 'heart': return <Heart className="w-6 h-6 text-pink-500" />;
      case 'bug': return <Bug className="w-6 h-6 text-amber-500" />;
      default: return <Award className="w-6 h-6 text-yellow-500" />;
    }
  };

  const isReady = quest.currentCount >= quest.targetCount && !quest.isCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border-4 border-amber-200 overflow-hidden text-slate-800">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 px-6 py-4 flex items-center justify-between border-b border-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm">
              {getIcon(quest.icon)}
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900/80 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {quest.sectorName}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                {quest.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-800 text-2xl font-bold p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Progress / Status banner */}
          <div className={`p-4 rounded-2xl border-2 ${
            isReady
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : quest.isCompleted
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center justify-between font-bold mb-1.5">
              <span>Sector Progress</span>
              <span className="text-base px-2.5 py-0.5 bg-white rounded-full shadow-xs">
                {quest.currentCount} / {quest.targetCount} Objectives
              </span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isReady || quest.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%` }}
              />
            </div>
            <p className="mt-2.5 text-sm">
              {quest.description}
            </p>
          </div>

          {/* Interactive Confirmation Question */}
          {isReady ? (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border-2 border-indigo-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
                <span>Sector Milestone Requirement Met!</span>
              </div>
              <p className="text-slate-700 text-sm">
                You have fulfilled this neighborhood sector's task. Would you like to confirm completion and move on to the next sector?
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl">
                <Award className="w-4 h-4 shrink-0" />
                <span>Reward upon confirmation: {quest.rewardText}</span>
              </div>
            </div>
          ) : quest.isCompleted ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-100/60 rounded-xl text-emerald-900 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>This neighborhood sector is completed and officially signed off! You can revisit anytime.</span>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700 text-sm">
              <strong className="block text-slate-900 mb-1">How to complete:</strong>
              {quest.instructions}
            </div>
          )}

          {/* All Neighborhood Sectors Quick Selector */}
          <div>
            <div className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between">
              <span>All Neighborhood Sectors ({allQuests.filter(q => q.isCompleted).length}/{allQuests.length} Done)</span>
              <Compass className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {allQuests.map((q, idx) => {
                const isSelected = q.id === quest.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuest(q.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/80 font-bold shadow-xs'
                        : q.isCompleted
                        ? 'border-emerald-200 bg-emerald-50/50 text-slate-700 hover:bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className="text-[10px] text-slate-400 block">Sector {idx + 1}</span>
                      <span className="truncate">{q.title}</span>
                    </div>
                    {q.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
                        {q.currentCount}/{q.targetCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/70 transition-colors"
          >
            {isReady ? 'Keep Playing This Sector' : 'Close Guide'}
          </button>

          {isReady && (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Yes, Complete & Move On</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
