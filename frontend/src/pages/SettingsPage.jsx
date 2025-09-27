import { langAtom } from '@/atoms/langAtom';
import userAtom from '@/atoms/userAtom';
import Divider from '@/components/other/Divider';
import { useColorMode, useColorModeValue } from '@/components/ui/color-mode';
import { Toaster } from '@/components/ui/toaster';
import useLogout from '@/hooks/useLogout';
import useShowToast from '@/hooks/useShowToast';
import { Box, Button, CloseButton, Dialog, Flex, HStack, Icon, IconButton, Portal, Switch, Text, Tooltip } from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { FaFlag, FaFlagUsa, FaMoon, FaSun } from 'react-icons/fa6';
import { useRecoilState } from 'recoil';

const SettingsPage = () => {
    const [ open, setOpen ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    const [ lang, setLang ] = useRecoilState(langAtom);
    const [ currentUser, setCurrentUser ] = useRecoilState(userAtom);
    
    const { showErrorToast, showSuccessToast } = useShowToast();
    const { logout } = useLogout();

    const { toggleColorMode } = useColorMode();

    const borderColor = useColorModeValue("gray.400", "#1e1e1e");
    const textBg = useColorModeValue("gray.300", "gray.900");

    const updateLang = useCallback(async() => {
        try {
            const res = await fetch(`/api/users/update/${currentUser._id}?lang=${lang}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ lang: lang })
            });
            const data = await res.json();

            if(data.error) return console.log(data.error);
        } catch (error) {
            console.log(error, 'error in updateLang');
        }
    }, [currentUser._id, lang]);

    const freezeAccount = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/freeze?lang=${lang}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if(data.error) return showErrorToast(data.error);

            if(data.success) {
                await logout();
                showSuccessToast(lang === 'ar' ? "تم تجميد حسابك بنجاح!" : 'Your account has been frozen successfully!');
            }
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : 'Something went wrong!'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        return () => {
            updateLang();
        }
    }, [updateLang]);

  return (
    <>
        <Toaster />

        <Flex mb={5} alignItems={'center'} justifyContent={'space-between'} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Text 
                fontWeight={'bold'} 
                border={'0.7px solid'} 
                borderColor={borderColor} 
                px={3}
                py={2} 
                borderRadius={'md'} 
                bg={textBg}
            >
                {lang === 'ar' ? 'اللغة (عربي/انجليزي)' : "Language (English/Arabic)"} 
            </Text>            

            <HStack gap={2}>
                <IconButton
                    aria-label="English"
                    onClick={() => {
                        setLang('en')
                        const updatedUser = {...currentUser, lang: 'en'};
                        setCurrentUser(updatedUser);
                        localStorage.setItem('user-sharex', JSON.stringify(updatedUser));
                    }}
                    variant={lang === 'en' ? 'solid' : 'ghost'}
                    py={2}
                    px={3}
                >
                    <FaFlagUsa /> English
                </IconButton>
            
            
                <IconButton
                    aria-label="العربية"
                    onClick={() => {
                        setLang('ar')
                        const updatedUser = {...currentUser, lang: 'ar'}
                        setCurrentUser(updatedUser);
                        localStorage.setItem('user-sharex', JSON.stringify(updatedUser));
                    }}
                    variant={lang === 'ar' ? 'solid' : 'ghost'}
                    py={2}
                    px={3}
                >
                    <FaFlag /> العربية
                </IconButton>
            </HStack>
        </Flex>

        <Divider />

        <Flex w={'full'} justifyContent={'space-between'} alignItems={'center'} my={5}>
            {lang !== 'ar' && (
                <Text 
                    fontWeight={'bold'} 
                    border={'0.7px solid'} 
                    borderColor={borderColor} 
                    px={3}
                    py={2} 
                    borderRadius={'md'} 
                    bg={textBg}
                >
                    Color Mode (dark/light)
                </Text>
            )}

            <Switch.Root size="lg" onCheckedChange={toggleColorMode}>
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb/>
                        <Switch.Indicator fallback={<Icon as={FaMoon} color="gray.500" />}>
                        <Icon as={FaSun} color="gray.400" />
                    </Switch.Indicator>
                </Switch.Control>
            </Switch.Root>

            {lang === 'ar' && (
                <Text 
                    fontWeight={'bold'} 
                    border={'0.7px solid'} 
                    borderColor={borderColor} 
                    px={3}
                    py={2} 
                    borderRadius={'md'} 
                    bg={textBg}
                >
                    وضع العرض (داكن/فاتح) 
                </Text>
            )}
        </Flex>

        <Divider />

        <Text mb={1} mt={5} fontWeight={'bold'} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {lang === 'ar' ? 'تجميد حسابك' : "Freeze Your Account"}
        </Text>

        <Text my={1} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {lang === 'ar' ? 'يمكنك إلغاء تجميد حسابك بمجرد إعادة تسجيل الدخول' : "You can unfreeze your account any time by logging in"}
        </Text>

        <Box dir={lang === 'ar' ? 'rtl' : 'ltr'} mb={5}>
            <Dialog.Root role="alertdialog" lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <Dialog.Trigger asChild alignSelf={'flex-start'}>
                    <Button size={'sm'} colorPalette={'red'} mt={2} data-testid={'first-freeze-btn'}>
                        {lang === 'ar' ? 'تجميد' : 'Freeze'}
                    </Button>
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
                                <Text as={'span'} fontSize={'md'}>
                                    {lang === 'ar' ? 
                                    "هذا الإجراء سيقوم بتجميد حسابك، نتيحة لذلك لن يستطيع المستخدمون الإطلاع على منشوراتك أو صفحتك الشخصية!"
                                    : "This action will freeze your account and the other users cannot see your posts or profile page!"}
                                    <Box pb={1}></Box>
                                    {lang === 'ar' ? 'يمكنك إلغاء تجميد حسابك بمجرد إعادة تسجيل الدخول!' : "You can unfreeze your account any time by logging in!"}
                                </Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline">{lang === 'ar' ? "إلغاء" : "Cancel"}</Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="red" onClick={freezeAccount} loading={loading} data-testid={'second-freeze-btn'}>
                                    {lang === 'ar' ? 'تجميد' : 'Freeze'}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>

        <Divider />

        <Flex 
            dir={lang === 'ar' ? "rtl" : "ltr"}
            mt={5}
            flexDirection={'column'}
            gap={3}
        >
            <Text 
                fontWeight={'bold'}
                fontSize={'lg'}
            >
                {lang === 'ar' ? "للاستفسارات أو الشكاوى أو الاقتراحات، يسعدنا تواصلكم معنا عبر:" 
                : "For inquiries, complaints, or suggestions, please feel free to contact us at:"}
            </Text>
            <Flex gap={2}>
                <Text fontWeight={'500'} textDecoration={'underline'}>
                    {lang === 'ar' ? "رقم الجوال السعودي:" : "Phone Number (KSA): "}
                </Text>
                <Text dir='ltr'>
                    0506 572 556
                </Text>
            </Flex>
            <Flex gap={2}>
                <Text fontWeight={'500'} textDecoration={'underline'}>
                    {lang === 'ar' ? "البريد الالكتروني: " : "Email Address: "}
                </Text>
                <Text>
                    karbanbaroudia@gmail.com
                </Text>
            </Flex>
        </Flex>
        
    </>
  )
}

export default SettingsPage
