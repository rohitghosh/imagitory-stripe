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
