import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";

// ======================================================
// CONFIGURATION
// ======================================================

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const API_URL = `${API_BASE}/api/chatbot/message`;

const STORAGE_KEY = "jayanthi_ai_chat_v1";

const MAX_HISTORY = 30;
const MAX_AI_CONTEXT = 10;
const MAX_MESSAGE_LENGTH = 1000;

const SUPPORTED_LANGUAGES = ["en", "ta", "si"];

const BOOKING_STATUSES = [
  "speciality_required",
  "date_required",
  "slot_selection",
];

// ======================================================
// LOCAL STORAGE HELPERS
// ======================================================

const getStorage = () => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
};

// ======================================================
// VALIDATE BOOKING CONTEXT
// ======================================================

const normalizeBookingContext = (context) => {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }

  if (!BOOKING_STATUSES.includes(context.status)) {
    return null;
  }

  return {
    status: context.status,

    speciality:
      typeof context.speciality === "string" ? context.speciality : null,

    date:
      typeof context.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(context.date)
        ? context.date
        : null,
  };
};

// ======================================================
// LOAD SAVED CHAT HISTORY
// ======================================================

const loadChatHistory = () => {
  try {
    const storage = getStorage();

    if (!storage) return null;

    const saved = storage.getItem(STORAGE_KEY);

    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const messages = Array.isArray(parsed.messages)
      ? parsed.messages
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string",
          )
          .slice(-MAX_HISTORY)
      : [];

    const language = SUPPORTED_LANGUAGES.includes(parsed.language)
      ? parsed.language
      : "en";

    return {
      messages,
      language,
      bookingContext: normalizeBookingContext(parsed.bookingContext),
    };
  } catch (error) {
    console.warn("Chatbot history loading failed:", error);

    return null;
  }
};

// ======================================================
// SAVE CHAT HISTORY
// ======================================================

export const saveChatHistory = (state) => {
  try {
    const storage = getStorage();

    if (!storage || !state?.chatbot) {
      return;
    }

    const chatbot = state.chatbot;

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: chatbot.messages.slice(-MAX_HISTORY),
        language: chatbot.language,
        bookingContext: chatbot.bookingContext,
      }),
    );
  } catch (error) {
    console.warn("Chatbot history saving failed:", error);
  }
};

// ======================================================
// INITIAL STATE
// ======================================================

const savedHistory = loadChatHistory();

const initialState = {
  messages: savedHistory?.messages || [],
  language: savedHistory?.language || "en",

  bookingContext: savedHistory?.bookingContext || null,

  loading: false,
  error: null,
  activeRequestId: null,
};

// ======================================================
// BUILD AI CONVERSATION HISTORY
// ======================================================

const buildAIHistory = (messages, currentMessageId) => {
  return messages
    .filter(
      (item) =>
        item.id !== currentMessageId &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-MAX_AI_CONTEXT)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
};

// ======================================================
// SEND CHAT MESSAGE
// ======================================================

export const sendChatMessage = createAsyncThunk(
  "chatbot/sendMessage",

  async (
    { message, language, messageId, bookingContext },
    { getState, rejectWithValue, signal },
  ) => {
    try {
      if (
        typeof message !== "string" ||
        !message.trim() ||
        message.length > MAX_MESSAGE_LENGTH
      ) {
        return rejectWithValue("Please enter a valid message.");
      }

      const state = getState();
      const chatbotState = state.chatbot;

      // The widget dispatches addUserMessage()
      // before sendChatMessage().
      // Exclude the current user message from history.

      const currentUserMessage =
        chatbotState.messages[chatbotState.messages.length - 1];

      const currentId =
        messageId ||
        (currentUserMessage?.role === "user" &&
        currentUserMessage.content === message
          ? currentUserMessage.id
          : null);

      const history = buildAIHistory(chatbotState.messages, currentId);

      const activeBookingContext =
        normalizeBookingContext(bookingContext) ||
        normalizeBookingContext(chatbotState.bookingContext);

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        signal,

        body: JSON.stringify({
          message: message.trim(),
          language,
          history,
          bookingContext: activeBookingContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.message || "Chatbot request failed.");
      }

      return {
        reply: data.reply,

        intent: data.intent || "general_chat",

        doctors: Array.isArray(data.doctors) ? data.doctors : [],

        booking: data.booking || null,

        language: SUPPORTED_LANGUAGES.includes(data.language)
          ? data.language
          : language,

        time: new Date().toISOString(),
      };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(error.message || "Unable to connect to chatbot.");
    }
  },

  {
    condition: (_, { getState }) => {
      const chatbotState = getState().chatbot;

      return !chatbotState?.loading;
    },
  },
);

// ======================================================
// CREATE CHATBOT SLICE
// ======================================================

const chatbotSlice = createSlice({
  name: "chatbot",

  initialState,

  reducers: {
    // --------------------------------------------------
    // ADD USER MESSAGE
    // --------------------------------------------------

    addUserMessage: {
      reducer: (state, action) => {
        state.messages.push(action.payload);

        state.messages = state.messages.slice(-MAX_HISTORY);

        state.error = null;
      },

      prepare: (content) => ({
        payload: {
          id: nanoid(),
          role: "user",
          content,
          doctors: [],
          time: new Date().toISOString(),
        },
      }),
    },

    // --------------------------------------------------
    // SET BOOKING CONTEXT
    // --------------------------------------------------

    setBookingContext: (state, action) => {
      state.bookingContext = normalizeBookingContext(action.payload);
    },

    // --------------------------------------------------
    // CLEAR BOOKING CONTEXT
    // --------------------------------------------------

    clearBookingContext: (state) => {
      state.bookingContext = null;
    },

    // --------------------------------------------------
    // RESET CHAT
    // --------------------------------------------------

    resetChat: (state) => {
      state.messages = [];
      state.bookingContext = null;
      state.loading = false;
      state.error = null;
      state.activeRequestId = null;
    },

    // --------------------------------------------------
    // SET LANGUAGE
    // --------------------------------------------------

    setChatLanguage: (state, action) => {
      const language = action.payload;

      if (SUPPORTED_LANGUAGES.includes(language)) {
        state.language = language;
      }
    },

    // --------------------------------------------------
    // CLEAR ERROR
    // --------------------------------------------------

    clearChatError: (state) => {
      state.error = null;
    },
  },

  // ====================================================
  // ASYNC THUNK STATES
  // ====================================================

  extraReducers: (builder) => {
    builder

      // ------------------------------------------------
      // PENDING
      // ------------------------------------------------

      .addCase(sendChatMessage.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeRequestId = action.meta.requestId;
      })

      // ------------------------------------------------
      // FULFILLED
      // ------------------------------------------------

      .addCase(sendChatMessage.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.activeRequestId = null;

        const booking = action.payload.booking;

        if (booking && BOOKING_STATUSES.includes(booking.status)) {
          state.bookingContext = normalizeBookingContext(booking);
        } else if (action.payload.intent !== "appointment_booking") {
          state.bookingContext = null;
        }

        state.messages.push({
          id: action.meta.requestId,
          role: "assistant",
          content: action.payload.reply,
          intent: action.payload.intent,
          doctors: action.payload.doctors,
          booking: action.payload.booking,
          language: action.payload.language,
          time: action.payload.time,
        });

        state.messages = state.messages.slice(-MAX_HISTORY);
      })

      // ------------------------------------------------
      // REJECTED
      // ------------------------------------------------

      .addCase(sendChatMessage.rejected, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.activeRequestId = null;

        if (action.meta.aborted) {
          return;
        }

        state.error =
          action.payload || action.error.message || "Something went wrong.";
      });
  },
});

// ======================================================
// EXPORT ACTIONS
// ======================================================

export const {
  addUserMessage,
  setBookingContext,
  clearBookingContext,
  resetChat,
  setChatLanguage,
  clearChatError,
} = chatbotSlice.actions;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default chatbotSlice.reducer;
