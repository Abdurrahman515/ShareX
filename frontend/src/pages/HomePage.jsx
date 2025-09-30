import { langAtom } from '@/atoms/langAtom'
import postsAtom from '@/atoms/postsAtom'
import Post from '@/components/other/Post'
import Reel from '@/components/other/Reel'
import SuggestedUsers from '@/components/other/SuggestedUsers'
import { Toaster } from '@/components/ui/toaster'
import useShowToast from '@/hooks/useShowToast'
import { Box, Flex, HStack, Skeleton, SkeletonCircle, SkeletonText, Spinner, Stack } from '@chakra-ui/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useRecoilState, useRecoilValue } from 'recoil'

const HomePage = () => {
  const [ loading, setLoading ] = useState(true);
  const [ fetchingReels, setFetchingReels ] = useState(false);
  const [ page, setPage ] = useState(1);
  const [ hasMore, setHasMore ] = useState(true);
  const [ reels, setReels ] = useState([]);
  
  const [ posts, setPosts ] = useRecoilState(postsAtom);
  const lang = useRecoilValue(langAtom);

  const { showErrorToast } = useShowToast();

  const abortRef = useRef(null);

  const getFeedPosts = useCallback (async (pageNum = 1) => {
    setLoading(true);

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    try {
      const res = await fetch(`/api/posts/feed?page=${pageNum}&limit=7&lang=${lang}`, { signal: signal });
      const data = await res.json();
      if(data.error){
        showErrorToast(data.error);
        return;
      }
      
      const filteredPosts = data.posts.filter(post => {
        return !post.postedBy.isFrozen;
      });

      if(!filteredPosts[0] && data.hasMore){
        setPage(prev => {
          getFeedPosts(prev + 1);
          return prev + 1;
        });
        return;
      };
      
      setPosts(prev => {
        const ids = new Set(prev.map(p => p._id));
        const newPosts = filteredPosts.filter(p => !ids.has(p._id));
        if([...prev, ...newPosts].length > prev.length){
          setPage(prev => {
            return prev + 1
          });
          return [...prev, ...newPosts];
        };
        return prev;
      });
      
      setHasMore(data.hasMore)
    } catch (error) {
      if(error.name === "AbortError"){
        return;
      }
      showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
    } finally {
      setLoading(false);
    };
  }, [showErrorToast, setPosts, lang]);

  const getSuggestedReels = useCallback(async () => {
    setFetchingReels(true);
    try {
      const res = await fetch('/api/videos/suggested');
      const data = await res.json();

      if(data.error) return showErrorToast(data.error);

      setReels(data);
    } catch (error) {
      showErrorToast(error.message || "Something went wrong!");
      console.log(error);
      setReels([]);
    } finally {
      setFetchingReels(false);
    }
  }, [showErrorToast]);


  useEffect(() => {
    setPosts([]);
    getFeedPosts(1);
    setPage(1);
    setLoading(true);
  }, [setPosts, getFeedPosts]);

  useEffect(() => {
    setReels([]);
    getSuggestedReels();
  }, [getSuggestedReels]);

  useEffect(() => {

    return () => {
      if(abortRef.current){
        abortRef.current.abort();
      }
    }
  }, []);

  return (
    <Flex gap={10} alignItems={'flex-start'}>
      <Toaster />
      <Box flex={{ base: '1 1 100%', md: '0 0 70%' }} minW={0}>
        {loading && posts.length === 0 && (
          <>
              <Stack gap="6px" maxW="xl">
                  <Box h={'30px'}></Box>
                  <HStack width="full">
                      <SkeletonCircle size="12" />
                      <SkeletonText noOfLines={2} gap={'3'}/>
                  </HStack>
                  <Box h={'10px'}></Box>
                  <Skeleton height="300px"/>
              </Stack>
              
              <Stack gap="6px" maxW="xl">
                  <Box h={'30px'}></Box>
                  <HStack width="full">
                      <SkeletonCircle size="12" />
                      <SkeletonText noOfLines={2} gap={'3'}/>
                  </HStack>
                  <Box h={'10px'}></Box>
                  <Skeleton height="300px"/>
              </Stack>
              <Box h={'30px'}></Box>
          </>
        )}

        {fetchingReels && (
          <Flex>
            <Skeleton h={'300px'} width={'32%'} mr={lang !== 'ar' && '2%'} ml={lang === 'ar' && '2%'} />
            <Skeleton h={'300px'} width={'32%'} mr={lang !== 'ar' && '2%'} ml={lang === 'ar' && '2%'} />
            <Skeleton h={'300px'} width={'32%'} />
          </Flex>
        )}

        {posts.length === 0 && !loading && (
          <Flex justify={'center'} py={6}>
            <Box fontWeight={'bold'} color={'gray.500'}>
              {lang === 'ar' ? "لا يوجد أي منشور!" : "There are no post!"}
            </Box>
          </Flex>
        )}

        {posts.length === 0 && reels.length > 0 && (
          <Flex maxH={'300px'} maxW={"100%"} ml={6} my={5} cursor={'pointer'}>
            {reels.map((reel, idx) => (
              <Reel 
                key={reel._id} 
                video={reel} 
                postedBy={reel.postedBy} 
                idx={idx}
              />
            ))}
          </Flex>
        )}
        
        {posts.length > 0 && (
          <InfiniteScroll
            dataLength={posts.length}
            next={() => getFeedPosts(page)}
            hasMore={hasMore}
            loader={
              (
                <Flex justify="center" py={4}>
                  <Spinner size="md" />
                </Flex>
              )
            }
            endMessage={
              (
                <Flex justify={'center'} py={6}>
                  <Box fontWeight={'bold'} color={'gray.500'}>
                    {lang === 'ar' ? "لا مزيد من المنشورات!" : "No more posts!"}
                  </Box>
                </Flex>
              )
            }
          >
            {posts.map((post, postIdx) => ( 
              <React.Fragment key={post._id}>
                <Post key={post._id} post={post} postedBy={post.postedBy}/>
                {(postIdx === 2 || (postIdx === posts.length - 1 && postIdx < 2)) && !fetchingReels && reels.length > 0 && (
                  <Flex maxH={'300px'} maxW={"100%"} ml={6} my={5} cursor={'pointer'}>
                    {reels.map((reel, idx) => (
                      <Reel 
                        key={reel._id} 
                        video={reel} 
                        postedBy={reel.postedBy} 
                        idx={idx}
                      />
                    ))}
                  </Flex>
                )}
              </React.Fragment>

            ))}
          </InfiniteScroll>
        )}

      </Box>

      <Box 
        flex={{ base: '0 0 0', md: '0 0 30%' }} 
        minW={0}
        display={{
          base: 'none',
          md: 'block'
        }}
      >
        <SuggestedUsers />
      </Box>

    </Flex>
  )
}

export default HomePage
