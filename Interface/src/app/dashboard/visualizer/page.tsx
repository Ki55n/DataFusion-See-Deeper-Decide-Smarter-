"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  getVisualizations,
  updateVisualizationLayout,
  Visualization,
} from "@/db/visualizer";
import { Volume2, Square, Download } from "lucide-react";
import { UserAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Responsive, WidthProvider } from "react-grid-layout";
import dynamic from "next/dynamic";

// Dynamically import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Create a responsive grid layout component
const ResponsiveGridLayout = WidthProvider(Responsive);

// Dynamically import visualization components
const LineGraphTest = dynamic(
  () => import("@/components/visualization/LineGraphtest"),
  { ssr: false }
);
const PieChart = dynamic(() => import("@/components/visualization/PieChart"), {
  ssr: false,
});
const BarChart = dynamic(() => import("@/components/visualization/BarChart"), {
  ssr: false,
});
const GlobeComponent = dynamic(
  () => import("@/components/visualization/vGlobe"),
  { ssr: false }
);
const ScatterPlot = dynamic(
  () => import("@/components/visualization/ScatterPlot"),
  { ssr: false }
);

type Layout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Layouts = {
  [key: string]: Layout[];
};

export default function Dashboard() {
  const [layouts, setLayouts] = useState<Layouts>({ lg: [] });
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const [isResizable, setIsResizable] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading }: any = UserAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const userId = user?.uid;

  useEffect(() => {
    const fetchVisualizations = async () => {
      if (userId) {
        const fetchedVisualizations = await getVisualizations(userId);
        setVisualizations(fetchedVisualizations);

        const newLayouts: Layout[] = fetchedVisualizations.map((viz) => ({
          i: viz._id,
          x: viz.layout.x,
          y: viz.layout.y,
          w: viz.layout.w,
          h: viz.layout.h,
        }));
        setLayouts({ lg: newLayouts });
      }
    };

    fetchVisualizations();
  }, [userId]);

  const renderVisualization = (visualization: Visualization) => {
    switch (visualization.visualizationType) {
      case "horizontal_bar":
      case "bar":
        return <BarChart data={visualization.data} />;
      case "pie":
        return <PieChart data={visualization.data} />;
      case "line":
        return <LineGraphTest data={visualization.data} />;
      case "globe":
        return <GlobeComponent />;
      case "scatter":
        return <ScatterPlot data={visualization.data} />;
      default:
        return <div>Unsupported visualization type</div>;
    }
  };

  const handleEditLayout = () => {
    setIsEditing(true);
    setIsDraggable(true);
    setIsResizable(true);
  };

  const handleSaveLayout = async () => {
    setIsEditing(false);
    setIsDraggable(false);
    setIsResizable(false);

    const updates = layouts.lg.map((layout) => ({
      _id: layout.i,
      layout: {
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
      },
    }));

    const success = await updateVisualizationLayout(updates);
    if (success) {
      console.log("Layout updated successfully");
    } else {
      console.error("Failed to update layout");
    }
  };

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
  };

  const speakChartData = (id: string, description: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      } else {
        window.speechSynthesis.cancel();
        setSpeakingId(id);

        const utterance = new SpeechSynthesisUtterance(description);
        utterance.rate = 0.7;

        const setVoiceAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          const ziraVoice = voices.find((voice) =>
            voice.name.includes("English Female")
          );
          if (ziraVoice) {
            utterance.voice = ziraVoice;
          } else if (voices.length > 0) {
            utterance.voice = voices[0];
          }
          utterance.onend = () => setSpeakingId(null);
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
        } else {
          setVoiceAndSpeak();
        }
      }
    }
  };

  const handleDownload = (visualization: Visualization) => {
    // Create a new SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "800");
    svg.setAttribute("height", "600");

    // Create a white background
    const background = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "white");
    svg.appendChild(background);

    // Clone the chart SVG and append it to the new SVG
    const chartSvg = document.querySelector(`#chart-${visualization._id} svg`);
    if (chartSvg) {
      const clonedChart = chartSvg.cloneNode(true) as SVGElement;
      svg.appendChild(clonedChart);
    }

    // Convert text fill to black for better visibility on white background
    svg.querySelectorAll("text").forEach((textElement) => {
      textElement.style.fill = "black";
    });

    // Ensure axis lines are visible
    svg.querySelectorAll(".tick line").forEach((line) => {
      line.setAttribute("stroke", "rgba(0, 0, 0, 0.1)");
    });

    // Convert SVG to a string
    const svgData = new XMLSerializer().serializeToString(svg);

    // Create a Blob with the SVG data
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create and trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${visualization.fileName}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the object URL
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="p-4 bg-gray-900">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {isEditing ? (
          <Button onClick={handleSaveLayout}>Save Layout</Button>
        ) : (
          <Button onClick={handleEditLayout}>Edit Layout</Button>
        )}
      </div>
      {isClient && (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          onLayoutChange={handleLayoutChange}
          isDraggable={isDraggable}
          isResizable={isResizable}
        >
          {visualizations.map((visualization) => (
            <div
              key={visualization._id}
              className="bg-gray-800 p-4 rounded shadow"
            >
              <h2 className="text-lg font-bold mb-2">
                {visualization.fileName}
              </h2>
              <div className="absolute top-2 right-2 z-10 flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-gray-900"
                  onClick={() =>
                    speakChartData(visualization._id, visualization.summary)
                  }
                >
                  {speakingId === visualization._id ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {speakingId === visualization._id
                      ? "Stop speaking"
                      : "Speak chart data"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-gray-900"
                  onClick={() => handleDownload(visualization)}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download chart</span>
                </Button>
              </div>
              <div id={`chart-${visualization._id}`}>
                {renderVisualization(visualization)}
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
