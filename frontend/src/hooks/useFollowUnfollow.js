import userAtom from '@/atoms/userAtom';
import { useState } from 'react'
import { useRecoilValue } from 'recoil';
import useShowToast from './useShowToast';
import { langAtom } from '@/atoms/langAtom';

const useFollowUnfollow = (user) => {
    const currentUser = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);
    
    const [ loading, setLoading ] = useState(false);
    const [ following, setFollowing ] = useState(user?.followers.includes(currentUser?._id));

    const { showErrorToast, showSuccessToast } = useShowToast();

    const handleFollowUnfollow = async () => {
        if(!currentUser){
            showErrorToast(lang === 'ar' ? "الرجاء تسجيل الدخول للمتابعة!" : 'Please login to follow!');
            return;
        };
        if(loading) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/users/follow/${user._id}?lang=${lang}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            if(data.error){
                showErrorToast(data.error);
                return;
            };

            if(following){
                user.followers.pop(); // simulate removing from followers
            } else {
                user.followers.push(currentUser._id); // simulate adding to followers
            };

            showSuccessToast(data.message);
            setFollowing(!following);

        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
        } finally {
            setLoading(false);
        }
    };

    return { handleFollowUnfollow, loading, following };
}

export default useFollowUnfollow;
