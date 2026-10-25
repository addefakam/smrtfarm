"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LineChart, Line, YAxis, XAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LiveChartCardProps {
  title: string;
  unit: string;
  values: number[];
  timestamps?: number[];
  color?: string;
  minThreshold?: number;
  maxThreshold?: number;
  height?: number;
  icon?: React.ElementType;
  iconColor?: string;
}

const CHART_COLORS = {
  emerald: "#1B5347",
  blue:    "#1A5276",
  amber:   "#C89F62",
  rose:    "#C0392B",
  teal:    "#2A7A65",
  orange:  "#D4875A",
};

const chartConfig = {
  value: {
    label: "Live reading",
  },
} satisfies ChartConfig;

export function LiveChartCard({
  title, unit, values, timestamps,
  color = CHART_COLORS.emerald,
  minThreshold, maxThreshold,
  height = 120,
  icon: Icon,
  iconColor = "text-emerald-600",
}: LiveChartCardProps) {
  // Build chart data with index-based x-axis
  const data = values.map((v, i) => ({
    idx: i,
    value: v,
    time: timestamps ? new Date(timestamps[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : `${i}`,
  }));
  const latest = values.length > 0 ? values[values.length - 1] : null;

  // Color logic for latest value
  let valueColorClass = "text-foreground";
  if (minThreshold !== undefined && latest !== null) {
    if (latest < minThreshold) valueColorClass = "text-rose-700";
    else if (latest < minThreshold * 1.2) valueColorClass = "text-amber-700";
    else valueColorClass = "text-emerald-700";
  }

  const yMin = Math.min(...(values.length > 0 ? values : [0])) - 2;
  const yMax = Math.max(...(values.length > 0 ? values : [10])) + 2;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
            {Icon && <Icon className={cn("w-3 h-3", iconColor)} />}
            {title}
          </CardTitle>
          <div className="text-right">
            <div className={cn("text-lg font-bold tabular-nums font-mono", valueColorClass)}>
              {latest !== null ? (typeof latest === "number" ? latest.toFixed(latest < 10 ? 2 : 1) : latest) : "—"}
            </div>
            <div className="text-[9px] text-muted-foreground -mt-1">{unit}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 pb-1">
        <div style={{ height: `${height}px` }}>
          <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="idx" hide />
              <YAxis
                domain={[Math.floor(yMin), Math.ceil(yMax)]}
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              {minThreshold !== undefined && (
                <ReferenceLine y={minThreshold} stroke="#C0392B" strokeDasharray="3 3" strokeWidth={0.8} />
              )}
              {maxThreshold !== undefined && (
                <ReferenceLine y={maxThreshold} stroke="#1A5276" strokeDasharray="3 3" strokeWidth={0.8} />
              )}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item, _index) => {
                      const time = item?.payload?.time;
                      return `${Number(value).toFixed(2)} ${unit}${time ? ` · ${time}` : ""}`;
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { CHART_COLORS };
