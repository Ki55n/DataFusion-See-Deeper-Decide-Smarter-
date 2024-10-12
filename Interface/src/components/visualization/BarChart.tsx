"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

export default function BarChart({
  data,
  title = "Interactive Bar Chart",
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width,
          height: Math.min(400, Math.max(200, width * 0.5)),
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial setup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0)
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 50, left: 60 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const x = d3.scaleBand().range([0, chartWidth]).padding(0.3);
    const y = d3.scaleLinear().range([chartHeight, 0]);

    x.domain(data.map((d) => d.label));
    y.domain([0, d3.max(data, (d) => d.value) || 0]);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create blue gradient
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "blue-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#60A5FA"); // Light blue
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#1E40AF"); // Dark blue

    // Create bars
    chart
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label) || 0)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => chartHeight - y(d.value))
      .attr("fill", "url(#blue-gradient)")
      .attr("rx", 4)
      .attr("ry", 4)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#3B82F6"); // Solid blue on hover
        tooltip.style("opacity", 1).html(`${d.label}: ${d.value}`);
      })
      .on("mousemove", (event) => {
        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        tooltip
          .style("left", `${mouseX + 10}px`)
          .style("top", `${mouseY - 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "url(#blue-gradient)");
        tooltip.style("opacity", 0);
      });

    // Add X Axis
    chart
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .attr("class", "axis-text")
      .style("text-anchor", "middle")
      .style("fill", "rgba(255, 255, 255, 0.7)")
      .style("font-size", "12px");

    // Add Y Axis
    chart
      .append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-chartWidth))
      .selectAll("text")
      .attr("class", "axis-text")
      .style("fill", "rgba(255, 255, 255, 0.7)")
      .style("font-size", "12px");

    // Style axis lines
    chart.selectAll(".domain").remove();
    chart.selectAll(".tick line").attr("stroke", "rgba(255, 255, 255, 0.1)");

    // Add title
    svg
      .append("text")
      .attr("class", "chart-title")
      .attr("text-anchor", "middle")
      .attr("x", dimensions.width / 2)
      .attr("y", margin.top / 2)
      .style("fill", "white")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(title);

    // Add tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("transition", "opacity 0.2s")
      .style("z-index", "10");
  }, [data, dimensions, title]);

  return (
    <Card className="w-full p-4 bg-background border-0">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: "200px", maxHeight: "400px" }}
      >
        {dimensions.width === 0 || dimensions.height === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
      </div>
    </Card>
  );
}
