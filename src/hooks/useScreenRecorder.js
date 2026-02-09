import { useState, useRef, useCallback } from 'react';

export const useScreenRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlob, setMediaBlob] = useState(null);
    const [error, setError] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setRecordingTime(0);
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen', frameRate: { ideal: 30, max: 60 } },
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
                if (timerRef.current) clearInterval(timerRef.current);
            };

            // Handle user clicking "Stop Sharing" on browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error starting screen recording:", err);
            setError(err.message || "Failed to start recording");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, []);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

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
