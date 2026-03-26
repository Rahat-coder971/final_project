const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateRoadmap = async (topic, goal, duration) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Create a comprehensive learning roadmap for "${topic}" with a goal of "${goal}".
      Structure this as a "Mastery Path" with 3-5 major Milestones.
      
      Return the response ONLY as a JSON object with this exact structure:
      {
        "title": "Mastery Path for ${topic}",
        "milestones": [
          {
            "title": "Milestone 1: Foundations",
            "description": "Brief description of this stage",
            "sections": [
              {
                "title": "Section 1.1: Basics",
                "chapters": [
                  { "title": "Chapter 1: Intro", "resources": [{ "title": "Docs", "url": "https://..." }] },
                  { "title": "Chapter 2: Setup", "resources": [] }
                ],
                "quiz": {
                  "questions": [
                    {
                      "question": "What is X?",
                      "options": ["A", "B", "C", "D"],
                      "correctAnswer": 0
                    },
                     {
                      "question": "How do you Y?",
                      "options": ["A", "B", "C", "D"],
                      "correctAnswer": 1
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
      Do not include any markdown formatting (like \`\`\`json), just the raw JSON string.
      Ensure each quiz has at least 3 questions.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown code blocks if Gemini adds them despite instructions
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error('Failed to generate roadmap');
  }
};

const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

// Initialize LangChain Gemini Chat Model
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  maxOutputTokens: 2048,
  apiKey: process.env.GEMINI_API_KEY,
});

const summarizeVideo = async (transcriptText) => {
  try {
    const response = await chatModel.invoke([
      new SystemMessage("You are an expert educational AI assistant. Your goal is to summarize video transcripts concisely."),
      new HumanMessage(`
        Summarize the following YouTube video transcript in a concise, bulleted format. 
        Highlight the key takeaways and actionable insights.
        
        Transcript:
        "${transcriptText.substring(0, 30000)}" 
        (Truncated if too long)
      `),
    ]);

    return response.content;
  } catch (error) {
    console.error("LangChain Summary Error:", error);
    throw new Error("Failed to summarize video");
  }
};

module.exports = { generateRoadmap, summarizeVideo };
