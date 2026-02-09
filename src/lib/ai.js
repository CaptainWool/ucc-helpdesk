import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// NOTE: Ideally this should be a backend call to hide the API key.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Debug log (non-sensitive)
if (API_KEY) {
    console.info(`Gemini API Key loaded: ${API_KEY.substring(0, 4)}... (Length: ${API_KEY.length})`);
} else {
    console.error("Gemini API Key NOT found in import.meta.env");
}

// Initialize securely - only if key exists
const genAI = (API_KEY && API_KEY !== 'undefined' && API_KEY.length > 5) ? new GoogleGenerativeAI(API_KEY) : null;

console.info("Gemini AI Initializing. Key detected:", !!genAI);

if (!genAI) {
    console.error("Gemini API initialization failed. VITE_GEMINI_API_KEY is missing or invalid.");
}

export const analyzeTicketAI = async (subject, description) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

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
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Analysis failed:", error);
        throw error;
    }
};

export const generateSmartReplyAI = async (ticket, messages) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are a helpful support agent for the University of Cape Coast (UCC).
            Draft a professional, empathetic, and concise reply to this student.
            
            Student: ${ticket.full_name}
            Issue: ${ticket.subject} - ${ticket.description}
            
            Recent Chat History:
            ${messages.map(m => `${m.sender_role || m.role}: ${m.content}`).join('\n')}
            
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

export const findDeflectionAI = async (subject, faqs) => {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are a helpful support bot for UCC. A student is typing a ticket.
            Based on the subject, find the most relevant FAQ from the list below.
            If a highly relevant FAQ exists, return it as a raw JSON object with no markdown.
            If no highly relevant FAQ exists, return exactly: null
            
            Subject: ${subject}
            
            FAQs:
            ${JSON.stringify(faqs)}
            
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

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Deflection failed:", error);
        return null;
    }
};

/**
 * AI-POWERED INTELLIGENCE FEATURES
 * Advanced features for next-generation helpdesk automation
 */

/**
 * Generate an executive summary of a ticket thread
 * Useful for long conversations or handoffs between coordinators
 */
export const summarizeTicketThread = async (ticket, messages) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are an AI assistant for UCC Helpdesk coordinators.
            Analyze this entire ticket thread and provide a comprehensive summary.
            
            Return a raw JSON object (no markdown) with this structure:
            {
                "executiveSummary": "2-3 sentence overview",
                "keyPoints": ["point1", "point2", "point3"],
                "currentStatus": "Current state of the issue",
                "suggestedNextSteps": ["action1", "action2"],
                "sentiment": "Overall student sentiment",
                "urgencyLevel": "Low | Medium | High | Critical"
            }
            
            === TICKET DETAILS ===
            Student: ${ticket.full_name}
            Category: ${ticket.type}
            Subject: ${ticket.subject}
            Description: ${ticket.description}
            Current Status: ${ticket.status}
            
            === CONVERSATION HISTORY ===
            ${messages.map(m => `[${m.sender_role || m.role}]: ${m.content}`).join('\n')}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Ticket summarization failed:", error);
        throw error;
    }
};

/**
 * Suggest smart responses based on similar resolved tickets
 * Uses historical data to recommend proven solutions
 */
export const suggestResponseFromHistory = async (currentTicket, historicalTickets, currentMessages) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Filter similar resolved tickets
        const similarTickets = historicalTickets
            .filter(t => t.status === 'Resolved' && t.type === currentTicket.type)
            .slice(0, 5);

        const prompt = `
            You are an intelligent assistant for UCC helpdesk coordinators.
            
            CURRENT TICKET:
            Student: ${currentTicket.full_name}
            Category: ${currentTicket.type}
            Issue: ${currentTicket.subject}
            Description: ${currentTicket.description}
            
            CONVERSATION SO FAR:
            ${currentMessages.map(m => `${m.sender_role}: ${m.content}`).join('\n')}
            
            SIMILAR RESOLVED TICKETS:
            ${similarTickets.map((t, i) => `
                ${i + 1}. ${t.subject}
                   Resolution: ${t.resolution_notes || 'Marked as resolved'}
            `).join('\n')}
            
            Based on the similar resolved tickets and current conversation:
            1. Return the 3 most relevant response suggestions
            2. Each suggestion should be professional, empathetic, and actionable
            3. Adapt the language to match UCC's tone
            
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
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Response suggestion failed:", error);
        throw error;
    }
};

/**
 * Analyze tone and suggest improvements for coordinator responses
 * Helps maintain professional and empathetic communication
 */
export const analyzeTone = async (messageText) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            You are a communication expert for UCC helpdesk.
            Analyze the tone of this message and suggest improvements if needed.
            
            MESSAGE:
            ${messageText}
            
            Return raw JSON (no markdown):
            {
                "currentTone": "Professional | Friendly | Empathetic | Frustrated | Neutral",
                "toneScore": 8.5,
                "isAppropriate": true,
                "suggestions": ["suggestion1", "suggestion2"],
                "improvedVersion": "Rewritten version if improvements needed, otherwise null",
                "flags": ["flag1 if any issues found"]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Tone analysis failed:", error);
        throw error;
    }
};

/**
 * Predict potential issues and generate proactive notifications
 * Analyzes patterns to prevent issues before they're reported
 */
export const generatePredictiveInsights = async (recentTickets, systemEvents = []) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Analyze ticket patterns
        const categoryBreakdown = recentTickets.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
        }, {});

        const prompt = `
            You are a predictive analytics AI for UCC helpdesk.
            Analyze recent patterns and predict potential issues.
            
            RECENT TICKETS (Last 7 days):
            Total: ${recentTickets.length}
            Category Breakdown: ${JSON.stringify(categoryBreakdown)}
            
            Recent Issues:
            ${recentTickets.slice(0, 10).map(t => `- ${t.type}: ${t.subject}`).join('\n')}
            
            SYSTEM EVENTS:
            ${systemEvents.length > 0 ? systemEvents.join('\n') : 'No system events logged'}
            
            Return raw JSON (no markdown):
            {
                "predictions": [
                    {
                        "issue": "Predicted issue description",
                        "probability": 0.85,
                        "category": "portal | fees | technical | other",
                        "recommendedAction": "What coordinators should do",
                        "proactiveMessage": "Message to send to students if relevant"
                    }
                ],
                "trends": [
                    {
                        "pattern": "Observed pattern",
                        "impact": "High | Medium | Low",
                        "recommendation": "Strategic recommendation"
                    }
                ],
                "alerts": ["alert1 if critical pattern detected"]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Predictive insights failed:", error);
        throw error;
    }
};

/**
 * Auto-complete responses as coordinators type
 * Real-time intelligent suggestions
 */
export const getSmartAutoComplete = async (partialMessage, ticketContext) => {
    if (!genAI) {
        return { suggestions: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Complete this partial message for a UCC helpdesk coordinator.
            Context: ${ticketContext.type} - ${ticketContext.subject}
            Partial message: "${partialMessage}"
            
            Provide 2-3 completion suggestions that are professional and helpful.
            Return raw JSON (no markdown):
            {
                "completions": ["completion1", "completion2", "completion3"]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Auto-complete failed:", error);
        return { completions: [] };
    }
};

/**
 * Extract action items from ticket conversations
 * Helps coordinators track what needs to be done
 */
export const extractActionItems = async (messages) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Extract all action items from this conversation thread.
            
            CONVERSATION:
            ${messages.map(m => `${m.sender_role}: ${m.content}`).join('\n')}
            
            Return raw JSON (no markdown):
            {
                "actionItems": [
                    {
                        "task": "Task description",
                        "assignedTo": "student | coordinator",
                        "priority": "High | Medium | Low",
                        "completed": false
                    }
                ]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Action item extraction failed:", error);
        throw error;
    }
};


/**
 * Analyzes the quality of a draft response
 * @param {string} draftMessage - The message being typed
 * @param {object} ticketContext - Context about the ticket (subject, description, etc.)
 * @returns {Promise<object>} Quality analysis with score and suggestions
 */
export const analyzeResponseQuality = async (draftMessage, ticketContext) => {
    if (!draftMessage || draftMessage.length < 10) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze this draft support response for quality, empathy, and professional standards.
            
            Ticket Context:
            Subject: ${ticketContext?.subject}
            Description: ${ticketContext?.description}
            
            Draft Response:
            "${draftMessage}"
            
            Evaluate for:
            1. Empathy (Is it understanding and kind?)
            2. Clarity (Is it easy to understand?)
            3. Professionalism (Is it appropriate?)
            4. Dark Patterns (Does it use manipulative language? e.g., guilt-tripping, false urgency)
            
            Return ONLY a JSON object:
            {
                "score": 0-100,
                "empathyScore": 0-10,
                "clarityScore": 0-10,
                "isProfessional": true/false,
                "darkPatternsDetected": ["pattern name" or empty],
                "suggestions": ["specific improvement 1", "specific improvement 2"],
                "reasoning": "brief explanation of score"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error analyzing response quality:", error);
        return {
            score: 0,
            suggestions: [],
            error: "Failed to analyze quality"
        };
    }
};
