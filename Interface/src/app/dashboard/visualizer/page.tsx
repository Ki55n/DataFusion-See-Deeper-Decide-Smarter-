"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  getVisualizations,
  updateLayouts,
  Visualization,
} from "@/db/visualizer";
import { Volume2, Square, Download } from "lucide-react";
import { UserAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Responsive, WidthProvider } from "react-grid-layout";
import dynamic from "next/dynamic";
import { LoadingScreen, LoadingCard } from "@/components/ui/loading";

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
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(true);
        try {
          const fetchedVisualizations = await getVisualizations(userId);
          setVisualizations(fetchedVisualizations);

          const newLayouts: Layout[] = fetchedVisualizations.map((viz) => ({
            i: viz.id,
            x: viz.layout.x,
            y: viz.layout.y,
            w: viz.layout.w,
            h: viz.layout.h,
          }));
          setLayouts({ lg: newLayouts });
        } catch (error) {
          console.error("Error fetching visualizations:", error);
        } finally {
          setIsLoading(false);
        }
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
      id: layout.i,
      layout: {
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
      },
    }));

    const success = await updateLayouts(updates);
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
          utterance.voice = ziraVoice || voices[0];

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
    const chartSvg = document.querySelector(`#chart-${visualization.id} svg`);
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

  if (!isClient) return null;
  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[2000px] mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                AI Data Analysis Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Visualizing insights through advanced analytics
              </p>
            </div>
            <div className="flex gap-4">
              {isEditing ? (
                <Button 
                  onClick={handleSaveLayout}
                  className="bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 transition-all duration-200"
                >
                  Save Layout
                </Button>
              ) : (
                <Button 
                  onClick={handleEditLayout}
                  className="bg-gradient-to-r from-blue-500 to-purple-700 hover:from-blue-600 hover:to-purple-800 transition-all duration-200"
                >
                  Edit Layout
                </Button>
              )}
            </div>
          </div>
        </div>

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          onLayoutChange={handleLayoutChange}
          isDraggable={isDraggable}
          isResizable={isResizable}
          margin={[20, 20]}
        >
          {visualizations.map((visualization) => (
            <div
              key={visualization.id}
              className="group transition-all duration-200 bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 border border-gray-700/50"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
                    {visualization.fileName}
                  </h2>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-700/50 transition-colors"
                      onClick={() =>
                        speakChartData(visualization.id, visualization.summary || "")
                      }
                    >
                      {speakingId === visualization.id ? (
                        <Square className="h-4 w-4 text-red-400" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleDownload(visualization)}
                    >
                      <Download className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                    </Button>
                  </div>
                </div>
                <div id={`chart-${visualization.id}`} className="transition-all duration-200">
                  {renderVisualization(visualization)}
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
