const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/summarize", aiController.summarizeComplaint);
router.post("/chat", aiController.chat);

module.exports = router;
