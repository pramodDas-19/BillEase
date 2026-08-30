"use client";

import React, { useState } from "react";
import {
  MOCK_REVENUE_CHART_DATA,
  TimeRange,
  ChartDataPoint,
} from "@/mock/dashboard.mock";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30D");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const ranges: TimeRange[] = ["7D", "30D", "3M", "6M", "1Y"];
  const currentData: ChartDataPoint[] = MOCK_REVENUE_CHART_DATA[selectedRange];

  // Calculate dynamic max for chart scaling
  const maxVal = Math.max(
    ...currentData.flatMap((d) => [d.invoiced, d.collected]),
    100000
  );
  const chartMax = Math.ceil(maxVal * 1.15); // Add headroom

  // Dimensions for SVG viewport
  const svgWidth = 650;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Helper to map data index & value to coordinate
  const getCoords = (index: number, value: number) => {
    const x = paddingX + (index / (currentData.length - 1 || 1)) * graphWidth;
    const y = svgHeight - paddingY - (value / chartMax) * graphHeight;
    return { x, y };
  };

  // Generate smooth SVG path
  const generateSmoothPath = (values: number[]) => {
    if (values.length === 0) return "";
    const points = values.map((val, idx) => getCoords(idx, val));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const invoicedPath = generateSmoothPath(currentData.map((d) => d.invoiced));
  const collectedPath = generateSmoothPath(currentData.map((d) => d.collected));

  // Area path for gradient fill
  const lastIndex = currentData.length - 1;
  const firstX = getCoords(0, 0).x;
  const lastX = getCoords(lastIndex, 0).x;
  const baseY = svgHeight - paddingY;

  const invoicedAreaPath = `${invoicedPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  const collectedAreaPath = `${collectedPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

  const activePoint =
    hoveredIndex !== null ? currentData[hoveredIndex] : currentData[currentData.length - 1];

  return (
    <div className="clay-card p-5 sm:p-6 flex flex-col justify-between h-full">
      {/* Header: Title, Controls, Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Revenue Overview
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Billed vs Collected cash performance
          </p>
        </div>

        {/* Time range selector pills with tactile neo-clay switch */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60 shadow-inner self-start sm:self-auto">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => {
                setSelectedRange(range);
                setHoveredIndex(null);
              }}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                selectedRange === range
                  ? "clay-pill-active font-extrabold text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Current Hover Snapshot */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-800 shadow-xs" />
            <span className="font-semibold text-slate-600">Invoiced</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="font-semibold text-slate-600">Collected</span>
          </div>
        </div>

        {activePoint && (
          <div className="clay-icon-container flex items-center gap-3 bg-slate-50/90 border border-slate-200/70 px-3.5 py-1.5 rounded-xl">
            <span className="font-bold text-slate-500">{activePoint.label}:</span>
            <span className="text-slate-900 font-extrabold">
              Inv: {formatCurrency(activePoint.invoiced, "INR")}
            </span>
            <span className="text-emerald-700 font-extrabold">
              Col: {formatCurrency(activePoint.collected, "INR")}
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="relative mt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Soft Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((factor) => {
            const y = svgHeight - paddingY - factor * graphHeight;
            const gridVal = Math.round((chartMax * factor) / 1000) * 1000;
            return (
              <g key={factor}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="600"
                >
                  ₹{Math.round(gridVal / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={invoicedAreaPath} fill="url(#invoicedGrad)" />
          <path d={collectedAreaPath} fill="url(#collectedGrad)" />

          {/* Curves */}
          <path
            d={invoicedPath}
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={collectedPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Hover interactive markers & X-Axis Labels */}
          {currentData.map((d, idx) => {
            const invCoord = getCoords(idx, d.invoiced);
            const colCoord = getCoords(idx, d.collected);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hover hotspot */}
                <rect
                  x={invCoord.x - (graphWidth / currentData.length) / 2}
                  y={0}
                  width={graphWidth / currentData.length}
                  height={svgHeight}
                  fill="transparent"
                />

                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={invCoord.x}
                    y1={paddingY}
                    x2={invCoord.x}
                    y2={baseY}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Invoiced Point */}
                <circle
                  cx={invCoord.x}
                  cy={invCoord.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#334155"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* Collected Point */}
                <circle
                  cx={colCoord.x}
                  cy={colCoord.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* X-axis label */}
                <text
                  x={invCoord.x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill={isHovered ? "#0f172a" : "#64748b"}
                  fontSize="10"
                  fontWeight={isHovered ? "800" : "600"}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
