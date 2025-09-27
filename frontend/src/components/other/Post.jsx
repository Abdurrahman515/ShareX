import { Avatar, Box, Button, CloseButton, Dialog, Flex, Image, Menu, Portal, Text } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Actions from './Actions';
import useShowToast from '@/hooks/useShowToast';
import { formatDistanceToNowStrict } from 'date-fns';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import userAtom from '@/atoms/userAtom';
import postsAtom from '@/atoms/postsAtom';
import { BsFillChatQuoteFill, BsThreeDots } from 'react-icons/bs';
import { LuCopy } from 'react-icons/lu';
import { useColorModeValue } from '../ui/color-mode';
import { navigatedAtom } from '@/atoms/placeAtom';
import RepostedPost from './RepostedPost';
import VideoControls from './VideoControls';
import { volumeAtom } from '@/atoms/reelsAtom';
import { openFullSecreen } from '@/utils/openFullScreen';
import { downloadBase64AsFile } from '@/utils/downloadBase64AsFile';
import { langAtom } from '@/atoms/langAtom';
import { ar } from 'date-fns/locale'; 

const Post = ({ post, postedBy }) => {
    const [ deleting, setDeleting ] = useState(false);
    const [ open, setOpen ] = useState(false);
    const [ open2, setOpen2 ] = useState(false);
    const [ isPlaying, setIsPlaying ] = useState(false);
    const [ isFullscreen, setIsFullscreen ] = useState(false);
    const [ hover, setHover ] = useState(true);

    const { showErrorToast, showSuccessToast } = useShowToast();

    const setNavigated = useSetRecoilState(navigatedAtom);
    const currentUser = useRecoilValue(userAtom);
    const volume = useRecoilValue(volumeAtom);
    const lang = useRecoilValue(langAtom);
    const [ posts, setPosts ] = useRecoilState(postsAtom); 

    const navigate = useNavigate();

    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);

    const hoverBg = useColorModeValue('gray.200', 'gray.900');
    
    const CopyUrl = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${postedBy.username}/post/${post._id}`).then(()=>{
            showSuccessToast(lang === 'ar' ? "تم نسخ الرابط بنجاح!" : 'Link copied successfully!')
        });
    };

    const handleDeletePost = async (e) => {
        e.preventDefault();
        if(!currentUser) return showErrorToast(lang === 'ar' ? "يجب عليك تسجيل الدخول أولا لحذف منشور!" : "You must be logged in to delete a post!");
        if(deleting) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/posts/delete/${post._id}?lang=${lang}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if(data.error) return showErrorToast(data.error);
            
            showSuccessToast(data.message);
            setOpen(false);
            setPosts(posts.filter((p) => p._id !== post._id))
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar'  ? "حدث خطأ ما!" : "Something went wrong!"));
        } finally {
            setDeleting(false);
        }
    };
    
    return (
        <>  
            {post.repostedPost?.isReposted ? (
                <RepostedPost post={post} postedBy={postedBy}/> 
            ) : (
                <Link to={`/${postedBy.username}/post/${post._id}`}>
                    <Flex gap={3} mb={4} py={5} px={4}>
                        <Flex flexDirection={'column'} alignItems={'center'}>
                            <Avatar.Root size={'md'} onClick={
                                (e) => {
                                    e.preventDefault();
                                    navigate(`/${postedBy.username}`)
                                }
                            }>
                                <Avatar.Fallback name={postedBy.name}/>
                                <Avatar.Image src={postedBy.profilePic}/>
                            </Avatar.Root>
                            <Box w={'1px'} h={'full'} bg={'gray.500'} my={2}></Box>

                            <Box position={'relative'} w={'full'}>
                                {!decodeURIComponent(window.location.pathname).startsWith(`/${postedBy.username}/post/`) && post.replies.length === 0 && <Text textAlign={'center'}>🥱</Text>}

                                {!decodeURIComponent(window.location.pathname).startsWith(`/${postedBy.username}/post/`) && post.replies[0] && (
                                    <Avatar.Root size={'xs'} position={'absolute'} top={'0px'} left={'4px'} padding={'2px'}>
                                        <Avatar.Fallback name='' />
                                        <Avatar.Image src={post.replies[0].userProfilePic} />
                                    </Avatar.Root>
                                )}
                                
                                {!decodeURIComponent(window.location.pathname).startsWith(`/${postedBy.username}/post/`) && post.replies[1] && (
                                    <Avatar.Root size={'xs'} position={'absolute'} bottom={'-4px'} right={'-12px'} padding={'2px'}>
                                        <Avatar.Fallback name='' />
                                        <Avatar.Image src={post.replies[1].userProfilePic} />
                                    </Avatar.Root>
                                )}

                                {!decodeURIComponent(window.location.pathname).startsWith(`/${postedBy.username}/post/`) && post.replies[2] && (
                                    <Avatar.Root size={'xs'} position={'absolute'} bottom={'-4px'} left={'-13px'} padding={'2px'}>
                                        <Avatar.Fallback name='' />
                                        <Avatar.Image src={post.replies[2].userProfilePic} />
                                    </Avatar.Root>
                                )}
                    
                            </Box>
                        </Flex>
            
                        <Flex flex={1} flexDirection={'column'} gap={2} minW={0}>
                            <Flex justifyContent={'space-between'} w={'full'}>
                                <Flex w={'full'} alignItems={'center'}>
                                    <Text fontSize={'sm'} fontWeight={'bold'} onClick={
                                        (e) => {
                                            e.preventDefault();
                                            navigate(`/${postedBy.username}`)
                                        }
                                    }>{postedBy.username}</Text>
                                    <Image 
                                        src='/verified.png' 
                                        w={4} 
                                        h={4} 
                                        ml={lang !== 'ar' && 1} 
                                        mr={lang === 'ar' && 1}
                                    />
                                </Flex>
                                <Flex gap={4} alignItems={'center'} onClick={(e) => e.preventDefault()}>
                                    <Text fontSize={'xs'} width={36} textAlign={lang === 'ar' ? 'left' : "right"} color={'gray.500'} fontWeight={'700'}>
                                        {lang === 'ar' && "منذ "} 
                                        {lang === 'ar' ? formatDistanceToNowStrict(new Date(post.createdAt), {locale: ar}) 
                                        : formatDistanceToNowStrict(new Date(post.createdAt))} 
                                        {lang !== 'ar' && " ago"}
                                    </Text>

                                    <Menu.Root>
                                        <Menu.Trigger>
                                            <Box cursor={'pointer'}>
                                                <BsThreeDots />
                                            </Box>
                                        </Menu.Trigger>
                                        <Portal>
                                            <Menu.Positioner>
                                                <Menu.Content dir={lang === 'ar' ? "rtl" : "ltr"}>
                                                    <Menu.Item value='copy' onClick={CopyUrl}>
                                                        <LuCopy />
                                                        <Box flex={1}>
                                                            {lang === 'ar' ? "نسخ الرابط" : "Copy link"}
                                                        </Box>
                                                        <Menu.ItemCommand>⌘C</Menu.ItemCommand>
                                                    </Menu.Item>
                                                    
                                                    {post.postedBy._id !== currentUser?._id && (
                                                        <Menu.Item _hover={{bg: hoverBg}} onClick={() => {
                                                                navigate('/chat');
                                                                setNavigated({isNavigated: true, user: post.postedBy});
                                                            }}
                                                        >
                                                            <BsFillChatQuoteFill />
                                                            <Box flex={1}>{lang === 'ar' ? "دردشة" : "Chat"}</Box>
                                                        </Menu.Item>
                                                    )}
                                                </Menu.Content>
                                            </Menu.Positioner>
                                        </Portal>
                                    </Menu.Root>

                                    <Dialog.Root role="alertdialog" lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? "rtl" : "ltr"}>
                                        <Dialog.Trigger asChild>
                                            <Box m={'5px'} onClick={(e) => {e.preventDefault(); setOpen(true)}}>
                                                {currentUser?.username === postedBy.username && <DeleteIcon size={20} data-testid={'delete-icon'} />}
                                            </Box>
                                            
                                        </Dialog.Trigger>
                                        <Portal>
                                            <Dialog.Backdrop />
                                            <Dialog.Positioner>
                                                <Dialog.Content>
                                                    <Dialog.Header>
                                                        <Dialog.Title>
                                                            {lang === 'ar' ? "هل أنت متأكد؟" : "Are you sure?"}
                                                        </Dialog.Title>
                                                    </Dialog.Header>
                                                    <Dialog.Body>
                                                        <p>
                                                            {lang === "ar" ? "هذا الإجراء سيحذف المنشور الخاص بك ولا يمكن التراجع عنه!" 
                                                            : "This action will remove your post and cannot be undone!"}
                                                        </p>
                                                    </Dialog.Body>
                                                    <Dialog.Footer>
                                                        <Dialog.ActionTrigger asChild>
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={(e) => {e.preventDefault(); setOpen(false)}}
                                                                disabled={deleting}
                                                            >
                                                                {lang === 'ar' ? "إلغاء" : "Cancel"}
                                                            </Button>
                                                        </Dialog.ActionTrigger>
                                                        <Button 
                                                            colorPalette="red" 
                                                            loading={deleting} 
                                                            onClick={handleDeletePost}
                                                        >
                                                            {lang === 'ar' ? "حذف" : "Delete"}
                                                        </Button>
                                                    </Dialog.Footer>
                                                    <Dialog.CloseTrigger asChild>
                                                        <CloseButton size="sm" />
                                                    </Dialog.CloseTrigger>
                                                </Dialog.Content>
                                            </Dialog.Positioner>
                                        </Portal>
                                    </Dialog.Root>

                                </Flex>
                            </Flex>

                            <Text 
                                fontSize={'sm'} 
                                wordBreak="break-word" 
                                overflowWrap="anywhere"
                                whiteSpace={'pre-wrap'}
                            >
                                {post.text}
                            </Text>

                            { post.img ?
                            <Box borderRadius={6} overflow={'hidden'} border={'1px solid'} borderColor={'gray.500'}>
                                <Image 
                                    src={post.img} 
                                    w={'100%'} 
                                    maxW={'100%'}
                                    maxH={'400px'} 
                                    height={'auto'}
                                    objectFit={'contain'}
                                    display={'block'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setOpen2(true)
                                    }}
                                    data-testid={'post-img'}
                                />
                            </Box> : ''}

                            {post.video?.videoUrl ? 
                                <Box 
                                    position={'relative'}
                                    ref={videoContainerRef}
                                    onClick={(e) => e.preventDefault()}
                                    maxH={'400px'}
                                    display={'flex'}
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                    onDoubleClick={() => {
                                        if(videoContainerRef.current && !isFullscreen){
                                            setIsFullscreen(true);
                                            openFullSecreen(videoContainerRef.current);
                                        }else if(videoContainerRef.current && isFullscreen){
                                            setIsFullscreen(false);
                                            document.exitFullscreen();
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        if(!videoRef.current?.paused){
                                            setHover(true)
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if(!videoRef.current?.paused){
                                            setTimeout(() => {
                                                setHover(false)
                                            }, 2000);
                                        }
                                    }}
                                    onMouseMove={() => {
                                        setHover(true);
                                    }}
                                >
                                    <video 
                                        src={post.video.videoUrl}
                                        ref={videoRef}
                                        style={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            maxWidth: '100%',
                                            height: '100%',
                                            maxHeight: '100%',
                                            display: 'block',
                                            scrollSnapAlign: 'none',
                                            borderRadius: '5px'
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if(videoRef.current && videoRef.current?.paused){
                                                videoRef.current.volume = volume[0] / 100;
                                                videoRef.current?.play();
                                                setHover(true);
                                                setIsPlaying(true);
                                            } else {
                                                videoRef.current?.pause();
                                                setHover(true);
                                                setIsPlaying(false);
                                            }
                                        }}
                                    />
                                    
                                    {hover && (
                                        <VideoControls 
                                            videoRef={{ current: videoRef?.current }}
                                            videoContainerRef={{ current: videoContainerRef.current }}
                                            video={post.video}
                                            isPlaying={isPlaying}
                                            setIsPlaying={setIsPlaying}
                                            postedBy={postedBy}
                                            openFullSecreen={openFullSecreen}
                                            isFullscreen={isFullscreen}
                                            setIsFullscreen={setIsFullscreen}
                                        />
                                    )}
                                </Box>
                            : ""}
                
                            <Flex gap={3} my={1}>
                                <Actions post={post} isReposted={false}/>
                            </Flex>

                        </Flex>
                    </Flex>
                </Link>
            )}

            <Dialog.Root size={'cover'} lazyMount open={open2} onOpenChange={(e) => setOpen2(e.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Body pb={6}>
                                {post.img && (
                                    <Flex 
                                        mt={5} 
                                        w={'full'} 
                                        position={'relative'} 
                                        h={'100%'} 
                                        justifyContent={'center'} 
                                        alignItems={'center'}
                                    >
                                        <Image 
                                            src={post.img}  
                                            alt='Selected image' 
                                            objectFit={'contain'} 
                                            maxH={'70vh'} 
                                            alignSelf={'center'} 
                                            justifySelf={'center'}
                                        />
                                        
                                        <Button
                                            variant="plain"
                                            position="absolute"
                                            top={2}
                                            left={2}
                                            onClick={() => downloadBase64AsFile(post.img)}
                                        >
                                            <DownloadIcon fontSize={24} data-testid={"download-icon"} />
                                        </Button>
                                    </Flex>
                                )}
                            </Dialog.Body>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="lg" borderRadius={'full'}/>
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    )
};

export default Post;
