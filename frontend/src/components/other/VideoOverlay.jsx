import { Avatar, Flex, Image, Text } from '@chakra-ui/react'
import React from 'react'
import { Link } from 'react-router-dom';
import { useColorModeValue } from '../ui/color-mode';
import { useRecoilValue } from 'recoil';
import { langAtom } from '@/atoms/langAtom';

const VideoOverlay = ({ video }) => {
    const user = video?.postedBy;

    const lang = useRecoilValue(langAtom);

    return (
        <Flex position={'absolute'} bottom={'10%'} left={lang !== 'ar' && '0'} right={lang === 'ar' && "0"}>
            <Flex alignItems={'flex-start'} gap={2}>

                <Link to={`/${user?.username}`}>
                    <Avatar.Root>
                        <Avatar.Image src={ user?.profilePic } />
                        <Avatar.Fallback name={ user?.name }/>
                    </Avatar.Root>
                </Link>

                <Flex flexDir={'column'} gap={2}>
                    <Link to={`/${user?.username}`}>
                        <Flex alignItems={'center'} w={'full'} fontWeight={'bold'} fontSize={'sm'}>
                            <Text fontWeight={'bold'} color={useColorModeValue("gray.600", "gray.400")}> 
                                { user?.username }
                            </Text>
                            <Image 
                                src='/verified.png' 
                                w={4} 
                                h={4} 
                                mt={1}
                                ml={lang !== 'ar' && 1}
                                mr={lang === 'ar' && 1} 
                            />
                        </Flex>
                    </Link>

                    <Text color={useColorModeValue("gray.700", "gray.300")} fontWeight={'700'}>
                        { video?.text }
                    </Text>
                </Flex>

            </Flex>
        </Flex>
    )
};

export default VideoOverlay;
