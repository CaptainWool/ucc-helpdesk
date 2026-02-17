import React from 'react';
import { CheckCircle2, Circle, Clock, Loader2 } from 'lucide-react';
import './Timeline.css';

export interface TimelineStep {
    id: string;
    label: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming' | 'error';
    date?: string;
}

interface TimelineProps {
    steps: TimelineStep[];
}

const Timeline: React.FC<TimelineProps> = ({ steps }) => {
    return (
        <div className="timeline-container">
            {steps.map((step, index) => (
                <div key={step.id} className={`timeline-step ${step.status}`}>
                    <div className="step-indicator">
                        <div className="step-line"></div>
                        <div className="step-icon-wrapper">
                            {step.status === 'completed' && <CheckCircle2 size={24} className="step-icon" />}
                            {step.status === 'current' && <Loader2 size={24} className="step-icon animate-spin" />}
                            {step.status === 'upcoming' && <Circle size={24} className="step-icon" />}
                            {step.status === 'error' && <Clock size={24} className="step-icon" />}
                        </div>
                    </div>
                    <div className="step-content">
                        <div className="step-title">{step.label}</div>
                        {step.description && <div className="step-desc">{step.description}</div>}
                        {step.date && <div className="step-date">{step.date}</div>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
