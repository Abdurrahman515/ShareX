import { Button, CloseButton, Dialog, Image, Portal, Tabs } from '@chakra-ui/react';
import React, { useState } from 'react'
import { useColorMode, useColorModeValue } from '../ui/color-mode';
import { AddIcon } from '@chakra-ui/icons';
import { BsPostcardFill } from 'react-icons/bs';
import CreateReel from './CreateReel';
import CreatePost from './CreatePost';
import { useRecoilValue } from 'recoil';
import { outOfReelsPageAtom } from '@/atoms/placeAtom';
import { langAtom } from '@/atoms/langAtom';

const CreateReelOrPost = () => {
    const outOfReelsPage = useRecoilValue(outOfReelsPageAtom);
    const lang = useRecoilValue(langAtom);
    
    const [ open, setOpen ] = useState(false);
    
    const { colorMode } = useColorMode();

    return (
        <>
            <Dialog.Root lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? "rtl" : "ltr"}>
                <Dialog.Trigger asChild>
                    <Button
                        position={'fixed'}
                        bottom={5}
                        right={5}
                        bg={useColorModeValue("gray.300", "gray.900")}
                        variant={'outline'} 
                        size={{base: 'sm', md: "md"}}
                    >
                    <AddIcon />
                </Button>
                </Dialog.Trigger>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                
                                <Tabs.Root defaultValue={outOfReelsPage? "post" : "reel"} w={'full'}>
                                    <Tabs.List>
                                        <Tabs.Trigger flex={50} value="post" dir={lang === 'ar' ? "rtl" : "ltr"}>
                                            <BsPostcardFill size={'18'}/>
                                            {lang === 'ar' ? "إنشاء منشور" : "Create Post"}
                                        </Tabs.Trigger>
                                        <Tabs.Trigger flex={50} value="reel" dir={lang === 'ar' ? "rtl" : "ltr"}>
                                            <Image 
                                                src={colorMode === "dark" ? "/reels-icon-dark.svg" : "/reels-icon-light.svg"} 
                                                w={6} 
                                                h={6} 
                                                cursor={'pointer'}
                                            />
                                            {lang === 'ar' ? "إنشاء مقطع قصير (ريلز)" : "Create Reel"}
                                        </Tabs.Trigger>
                                    </Tabs.List>

                                    <Tabs.Content value="post">
                                        <CreatePost setOpen={setOpen}/>
                                    </Tabs.Content>

                                    <Tabs.Content value="reel">
                                        <CreateReel setOpen={setOpen} />
                                    </Tabs.Content>
                                </Tabs.Root>
                                
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
                </Dialog.Root>
        </>
    )
}

export default CreateReelOrPost
