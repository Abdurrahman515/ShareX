import { useState } from "react";
import useShowToast from "./useShowToast";
import { useRecoilValue } from "recoil";
import { langAtom } from "@/atoms/langAtom";

const usePreviewVideo = () => {
    const [ videoUrl, setVideoUrl ] = useState(null);
    const [ uploading, setUploading ] = useState(false);
    const [ file, setFile ] = useState(null);
    
    const { showErrorToast, showSuccessToast } = useShowToast();

    const lang = useRecoilValue(langAtom);

    const handleVideoChange = (e) => {
        setUploading(true);
        const file = e.target.files[0];

        if(file && file.type.startsWith('video/')){
            const maxSize = 100 * 1024 * 1024; // 100 MB
            if(file.size > maxSize){
                showErrorToast(lang === 'ar' ? "الفيديو كبير جدا! الحد الأقصى 100 مب." : 'Video too large! Maximum size is 100 MB.');
                setVideoUrl(null);
                setUploading(false);
                return;
            }
            setFile(file);
            const reader = new FileReader();

            reader.onloadend = () => {
                setVideoUrl(reader.result);
                setUploading(false);
            };

            reader.readAsDataURL(file);
            showSuccessToast(lang === 'ar' ? "تم تغيير الفيديو بنجاح!" : 'Video changed successfully!');
        }else{
            showErrorToast(lang === 'ar' ? "الرجاء اختيار فيديو!" : 'Please select a video file');
            setVideoUrl(null);
            setUploading(false);
        };
    };

    return { handleVideoChange, videoUrl, setVideoUrl, uploading, file };
}

export default usePreviewVideo
