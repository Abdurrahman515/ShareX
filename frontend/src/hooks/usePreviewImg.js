import { useState } from "react"
import useShowToast from "./useShowToast";
import { useRecoilValue } from "recoil";
import { langAtom } from "@/atoms/langAtom";

const usePreviewImg = () => {
    const [ imgUrl, setImgUrl ] = useState(null);
    const { showErrorToast, showSuccessToast } = useShowToast();

    const lang = useRecoilValue(langAtom);

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if(file && file.type.startsWith('image/')){
            const reader = new FileReader();

            reader.onloadend = () => {
                setImgUrl(reader.result);
            };

            reader.readAsDataURL(file);
            showSuccessToast(lang === 'ar' ? 'تم تغيير الصورة بنجاح!' : 'Image changed successfully!');
        }else{
            showErrorToast(lang === 'ar' ? "الرجاء اختيار صورة!" : 'Please select an image file');
            setImgUrl(null);
        };
    }
  
    return { handleImageChange, imgUrl, setImgUrl };
}

export default usePreviewImg
