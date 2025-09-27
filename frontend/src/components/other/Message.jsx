import { selectedConversationAtom } from '@/atoms/messagesAtom';
import userAtom from '@/atoms/userAtom';
import { Avatar, Box, Button, CloseButton, Dialog, Flex, Image, Portal, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import React, { useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useColorMode } from '../ui/color-mode';
import { BsCheck2All } from 'react-icons/bs';
import { IoTime } from 'react-icons/io5';
import { IoMdCheckmark } from 'react-icons/io';
import VideoControls from './VideoControls';
import { volumeAtom } from '@/atoms/reelsAtom';
import { openFullSecreen } from '@/utils/openFullScreen';
import { DownloadIcon } from '@chakra-ui/icons';
import { downloadBase64AsFile } from '@/utils/downloadBase64AsFile';
import AudioControls from './AudioControls';
import { langAtom } from '@/atoms/langAtom';
import { ar } from 'date-fns/locale';

const Message = ({ ownMessage, message, isLastMessage, messagesEndRef }) => {
    const currentUser = useRecoilValue(userAtom);
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const volume = useRecoilValue(volumeAtom);
    const lang = useRecoilValue(langAtom);

    const [ imgUrl, setImgUrl ] = useState(null);
    const [ videoUrl, setVideoUrl ] = useState(null);
    const [ open, setOpen ] = useState(false);
    const [ isPlaying, setIsPlaying ] = useState(false);
    const [ isFullscreen, setIsFullscreen ] = useState(false);
    const [ hover, setHover ] = useState(false);

    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const audioRef = useRef(null);

    const { colorMode } = useColorMode();

    const videoHeight = isFullscreen? "100vh" : "70vh";

    const formatDateForMessage = (createdAt) => {
        const date = new Date(createdAt);
        if(lang === 'ar'){
            return format(date, 'hh:mm a', { locale: ar })
        } else {
            return format(date, 'hh:mm a')
        }
    };

    const sendingTime = formatDateForMessage(message.createdAt);

    const handleOpenImageOrVideo = () => {
        if(message.video.videoUrl){
            setVideoUrl(message.video.videoUrl);
            setOpen(true);   
        } else {
            setImgUrl(message.img)
            setOpen(true);
        };
    };

  return (
    <>
        {ownMessage? (
            <Flex
                gap={2}
                alignSelf={"flex-end"}
                mt={4}
                ref={isLastMessage ? messagesEndRef : null}
                scrollSnapType={"none"}
            >
                {message.img && !message.text && (
                    <Flex flexDir={'column'}>    
                        <Image 
                            src={message.img} 
                            maxW={{base: '80%', md: '200px'}} 
                            maxH={'150px'} 
                            borderRadius={'md'} 
                            objectFit={'contain'} 
                            alignSelf={'flex-end'}
                            onClick={handleOpenImageOrVideo}
                        />
                        <Flex alignSelf={'flex-end'} justifyContent={'space-between'} w={{base: '80%', md: '100%'}}>
                            <Box as="span" display="block" fontSize="xs" p={0} m={0} color={colorMode == "dark" ? "gray.300" : "gray.700"}>
                                {sendingTime}
                            </Box>
                            <Box alignSelf={'flex-end'} ml={1} color={message.isSending ? "" : message.seen ? "blue.700" : ""} fontWeight={'bold'}>
                                {message.isSending ? <IoTime /> : message.arrived ? <BsCheck2All size={16}/> : <IoMdCheckmark />}
                            </Box>
                        </Flex>
                    </Flex>
                )}

                {message.text && !message.img && !message.video?.videoUrl && (
                    <Flex maxW={'350px'} bg={'green.500'} p={1} borderRadius={'md'}>
                        <Flex flexDir={'column'}>
                            <Text 
                                p={0} 
                                m={0}
                                whiteSpace={'pre-wrap'}
                                overflowWrap={'anywhere'}
                                wordBreak={"break-word"}
                                hyphens={'auto'}
                            >
                                {message.text}
                            </Text>
                            <Flex alignSelf={'flex-end'}>
                                <Box as="span" display="block" fontSize="xs" p={0} m={0} color={colorMode == "dark" ? "gray.300" : "gray.700"}>
                                    {sendingTime}
                                </Box>
                                <Box 
                                    mr={lang === 'ar' && 1} 
                                    ml={lang !== 'ar' && 1} 
                                    color={message.isSending ? "" : message.seen ? "blue.700" : ""} 
                                    fontWeight={'bold'}
                                >
                                    {message.isSending ? <IoTime /> : message.arrived || message.seen ? <BsCheck2All size={16}/> : <IoMdCheckmark />}
                                </Box>
                            </Flex>
                        </Flex>
                    </Flex>
                )}

                {message.text && message.img && (
                    <Flex flexDir={'column'} gap={2} w={'100%'} minW={0}>
                        <Image 
                            src={message.img} 
                            maxW={{base: '80%', md: '200px'}} 
                            maxH={'150px'} 
                            minW={0}
                            w={'auto'}
                            flexShrink={1}
                            display={'block'}
                            borderRadius={'md'} 
                            objectFit={'contain'} 
                            alignSelf={'flex-end'}
                            onClick={handleOpenImageOrVideo}
                        />

                        <Flex justifyContent={'space-between'} maxW={{base: '80%', md: '350px'}} w={'100%'} minW={0} bg={'green.500'} p={1} borderRadius={'md'} alignSelf={'flex-end'}>
                            <Flex flexDir={'column'} maxW={'100%'} w={'100%'} minW={0}>
                                <Text 
                                    p={0} 
                                    m={0}
                                    whiteSpace={'pre-wrap'}
                                    overflowWrap={'anywhere'}
                                    wordBreak={"break-word"}
                                    hyphens={'auto'}
                                >
                                    {message.text}
                                </Text>
                                
                                <Flex alignSelf={'flex-end'}>
                                    <Box as="span" display="block" fontSize="xs" p={0} m={0} color={colorMode == "dark" ? "gray.300" : "gray.700"}>
                                        {sendingTime}
                                    </Box>
                                    <Box 
                                        mr={lang === 'ar' && 1} 
                                        ml={lang !== 'ar' && 1} 
                                        color={message.isSending ? "" : message.seen ? "blue.700" : ""} 
                                        fontWeight={'bold'}
                                    >
                                        {message.isSending ? <IoTime /> : message.arrived || message.seen ? <BsCheck2All size={16}/> : <IoMdCheckmark />}
                                    </Box>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                )}

                {!message.text && message.video?.videoUrl && !message.img && (
                    <Box 
                        position={'relative'}
                        ref={videoContainerRef}
                        onClick={(e) => {
                            e.preventDefault();
                            handleOpenImageOrVideo();
                        }}
                        maxH={'250px'}
                        maxW={{base: '80%', md: '200px'}}
                        mb={1}
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
                            src={message.video.videoUrl}
                            ref={videoRef}
                            style={{
                                objectFit: 'contain',
                                height: '100%',
                                width: '100%',
                                scrollSnapAlign: 'none',
                                borderRadius: '5px',
                                border: '0.2px solid #636363ff',
                                backgroundColor: '#1a1919de'
                            }}
                        />

                        <Flex justifyContent={'space-between'}>
                            <Box as="span" display="block" fontSize="xs" p={0} m={0} color={colorMode == "dark" ? "gray.300" : "gray.700"}>
                                {sendingTime}
                            </Box>
                            <Box alignSelf={'flex-end'} ml={1} color={message.isSending ? "" : message.seen ? "blue.700" : ""} fontWeight={'bold'}>
                                {message.isSending ? <IoTime /> : message.arrived ? <BsCheck2All size={16}/> : <IoMdCheckmark />}
                            </Box>
                        </Flex>
                    </Box>
                )}

                {message.text && message.video?.videoUrl && !message.img && (
                    <Flex flexDir={'column'} alignItems={'flex-end'}>
                        <Box 
                            ref={videoContainerRef}
                            onClick={(e) => {
                                e.preventDefault();
                                handleOpenImageOrVideo();
                            }}
                            maxH={'250px'}
                            maxW={{base: '80%', md: '200px'}}
                            border={'0.2px solid gray'}
                            borderRadius={'md'}
                            bg={'gray.800'}
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
                                src={message.video.videoUrl}
                                ref={videoRef}
                                style={{
                                    objectFit: 'contain',
                                    height: '100%',
                                    width: '100%',
                                    scrollSnapAlign: 'none',
                                    borderRadius: '5px'
                                }}
                            />
                        </Box>

                        <Flex 
                            justifyContent={'space-between'} 
                            maxW={{base: '80%', md: '350px'}}
                            w={'100%'} 
                            bg={'green.500'} 
                            p={1} 
                            borderRadius={'md'} 
                            alignSelf={'flex-end'} 
                            mt={1}
                        >
                            <Flex flexDir={'column'} w={'100%'}>
                                <Text 
                                    p={0} 
                                    m={0}
                                    whiteSpace={'pre-wrap'}
                                    overflowWrap={'anywhere'}
                                    wordBreak={"break-word"}
                                    hyphens={'auto'}
                                >
                                    {message.text}
                                </Text>
                            
                                <Flex alignSelf={'flex-end'} w={'100'}>
                                    <Box as="span" display="block" fontSize="xs" p={0} m={0} color={colorMode == "dark" ? "gray.300" : "gray.700"}>
                                        {sendingTime}
                                    </Box>
                                    <Box 
                                        mr={lang === 'ar' && 1} 
                                        ml={lang !== 'ar' && 1} 
                                        color={message.isSending ? "" : message.seen ? "blue.700" : ""} 
                                        fontWeight={'bold'}
                                    >
                                        {message.isSending ? <IoTime /> : message.arrived || message.seen ? <BsCheck2All size={16}/> : <IoMdCheckmark />}
                                    </Box>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                    
                )}

                {message.audio?.url && (
                    <Flex dir='ltr'>
                        <Box h={'50px'} w={'40px'} bg={'green.500'} borderRadius={'50% 0 0 50%'} />
                        <Box 
                            bg={'green.500'} 
                            position={'relative'}
                            height={'50px'}
                            width={'200px'}
                        >
                            <audio 
                                src={message.audio.url}
                                ref={audioRef}
                                style={{
                                    height: '100%',
                                    width: '100%',
                                }} 
                                onEnded={() => setIsPlaying(false)}
                            />

                            <AudioControls 
                                audioRef={audioRef}
                                sender={currentUser}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                ownMessage={ownMessage}
                                currentDuration={null}
                                duration={message.audio?.duration}
                            />

                            <Flex 
                                justifyContent={'space-between'} 
                                alignItems={'flex-end'} 
                                h={'full'} 
                                ml={5} 
                                dir={lang === 'ar' ? "rtl" : "ltr"}
                            >
                                <Box 
                                    as="span" 
                                    display="block" 
                                    fontSize="11px" 
                                    p={0} 
                                    m={0} 
                                    color={colorMode == "dark" ? "gray.300" : "gray.700"}
                                >
                                    {sendingTime}
                                </Box>
                                <Box 
                                    alignSelf={'flex-end'} 
                                    ml={1} 
                                    color={message.isSending ? "" : message.seen ? "blue.700" : ""} 
                                    fontWeight={'bold'}
                                >
                                    {message.isSending ? <IoTime /> : message.arrived ? <BsCheck2All size={16}/> : <IoMdCheckmark />}
                                </Box>
                            </Flex>
                        </Box>
                        <Box h={'50px'} w={'20px'} bg={'green.500'} borderRadius={'0 50% 50% 0'} />
                    </Flex>
                )}

                <Avatar.Root w={7} h={7}>
                    <Avatar.Fallback name={currentUser.name}/>
                    <Avatar.Image src={currentUser.profilePic}/>
                </Avatar.Root>
            </Flex>
        ) : (
            <Flex
                gap={2}
                alignSelf={"flex-start"}
                mt={4}
                ref={isLastMessage ? messagesEndRef : null}
            >
                <Avatar.Root w={7} h={7}>
                    <Avatar.Fallback name=''/>
                    <Avatar.Image src={selectedConversation.userProfilePic}/>
                </Avatar.Root>

                {message.img && !message.text && (
                    <Flex flexDir={'column'}>    
                        <Image 
                            src={message.img} 
                            maxW={{base: '80%', md: '200px'}} 
                            maxH={'150px'} 
                            borderRadius={'md'} 
                            objectFit={'contain'} 
                            alignSelf={'flex-start'}
                            onClick={handleOpenImageOrVideo}
                            id='img'
                        />
                        <Box 
                            as="span" 
                            display="block" 
                            fontSize="xs" 
                            p={0} 
                            m={0} 
                            color={colorMode == "dark" ? "gray.300" : "gray.700"}
                        >
                            {sendingTime}
                        </Box>                        
                    </Flex>
                )}

                {message.text && !message.img && !message.video?.videoUrl && (
                    <Flex flexDir={'column'} maxW={'350px'} bg={'gray.400'} p={1} borderRadius={'md'}>
                            <Text 
                                color={'black'} 
                                pr={1}
                                whiteSpace={'pre-wrap'}
                                overflowWrap={'anywhere'}
                                wordBreak={"break-word"}
                                hyphens={'auto'}
                            >
                                {message.text}
                            </Text>
                            <Box as="span" display="block" fontSize="xs" p={0} m={0} color="gray.700">
                                {sendingTime}
                            </Box>
                    </Flex>
                )}

                {message.text && message.img && (
                    <Flex flexDir={'column'} gap={2}>
                        <Image 
                            src={message.img} 
                            maxW={{base: '80%', md: '200px'}} 
                            maxH={'150px'} 
                            borderRadius={'md'} 
                            objectFit={'contain'} 
                            alignSelf={'flex-start'}
                            onClick={handleOpenImageOrVideo}
                            id='img'
                        />

                        <Flex flexDir={'column'} maxW={{base: '80%', md: '350px'}} bg={'gray.400'} p={1} borderRadius={'md'} alignSelf={'flex-start'} w={'100%'}>
                            <Text 
                                color={'black'} 
                                pr={1}
                                whiteSpace={'pre-wrap'}
                                overflowWrap={'anywhere'}
                                wordBreak={"break-word"}
                                hyphens={'auto'}
                            >
                                {message.text}
                            </Text>
                            <Box as="span" display="block" fontSize="xs" p={0} m={0} color="gray.700">
                                {sendingTime}
                            </Box>
                        </Flex>
                    </Flex>
                )}

                {!message.text && message.video?.videoUrl && !message.img && (
                    <Box 
                        position={'relative'}
                        ref={videoContainerRef}
                        onClick={(e) => {
                            e.preventDefault();
                            handleOpenImageOrVideo();
                        }}
                        maxH={'250px'}
                        maxW={{base: '80%', md: '250px'}}
                        mb={1}
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
                            src={message.video.videoUrl}
                            ref={videoRef}
                            style={{
                                objectFit: 'contain',
                                height: '100%',
                                width: '100%',
                                scrollSnapAlign: 'none',
                                borderRadius: '5px',
                                border: '0.2px solid #636363ff',
                                backgroundColor: '#1a1919de'
                            }}
                        />

                        <Box as="span" display="block" fontSize="xs" p={0} m={0} color={colorMode == "dark" ? "gray.300" : "gray.700"}>
                            {sendingTime}
                        </Box>
                    </Box>
                )}

                {message.text && message.video?.videoUrl && !message.img && (
                    <Flex flexDir={'column'}>
                        <Box 
                            ref={videoContainerRef}
                            onClick={(e) => {
                                e.preventDefault();
                                handleOpenImageOrVideo();
                            }}
                            maxH={'250px'}
                            maxW={{base: '80%', md: '250px'}}
                            border={'0.2px solid gray'}
                            borderRadius={'md'}
                            bg={"gray.800"}
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
                                src={message.video.videoUrl}
                                ref={videoRef}
                                style={{
                                    objectFit: 'contain',
                                    height: '100%',
                                    width: '100%',
                                    scrollSnapAlign: 'none',
                                    borderRadius: '5px',
                                }}
                            />
                        </Box>

                        <Flex flexDir={'column'} maxW={{base: '80%', md: '350px'}} w={'100%'} bg={'gray.400'} p={1} borderRadius={'md'} alignSelf={'flex-start'} mt={1}>
                            <Text 
                                color={'black'} 
                                pr={1}
                                whiteSpace={'pre-wrap'}
                                overflowWrap={'anywhere'}
                                wordBreak={"break-word"}
                                hyphens={'auto'}
                            >
                                {message.text}
                            </Text>
                            <Box as="span" display="block" fontSize="xs" p={0} m={0} color="gray.700">
                                {sendingTime}
                            </Box>
                        </Flex>
                    </Flex>
                  
                )}

                {message.audio?.url && (
                    <Flex dir='ltr'>
                        <Box h={'50px'} w={'40px'} bg={colorMode === "dark" ? 'gray.600' : 'gray.400'} borderRadius={'50% 0 0 50%'} />
                        <Box 
                            bg={colorMode === "dark" ? 'gray.600' : 'gray.400'} 
                            position={'relative'}
                            height={'50px'}
                            width={'200px'}
                        >
                            <audio 
                                src={message.audio.url}
                                ref={audioRef}
                                style={{
                                    height: '100%',
                                    width: '100%',
                                }} 
                                onEnded={() => setIsPlaying(false)}
                            />

                            <AudioControls 
                                audioRef={audioRef}
                                sender={selectedConversation}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                ownMessage={ownMessage}
                                currentDuration={null}
                                duration={message.audio?.duration}
                            />

                            <Flex 
                                justifyContent={'space-between'} 
                                alignItems={'flex-end'} 
                                h={'full'} 
                                ml={5}
                                dir={lang === 'ar' ? "rtl" : "ltr"}
                            >
                                <Box 
                                    as="span" 
                                    display="block" 
                                    fontSize="11px" 
                                    p={0} 
                                    m={0} 
                                    color={colorMode == "dark" ? "gray.400" : "gray.700"}
                                >
                                    {sendingTime}
                                </Box>
                            </Flex>
                        </Box>
                        <Box h={'50px'} w={'20px'} bg={colorMode === "dark" ? 'gray.600' : 'gray.400'} borderRadius={'0 50% 50% 0'} />
                    </Flex>
                )}

            </Flex>
        )}

        <Dialog.Root size={'cover'} lazyMount open={open} onOpenChange={(e) => setOpen(e.open)}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Body pb={6}>

                            {imgUrl && (
                                <Flex mt={5} w={'full'} position={'relative'} h={'100%'} justifyContent={'center'} alignItems={'center'}>
                                    <Image src={imgUrl} alt='Selected image' objectFit={'contain'} maxH={'70vh'} alignSelf={'center'} justifySelf={'center'}/>
                                    <Button 
                                        variant={'plain'}
                                        size={'md'}
                                        position={'absolute'}
                                        top={0}
                                        left={0}
                                        onClick={() => {
                                            downloadBase64AsFile(message.img)
                                        }}
                                        data-testid={'download-btn'}
                                    >
                                        <DownloadIcon fontSize={20} />
                                    </Button>
                                </Flex>
                            )}

                            {videoUrl && (
                                <Flex mt={5} w={'full'} position={'relative'} h={'100%'} justifyContent={'center'} alignItems={'center'}>
                                    <Box 
                                        ref={videoContainerRef}
                                        h={'100%'}
                                        w={'100%'}
                                        objectFit={'contain'}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleOpenImageOrVideo();
                                        }}
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
                                            src={message.video.videoUrl}
                                            ref={videoRef}
                                            autoPlay
                                            style={{
                                                objectFit: 'contain',
                                                height: '100%',
                                                width: '100%',
                                                maxHeight: videoHeight,
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
                                            onPlay={() => {
                                                setIsPlaying(true);
                                                if(videoRef.current) videoRef.current.volume = volume[0] / 100;
                                            }}
                                        />
                                        
                                        {hover && (
                                            <VideoControls 
                                                videoRef={{ current: videoRef?.current }}
                                                videoContainerRef={{ current: videoContainerRef.current }}
                                                video={message.video}
                                                isPlaying={isPlaying}
                                                setIsPlaying={setIsPlaying}
                                                openFullSecreen={openFullSecreen}
                                                isFullscreen={isFullscreen}
                                                setIsFullscreen={setIsFullscreen}
                                            />
                                        )}

                                    </Box>
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

export default Message;
