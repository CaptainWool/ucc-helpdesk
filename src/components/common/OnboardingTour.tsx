import React, { useState, useEffect, ReactNode } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, GraduationCap, Shield, MessageCircle, Send, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import './OnboardingTour.css';

interface Step {
    title: string;
    content: string;
    icon: ReactNode;
    target: string;
}

interface OnboardingTourProps {
    role?: 'student' | 'agent' | 'super_admin';
    onComplete?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ role = 'student', onComplete }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Steps configuration based on role
    const steps: Step[] = role === 'student' ? [
        {
            title: "Welcome to UCC CoDE Helpdesk!",
            content: "We're thrilled to have you here! This platform is your direct line to the College of Distance Education (CoDE) support team. Let's show you how to get the most out of it.",
            icon: <GraduationCap size={40} className="step-icon-main" />,
            target: ".dashboard-header"
        },
        {
            title: "Your Personal Dashboard",
            content: "Stay on top of your requests! These cards show you exactly how many tickets are open and how many we've successfully resolved for you.",
            icon: <Sparkles size={40} className="step-icon-main" />,
            target: ".stats-grid"
        },
        {
            title: "Need Assistance? Submit a Request",
            content: "Portal down? Fee clarification needed? Click this button to start a new support request. Our smart forms help you provide the right details for faster resolution.",
            icon: <Send size={40} className="step-icon-main" />,
            target: ".new-ticket-btn"
        },
        {
            title: "Real-time Support & Chat",
            content: "Every request you submit appears here. You can click 'View Details' to check status updates or chat directly with a coordinator in real-time!",
            icon: <MessageCircle size={40} className="step-icon-main" />,
            target: ".tickets-list-card"
        },
        {
            title: "Quick FAQ & Knowledge Base",
            content: "Got a common question? Our FAQ center is packed with instant answers. Check it out when you need quick help!",
            icon: <Shield size={40} className="step-icon-main" />,
            target: ".profile-card"
        },
        {
            title: "You're All Set!",
            content: "That's it! You're ready to use the helpdesk. Remember, our coordinators are just a ticket away if you need any help with your academic journey.",
            icon: <CheckCircle size={40} className="step-icon-main" />,
            target: ".dashboard-header"
        }
    ] : [
        {
            title: "Welcome, Coordinator!",
            content: "Thank you for your dedication to student success. This dashboard is your command center for managing inquiries and helping students resolve their concerns.",
            icon: <Shield size={40} className="step-icon-main" />,
            target: ".dashboard-header"
        },
        {
            title: "Efficient Queue Management",
            content: "View all incoming tickets here. Use the search bar to find students by ID or name, and filters to prioritize urgent academic or fee issues.",
            icon: <Sparkles size={40} className="step-icon-main" />,
            target: ".toolbar"
        },
        {
            title: "AI-Powered Insights",
            content: "Leverage our AI tools to automatically detect ticket sentiment and priority. Use the AI Smart Reply to generate professional responses in seconds!",
            icon: <Sparkles size={40} className="step-icon-main" />,
            target: ".tickets-list-card"
        },
        {
            title: "SLA & Response Tracking",
            content: "Keep track of response times with our visual SLA timers. Breached or critical tickets are highlighted so you never miss an important student concern.",
            icon: <Clock size={40} className="step-icon-main" />,
            target: ".tickets-table"
        },
        {
            title: "Smart Ticket Routing",
            content: "Manage the support team's expertise. Assign departments to agents for automatic, intelligent ticket routing based on issue type.",
            icon: <Shield size={40} className="step-icon-main" />,
            target: ".header-actions-container"
        }
    ];

    useEffect(() => {
        // Short delay to allow dashboard to render
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Remove previous highlights
        const highlighted = document.querySelectorAll('.tour-highlight');
        highlighted.forEach(el => el.classList.remove('tour-highlight'));

        if (isVisible && steps[currentStep]?.target) {
            const targetEl = document.querySelector(steps[currentStep].target);
            if (targetEl) {
                targetEl.classList.add('tour-highlight');
                // Scroll into view if needed
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                console.warn(`Tour target not found: ${steps[currentStep].target}`);
            }
        }
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsTransitioning(false);
            }, 300);
        } else {
            completeTour();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsTransitioning(false);
            }, 300);
        }
    };

    const completeTour = async () => {
        setIsVisible(false);
        try {
            if (user && profile) {
                await api.auth.updateUser(user.id, { has_completed_tour: true });
                if (refreshProfile) await refreshProfile();
            }
        } catch (error) {
            console.error('Error saving tour status:', error);
        }
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const currentStepData = steps[currentStep];

    return (
        <div className="tour-overlay fade-in">
            <div className="tour-modal glass-morphism">
                <button className="tour-close" onClick={completeTour} aria-label="Skip tour">
                    <X size={20} />
                </button>

                <div className="tour-progress">
                    {steps.map((_, i) => (
                        <div key={i} className={`progress-dot ${i <= currentStep ? 'active' : ''}`} />
                    ))}
                </div>

                <div className={`tour-body ${isTransitioning ? 'transition-out' : 'transition-in'}`}>
                    <div className="tour-icon-container">
                        {currentStepData.icon}
                    </div>
                    <h2>{currentStepData.title}</h2>
                    <p>{currentStepData.content}</p>
                </div>

                <div className="tour-footer">
                    <Button
                        variant="ghost"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="tour-btn-prev"
                    >
                        <ChevronLeft size={18} /> Prev
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="tour-btn-next"
                    >
                        {currentStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={18} />
                    </Button>
                </div>
            </div>

            {/* Target highlight logic simplified to a visual hint in this implementation */}
            <div className="tour-hint-glow" />
        </div>
    );
};

export default OnboardingTour;
