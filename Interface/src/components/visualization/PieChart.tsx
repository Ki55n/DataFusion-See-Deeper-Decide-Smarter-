"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DataItem {
  name: string;
  value: number;
}

interface PieChartProps {
  data: DataItem[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

export default function ResponsivePieChart({ data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-full bg-transparent text-primary-foreground">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-bold">Data Distribution</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Interactive pie chart showing data distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <div className="w-full h-[calc(100%-4rem)]">
          <ChartContainer
            config={{
              ...Object.fromEntries(
                data.map((item, index) => [
                  item.name,
                  { label: item.name, color: COLORS[index % COLORS.length] },
                ])
              ),
            }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="70%"
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    percent > 0.05
                      ? `${name} ${(percent * 100).toFixed(0)}%`
                      : ""
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="bg-popover border-border text-popover-foreground" />
                  }
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  formatter={(value, entry: any) => (
                    <span className="text-xs font-medium text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm font-semibold">Total: {total}</p>
        </div>
      </CardContent>
    </div>
  );
}
