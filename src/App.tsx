import React, { useState, useCallback, useEffect } from 'react';
import {
  PlayerState,
  Building,
  Vehicle,
  Animal,
  Insect,
  NPC,
  QuestStep,
  PlayerRole,
  TimeOfDay,
  WeatherType,
} from './types/game';
import {
  INITIAL_PLAYER,
  BUILDINGS,
  VEHICLES,
  ANIMALS,
  INSECTS,
  NPCS,
  INITIAL_QUESTS,
} from './utils/constants';
import { NeighborhoodCanvas } from './components/NeighborhoodCanvas';
import { HUD } from './components/HUD';
import { QuestConfirmationModal } from './components/QuestConfirmationModal';
import { BuildingModal } from './components/BuildingModal';
import { PetModal } from './components/PetModal';
import { InsectGuideModal } from './components/InsectGuideModal';
import { NPCModal } from './components/NPCModal';
import { sound } from './utils/audio';

export default function App() {
  // Game World State
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [buildings, setBuildings] = useState<Building[]>(BUILDINGS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);
  const [animals, setAnimals] = useState<Animal[]>(ANIMALS);
  const [insects, setInsects] = useState<Insect[]>(INSECTS);
  const [npcs] = useState<NPC[]>(NPCS);
  const [quests, setQuests] = useState<QuestStep[]>(INITIAL_QUESTS);
  const [activeQuestId, setActiveQuestId] = useState<string>('quest_mail');

  // Environment Settings
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modal Dialogs
  const [modalBuilding, setModalBuilding] = useState<Building | null>(null);
  const [modalAnimal, setModalAnimal] = useState<Animal | null>(null);
  const [modalNPC, setModalNPC] = useState<NPC | null>(null);
  const [showQuestModal, setShowQuestModal] = useState<boolean>(false);
  const [showInsectGuide, setShowInsectGuide] = useState<boolean>(false);

  // Active Quest
  const activeQuest = quests.find((q) => q.id === activeQuestId) || quests[0];

  // Update procedural ambient weather audio whenever weather changes
  useEffect(() => {
    sound.updateWeatherState(weather);
  }, [weather]);

  // First interaction listener to resume AudioContext if browser policy required user gesture
  useEffect(() => {
    const handleFirstGesture = () => {
      sound.updateWeatherState(weather);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [weather]);

  // Helper to increment quest progress and prompt confirmation when threshold met
  const advanceQuestProgress = useCallback((questId: string, amount: number = 1) => {
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.id === questId && !q.isCompleted) {
          const newCount = Math.min(q.targetCount, q.currentCount + amount);
          const nowReady = newCount >= q.targetCount;
          if (nowReady && !q.isReadyToConfirm) {
            // Automatically prompt the user before completing and moving on!
            setTimeout(() => {
              sound.playCompleteFanfare();
              setShowQuestModal(true);
            }, 600);
          }
          return {
            ...q,
            currentCount: newCount,
            isReadyToConfirm: nowReady,
          };
        }
        return q;
      })
    );
  }, []);

  // Player position update from canvas
  const handleUpdatePlayerPos = useCallback((x: number, y: number, facing: 'left' | 'right' | 'up' | 'down') => {
    setPlayer((prev) => ({ ...prev, x, y, facing }));
  }, []);

  // Jump to specific landmark
  const handleJumpTo = (x: number, y: number) => {
    sound.playWhistle();
    setPlayer((prev) => ({ ...prev, x, y }));
  };

  // Role Switcher
  const handleSelectRole = (newRole: PlayerRole) => {
    setPlayer((prev) => ({ ...prev, role: newRole }));
  };

  // Audio Toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  // Deliver mail to house
  const handleDeliverMail = (buildingId: string) => {
    sound.playMailboxChime();
    setBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, hasDeliveredMail: true, hasMailFlag: false } : b))
    );
    setPlayer((prev) => ({
      ...prev,
      coins: prev.coins + 10,
      bag: { ...prev.bag, letters: Math.max(0, prev.bag.letters - 1) },
    }));
    advanceQuestProgress('quest_mail', 1);
  };

  // Rescue cat Milo from tree
  const handleRescueCat = (catId: string) => {
    setAnimals((prev) =>
      prev.map((a) => (a.id === catId ? { ...a, isStuckInTree: false, state: 'idle', y: 1220 } : a))
    );
    setPlayer((prev) => ({ ...prev, coins: prev.coins + 25 }));
    advanceQuestProgress('quest_emergency', 1);
  };

  // Pet or play with animals
  const handlePetTended = (animalId: string) => {
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === animalId ? { ...a, friendliness: Math.min(100, a.friendliness + 5), lastPetted: Date.now() } : a
      )
    );
    advanceQuestProgress('quest_pets', 1);
  };

  // Catch insect
  const handleCatchInsect = (insectId: string) => {
    setInsects((prev) =>
      prev.map((ins) => (ins.id === insectId ? { ...ins, caught: true } : ins))
    );
    advanceQuestProgress('quest_insects', 1);
  };

  // Release all insects
  const handleReleaseAllInsects = () => {
    setInsects((prev) => prev.map((ins) => ({ ...ins, caught: false })));
  };

  // Vehicle Interaction
  const handleInteractVehicle = (v: Vehicle) => {
    sound.playHonk();
    if (v.hasSiren) {
      sound.playSiren(v.type === 'police_cruiser' ? 'police' : v.type === 'fire_truck' ? 'fire' : 'ambulance');
    }
    // Board vehicle
    setPlayer((prev) => ({
      ...prev,
      inVehicleId: v.id,
      role:
        v.type === 'police_cruiser'
          ? 'police'
          : v.type === 'mail_truck'
          ? 'mailman'
          : v.type === 'fire_truck'
          ? 'firefighter'
          : v.type === 'ambulance'
          ? 'paramedic'
          : prev.role,
    }));
    setVehicles((prev) =>
      prev.map((veh) => ({
        ...veh,
        isDrivenByPlayer: veh.id === v.id,
        sirenActive: veh.id === v.id && veh.hasSiren,
      }))
    );
    if (v.type === 'police_cruiser') {
      advanceQuestProgress('quest_police', 1);
    }
  };

  // Exit Vehicle
  const handleExitVehicle = () => {
    sound.stopSiren();
    setPlayer((prev) => ({ ...prev, inVehicleId: null }));
    setVehicles((prev) =>
      prev.map((veh) => ({ ...veh, isDrivenByPlayer: false, sirenActive: false }))
    );
  };

  // Siren toggle
  const handleToggleSiren = () => {
    const drivingVeh = vehicles.find((v) => v.id === player.inVehicleId);
    if (!drivingVeh || !drivingVeh.hasSiren) return;

    if (drivingVeh.sirenActive) {
      sound.stopSiren();
      setVehicles((prev) =>
        prev.map((v) => (v.id === drivingVeh.id ? { ...v, sirenActive: false } : v))
      );
    } else {
      sound.playSiren(drivingVeh.type === 'police_cruiser' ? 'police' : 'fire');
      setVehicles((prev) =>
        prev.map((v) => (v.id === drivingVeh.id ? { ...v, sirenActive: true } : v))
      );
    }
  };

  // User confirms milestone and advances to next sector
  const handleConfirmAdvanceQuest = (questId: string) => {
    // 1. Mark completed
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, isCompleted: true, isReadyToConfirm: false } : q))
    );

    // 2. Award bonus coins
    setPlayer((prev) => ({ ...prev, coins: prev.coins + 30 }));

    // 3. Find next quest in list
    const currentIndex = quests.findIndex((q) => q.id === questId);
    const nextQuest = quests[currentIndex + 1] || quests[0];
    setActiveQuestId(nextQuest.id);

    // Switch role to match next quest if helpful
    if (nextQuest.targetRole) {
      setPlayer((prev) => ({ ...prev, role: nextQuest.targetRole }));
    }

    setShowQuestModal(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none bg-slate-900">
      {/* 2D / Isometric Interactive Neighborhood Canvas */}
      <NeighborhoodCanvas
        player={player}
        buildings={buildings}
        vehicles={vehicles}
        animals={animals}
        insects={insects}
        npcs={npcs}
        timeOfDay={timeOfDay}
        weather={weather}
        onUpdatePlayerPos={handleUpdatePlayerPos}
        onInteractBuilding={(b) => setModalBuilding(b)}
        onInteractAnimal={(a) => setModalAnimal(a)}
        onInteractVehicle={handleInteractVehicle}
        onInteractInsect={(ins) => {
          sound.playInsectFlutter();
          setShowInsectGuide(true);
        }}
        onInteractNPC={(npc) => setModalNPC(npc)}
      />

      {/* Heads Up Display (HUD) */}
      <HUD
        player={player}
        activeQuest={activeQuest}
        timeOfDay={timeOfDay}
        weather={weather}
        isMuted={isMuted}
        onSelectRole={handleSelectRole}
        onToggleMute={handleToggleMute}
        onSetTimeOfDay={setTimeOfDay}
        onSetWeather={setWeather}
        onOpenQuestModal={() => setShowQuestModal(true)}
        onOpenInsectGuide={() => setShowInsectGuide(true)}
        onJumpTo={handleJumpTo}
        onExitVehicle={handleExitVehicle}
        onToggleVehicleSiren={handleToggleSiren}
        isDrivingVehicle={!!player.inVehicleId}
      />

      {/* Milestone & Sector Progression Modal ("Asked me before completing each before moving on") */}
      {showQuestModal && (
        <QuestConfirmationModal
          quest={activeQuest}
          allQuests={quests}
          onConfirmAdvance={handleConfirmAdvanceQuest}
          onDismiss={() => setShowQuestModal(false)}
          onSelectQuest={(qid) => {
            setActiveQuestId(qid);
            const selected = quests.find((q) => q.id === qid);
            if (selected) {
              setPlayer((p) => ({ ...p, role: selected.targetRole }));
            }
          }}
        />
      )}

      {/* Building Interior / Interaction Modal (Stores, School, Church, Houses) */}
      {modalBuilding && (
        <BuildingModal
          building={modalBuilding}
          player={player}
          onClose={() => setModalBuilding(null)}
          onUpdatePlayer={setPlayer}
          onDeliverMail={handleDeliverMail}
          onTriggerRescue={() => {
            const milo = animals.find((a) => a.id === 'cat_milo');
            if (milo) setModalAnimal(milo);
          }}
          onActionComplete={(type) => {
            if (type === 'store') advanceQuestProgress('quest_store', 1);
            if (type === 'school') advanceQuestProgress('quest_police', 1);
            if (type === 'church') advanceQuestProgress('quest_emergency', 1);
          }}
        />
      )}

      {/* Pet Interaction Modal (Cats & Dogs) */}
      {modalAnimal && (
        <PetModal
          animal={modalAnimal}
          player={player}
          onClose={() => setModalAnimal(null)}
          onUpdatePlayer={setPlayer}
          onRescueCat={handleRescueCat}
          onPetTended={handlePetTended}
        />
      )}

      {/* Insect Field Guide Modal (Butterflies, Bees, Ladybugs, Dragonflies, Fireflies) */}
      {showInsectGuide && (
        <InsectGuideModal
          insects={insects}
          player={player}
          onClose={() => setShowInsectGuide(false)}
          onCatchInsect={handleCatchInsect}
          onReleaseAll={handleReleaseAllInsects}
        />
      )}

      {/* NPC Dialogue Modal (Officers, Mailman, Teachers, Pastors) */}
      {modalNPC && (
        <NPCModal
          npc={modalNPC}
          onClose={() => setModalNPC(null)}
          onSwitchRole={handleSelectRole}
          onAdvancePatrol={() => advanceQuestProgress('quest_police', 1)}
        />
      )}
    </div>
  );
}
