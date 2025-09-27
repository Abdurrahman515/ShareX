import useShowToast from '@/hooks/useShowToast';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Box, Flex, HStack, Skeleton, SkeletonCircle, SkeletonText, Spinner, Stack } from '@chakra-ui/react';
import { sectionAtom } from '@/atoms/userPageAtom';
import Reel from './Reel';
import { userReelsAtom } from '@/atoms/reelsAtom';
import { langAtom } from '@/atoms/langAtom';

const ReelsSection = ({ user }) => {
    const [ fetchingReels, setFetchingReels ] = useState(true);
    const [ page, setPage ] = useState(1);
    const [ hasMore, setHasMore ] = useState(true);
    
    const [ userReels, setUserReels ] = useRecoilState(userReelsAtom);
    const lang = useRecoilValue(langAtom);
    
    const abortRef = useRef(null);

    const section = useRecoilValue(sectionAtom);
    
    const { username } = useParams();
    
    const { showErrorToast } = useShowToast();

    //eslint-disable-next-line
    const isTest = process.env.NODE_ENV === 'test';

    const getUserReels = useCallback(async (pageNum = 1) => {
        setFetchingReels(true);

        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        try {
            const res = await fetch(`/api/videos/${isTest ? "testme" : username}?page=${pageNum}&limit=4?lang=${lang}`, { signal: signal });
            const data = await res.json();
            if(data.error) return showErrorToast(data.error);

            setUserReels(prev => {
                const ids = new Set(prev.map(r => r._id));
                const newReels = data.videos.filter(r => !ids.has(r._id) && r.postedBy._id.toString() === user._id.toString());
                if([...prev, ...newReels].length > prev.length){
                setPage(prev => {
                    return prev + 1
                });
                return [...prev, ...newReels];
                };
                return prev;
            });

            setHasMore(data.hasMore);
        } catch (error) {
            if(error.name === "AbortError") return;
            showErrorToast(error.message || lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!");
            setUserReels([]);
        } finally {
            setFetchingReels(false);
        }
        //eslint-disable-next-line
    }, [showErrorToast, setUserReels, user, username, lang]);

    useEffect(() => {
        setUserReels([]);
        setPage(1);
        getUserReels(1);
        setFetchingReels(true);
       //eslint-disable-next-line 
    }, [setUserReels, username]);

    useEffect(() => {
    
    return () => {
        if(abortRef.current && fetchingReels){
            abortRef.current.abort();
        }
    }
    }, [username, section, fetchingReels]);

  return (
    <>
        {fetchingReels && page === 1 && (
            <>
                <Flex w={'100%'} mt={5}>
                    <Skeleton height="300px" w={'49%'} mr={lang !== 'ar' && '2%'}/>
                    <Skeleton height={'300px'} w={'49%'} mr={lang === 'ar' && '2%'}/>
                </Flex>
                <Flex w={'100%'} my={5}>
                    <Skeleton height="300px" w={'49%'} mr={lang !== 'ar' && '2%'}/>
                    <Skeleton height={'300px'} w={'49%'} mr={lang === 'ar' && '2%'}/>
                </Flex>
                
            </>
        )}

        {userReels.length > 0 && (
            <InfiniteScroll
                dataLength={userReels.length}
                next={() => getUserReels(page)}
                hasMore={hasMore}
                loader={
                    <Flex justify="center" py={4}>
                        <Spinner size="md" />
                    </Flex>
                }
                endMessage={
                    <Flex justify={'center'} py={6}>
                        <Box fontWeight={'bold'} color={'gray.500'}>
                            {lang === 'ar' ? "لا مزيد من الفيديوهات!" : "No more reels!"}
                        </Box>
                    </Flex>
                }
            >
                {userReels.length > 0 && userReels.map((reel, idx) => (        
                    <Reel 
                        key={reel._id} 
                        video={reel} 
                        postedBy={reel.postedBy} 
                        idx={idx}
                    />
                ))}
            </InfiniteScroll>
        )}

        {!fetchingReels && userReels.length === 0 && (
            <Flex justify={'center'} py={6}>
                <Box fontWeight={'bold'} color={'gray.500'}>
                    {lang === 'ar' ? "المستخدم لم يقم بنشر أي فيديو!" : "User has no reels!"}
                </Box>
            </Flex>
        )}

    </>
  )
}

export default ReelsSection;
