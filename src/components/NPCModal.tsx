import React, { useState } from 'react';
import { NPC, PlayerRole } from '../types/game';
import { MessageSquare, Shield, Mail, BookOpen, Coffee, Award, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface NPCModalProps {
  npc: NPC | null;
  onClose: () => void;
  onSwitchRole?: (role: PlayerRole) => void;
  onAdvancePatrol?: () => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({
  npc,
  onClose,
  onSwitchRole,
  onAdvancePatrol,
}) => {
  const [dialogIndex, setDialogIndex] = useState(0);

  if (!npc) return null;

  const handleNextDialog = () => {
    sound.playMailboxChime();
    if (dialogIndex < npc.dialog.length - 1) {
      setDialogIndex((prev) => prev + 1);
    } else {
      if (npc.role === 'policeman') {
        onAdvancePatrol?.();
      }
      onClose();
    }
  };

  const getRoleIcon = () => {
    switch (npc.role) {
      case 'policeman': return <Shield className="w-6 h-6 text-blue-600" />;
      case 'mailman': return <Mail className="w-6 h-6 text-blue-500" />;
      case 'teacher': return <BookOpen className="w-6 h-6 text-purple-600" />;
      case 'baker': return <Coffee className="w-6 h-6 text-amber-600" />;
      default: return <MessageSquare className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-4 border-slate-100 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-2xl shadow-xs">
              {getRoleIcon()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Neighborhood Resident
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">{npc.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl font-bold p-1 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Dialog bubble */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Activity: {npc.activity}</span>
          </div>

          <div className="relative bg-blue-50/80 p-5 rounded-3xl border-2 border-blue-200/80 shadow-xs">
            <p className="text-sm font-semibold text-slate-800 leading-relaxed italic">
              "{npc.dialog[dialogIndex]}"
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-blue-600 font-bold">
              <span>
                {dialogIndex + 1} of {npc.dialog.length}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Click Next to continue conversation
              </span>
            </div>
          </div>

          {npc.role === 'policeman' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Officer Davis approves your neighborhood patrol!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
          >
            Leave
          </button>

          <button
            onClick={handleNextDialog}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <span>{dialogIndex < npc.dialog.length - 1 ? 'Next' : 'Thanks, Officer/Friend!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
