import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Building, Vehicle, Animal, Insect, NPC, PlayerState, TimeOfDay, WeatherType } from '../types/game';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants';
import { sound } from '../utils/audio';

interface NeighborhoodCanvasProps {
  player: PlayerState;
  buildings: Building[];
  vehicles: Vehicle[];
  animals: Animal[];
  insects: Insect[];
  npcs: NPC[];
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  onUpdatePlayerPos: (x: number, y: number, facing: 'left' | 'right' | 'up' | 'down') => void;
  onInteractBuilding: (b: Building) => void;
  onInteractAnimal: (a: Animal) => void;
  onInteractVehicle: (v: Vehicle) => void;
  onInteractInsect: (i: Insect) => void;
  onInteractNPC: (npc: NPC) => void;
}

export const NeighborhoodCanvas: React.FC<NeighborhoodCanvasProps> = ({
  player,
  buildings,
  vehicles,
  animals,
  insects,
  npcs,
  timeOfDay,
  weather,
  onUpdatePlayerPos,
  onInteractBuilding,
  onInteractAnimal,
  onInteractVehicle,
  onInteractInsect,
  onInteractNPC,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard keys state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraRef = useRef<{ x: number; y: number; zoom: number }>({
    x: player.x,
    y: player.y,
    zoom: 1,
  });

  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);
  const animFrameId = useRef<number | null>(null);
  const tickRef = useRef<number>(0);

  // Track weather particles
  const rainDropsRef = useRef<{ x: number; y: number; speed: number; length: number; opacity: number }[]>([]);
  const snowFlakesRef = useRef<{ x: number; y: number; radius: number; speedY: number; speedX: number; wobbleSpeed: number; opacity: number; arms: number }[]>([]);
  const rainSplashesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; opacity: number }[]>([]);
  const windLeavesRef = useRef<{ x: number; y: number; size: number; speedX: number; speedY: number; angle: number; rotSpeed: number; color: string }[]>([]);
  const lightningFlashRef = useRef<{ active: boolean; opacity: number; lastTime: number }>({ active: false, opacity: 0, lastTime: 0 });

  // Initialize weather particles
  useEffect(() => {
    // Rain droplets (high density, varied speeds)
    rainDropsRef.current = Array.from({ length: 300 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      speed: 16 + Math.random() * 12,
      length: 16 + Math.random() * 14,
      opacity: 0.45 + Math.random() * 0.45,
    }));

    // Snowflakes (feathery, slow falling with varied sizes and drift)
    snowFlakesRef.current = Array.from({ length: 280 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: 1.8 + Math.random() * 3.5,
      speedY: 1.2 + Math.random() * 2.2,
      speedX: -0.6 + Math.random() * 1.2,
      wobbleSpeed: 0.02 + Math.random() * 0.04,
      opacity: 0.5 + Math.random() * 0.45,
      arms: Math.random() > 0.5 ? 6 : 4,
    }));

    // Breezy autumn leaves floating through the air
    const leafColors = ['#f97316', '#ea580c', '#eab308', '#ca8a04', '#b45309', '#ef4444'];
    windLeavesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      size: 5 + Math.random() * 6,
      speedX: 3 + Math.random() * 4,
      speedY: 0.5 + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
    }));
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if inside an input or modal
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      keysRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Find nearest interactable entity
  const getNearestEntity = useCallback(() => {
    const px = player.x;
    const py = player.y;

    // 1. Check Buildings
    for (const b of buildings) {
      const dist = Math.hypot(px - b.doorPos.x, py - b.doorPos.y);
      if (dist < 75) {
        return { type: 'building' as const, entity: b, label: `Enter / Inspect ${b.name}` };
      }
      if (b.mailboxPos) {
        const mailDist = Math.hypot(px - b.mailboxPos.x, py - b.mailboxPos.y);
        if (mailDist < 50) {
          return { type: 'mailbox' as const, entity: b, label: `Mailbox #${b.addressNumber}` };
        }
      }
    }

    // 2. Check Animals
    for (const a of animals) {
      const dist = Math.hypot(px - a.x, py - a.y);
      if (dist < 60) {
        return { type: 'animal' as const, entity: a, label: `${a.isStuckInTree ? 'Rescue' : 'Pet / Play with'} ${a.name} (${a.breed})` };
      }
    }

    // 3. Check Vehicles
    for (const v of vehicles) {
      const dist = Math.hypot(px - v.x, py - v.y);
      if (dist < 65) {
        return { type: 'vehicle' as const, entity: v, label: `Drive ${v.name}` };
      }
    }

    // 4. Check NPCs
    for (const n of npcs) {
      const dist = Math.hypot(px - n.x, py - n.y);
      if (dist < 55) {
        return { type: 'npc' as const, entity: n, label: `Talk to ${n.name}` };
      }
    }

    // 5. Check Insects
    for (const ins of insects) {
      const dist = Math.hypot(px - ins.x, py - ins.y);
      if (dist < 50) {
        return { type: 'insect' as const, entity: ins, label: `Catch / Log ${ins.name}` };
      }
    }

    return null;
  }, [player.x, player.y, buildings, animals, vehicles, npcs, insects]);

  // Handle interaction key 'E' or 'Enter'
  useEffect(() => {
    const handleActionKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
        const nearest = getNearestEntity();
        if (nearest) {
          if (nearest.type === 'building' || nearest.type === 'mailbox') {
            onInteractBuilding(nearest.entity as Building);
          } else if (nearest.type === 'animal') {
            onInteractAnimal(nearest.entity as Animal);
          } else if (nearest.type === 'vehicle') {
            onInteractVehicle(nearest.entity as Vehicle);
          } else if (nearest.type === 'npc') {
            onInteractNPC(nearest.entity as NPC);
          } else if (nearest.type === 'insect') {
            onInteractInsect(nearest.entity as Insect);
          }
        }
      }
    };
    window.addEventListener('keydown', handleActionKey);
    return () => window.removeEventListener('keydown', handleActionKey);
  }, [getNearestEntity, onInteractBuilding, onInteractAnimal, onInteractVehicle, onInteractNPC, onInteractInsect]);

  // Main Game Loop (Physics & Canvas Rendering)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPlayerX = player.x;
    let localPlayerY = player.y;
    let facing = player.facing;

    const render = () => {
      tickRef.current += 1;
      const tick = tickRef.current;

      // Handle player movement from keys
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      const speed = player.inVehicleId ? 7 : player.speed;

      if (keys['w'] || keys['arrowup']) dy -= speed;
      if (keys['s'] || keys['arrowdown']) dy += speed;
      if (keys['a'] || keys['arrowleft']) dx -= speed;
      if (keys['d'] || keys['arrowright']) dx += speed;

      if (dx !== 0 && dy !== 0) {
        // Normalize diagonal speed
        dx *= 0.7071;
        dy *= 0.7071;
      }

      if (dx !== 0 || dy !== 0) {
        localPlayerX = Math.max(30, Math.min(WORLD_WIDTH - 30, localPlayerX + dx));
        localPlayerY = Math.max(30, Math.min(WORLD_HEIGHT - 30, localPlayerY + dy));

        if (Math.abs(dx) > Math.abs(dy)) {
          facing = dx > 0 ? 'right' : 'left';
        } else {
          facing = dy > 0 ? 'down' : 'up';
        }

        if (tick % 3 === 0) {
          onUpdatePlayerPos(localPlayerX, localPlayerY, facing);
        }
      }

      // Smooth camera follow player
      cameraRef.current.x += (localPlayerX - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (localPlayerY - cameraRef.current.y) * 0.1;

      // Canvas auto-resize to window
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Clear & set camera transform
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Camera center translation
      ctx.translate(width / 2, height / 2);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // 1. WORLD GROUND (Lush grass with patterned checker soft green, or sparkling snow blanket)
      if (weather === 'snowy') {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Snow drifts / soft shadows
        ctx.fillStyle = '#e2e8f0';
        for (let y = 0; y < WORLD_HEIGHT; y += 80) {
          ctx.fillRect(0, y, WORLD_WIDTH, 40);
        }

        // Sparkling snow highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 30; i++) {
          const sx = (i * 137 + tick * 0.1) % WORLD_WIDTH;
          const sy = (i * 219) % WORLD_HEIGHT;
          ctx.fillRect(sx, sy, 3, 3);
        }
      } else {
        ctx.fillStyle = '#86efac';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Lawn stripes / texture
        ctx.fillStyle = '#4ade80';
        for (let y = 0; y < WORLD_HEIGHT; y += 80) {
          ctx.fillRect(0, y, WORLD_WIDTH, 40);
        }
      }

      // 2. ROADS & STREETS
      // Main East-West Boulevard
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 800, WORLD_WIDTH, 120);

      // North-South Avenue
      ctx.fillRect(1120, 0, 120, WORLD_HEIGHT);

      // North Residential Lane (connects houses 1, 2, 3)
      ctx.fillRect(200, 280, 850, 70);

      // South Residential Lane (connects houses 4, 5, 6)
      ctx.fillRect(1300, 1380, 800, 70);

      // School Bay & Driveway
      ctx.fillRect(1600, 360, 400, 60);

      // Sidewalks (Concrete beige/grey border)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 793, WORLD_WIDTH, 134);
      ctx.strokeRect(1113, 0, 134, WORLD_HEIGHT);
      ctx.strokeRect(193, 273, 864, 84);
      ctx.strokeRect(1293, 1373, 814, 84);

      // Road Centerlines (dashed yellow)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 15]);

      // East-West centerline
      ctx.beginPath();
      ctx.moveTo(0, 860);
      ctx.lineTo(WORLD_WIDTH, 860);
      ctx.stroke();

      // North-South centerline
      ctx.beginPath();
      ctx.moveTo(1180, 0);
      ctx.lineTo(1180, WORLD_HEIGHT);
      ctx.stroke();

      ctx.setLineDash([]); // reset dash

      // Zebra Crosswalks at main intersection & school
      const drawCrosswalk = (cx: number, cy: number, w: number, h: number, horizontal: boolean) => {
        ctx.fillStyle = '#ffffff';
        if (horizontal) {
          const count = 7;
          const stripeW = w / (count * 2 - 1);
          for (let i = 0; i < count; i++) {
            ctx.fillRect(cx + i * stripeW * 2, cy, stripeW, h);
          }
        } else {
          const count = 7;
          const stripeH = h / (count * 2 - 1);
          for (let i = 0; i < count; i++) {
            ctx.fillRect(cx, cy + i * stripeH * 2, w, stripeH);
          }
        }
      };

      // Crosswalks around central intersection
      drawCrosswalk(1070, 805, 40, 110, false); // West crosswalk
      drawCrosswalk(1250, 805, 40, 110, false); // East crosswalk
      drawCrosswalk(1125, 755, 110, 40, true);  // North crosswalk
      drawCrosswalk(1125, 925, 110, 40, true);  // South crosswalk

      // School Zone Crosswalk (outside Elementary School)
      drawCrosswalk(1600, 375, 40, 40, false);

      // 3. PARK & CHURCH GROUNDS (Paths, Flowers, Fountain)
      // Church cobblestone courtyard
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(260, 940, 400, 360, 24);
      ctx.fill();

      // Church Fountain
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(460, 1260, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Water ripple
      const rippleR = 8 + (tick % 40) * 0.45;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(460, 1260, rippleR, 0, Math.PI * 2);
      ctx.stroke();

      // Ancient Church Oak Tree
      ctx.fillStyle = '#78350f';
      ctx.fillRect(612, 1170, 16, 50); // Trunk
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(620, 1160, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(635, 1150, 36, 0, Math.PI * 2);
      ctx.fill();

      // School Basketball Court
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(1630, 250, 160, 90);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(1630, 250, 160, 90);
      // Center circle & hoop
      ctx.beginPath();
      ctx.arc(1710, 295, 24, 0, Math.PI * 2);
      ctx.stroke();
      // Backboards
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1630, 285, 4, 20);
      ctx.fillRect(1786, 285, 4, 20);

      // 4. BUILDINGS RENDERING
      buildings.forEach((b) => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.roundRect(b.x + 8, b.y + 8, b.width, b.height, 12);
        ctx.fill();

        // Walls
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 12);
        ctx.fill();

        // Roof overhang
        ctx.fillStyle = b.roofColor;
        ctx.beginPath();
        ctx.roundRect(b.x - 4, b.y - 4, b.width + 8, 38, 8);
        ctx.fill();

        // Snow layer on rooftops in snowy weather
        if (weather === 'snowy') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(b.x - 6, b.y - 7, b.width + 12, 14, 7);
          ctx.fill();

          // Gentle dripping icicles or scalloped snow fluff
          ctx.fillStyle = '#f1f5f9';
          for (let s = b.x; s < b.x + b.width; s += 16) {
            ctx.beginPath();
            ctx.arc(s + 6, b.y + 6, 4, 0, Math.PI);
            ctx.fill();
          }
        }

        // Building Door
        ctx.fillStyle = '#475569';
        ctx.fillRect(b.doorPos.x - 14, b.doorPos.y - 24, 28, 24);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(b.doorPos.x + 8, b.doorPos.y - 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Windows with warm light
        const numWindows = Math.max(2, Math.floor(b.width / 50));
        const spacing = b.width / (numWindows + 1);
        ctx.fillStyle = timeOfDay === 'night' ? '#fef08a' : '#bae6fd';
        for (let i = 1; i <= numWindows; i++) {
          ctx.fillRect(b.x + i * spacing - 12, b.y + 55, 24, 24);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x + i * spacing - 12, b.y + 55, 24, 24);
        }

        // Custom Signs & Emblems
        if (b.type === 'store') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            b.subtype === 'grocery' ? '🥦 GROCER' : b.subtype === 'bakery' ? '🥐 BAKERY' : b.subtype === 'toy_shop' ? '🧸 TOYS' : '💊 PHARMACY',
            b.x + b.width / 2,
            b.y + 24
          );
        } else if (b.type === 'school') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏫 SUNNYVALE ELEMENTARY', b.x + b.width / 2, b.y + 24);
          // School clock
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y - 14, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1e1b4b';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (b.type === 'church') {
          // Cross atop chapel
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(b.x + b.width / 2 - 4, b.y - 32, 8, 30);
          ctx.fillRect(b.x + b.width / 2 - 14, b.y - 24, 28, 8);
          // Stained glass arched window
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y + 70, 18, Math.PI, 0);
          ctx.lineTo(b.x + b.width / 2 + 18, b.y + 110);
          ctx.lineTo(b.x + b.width / 2 - 18, b.y + 110);
          ctx.closePath();
          ctx.fill();
        } else if (b.type === 'police_station') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐ POLICE PRECINCT 4', b.x + b.width / 2, b.y + 24);
          // Flashing rooftop beacon
          const isBlue = Math.floor(tick / 20) % 2 === 0;
          ctx.fillStyle = isBlue ? '#3b82f6' : '#ef4444';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y - 6, 7, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.type === 'fire_station') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚒 FIRE STATION 7', b.x + b.width / 2, b.y + 24);
        } else if (b.type === 'hospital') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏥 MEDICAL CLINIC', b.x + b.width / 2, b.y + 24);
        } else if (b.type === 'house') {
          // Mailbox in front of house
          if (b.mailboxPos) {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(b.mailboxPos.x - 2, b.mailboxPos.y - 2, 4, 18);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(b.mailboxPos.x - 8, b.mailboxPos.y - 12, 16, 12);
            // Raised red flag if mail waiting
            ctx.fillStyle = b.hasDeliveredMail ? '#10b981' : '#ef4444';
            ctx.fillRect(b.mailboxPos.x + 8, b.mailboxPos.y - (b.hasDeliveredMail ? 6 : 14), 4, 8);
          }
        }
      });

      // 5. VEHICLES RENDERING
      vehicles.forEach((v) => {
        // Skip rendering standalone if player is currently driving it (drawn with player)
        if (v.isDrivenByPlayer) return;

        ctx.save();
        ctx.translate(v.x, v.y);
        ctx.rotate((v.angle * Math.PI) / 180);

        // Vehicle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.roundRect(-v.length / 2 + 4, -v.width / 2 + 4, v.length, v.width, 8);
        ctx.fill();

        // Vehicle Main Body
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(-v.length / 2, -v.width / 2, v.length, v.width, 8);
        ctx.fill();

        // Secondary Trim (e.g. Police white doors, Mail truck stripes, Fire truck ladder)
        ctx.fillStyle = v.secondaryColor;
        if (v.type === 'police_cruiser') {
          ctx.fillRect(-12, -v.width / 2, 24, v.width);
          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 9px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('POLICE', 0, 3);
        } else if (v.type === 'mail_truck') {
          ctx.fillRect(-v.length / 2, -4, v.length, 8);
          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 8px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('USPS MAIL', 0, 3);
        } else if (v.type === 'fire_truck') {
          // Roof ladder
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.strokeRect(-24, -8, 48, 16);
          for (let r = -20; r <= 20; r += 8) {
            ctx.beginPath();
            ctx.moveTo(r, -8);
            ctx.lineTo(r, 8);
            ctx.stroke();
          }
        } else if (v.type === 'ambulance') {
          ctx.fillStyle = '#ef4444';
          // Red cross on roof
          ctx.fillRect(-6, -14, 12, 28);
          ctx.fillRect(-14, -6, 28, 12);
        }

        // Flashing Siren Bar
        if (v.hasSiren) {
          const flash = Math.floor(tick / 15) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
          ctx.fillRect(-6, -6, 12, 12);
        }

        // Windshield
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(v.length / 2 - 16, -v.width / 2 + 4, 10, v.width - 8);

        ctx.restore();
      });

      // 6. ANIMALS RENDERING (Cats & Dogs)
      animals.forEach((a) => {
        // Animate idle / walking
        const bounce = Math.sin(tick * 0.15) * 2;
        const tailWag = Math.sin(tick * 0.25) * 6;

        ctx.save();
        ctx.translate(a.x, a.y + (a.state === 'walking' ? bounce : 0));

        // Animal Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        if (a.species === 'cat') {
          // CAT BODY
          ctx.fillStyle = a.color;
          ctx.beginPath();
          ctx.roundRect(-10, -4, 20, 14, 6);
          ctx.fill();

          // Cat Head
          ctx.beginPath();
          ctx.arc(a.facing === 'right' ? 8 : -8, -8, 8, 0, Math.PI * 2);
          ctx.fill();

          // Cat Ears (triangles)
          ctx.beginPath();
          const headX = a.facing === 'right' ? 8 : -8;
          ctx.moveTo(headX - 6, -12);
          ctx.lineTo(headX - 3, -18);
          ctx.lineTo(headX, -12);
          ctx.moveTo(headX, -12);
          ctx.lineTo(headX + 3, -18);
          ctx.lineTo(headX + 6, -12);
          ctx.fill();

          // Tail with gentle wag
          ctx.strokeStyle = a.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          const tailBase = a.facing === 'right' ? -10 : 10;
          ctx.moveTo(tailBase, 0);
          ctx.quadraticCurveTo(tailBase + (a.facing === 'right' ? -8 : 8), -10, tailBase + (a.facing === 'right' ? -6 : 6) + tailWag * 0.3, -14);
          ctx.stroke();

          // Name label
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🐱 ${a.name}`, 0, -22);
        } else {
          // DOG BODY
          ctx.fillStyle = a.color;
          ctx.beginPath();
          ctx.roundRect(-14, -6, 28, 16, 7);
          ctx.fill();

          // Dog Head
          const headX = a.facing === 'right' ? 12 : -12;
          ctx.beginPath();
          ctx.arc(headX, -8, 9, 0, Math.PI * 2);
          ctx.fill();

          // Dog Floppy / Perky Ears
          ctx.fillStyle = '#a16207';
          ctx.beginPath();
          ctx.ellipse(headX + (a.facing === 'right' ? -4 : 4), -8, 4, 7, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Dog Snout
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(headX + (a.facing === 'right' ? 8 : -8), -7, 3, 0, Math.PI * 2);
          ctx.fill();

          // Happy Wagging Tail
          ctx.strokeStyle = a.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          const tailBase = a.facing === 'right' ? -14 : 14;
          ctx.moveTo(tailBase, -2);
          ctx.lineTo(tailBase + (a.facing === 'right' ? -10 : 10), -12 + tailWag);
          ctx.stroke();

          // Name label
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🐶 ${a.name}`, 0, -22);
        }

        ctx.restore();
      });

      // 7. INSECTS RENDERING (Butterflies, Bees, Ladybugs, Dragonflies, Fireflies)
      insects.forEach((ins) => {
        // Circular / sinusoidal fluttering
        const t = tick * 0.04 + ins.originX;
        const curX = ins.originX + Math.cos(t) * 35;
        const curY = ins.originY + Math.sin(t * 1.5) * 25;
        ins.x = curX;
        ins.y = curY;

        const wingFlap = Math.sin(tick * 0.4);

        ctx.save();
        ctx.translate(curX, curY);

        if (ins.species === 'butterfly') {
          // Butterfly wings
          ctx.fillStyle = ins.color;
          // Left wing
          ctx.beginPath();
          ctx.ellipse(-6 * Math.abs(wingFlap), 0, 7 * Math.abs(wingFlap), 10, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          // Right wing
          ctx.beginPath();
          ctx.ellipse(6 * Math.abs(wingFlap), 0, 7 * Math.abs(wingFlap), 10, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Body
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-1.5, -6, 3, 12);
        } else if (ins.species === 'bee') {
          // Bee body (yellow and black stripes)
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-2, -5, 4, 10);
          // Translucent wings
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.ellipse(-4, -6, 4, 2, wingFlap, 0, Math.PI * 2);
          ctx.ellipse(4, -6, 4, 2, -wingFlap, 0, Math.PI * 2);
          ctx.fill();
        } else if (ins.species === 'ladybug') {
          // Red ladybug with black dots
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.fillRect(-1, -6, 2, 12);
          // Dots
          ctx.beginPath();
          ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
          ctx.arc(3, -2, 1.2, 0, Math.PI * 2);
          ctx.arc(-3, 2, 1.2, 0, Math.PI * 2);
          ctx.arc(3, 2, 1.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (ins.species === 'dragonfly') {
          // Emerald long slender body
          ctx.fillStyle = ins.color;
          ctx.fillRect(-1.5, -10, 3, 20);
          // 4 slender wings
          ctx.fillStyle = 'rgba(224, 242, 254, 0.8)';
          ctx.fillRect(-14, -6, 28, 2.5);
          ctx.fillRect(-11, -1, 22, 2.5);
        } else if (ins.species === 'firefly') {
          // Firefly pulsating glow
          const glow = Math.abs(Math.sin(tick * 0.08));
          if (timeOfDay === 'night' || timeOfDay === 'sunset') {
            const rad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
            rad.addColorStop(0, 'rgba(163, 230, 53, 0.9)');
            rad.addColorStop(1, 'rgba(163, 230, 53, 0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = glow > 0.4 ? '#bef264' : '#65a30d';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 8. NPCs RENDERING (Officers, Mailman, Teachers, Pastors)
      npcs.forEach((n) => {
        ctx.save();
        ctx.translate(n.x, n.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // NPC Body
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.roundRect(-9, -12, 18, 22, 4);
        ctx.fill();

        // NPC Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -18, 8, 0, Math.PI * 2);
        ctx.fill();

        // NPC Hair / Hat
        ctx.fillStyle = n.hairColor;
        if (n.role === 'policeman') {
          // Police Cap
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(-8, -26, 16, 6);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-2, -24, 4, 3);
        } else if (n.role === 'mailman') {
          // Postal Cap
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(-8, -26, 16, 6);
        } else if (n.role === 'baker') {
          // White Chef Hat
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-7, -28, 14, 10);
        } else {
          ctx.fillRect(-8, -24, 16, 6);
        }

        // NPC Name tag
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, 0, -32);

        ctx.restore();
      });

      // 9. PLAYER AVATAR RENDERING
      ctx.save();
      ctx.translate(localPlayerX, localPlayerY);

      // Player Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // If driving a vehicle, render vehicle around player
      if (player.inVehicleId) {
        ctx.fillStyle = player.role === 'police' ? '#1e3a8a' : player.role === 'firefighter' ? '#dc2626' : '#2563eb';
        ctx.beginPath();
        ctx.roundRect(-24, -16, 48, 32, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DRIVING', 0, 3);
      } else {
        // Player Body based on Role
        let uniformColor = '#0284c7';
        if (player.role === 'police') uniformColor = '#1e3a8a';
        if (player.role === 'mailman') uniformColor = '#2563eb';
        if (player.role === 'firefighter') uniformColor = '#dc2626';
        if (player.role === 'paramedic') uniformColor = '#059669';

        ctx.fillStyle = uniformColor;
        ctx.beginPath();
        ctx.roundRect(-10, -12, 20, 24, 5);
        ctx.fill();

        // Role details (reflective stripes for firefighter, mailbag for mailman, badge for police)
        if (player.role === 'firefighter') {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-10, 0, 20, 4);
        } else if (player.role === 'mailman') {
          // Cross-body Mail Satchel
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, -10);
          ctx.lineTo(8, 8);
          ctx.stroke();
          ctx.fillStyle = '#92400e';
          ctx.fillRect(4, 2, 9, 8);
        } else if (player.role === 'police') {
          // Gold Badge
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-3, -8, 6, 6);
        }

        // Head
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -18, 9, 0, Math.PI * 2);
        ctx.fill();

        // Headgear / Hat
        if (player.role === 'police') {
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(-9, -26, 18, 6);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-2, -24, 4, 3);
        } else if (player.role === 'firefighter') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.roundRect(-11, -27, 22, 9, 3);
          ctx.fill();
        } else if (player.role === 'mailman') {
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(-9, -26, 18, 6);
        }

        // Bug net if explorer
        if (player.role === 'explorer') {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(8, -6);
          ctx.lineTo(18, -18);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(20, -20, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Player Tag
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', 0, -32);
      }

      ctx.restore();

      // 10. TIME OF DAY AMBIENT TINT
      if (timeOfDay === 'sunset') {
        ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else if (timeOfDay === 'night') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Streetlamp / House window light cones
        buildings.forEach((b) => {
          const grad = ctx.createRadialGradient(b.doorPos.x, b.doorPos.y, 10, b.doorPos.x, b.doorPos.y, 80);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.doorPos.x, b.doorPos.y, 80, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 11. WEATHER OVERLAYS & PARTICLES (Rain, Snow, Storm, Wind Leaves)
      // A. Atmospheric Color Tinting for Weather
      if (weather === 'rainy') {
        // Overcast cool slate blue wash
        ctx.fillStyle = 'rgba(71, 85, 105, 0.22)';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else if (weather === 'stormy') {
        // Dark storm clouds with purple/charcoal hue
        ctx.fillStyle = 'rgba(30, 41, 59, 0.42)';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Thunder & Lightning flash effect
        const nowMs = Date.now();
        if (nowMs - lightningFlashRef.current.lastTime > 6000 + Math.random() * 8000) {
          lightningFlashRef.current.active = true;
          lightningFlashRef.current.opacity = 0.7;
          lightningFlashRef.current.lastTime = nowMs;
          sound.playThunder();
        }

        if (lightningFlashRef.current.active) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlashRef.current.opacity})`;
          ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
          lightningFlashRef.current.opacity -= 0.05;
          if (lightningFlashRef.current.opacity <= 0) {
            lightningFlashRef.current.active = false;
          }
        }
      } else if (weather === 'snowy') {
        // Cold crisp winter frosty haze
        ctx.fillStyle = 'rgba(224, 242, 254, 0.15)';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      // B. Rain Particles & Puddle Splashes
      if (weather === 'rainy' || weather === 'stormy') {
        const isStorm = weather === 'stormy';
        const windDrift = isStorm ? -6 : -2.5;

        // Draw falling raindrops
        rainDropsRef.current.forEach((drop) => {
          drop.y += drop.speed * (isStorm ? 1.3 : 1.0);
          drop.x += windDrift;
          if (drop.y > WORLD_HEIGHT) {
            drop.y = -20;
            drop.x = Math.random() * (WORLD_WIDTH + 400);

            // Chance to create a puddle splash when hitting ground near camera view
            if (Math.random() < 0.25) {
              rainSplashesRef.current.push({
                x: drop.x,
                y: WORLD_HEIGHT - Math.random() * 200,
                radius: 1,
                maxRadius: 4 + Math.random() * 5,
                opacity: 0.6,
              });
            }
          }
          if (drop.x < 0) drop.x = WORLD_WIDTH + 200;

          ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity})`;
          ctx.lineWidth = isStorm ? 2.5 : 1.8;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + windDrift, drop.y + drop.length * (isStorm ? 1.25 : 1.0));
          ctx.stroke();
        });

        // Draw and update ripple splashes
        ctx.lineWidth = 1.2;
        for (let i = rainSplashesRef.current.length - 1; i >= 0; i--) {
          const s = rainSplashesRef.current[i];
          s.radius += 0.45;
          s.opacity -= 0.04;
          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            rainSplashesRef.current.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = `rgba(224, 242, 254, ${s.opacity})`;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 1.8, s.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Limit splashes pool
        if (rainSplashesRef.current.length > 80) {
          rainSplashesRef.current.splice(0, 30);
        }
      }

      // C. Snow Particles (Feathery, gently drifting flakes with hexagonal branching)
      if (weather === 'snowy') {
        snowFlakesRef.current.forEach((flake) => {
          // Sinusoidal horizontal drift
          const drift = Math.sin(tick * flake.wobbleSpeed + flake.x) * 1.5;
          flake.y += flake.speedY;
          flake.x += flake.speedX + drift;

          if (flake.y > WORLD_HEIGHT) {
            flake.y = -10;
            flake.x = Math.random() * WORLD_WIDTH;
          }
          if (flake.x < 0) flake.x = WORLD_WIDTH;
          if (flake.x > WORLD_WIDTH) flake.x = 0;

          // Draw fluffy snowflake
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          ctx.fill();

          // Subtle crystalline arms on larger flakes
          if (flake.radius > 2.8) {
            ctx.strokeStyle = `rgba(241, 245, 249, ${flake.opacity * 0.9})`;
            ctx.lineWidth = 0.8;
            for (let a = 0; a < flake.arms; a++) {
              const ang = (a * Math.PI * 2) / flake.arms + tick * 0.01;
              ctx.beginPath();
              ctx.moveTo(flake.x, flake.y);
              ctx.lineTo(flake.x + Math.cos(ang) * (flake.radius + 2.5), flake.y + Math.sin(ang) * (flake.radius + 2.5));
              ctx.stroke();
            }
          }
        });
      }

      // D. Breezy / Wind Leaves (Swirling autumn petals & leaves across the street)
      if (weather === 'breezy') {
        windLeavesRef.current.forEach((leaf) => {
          leaf.x += leaf.speedX;
          leaf.y += leaf.speedY + Math.sin(tick * 0.05 + leaf.x) * 0.8;
          leaf.angle += leaf.rotSpeed;

          if (leaf.x > WORLD_WIDTH) {
            leaf.x = -20;
            leaf.y = Math.random() * WORLD_HEIGHT;
          }
          if (leaf.y > WORLD_HEIGHT) leaf.y = 0;

          ctx.save();
          ctx.translate(leaf.x, leaf.y);
          ctx.rotate(leaf.angle);
          ctx.fillStyle = leaf.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      ctx.restore();

      // Update interaction prompt
      const nearest = getNearestEntity();
      if (nearest) {
        setNearbyPrompt(nearest.label);
      } else {
        setNearbyPrompt(null);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [player, buildings, vehicles, animals, insects, npcs, timeOfDay, weather, onUpdatePlayerPos, getNearestEntity]);

  // Click on Canvas to move or interact
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickScreenX = e.clientX - rect.left;
    const clickScreenY = e.clientY - rect.top;

    // Convert screen coord to world coord
    const width = canvas.width;
    const height = canvas.height;
    const worldX = (clickScreenX - width / 2) / cameraRef.current.zoom + cameraRef.current.x;
    const worldY = (clickScreenY - height / 2) / cameraRef.current.zoom + cameraRef.current.y;

    // Check if clicked near an entity
    const nearest = getNearestEntity();
    if (nearest) {
      if (nearest.type === 'building' || nearest.type === 'mailbox') {
        onInteractBuilding(nearest.entity as Building);
        return;
      } else if (nearest.type === 'animal') {
        onInteractAnimal(nearest.entity as Animal);
        return;
      } else if (nearest.type === 'vehicle') {
        onInteractVehicle(nearest.entity as Vehicle);
        return;
      } else if (nearest.type === 'npc') {
        onInteractNPC(nearest.entity as NPC);
        return;
      } else if (nearest.type === 'insect') {
        onInteractInsect(nearest.entity as Insect);
        return;
      }
    }

    // Otherwise move player towards click
    onUpdatePlayerPos(
      Math.max(30, Math.min(WORLD_WIDTH - 30, worldX)),
      Math.max(30, Math.min(WORLD_HEIGHT - 30, worldY)),
      worldX > player.x ? 'right' : 'left'
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-emerald-100">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Nearby Interaction Action Prompt Toast */}
      {nearbyPrompt && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-amber-300 flex items-center gap-3 backdrop-blur-md animate-bounce">
          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-xs rounded-md uppercase">
            Press E or Tap
          </span>
          <span className="text-xs font-extrabold">{nearbyPrompt}</span>
        </div>
      )}

      {/* Movement hint for new players */}
      <div className="absolute top-16 left-4 z-20 pointer-events-none hidden md:block bg-black/40 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs">
        Move: [W][A][S][D] or Arrow Keys • Interact: [E] or Click
      </div>
    </div>
  );
};
