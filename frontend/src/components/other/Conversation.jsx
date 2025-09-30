import { Avatar, Box, Circle, Flex, Float, Image, Stack, Text, WrapItem } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { useColorModeValue } from '../ui/color-mode'
import { useRecoilState, useRecoilValue } from 'recoil';
import userAtom from '@/atoms/userAtom';
import { BsCheck2All } from 'react-icons/bs';
import { selectedConversationAtom, unSeenMessagesAtom } from '@/atoms/messagesAtom';
import { IoCheckmark } from 'react-icons/io5';
import { langAtom } from '@/atoms/langAtom';

const Conversation = ({ conversation, isOnline, isWriting, isRecording }) => {
  const user = conversation.participants[0];
  const lastMessage = conversation.lastMessage;

  const [ unSeenMessagesCount, setUnSeenMessagesCount ] = useState(0);

  const currentUser = useRecoilValue(userAtom);
  const lang = useRecoilValue(langAtom);
  const [ unSeenMessages, setUnSeenMessages ] = useRecoilState(unSeenMessagesAtom);
  const [ selectedConversation, setSelectedConversation ] = useRecoilState(selectedConversationAtom);

  const bg = useColorModeValue('gray.600', 'gray.900');
  const textColor = useColorModeValue('white', 'white');

  useEffect(() => {
    if(unSeenMessages.length > 0){
      let i = 0
      unSeenMessages.forEach(message => {
        if(message.sender.username === user.username){
          i += 1
        };
      })
      setUnSeenMessagesCount(i);
    }
  }, [unSeenMessages, user.username]);
  return (
    <Flex
      alignItems={'center'}
      justifyContent={'space-between'}
      p={1} 
      _hover={{
          cursor: 'pointer', 
          bg: useColorModeValue('gray.600', 'gray.900'), 
          color: 'white'
      }}
      borderRadius={'md'}
      onClick={() => {
        setSelectedConversation({
          _id: conversation._id, 
          userId: user._id, 
          username: user.username, 
          userProfilePic: user.profilePic,
          mock: conversation.mock,
          isOpened: false,
        });
        setUnSeenMessagesCount(0);
        setUnSeenMessages(prev => {
          const updatedMessages = prev.filter(message => {
            return message.conversationId !== conversation._id;
          })
          return updatedMessages;
        })
      }}
      bg={conversation?._id === selectedConversation?._id ? bg : ""}
      color={conversation?._id === selectedConversation?._id ? textColor : ""}
    >

      <Flex
        gap={4} 
        alignItems={'center'}
      >
        <WrapItem>
          <Avatar.Root size={{
              base: 'xs',
              sm: 'sm',
              md: 'md'
          }}>
              <Avatar.Fallback name=''/>
              <Avatar.Image src={user.profilePic}/>
              {isOnline ? (
                <Float placement="bottom-end" offsetX="1.5" offsetY="1.5" data-testid={"online"}>
                  <Circle
                    bg="green.500"
                    size="0.6em"
                    outline="0.2em solid"
                    outlineColor="bg"
                  />
                </Float>
              ) : ""}
              
          </Avatar.Root>
        </WrapItem>

        <Stack 
          direction={'column'} 
          fontSize={'sm'} 
          >
          <Text fontWeight={700} display={'flex'} alignItems={'center'}>
            {user.username} 
            <Image 
              src='/verified.png' 
              w={4} 
              h={4} 
              ml={lang !== 'ar' && 1}
              mr={lang === 'ar' && 1}
            />
          </Text>

          <Text 
            as={'span'} 
            fontSize={'xs'} 
            display={'flex'} 
            alignItems={'center'} 
            gap={1} 
            color={isWriting || isRecording ? "green.500" : (conversation?._id === selectedConversation?._id ? 'gray.300' : 'gray.500')} 
            fontWeight={isWriting || isRecording ? "700" : ""} 
            letterSpacing={isWriting ? "0.5px" : ""}
          >
              {currentUser._id === lastMessage.sender && !isWriting ? (
                <Box color={lastMessage.seen? "blue.700" : ""}>
                  {conversation.lastMessage.sender && (conversation.lastMessage.arrived || conversation.lastMessage.seen) ? <BsCheck2All size={16} /> : <IoCheckmark size={16}/>}
                </Box>
              ) : ""}
              {isWriting && lang === 'ar' ? "يكتب..." 
              :isWriting && lang !== 'ar' ? "Writing ..." 
              :isRecording && lang === 'ar' ? "يسجل"
              :isRecording && lang !== 'ar' ? "Recording"
              :lang !== 'ar' ? (
                lastMessage.isVideo && !lastMessage.text ? "Video" 
                : lastMessage.isAudio ? "Voice message" 
                : !lastMessage.text && !conversation.mock && lastMessage.sender && !lastMessage.isVideo && !lastMessage.isAudio ? "Image" 
                : (lastMessage.text.length > 18 ? lastMessage.text.substring(0, 18) + '...' 
                : lastMessage.text)
              ) : lang === 'ar' && (
                lastMessage.isVideo && !lastMessage.text ? "فيديو" 
                : lastMessage.isAudio ? "رسالة صوتية" 
                : !lastMessage.text && !conversation.mock && lastMessage.sender && !lastMessage.isVideo && !lastMessage.isAudio ? "صورة" 
                : (lastMessage.text.length > 15 ? lastMessage.text.substring(0, 15) + '...' 
                : lastMessage.text)
              )}
          </Text>
        </Stack>
      </Flex>

      {unSeenMessagesCount > 0 ? (
        <Box>
            <Circle
              bg="yellow.500"
              size="1.6em"
              outlineColor="bg"
              fontWeight={'700'}
            >
              {unSeenMessagesCount}
            </Circle>
        </Box>
      ) : ""}

    </Flex>
  )
}


export default Conversation;
