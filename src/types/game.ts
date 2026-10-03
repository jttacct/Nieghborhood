export type PlayerRole = 'explorer' | 'mailman' | 'police' | 'firefighter' | 'paramedic';

export type TimeOfDay = 'morning' | 'afternoon' | 'sunset' | 'night';
export type WeatherType = 'sunny' | 'breezy' | 'rainy' | 'snowy' | 'stormy';

export interface Position {
  x: number;
  y: number;
}

export interface Building {
  id: string;
  name: string;
  type: 'store' | 'school' | 'church' | 'house' | 'police_station' | 'fire_station' | 'hospital';
  subtype?: 'grocery' | 'bakery' | 'toy_shop' | 'pharmacy';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor: string;
  doorPos: Position;
  mailboxPos?: Position;
  residentName?: string;
  addressNumber?: number;
  hasMailFlag?: boolean;
  hasDeliveredMail?: boolean;
  description: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'police_cruiser' | 'mail_truck' | 'fire_truck' | 'ambulance' | 'bicycle';
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  secondaryColor: string;
  hasSiren: boolean;
  sirenActive: boolean;
  isDrivenByPlayer: boolean;
  width: number;
  length: number;
}

export interface Animal {
  id: string;
  name: string;
  species: 'cat' | 'dog';
  breed: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'idle' | 'walking' | 'sleeping' | 'playing' | 'tree';
  color: string;
  facing: 'left' | 'right';
  friendliness: number;
  favoriteToy: string;
  isStuckInTree?: boolean;
  lastPetted?: number;
}

export interface Insect {
  id: string;
  name: string;
  species: 'butterfly' | 'bee' | 'ladybug' | 'dragonfly' | 'firefly';
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  glowColor?: string;
  wingAngle: number;
  caught: boolean;
  rarity: 'common' | 'uncommon' | 'rare';
  fact: string;
}

export interface NPC {
  id: string;
  name: string;
  role: 'policeman' | 'mailman' | 'student' | 'teacher' | 'baker' | 'grocer' | 'pastor' | 'resident';
  x: number;
  y: number;
  facing: 'left' | 'right' | 'up' | 'down';
  activity: string;
  dialog: string[];
  color: string;
  hairColor: string;
}

export interface QuestStep {
  id: string;
  sectorName: string;
  title: string;
  targetRole: PlayerRole;
  description: string;
  instructions: string;
  icon: string;
  targetCount: number;
  currentCount: number;
  isReadyToConfirm: boolean;
  isCompleted: boolean;
  rewardText: string;
}

export interface PlayerState {
  x: number;
  y: number;
  speed: number;
  facing: 'left' | 'right' | 'up' | 'down';
  role: PlayerRole;
  inVehicleId: string | null;
  coins: number;
  bag: {
    letters: number;
    packages: number;
    dogTreats: number;
    catTreats: number;
    bugNet: boolean;
    magnifyingGlass: boolean;
    pastry: number;
  };
  reputation: number;
}
