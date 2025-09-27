import postsAtom from '@/atoms/postsAtom';
import { sectionAtom } from '@/atoms/userPageAtom';
import useShowToast from '@/hooks/useShowToast';
import { Box, Flex, HStack, Skeleton, SkeletonCircle, SkeletonText, Spinner, Stack } from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import Post from './Post';
import { langAtom } from '@/atoms/langAtom';

const PostsSection = ({ user }) => {
    const [ fetchingPosts, setFetchingPosts ] = useState(true);
    const [ page, setPage ] = useState(1);
    const [ hasMore, setHasMore ] = useState(true);
    
    const abortRef = useRef(null);

    const [ posts, setPosts ] = useRecoilState(postsAtom);
    const section = useRecoilValue(sectionAtom);
    const lang = useRecoilValue(langAtom);
    
    const { username } = useParams();
    
    const { showErrorToast } = useShowToast();

    //eslint-disable-next-line
    const isTest = process.env.NODE_ENV === 'test';

    const getPosts = useCallback(async (pageNum = 1) => {
        if(!user) return;
        setFetchingPosts(true);

        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        try {
            const res = await fetch(`/api/posts/user/${isTest? "me" : username}?page=${pageNum}&limit=5&lang=${lang}`, { signal: signal });
            const data = await res.json();
            if(data.error) return showErrorToast(data.error);

            setPosts(prev => {
                const ids = new Set(prev.map(p => p._id));
                const newPosts = data.posts.filter(p => !ids.has(p._id) && p.postedBy._id.toString() === user._id.toString());
                if([...prev, ...newPosts].length > prev.length){
                setPage(prev => {
                    return prev + 1
                });
                return [...prev, ...newPosts];
                };
                return prev;
            });

            setHasMore(data.hasMore);
            
        } catch (error) {
            if(error.name === "AbortError") return;
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
            setPosts([]);
        } finally {
            setFetchingPosts(false);
        }
        
        //eslint-disable-next-line
    }, [showErrorToast, setPosts, user, username, lang]);

    useEffect(() => {
        setPosts([]);
        setPage(1);
        getPosts(1);
        setFetchingPosts(true);
    }, [setPosts, getPosts]);

    useEffect(() => {
    
        return () => {
            if(abortRef.current){
            abortRef.current.abort();
            }
        }
    }, [username, section]);


    return (
        <>
          {fetchingPosts && page === 1 && (
            <>
                <Stack gap="6px" maxW="xl">
                    <Box h={'50px'}></Box>
                    <HStack width="full">
                        <SkeletonCircle size="12" />
                        <SkeletonText noOfLines={2} gap={'3'} />
                    </HStack>
                    <Box h={'10px'}></Box>
                    <Skeleton height="300px" />
                </Stack>
                <Box h={'30px'}></Box>
            </>
            )}

            {posts.length > 0 && (
            <InfiniteScroll
                dataLength={posts.length}
                next={() => getPosts(page)}
                hasMore={hasMore}
                loader={
                <Flex justify="center" py={4}>
                    <Spinner size="md" />
                </Flex>
                }
                endMessage={
                    <Flex justify={'center'} py={6}>
                        <Box fontWeight={'bold'} color={'gray.500'}>
                            {lang === 'ar' ? "لا مزيد من المنشورات!" : "No more posts!"} 
                        </Box>
                    </Flex>
                }
            >
                {posts.length > 0 && posts.map((post) => (
                    <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}
            </InfiniteScroll>
            )}

            {!fetchingPosts && posts.length === 0 && (
            <Flex justify={'center'} py={6}>
                <Box fontWeight={'bold'} color={'gray.500'}>
                    {lang === 'ar' ? "المستخدم لا يملك أي منشور!" : "User has no post!"} 
                </Box>
            </Flex>
            )} 
        </>
    )
}

export default PostsSection;
