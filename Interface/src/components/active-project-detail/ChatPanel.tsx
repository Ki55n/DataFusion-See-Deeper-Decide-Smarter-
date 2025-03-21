import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BarChart from "@/components/visualization/BarChart";
import { saveVisualization } from "@/db/visualizer";
import { CreateVisualizationDTO } from "@/types";
import Component from "../visualization/PieChart";
import { UserAuth } from "@/app/context/AuthContext";
import LineGraphTest from "../visualization/LineGraphtest";
import D3ScatterPlot from "../visualization/ScatterPlot";
import Image from "next/image";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  visualization?: string;
  formatted_data_for_visualization?: any;
  summary?: any;
  sql_query?: string;
  user_query?: string;
}

interface FileItem {
  file_uuid: string;
  name: string;
  description: string | null | undefined;
  size: number;
  dateUploaded: Date;
}

interface ChatPanelProps {
  selectedFileIds: string[];
  files: FileItem[];
  project_uuid: string;
}

type SuggestionType = {
  id: number;
  name: string;
  icon: string;
};

const suggestions: SuggestionType[] = [
  {
    id: 1,
    name: "Summarize the data",
    icon: "/img/icon _leaf_.svg",
  },
  {
    id: 2,
    name: "What is the total number of rows in the data?",
    icon: "/img/icon _dumbell_.svg",
  },
  {
    id: 3,
    name: "What are the distinct values in the [column name] column of the data?",
    icon: "/img/icon _atom_.svg",
  },
  {
    id: 4,
    name: "Plot [column 1 name] vs [column 2 name]",
    icon: "/img/ferrari-logo.svg",
  },
];

export default function ChatPanel({
  selectedFileIds,
  files,
  project_uuid,
}: ChatPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showNoFileAlert, setShowNoFileAlert] = useState(false);

  const { user }: any = UserAuth();

  useEffect(() => {
    setShowSuggestions(chatMessages.length === 0);
  }, [chatMessages]);

  const sendMessage = async (message: string) => {
    if (selectedFileIds.length === 0) {
      setShowNoFileAlert(true);
      return;
    }

    setShowNoFileAlert(false);

    if (message.trim()) {
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "user",
        content: message,
      };
      setChatMessages((prev) => [...prev, newUserMessage]);
      setCurrentMessage("");
      setIsLoading(true);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AI_BACKEND_URL}/call-model`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              project_uuid: project_uuid,
              file_uuids: selectedFileIds,
              question: message,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log(data);

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          content:
            `${data.answer}\n\n` +
              `Generated SQL Query:\n` +
              `\`${data.sql_query}\`\n` ||
            "Sorry, I couldn't process that request.",
          visualization: data.visualization,
          formatted_data_for_visualization:
            data.formatted_data_for_visualization,
          summary: data.visualization_summary,
          user_query: message,
        };
        setChatMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          content: "Sorry, there was an error processing your request.",
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveVisualization = async (message: ChatMessage) => {
    if (
      message.visualization &&
      message.formatted_data_for_visualization &&
      selectedFileIds.length > 0
    ) {
      let data;
      switch (message.visualization) {
        case "horizontal_bar":
        case "bar":
          data = message.formatted_data_for_visualization.labels.map(
            (label: any, index: any) => ({
              label: label,
              value:
                message.formatted_data_for_visualization.values[0].data[index],
            })
          );
          break;
        case "pie":
          data = message.formatted_data_for_visualization.map((item: any) => ({
            label: item.labels,
            value: item.values,
          }));
          break;
        case "line":
        case "scatter":
          data = message.formatted_data_for_visualization;
          break;
        default:
          console.error("Unknown visualization type");
          return;
      }

      const visualizationData: CreateVisualizationDTO = {
        userId: user.uid,
        fileId: selectedFileIds[0],
        fileName: message.user_query || "Data Visualization",
        visualizationType: message.visualization,
        data: data,
        description: message.content,
        layout: {
          i: `viz-${Date.now()}`,
          x: 0,
          y: 0,
          w: 6,
          h: 4,
        },
        summary: message.summary,
      };

      const result = await saveVisualization(visualizationData);
      if (result) {
        console.log("Visualization saved successfully");
      } else {
        console.error("Failed to save visualization");
      }
    }
  };

  const renderVisualization = (message: ChatMessage) => {
    switch (message.visualization) {
      case "horizontal_bar":
      case "bar":
        return (
          <BarChart
            data={message.formatted_data_for_visualization.labels.map(
              (label: any, index: any) => ({
                label: label,
                value:
                  message.formatted_data_for_visualization.values[0].data[
                    index
                  ],
              })
            )}
          />
        );
      case "pie":
        return (
          <Component
            data={message.formatted_data_for_visualization.map((item: any) => ({
              label: item.labels,
              value: item.values,
            }))}
          />
        );
      case "line":
        return (
          <LineGraphTest data={message.formatted_data_for_visualization} />
        );
      case "scatter":
        return (
          <D3ScatterPlot data={message.formatted_data_for_visualization} />
        );
      default:
        return null;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  return (
    <div className="w-full md:w-[40%] flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white min-h-screen">
      <div className="p-4 flex justify-between items-center bg-transparent border-b border-purple-500/30">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          AI Chat
        </h2>
      </div>
      <ScrollArea className="flex-grow p-4">
        {showNoFileAlert && (
          <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a file before sending a message.
            </AlertDescription>
          </Alert>
        )}
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`mb-6 ${
              message.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-4 py-3 rounded-2xl ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300"
                  : "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-pink-300"
              } backdrop-blur-sm`}
              style={{
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                maxWidth: "85%",
              }}
            >
              {message.content}
            </div>
            {message.visualization && message.visualization !== "none" && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-purple-500/20">
                {renderVisualization(message)}
                <Button
                  onClick={() => handleSaveVisualization(message)}
                  className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/20 transition-all duration-300"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save to Visualizer
                </Button>
              </div>
            )}
          </div>
        ))}
      </ScrollArea>

      {showSuggestions && (
        <div>
          <div className="flex justify-center items-center p-2 mb-24">
            <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Chat With Data
            </span>
          </div>
          <div className="flex flex-wrap mx-auto items-center text-gray-100 font-bold px-4 justify-center gap-6 mb-4">
            {suggestions.map((item) => (
              <div
                className="flex h-[35px] cursor-pointer items-center justify-center gap-[5px] rounded-xl text-white border border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-6 py-10 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 hover:bg-gradient-to-r hover:from-purple-800/50 hover:to-blue-800/50"
                onClick={() => handleSuggestionClick(item.name)}
                key={item.id}
              >
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={18}
                  height={16}
                  className="w-[18px]"
                />
                <div className="flex">
                  <div className="text-sm font-light leading-[normal]">
                    {item.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-transparent border-t border-purple-500/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(currentMessage);
          }}
          className="flex space-x-2"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow bg-gray-800/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl backdrop-blur-sm"
            style={{
              boxShadow: "0 0 10px rgba(147, 51, 234, 0.1)",
            }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
