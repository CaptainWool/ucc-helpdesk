import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ChevronUp, ChevronDown, ShieldAlert } from 'lucide-react';
import { detectDarkPatterns } from '../../lib/compliance';
import './ResponseQualityIndicator.css';

export interface QualityAnalysis {
    score: number;
    empathyScore: number;
    clarityScore: number;
    isProfessional: boolean;
    darkPatternsDetected: string[];
    suggestions: string[];
}

interface ResponseQualityIndicatorProps {
    analysis?: QualityAnalysis | null;
    loading: boolean;
    draftText: string;
}

const ResponseQualityIndicator = ({ analysis, loading, draftText }: ResponseQualityIndicatorProps) => {
    const [expanded, setExpanded] = useState(false);

    // Quick local check even if AI hasn't responded or no analysis yet
    const localIssues = draftText ? detectDarkPatterns(draftText) : [];

    if (loading) {
        return (
            <div className="quality-indicator-loading">
                <Sparkles size={16} className="animate-pulse" />
                <span>Analyzing quality...</span>
            </div>
        );
    }

    if (!analysis && localIssues.length === 0) return null;

    // Merge or prioritize analysis
    const {
        score = 100,
        empathyScore = 0,
        clarityScore = 0,
        isProfessional = true,
        darkPatternsDetected = [],
        suggestions = []
    } = analysis || {};

    const combinedPatterns = [...new Set([...darkPatternsDetected, ...localIssues.map(p => p.name)])];
    const isGood = score >= 80 && combinedPatterns.length === 0;

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (s >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className={`quality-indicator ${expanded ? 'expanded' : ''}`}>
            <div
                className={`quality-header ${getScoreColor(score)}`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="score-circle">
                        <span>{score}</span>
                    </div>
                    <span className="font-medium text-sm">
                        {isGood ? 'Excellent Response' : 'Quality Check'}
                    </span>
                </div>

                {combinedPatterns.length > 0 && (
                    <div className="flex items-center text-xs text-red-600 font-bold gap-1 px-2 py-1 bg-red-100 rounded-full">
                        <AlertTriangle size={12} />
                        <span>Flagged</span>
                    </div>
                )}

                {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>

            {expanded && (
                <div className="quality-details bg-white border border-t-0 rounded-b-lg p-3 shadow-sm">
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div className="metric">
                            <span className="text-xs text-gray-500 block">Empathy</span>
                            <span className={`font-bold ${empathyScore >= 7 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {empathyScore}/10
                            </span>
                        </div>
                        <div className="metric">
                            <span className="text-xs text-gray-500 block">Clarity</span>
                            <span className={`font-bold ${clarityScore >= 7 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {clarityScore}/10
                            </span>
                        </div>
                        <div className="metric">
                            <span className="text-xs text-gray-500 block">Professional</span>
                            <span className={`font-bold ${isProfessional ? 'text-green-600' : 'text-red-600'}`}>
                                {isProfessional ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>

                    {suggestions && suggestions.length > 0 && (
                        <div className="suggestions mb-2">
                            <h5 className="text-xs font-bold text-gray-700 mb-1">Suggestions</h5>
                            <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                                {suggestions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {combinedPatterns.length > 0 && (
                        <div className="dark-patterns mt-2 bg-red-50 p-2 rounded border border-red-100">
                            <h5 className="text-xs font-bold text-red-700 flex items-center gap-1">
                                <ShieldAlert size={12} /> Ethical Design Warning
                            </h5>
                            <ul className="text-xs text-red-600 pl-4 list-disc">
                                {combinedPatterns.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                            <p className="text-[10px] text-red-500 mt-1">
                                Manipulation detected. Avoid pressuring or shaming students.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResponseQualityIndicator;
