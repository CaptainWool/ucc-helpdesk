import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket, Message, FAQ } from "../types";

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize securely - only if key exists
const genAI = (API_KEY && API_KEY !== 'undefined' && API_KEY.length > 5) ? new GoogleGenerativeAI(API_KEY) : null;

export interface AIAnalysis {
    sentiment: 'Positive' | 'Neutral' | 'Frustrated' | 'Urgent';
    priority: 'Low' | 'Medium' | 'High';
    summary: string;
}

export interface DeflectionResult {
    question: string;
    answer: string;
    confidence: number;
}

export interface SummaryResult {
    executiveSummary: string;
    keyPoints: string[];
    currentStatus: string;
    suggestedNextSteps: string[];
    sentiment: string;
    urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface Suggestion {
    responseText: string;
    confidence: number;
    reasoning: string;
    tone: 'Professional' | 'Empathetic' | 'Direct';
}

export interface SuggestionsResult {
    suggestions: Suggestion[];
    relatedKnowledge: string[];
}

export interface ToneAnalysisResult {
    currentTone: string;
    toneScore: number;
    isAppropriate: boolean;
    suggestions: string[];
    improvedVersion: string | null;
    flags: string[];
}

export interface Prediction {
    issue: string;
    probability: number;
    category: 'portal' | 'fees' | 'technical' | 'other';
    recommendedAction: string;
    proactiveMessage: string;
}

export interface Trend {
    pattern: string;
    impact: 'High' | 'Medium' | 'Low';
    recommendation: string;
}

export interface PredictiveInsightsResult {
    predictions: Prediction[];
    trends: Trend[];
    alerts: string[];
}

export interface AutoCompleteResult {
    completions: string[];
}

export interface ActionItem {
    task: string;
    assignedTo: 'student' | 'coordinator';
    priority: 'High' | 'Medium' | 'Low';
    completed: boolean;
}

export interface ActionItemsResult {
    actionItems: ActionItem[];
}

export interface QualityAnalysisResult {
    score: number;
    empathyScore: number;
    clarityScore: number;
    isProfessional: boolean;
    darkPatternsDetected: string[];
    suggestions: string[];
    reasoning: string;
}

const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeTicketAI = async (subject: string, description: string): Promise<AIAnalysis> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Analyze this support ticket and return a raw JSON object with no markdown formatting.
            Structure:
            {
                "sentiment": "Positive" | "Neutral" | "Frustrated" | "Urgent",
                "priority": "Low" | "Medium" | "High",
                "summary": "One sentence summary"
            }

            Subject: ${subject}
            Description: ${description}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("AI Analysis failed:", error);
        throw error;
    }
};

export const generateSmartReplyAI = async (ticket: Ticket, messages: Message[]): Promise<string> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are a helpful support agent for the University of Cape Coast (UCC).
            Draft a professional, empathetic, and concise reply to this student.
            
            Student: ${ticket.full_name}
            Issue: ${ticket.subject} - ${ticket.description}
            
            Recent Chat History:
            ${messages.map(m => `${m.sender_role || 'user'}: ${m.content}`).join('\n')}
            
            Draft Reply:
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Smart Reply failed:", error);
        throw error;
    }
};

export const findDeflectionAI = async (subject: string, faqs: FAQ[]): Promise<DeflectionResult | null> => {
    if (!genAI || !subject.trim()) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are a helpful support bot for UCC. A student is typing a ticket.
            Based on the subject, find the most relevant FAQ from the list below.
            If a highly relevant FAQ exists (confidence > 0.7), return it as a raw JSON object with no markdown.
            If no highly relevant FAQ exists, return exactly: null
            
            Subject: ${subject}
            
            FAQs:
            ${JSON.stringify(faqs.map(f => ({ question: f.question, answer: f.answer })))}
            
            Return format:
            {
                "question": "...",
                "answer": "...",
                "confidence": 0.95
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        if (text === 'null') return null;

        return JSON.parse(cleanJson(text));
    } catch (error) {
        console.error("AI Deflection failed:", error);
        return null;
    }
};

export const summarizeTicketThread = async (ticket: Ticket, messages: Message[]): Promise<SummaryResult> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are an AI assistant for UCC Helpdesk coordinators.
            Analyze this entire ticket thread and provide a comprehensive summary.
            
            Return a raw JSON object (no markdown):
            {
                "executiveSummary": "2-3 sentence overview",
                "keyPoints": ["point1", "point2", "point3"],
                "currentStatus": "Current state of the issue",
                "suggestedNextSteps": ["action1", "action2"],
                "sentiment": "Overall student sentiment",
                "urgencyLevel": "Low | Medium | High | Critical"
            }
            
            Student: ${ticket.full_name}
            Subject: ${ticket.subject}
            Description: ${ticket.description}
            
            Messages:
            ${messages.map(m => `[${m.sender_role || 'user'}]: ${m.content}`).join('\n')}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("Ticket summarization failed:", error);
        throw error;
    }
};

export const suggestResponseFromHistory = async (currentTicket: Ticket, historicalTickets: Ticket[], currentMessages: Message[]): Promise<SuggestionsResult> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const similarTickets = historicalTickets
            .filter(t => t.status === 'Resolved' && t.type === currentTicket.type)
            .slice(0, 5);

        const prompt = `
            Suggest professional responses based on UCC helpdesk history.
            Current Ticket: ${currentTicket.subject}
            Category: ${currentTicket.type}
            
            Similar Resolutions:
            ${similarTickets.map(t => `- ${t.subject}: ${t.resolved_at}`).join('\n')}
            
            Return raw JSON (no markdown):
            {
                "suggestions": [
                    {
                        "responseText": "Full response text",
                        "confidence": 0.95,
                        "reasoning": "Why this response is suggested",
                        "tone": "Professional | Empathetic | Direct"
                    }
                ],
                "relatedKnowledge": ["tip1", "tip2"]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("Response suggestion failed:", error);
        throw error;
    }
};

export const analyzeTone = async (messageText: string): Promise<ToneAnalysisResult> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Analyze tone of this message for UCC helpdesk.
            Message: ${messageText}
            
            Return raw JSON (no markdown):
            {
                "currentTone": "Professional | Friendly | Empathetic | Frustrated | Neutral",
                "toneScore": 8.5,
                "isAppropriate": true,
                "suggestions": ["suggestion1", "suggestion2"],
                "improvedVersion": "Rewritten version or null",
                "flags": []
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("Tone analysis failed:", error);
        throw error;
    }
};

export const generatePredictiveInsights = async (recentTickets: Ticket[]): Promise<PredictiveInsightsResult> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Analyze these tickets and predict issues.
            Tickets: ${recentTickets.length}
            
            Return raw JSON (no markdown):
            {
                "predictions": [{ "issue": "...", "probability": 0.8, "category": "fees", "recommendedAction": "...", "proactiveMessage": "..." }],
                "trends": [{ "pattern": "...", "impact": "High", "recommendation": "..." }],
                "alerts": []
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("Predictive insights failed:", error);
        throw error;
    }
};

export const extractActionItems = async (messages: Message[]): Promise<ActionItemsResult> => {
    if (!genAI) throw new Error("Gemini API Key is missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Extract action items from this conversation.
            ${messages.map(m => `${m.sender_role || 'user'}: ${m.content}`).join('\n')}
            
            Return raw JSON (no markdown):
            {
                "actionItems": [{ "task": "...", "assignedTo": "student", "priority": "Medium", "completed": false }]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("Action extraction failed:", error);
        throw error;
    }
};

export const analyzeResponseQuality = async (draftMessage: string, ticketContext: Partial<Ticket>): Promise<QualityAnalysisResult | null> => {
    if (!genAI || draftMessage.length < 10) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Analyze response quality.
            Draft: ${draftMessage}
            Context: ${ticketContext.subject}
            
            Return raw JSON (no markdown):
            {
                "score": 85,
                "empathyScore": 8,
                "clarityScore": 9,
                "isProfessional": true,
                "darkPatternsDetected": [],
                "suggestions": ["..."],
                "reasoning": "..."
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJson(response.text()));
    } catch (error) {
        console.error("Quality analysis failed:", error);
        return null;
    }
};
