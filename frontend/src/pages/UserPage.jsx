import { sectionAtom } from '@/atoms/userPageAtom';
import ReelsSection from '@/components/other/ReelsSection';
import UserHeader from '@/components/other/UserHeader'
import { Toaster } from '@/components/ui/toaster';
import useGetUserProfile from '@/hooks/useGetUserProfile';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import React from 'react'
import { useRecoilValue } from 'recoil';
import PostsSection from '@/components/other/PostsSection';
import { langAtom } from '@/atoms/langAtom';

const UserPage = () => {  
  const section = useRecoilValue(sectionAtom);
  const lang = useRecoilValue(langAtom);

  const { user, loading } = useGetUserProfile();

  if(!user && loading){
    return (
      <Flex justifyContent={'center'} alignItems={'center'} h={'60vh'}>
        <Spinner size={'xl'} />
      </Flex>
    )
  }
  if(!user && !loading) {
    return (
      <Flex justify={'center'} py={6}>
        <Box fontWeight={'bold'} color={'gray.500'}>
          {lang === 'ar' ? "لم يتم العثور على المستخدم!" : "User not found"} 
        </Box>
      </Flex>
    )
  };

  return (
    <>
      <UserHeader user={ user }/>
      <Toaster />

      {section === 'reels' ? (
        <ReelsSection user={user}/>
      ) : (
        <PostsSection user={user}/>
      )}
      </>
  )
}

export default UserPage;
