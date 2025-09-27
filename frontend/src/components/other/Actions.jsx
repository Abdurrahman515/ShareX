import postsAtom from '@/atoms/postsAtom';
import userAtom from '@/atoms/userAtom';
import useShowToast from '@/hooks/useShowToast';
import { Box, Button, CloseButton, Dialog, Drawer, Field, FieldErrorIcon, FieldHelperText, Flex, Portal, Stack, Text, Textarea } from '@chakra-ui/react'
import React, { useRef, useState } from 'react'
import { FaXTwitter } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import { EmailIcon, EmailShareButton, FacebookIcon, FacebookMessengerIcon, FacebookMessengerShareButton, FacebookShareButton, TelegramIcon, TelegramShareButton, TwitterShareButton, WhatsappIcon, WhatsappShareButton } from 'react-share';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useColorModeValue } from '../ui/color-mode';
import { langAtom } from '@/atoms/langAtom';

const Actions = ({ post, isReposted }) => {
	const user = useRecoilValue(userAtom);
	const lang = useRecoilValue(langAtom);
	const [ posts, setPosts ] = useRecoilState(postsAtom);
	
	const { showErrorToast } = useShowToast();

	let likesInitialCount;
	if(!isReposted){
		likesInitialCount = post.likes.includes(user?._id)
	};
	
	const [ liked, setLiked ] = useState(likesInitialCount);
	const [ loading, setLoading ] = useState(false);
	
	const abortRef = useRef(null);

	const navigate = useNavigate();

	const setLikeOrUnlike = async () => {
		if(isReposted) return;
		if(!user) return showErrorToast(lang === 'ar' ? "يجب عليك تسجيل الدخول أولا للإعجاب بمنشور!" : 'You must be logged in to like a post!');
		
		abortRef.current = new AbortController();
		const signal = abortRef.current.signal;
		
		setLoading(true);
		try {
			const res = await fetch(`/api/posts/like/${post._id}?lang=${lang}`, {
				method: 'PUT',
				headers: {
					"Content-Type": "application/json"
				},
				signal: signal
			});
			const data = await res.json();
			if(data.error) return showErrorToast(data.error);
			
		} catch (error) {
			if(error.name === "AbortError") return;
			showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
		} finally{
			setLoading(false);
		}
	}

	const handleLikeAndUnlike = () => {
		if(isReposted) return;
		
		try {
			if(loading && abortRef.current){
				abortRef.current.abort();
			};

			setLikeOrUnlike();
			if(!liked){
				// add the id of the current user to post.likes array
				const updatedPosts = posts.map((p) => {
					if(p._id === post._id) {
						return {...p, likes: [...p.likes, user._id]}
					}
					return p;
				});
				setPosts(updatedPosts);
			} else{
				// remove the id of the current user from post.likes array
				const updatedPosts = posts.map((p) => {
					if(p._id === post._id){
						return {...p, likes: p.likes.filter((id) => id !== user._id)}
					}
					return p;
				});
				setPosts(updatedPosts);
			};

			setLiked(!liked);
		} catch (error) {
			if(error.name === "AbortError") return;
			showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
		};
	};

  return (
	<Flex flexDirection={'column'}>
    	<Flex gap={3} my={2} onClick={(e) => e.preventDefault()}>
			<svg
				aria-label='Like'
				color={liked ? "rgb(237, 73, 86)" : ""}
				fill={liked ? "rgb(237, 73, 86)" : "transparent"}
				height='19'
				role='img'
				viewBox='0 0 24 22'
				width='20'
				onClick={handleLikeAndUnlike}
			>
				<path
					d='M1 7.66c0 4.575 3.899 9.086 9.987 12.934.338.203.74.406 1.013.406.283 0 .686-.203 1.013-.406C19.1 16.746 23 12.234 23 7.66 23 3.736 20.245 1 16.672 1 14.603 1 12.98 1.94 12 3.352 11.042 1.952 9.408 1 7.328 1 3.766 1 1 3.736 1 7.66Z'
					stroke='currentColor'
					strokeWidth='2'
				></path>
			</svg>


			<svg
				aria-label='Comment'
				color=''
				fill=''
				height='20'
				role='img'
				viewBox='0 0 24 24'
				width='20'
				onClick={() => {if(!isReposted) navigate(`/${post.postedBy.username}/post/${post._id}`)}}
			>
				<title>
					{lang === 'ar' ? "تعليق" : "Comment"}
				</title>
				<path
					d='M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z'
					fill='none'
					stroke='currentColor'
					strokeLinejoin='round'
					strokeWidth='2'
				></path>
			</svg>

			<RepostSVG isReposted={isReposted} post={post} />
			
			<ShareSVG post={post} isReposted={isReposted}/>
			

		</Flex>	
		
		<Flex gap={2} alignItems={'center'} ml={'5px'}>
			<Text color={'gray.500'} fontSize={'sm'}>
				{lang === 'ar' && post.replies.length !== 2 && post.replies.length !== 1 ? post.replies.length 
				:lang !== 'ar' && post.replies.length} 
				{lang === 'ar' && post.replies.length === 2 ? " تعليقان"
				:lang === 'ar' && post.replies.length === 1 ? " تعليق واحد" 
				:lang === 'ar' && post.replies.length > 10 ? " تعليق" 
				:lang === 'ar' && post.replies.length <= 10 ? " تعليقات"
				:" replies"}
			</Text>
			<Box bg={'gray.500'} w={'0.5px'} h={'0.5px'} borderRadius={'full'}></Box>
			<Text color={'gray.500'} fontSize={'sm'}>
				{
					lang !== 'ar' ? (
						(post.likes.length > 0 ? post.likes.length : 0) 
						|| (post.likes > 0 ? post.likes : 0)
					)
					:lang === 'ar' && post.likes.length === 1 ? (
						""
					)
					:lang === 'ar' && post.likes.length === 2 ? (
						""
					)
					:lang === 'ar' && post.likes === 1 ? (
						""
					)
					:lang === 'ar' && post.likes === 2 ? (
						""
					)
					:lang === 'ar' && (
						(post.likes.length > 0 ? post.likes.length : 0)
						|| (post.likes > 0 ? post.likes : 0)
					)
				}
				{
					(lang === 'ar' && post.likes.length === 2 ? " إعجابان"
					:lang === 'ar' && post.likes.length === 1 ? " إعجاب واحد" 
					:lang === 'ar' && post.likes.length > 10 ? " إعجاب" 
					:lang === 'ar' && post.likes.length <= 10 ? " إعجابات"
					:lang === 'ar' ? " إعجابات" :lang !== 'ar' && " likes") 
				||
					(lang === 'ar' && post.likes === 2 ? " إعجابان"
					:lang === 'ar' && post.likes === 1 ? " إعجاب واحد" 
					:lang === 'ar' && post.likes > 10 ? " إعجاب" 
					:lang === 'ar' && post.likes <= 10 ? " إعجابات"
					:lang === 'ar' ? "إعجابات" :lang !== 'ar' && " likes")
				}
			</Text>
		</Flex>
    </Flex>
  )
};

const MAX_CHAR = 500;

const RepostSVG = ({ isReposted, post }) => {
	const [ open, setOpen ] = useState(false);
	const [ text, setText ] = useState("");
	const [ remainingChar, setRemainingChar ] = useState(MAX_CHAR);
	const [ loading, setLoading ] = useState(false);

	const { showErrorToast, showSuccessToast } = useShowToast();

	const currentUser = useRecoilValue(userAtom);
	const lang = useRecoilValue(langAtom);
	const [ posts, setPosts ] = useRecoilState(postsAtom);

	const location = useLocation();

	const handleTextChange = (e) => {
		const inputText = e.target.value;

        if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setText(truncatedText);
			setRemainingChar(0);
            showErrorToast(lang === 'ar' ? "لقد وصلت الى حد الكتابة الاقصى!" : 'Oops! Character limit reached!')
		} else {
			setText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
	};

	const handleRepost = async () => {
		if(loading) return;
		if(!text.trim()) return showErrorToast(lang === 'ar' ? "اكتب شيئا لإعادة النشر!" : "Write something to repost!");
		setLoading(true);
		try {
			const res = await fetch(`/api/posts/repost/${post._id}?lang=${lang}`, {
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: text.trim(),
					postedBy: currentUser._id
				})
			});
			const data = await res.json();

			if(data.error) return showErrorToast(data.error);

			if(location.pathname === '/' || '/' + currentUser.username === decodeURIComponent(location.pathname)){
                setPosts([data, ...posts]);
            };

			showSuccessToast(lang === 'ar' ? "تم إعادة نشر المنشور بنجاح!" : "Post reposted successfully!");

			setOpen(false);
			setText("");
			setRemainingChar(MAX_CHAR);
		} catch (error) {
			showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
			console.log(error);
		} finally {
			setLoading(false)
		}
	};

	return (
		<>
			<svg
				aria-label='Repost'
				color='currentColor'
				fill='currentColor'
				height='20'
				role='img'
				viewBox='0 0 24 24'
				width='20'
				onClick={() => {
					if(isReposted) setOpen(false);
					if(post.postedBy._id === currentUser._id && !isReposted){
						setOpen(false)
						return showErrorToast(lang === 'ar' ? "لا يمكنك إعادة نشر أحد منشوراتك!" : "You cannot repost your post!")
					}
					if(post.repostedPost?.postedBy){
						setOpen(false);
						return showErrorToast(lang === 'ar' ? "لا يمكن إعادة نشر منشور تمت إعادة نشره مسبقا!" : "You can't repost allready reposted post!")
					};
					if(!isReposted) setOpen(true);
				}}
			>
				<title>
					{lang === 'ar' ? "إعادة نشر" : "Repost"}
				</title>
				<path
					fill=''
					d='M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z'
				></path>
			</svg>

			<Dialog.Root lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? "rtl" : "ltr"}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>
									{lang === 'ar' ? "إعادة نشر" : "Repost"}
								</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body pb="4">
								<Stack gap="4">
									<Field.Root>
										<Flex gap={1} alignItems={'center'}>
											<FieldErrorIcon size={'xs'}/>
											<FieldHelperText fontWeight={'500'}>
												{lang === "ar" ? "هذا النص سيكون فوق المنشور الذي تريد إعادة نشره!" 
												: "This text will be at the top of the post you want to repost!"}
											</FieldHelperText>
										</Flex>
										<Textarea 
											placeholder={lang === 'ar' ? "اكتب محتوى المنشور هنا..." : "Post content goes here..."} 
											onChange={handleTextChange}
											value={text}
										/>
			
										<FieldHelperText textAlign={'right'} w={'full'}>
											{remainingChar}/{MAX_CHAR}
										</FieldHelperText>

									</Field.Root>
								</Stack>
							</Dialog.Body>
							<Dialog.Footer>
								<Dialog.ActionTrigger asChild>
									<Button variant="outline" 
										bg={'red.400'} 
										color={'white'}
										_hover={{
											bg: 'red.500',
										}}
										onClick={() => {
											setText("");
											setRemainingChar(MAX_CHAR);
										}}>
											{lang === 'ar' ? "إلغاء" : "Cancel"}
										</Button>
								</Dialog.ActionTrigger>
								<Button variant="outline" 
									bg={'green.400'} 
									color={'white'}
									_hover={{
										bg: 'green.500',
									}}
									w={'15%'}
									onClick={handleRepost}
									loading={loading}
								>
									{lang === 'ar' ? "نشر" : "Post"}
								</Button>
							</Dialog.Footer>
							<Dialog.CloseTrigger asChild>
								<CloseButton size="sm" onClick={() => {setText(""); setRemainingChar(MAX_CHAR)}}/>
							</Dialog.CloseTrigger>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	)
};

const ShareSVG = ({ post, isReposted }) => {
	const [ open, setOpen ] = useState(false);
	const lang = useRecoilValue(langAtom);

	const location = useLocation();

	const postURL = `${window.location.origin}/${post.postedBy.username}/post/${post._id}`;

	return (
		<>
			<svg
				aria-label='Share'
				color=''
				fill='rgb(243, 245, 247)'
				height='20'
				role='img'
				viewBox='0 0 24 24'
				width='20'
				onClick={() => {if(!isReposted) setOpen(true)}}
			>
				<title>
					{lang === 'ar' ? "مشاركة" : "Share"}
				</title>
				<line
					fill='none'
					stroke='currentColor'
					strokeLinejoin='round'
					strokeWidth='2'
					x1='22'
					x2='9.218'
					y1='3'
					y2='10.083'
				></line>
				<polygon
					fill='none'
					points='11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334'
					stroke='currentColor'
					strokeLinejoin='round'
					strokeWidth='2'
				></polygon>
			</svg>
			<Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement={'bottom'} dir={lang === 'ar' ? "rtl" : "ltr"}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<Drawer.Content 
							minW={'unset'} 
							maxW={location.pathname === '/' ? {base: '620px', md: '900px'} : "620px"} 
							marginX={'auto'} 
							borderRadius={'md'} 
						>
							<Drawer.Header>
								<Drawer.Title 
									textAlign={'center'} 
									fontSize={'xl'} 
									fontWeight={'bold'} 
									color={useColorModeValue('gray.600', 'gray.400')}
								>
									{lang === 'ar' ? "المشاركة بواسطة:" : "Share the post by:"} 
								</Drawer.Title>
							</Drawer.Header>
							<Drawer.Body>
								<Flex gap={7} flexDir={'column'} alignItems={'center'}>
									<Flex gap={10}>
										<WhatsappShareButton url={postURL}>
											<WhatsappIcon size={40} round/>
										</WhatsappShareButton>

										<FacebookMessengerShareButton url={postURL}>
											<FacebookMessengerIcon size={40} round/>
										</FacebookMessengerShareButton>

										<FacebookShareButton url={postURL}>
											<FacebookIcon size={40} round/>
										</FacebookShareButton>
									</Flex>

									<Flex gap={10}>
										<TwitterShareButton url={postURL}>
											<FaXTwitter size={40} style={{borderRadius: '50%'}}/>
										</TwitterShareButton>

										<TelegramShareButton url={postURL}>
											<TelegramIcon size={40} round/>
										</TelegramShareButton>

										<EmailShareButton url={postURL}>
											<EmailIcon size={40} round/>
										</EmailShareButton>
									</Flex>
								</Flex>
							</Drawer.Body>
							<Drawer.Footer>
							</Drawer.Footer>
							<Drawer.CloseTrigger asChild>
								<CloseButton size="lg" borderRadius={'50%'}/>
							</Drawer.CloseTrigger>
						</Drawer.Content>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		</>
	)
};

export default Actions;
