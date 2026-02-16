import { useState, useRef, useCallback } from 'react';

export interface ScreenRecorderHook {
    isRecording: boolean;
    mediaBlob: Blob | null;
    error: string | null;
    recordingTime: number;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearRecording: () => void;
}

export const useScreenRecorder = (): ScreenRecorderHook => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setRecordingTime(0);

            // @ts-ignore - getDisplayMedia might not be in older lib types
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30, max: 60 } },
                audio: true
            });

            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm; codecs=vp9,opus'
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setMediaBlob(blob);
                stopStream();
            };

            // Handle user clicking "Stop Sharing" on browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);

            // Start timer
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            console.error("Error starting screen recording:", err);
            setError(err.message || "Failed to start recording");
        }
    }, [stopRecording, stopStream]);

    const clearRecording = useCallback(() => {
        setMediaBlob(null);
        setError(null);
        setRecordingTime(0);
    }, []);

    return {
        isRecording,
        mediaBlob,
        error,
        recordingTime,
        startRecording,
        stopRecording,
        clearRecording
    };
};
