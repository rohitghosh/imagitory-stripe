import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Adjust import path
import { ChatMessage, ChatSession, ChatState } from "@/utils/ChatLogic";

export async function initializeChatSession(
  userId: string,
  bookId: string,
): Promise<ChatSession | null> {
  try {
    const chatRef = doc(db, "chatSessions", userId, "books", bookId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      return chatDoc.data() as ChatSession;
    }

    // Create new session
    const newSession: ChatSession = {
      messages: [],
      lastActive: new Date(),
      currentState: "initial",
    };

    await setDoc(chatRef, {
      ...newSession,
      lastActive: serverTimestamp(),
    });

    return newSession;
  } catch (error) {
    console.error("Error initializing chat session:", error);
    return null;
  }
}

export async function saveChatMessage(
  userId: string,
  bookId: string,
  message: ChatMessage,
): Promise<void> {
  try {
    const chatRef = doc(db, "chatSessions", userId, "books", bookId);

    await updateDoc(chatRef, {
      messages: arrayUnion({
        ...message,
        timestamp: serverTimestamp(),
      }),
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving chat message:", error);
    // If document doesn't exist, create it
    if (error.code === "not-found") {
      await setDoc(doc(db, "chatSessions", userId, "books", bookId), {
        messages: [message],
        lastActive: serverTimestamp(),
        currentState: "initial",
      });
    }
  }
}

export async function updateChatState(
  userId: string,
  bookId: string,
  state: ChatState,
): Promise<void> {
  try {
    const chatRef = doc(db, "chatSessions", userId, "books", bookId);

    await updateDoc(chatRef, {
      currentState: state,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating chat state:", error);
  }
}

export async function getChatHistory(
  userId: string,
  bookId: string,
): Promise<ChatSession | null> {
  try {
    const chatRef = doc(db, "chatSessions", userId, "books", bookId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      const data = chatDoc.data();
      // Convert Firestore timestamps to Date objects
      return {
        ...data,
        messages: data.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date(),
        })),
        lastActive: data.lastActive?.toDate() || new Date(),
      } as ChatSession;
    }

    return null;
  } catch (error) {
    console.error("Error getting chat history:", error);
    return null;
  }
}

export async function trackRegeneration(
  userId: string,
  bookId: string,
  imageId: string,
): Promise<void> {
  try {
    const chatRef = doc(db, "chatSessions", userId, "books", bookId);

    await updateDoc(chatRef, {
      [`regenerationTracking.${imageId}`]: 1,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking regeneration:", error);
  }
}

export async function getRegenerationCount(
  userId: string,
  bookId: string,
  imageId: string,
): Promise<number> {
  try {
    const chatRef = doc(db, "chatSessions", userId, "books", bookId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      const data = chatDoc.data();
      return data.regenerationTracking?.[imageId] || 0;
    }

    return 0;
  } catch (error) {
    console.error("Error getting regeneration count:", error);
    return 0;
  }
}
