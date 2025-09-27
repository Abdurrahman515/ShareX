import { Avatar, Box, Button, CloseButton, Dialog, Flex, Image, Menu, Portal, Text } from '@chakra-ui/react'
import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Actions from './Actions'
import useShowToast from '@/hooks/useShowToast'
import { formatDistanceToNowStrict } from 'date-fns';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import userAtom from '@/atoms/userAtom'
import postsAtom from '@/atoms/postsAtom'
import { BsFillChatQuoteFill, BsThreeDots } from 'react-icons/bs'
import { LuCopy } from 'react-icons/lu'
import { useColorModeValue } from '../ui/color-mode'
import { navigatedAtom } from '@/atoms/placeAtom'
import VideoControls from './VideoControls'
import { volumeAtom } from '@/atoms/reelsAtom'
import { openFullSecreen } from '@/utils/openFullScreen'
import { downloadBase64AsFile } from '@/utils/downloadBase64AsFile'
import { langAtom } from '@/atoms/langAtom'
import { ar } from 'date-fns/locale'

const RepostedPost = ({ post, postedBy }) => {
    const [ deleting, setDeleting ] = useState(false);
    const [ open, setOpen ] = useState(false);
    const [ open2, setOpen2 ] = useState(false);
    const [ isFullscreen, setIsFullscreen ] = useState(false);
    const [ isPlaying, setIsPlaying ] = useState(false);

    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);

    const { showErrorToast, showSuccessToast } = useShowToast();

    const setNavigated = useSetRecoilState(navigatedAtom);
    const currentUser = useRecoilValue(userAtom);
    const volume = useRecoilValue(volumeAtom);
    const lang = useRecoilValue(langAtom);
    const [ posts, setPosts ] = useRecoilState(postsAtom); 

    const navigate = useNavigate();

    const hoverBg = useColorModeValue('gray.200', 'gray.900');
    const repostedPost = post.repostedPost;
    
    const CopyUrl = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${postedBy.username}/post/${post._id}`).then(()=>{
            showSuccessToast(lang === 'ar' ? 'تم نسخ الرابط بتجاح!' : 'Link copied successfully!')
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
            if(decodeURIComponent(window.location.pathname) !== currentUser?.username){
                navigate(`/${currentUser?.username}`)
            }
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
        } finally {
            setDeleting(false);
        }
    }
    
    return (
        <>      
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
                        <Flex justifyContent={'space-between'} w={'full'} maxW={'100%'} minW={5}>
                            <Flex w={'full'} maxW={'100%'} minW={5} alignItems={'center'}>
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
                                <Text fontSize={'xs'} width={36} textAlign={lang === 'ar' ? "left" : 'right'} color={'gray.500'} fontWeight={'700'}>
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
                                            <Menu.Content dir={lang === 'ar' ? 'rtl' : "ltr"}>
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
                                                        <Box flex={1}>
                                                            {lang === 'ar' ? "دردشة" : "Chat"}
                                                        </Box>
                                                    </Menu.Item>
                                                )}
                                            </Menu.Content>
                                        </Menu.Positioner>
                                    </Portal>
                                </Menu.Root>

                                <Dialog.Root role="alertdialog" lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? "rtl" : "ltr"}>
                                    <Dialog.Trigger asChild>
                                        <Box m={'5px'} onClick={(e) => {e.preventDefault(); setOpen(true)}}>
                                            {currentUser?.username === postedBy?.username && <DeleteIcon data-testid={'delete-icon'} size={20}/>}
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
                                                        {lang === 'ar' ? "هذا الإجراء سيحذف المنشور الخاص بك ولا يمكن التراجع عنه!" 
                                                        : "This action will remove your post and cannot be undone!"} 
                                                    </p>
                                                </Dialog.Body>
                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline" onClick={(e) => {e.preventDefault(); setOpen(false)}}>
                                                            {lang === 'ar' ? "إلغاء" : "Cancel"} 
                                                        </Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button colorPalette="red" loading={deleting} onClick={handleDeletePost}>
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
                        
                        {/* REPOSTED POST */}
                        <Flex 
                            gap={3} 
                            mb={4} 
                            pt={5} 
                            pb={10} 
                            px={5} 
                            color={'gray.500'} 
                            bg={'gray.900'} 
                            w={'90%'} 
                            maxW={'90%'} 
                            minW={0} 
                            mx={'auto'} 
                            borderRadius={'md'}
                        >
                            <Flex flexDirection={'column'} alignItems={'center'}>
                                <Avatar.Root size={'md'} onClick={
                                    (e) => {
                                        e.preventDefault();
                                        navigate(`/${repostedPost.postedBy.username}`)
                                    }
                                }>
                                    <Avatar.Fallback name={repostedPost.postedBy.name}/>
                                    <Avatar.Image src={repostedPost.postedBy.profilePic}/>
                                </Avatar.Root>
                                <Box w={'1px'} h={'full'} bg={'gray.500'} my={2}></Box>

                                <Box position={'relative'} w={'full'}>
                                    {repostedPost.replies.length === 0 && <Text textAlign={'center'}>🥱</Text>}

                                    {repostedPost.replies[0] && (
                                        <Avatar.Root size={'xs'} position={'absolute'} top={'0px'} left={'4px'} padding={'2px'}>
                                            <Avatar.Fallback name='' />
                                            <Avatar.Image src={repostedPost.replies[0].userProfilePic} />
                                        </Avatar.Root>
                                    )}
                                    
                                    {repostedPost.replies[1] && (
                                        <Avatar.Root size={'xs'} position={'absolute'} bottom={'-4px'} right={'-12px'} padding={'2px'}>
                                            <Avatar.Fallback name='' />
                                            <Avatar.Image src={repostedPost.replies[1].userProfilePic} />
                                        </Avatar.Root>
                                    )}

                                    {repostedPost.replies[2] && (
                                        <Avatar.Root size={'xs'} position={'absolute'} bottom={'-4px'} left={'-13px'} padding={'2px'}>
                                            <Avatar.Fallback name='' />
                                            <Avatar.Image src={repostedPost.replies[2].userProfilePic} />
                                        </Avatar.Root>
                                    )}
                        
                                </Box>
                            </Flex>
                
                            <Flex flex={1} flexDirection={'column'} gap={2} minW={0}>
                                <Flex justifyContent={'space-between'} w={'100%'} maxW={'100%'}>
                                    <Flex w={'full'} maxW={'100%'} minW={6} alignItems={'center'}>
                                        <Text fontSize={'sm'} fontWeight={'bold'} onClick={
                                            (e) => {
                                                e.preventDefault();
                                                navigate(`/${repostedPost.postedBy.username}`)
                                            }
                                        }>{repostedPost.postedBy.username}</Text>
                                        <Image 
                                            src='/verified.png' 
                                            w={3} 
                                            h={3} 
                                            ml={lang !== 'ar' && 1}
                                            mr={lang === 'ar' && 1}
                                        />
                                    </Flex>
                                    <Flex gap={4} alignItems={'center'} onClick={(e) => e.preventDefault()}>
                                        <Text fontSize={'xs'} width={36} textAlign={lang === 'ar' ? "left" : 'right'} color={'gray.500'} fontWeight={'700'}>
                                            {lang === 'ar' && "منذ "} 
                                            {lang === 'ar' ? formatDistanceToNowStrict(new Date(post.createdAt), {locale: ar}) 
                                            : formatDistanceToNowStrict(new Date(post.createdAt))} 
                                            {lang !== 'ar' && " ago"}
                                        </Text>
                                    </Flex>
                                </Flex>

                                <Text fontSize={'sm'}
                                    wordBreak="break-word" 
                                    overflowWrap="anywhere"
                                    whiteSpace={'pre-wrap'}
                                >
                                    {repostedPost.text}
                                </Text>
                                { repostedPost.img ?
                                <Box borderRadius={6} overflow={'hidden'} border={'1px solid'} borderColor={'gray.500'}>
                                    <Image 
                                        src={repostedPost.img} 
                                        w={'100%'}
                                        maxW={'100%'}
                                        maxH={'300px'}
                                        height={'auto'}
                                        display={'block'}
                                        objectFit={'contain'}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setOpen2(true)
                                        }}
                                        data-testid={'img'}
                                    />
                                </Box> : ''}

                                {repostedPost.video?.videoUrl ? 
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
                                    >
                                        <video 
                                            src={repostedPost.video.videoUrl}
                                            ref={videoRef}
                                            style={{
                                                objectFit: 'contain',
                                                width: '100%',
                                                maxWidth: '100%',
                                                height: '100%',
                                                maxHeight: '100%',
                                                display: 'block',
                                                scrollSnapAlign: 'none',
                                                borderRadius: '5px',
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if(videoRef.current && videoRef.current?.paused){
                                                    videoRef.current.volume = volume[0] / 100;
                                                    videoRef.current?.play();
                                                    setIsPlaying(true);
                                                } else {
                                                    videoRef.current?.pause();
                                                    setIsPlaying(false);
                                                }
                                            }}
                                        />
                                        
                                        <VideoControls 
                                            videoRef={{ current: videoRef?.current }}
                                            videoContainerRef={{ current: videoContainerRef.current }}
                                            video={repostedPost.video}
                                            isPlaying={isPlaying}
                                            setIsPlaying={setIsPlaying}
                                            postedBy={repostedPost.postedBy}
                                            openFullSecreen={openFullSecreen}
                                            isFullscreen={isFullscreen}
                                            setIsFullscreen={setIsFullscreen}
                                        />
                                    </Box>
                                : ""}
                    
                                <Flex gap={3} my={1} onClick={() => {return}}> 
                                    <Actions post={repostedPost} isReposted={true}/>
                                </Flex>
                            </Flex>
                        </Flex>
                        {/* // REPOSTED POST // */}
            
                        <Flex gap={3} my={1}>
                            <Actions post={post} isReposted={false}/>
                        </Flex>

                    </Flex>
                </Flex>
            </Link>

            <Dialog.Root size={'cover'} lazyMount open={open2} onOpenChange={(e) => setOpen2(e.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Body pb={6}>
                                {repostedPost.img && (
                                    <Flex 
                                        mt={5} 
                                        w={'full'} 
                                        position={'relative'} 
                                        h={'100%'} 
                                        justifyContent={'center'} 
                                        alignItems={'center'}
                                    >
                                        <Image 
                                            src={repostedPost.img}  
                                            alt='Selected image' 
                                            objectFit={'contain'} 
                                            maxH={'70vh'} 
                                            alignSelf={'center'} 
                                            justifySelf={'center'}
                                            data-testid={'opened-img'}
                                        />
                                        
                                        <Button
                                            variant="plain"
                                            position="absolute"
                                            top={2}
                                            left={2}
                                            onClick={() => downloadBase64AsFile(repostedPost.img)}
                                        >
                                            <DownloadIcon fontSize={24} />
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
}

export default RepostedPost
