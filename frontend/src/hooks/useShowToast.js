import { useColorModeValue } from '@/components/ui/color-mode';
import  { useCallback } from 'react'
import toast from 'react-hot-toast';

const useShowToast = () => {
    const bgColor = useColorModeValue('white', '#333');
    const txtColor = useColorModeValue('black', 'white');

    const showSuccessToast = useCallback(
        (text) => {
            toast.success(text, { style: {borderRadius: '10px', background: bgColor, color: txtColor} })
        },
        [bgColor, txtColor]
    );

    const showErrorToast = useCallback(
        (text) => {
            toast.error(text, { style: {borderRadius: '10px', background: bgColor, color: txtColor} })
        },
        [bgColor, txtColor]
    )

    return { showSuccessToast, showErrorToast };
}

export default useShowToast
