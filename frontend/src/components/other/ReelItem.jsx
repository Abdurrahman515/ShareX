import { currentVideosAtom, hasMoreAtom, pageAtom, targetIdAtom, videosAtom, volumeAtom } from '@/atoms/reelsAtom';
import useGetFeedReels from '@/hooks/useGetFeedReels';
import { Box, Flex, Skeleton, SkeletonCircle, SkeletonText, Text } from '@chakra-ui/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FaFaceSadTear } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useColorModeValue } from '../ui/color-mode';
import useShowToast from '@/hooks/useShowToast';
import { Toaster } from '@/components/ui/toaster'
import VideoControls from './VideoControls';
import VideoOverlay from './VideoOverlay';
import VideoActions from './VideoActions';
import { outOfReelsPageAtom } from '@/atoms/placeAtom';
import { langAtom } from '@/atoms/langAtom';

const ReelItem = () => {
    const [ loadingOne, setLoadingOne ] = useState(true);
    const [ isPlaying, setIsPlaying ] = useState(true);
    const [ isFirstEntry, setIsFirtsEntry ] = useState(true);
    
    const [ currentVideos, setCurrentVideos ] = useRecoilState(currentVideosAtom);
    const [ videos, setVideos ]  = useRecoilState(videosAtom);
    const [ targetId, setTargetId ] = useRecoilState(targetIdAtom);
    const [ hasMore, setHasMore ] = useRecoilState(hasMoreAtom);
    const [ page, setPage ] = useRecoilState(pageAtom);
    const volume = useRecoilValue(volumeAtom);
    const lang = useRecoilValue(langAtom);
    const setOutOfReelsPage = useSetRecoilState(outOfReelsPageAtom);

    const { getFeedVideos, loading } = useGetFeedReels();
    const { showErrorToast } = useShowToast();
    
    const { id: videoId } = useParams();

    let video;
    let videoIdx;
    if(videos.length > 0){
        video = videos.find(v => v._id === videoId);
        videoIdx = videos.findIndex(v => v._id === videoId);
    }

    const videoRefs = useRef({}); // id => element
    const suppressAutoNavRef = useRef(false);
    
    const navigate = useNavigate();
    
    const skeletonColor = useColorModeValue("gray.400", "gray.700");
    const endMessageBg = useColorModeValue("gray.300", "gray.700");

    //eslint-disable-next-line
    const isTest = process.env.NODE_ENV === 'test';

    useEffect(() => {
        setOutOfReelsPage(false);
        setIsFirtsEntry(true);

        return () => {
            setOutOfReelsPage(true);
            setIsFirtsEntry(false);
        }
    }, [setOutOfReelsPage]);

    useEffect(() => {
        if(!isFirstEntry) return;

        setVideos([]);
        setCurrentVideos([]);
        setPage(1);
        setHasMore(true);
        
    }, [isFirstEntry, setCurrentVideos, setHasMore, setPage, setVideos]);

    const getReelVideo = useCallback( async () => {
        if(videos[0]) return;
        setLoadingOne(true);
        try {
            const res = await fetch(`/api/videos/reel/${isTest ? 'v8' : videoId}?lang=${lang}`);
            const data = await res.json();

            if(data.error) return showErrorToast(data.error);

            setVideos([data]);
            setCurrentVideos([data]);
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : 'Something went wrong!'));   
        } finally {
            setLoadingOne(false);
        };

        //eslint-disable-next-line
    }, [setVideos, videoId, showErrorToast, videos, setCurrentVideos, lang]);
    
    useEffect(() => {
        if(!videos[0]) {
            getReelVideo();
        }
    }, [getReelVideo, videos]);
    
    useEffect(() => {
        if(!videoId || !videos[0]) return;

        if(!currentVideos[0]) {
            setCurrentVideos([videos[0]]);
        };

        const next = videos[videoIdx + 1];
        if(next && !currentVideos.some(v => v?._id === next._id)) {
            setCurrentVideos(prev => [...prev, videos[videoIdx + 1]]);
        };

        if(!next && hasMore && !loading){
            getFeedVideos(page);
        };

    }, [videoId, videoIdx, videos, currentVideos, video, getFeedVideos, hasMore, loading, page, setCurrentVideos]);

    useEffect(() => {
        if(loading) {
            setCurrentVideos(prev => {
                return [...prev, { _id: 'loading', video: '' }];
            });
        }else {
            setCurrentVideos(prev => prev.filter(v => v?._id !== 'loading'));
        };
    }, [loading, setCurrentVideos]);

    useEffect(() => {
        if(!videos[videoIdx + 1] && !hasMore && !loading) {
            setCurrentVideos(prev => {
                if(!prev[0]) return prev;
                if(prev.some(v => v._id === 'no-more')) return prev;
                return [...prev, { _id: 'no-more', video: '' }];
            });
        } else {
            setCurrentVideos(prev => {
                if(!prev[0]) return prev;
                return prev.filter(v => v?._id !== 'no-more')
            });
        }
    }, [hasMore, loading, videos, videoIdx, setCurrentVideos]);

    useEffect(() => {
        if(!videoId || !video) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
                if(suppressAutoNavRef.current) return;

                entries.forEach(entry => {
                    const vidEl = entry.target;
                    const vidId = vidEl.dataset.id;

                    if(entry.isIntersecting && entry.intersectionRatio >= 0.5){
                        if(vidEl.tagName !== 'VIDEO') return;
                        if(vidId === 'loading' || vidId === 'no-more') return;
                        
                        vidEl.play();
                        vidEl.volume = volume[0] / 100;
                        
                        setTimeout(() => {
                            setIsPlaying(true);
                            vidEl.muted = false;
                        } , 100);
                        setIsPlaying(true);

                        if(vidId && vidId !== videoId && vidId !== 'loading' && vidId !== 'no-more' && !targetId) {
                            navigate(`/reels/reel/${vidId}`, { replace: true });
                        };

                        if(vidId && vidId !== videoId && vidId !== 'loading' && vidId !== 'no-more' && targetId){
                            navigate(`/reels/reel/${targetId}`, { replace: true });
                        }

                        Object.values(videoRefs.current).forEach(v => {
                            if(v && v !== vidEl) {
                                v.pause();
                                v.currentTime = 0;
                                //setIsPlaying(false);
                            }
                        });
                    } else {
                        vidEl.pause();
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.5 }
        );
        
        const videoRefsCurrent = Object.values(videoRefs.current);
        
        videoRefsCurrent.forEach(video => {
            if(video) observer.observe(video);
        });


        return () => {
            videoRefsCurrent.forEach(video => {
                if (video) observer.unobserve(video);
            });
            observer.disconnect()
        };
    }, [videoId, navigate, video, videoIdx, currentVideos, volume, targetId]);

    useEffect(() => {
        try {
            if(videoId !== videoRefs.current[targetId] && targetId){
                const videoToHandle = videoRefs.current[targetId];
                if(videoToHandle){
                    videoToHandle.scrollIntoView();
                    videoToHandle.play();
                    videoToHandle.volume = volume[0] / 100;
                    setTimeout(() => {
                        videoToHandle.muted = false;
                    }, 150);
                    
                    setTargetId(null);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }, [videoId, targetId, setTargetId, volume]);

    if(!video) return;
    
    return (
        <>
            <Toaster />
            {currentVideos.length > 0 && currentVideos.map((vid) => (
                <Flex key={vid._id} justifyContent={'center'} alignItems={'self-end'} gap={4}>
                    <Box h={'100vh'} w={'100%'} borderRadius={'md'} position={'relative'}>
                        <video 
                            src={vid.video}
                            loop
                            data-id={vid._id}
                            ref={(el) => {
                                if(el){
                                    videoRefs.current[vid._id] = el;
                                } else {
                                    delete videoRefs.current[vid._id];
                                }
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px', position: 'absolute' }}
                            onClick={() => {
                                const el = videoRefs.current[vid._id];
                                if (!el) return;
                                if (el.paused) {
                                    el.play();
                                    setIsPlaying(true);
                                } else {
                                    el.pause();
                                    setIsPlaying(false);
                                }
                            }}
                        />

                        {vid._id !== "loading" && vid._id !== "no-more" && (
                            <>
                                <VideoControls 
                                    videoRef={ { current: videoRefs.current[vid._id] } } 
                                    video={vid} 
                                    isPlaying={isPlaying} 
                                    setIsPlaying={setIsPlaying} 
                                    suppressAutoNavRef={suppressAutoNavRef}
                                    postedBy={vid.postedBy}
                                />
                                <VideoOverlay video={vid} />
                            </>
                        )}
                        
                        <Box bg={'gray.700'} position={'absolute'} w={"100%"} h={'100vh'} zIndex={9} hidden={vid._id !== "loading"} />
                        <Flex position={"absolute"} zIndex={10} h={"100vh"} w={"100%"} hidden={vid._id !== "loading"}>
                            <Skeleton height="100vh" width="100%" borderRadius={'md'}/>
                            <Flex position={'absolute'} bottom={'2%'} w={'80%'} gap={2}> 
                                <SkeletonCircle size="10" bg={skeletonColor} w={'full'} ml={lang !== 'ar' && 3} mr={lang === 'ar' && 3}/>
                                <SkeletonText noOfLines={2} spacing="4" bg={skeletonColor} w={'full'}/>
                            </Flex>
                        </Flex>

                        <Box w={'full'} height={'100vh'} bg={endMessageBg} mt={5} borderRadius={'md'} position={'absolute'} hidden={vid._id !== 'no-more'} zIndex={10} m={0}>
                            <Flex direction={'column'} alignItems={'center'} justifyContent={'center'} height={'100%'} gap={4}>
                                <Box color={'gray.500'}>
                                    <FaFaceSadTear size={70}/>
                                </Box>
                                    <Text fontSize={'2xl'} fontWeight={'bold'} color={'gray.500'}>
                                        {lang === 'ar' ? "لا يوجد مزيد من الفيديوهات!" 
                                        : "No more reels to show!"} 
                                    </Text>
                            </Flex>
                        </Box>          
                    </Box>

                    {vid._id !== "loading" && vid._id !== "no-more" && <VideoActions video={videos.find(v => v._id === vid._id)} />}
                    
                </Flex>
            ))}

            {loadingOne && (
                <Flex>
                    <Skeleton height="100vh" width="100%" borderRadius={'md'}/>
                    <Flex position={'absolute'} bottom={'1%'} w={'80%'} gap={2}> 
                        <SkeletonCircle size="10" bg={skeletonColor} w={'full'} ml={lang !== 'ar' && 3} mr={lang === 'ar' && 3}/>
                        <SkeletonText noOfLines={2} spacing="4" bg={skeletonColor} w={'full'}/>
                    </Flex>
                </Flex>
            )}
        </>
    );
};

export default ReelItem
