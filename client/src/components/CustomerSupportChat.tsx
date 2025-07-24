import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Image as ImageIcon, Type } from "lucide-react";
import {
  ChatLogic,
  ChatMessage,
  ChatState,
  ChatOption,
} from "@/utils/ChatLogic";
import { useImageVersioning } from "@/hooks/useImageVersioning";
import { saveChatMessage, getChatHistory } from "@/components/chatFirebase";

interface CustomerSupportChatProps {
  bookId: string;
  bookData: any; // Your book type
  userId: string;
  onImageUpdate?: () => void;
}

export const CustomerSupportChat: React.FC<CustomerSupportChatProps> = ({
  bookId,
  bookData,
  userId,
  onImageUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentState, setCurrentState] = useState<ChatState>("initial");
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState<any>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatLogic = useRef(new ChatLogic());
  const { regenerateImage, toggleImageVersion, canRegenerate } =
    useImageVersioning();

  // Initialize chat
  useEffect(() => {
    initializeChat();
  }, [bookId, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = async () => {
    try {
      const history = await getChatHistory(userId, bookId);
      if (history && history.messages.length > 0) {
        setMessages(history.messages);
        setCurrentState(history.currentState || "initial");
      } else {
        const initial = chatLogic.current.getInitialMessage();
        const initialMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "bot",
          content: initial.message,
          timestamp: new Date(),
          options: initial.options,
        };
        setMessages([initialMessage]);
        await saveChatMessage(userId, bookId, initialMessage);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  const handleOptionClick = async (option: ChatOption) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: option.label,
      timestamp: new Date(),
      metadata: { selectedOption: option.value },
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveChatMessage(userId, bookId, userMessage);

    // Process selection
    processUserSelection(option.value);
  };

  const handleTextSubmit = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    await saveChatMessage(userId, bookId, userMessage);

    // Handle based on current context
    if (selectedContext.actionType === "regenerate_scene") {
      await handleImageRegeneration(
        selectedContext.selectedPageIndex,
        userInput,
      );
    } else if (selectedContext.actionType === "regenerate_cover") {
      await handleCoverRegeneration(userInput);
    } else if (selectedContext.actionType === "regenerate_title") {
      await handleTitleRegeneration(userInput);
    } else if (currentState === "text_scene_selection") {
      await handleTextUpdate(selectedContext.selectedPageIndex, userInput);
    }
  };

  const processUserSelection = async (selection: string) => {
    const context = {
      bookId,
      pages: bookData.pages,
      cover: bookData.cover,
      ...selectedContext,
    };

    const response = chatLogic.current.processUserSelection(
      currentState,
      selection,
      context,
    );

    if (response.state) {
      setCurrentState(response.state);
    }

    if (response.selectedPageIndex !== undefined) {
      setSelectedContext((prev) => ({
        ...prev,
        selectedPageIndex: response.selectedPageIndex,
      }));
    }

    if (response.actionType) {
      setSelectedContext((prev) => ({
        ...prev,
        actionType: response.actionType,
      }));
    }

    // Add bot response
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: response.message,
      timestamp: new Date(),
      options: response.options,
    };

    setMessages((prev) => [...prev, botMessage]);
    await saveChatMessage(userId, bookId, botMessage);
  };

  const handleImageRegeneration = async (
    pageIndex: number,
    feedback: string,
  ) => {
    setIsLoading(true);
    try {
      await regenerateImage({
        bookId,
        pageIndex,
        revisedPrompt: feedback,
      });

      chatLogic.current.trackRegeneration(bookId, `page_${pageIndex}`);
      onImageUpdate?.();

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "bot",
        content:
          "Perfect! I've updated the image based on your feedback. You can toggle between the original and new version anytime.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, successMessage]);
      await saveChatMessage(userId, bookId, successMessage);

      // Ask if more help needed
      setTimeout(() => {
        processUserSelection("continue");
      }, 1000);
    } catch (error) {
      console.error("Error regenerating image:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverRegeneration = async (feedback: string) => {
    setIsLoading(true);
    try {
      await regenerateImage({
        bookId,
        revisedPrompt: feedback,
        isCover: true,
      });

      chatLogic.current.trackRegeneration(bookId, "cover");
      onImageUpdate?.();

      // Success handling similar to above
    } catch (error) {
      console.error("Error regenerating cover:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleRegeneration = async (newTitle: string) => {
    setIsLoading(true);
    try {
      await regenerateImage({
        bookId,
        isCover: true,
        revisedPrompt: "",
        newTitle,
      });

      onImageUpdate?.();
      // Success handling
    } catch (error) {
      console.error("Error regenerating title:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextUpdate = async (pageIndex: number, newText: string) => {
    // Implement text update logic
    // This would update the scene text in Firebase
    console.log("Update text for page", pageIndex, "to:", newText);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === "user";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[80%] ${
            isUser
              ? "bg-black text-white rounded-l-2xl rounded-tr-2xl"
              : "bg-gray-100 text-gray-800 rounded-r-2xl rounded-tl-2xl"
          } px-4 py-3`}
        >
          <p className="text-sm">{message.content}</p>

          {/* Render options if bot message */}
          {!isUser && message.options && (
            <div className="mt-3 space-y-2">
              {message.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="block w-full text-left px-3 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm transition-colors border border-gray-200"
                >
                  {option.imageUrl ? (
                    <div className="flex items-center space-x-2">
                      <img
                        src={option.imageUrl}
                        alt={option.label}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <span>{option.label}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.sceneText && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {option.sceneText}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {(messages[messages.length - 1]?.requiresTextInput ||
        (messages[messages.length - 1]?.type === "bot" &&
          messages[messages.length - 1]?.content.includes("type"))) && (
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTextSubmit();
            }}
            className="flex space-x-2"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isLoading}
              className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
