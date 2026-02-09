import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAn_UXumzYZCtqZsag565S8fcvi7FCPxD0";
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
