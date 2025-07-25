import { ChatState, ChatOption, IssueType } from "@/types/ChatTypes";

export class ChatLogic {
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
    // Handle toggle actions
    if (selection.startsWith("toggle_")) {
      return this.handleToggle(selection, context);
    }

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
          actionType: "update_text",
          state: "text_input" as ChatState,
        };

      case "scene_image_selection":
        const pageIndex = parseInt(selection);
        const imageKey = `page_${pageIndex}`;
        const regenerationCount =
          context.regenerationCounts?.get(imageKey) || 0;

        if (regenerationCount >= 1) {
          return {
            message:
              "You've already regenerated this image once. You can switch between the original and new version using the toggle below.",
            showImageToggle: true,
            pageIndex,
            options: [
              {
                id: "toggle_version",
                label: "Toggle to other version",
                value: `toggle_${pageIndex}`,
              },
              {
                id: "go_back",
                label: "Go back to main menu",
                value: "go_back",
              },
            ],
          };
        }
        return {
          message:
            "What would you like me to change about this image? Please describe what you'd like to see:",
          requiresTextInput: true,
          selectedPageIndex: pageIndex,
          actionType: "regenerate_scene",
          state: "feedback_input" as ChatState,
        };

      case "cover_issue_selection":
        if (selection === "visual") {
          const coverCount = context.regenerationCounts?.get("cover") || 0;
          if (coverCount >= 1) {
            return {
              message:
                "You've already regenerated the cover once. You can switch between versions using the toggle below.",
              showImageToggle: true,
              isCover: true,
              options: [
                {
                  id: "toggle_cover",
                  label: "Toggle to other version",
                  value: "toggle_cover",
                },
                {
                  id: "go_back",
                  label: "Go back to main menu",
                  value: "go_back",
                },
              ],
            };
          }
          return {
            message:
              "What would you like me to change about the cover image? Please describe your vision:",
            requiresTextInput: true,
            actionType: "regenerate_cover",
            state: "feedback_input" as ChatState,
          };
        } else if (selection === "title") {
          return {
            message:
              "What would you like the new title to be? Please type it below:",
            requiresTextInput: true,
            actionType: "regenerate_title",
            state: "feedback_input" as ChatState,
          };
        }
        break;

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
        { id: "go_back", label: "Start over", value: "start_over" },
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
        { id: "go_back", label: "Go back", value: "go_back" },
      ],
      state: "visual_type_selection" as ChatState,
    };
  }

  private getTextSceneSelection(pages: any[]) {
    // Filter out cover and back cover
    const scenePages = pages.filter((p) => !p.isCover && !p.isBackCover);

    const options: ChatOption[] = scenePages.map((page, index) => ({
      id: `text_scene_${index}`,
      label: `Scene ${index + 1}`,
      value: index.toString(),
      sceneText: page.content || "No text",
    }));

    options.push({ id: "go_back", label: "Go back", value: "go_back" });

    return {
      message:
        "Which scene text would you like to change? Here are all your scenes:",
      options,
      state: "text_scene_selection" as ChatState,
    };
  }

  private getSceneImageSelection(pages: any[]) {
    // Filter to get only scene pages (not cover or back cover)
    const scenePages = pages.filter((p) => !p.isCover && !p.isBackCover);

    const options: ChatOption[] = scenePages.map((page, index) => ({
      id: `scene_${index}`,
      label: `Scene ${index + 1}`,
      value: index.toString(),
      imageUrl: page.imageUrl || page.url,
      sceneText: page.content || "",
    }));

    options.push({ id: "go_back", label: "Go back", value: "go_back" });

    return {
      message: "Which scene image would you like to change?",
      options,
      state: "scene_image_selection" as ChatState,
    };
  }

  private getCoverIssueSelection() {
    return {
      message: "What about the cover would you like to change?",
      options: [
        { id: "cover_visual", label: "The cover image", value: "visual" },
        { id: "cover_title", label: "The book title", value: "title" },
        { id: "go_back", label: "Go back", value: "go_back" },
      ],
      state: "cover_issue_selection" as ChatState,
    };
  }

  private handleToggle(selection: string, context: any) {
    // This would trigger version toggle in the main app
    return {
      message:
        "I've toggled to the other version. What would you like to do next?",
      options: [
        { id: "more_yes", label: "Make more changes", value: "yes" },
        { id: "more_no", label: "Everything looks good", value: "no" },
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
        { id: "start_over", label: "Start over", value: "start_over" },
      ],
      state: "issue_type_selection" as ChatState,
    };
  }
}
