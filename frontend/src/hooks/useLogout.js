import userAtom from "@/atoms/userAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import useShowToast from "./useShowToast";
import { useState } from "react";
import { langAtom } from "@/atoms/langAtom";

const useLogout = () => {
    const setUser = useSetRecoilState(userAtom);
    const lang = useRecoilValue(langAtom);

    const { showErrorToast } = useShowToast();

    const [ loading, setLoading ] = useState(false);

    const logout = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/logout?lang=${lang}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const data = await res.json();

            if(data.error){
                showErrorToast(data.error);
                return;
            };
            
            localStorage.removeItem('user-sharex');
            setUser(null);
            
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
            setLoading(false)
        } finally{
            setLoading(false)
        }
    }
    return { logout, loading };
}

export default useLogout
