import { useRef, useState } from "react"
import useShowToast from "./useShowToast";
import { useRecoilValue } from "recoil";
import { langAtom } from "@/atoms/langAtom";

const useRecordVoice = () => {
    const [ recording, setRecording ] = useState(false);
    const [ audioUrl, setAudioUrl ] = useState(null);
    const [ blob, setBlob ] = useState(null);
    const [ seconds, setSeconds ] = useState(0);
    const [ duration, setDuration ] = useState("00:00");
    
    const mediaRecorderRef = useRef(null);
    const chunks = useRef([]);
    const streamRef = useRef(null);
    const secondsRef = useRef(0);

    const { showErrorToast } = useShowToast();

    const lang = useRecoilValue(langAtom);

    const formatTime = (time) => {
        time = Math.max(0, Math.floor(Number(time) || 0));

        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const secs = time % 60;

        const pad = n => String(n).padStart(2, "0"); // for increment 0 before single number

        return hours > 0
            ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
            : `${pad(minutes)}:${pad(secs)}`;
    }

    const startRecording = async () => {
        if(seconds > 0 || secondsRef.current > 0){
            setSeconds(0);
            secondsRef.current = 0
            setDuration('00:00');
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
    
            const id = setInterval(() => {
                setSeconds(prev => {
                    const next = prev + 1;
                    secondsRef.current = next;
                    return next;
                });
            }, 1000);
    
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
    
            mediaRecorderRef.current.onstop = () => {
                if(secondsRef.current < 1) {
                    clearInterval(id);
                    showErrorToast(lang === 'ar' ? "سجل ثانية واحدة على الأقل!" : "Record 1 sec at least!")
                    setSeconds(0);
                    secondsRef.current = 0;
                    setDuration('00:00');
                    return;
                };
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                setBlob(blob);
    
                clearInterval(id);
                setDuration(formatTime(secondsRef.current));
                secondsRef.current = 0;
                
                chunks.current = [];
    
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
    
                if(streamRef.current){
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };
    
            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (error) {
            console.log(error);
        }
    };

    const stopRecording = () => {
        if(mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive'){
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
    };

    return { recording, audioUrl, startRecording, stopRecording, blob, setAudioUrl, duration }
}

export default useRecordVoice
