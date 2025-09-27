import { currentVideosAtom, videosAtom } from '@/atoms/reelsAtom';
import userAtom from '@/atoms/userAtom';
import useShowToast from '@/hooks/useShowToast';
import { Avatar, Box, Button, CloseButton, Drawer, FieldRoot, Flex, Image, Input, Portal, Text } from '@chakra-ui/react'
import React, { useRef, useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Divider from './Divider';
import Comment from './Comment';
import { FaCommentSlash, FaXTwitter } from 'react-icons/fa6';
import { useColorModeValue } from '../ui/color-mode';
import { EmailIcon, EmailShareButton, FacebookIcon, FacebookMessengerIcon, FacebookMessengerShareButton, FacebookShareButton, TelegramIcon, TelegramShareButton, TwitterShareButton, WhatsappIcon, WhatsappShareButton } from 'react-share';
import { Link } from 'react-router-dom';
import { langAtom } from '@/atoms/langAtom';

const VideoActions = ({ video }) => {
    const currentUser = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);
    const setVideos = useSetRecoilState(videosAtom);
    const setCurrentVideos = useSetRecoilState(currentVideosAtom);
    
    const [ liked, setLiked ] = useState(video?.likes?.includes(currentUser?._id));
    const [ loading, setLoading ] = useState(false);

    const abortRef = useRef(null);

    const { showErrorToast } = useShowToast();
    
    const setLikeOrUnlike = async () => {
        if(!currentUser) return showErrorToast(lang === 'ar' ? "يجب عليك تسجيل الدخول أولا للإعجاب/إلغاء الإعجاب بفيديو!" : "You must be logged in to like or unlike video!");
        
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        
        setLoading(true);
        try {
            const res = await fetch(`/api/videos/like/${video?._id}?lang=${lang}`, {
                method: "PUT",
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
            console.log(error);
        } finally {
            setLoading(false);
        };
    };

    const handleLikeAndUnlike = () => {
        setLiked(!liked);
        try {
            if(loading && abortRef) {
                abortRef.current.abort();
            };

            setLikeOrUnlike();

            if(!liked) {
                setVideos(prev => {
                    const updatedVideos = prev.map(vid => {
                        if(vid?._id === video?._id){
                            return { ...vid, likes: [...vid.likes, currentUser?._id]}
                        }
                        return vid;
                    });
                    return updatedVideos;
                });

                setCurrentVideos(prev => {
                    const updatedVideos = prev.map(vid => {
                        if(vid?._id === video?._id){
                            return { ...vid, likes: [...vid.likes, currentUser?._id]}
                        }
                        return vid;
                    });
                    return updatedVideos;
                });
            } else {
                setVideos(prev => {
                    const updatedVideos = prev.map(v => {
                        if(v?._id === video?._id){
                            return { ...v, likes: v.likes.filter(id => id !== currentUser?._id) };
                        };
                        return v;
                    });
                    return updatedVideos;
                });

                setCurrentVideos(prev => {
                    const updatedVideos = prev.map(v => {
                        if(v?._id === video?._id){
                            return { ...v, likes: v.likes.filter(id => id !== currentUser?._id) };
                        };
                        return v;
                    });
                    return updatedVideos;
                });
            };

            setLiked(!liked);
        } catch (error) {
            if(error.name === "AbortError") return;
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
            console.log(error);
        }
    };

    return (
        <Flex flexDir={'column'} mb={"100px"} gap={3}>

            <Flex flexDir={'column'} gap={1} alignItems={'center'}>
                <svg
                    aria-label='Like'
                    color={liked ? "rgb(237, 73, 86)" : ""}
                    fill={liked ? "rgb(237, 73, 86)" : "transparent"}
                    height='32'
                    role='img'
                    viewBox='0 0 24 22'
                    width='32'
                    onClick={handleLikeAndUnlike}
                    cursor={'pointer'}
                >
                    <path
                        d='M1 7.66c0 4.575 3.899 9.086 9.987 12.934.338.203.74.406 1.013.406.283 0 .686-.203 1.013-.406C19.1 16.746 23 12.234 23 7.66 23 3.736 20.245 1 16.672 1 14.603 1 12.98 1.94 12 3.352 11.042 1.952 9.408 1 7.328 1 3.766 1 1 3.736 1 7.66Z'
                        stroke='currentColor'
                        strokeWidth='2'
                    ></path>
                </svg>

                <Text>
                    {video?.likes?.length}
                </Text>
            </Flex>

            <CommentSVG video={video} />

            <ShareSVG />
            
        </Flex>
    )
};

const ShareSVG = () => {
    const [ open, setOpen ] = useState(false);

    const lang = useRecoilValue(langAtom);

    const videoUrl = window.location.href;
    
    return (
        <>
            <Flex flexDir={'column'} gap={1} alignItems={'center'}>
                <svg
                    aria-label='Share'
                    color=''
                    fill='rgb(243, 245, 247)'
                    height='30'
                    role='img'
                    viewBox='0 0 24 24'
                    width='30'
                    cursor={'pointer'}
                    onClick={() => setOpen(true)}
                >
                    <title>
                        {lang == 'ar' ? "مشاركة" : "Share"}
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
            </Flex>

            <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement={'bottom'} dir={lang === 'ar'? "rtl" : "ltr"}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content minW={'unset'} maxW={"620px"} marginX={'auto'} borderRadius={'md'}>
                            <Drawer.Header>
                                <Drawer.Title 
                                    textAlign={'center'} 
                                    fontSize={'xl'} 
                                    fontWeight={'bold'} 
                                    color={useColorModeValue('gray.600', 'gray.400')}
                                >
                                    {lang === 'ar' ? "مشاركة المقطع بواسطة:" : "Share the video by:"} 
                                </Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                <Flex gap={7} flexDir={'column'} alignItems={'center'}>
                                    <Flex gap={10}>
                                        <WhatsappShareButton url={videoUrl}>
                                            <WhatsappIcon size={40} round/>
                                        </WhatsappShareButton>

                                        <FacebookMessengerShareButton url={videoUrl}>
                                            <FacebookMessengerIcon size={40} round/>
                                        </FacebookMessengerShareButton>

                                        <FacebookShareButton url={videoUrl}>
                                            <FacebookIcon size={40} round/>
                                        </FacebookShareButton>
                                    </Flex>

                                    <Flex gap={10}>
                                        <TwitterShareButton url={videoUrl}>
                                            <FaXTwitter size={40} style={{borderRadius: '50%'}}/>
                                        </TwitterShareButton>

                                        <TelegramShareButton url={videoUrl}>
                                            <TelegramIcon size={40} round/>
                                        </TelegramShareButton>

                                        <EmailShareButton url={videoUrl}>
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

const CommentSVG = ({ video }) => {
    const postedBy = video?.postedBy;
    const textColor = useColorModeValue("gray.700", "gray.400")

    const [ open, setOpen ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const [ commentText, setCommentText ] = useState("");

    const setVideos = useSetRecoilState(videosAtom);
    const setCurrentVideos = useSetRecoilState(currentVideosAtom);
    const lang = useRecoilValue(langAtom);

    const { showErrorToast } = useShowToast();

    const handleReply = async () => {
        if(!commentText.trim()) return showErrorToast(lang === 'ar' ? "اكتب شيئا للتعليق" : "Type something to reply!");
        setLoading(true);
        try {
            const res = await fetch(`/api/videos/reply/${video?._id}?lang=${lang}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: commentText.trim()
                })
            });

            const data = await res.json();

            if(data.error) return showErrorToast(data.error);

            setVideos(prev => {
                const updatedVideos = prev.map(v => {
                    if(v?._id === video?._id){
                        return {...v, replies: [ ...v.replies, {...data, _id: Date.now()} ]}
                    };
                    return v;
                });
                return updatedVideos;
            });

            setCurrentVideos(prev => {
                const updatedVideos = prev.map(v => {
                    if(v?._id === video?._id){
                        return {...v, replies: [ ...v.replies, {...data, _id: Date.now()} ]}
                    };
                    return v;
                });
                return updatedVideos;
            })

        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
            console.log(error);
        } finally {
            setLoading(false);
            setCommentText("");
        }
    };

    return (
        <>
            <Flex flexDir={'column'} gap={1} alignItems={'center'}>
                <svg
                    aria-label='Comment'
                    color=''
                    fill=''
                    height='30'
                    role='img'
                    viewBox='0 0 24 24'
                    width='30'
                    cursor={'pointer'}
                    onClick={() => setOpen(true)}
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

                <Text>
                    {video?.replies?.length || 0}
                </Text>
            </Flex>

            <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement={'bottom'} dir={lang === 'ar' ? "rtl" : "ltr"}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content minW={'unset'} maxW={'620px'} marginX={'auto'} borderRadius={'md'}>
                            <Drawer.Header />
                            <Drawer.Body px={8}>
                                <Flex direction={'column'} gap={3}>
                                    <Flex gap={2} alignItems={'flex-start'} w={'full'}>
                                        <Link to={`/${postedBy?.username}`}>
                                            <Avatar.Root>
                                                <Avatar.Fallback name={postedBy?.name} />
                                                <Avatar.Image src={postedBy?.profilePic} />
                                            </Avatar.Root>
                                        </Link>
                                        
                                        <Flex flexDir={'column'} gap={2} w={'full'}>
                                            <Link to={`/${postedBy?.username}`}>
                                                <Flex alignItems={'center'} gap={1}>
                                                    <Text fontWeight={'bold'}>
                                                        {postedBy?.username}
                                                    </Text>

                                                    <Image src='/verified.png' w={4} h={4}/>
                                                </Flex>
                                            </Link>

                                            <Text mb={5}>
                                                {video?.text}
                                            </Text>
                                        </Flex>

                                    </Flex>

                                    <Divider />
                                    
                                    <Box maxH={'200px'} overflowY={'auto'} px={5}>
                                        {video?.replies?.length > 0 && video?.replies.map((reply, idx) => (
                                            <Comment key={reply?._id} reply={reply} lastReply={idx === video?.replies?.length - 1} />
                                        ))}
                                    </Box>

                                    {video?.replies?.length === 0 && (
                                        <Flex alignItems={'center'} justifyContent={'center'} direction={'column'} gap={2} my={4}>
                                            <Text fontWeight={'bold'} color={textColor} fontSize={'xl'}>
                                                {lang === 'ar' ? "لا يوجد تعليقات إلى الآن!" : "No comments yet!"} 
                                            </Text>
                                            <Box color={textColor}>
                                                <FaCommentSlash size={'40'} />
                                            </Box>
                                        </Flex>
                                    )}

                                    <Flex gap={2}>
                                        <Input 
                                            placeholder={lang === 'ar' ? "اكتب التعليق هنا..." : 'Comment goes here...'}
                                            autoFocus
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />

                                        <Button 
                                            colorPalette={'blue'} 
                                            variant={'subtle'}
                                            onClick={handleReply}
                                            loading={loading}
                                        >
                                            {lang === 'ar' ? "تعليق" : "Reply"}
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Drawer.Body>
                            <Drawer.Footer>
                                
                            </Drawer.Footer>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton size="lg" borderRadius={'md'} />
                            </Drawer.CloseTrigger>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </>
    )
};

export default VideoActions;
