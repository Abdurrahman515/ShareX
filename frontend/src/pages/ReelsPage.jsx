import { langAtom } from '@/atoms/langAtom';
import { pageAtom, videosAtom } from '@/atoms/reelsAtom';
import { useColorModeValue } from '@/components/ui/color-mode';
import { Toaster } from '@/components/ui/toaster'
import useGetFeedReels from '@/hooks/useGetFeedReels';
import { Flex, Skeleton, SkeletonCircle, SkeletonText, Text } from '@chakra-ui/react';
import React, { useEffect } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

const ReelsPage = () => {
  const [ page, setPage ] = useRecoilState(pageAtom);

  const { getFeedVideos, loading } = useGetFeedReels(); 
  
  const setVideos = useSetRecoilState(videosAtom);
  const lang = useRecoilValue(langAtom);

  const skeletonColor = useColorModeValue("gray.400", "gray.700");

  useEffect(() => {
    setVideos([]);
    setPage(1);
    getFeedVideos(1);
  } ,[getFeedVideos, setVideos, setPage]);

  return (
    <>
      <Toaster />

      {loading && page === 1 && (
        <Flex>
          <Skeleton height="100vh" width="100%" borderRadius={'md'}/>
          <Flex position={'absolute'} bottom={'5%'} w={'80%'} gap={2}> 
            <SkeletonCircle size="10" bg={skeletonColor} w={'full'} ml={lang !== 'ar' && 3} mr={lang === 'ar' && 3}/>
            <SkeletonText noOfLines={2} spacing="4" bg={skeletonColor} w={'full'}/>
          </Flex>
        </Flex>
      )}      
    </>
  )
};


export default ReelsPage
