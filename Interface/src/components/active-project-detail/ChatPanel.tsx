import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, AlertCircle } from "lucide-react";
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

interface ChatPanelProps {
  selectedFileIds: string[];
  files: any[];
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
    <div className="w-full md:w-[40%] flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white min-h-screen">
      <div className="p-4 flex justify-between items-center bg-transparent">
        <h2 className="text-3xl font-bold" style={{ color: "#0ff" }}>
          AI Chat
        </h2>
      </div>
      <ScrollArea className="flex-grow p-4">
        {showNoFileAlert && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a file before sending a message.
            </AlertDescription>
          </Alert>
        )}
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? "bg-gray-800 text-cyan-400"
                  : "bg-gray-800 text-pink-400"
              }`}
              style={{
                border: "1px solid currentColor",
                boxShadow: "0 0 10px currentColor",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                maxWidth: "80%",
              }}
            >
              {message.content}
            </div>
            {message.visualization && (
              <div className="mt-2">
                {renderVisualization(message)}
                <Button
                  onClick={() => handleSaveVisualization(message)}
                  className="mt-2 bg-green-600 hover:bg-green-700"
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
          <div className="flex justify-center items-center p-2 mb-24 font-bold">
            <span className=" text-6xl">Chat With Data</span>
          </div>
          <div className="flex flex-wrap mx-auto items-center text-gray-100 font-bold px-4 justify-center gap-6 mb-4">
            {suggestions.map((item) => (
              <div
                className="flex h-[35px] cursor-pointer items-center justify-center gap-[5px] rounded-lg text-white border border-gray-600 bg-gray-800 px-6 py-10 shadow-sm transition-colors hover:bg-gray-100 hover:text-black"
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

      <div className="p-4 bg-transparent">
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
            className="flex-grow bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-0"
            style={{
              boxShadow: "0 0 5px cyan",
              borderColor: "#0ff",
              color: "#fff",
            }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-white"
            style={{ boxShadow: "0 0 10px #0ff" }}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
