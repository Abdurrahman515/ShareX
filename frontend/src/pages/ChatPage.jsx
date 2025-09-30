import { conversationsAtom, messagesAtom, selectedConversationAtom } from '@/atoms/messagesAtom';
import userAtom from '@/atoms/userAtom';
import Conversation from '@/components/other/Conversation'; 
import MessageContainer from '@/components/other/MessageContainer';
import { useColorModeValue } from '@/components/ui/color-mode';
import { useSocket } from '@/context/SocketContext';
import useShowToast from '@/hooks/useShowToast';
import { SearchIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Input, Skeleton, SkeletonCircle, Text } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { GiConversation } from 'react-icons/gi';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Toaster } from '@/components/ui/toaster';
import { navigatedAtom, outOfChatPageAtom } from '@/atoms/placeAtom';
import { langAtom } from '@/atoms/langAtom';

const ChatPage = () => {
  const [ loading, setLoading ] = useState(true);
  const [ searchText, setSearchText ] = useState("");
  const [ searching, setSearching ] = useState(false);
  const [ done, setDone ] = useState(false);
  const [ writingUserId, setWritingUserId ] = useState("");
  const [ recordingUserId, setRecordingUserId ] = useState("");

  const conversationsEndRef = useRef(null);
  
  const [ conversations, setConversations ] = useRecoilState(conversationsAtom);
  const [ selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const navigated = useRecoilValue(navigatedAtom);
  const currentUser = useRecoilValue(userAtom);
  const lang = useRecoilValue(langAtom);
  const setMessages = useSetRecoilState(messagesAtom);
  const setOutOfChatPage = useSetRecoilState(outOfChatPageAtom);
  
  const { showErrorToast } = useShowToast();
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    setOutOfChatPage(false);

    return () => {
      setOutOfChatPage(true);
      setSelectedConversation({
        _id: "",
        userId: "",
        username: "",
        userProfilePic: "",
        mock: false,
        isOpened: false
      });
    }
  }, [setSelectedConversation, setOutOfChatPage]);

  useEffect(() => {
    try {      
      if(navigated.isNavigated){
        if(!done) return;
        const isConversationExist = conversations.filter(conversation => {
          return conversation.participants[0]._id === navigated.user._id
        });
        
        if(isConversationExist[0]){
          const user = isConversationExist[0].participants[0];
          setSelectedConversation({
            _id: isConversationExist[0]._id,
            userId: user._id,
            username: user.username,
            userProfilePic: user.profilePic,
            mock: false,
            isOpened: false
          });
  
        }else {
          if(!done) return;
          setSelectedConversation({
            _id: Date.now(),
            userId: navigated.user._id,
            username: navigated.user.username,
            userProfilePic: navigated.user.profilePic,
            mock: true,
            isOpened: false
          });
  
          setConversations([...conversations, {
              mock: true,
              _id: Date.now(),
              lastMessage: {
                text: "", 
                sender: "",
                isVideo: false,
                isAudio: false,
              }, 
              participants: [
                {
                  _id: navigated.user._id, 
                  username: navigated.user.username, 
                  profilePic: navigated.user.profilePic
                }
              ],
              createdAt: "", 
              updatedAt: "",
            }
          ]);
  
        }
   
      }
    } catch (error) {
      console.log(error)
    } 

  }, [conversations, navigated, setConversations, setSelectedConversation, done]);

  useEffect(() => {
    socket?.on('messagesSeen', ({ conversationId }) => {
      setConversations(prev => {
        const updatedConversations = prev.map(conversation => {
          if(conversation._id === conversationId){
            return {
              ...conversation,
              lastMessage: {
                ...conversation.lastMessage, 
                seen: true,
              }
            }
          }
          return conversation;
        })
        return updatedConversations;
      })
    })

    return () => socket?.off('messagesSeen');
  }, [socket, setConversations]);

  useEffect(() => {
    socket?.on('writing', ({ writingUserId }) => {
      setWritingUserId(writingUserId);
    });

    socket?.on('notWriting', () => {
      setWritingUserId("");
    });

    return () => {
      socket?.off("writing");
      socket?.off("notWriting");
    };
  }, [socket]);

  useEffect(() => {
    socket?.on("messageSent", ({ messageId, receiverId, message }) => {
      if(receiverId === selectedConversation.userId){
        setMessages(prev => {
            const updatedMessages = prev.map(message => {
                if(messageId === message._id){
                    return {...message, arrived: true}
                }
                return message;
            })
            return updatedMessages;
        });
      };
      
      setConversations(prev => {
        const updatedConversations = prev.map(conversation => {
          if(conversation._id === message.conversationId){
            return {...conversation, lastMessage: {
              ...conversation.lastMessage, arrived: true
            }};
          }
          return conversation;
        })
        return updatedConversations;
      })
      
    });

    return () => socket?.off("messageSent");
  }, [socket, setMessages, selectedConversation.userId, setConversations]);

  useEffect(() => {
    socket?.on('userRecording', ({ recordingUserId }) => {
      setRecordingUserId(recordingUserId);
    });

    socket?.on('userNotRecording', () => {
      setRecordingUserId("");
    });

    return () => {
      socket?.off('userRecording');
      socket?.off('userNotRecording');
    }
  } ,[socket]);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await fetch('/api/messages/conversations');
        const data = await res.json();

        if(data.error) return showErrorToast(data.error);

        const filteredConversations = data.filter(conversation => {
          return !conversation.participants[0].isFrozen
        });
        setConversations(filteredConversations);
        setDone(true);
      } catch (error) {
        showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"))
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, [showErrorToast, setConversations, lang]);


  const handleSearchConversation = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      if(!searchText.trim()) return showErrorToast(lang === 'ar' ? "اكتب اسم مستعار للبحث!" : 'Type a username to search!');

      const isConversationExist = conversations.map((conversation) => {
        if(conversation.participants[0].username === searchText.trim()){
          const user = conversation.participants[0];
          setSelectedConversation({
            _id: conversation._id,
            userId: user._id,
            username: user.username,
            userProfilePic: user.profilePic,
            mock: conversation.mock,
            isOpened: false
          });
          return true;
        };
      });
      
      if(isConversationExist.includes(true)) {
        setSearchText('');
        return;
      };

      const res = await fetch(`/api/users/profile/${searchText.trim()}?lang=${lang}`);
      const data = await res.json();

      if(data.error) return showErrorToast(data.error);

      if(data._id === currentUser._id){
        showErrorToast(lang === 'ar' ? "لا يمكنك مراسلة نفسك!" : "You cannot message yourself!");
        setSearchText("");
        return;
      };

      if(data.isFrozen){
        return showErrorToast(lang === 'ar' ? "قام المستخدم بتجميد حسابه!" : "The user has frozen their account!")
      };
      
      const mockConversation = {
        mock: true,
        _id: Date.now(),
        lastMessage: {
          text: "", 
          sender: ""
        }, 
        participants: [
          {
            _id: data._id, 
            username: data.username, 
            profilePic: data.profilePic
          }
        ],
        createdAt: "", 
        updatedAt: "",
      };

      setTimeout(() => {
        conversationsEndRef.current?.scrollIntoView({ behaivor: 'smooth' });
      }, 100);

      setConversations([...conversations, mockConversation]);
      setSearchText("");
    } catch (error) {
      showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"))
    } finally {
      setSearching(false);
    }
  };

  return (
    <Box position={'absolute'} left={'50%'} transform={"translateX(-50%)"} w={{base: "100%", md: "80%", lg: "750px"}} p={4}>
      <Toaster />
      <Flex gap={4} flexDirection={{base: 'column', md: 'row'}} maxW={{base: '400px', md: 'full'}} mx={'auto'}>

        <Flex flex={30} gap={2} flexDirection={'column'} maxW={{sm: '250px', md: 'full'}} mx={'auto'} p={2} borderRadius={'0px 5px 10px 1px'} style={{boxShadow: '0.5px 0.5px 0.2px 0px #1e1e1e'}}>
            <Text fontWeight={700} color={useColorModeValue("gray.600", "gray.400")}>
              {lang === 'ar' ? "المحادثات" : "Your Conversations"} 
            </Text>

            <form onSubmit={handleSearchConversation}>
                <Flex alignItems={'center'} gap={2}>
                    <Input 
                      placeholder={lang === 'ar' ? "ابحث عن مستخدم" : 'Search for a user'} 
                      value={searchText} 
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant={"ghost"} type='submit' loading={searching} onClick={handleSearchConversation}>
                        <SearchIcon data-testid={'search-icon'} />
                    </Button>
                </Flex>
            </form>

            {loading &&
              [0, 1, 2, 3, 4].map((_, i) => (
                <Flex key={i} gap={4} alignItems={'center'} p={1} >
                  <Box>
                    <SkeletonCircle size={10} />
                  </Box>
                  <Flex flexDirection={'column'} w={'full'} gap={3}>
                    <Skeleton h={'10px'} w={'80px'}/>
                    <Skeleton h={'8px'} w={'90%'}/>
                  </Flex>
                </Flex>
              ))
            }
            
            {!loading && (
              <Flex 
                maxH={'400px'}  
                flexDir={'column'} 
                gap={2} 
                borderRadius={'md'} 
                pr={lang !== 'ar' && 1}
                pl={lang === 'ar' && 1}
              >
                {conversations.map((conversation) => (
                    <Conversation 
                      key={conversation._id} 
                      conversation={conversation} 
                      isOnline={onlineUsers.includes(conversation.participants[0]._id)} 
                      isWriting={writingUserId === conversation.participants[0]._id}
                      isRecording={recordingUserId === conversation.participants[0]._id}
                    />
                  ))}
                <Box ref={conversationsEndRef} p={0} m={0} h={0}></Box>
              </Flex>
            )}
        </Flex>

        {!selectedConversation._id && (
          <Flex
            flex={70}
            borderRadius={'md'}
            p={2}
            flexDir={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            height={'400px'}
          >
            <GiConversation size={100}/>
            <Text fontSize={20} fontWeight={lang === 'ar' && '500'}>
              {lang === 'ar' ? "اختر محادثة لبدء دردشة" : "Select a conversation to start messaging"} 
            </Text>
          </Flex>
        )}
        
        {selectedConversation._id && 
          <MessageContainer 
            writingUserId={writingUserId} 
            recordingUserId={recordingUserId}
            isOnline={onlineUsers.includes(selectedConversation.userId)}
          />
        }
        
      </Flex>
    </Box>
  );
};

export default ChatPage;
