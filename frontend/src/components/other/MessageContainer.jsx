import { Avatar, Box, Button, CloseButton, Flex, Image, Skeleton, SkeletonCircle, Text } from '@chakra-ui/react'
import React, { useEffect, useRef, useState } from 'react'
import { useColorMode, useColorModeValue } from '../ui/color-mode'
import Divider from './Divider'
import Message from './Message'
import MessageInput from './MessageInput'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { conversationsAtom, messagesAtom, selectedConversationAtom } from '@/atoms/messagesAtom'
import useShowToast from '@/hooks/useShowToast'
import userAtom from '@/atoms/userAtom'
import { useSocket } from '@/context/SocketContext'
import { groupMessagesByDate } from '@/utils/groupMessagesByDate'
import ThreeDotsLoading from './ThreeDotsLoading'
import { navigatedAtom } from '@/atoms/placeAtom'
import { langAtom } from '@/atoms/langAtom'
import SpikerLoading from './SpikerLoading'

const MessageContainer = ({ writingUserId, isOnline, recordingUserId }) => {
    const [ loading, setLoading ] = useState(true);
    const [ saving, setSaving ] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    
    const [ messages, setMessages ] = useRecoilState(messagesAtom);
    const [ selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const setConversations = useSetRecoilState(conversationsAtom);
    const setNavigated = useSetRecoilState(navigatedAtom);
    const currentUser = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);
    
    const { showErrorToast, showSuccessToast } = useShowToast();
    const { socket } = useSocket();

    const { colorMode } = useColorMode();

    const handleSaveConversation = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/messages/${selectedConversation.userId}/save?lang=${lang}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();

            if(data.error) return showErrorToast(data.error);

            setConversations(prev => {
                const updatedConversations = prev.map(conversation => {
                    if(conversation.participants[0]._id === selectedConversation.userId){
                        return {...conversation, _id: data.conversationId, mock: false}
                    };
                    return conversation;
                });
                return updatedConversations;
            });

            setSelectedConversation({...selectedConversation, _id: data.conversationId, mock: false});

            showSuccessToast(lang === 'ar' ? "تم الحفظ بنجاح!" : "User saved successfully!");
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
            console.log(error);
        } finally {
            setSaving(false);
        };
    };

    const handleDeleteConversation = () => {
        setConversations(prev => {
            const updatedConversations = prev.filter(conversation => {
                return selectedConversation.userId !== conversation.participants[0]._id;
            });
            return updatedConversations;
        });
        
        setSelectedConversation({
            _id: "",
            userId: "",
            username: "",
            userProfilePic: "",
            mock: false,
            isOpened: false
        });
    };

    useEffect(() => {
        const lastMessageIsFromOtherUser = messages.length && messages[messages.length - 1].sender !== currentUser._id;
        if(lastMessageIsFromOtherUser){
            socket.emit('markMessagesAsSeen', {
                conversationId: selectedConversation._id,
                userId: selectedConversation.userId
            });
        };

        socket.on('messagesSeen', ({conversationId}) => {
            if(selectedConversation._id === conversationId){
                setMessages(prev => {
                    const updatedMessages = prev.map(message => {
                        if(!message.seen){
                            return { ...message, seen: true}
                        }
                        return message;
                    })
                    return updatedMessages;
                })
            } 
        })

    }, [socket, currentUser._id, selectedConversation, messages, setMessages]);

    useEffect(() => {
        const getMessages = async () => {
            if(selectedConversation.isOpened) return;
            setLoading(true);
            setMessages([]);
            try {
                if(selectedConversation.mock) {
                    setSelectedConversation(prev => {
                        return {...prev, isOpened: true}
                    })
                    return;
                };
                
                if(selectedConversation._id.length !== 24){
                    setSelectedConversation({...selectedConversation, mock: true, isOpened: true});
                    setNavigated({isNavigated: false, user: {}})
                    return;
                }
                
                const res = await fetch(`/api/messages/${selectedConversation.userId}?lang=${lang}`);
                const data = await res.json();
                
                if(data.error) return showErrorToast(data.error);
                
                setMessages(data);
                inputRef.current?.focus();
                setSelectedConversation(prev => {
                    return {...prev, isOpened: true}
                });
                
                setNavigated({isNavigated: false, user: {}})
            } catch (error) {
                if(error.name === "AbortError"){
                    return;
                };
                showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
                setMessages([]);
            } finally {
                setLoading(false)
            }

        };
        
        getMessages();
        //eslint-disable-next-line
    }, [selectedConversation.username]);

    useEffect(() => {
        // making a bit of delay to waiting dom to be created; other then that's won't work      
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);

        if(writingUserId === selectedConversation?.userId){
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 10);
        }

        if(recordingUserId === selectedConversation?.userId){
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 10);
        }
        
        return () => clearTimeout(timeout);    
    }, [messages, selectedConversation.userId, writingUserId, recordingUserId]);

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <Flex
            flex={70}
            bg={useColorModeValue('white', 'gray.900')}
            borderRadius={'md'}
            flexDirection={'column'}
            p={2}
            boxShadowColor={'gray.900'}
            boxShadow={'2xl'}
            maxH={'500px'}
        >
            {/* Message header */}
            <Flex alignItems={'center'} justifyContent={'space-between'}>
                <Flex w={'full'} h={12} alignItems={'center'} gap={2}>
                    <Avatar.Root size={'sm'}>
                        <Avatar.Fallback name='' />
                        <Avatar.Image src={selectedConversation.userProfilePic} /> 
                    </Avatar.Root>
                    <Flex flexDir={'column'}>
                        <Text display={'flex'} alignItems={'center'}>
                            {selectedConversation.username} 
                            <Image 
                                src='/verified.png' 
                                w={4} 
                                h={4} 
                                ml={lang !== 'ar' && 1}
                                mr={lang === 'ar' && 1}
                            />
                        </Text>
                        <Text fontSize={'xs'} color={colorMode === "dark" ? "gray.400" : "gray.600"} fontWeight={'700'}>
                            {(isOnline && lang === 'ar' ? "متصل" 
                                :isOnline && lang !== 'ar' ? 'Online' 
                                :!isOnline && lang === 'ar' ? "غير متصل" 
                                :"Offline")}
                        </Text>
                    </Flex>
                </Flex>

                <CloseButton 
                    cursor={'pointer'} 
                    variant={'subtle'} 
                    borderRadius={'50%'}
                    onClick={() => {
                        setSelectedConversation({
                            _id: "", 
                            userId: "", 
                            username: "", 
                            userProfilePic: "",
                            mock: false,
                            isOpened: false,
                        });
                        setMessages([]);
                    }} 
                />
            </Flex>

            <Divider />

            <Flex flexDir={'column'} my={4} p={2} height={'400px'} overflowY={'auto'} position={'relative'}>
                {loading && (
                    [...Array(6)].map((_, i) => (
                        <Flex
                            key={i}
                            gap={2}
                            alignItems={'center'}
                            p={1}
                            borderRadius={'md'}
                            alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"} 
                            mt={4}
                            
                        > 
                            {i % 2 === 0 && <SkeletonCircle size={7}/>}
                            <Flex flexDir={'column'} gap={2}>
                                <Skeleton h={'8px'} w={'250px'}/>
                                <Skeleton h={'8px'} w={'250px'}/>
                            </Flex>
                            {i % 2 !== 0 && <SkeletonCircle size={7}/>}
                        </Flex>
                    ))
                )}
                
                {selectedConversation.mock ? (
                    <>
                        <Text className='warningText' textAlign={'center'} color={'red.500'}>
                            {lang === 'ar' ? "اذا لم ترسل أي رسالة الى هذا المستخدم، سيتم حذفه من محادثاتك بمجرد إعادة تحميل الصفحة!" 
                            : "If you don't send any messages to this user, it will be removed when you refresh your browser!"}
                        </Text>
                        <Flex justifyContent={'center'} alignItems={'center'} w={'full'} mt={1} gap={1}>
                            <Button 
                                variant={'outline'} 
                                w={'50%'} colorPalette={'red'}
                                onClick={handleDeleteConversation}
                            >
                                {lang === 'ar' ? "حذف" : "Delete"}
                            </Button>

                            <Button 
                                variant={'outline'} 
                                w={'50%'} 
                                colorPalette={'green'}
                                onClick={handleSaveConversation}
                                loading={saving}
                            >
                                {lang === 'ar' ? "حفظ" : "Save"}
                            </Button>
                        </Flex>
                    </>
                ) : ""}

                <Flex flexDir={'column'} h={'full'} justifyContent={'space-between'}>
                    <Flex flexDir={'column'}>
                        {!loading && Object.entries(groupedMessages).map(([date, mesgs]) => (
                            <Flex key={date} flexDir={'column'} position={'relative'}>
                                <Box alignSelf={'center'} mt={4} position={date !== 'Today' ? 'sticky' : ''} top={0} zIndex={1}>
                                    <Text fontSize={'sm'} bg={'blue.500'} px={5} py={1} borderRadius={'md'} color={'gray.200'}>
                                        {date}
                                    </Text>
                                </Box>
                                
                                {mesgs.map((message, idx) => (
                                    <Message 
                                        key={message._id} 
                                        message={message}
                                        ownMessage={currentUser._id === message.sender}
                                        isLastMessage={idx === mesgs.length - 1}
                                        messagesEndRef={messagesEndRef}
                                    />
                                ))}
                            </Flex>
                        ))}
                    </Flex>

                    {writingUserId === selectedConversation?.userId && messages ? (
                        <Flex alignItems={'center'} justifyContent={'flex-start'} gap={2} position={'relative'} bottom={'0px'} ref={messagesEndRef}>
                            <Avatar.Root w={7} h={7} justifySelf={'flex-start'}>
                                <Avatar.Fallback name=''/>
                                <Avatar.Image src={selectedConversation.userProfilePic}/>
                            </Avatar.Root>
                            <Flex bg={'gray.400'} borderRadius={'md'} p={1} mt={4} px={2}>
                                <ThreeDotsLoading />
                            </Flex>
                        </Flex>
                    ) : ""}

                    {recordingUserId === selectedConversation?.userId && messages ? (
                        <Flex alignItems={'center'} justifyContent={'flex-start'} gap={2} position={'relative'} bottom={'0px'} ref={messagesEndRef}>
                            <Avatar.Root w={7} h={7} justifySelf={'flex-start'}>
                                <Avatar.Fallback name=''/>
                                <Avatar.Image src={selectedConversation.userProfilePic}/>
                            </Avatar.Root>
                            <Flex borderRadius={'md'} p={0} mb={1.5} mt={4}>
                                <SpikerLoading />
                            </Flex>
                        </Flex>
                    ) : ""}
                    

                    {/*<Box ref={messagesEndRef} h={0} m={0} p={0} />*/}
                </Flex>
                
                
            </Flex>

            <MessageInput inputRef={inputRef} messagesEndRef={messagesEndRef} />
        </Flex>
  )
}

export default MessageContainer;
