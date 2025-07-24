export interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  options?: ChatOption[];
  metadata?: {
    selectedOption?: string;
    imageId?: string;
    pageIndex?: number;
    actionType?: "text_change" | "image_regeneration" | "title_change";
  };
}

export interface ChatOption {
  id: string;
  label: string;
  value: string;
  imageUrl?: string; // For image selection options
  sceneText?: string; // For text selection options
}

export interface ChatSession {
  messages: ChatMessage[];
  lastActive: Date;
  currentState: ChatState;
  regenerationTracking?: {
    [imageId: string]: number;
  };
}

export type ChatState =
  | "initial"
  | "issue_type_selection"
  | "text_scene_selection"
  | "text_input"
  | "visual_type_selection"
  | "scene_image_selection"
  | "cover_issue_selection"
  | "feedback_input"
  | "regenerating"
  | "show_result"
  | "ask_more_help"
  | "complete";

export type IssueType = "text" | "visual" | "cover_visual" | "cover_title";

export interface ChatContext {
  bookId: string;
  currentPath?: ChatState;
  selectedIssueType?: IssueType;
  selectedPageIndex?: number;
  selectedSceneId?: string;
  pendingAction?: {
    type: "regenerate_image" | "update_text" | "regenerate_title";
    data: any;
  };
}

export interface ChatBotResponse {
  message: string;
  options?: ChatOption[];
  showImageToggle?: boolean;
  showImages?: Array<{
    url: string;
    label: string;
    pageIndex: number;
  }>;
  requiresTextInput?: boolean;
  action?: "regenerate" | "complete" | "continue";
}
export class ChatLogic {
  private regenerationTracker: Map<string, number> = new Map();

  getInitialMessage() {
    return {
      message:
        "Hello! I'm here to help you perfect your book. Is there something you'd like to change?",
      options: [
        {
          id: "issue_yes",
          label: "Yes, something needs changing",
          value: "yes",
        },
        { id: "issue_no", label: "Everything looks good", value: "no" },
      ],
    };
  }

  processUserSelection(state: ChatState, selection: string, context?: any) {
    switch (state) {
      case "initial":
        if (selection === "yes") {
          return this.getIssueTypeSelection();
        } else {
          return this.getClosingMessage();
        }

      case "issue_type_selection":
        if (selection === "text") {
          return this.getTextSceneSelection(context.pages);
        } else if (selection === "visual") {
          return this.getVisualTypeSelection();
        }
        break;

      case "visual_type_selection":
        if (selection === "scene") {
          return this.getSceneImageSelection(context.pages);
        } else if (selection === "cover") {
          return this.getCoverIssueSelection();
        }
        break;

      case "text_scene_selection":
        return {
          message:
            "What would you like the text to say instead? Please type your new text below:",
          requiresTextInput: true,
          selectedPageIndex: parseInt(selection),
        };

      case "scene_image_selection":
        const pageIndex = parseInt(selection);
        if (!this.canRegenerate(context.bookId, `page_${pageIndex}`)) {
          return {
            message:
              "You've already regenerated this image once. You can switch between the original and new version using the toggle below.",
            showImageToggle: true,
            pageIndex,
          };
        }
        return {
          message:
            "What would you like me to change about this image? Please describe what you'd like to see:",
          requiresTextInput: true,
          selectedPageIndex: pageIndex,
          actionType: "regenerate_scene",
        };

      case "cover_issue_selection":
        if (selection === "visual") {
          if (!this.canRegenerate(context.bookId, "cover")) {
            return {
              message:
                "You've already regenerated the cover once. You can switch between versions using the toggle below.",
              showImageToggle: true,
              isCover: true,
            };
          }
          return {
            message:
              "What would you like me to change about the cover image? Please describe your vision:",
            requiresTextInput: true,
            actionType: "regenerate_cover",
          };
        } else if (selection === "title") {
          return {
            message:
              "What would you like the new title to be? Please type it below:",
            requiresTextInput: true,
            actionType: "regenerate_title",
          };
        }
        break;

      case "show_result":
        return this.getResultConfirmation();

      case "ask_more_help":
        if (selection === "yes") {
          return this.getIssueTypeSelection();
        } else {
          return this.getClosingMessage();
        }
    }

    return this.getErrorMessage();
  }

  private getIssueTypeSelection() {
    return {
      message: "What would you like to change?",
      options: [
        { id: "issue_text", label: "Scene text", value: "text" },
        { id: "issue_visual", label: "Image/Visual", value: "visual" },
      ],
      state: "issue_type_selection" as ChatState,
    };
  }

  private getVisualTypeSelection() {
    return {
      message: "Which visual would you like to change?",
      options: [
        { id: "visual_scene", label: "A scene image", value: "scene" },
        { id: "visual_cover", label: "The book cover", value: "cover" },
      ],
      state: "visual_type_selection" as ChatState,
    };
  }

  private getTextSceneSelection(pages: any[]) {
    const options: ChatOption[] = pages.map((page, index) => ({
      id: `text_scene_${index}`,
      label: `Scene ${index + 1}`,
      value: index.toString(),
      sceneText: page.content || "No text",
    }));

    return {
      message:
        "Which scene text would you like to change? Here are all your scenes:",
      options,
      state: "text_scene_selection" as ChatState,
    };
  }

  private getSceneImageSelection(pages: any[]) {
    const scenePages = pages.filter((p) => !p.isCover);
    const imageOptions = scenePages.map((page, index) => ({
      id: `scene_${index}`,
      label: `Scene ${index + 1}`,
      value: index.toString(),
      imageUrl: page.scene_image_url || page.url,
    }));

    return {
      message: "Which scene image would you like to change?",
      showImages: imageOptions,
      state: "scene_image_selection" as ChatState,
    };
  }

  private getCoverIssueSelection() {
    return {
      message: "What about the cover would you like to change?",
      options: [
        { id: "cover_visual", label: "The cover image", value: "visual" },
        { id: "cover_title", label: "The book title", value: "title" },
      ],
      state: "cover_issue_selection" as ChatState,
    };
  }

  private getResultConfirmation() {
    return {
      message:
        "Great! I've updated that for you. The new version is now displayed. Is there anything else you'd like to change?",
      options: [
        { id: "more_yes", label: "Yes, something else", value: "yes" },
        { id: "more_no", label: "No, everything looks good", value: "no" },
      ],
      state: "ask_more_help" as ChatState,
    };
  }

  private getClosingMessage() {
    return {
      message:
        "Perfect! Your book looks amazing. Feel free to reach out if you need any more help.",
      state: "complete" as ChatState,
    };
  }

  private getErrorMessage() {
    return {
      message:
        "I'm sorry, I didn't understand that. Let's try again. What would you like to change?",
      options: [
        { id: "retry_text", label: "Scene text", value: "text" },
        { id: "retry_visual", label: "Image/Visual", value: "visual" },
      ],
      state: "issue_type_selection" as ChatState,
    };
  }

  canRegenerate(bookId: string, imageId: string): boolean {
    const key = `${bookId}_${imageId}`;
    const count = this.regenerationTracker.get(key) || 0;
    return count < 1;
  }

  trackRegeneration(bookId: string, imageId: string) {
    const key = `${bookId}_${imageId}`;
    const currentCount = this.regenerationTracker.get(key) || 0;
    this.regenerationTracker.set(key, currentCount + 1);
  }

  resetTracker() {
    this.regenerationTracker.clear();
  }
}
