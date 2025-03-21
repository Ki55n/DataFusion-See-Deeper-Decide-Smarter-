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

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  );
};

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
  id: string;
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

  const { user, dbUser }: any = UserAuth();

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

      // Add a temporary AI message with typing indicator
      const tempAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: "Thinking...",
      };
      setChatMessages((prev) => [...prev, tempAiMessage]);

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

        // Remove the temporary message
        setChatMessages((prev) => prev.filter(msg => msg.id !== tempAiMessage.id));

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
        // Remove the temporary message
        setChatMessages((prev) => prev.filter(msg => msg.id !== tempAiMessage.id));
        
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
      try {
        // Check if user exists
        if (!dbUser || !dbUser.id) {
          console.error("Database user not found");
          return;
        }

        // Find the file in the files array that matches the selectedFileIds[0]
        const selectedFile = files.find(file => file.file_uuid === selectedFileIds[0]);
        
        if (!selectedFile) {
          console.error("Selected file not found in database");
          return;
        }

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
          userId: dbUser.id,
          fileId: selectedFile.id,
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
      } catch (error) {
        console.error("Error saving visualization:", error);
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
    <div className="w-full md:w-[40%] flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 h-screen">
      <div className="p-4 flex justify-between items-center bg-transparent border-b border-gray-700">
        <h2 className="text-3xl font-bold text-gray-100">
          AI Chat
        </h2>
      </div>
      <ScrollArea className="flex-grow p-4 h-[calc(100vh-180px)]">
        {selectedFileIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-6">
              <Image
                src="/img/icon _leaf_.svg"
                alt="Select Files"
                width={64}
                height={64}
                className="mx-auto"
              />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-100">Select Files to Continue</h3>
            <p className="text-gray-400 max-w-md">
              Please select one or more files from the list to start analyzing your data. Once selected, you can ask questions about your data and get AI-powered insights.
            </p>
          </div>
        ) : (
          <>
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
                      ? "bg-gray-800 text-gray-100"
                      : "bg-gray-800 text-gray-100"
                  }`}
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.2)",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    maxWidth: "85%",
                  }}
                >
                  {message.content === "Thinking..." ? (
                    <div className="flex items-center space-x-2">
                      <span>Thinking</span>
                      <TypingIndicator />
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                {message.visualization && message.visualization !== "none" && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                    {renderVisualization(message)}
                    <Button
                      onClick={() => handleSaveVisualization(message)}
                      className="mt-4 bg-gray-700 hover:bg-gray-600 text-gray-100 shadow-lg hover:shadow-gray-500/20 transition-all duration-300"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save to Visualizer
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </ScrollArea>

      {selectedFileIds.length > 0 && showSuggestions && (
        <div className="p-4">
          <div className="flex flex-wrap mx-auto items-center text-gray-100 font-bold px-4 justify-center gap-6">
            {suggestions.map((item) => (
              <div
                className="flex h-[35px] cursor-pointer items-center justify-center gap-[5px] rounded-xl text-gray-100 border border-gray-700 bg-gray-800 px-6 py-10 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-gray-500/20 hover:bg-gray-700"
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

      <div className="p-4 bg-transparent border-t border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(currentMessage);
          }}
          className="flex space-x-2"
        >
          <Input
            type="text"
            placeholder={selectedFileIds.length === 0 ? "Select files to start chatting..." : "Type your message..."}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 rounded-xl"
            style={{
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }}
            disabled={isLoading || selectedFileIds.length === 0}
          />
          <Button
            type="submit"
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl shadow-lg hover:shadow-gray-500/20 transition-all duration-300"
            disabled={isLoading || selectedFileIds.length === 0}
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
