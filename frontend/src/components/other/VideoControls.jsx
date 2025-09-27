import { Box, Button, CloseButton, Dialog, Flex, HStack, IconButton, Menu, Portal, Slider, Text } from "@chakra-ui/react";
import { FaVolumeMute } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import { IoIosPause } from "react-icons/io";
import { BsVolumeDownFill, BsVolumeUpFill } from "react-icons/bs";
import { HiVolumeUp } from "react-icons/hi";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { currentVideosAtom, targetIdAtom, videosAtom, volumeAtom } from "@/atoms/reelsAtom";
import { useColorModeValue } from "../ui/color-mode";
import { LuCopy, LuPlay } from "react-icons/lu";
import { PiDotsThreeOutlineVerticalFill } from "react-icons/pi";
import useShowToast from "@/hooks/useShowToast";
import { DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import userAtom from "@/atoms/userAtom";
import { useNavigate } from "react-router-dom";
import { IoPlay } from "react-icons/io5";
import { MdOutlineFullscreen, MdOutlineFullscreenExit } from "react-icons/md";
import { formatTime } from "@/utils/formatTime";
import { langAtom } from "@/atoms/langAtom";

const VideoControls = ({ videoRef, isPlaying, setIsPlaying, video, suppressAutoNavRef, postedBy, videoContainerRef, openFullSecreen, isFullscreen, setIsFullscreen }) => {
    const [ progress, setProgress ] = useState([0]); 
    const [ hover, setHover ] = useState(false);
    const [ hover2, setHover2 ] = useState(false);
    const [ open, setOpen ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);

    const [ volume, setVolume ] = useRecoilState(volumeAtom);   
    const [ currentVideos, setCurrentVideos ] = useRecoilState(currentVideosAtom);
    const setVideos = useSetRecoilState(videosAtom); 
    const setTargetId = useSetRecoilState(targetIdAtom);
    const currentUser = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);

    const { showSuccessToast, showErrorToast } = useShowToast();

    const navigate = useNavigate();

    let videoUrl;
    if(window.location.pathname.startsWith('/reels/reel')){
        videoUrl = video?.video;
    } else {
        videoUrl = video?.videoUrl;
    };

    let darkColor;
    let lightColor;
    if(window.location.pathname.startsWith('/reels/reel')){
        darkColor = "gray.900";
        lightColor = "gray.300"; 
    };

    const hoverBg = useColorModeValue(lightColor, darkColor)

    const handleDeleteReel = async () => {
        if(!window.location.pathname.startsWith('/reels/reel')) return;
        if(!currentUser) return showErrorToast(lang === 'ar' ? "يجب عليك تسجيل الدخول أولا للحذف!" : "You must be logged in to delete!");
        setDeleting(true);
        try {
            const res = await fetch(`/api/videos/delete/${video._id}?lang=${lang}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();

            if(data.error) return showErrorToast(data.error);
            
            const idx = currentVideos.findIndex(v => v._id.toString() === data.videoId.toString());
            const nextVidId = currentVideos[idx + 1]?._id !== 'no-more' && currentVideos[idx + 1]?._id !== 'loading' ? currentVideos[idx + 1]?._id : null;
            const prevVidId = currentVideos[idx - 1]?._id !== 'no-more' && currentVideos[idx - 1]?._id !== 'loading' ? currentVideos[idx - 1]?._id : null;
            const target = nextVidId ? nextVidId : ( prevVidId ? prevVidId : null)
            setTargetId(nextVidId ? nextVidId : ( prevVidId ? prevVidId : null));

            if(suppressAutoNavRef) suppressAutoNavRef.current = true;

            setVideos(prev => {
                return prev.filter(v => v._id !== data.videoId) 
            });
            setCurrentVideos(prev => prev.filter(v => v._id !== data.videoId));
            
            if(target){
                navigate(`/reels/reel/${target}`, { replace: true });
            } else {
                navigate("/");
            }

            setTimeout(() => {
                if(suppressAutoNavRef) suppressAutoNavRef.current = false;
            }, 500);

            showSuccessToast(data.message);
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
            console.log(error);
        } finally {
            setDeleting(false);
            setOpen(false);
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current && videoRef.current.duration) {
            setProgress([ (videoRef.current.currentTime / videoRef.current.duration) * 100 ]);
        }
    }, [videoRef]);

    const handleSeek = (e) => {
        if (videoRef.current && videoRef.current.duration) {
            const val = e.value[0];
            videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
            setProgress([val]);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        if(volume[0] > 0) {
            videoRef.current.volume = 0;
            setVolume([0]);
        } else {
            videoRef.current.volume = 1;
            setVolume([100]);
        }
    };

    const handleVolumeChange = (e) => {
        if (videoRef.current) {
            const val = e.value[0];
            videoRef.current.volume = val / 100;
            setVolume([val]);
        }
    };

    const CopyUrl = () => {
        navigator.clipboard.writeText(`${window.location.href}`).then(()=>{
            showSuccessToast(lang === 'ar' ? "تم نسخ الرابط بنجاح!" : 'Link copied successfully!')
        });
    };

    const convertUrlToDownloadLink = (url) => {
        return url?.replace('/upload/', '/upload/fl_attachment/');
    };

    // the Link inside Post component renders a <a /> and this makes a warning when we use an <a> to download videos or images
    const handleDownload = (e) => { 
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const href = convertUrlToDownloadLink(videoUrl);
        if (!href) return;

        const a = document.createElement("a");
        a.href = href;
        a.setAttribute("download", ""); 
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.addEventListener("timeupdate", handleTimeUpdate);
            return () => video.removeEventListener("timeupdate", handleTimeUpdate);
        }
    }, [videoRef, handleTimeUpdate]);

    return (
        <Box position="absolute" top="0" right="0" bottom="0" left="0" pointerEvents="none" dir={'ltr'}>
            {!window.location.pathname.startsWith('/reels/reel') && (
                <Button 
                    pointerEvents={'auto'}
                    variant={'plain'}
                    size={'md'}
                    onClick={handleDownload}
                >
                    <DownloadIcon mr={1} fontSize={18}/>
                </Button>
            )}

            <Flex 
                justifyContent={!window.location.pathname.startsWith('/reels/reel') ? "flex-end" : "space-between"} 
                alignItems={'center'} 
                position={"absolute"} 
                top={!window.location.pathname.startsWith('/reels/reel') ? "" : "2"}
                bottom={!window.location.pathname.startsWith('/reels/reel') ? "1" : ""} 
                right="2" 
                pointerEvents="auto" 
                w={'full'}
            >
                {window.location.pathname.startsWith('/reels/reel') && (
                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <IconButton
                                variant={'ghost'}
                                rounded={'full'}
                                size="sm"
                                _hover={{ bg: hoverBg}}
                            >
                                <PiDotsThreeOutlineVerticalFill />
                            </IconButton>
                        </Menu.Trigger>
                        {currentUser?._id.toString() === postedBy?._id.toString() && (
                            <Box w={"full"} mb={1} fontSize={'md'} cursor={'pointer'} onClick={() => setOpen(true)}>
                                <DeleteIcon justifySelf={'flex-start'} data-testid={'delete-icon'} />
                            </Box>
                        )}
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

                                    <Menu.Item 
                                        value="download" 
                                        onClick={handleDownload}
                                    >
                                        <DownloadIcon mr={1}/>
                                        {lang === 'ar' ? "تنزيل" : "Download"}
                                    </Menu.Item>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu.Root>
                )}

                <HStack 
                    spacing={2} 
                    justifyContent={!window.location.pathname.startsWith('/reels/reel') && "flex-end"} 
                    w={!window.location.pathname.startsWith('/reels/reel') && 'full'} 
                    flexDirection={!window.location.pathname.startsWith('/reels/reel') && 'row-reverse'}
                >
                    {!window.location.pathname.startsWith('/reels/reel') && (
                        <Text px={2} py={1} w={'fit-content'} borderRadius={'md'} justifySelf={'flex-end'}>
                            {formatTime(videoRef.current?.currentTime)} / {formatTime(videoRef.current?.duration)}
                        </Text>
                    )}

                    <Flex 
                        position="relative" 
                        alignItems="center" 
                        gap={2}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                    >
                        {!window.location.pathname.startsWith('/reels/reel') && (
                            <IconButton
                                size="md"
                                p={2}
                                onClick={toggleMute}
                                colorScheme="teal"
                                aria-label="Mute / Unmute"
                                variant={"plain"}
                                rounded={'full'}
                                _hover={{ bg: hoverBg }}
                            >
                                {(volume[0] >= 70 ? <BsVolumeUpFill /> :volume[0] >=35 && volume[0] < 70 ? <HiVolumeUp /> :volume[0] < 35 && volume[0] > 0 ? <BsVolumeDownFill /> : <FaVolumeMute />)}
                            </IconButton>
                        )}

                        <Box
                            mt="0"
                            w={window.location.pathname.startsWith('/reels/reel') ? "300px" : "100px"}
                            bg={hoverBg}
                            py={!window.location.pathname.startsWith('/reels/reel') ? 0 : 3}
                            px={window.location.pathname.startsWith('/reels/reel') && 5}
                            borderRadius={'md'}
                            display={hover ? 'flex' : 'none'}
                        >
                            <Slider.Root
                                value={volume}
                                onValueChange={handleVolumeChange}
                                min={0}
                                max={100}
                                step={1}
                                size="sm"
                                variant="solid"
                                flex={93}
                                justifyContent={'center'}
                                gap={2}
                            >
                                <Slider.Control>
                                    <Slider.Track h={1}>
                                        <Slider.Range />
                                    </Slider.Track>
                                    <Slider.Thumbs h={3} w={3}/>
                                </Slider.Control>
                            </Slider.Root>

                            {window.location.pathname.startsWith('/reels/reel') && (
                                <Box flex={2}/>
                            )}

                            {window.location.pathname.startsWith('/reels/reel') && (
                                <Text flex={5}>
                                    {volume[0]}
                                </Text>
                            )}
                        </Box>

                        {window.location.pathname.startsWith('/reels/reel') && (
                            <IconButton
                                size="xl"
                                p={2}
                                onClick={toggleMute}
                                colorScheme="teal"
                                aria-label="Mute / Unmute"
                                variant={"ghost"}
                                rounded={'full'}
                                _hover={{ bg: hoverBg }}
                            >
                                {(volume[0] >= 70 ? <BsVolumeUpFill /> :volume[0] >=35 && volume[0] < 70 ? <HiVolumeUp /> :volume[0] < 35 && volume[0] > 0 ? <BsVolumeDownFill /> : <FaVolumeMute />)}
                            </IconButton>
                        )}
                    </Flex>

                    <IconButton
                        onClick={togglePlay}
                        colorScheme="teal"
                        aria-label="Play / Pause"
                        variant={!window.location.pathname.startsWith('/reels/reel') ? "plain" : 'ghost'}
                        borderRadius={'100%'}
                        rounded={'full'}
                        size="md"
                        fontSize={'sm'}
                        ml={!window.location.pathname.startsWith('/reels/reel') && '2'}
                        _hover={{ bg: hoverBg }}
                        data-testid={'play-btn'}
                    >
                        {isPlaying ? <IoIosPause /> :!window.location.pathname.startsWith('/reels/reel') ? <IoPlay /> : <LuPlay />}
                    </IconButton>
                </HStack>
                
                {!window.location.pathname.startsWith('/reels/reel') && isFullscreen ? (
                    <MdOutlineFullscreenExit
                        size={30} 
                        onClick={() => {
                            setIsFullscreen(false);
                            document.exitFullscreen();
                        }}
                    />
                ) :!window.location.pathname.startsWith('/reels/reel') && (
                    <MdOutlineFullscreen 
                        size={30} 
                        onClick={() => {
                            setIsFullscreen(true);
                            openFullSecreen(videoContainerRef.current);
                        }}
                    />
                )}
            </Flex>

            <Box 
                position="absolute" 
                bottom={!window.location.pathname.startsWith('/reels/reel') ? "10" : "0"} 
                left="0" 
                right="0" 
                pointerEvents="auto"
                onMouseEnter={() => setHover2(true)}
                onMouseLeave={() => setHover2(false)}
                pt={2}
            >
                <Slider.Root
                    value={progress}
                    onValueChange={handleSeek}
                    size="sm"
                    variant="solid"
                    w={'99%'}
                    mx={'auto'}
                >
                    <Slider.Control>
                        <Slider.Track h={1}>
                            <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumbs h={3} w={3} display={hover2 ? "block" : "none"}/>
                    </Slider.Control>
                </Slider.Root>
            </Box>

            <Dialog.Root role="alertdialog" lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? "rtl" : "ltr"}>
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
                                    {lang === 'ar' ? "هذا الإجراء سيحذف الفيديو الخاص بك ولا يمكن التراجع عنه!" 
                                    : "This action will remove your video and cannot be undone!"} 
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
                                    onClick={handleDeleteReel}
                                >
                                    {lang === 'ar' ? "حذف" : "Delete"}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="md" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>
    );
};

export default VideoControls;
