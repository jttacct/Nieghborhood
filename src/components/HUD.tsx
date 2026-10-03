import React from 'react';
import { PlayerRole, PlayerState, QuestStep, TimeOfDay, WeatherType } from '../types/game';
import { Mail, Shield, Flame, Heart, Compass, Volume2, VolumeX, Sun, Moon, CloudRain, Snowflake, CloudLightning, Wind, Sparkles, MapPin, Package, Award } from 'lucide-react';
import { sound } from '../utils/audio';

interface HUDProps {
  player: PlayerState;
  activeQuest: QuestStep | null;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  isMuted: boolean;
  onSelectRole: (role: PlayerRole) => void;
  onToggleMute: () => void;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  onSetWeather: (weather: WeatherType) => void;
  onOpenQuestModal: () => void;
  onOpenInsectGuide: () => void;
  onJumpTo: (x: number, y: number) => void;
  onExitVehicle: () => void;
  onToggleVehicleSiren?: () => void;
  isDrivingVehicle?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  activeQuest,
  timeOfDay,
  weather,
  isMuted,
  onSelectRole,
  onToggleMute,
  onSetTimeOfDay,
  onSetWeather,
  onOpenQuestModal,
  onOpenInsectGuide,
  onJumpTo,
  onExitVehicle,
  onToggleVehicleSiren,
  isDrivingVehicle,
}) => {
  const roles: { role: PlayerRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'mailman', label: 'Mail Carrier', icon: <Mail className="w-4 h-4" />, color: 'bg-blue-600' },
    { role: 'police', label: 'Police Officer', icon: <Shield className="w-4 h-4" />, color: 'bg-indigo-700' },
    { role: 'firefighter', label: 'Fire & Rescue', icon: <Flame className="w-4 h-4" />, color: 'bg-red-600' },
    { role: 'paramedic', label: 'Paramedic', icon: <Heart className="w-4 h-4" />, color: 'bg-emerald-600' },
    { role: 'explorer', label: 'Explorer', icon: <Compass className="w-4 h-4" />, color: 'bg-amber-600' },
  ];

  const landmarks = [
    { name: 'School', x: 1790, y: 340 },
    { name: 'Grace Church', x: 460, y: 980 },
    { name: 'Bakery & Stores', x: 1620, y: 760 },
    { name: 'Police Station', x: 445, y: 740 },
    { name: 'Fire Station', x: 740, y: 740 },
    { name: 'Oak St. Homes', x: 520, y: 250 },
    { name: 'Maple Lane', x: 1610, y: 1370 },
  ];

  return (
    <>
      {/* Top Banner: Quest Progress & Mission Director button */}
      <header aria-label="Game Status Bar" className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Quest Goal Card */}
        {activeQuest && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-amber-200/80 flex items-center gap-3.5 max-w-md">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Active Mission
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {activeQuest.currentCount} / {activeQuest.targetCount}
                </span>
              </div>
              <h1 className="text-xs font-black text-slate-800 truncate leading-snug">
                {activeQuest.title}
              </h1>
            </div>

            <button
              onClick={onOpenQuestModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 shadow-xs transition-transform active:scale-95 flex items-center gap-1 ${
                activeQuest.currentCount >= activeQuest.targetCount && !activeQuest.isCompleted
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-bounce'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {activeQuest.currentCount >= activeQuest.targetCount && !activeQuest.isCompleted
                  ? 'Ready to Complete!'
                  : 'Mission Guide'}
              </span>
            </button>
          </div>
        )}

        {/* Right: Quick Controls (Sound, Time, Weather, Bug Guide) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200">
          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
              isMuted ? 'bg-red-50 text-red-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Time of Day */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => onSetTimeOfDay('morning')}
              className={`p-1.5 rounded-lg transition-colors ${
                timeOfDay === 'morning' ? 'bg-amber-400 text-slate-900 font-bold shadow-xs' : 'text-slate-500'
              }`}
              title="Sunny Morning"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetTimeOfDay('sunset')}
              className={`p-1.5 rounded-lg transition-colors ${
                timeOfDay === 'sunset' ? 'bg-orange-400 text-white font-bold shadow-xs' : 'text-slate-500'
              }`}
              title="Golden Sunset"
            >
              🌅
            </button>
            <button
              onClick={() => onSetTimeOfDay('night')}
              className={`p-1.5 rounded-lg transition-colors ${
                timeOfDay === 'night' ? 'bg-indigo-900 text-yellow-300 font-bold shadow-xs' : 'text-slate-500'
              }`}
              title="Peaceful Night"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weather Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs items-center gap-0.5">
            <button
              onClick={() => onSetWeather('sunny')}
              className={`p-1.5 rounded-lg transition-colors ${
                weather === 'sunny' ? 'bg-amber-400 text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Sunny Weather"
            >
              ☀️
            </button>
            <button
              onClick={() => onSetWeather('rainy')}
              className={`p-1.5 rounded-lg transition-colors ${
                weather === 'rainy' ? 'bg-blue-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Rainy Shower (Drops & Splashes)"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetWeather('snowy')}
              className={`p-1.5 rounded-lg transition-colors ${
                weather === 'snowy' ? 'bg-cyan-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Winter Snow (Flakes & Snowcaps)"
            >
              <Snowflake className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetWeather('stormy')}
              className={`p-1.5 rounded-lg transition-colors ${
                weather === 'stormy' ? 'bg-indigo-700 text-yellow-300 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Thunderstorm & Lightning"
            >
              <CloudLightning className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetWeather('breezy')}
              className={`p-1.5 rounded-lg transition-colors ${
                weather === 'breezy' ? 'bg-orange-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Autumn Breeze (Swirling Leaves)"
            >
              <Wind className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Field Guide */}
          <button
            onClick={onOpenInsectGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs rounded-xl border border-emerald-200 transition-colors"
          >
            <span>🦋 Bug Guide</span>
          </button>
        </div>
      </header>

      {/* Driving Vehicle Toolbar (if player is currently driving) */}
      {isDrivingVehicle && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3">
          <span className="text-xs font-extrabold text-amber-400">Onboard Vehicle</span>
          {onToggleVehicleSiren && (
            <button
              onClick={onToggleVehicleSiren}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-lg transition-all"
            >
              🚨 Siren Toggle
            </button>
          )}
          <button
            onClick={onExitVehicle}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all"
          >
            Exit Vehicle [E]
          </button>
        </div>
      )}

      {/* Bottom Bar: Role Switcher, Inventory, Quick Landmarks */}
      <footer aria-label="Game Controls and Navigation" className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
        {/* Left: Role Switcher */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-1">
          <span className="text-[10px] font-black uppercase text-slate-400 px-2">Role:</span>
          {roles.map((r) => {
            const isActive = player.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => {
                  sound.playWhistle();
                  onSelectRole(r.role);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? `${r.color} text-white shadow-md scale-105`
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Inventory Satchel & Coins */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 font-black text-amber-600">
            <span>🪙 {player.coins}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5 font-bold text-slate-700">
            <span title="Undelivered Mail Letters">✉️ {player.bag.letters}</span>
            <span title="Packages in Bag">📦 {player.bag.packages}</span>
            <span title="Dog Biscuits">🦴 {player.bag.dogTreats}</span>
            <span title="Cat Treats">🐟 {player.bag.catTreats}</span>
          </div>
        </div>

        {/* Right: Quick Landmark Jump */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-[10px] font-black uppercase text-slate-400 px-1">Jump to:</span>
          <div className="flex gap-1 overflow-x-auto max-w-[280px]">
            {landmarks.map((l) => (
              <button
                key={l.name}
                onClick={() => onJumpTo(l.x, l.y)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap transition-colors"
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
};
