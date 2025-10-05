import { Box, Button, Circle, Flex, Float, Image, Popover, Portal, Text, WrapItem } from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { useColorMode } from '../ui/color-mode';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import userAtom from '@/atoms/userAtom';
import { AiFillHome } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import useLogout from '@/hooks/useLogout';
import { FiLogOut } from 'react-icons/fi';
import authScreenAtom from '@/atoms/authAtom';
import { BsFillChatQuoteFill } from 'react-icons/bs';
import { IoPersonCircleOutline } from 'react-icons/io5';
import { IoMdSettings } from 'react-icons/io';
import useShowToast from '@/hooks/useShowToast';
import { unSeenMessagesAtom } from '@/atoms/messagesAtom';
import { isClosedAtom, outOfChatPageAtom } from '@/atoms/placeAtom';
import { MdPersonSearch } from 'react-icons/md';
import { langAtom } from '@/atoms/langAtom';

const Header = () => {
  const user = useRecoilValue(userAtom);
  const lang = useRecoilValue(langAtom);
  const isClosed = useRecoilValue(isClosedAtom);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const unSeenMessages = useRecoilValue(unSeenMessagesAtom);
  const outOfChatPage = useRecoilValue(outOfChatPageAtom);

  const [ open, setOpen ] = useState(false);
  const [ open2, setOpen2 ] = useState(false);
  
  const { showSuccessToast } = useShowToast();
  const { logout, loading } = useLogout();

  const { colorMode, toggleColorMode } = useColorMode();
  
  const handleOpenPop = useCallback(() => {
    if(localStorage.getItem('first-entry')){
      return;
    } else {
      setOpen(true);
      localStorage.setItem('first-entry', 'done');
    }
  }, []);

  const handleOpenPop2 = useCallback(() => {
    if(localStorage.getItem('first-entry-chat-2')) return; 
    if(!isClosed) return;
    
    setOpen2(true);
    localStorage.setItem('first-entry-chat-2', 'done');
  }, [isClosed]);

  useEffect(() => {
    handleOpenPop2();
  }, [handleOpenPop2]);

  useEffect(() => {
    handleOpenPop();
  } ,[handleOpenPop]);

  return (
    <Flex justifyContent={"space-between"} alignItems={'center'} mt={6} mb='12' dir='ltr'>
      {user && (
        <Flex alignItems={'center'} gap={4}>
          <Link to={'/'}>
            <AiFillHome size={24}/>
          </Link>
        </Flex>
      )}
      
      {!user && (
        <Link to={'/auth'} onClick={() => {setAuthScreen("login")}}>
          {lang === 'ar' ? "تسجيل الدخول" : "Login"}
        </Link>
      )}

      {user && (
        <Link to={'/reels'}>
          <Image 
            src={colorMode === "dark" ? "/reels-icon-dark.svg" : "/reels-icon-light.svg"} 
            w={8} 
            h={8} 
            cursor={'pointer'}
          />
        </Link>
      )}

      {user && (
        <Link to={`/${user.username}`}>
          <IoPersonCircleOutline size={30}/>
        </Link>
      )}


      <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Popover.Trigger asChild onClick={(e) => {e.preventDefault()}}>
          <Image 
            cursor={"pointer"}
            alt='logo'
            w={12}
            src={colorMode === "dark" ? "/light-logo.svg" : "/dark-logo.svg"}
            onClick={toggleColorMode}
          />
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Body dir={lang === 'ar' ? "rtl" : "ltr"}>
                <Flex direction={'column'}>
                  <Text fontSize={'md'}>
                    {lang === 'ar' ? 'اضغط على الشعار للتبديل بين الوضع الداكن والفاتح' 
                    : "Click the logo to toggle between light and dark mode"}
                  </Text>
                  <Button 
                    variant={'outline'} 
                    mt={3} 
                    size={'sm'} 
                    alignSelf={'flex-end'} 
                    colorPalette={'green'} 
                    onClick={() => setOpen(false)}
                  >
                      {lang === 'ar' ? "حسنا" : "ok"}
                  </Button>
                </Flex>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
      

      {user && (
        <Link to={`/chat`}>  
          <Box position={'relative'} m={0} p={0}>
            <BsFillChatQuoteFill size={24}/>
            {outOfChatPage && unSeenMessages.length > 0 ? (
              <Float placement="top-end" offsetX="-1" offsetY="0">
                <Circle
                  bg="yellow.500"
                  size="1.6em"
                  outline="0.2em solid"
                  outlineColor="bg"
                  fontWeight={'700'}
                >
                  {unSeenMessages.length > 99 ? '+99' : unSeenMessages.length}
                </Circle>
              </Float>
            ) : ""}
          </Box>
        </Link>
      )}

      {user && (
        <Flex direction={'column'} gap={0}>
          <Link to={'/search'}>
            <MdPersonSearch size={32}/>
          </Link>

          <Popover.Root open={open2} onOpenChange={(e) => setOpen2(e.open)}>
            <Popover.Trigger asChild onClick={(e) => {e.preventDefault();}}>
              <Box h={0} w={'100%'} p={0} m={0} />
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content>
                  <Popover.Arrow />
                  <Popover.Body>
                    <Flex>
                      <Text fontSize={'md'}>
                        {lang === 'ar' ? "إن لم تكن متأكدا من الاسم يمكنك البحث من هنا بكتابة الجزء الذي تتذكره، سواء من الاسم الكامل او المستعار" 
                        : "or if you're not sure about the name, you can search here by typing the part you remember, whether from the full name or username"}
                      </Text>
                      <Button 
                        variant={'outline'} 
                        mt={3} 
                        size={'sm'} 
                        alignSelf={'flex-end'} 
                        colorPalette={'green'} 
                        onClick={() => {
                          setOpen2(false);
                        }}
                      >
                        {lang === 'ar' ? "حسنا" : "ok"}
                      </Button>
                    </Flex>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </Flex>
      )}

      {user && (
        <Flex alignItems={'center'} gap={4}>
          <Link to={'/settings'}>
            <IoMdSettings size={27}/>
          </Link>

          <Button size={'xs'} loading={loading} variant={'outline'} onClick={() => {logout(); showSuccessToast(lang === "ar" ? "تم تسجيل الخروج بنجاح!" : 'Logged out successfully!')}}>
              <FiLogOut size={24}/>
          </Button>
        </Flex>
      )}

      {!user && (
        <Link to={'/auth'} onClick={() => {setAuthScreen("signup")}}>
          {lang === 'ar' ? 'إنشاء حساب' : "Signup"}
        </Link>
      )}
    </Flex>
  )
}

export default Header
