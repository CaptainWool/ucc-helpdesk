import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GENERATIVE_AI_KEY;
if (!API_KEY) {
    console.error('Missing API key: set VITE_GEMINI_API_KEY or GENERATIVE_AI_KEY in your .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of models) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`✅ Success with ${modelName}`);
            return; // Exit if one works
        } catch (e) {
            console.error(`❌ Failed with ${modelName}:`, e.message);
        }
    }
}

listModels();
