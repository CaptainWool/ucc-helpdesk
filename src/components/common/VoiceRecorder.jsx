import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, RefreshCcw, Sparkles, AlertCircle } from 'lucide-react';
import Button from './Button';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onTranscriptUpdate }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Your browser doesn't support voice recording. Please use Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
            onTranscriptUpdate(currentTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'network') {
                setError("Network failure: Voice transcription requires an active internet connection. Please check your signal.");
            } else if (event.error !== 'no-speech') {
                setError(`Error: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            if (isRecording) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (err) {
                        console.warn("Speech recognition restart failed:", err);
                    }
                }, 100);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setError(null);
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Start error:", err);
            }
        }
    };

    const resetTranscript = () => {
        setTranscript('');
        onTranscriptUpdate('');
    };

    return (
        <div className="voice-recorder-container">
            <div className={`recorder-visualizer ${isRecording ? 'recording' : ''}`}>
                <div className="mic-wrapper" onClick={toggleRecording}>
                    {isRecording ? <Square size={24} className="record-icon" /> : <Mic size={24} className="record-icon" />}
                    {isRecording && <div className="pulse-ring"></div>}
                </div>
                <div className="recorder-info">
                    <span className="recorder-status">
                        {isRecording ? 'Listening...' : 'Click to record issue'}
                    </span>
                    {transcript && (
                        <div className="transcript-preview">
                            <Sparkles size={14} className="ai-icon" />
                            <p>{transcript}</p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="recorder-error">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {transcript && !isRecording && (
                <div className="recorder-actions">
                    <Button variant="ghost" size="sm" onClick={resetTranscript}>
                        <RefreshCcw size={14} /> Reset
                    </Button>
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;
