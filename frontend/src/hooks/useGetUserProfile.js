import { useEffect, useState } from 'react'
import useShowToast from './useShowToast';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { langAtom } from '@/atoms/langAtom';

const useGetUserProfile = () => {
  const [ user, setUser ] = useState(null);
  const [ loading, setLoading ] = useState(true);
  const { showErrorToast } = useShowToast();

  const lang = useRecoilValue(langAtom);

  const { username } = useParams();

  useEffect(() => {

    const getUser = async () => {
      try {
        const res = await fetch(`/api/users/profile/${username}?lang=${lang}`);
        const data = await res.json();
        if(data.error) {
          showErrorToast(data.error);
          return;
        };

        if(data.isFrozen){
          setUser(null);
          return;
        }
        
        setUser(data);
      } catch (error) {
        showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
      } finally {
        setLoading(false);
      };
    };

    getUser();
  }, [username, showErrorToast, lang])

  return {loading, user}
}

export default useGetUserProfile
