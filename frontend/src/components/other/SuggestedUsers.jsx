import { Box, Flex, Skeleton, SkeletonCircle, Text } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import SuggestedUser from './SuggestedUser';
import useShowToast from '@/hooks/useShowToast';
import { useRecoilValue } from 'recoil';
import { langAtom } from '@/atoms/langAtom';

const SuggestedUsers = () => {
    const [ loading, setLoading ] = useState(true);
    const [ suggestedUsers, setSuggestedUsers ] = useState([]);

    const lang = useRecoilValue(langAtom);
    
    const { showErrorToast } = useShowToast();

    useEffect(() => {
        const getSuggestedUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/users/suggested');
                const data = await res.json();

                if(data.error) return showErrorToast(data.error);

                setSuggestedUsers(data);
            } catch (error) {
                showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : 'Something went wrong!'))
            } finally {
                setLoading(false)
            }
        };

        getSuggestedUsers();
    }, [showErrorToast, lang]);

    if(!suggestedUsers) return;

  return (
    <>
      <Text mb={4} fontWeight={'bold'}>
        {lang === 'ar' ? "مستخدمون موصى بهم" : "Suggested Users"}
      </Text>
      <Flex gap={4} flexDir={'column'}>
        {loading && [0,1,2,3,4].map((_, idx) => (
            <Flex key={idx} gap={2} alignItems={'center'} p={1} borderRadius={'md'}>
                <Box>
                    <SkeletonCircle size={10}/>
                </Box>
                
                <Flex w={'full'} flexDir={'column'} gap={2}>
                    <Skeleton h={'8px'} w={'80px'}/>
                    <Skeleton h={'8px'} w={'90px'}/>
                </Flex>

                <Flex>
                    <Skeleton h={'20px'} w={'60px'}/>
                </Flex>
            </Flex>
        ))}

        {!loading && suggestedUsers?.map(user => (
            <SuggestedUser key={user._id} user={user}/>
        ))}
      </Flex>
    </>
  )
}

export default SuggestedUsers
