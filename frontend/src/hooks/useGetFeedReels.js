import { useCallback, useState } from "react";
import useShowToast from "./useShowToast";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { hasMoreAtom, pageAtom, videosAtom } from "@/atoms/reelsAtom";
import { langAtom } from "@/atoms/langAtom";

const useGetFeedReels = () => {
    const [ loading , setLoading ] = useState(false);
    
    const navigate = useNavigate();

    const setVideos = useSetRecoilState(videosAtom);
    const setHasMore = useSetRecoilState(hasMoreAtom);
    const setPage = useSetRecoilState(pageAtom);
    const lang = useRecoilValue(langAtom);

    const { showErrorToast } = useShowToast();
    
    const getFeedVideos = useCallback(async (pageNum = 1) => {

        setLoading(true);
        try {
            const res = await fetch(`/api/videos?page=${pageNum}&limit=5&lang=${lang}`);
            const data = await res.json();

            if(data.error) return showErrorToast(data.error);

            let page = 0;

            setVideos(prev => {
                const ids = new Set(prev.map(v => v._id));
                const newVideos = data.videos.filter(v => !ids.has(v._id));
                if([...prev, ...newVideos].length > prev.length){
                    page++
                    return [...prev, ...newVideos];
                }
                return prev;
            });

            if(data.videos.length > 0) {
                setPage(prev => prev + page);
            };

            setHasMore(data.hasMore);
            
            if(window.location.pathname === '/reels') {
                navigate(`reel/${data.videos[0]._id}`, { replace: true });
            }
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : 'Something went wrong!'));
        } finally {
            setLoading(false);
        }
    }, [showErrorToast, setVideos, navigate, setHasMore, setPage, lang]);
    
  
    return { getFeedVideos, loading };
}

export default useGetFeedReels
