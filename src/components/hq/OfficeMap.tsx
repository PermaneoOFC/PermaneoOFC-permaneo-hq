import { FloorRoomArt } from "./FloorRoomArt";
import { useMemo, useRef, useState, useLayoutEffect, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Maximize2,
  Minus,
  Palette,
  Plus,
  UsersRound,
} from "lucide-react";
import { ROOMS, type Agent } from "@/lib/hq";
import { cn } from "@/lib/utils";
import { AgentAvatar, Pill, StatusPill } from "./ui";

type RoomId = "engenharia" | "estudio" | "biblioteca" | "coordenacao" | "negocios";
const roomMeta: Record<RoomId, { count: number; color: string; icon: typeof Code2 }> = {
  engenharia: { count: 4, color: "#45b5aa", icon: Code2 },
  estudio: { count: 3, color: "#c49a70", icon: Palette },
  biblioteca: { count: 3, color: "#89aaa0", icon: BookOpen },
  coordenacao: { count: 2, color: "#8bbcc2", icon: UsersRound },
  negocios: { count: 2, color: "#c6ad78", icon: BriefcaseBusiness },
};
const roomGeometry: Record<
  RoomId,
  { x: number; y: number; w: number; h: number; seats: [number, number][] }
> = {
  engenharia: {
    x: 40,
    y: 40,
    w: 625,
    h: 350,
    seats: [
      [112, 322],
      [244, 322],
      [376, 322],
      [508, 322],
    ],
  },
  estudio: {
    x: 735,
    y: 40,
    w: 625,
    h: 350,
    seats: [
      [890, 322],
      [1050, 322],
      [1210, 322],
    ],
  },
  biblioteca: {
    x: 40,
    y: 570,
    w: 414,
    h: 350,
    seats: [
      [112, 855],
      [220, 855],
      [328, 855],
    ],
  },
  coordenacao: {
    x: 500,
    y: 570,
    w: 400,
    h: 350,
    seats: [
      [620, 855],
      [770, 855],
    ],
  },
  negocios: {
    x: 946,
    y: 570,
    w: 414,
    h: 350,
    seats: [
      [1062, 855],
      [1230, 855],
    ],
  },
};
const order: RoomId[] = ["engenharia", "estudio", "biblioteca", "coordenacao", "negocios"];

export function OfficeMap({
  agents,
  selected,
  onSelect,
  queue = {},
}: {
  agents: Agent[];
  selected?: string | null;
  onSelect?: (room: string) => void;
  queue?: Record<string, number>;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean; id: number } | null>(null);
  const [zoom, setZoom] = useState(0.9);
  const [localSelected, setLocalSelected] = useState("engenharia");
  const [position, setPosition] = useState(0);
  const suppressClick = useRef(false);
  const anchor = useRef<number | null>(null);
  const choose = (id: string) => {
    setLocalSelected(id);
    onSelect?.(id);
  };
  useLayoutEffect(() => {
    if (viewport.current && anchor.current !== null) {
      viewport.current.scrollLeft = anchor.current * zoom - viewport.current.clientWidth / 2;
      anchor.current = null;
    }
  }, [zoom]);
  const [dragging, setDragging] = useState(false);
  const byRoom = useMemo(
    () =>
      Object.fromEntries(
        order.map((id) => [id, agents.filter((agent) => agent.room === id)]),
      ) as Record<RoomId, Agent[]>,
    [agents],
  );
  const active = (selected && selected in ROOMS ? selected : localSelected) as RoomId;
  const selectedAgents = byRoom[active] ?? [];

  function changeZoom(next: number) {
    if (viewport.current)
      anchor.current = (viewport.current.scrollLeft + viewport.current.clientWidth / 2) / zoom;
    setZoom(Math.max(0.2, Math.min(1.5, Number(next.toFixed(2)))));
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    suppressClick.current = false;
    drag.current = {
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      moved: false,
      id: event.pointerId,
    };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !viewport.current) return;
    const delta = event.clientX - drag.current.x;
    if (Math.abs(delta) > 5) {
      drag.current.moved = true;
      suppressClick.current = true;
      setDragging(true);
      viewport.current.setPointerCapture?.(event.pointerId);
    }
    if (drag.current.moved) viewport.current.scrollLeft = drag.current.left - delta;
  }
  function pointerUp() {
    if (drag.current && viewport.current?.hasPointerCapture?.(drag.current.id))
      viewport.current.releasePointerCapture(drag.current.id);
    drag.current = null;
    setDragging(false);
  }
  function selectAdjacent(current: RoomId, direction: number) {
    const index = order.indexOf(current);
    choose(order[(index + direction + order.length) % order.length]!);
  }

  return (
    <div className="virtual-floor">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Explore o HQ</p>
          <p className="text-xs text-muted-foreground">
            Selecione uma sala. Arraste o andar para explorar; a roda segue rolando a página.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-md border bg-card p-1"
          aria-label="Controles do andar"
        >
          <button
            type="button"
            className="floor-control"
            aria-label="Diminuir zoom"
            onClick={() => changeZoom(zoom - 0.1)}
            disabled={zoom <= 0.2}
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-12 text-center text-xs tabular-nums" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="floor-control"
            aria-label="Aumentar zoom"
            onClick={() => changeZoom(zoom + 0.1)}
            disabled={zoom >= 1.5}
          >
            <Plus className="size-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            className="floor-fit"
            onClick={() => {
              changeZoom(Math.floor(((viewport.current?.clientWidth || 924) / 1400) * 100) / 100);
              anchor.current = null;
              if (viewport.current) {
                viewport.current.scrollLeft = 0;
                viewport.current.scrollTop = 0;
              }
            }}
          >
            <Maximize2 className="size-3.5" /> Ver andar inteiro
          </button>
        </div>
      </div>

      <div
        ref={viewport}
        className={cn("floor-viewport", dragging && "is-dragging")}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onLostPointerCapture={(event) => { if (event.target === event.currentTarget) pointerUp(); }}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setPosition(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth));
        }}
        tabIndex={0}
        aria-label="Mapa explorável: use as setas para deslocar"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            e.currentTarget.scrollBy({
              left: e.key === "ArrowRight" ? 180 : -180,
              behavior: "smooth",
            });
          }
        }}
      >
        <svg
          className="floor-svg"
          style={{ width: `${1400 * zoom}px` }}
          viewBox="0 0 1400 960"
          role="group"
          aria-label="Andar virtual do Permaneo, com cinco salas e corredor central"
        >
          <defs>
            <pattern id="floorGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M24 0H0V24"
                fill="none"
                stroke="#9aacaa"
                strokeOpacity=".13"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="hall" x2="0" y2="1">
              <stop stopColor="#31444a" />
              <stop offset="1" stopColor="#273a40" />
            </linearGradient>
            <filter id="roomShadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow
                dx="0"
                dy="9"
                stdDeviation="8"
                floodColor="#071317"
                floodOpacity=".28"
              />
            </filter>
          </defs>
          <rect x="0" y="0" width="1400" height="960" rx="18" fill="#18272d" />
          <rect x="0" y="0" width="1400" height="960" rx="18" fill="url(#floorGrid)" />
          <path
            d="M22 410H1378V550H22Z"
            fill="url(#hall)"
            stroke="#728987"
            strokeOpacity=".48"
            strokeWidth="3"
          />
          <path
            d="M38 480H1362"
            stroke="#b1bcad"
            strokeOpacity=".28"
            strokeDasharray="14 14"
            strokeWidth="2"
          />
          <text x="700" y="495" fill="#b6c5c1" fontSize="13" textAnchor="middle" letterSpacing="4">
            PERMANEO / SOCIAL CLUB
          </text>
          <HallDecor x={180} y={466} />
          <HallDecor x={1200} y={466} />
          <Plant x={310} y={480} />
          <Plant x={1080} y={480} />
          <Plant x={24} y={407} />
          <Plant x={1376} y={553} />
          {order.map((id) => {
            const geometry = roomGeometry[id];
            const room = ROOMS[id]!;
            const meta = roomMeta[id];
            const occupants = byRoom[id] ?? [];
            const isSelected = active === id;
            return (
              <g
                key={id}
                className={cn("floor-room", isSelected && "selected-room")}
                data-room-hit="true"
                role="button"
                tabIndex={0}
                aria-label={`${room.label}, ${occupants.length} de ${meta.count} agentes`}
                aria-pressed={isSelected}
                onClick={() => choose(id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(id);
                  }
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    selectAdjacent(id, 1);
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    selectAdjacent(id, -1);
                  }
                }}
              >
                <rect
                  className="room-shadow"
                  x={geometry.x}
                  y={geometry.y}
                  width={geometry.w}
                  height={geometry.h}
                  rx="8"
                  fill="#293b41"
                  stroke={isSelected ? "#62d1bf" : "#778b88"}
                  strokeWidth={isSelected ? 4 : 2}
                  filter="url(#roomShadow)"
                />
                <rect
                  x={geometry.x + 7}
                  y={geometry.y + 7}
                  width={geometry.w - 14}
                  height={geometry.h - 14}
                  rx="4"
                  fill="#34484d"
                />
                <rect
                  x={geometry.x + 7}
                  y={geometry.y + 7}
                  width={geometry.w - 14}
                  height={geometry.h - 14}
                  rx="4"
                  fill="url(#floorGrid)"
                />
                <rect
                  x={geometry.x + 15}
                  y={geometry.y + 15}
                  width={geometry.w - 30}
                  height="48"
                  rx="3"
                  fill="#20343a"
                />
                <rect
                  x={geometry.x + 19}
                  y={geometry.y + 20}
                  width="4"
                  height="35"
                  rx="2"
                  fill={meta.color}
                />
                <text
                  x={geometry.x + 35}
                  y={geometry.y + 38}
                  fill="#f0f3ee"
                  fontSize="18"
                  fontWeight="700"
                >
                  {room.label}
                </text>
                <text x={geometry.x + 35} y={geometry.y + 54} fill="#acbfbb" fontSize="11">
                  {room.hint}
                </text>
                <circle
                  cx={geometry.x + geometry.w - 33}
                  cy={geometry.y + 39}
                  r="15"
                  fill="#17292f"
                  stroke={meta.color}
                  strokeWidth="1.5"
                />
                <text
                  x={geometry.x + geometry.w - 33}
                  y={geometry.y + 43}
                  fill="#edf2ed"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                >
                  {occupants.length}/{meta.count}
                </text>
                <RoomWindows x={geometry.x + geometry.w - 128} y={geometry.y + 74} />
                <svg
                  x={geometry.x + 8}
                  y={geometry.y + 68}
                  width={geometry.w - 16}
                  height={geometry.h - 76}
                  viewBox="0 0 960 460"
                  preserveAspectRatio="none"
                >
                  <FloorRoomArt room={id} />
                </svg>
                {occupants.map((agent, index) => {
                  const [seatX, seatY] = geometry.seats[index] ?? [
                    geometry.x + 48 + index * 70,
                    geometry.y + geometry.h - 54,
                  ];
                  return (
                    <foreignObject
                      key={agent.id}
                      x={seatX - 46}
                      y={seatY - 8}
                      width="92"
                      height="86"
                      data-agent-link="true"
                    >
                      <Link
                        to="/agentes/$slug"
                        params={{ slug: agent.slug }}
                        className="floor-person"
                        onClick={(e) => e.stopPropagation()}
                        title={`Abrir escritório de ${agent.name}`}
                      >
                        <AgentAvatar agent={agent} size="md" />
                        <span>{agent.name}</span>
                      </Link>
                    </foreignObject>
                  );
                })}
                <RoomDoor
                  x={geometry.x + geometry.w / 2 - 22}
                  y={id === "engenharia" || id === "estudio" ? 390 : 570}
                  top={id === "engenharia" || id === "estudio"}
                />
                <Plant x={geometry.x + geometry.w - 27} y={geometry.y + geometry.h - 22} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="floor-position" aria-hidden="true">
        <span style={{ left: `${position * 80}%` }} />
      </div>
      <div className="grid gap-2 md:hidden" aria-label="Salas do escritório">
        {order.map((id) => {
          const room = ROOMS[id]!;
          const meta = roomMeta[id];
          const Icon = meta.icon;
          const occupants = byRoom[id] ?? [];
          return (
            <button
              type="button"
              key={id}
              onClick={() => choose(id)}
              aria-pressed={active === id}
              className={cn("mobile-room", active === id && "mobile-room-active")}
            >
              <span
                className="mobile-room-art"
                style={{ "--room-accent": meta.color } as React.CSSProperties}
              >
                <Icon className="size-5" />
                <span className="mobile-window" />
                <span className="mobile-desk" />
                <span className="mobile-people">
                  {occupants.slice(0, 4).map((agent) => (
                    <AgentAvatar key={agent.id} agent={agent} size="sm" />
                  ))}
                </span>
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold">{room.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {room.hint} · {occupants.length} agentes
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <aside className="mt-4 rounded-lg border bg-card p-4" aria-live="polite">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: roomMeta[active].color }}
              />
              <h2 className="font-display text-lg font-bold">{ROOMS[active]!.label}</h2>
              <Pill>{selectedAgents.length} agentes</Pill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {ROOMS[active]!.hint} · Sala {String(order.indexOf(active) + 1).padStart(2, "0")}
            </p>
          </div>
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
            {selectedAgents.map((agent) => (
              <Link
                key={agent.id}
                to="/agentes/$slug"
                params={{ slug: agent.slug }}
                className="group flex min-w-0 items-center gap-2 rounded-md border bg-background p-2 transition hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <AgentAvatar agent={agent} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{agent.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {agent.role_title}
                    {(queue[agent.id] ?? 0) > 0 ? ` · ${queue[agent.id]} pedidos` : ""}
                  </span>
                </span>
                <StatusPill status={agent.status} />
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function RoomWindows({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width="93" height="8" rx="3" fill="#94c6c2" opacity=".7" />
      <path d={`M${x + 30} ${y}v8m31-8v8`} stroke="#d3e0d9" strokeWidth="2" />
    </g>
  );
}
function RoomDoor({ x, y, top }: { x: number; y: number; top: boolean }) {
  return (
    <g aria-hidden="true" opacity=".9">
      <rect x={x} y={y - (top ? 2 : 1)} width="44" height="8" fill="#18272d" />
      <path
        d={top ? `M${x} ${y}v-23a23 23 0 0 1 23 23` : `M${x} ${y}v23a23 23 0 0 0 23-23`}
        fill="none"
        stroke="#c1a16c"
        strokeWidth="2"
      />
      <circle cx={x + 35} cy={top ? y - 10 : y + 11} r="1.5" fill="#e2c987" />
    </g>
  );
}
function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden="true" opacity=".9">
      <path d={`M${x - 7} ${y + 6}h14l-2 12h-10z`} fill="#92795c" />
      <path
        d={`M${x} ${y + 6}v-17m0 9q-13-2-11-12 10 0 11 12m0-3q12-2 11-12-10 0-11 12`}
        fill="none"
        stroke="#75ad91"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}
function HallDecor({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden="true" transform={`translate(${x} ${y})`}>
      <ellipse cy="49" rx="98" ry="13" fill="#172b32" opacity=".5" />
      <rect x="-85" y="-23" width="170" height="42" rx="9" fill="#607c7e" />
      <rect x="-76" y="-17" width="74" height="24" rx="5" fill="#77918e" />
      <rect x="2" y="-17" width="74" height="24" rx="5" fill="#77918e" />
      <path d="M-77 19v12m154-12v12" stroke="#10262e" strokeWidth="5" />
      <ellipse cy="45" rx="48" ry="15" fill="#a68b6a" />
      <path d="M-33 48v15m66-15v15" stroke="#152a31" strokeWidth="4" />
      <rect x="-15" y="38" width="20" height="11" rx="2" fill="#d4c5a2" />
      <circle cx="19" cy="42" r="5" fill="#26454b" />
    </g>
  );
}
