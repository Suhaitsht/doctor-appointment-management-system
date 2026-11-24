"use strict";

const express = require("express");

const {
  sendChatMessage,
  handleSlotSelection,
} = require("../controllers/chatbotController");

const router = express.Router();

// Chatbot conversation
router.post("/message", sendChatMessage);

// Phase 2: Select a slot and prepare booking summary
router.post("/select-slot", handleSlotSelection);

// Keep your existing availability and free-slots
// routes here if they are already defined.

module.exports = router;
