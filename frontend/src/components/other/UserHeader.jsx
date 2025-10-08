import { Avatar, Box, Button, CloseButton, Dialog, Flex, Image, Menu, Portal, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { BsFillChatQuoteFill } from 'react-icons/bs';
import { CgMoreO } from 'react-icons/cg';
import { LuCopy } from 'react-icons/lu';
import useShowToast from '@/hooks/useShowToast';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import userAtom from '@/atoms/userAtom';
import { Link as RouterLink, useNavigate} from 'react-router-dom';
import useFollowUnfollow from '@/hooks/useFollowUnfollow';
import { useColorModeValue } from '../ui/color-mode';
import { navigatedAtom } from '@/atoms/placeAtom';
import { sectionAtom } from '@/atoms/userPageAtom';
import { langAtom } from '@/atoms/langAtom';

const UserHeader = ({ user }) => {
    const currentUser = useRecoilValue(userAtom); // logged in user
    const lang = useRecoilValue(langAtom);
    const setNavigated = useSetRecoilState(navigatedAtom);
    const [ section, setSection ] = useRecoilState(sectionAtom);

    const [ open, setOpen ] = useState(false);

    const { showSuccessToast } = useShowToast();
    const { following, handleFollowUnfollow, loading} = useFollowUnfollow(user);

    const navigate = useNavigate();

    const hoverBg = useColorModeValue('gray.200', 'gray.900');

    const CopyUrl = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(()=>{
            showSuccessToast(lang === 'ar' ? "تم نسخ الرابط بنجاح!" : 'Link copied successfully!')
        });
    };

  return (
    <VStack gap={4} alignItems={'start'}>
        <Flex justifyContent={"space-between"} w={"full"}>
            <Box>
                <Text fontSize={"2xl"} fontWeight={'bold'}>
                    {user.name}
                </Text>
                <Text fontSize={"sm"}>{user.username}</Text>
            </Box>
            <Box>
                <Avatar.Root size={{base: 'xl', md: '2xl'}} onClick={() => {if(user.profilePic) setOpen(true)}} cursor={user.profilePic ? 'pointer' : 'default'}>
                    <Avatar.Fallback name={user.name} />
                    <Avatar.Image src={user.profilePic}/>
                </Avatar.Root>
            </Box>
        </Flex> 

        <Text>{user.bio}</Text>
        {currentUser?._id === user?._id && 
        (<RouterLink to='/update'>
            <Button variant={'outline'} size={'sm'}>
                {lang === 'ar' ? "تحديث الملف الشخصي" : "Update Profile"}
            </Button>
        </RouterLink>)}

        {currentUser?._id !== user?._id && 
        (<Button variant={'outline'} size={'sm'} onClick={handleFollowUnfollow} loading={loading}>
            {following && lang !== 'ar' ? "Unfollow" 
            :!following && lang !== 'ar' ? "Follow" 
            :following && lang === 'ar' ? "إلغاء المتابعة" 
            :"متابعة"}
        </Button>)}
        
        <Flex w={'full'} justifyContent={'space-between'}>
            <Flex gap={2} alignItems={'center'}>
                <Text color={'gray.500'}>
                    {user.followers.length} {lang === 'ar' && user.followers.length > 10 ? "متابع" 
                    :lang === 'ar' && user.followers.length <= 10 && user.followers.length !== 2 ? "متابعين" 
                    :lang === 'ar' && user.followers.length === 2  ? "متابعان" 
                    :"followers"}
                </Text>
            </Flex>
            <Flex>
                <Menu.Root>
                    <Menu.Trigger>
                        <Box className='icon-container' _hover={{bg: hoverBg}}>
                            <CgMoreO size={24} cursor={'pointer'}/>
                        </Box>
                    </Menu.Trigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content dir={lang === 'ar' ? "rtl" : "ltr"}>
                                <Menu.Item value='copy' onClick={CopyUrl}>
                                    <LuCopy />
                                    <Box flex={1}>
                                        {lang === 'ar' ? 'نسخ الرابط' : "Copy link"}
                                    </Box>
                                    <Menu.ItemCommand>⌘C</Menu.ItemCommand>
                                </Menu.Item>
                                {user?._id !== currentUser?._id && (
                                    <Menu.Item _hover={{bg: hoverBg}} onClick={() => {
                                            navigate('/chat');
                                            setNavigated({isNavigated: true, user: user});
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
                
            </Flex>
        </Flex>  
        <Flex w={'full'}>
            <Flex 
                flex={1} 
                borderBottom={section === 'posts' ? "1.5px solid white" : "1px solid gray"} 
                justifyContent={'center'} 
                color={section === 'posts'? "" : 'gray.500'}
                pb={3} 
                cursor={'pointer'}
                onClick={() => {
                    setSection('posts');
                }}
            >
                <Text fontWeight={'bold'}>{lang === 'ar' ? "المنشورات" : "Posts"}</Text>
            </Flex>
            <Flex 
                flex={1} 
                borderBottom={section === 'reels' ? "1.5px solid white" : "1px solid gray"} 
                justifyContent={'center'} 
                color={section === 'reels'? "" : 'gray.500'} 
                pb={3} 
                cursor={'pointer'}
                onClick={() => {
                    setSection("reels")
                }}
            >
                <Text fontWeight={'bold'}>{lang === 'ar' ? "الريلز" : "Reels"}</Text>
            </Flex>
        </Flex>

        <Dialog.Root size={'cover'} lazyMount open={open} onOpenChange={(e) => setOpen(e.open)}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Body pb={6}>
                            <Flex
                                mt={5} 
                                w={'full'} 
                                position={'relative'} 
                                h={'100%'} 
                                justifyContent={'center'} 
                                alignItems={'center'}
                            >
                                <Image 
                                    src={user?.profilePic} 
                                    alt={user?.name}
                                    objectFit={'contain'} 
                                    maxH={'70vh'} 
                                    alignSelf={'center'} 
                                    justifySelf={'center'}
                                />
                            </Flex>
                        </Dialog.Body>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    </VStack>
  )
}

export default UserHeader;
