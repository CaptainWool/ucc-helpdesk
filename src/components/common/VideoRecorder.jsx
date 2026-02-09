import React, { useEffect, useRef } from 'react';
import { Video, StopCircle, Play, Trash2, UploadCloud, X, Monitor } from 'lucide-react';
import { useScreenRecorder } from '../../hooks/useScreenRecorder';
import Button from './Button';
import './VideoRecorder.css';

const VideoRecorder = ({ onRecordingComplete, onCancel }) => {
    const { isRecording, mediaBlob, error, recordingTime, startRecording, stopRecording, clearRecording } = useScreenRecorder();
    const videoRef = useRef(null);

    useEffect(() => {
        if (mediaBlob && videoRef.current) {
            videoRef.current.src = URL.createObjectURL(mediaBlob);
        }
    }, [mediaBlob]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleUpload = () => {
        if (mediaBlob) {
            onRecordingComplete(mediaBlob);
        }
    };

    return (
        <div className="video-recorder-overlay">
            <div className="video-recorder-modal glass-morphism">
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <Monitor size={20} className="text-primary" />
                        <h3>Screen Recording</h3>
                    </div>
                    {isRecording && (
                        <div className="recording-status">
                            <div className="pulse-dot red"></div>
                            <span className="timer-text">{formatTime(recordingTime)}</span>
                        </div>
                    )}
                    <button className="close-btn" onClick={onCancel}><X size={20} /></button>
                </div>

                <div className="video-preview-area">
                    {mediaBlob ? (
                        <video ref={videoRef} controls className="preview-video" />
                    ) : isRecording ? (
                        <div className="recording-active-view">
                            <Monitor size={64} className="text-primary opacity-20" />
                            <div className="recording-info">
                                <h4>System is sharing screen...</h4>
                                <p>Navigate to the window you want to show.</p>
                                <div className="timer-large">{formatTime(recordingTime)}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="placeholder-preview">
                            <Monitor size={48} className="text-gray-300 mb-2" />
                            <p>Click "Start Recording" to share your screen</p>
                            <p className="text-xs text-gray-400">Perfect for showing bugs or errors</p>
                        </div>
                    )}
                </div>

                {error && <div className="error-message text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

                <div className="controls-area">
                    {!isRecording && !mediaBlob && (
                        <Button onClick={startRecording} variant="primary" size="lg">
                            <Video size={18} className="mr-2" /> Start Sharing Screen
                        </Button>
                    )}

                    {isRecording && (
                        <Button onClick={stopRecording} variant="danger" size="lg" className="stop-btn">
                            <StopCircle size={18} className="mr-2" /> Stop Recording
                        </Button>
                    )}

                    {mediaBlob && (
                        <div className="flex gap-3 w-full">
                            <Button onClick={clearRecording} variant="ghost" className="flex-1">
                                <Trash2 size={16} className="mr-2" /> Retake
                            </Button>
                            <Button onClick={handleUpload} variant="primary" className="flex-2">
                                <UploadCloud size={16} className="mr-2" /> Use This Recording
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoRecorder;
