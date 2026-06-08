"use client";

import { motion } from "framer-motion";

export interface RouteNode { id: string; x: number; y: number; label: string; active?: boolean }
export interface CanvasRoute { from: string; to: string; quality?: "live" | "cache" | "demo" }

const fallbackNodes: RouteNode[] = [
  { id: "sao", x: 18, y: 68, label: "São Paulo", active: true },
  { id: "atl", x: 48, y: 46, label: "" },
  { id: "eur", x: 76, y: 28, label: "" },
];

export default function RouteCanvas({ nodes = fallbackNodes, routes = [] }: { nodes?: RouteNode[]; routes?: CanvasRoute[] }) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (
    <div className="route-canvas" aria-label="Visualização abstrata de rotas">
      <svg viewBox="0 0 100 100" role="img">
        {routes.map((route, index) => {
          const from = byId.get(route.from);
          const to = byId.get(route.to);
          if (!from || !to) return null;
          return (
            <motion.path
              key={`${route.from}-${route.to}-${index}`}
              d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - 18} ${to.x} ${to.y}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.65 }}
              transition={{ duration: 1.2, delay: index * 0.1 }}
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={node.active ? 1.8 : 1.1} className={node.active ? "active" : ""} />
            {node.label && <text x={node.x + 3} y={node.y - 3}>{node.label}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}
