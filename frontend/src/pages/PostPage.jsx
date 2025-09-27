import { langAtom } from '@/atoms/langAtom'
import postsAtom from '@/atoms/postsAtom'
import userAtom from '@/atoms/userAtom'
import Comment from '@/components/other/Comment'
import Divider from '@/components/other/Divider'
import Post from '@/components/other/Post'
import { useColorModeValue } from '@/components/ui/color-mode'
import { Toaster } from '@/components/ui/toaster'
import useGetUserProfile from '@/hooks/useGetUserProfile'
import useShowToast from '@/hooks/useShowToast'
import { Box, Button, Flex, HStack, Input, Skeleton, SkeletonCircle, SkeletonText, Spinner, Stack, Text } from '@chakra-ui/react'
import React, { useEffect, useRef, useState } from 'react'
import { FaCommentSlash } from 'react-icons/fa6'
import { useParams } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'

const PostPage = () => {
  const [ fetchingPosts, setFetchingPosts ] = useState(true);
  const [ reply, setReply ] = useState("");
  const [ replying, setReplying ] = useState(false);

  const commentsEndRef = useRef(null);
  const underInputRef = useRef(null);

  const [ posts, setPosts ] = useRecoilState(postsAtom);
  const currentUser = useRecoilValue(userAtom);
  const lang = useRecoilValue(langAtom);

  const { user, loading } = useGetUserProfile();
  const { showErrorToast } = useShowToast();

  const { pid } = useParams();

  const currentPost = posts[0];
  const textColor = useColorModeValue("gray.700", "gray.400");
  
  //eslint-disable-next-line
  const isTest = process.env.NODE_ENV === 'test';
  
  useEffect(() => {
    const getPost = async () => {
      try {
        const res = await fetch(`/api/posts/${isTest? 'post123' : pid}?lang=${lang}`);
        const data = await res.json();
        if(data.error) return showErrorToast(data.error);

        setPosts([data]); // the array is because we wrote the global state as array
      } catch (error) {
        showErrorToast(error.message || (lang === 'ar' ? 'حدث خطأ ما!' : "Something went wrong!"));
      } finally {
        setFetchingPosts(false);
      };
    };

    getPost();
    //eslint-disable-next-line
  }, [showErrorToast, pid, setPosts, lang]);

  useEffect(() => {
    if(!underInputRef || !underInputRef.current) return;
    setTimeout(() => {
      underInputRef.current?.scrollIntoView({ behaivor: "smooth" });
    }, 100)
  }, []);

  const handleReply = async () => {
    if(currentPost.isReposted) return;
		if(replying) return;
		if(!currentUser) return showErrorToast(lang === 'ar' ? "يجب عليك تسجيل الدخول أولا للتعليق!" : "You must be logged in to reply a post!");
    if(!reply.trim()) return showErrorToast(lang === 'ar' ? "اكتب شيئا للتعليق!" : "Write something to reply!");
		setReplying(true);
		try {
			const res = await fetch(`/api/posts/reply/${currentPost._id}?lang=${lang}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({text: reply.trim()})
			});
			const data = await res.json();
			
			if(data.error) return showErrorToast(data.error);
			
			const updatedPosts = posts.map((p) => {
				if(p._id === currentPost._id){
					return {...p, replies: [...p.replies, {...data, _id: Date.now()} ]};
				};
				return p;
			});
			setPosts(updatedPosts);

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behaivor: 'smooth' });
      }, 100);

			setReply("");
		} catch (error) {
			showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
		} finally {
			setReplying(false)
		}
  };

  if(!user && loading){
    return (
      <Flex justifyContent={'center'} alignItems={'center'} h={'60vh'}>
        <Spinner size={'xl'} />
      </Flex>
    )
  }

  if(!currentPost && !fetchingPosts) return null;

  if(fetchingPosts) {
    return (
      <>
        <Stack gap="6px" maxW="xl">
            <Box h={'50px'}></Box>
            <HStack width="full">
                <SkeletonCircle size="12" />
                <SkeletonText noOfLines={2} gap={'3'}/>
            </HStack>
            <Box h={'10px'}></Box>
            <Skeleton height="300px"/>
        </Stack>
        <Box h={'30px'}></Box>
    </>
    )
  }
  
  return (
    <>
      <Toaster />

      <Post post={currentPost} postedBy={currentPost.postedBy}/>
      
      {currentPost?.replies[0] ? <Divider /> : ""}
      
      <Box overflowY={'auto'} maxH={'300px'} my={5} px={5}>
        {currentPost?.replies?.map((reply) => (
          <Comment key={reply._id} reply={reply} lastReply={reply._id === currentPost.replies[currentPost.replies.length - 1]._id}/>
        ))}
        <Box h={0} w={0} m={0} p={0} ref={commentsEndRef} />
      </Box>

      {currentPost?.replies.length === 0 && (
        <Flex alignItems={'center'} justifyContent={'center'} direction={'column'} gap={2} my={4} h={'30vh'}>
          <Text fontWeight={'bold'} color={textColor} fontSize={'2xl'}>
            {lang === 'ar' ? "لا يوجد تعليقات إلى الآن!" : "No comments yet!"}
          </Text>
          <Box color={textColor}>
              <FaCommentSlash size={'50'} />
          </Box>
      </Flex>
      )}

      <Flex gap={2} mb={2}>
        <Input 
          placeholder={lang === 'ar' ? "اكتب التعليق هنا..." : 'Comment goes here...'}
          value={reply}
          autoFocus
          onChange={(e) => setReply(e.target.value)}
        />

        <Button 
          colorPalette={'blue'} 
          variant={'subtle'}
          loading={replying}
          onClick={handleReply}
        >
          {lang === 'ar' ? "تعليق" : "Reply"}  
        </Button>    
      </Flex>
      
      <Box h={0} w={0} m={0} p={0} ref={underInputRef}/>
    </>
  )
}

export default PostPage
