import { formatTime } from '@/utils/formatTime';
import { Avatar, Flex, IconButton, Slider, Text } from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { FaPlay } from 'react-icons/fa6'
import { IoIosPause } from 'react-icons/io';

const AudioControls = ({ audioRef, sender, isPlaying, setIsPlaying, ownMessage, isMessageInput, duration, currentDuration }) => {
    const [ progress, setProgress ] = useState([0]);
    
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };
    
    const handleSeek = (e) => {
        if (audioRef.current && audioRef.current.duration) {
            const val = e.value[0];
            audioRef.current.currentTime = (val / 100) * audioRef.current.duration;
            setProgress([val]);
        }
    };

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current && audioRef.current.duration) {
            setProgress([ (audioRef.current.currentTime / audioRef.current.duration) * 100 ]);
        }
    }, [audioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.addEventListener("timeupdate", handleTimeUpdate);

            return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, [audioRef, handleTimeUpdate]);

    return (
        <Flex position={'absolute'} h={'full'} w={'full'} alignItems={'center'}>
            {!isMessageInput && (
                <Avatar.Root ml={'-17%'} size={'md'}>
                    <Avatar.Fallback name={''} />
                    <Avatar.Image src={ownMessage ? sender.profilePic : sender.userProfilePic} />
                </Avatar.Root>
            )}

            <IconButton 
                variant={'plain'}
                size={'sm'}
                onClick={togglePlay}
            >
                {isPlaying ? <IoIosPause /> : <FaPlay cursor={'pointer'} />}
            </IconButton>

            <Slider.Root
                value={progress}
                onValueChange={handleSeek}
                size="sm"
                variant="solid"
                flex={90}
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

            <Text 
                ml={2} 
                fontSize={'xs'}
                fontWeight={'bold'}
                mr={isMessageInput && 2}
            >
                {(currentDuration && !isPlaying) ? currentDuration : (duration && !isPlaying) ? duration : (isPlaying) ? formatTime(audioRef.current?.currentTime) : formatTime(audioRef.current?.duration)}
            </Text>
        </Flex>
    )
}

export default AudioControls
