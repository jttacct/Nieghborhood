import React, { useState } from 'react';
import { Animal, PlayerState } from '../types/game';
import { Heart, Sparkles, Flame, Check } from 'lucide-react';
import { sound } from '../utils/audio';

interface PetModalProps {
  animal: Animal | null;
  player: PlayerState;
  onClose: () => void;
  onUpdatePlayer: (updater: (prev: PlayerState) => PlayerState) => void;
  onRescueCat?: (catId: string) => void;
  onPetTended?: (animalId: string) => void;
}

export const PetModal: React.FC<PetModalProps> = ({
  animal,
  player,
  onClose,
  onUpdatePlayer,
  onRescueCat,
  onPetTended,
}) => {
  const [reactionText, setReactionText] = useState<string | null>(null);
  const [hearts, setHearts] = useState<number[]>([]);

  if (!animal) return null;

  const triggerReaction = (text: string) => {
    setReactionText(text);
    setHearts((prev) => [...prev, Date.now()]);
    setTimeout(() => {
      setReactionText(null);
    }, 2800);
  };

  const handlePet = () => {
    if (animal.species === 'cat') {
      sound.playCatPurr();
      triggerReaction(`${animal.name} begins purring softly and leans into your hand! ❤️`);
    } else {
      sound.playDogBark();
      triggerReaction(`${animal.name} wags their tail enthusiastically and leans against you! 🐕`);
    }
    onPetTended?.(animal.id);
  };

  const handleFeed = () => {
    if (animal.species === 'cat') {
      if (player.bag.catTreats <= 0) {
        triggerReaction(`No cat treats left in your bag! Visit the grocery store to buy more.`);
        return;
      }
      onUpdatePlayer((prev) => ({
        ...prev,
        bag: { ...prev.bag, catTreats: prev.bag.catTreats - 1 },
      }));
      sound.playCatMeow();
      triggerReaction(`You gave ${animal.name} a delicious fish treat! *crunch crunch* Purrr!`);
    } else {
      if (player.bag.dogTreats <= 0) {
        triggerReaction(`No dog treats left in your bag! Visit the grocery store to buy more.`);
        return;
      }
      onUpdatePlayer((prev) => ({
        ...prev,
        bag: { ...prev.bag, dogTreats: prev.bag.dogTreats - 1 },
      }));
      sound.playDogBark();
      triggerReaction(`You fed ${animal.name} a biscuit! Tail wagging at maximum speed!`);
    }
    onPetTended?.(animal.id);
  };

  const handlePlayFetch = () => {
    sound.playBasketballBounce();
    setTimeout(() => sound.playDogBark(), 600);
    triggerReaction(`You threw the tennis ball! ${animal.name} bolted across the grass and brought it right back! 🎾`);
    onPetTended?.(animal.id);
  };

  const handleRescueFromTree = () => {
    sound.playSiren('fire');
    setTimeout(() => sound.playCatPurr(), 1200);
    onRescueCat?.(animal.id);
    triggerReaction(`Ladder deployed! You carefully climbed up and cradled ${animal.name} safely down to the grass! 🌟`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-100 overflow-hidden text-slate-800">
        {/* Header */}
        <div className={`p-6 text-white text-center relative ${
          animal.species === 'cat' ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-amber-500 to-yellow-600'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            ×
          </button>
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center text-4xl shadow-inner mb-2">
            {animal.species === 'cat' ? '🐱' : '🐶'}
          </div>
          <h3 className="text-2xl font-black">{animal.name}</h3>
          <p className="text-xs text-white/90 font-semibold">{animal.breed} • Friendliness {animal.friendliness}%</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Reaction message box */}
          {reactionText && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-2xl animate-bounce flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{reactionText}</span>
            </div>
          )}

          {animal.isStuckInTree && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-red-700">
                <Flame className="w-5 h-5" />
                <span>Tree Rescue Required!</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Milo is meowing high in the church oak tree branches and cannot get down by himself!
              </p>
              <button
                onClick={handleRescueFromTree}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Deploy Rescue Ladder & Save Milo!</span>
              </button>
            </div>
          )}

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-bold">Favorite Toy:</span>
              <span>{animal.favoriteToy}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Current Mood:</span>
              <span className="capitalize">{animal.state}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handlePet}
              className="py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-2xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" />
              <span>Gently Pet</span>
            </button>

            <button
              onClick={handleFeed}
              className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Feed Treat</span>
            </button>

            {animal.species === 'dog' && (
              <button
                onClick={handlePlayFetch}
                className="col-span-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🎾 Play Fetch with Tennis Ball</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Goodbye, {animal.name}
          </button>
        </div>
      </div>
    </div>
  );
};
