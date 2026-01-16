const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
// Make sure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.summarizeComplaint = async (req, res) => {
  try {
    const { text } = req.body;
    console.log("🤖 AI Request received:", text);
    console.log("🔑 API Key present:", !!process.env.GEMINI_API_KEY);

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const prompt = `
      You are an AI assistant for a civic complaint system.
      Analyze the following structured report from a user:
      
      "${text}"

      Return a JSON object with exactly these fields:
      1. "summary": A short, professional summary for the admin (max 20 words).
      2. "issueType": One of ["water", "waste", "roads", "electricity", "others"]. Choose the best fit.
      3. "formattedDescription": A polite, well-structured version of the complaint suitable for official records. Combine the problem, location, duration, severity, safety concerns, and affected details into a coherent paragraph.
      4. "botReply": A short, empathetic reply to the user confirming you have received all details.

      Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.
    `;

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash",
      "gemini-pro"
    ];

    let textResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        textResponse = response.text();
        console.log(`✅ Success with model: ${modelName}`);
        break; // Stop if successful
      } catch (err) {
        console.warn(`⚠️ Failed with ${modelName}:`, err.message.split('\n')[0]);
        lastError = err;
      }
    }

    if (!textResponse) {
      throw lastError || new Error("All models failed");
    }

    // Clean up if model returns markdown code blocks
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(textResponse);

    res.status(200).json(data);
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message
    });
  }
};

exports.chat = async (req, res) => {
  try {
    const { history, currentInput } = req.body;
    console.log("🤖 Chat Request received:", currentInput);

    // Construct the prompt with conversation history
    let historyText = "";
    if (history && history.length > 0) {
      historyText = history.map(msg => `${msg.from === 'bot' ? 'Assistant' : 'User'}: ${msg.text}`).join("\n");
    }

    const prompt = `
      You are a helpful and empathetic Civic Assistant for a complaint reporting system.
      Your goal is to gather specific information from the user to create a structured complaint report.

      REQUIRED INFORMATION:
      1. Problem Description (What is the issue?)
      2. Location (Where is it?)
      3. Duration (How long has it been happening?)
      4. Severity (Low, Medium, High, Critical)
      5. Safety (Is there immediate danger?)
      6. Affected (Who/what is affected?)

      CURRENT CONVERSATION HISTORY:
      ${historyText}
      User: ${currentInput}

      INSTRUCTIONS:
      1. Analyze the user's latest input and the history.
      2. Extract any new information provided by the user.
      3. Determine what information is still missing from the REQUIRED INFORMATION list.
      4. If the user's input is OFF-TOPIC (not related to a civic issue or the ongoing report), politely guide them back to the report.
      5. If the user has provided all necessary information, mark the conversation as COMPLETED.
      6. Generate the next best question to ask the user. Do not ask for information that has already been provided. You can ask for multiple related things at once if it flows naturally, but keep it simple.
      7. Be conversational. Acknowledge what they said before asking the next question.

      RETURN JSON ONLY:
      {
        "nextMessage": "Your response to the user",
        "gatheredInfo": {
          "problem": "extracted problem or null",
          "location": "extracted location or null",
          "duration": "extracted duration or null",
          "severity": "extracted severity or null",
          "safety": "extracted safety or null",
          "affected": "extracted affected or null",
          "additional": "any extra info or null"
        },
        "missingFields": ["list", "of", "missing", "fields"],
        "offTopic": boolean,
        "completed": boolean
      }
    `;

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash",
      "gemini-pro"
    ];

    let textResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        textResponse = response.text();
        break;
      } catch (err) {
        console.warn(`⚠️ Failed with ${modelName}:`, err.message.split('\n')[0]);
        lastError = err;
      }
    }

    if (!textResponse) {
      throw lastError || new Error("All models failed");
    }

    // Clean up json
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(textResponse);

    res.status(200).json(data);

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message
    });
  }
};
