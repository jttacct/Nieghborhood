import React, { useState } from 'react';
import { Building, PlayerState } from '../types/game';
import { Bell, ShoppingCart, BookOpen, Flame, Shield, Home, Heart, Sparkles, Check, Package, Crosshair } from 'lucide-react';
import { sound } from '../utils/audio';

interface BuildingModalProps {
  building: Building | null;
  player: PlayerState;
  onClose: () => void;
  onUpdatePlayer: (updater: (prev: PlayerState) => PlayerState) => void;
  onDeliverMail?: (buildingId: string) => void;
  onTriggerRescue?: () => void;
  onActionComplete?: (type: 'store' | 'school' | 'church' | 'mail') => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  building,
  player,
  onClose,
  onUpdatePlayer,
  onDeliverMail,
  onTriggerRescue,
  onActionComplete,
}) => {
  const [basketBallScore, setBasketBallScore] = useState(0);
  const [candleLit, setCandleLit] = useState(false);
  const [boughtItemMessage, setBoughtItemMessage] = useState<string | null>(null);

  if (!building) return null;

  const handleBuy = (name: string, price: number, itemKey: keyof PlayerState['bag'], qty: number = 1) => {
    if (player.coins < price) {
      setBoughtItemMessage(`Not enough coins! You have ${player.coins} coins.`);
      setTimeout(() => setBoughtItemMessage(null), 2500);
      return;
    }
    sound.playMailboxChime();
    onUpdatePlayer((prev) => ({
      ...prev,
      coins: prev.coins - price,
      bag: {
        ...prev.bag,
        [itemKey]: typeof prev.bag[itemKey] === 'number' ? (prev.bag[itemKey] as number) + qty : true,
      },
    }));
    setBoughtItemMessage(`Purchased ${name}!`);
    onActionComplete?.('store');
    setTimeout(() => setBoughtItemMessage(null), 2500);
  };

  const handleRingChurchBell = () => {
    sound.playChurchBell();
    onActionComplete?.('church');
  };

  const handleRingSchoolBell = () => {
    sound.playSchoolBell();
    onActionComplete?.('school');
  };

  const handleShootBasketball = () => {
    sound.playBasketballBounce();
    const isScore = Math.random() > 0.3;
    if (isScore) {
      setBasketBallScore((s) => s + 1);
      setTimeout(() => sound.playCompleteFanfare(), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border-4 border-slate-100 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ backgroundColor: building.roofColor }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-xs">
              {building.type === 'store' && <ShoppingCart className="w-6 h-6 text-white" />}
              {building.type === 'school' && <BookOpen className="w-6 h-6 text-white" />}
              {building.type === 'church' && <Bell className="w-6 h-6 text-white" />}
              {building.type === 'police_station' && <Shield className="w-6 h-6 text-white" />}
              {building.type === 'fire_station' && <Flame className="w-6 h-6 text-white" />}
              {building.type === 'house' && <Home className="w-6 h-6 text-white" />}
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider opacity-90 block">
                {building.type.replace('_', ' ')}
              </span>
              <h2 className="text-xl font-extrabold leading-tight">{building.name}</h2>
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
        <div className="p-6 overflow-y-auto space-y-5">
          <p className="text-slate-600 text-sm leading-relaxed">{building.description}</p>

          {boughtItemMessage && (
            <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fade-in flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{boughtItemMessage}</span>
            </div>
          )}

          {/* STORE INTERACTIVE VIEW */}
          {building.type === 'store' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Available Goods & Treats</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                  Wallet: {player.coins} Coins
                </span>
              </div>

              {building.subtype === 'grocery' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleBuy('Dog Treats (x3)', 10, 'dogTreats', 3)}
                    className="p-3 border rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-800">Crunchy Dog Biscuits (x3)</span>
                      <span className="text-[11px] text-slate-500">Befriends barking dogs</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 mt-2">10 Coins</span>
                  </button>
                  <button
                    onClick={() => handleBuy('Cat Treats (x3)', 10, 'catTreats', 3)}
                    className="p-3 border rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-800">Tender Cat Treats (x3)</span>
                      <span className="text-[11px] text-slate-500">Purrs guaranteed</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 mt-2">10 Coins</span>
                  </button>
                </div>
              )}

              {building.subtype === 'bakery' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleBuy('Warm Cinnamon Bun', 8, 'pastry', 1)}
                    className="p-3 border rounded-2xl text-left hover:border-amber-500 hover:bg-amber-50/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-800">Cinnamon Bun</span>
                      <span className="text-[11px] text-slate-500">Fresh baked pastry</span>
                    </div>
                    <span className="text-xs font-black text-amber-600 mt-2">8 Coins</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playMailboxChime();
                      onActionComplete?.('store');
                      setBoughtItemMessage('Enjoyed a delicious fresh croissant!');
                      setTimeout(() => setBoughtItemMessage(null), 2000);
                    }}
                    className="p-3 border rounded-2xl text-left hover:border-amber-500 hover:bg-amber-50/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-800">Hot Cafe Cocoa</span>
                      <span className="text-[11px] text-slate-500">Warm & comforting</span>
                    </div>
                    <span className="text-xs font-black text-amber-600 mt-2">5 Coins</span>
                  </button>
                </div>
              )}

              {building.subtype === 'toy_shop' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleBuy('Deluxe Bug Net', 15, 'bugNet')}
                    className="p-3 border rounded-2xl text-left hover:border-pink-500 hover:bg-pink-50/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-800">Deluxe Bug Net</span>
                      <span className="text-[11px] text-slate-500">Gentle butterfly mesh</span>
                    </div>
                    <span className="text-xs font-black text-pink-600 mt-2">15 Coins</span>
                  </button>
                  <button
                    onClick={() => handleBuy('Pocket Magnifying Glass', 12, 'magnifyingGlass')}
                    className="p-3 border rounded-2xl text-left hover:border-pink-500 hover:bg-pink-50/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-800">Magnifying Glass</span>
                      <span className="text-[11px] text-slate-500">Inspect tiny insects</span>
                    </div>
                    <span className="text-xs font-black text-pink-600 mt-2">12 Coins</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCHOOL INTERACTIVE VIEW */}
          {building.type === 'school' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-indigo-950 text-sm">Sunnyvale Recess Bell</h4>
                    <p className="text-xs text-indigo-700">Ring the school bell across the schoolyard!</p>
                  </div>
                  <button
                    onClick={handleRingSchoolBell}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Ring Bell</span>
                  </button>
                </div>
              </div>

              {/* Basketball Mini-game */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Recess Basketball Court</span>
                  <span className="bg-amber-200 px-2 py-0.5 rounded-full">Score: {basketBallScore}</span>
                </div>
                <div className="py-4 flex justify-center items-center">
                  <div className="relative w-28 h-24 border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-center bg-white/60">
                    <div className="text-2xl animate-bounce">🏀</div>
                    <div className="absolute top-1 w-10 h-3 border-2 border-red-500 rounded-full" />
                  </div>
                </div>
                <button
                  onClick={handleShootBasketball}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>Shoot Free Throw!</span>
                </button>
              </div>
            </div>
          )}

          {/* CHURCH INTERACTIVE VIEW */}
          {building.type === 'church' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">Grace Tower Bell Chimes</h4>
                  <p className="text-xs text-amber-800">Pull the historic bell rope to chime across town.</p>
                </div>
                <button
                  onClick={handleRingChurchBell}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <span>Chime Bell</span>
                </button>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">Community Peace Garden</h4>
                  <p className="text-xs text-emerald-800">Light a candle for neighborhood harmony.</p>
                </div>
                <button
                  onClick={() => {
                    setCandleLit(true);
                    sound.playCompleteFanfare();
                  }}
                  className={`px-3.5 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                    candleLit
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{candleLit ? 'Candle Glowing' : 'Light Candle'}</span>
                </button>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <h4 className="font-extrabold text-orange-950 text-sm">Ancient Church Oak Tree</h4>
                <p className="text-xs text-orange-800 mb-2">
                  Milo the curious ginger tabby often climbs up the branches here!
                </p>
                <button
                  onClick={() => {
                    onTriggerRescue?.();
                    onClose();
                  }}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Inspect Oak Tree & Cat Rescue Point
                </button>
              </div>
            </div>
          )}

          {/* HOUSE INTERACTIVE VIEW */}
          {building.type === 'house' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Resident</span>
                  <span className="text-xs font-extrabold text-slate-800">{building.residentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Mailbox Status</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    building.hasDeliveredMail ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {building.hasDeliveredMail ? 'Mail Delivered Today ✓' : 'Awaiting Delivery'}
                  </span>
                </div>
              </div>

              {!building.hasDeliveredMail && (
                <button
                  onClick={() => {
                    onDeliverMail?.(building.id);
                    onActionComplete?.('mail');
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Deliver Mail to Mailbox #{building.addressNumber}</span>
                </button>
              )}
            </div>
          )}

          {/* CIVIC STATIONS */}
          {(building.type === 'police_station' || building.type === 'fire_station' || building.type === 'hospital') && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-700">Dispatch Department Active</div>
              <p className="text-xs text-slate-500">
                Official emergency vehicle bays are parked outside. You can step into any cruiser or truck on the street!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
