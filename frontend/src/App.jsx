import { Box, CloseButton, Container } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import UserPage from './pages/UserPage'
import PostPage from './pages/PostPage'
import Header from './components/other/Header'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import userAtom from './atoms/userAtom'
import UpdateProfilePage from './pages/UpdateProfilePage'
import { Toaster } from 'react-hot-toast'
import ChatPage from './pages/ChatPage'
import ReelsPage from './pages/ReelsPage'
import SettingsPage from './pages/SettingsPage'
import useShowToast from './hooks/useShowToast'
import { useSocket } from './context/SocketContext'
import { conversationsAtom, messagesAtom, selectedConversationAtom, unSeenMessagesAtom } from './atoms/messagesAtom'
import messageSound from './assets/sounds/message.mp3'
import { Toaster as chakraToaster, toaster } from '@/components/ui/toaster';
import SearchPage from './pages/SearchPage'
import { outOfChatPageAtom } from './atoms/placeAtom'
import ReelItem from './components/other/ReelItem'
import CreateReelOrPost from './components/other/CreateReelOrPost'
import NoInternet from './components/other/NoInternet'
import { langAtom } from './atoms/langAtom'

const App = () => {
  const [ isOnline, setIsOnline ] = useState(navigator.onLine);

  const lang = useRecoilValue(langAtom);
  const user = useRecoilValue(userAtom);
  const outOfChatPage = useRecoilValue(outOfChatPageAtom);
  const [ selectedConversation, setSelectedConversation ] = useRecoilState(selectedConversationAtom);
  const [ conversations, setConversations ] = useRecoilState(conversationsAtom);
  const setMessages = useSetRecoilState(messagesAtom);
  const setUnSeenMessages = useSetRecoilState(unSeenMessagesAtom);

  const { showErrorToast, showSuccessToast } = useShowToast();
  const { socket } = useSocket();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => {
      showSuccessToast(lang === 'ar' ? 'تم استعادة الاتصال بالانترنت بنجاح!' : "Internet Connection Restored!")
      setIsOnline(true);
    };

    const handleOffline = () => {
      showErrorToast(lang === 'ar' ? "انقطع الاتصال بالانترنت!" : "No Internet Connection!")
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, [showErrorToast, showSuccessToast, lang]);

  useEffect(() => {
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = atob(base64);
      return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    };

    const subscribeToPush = async() => {
      if(!user) return;
      const publicVapidKey = 'BHt94RLr72vwxxXH0GeBC8PTdpP7w14qbwDL_gCUuNoH0Btn9u1ErnmG7n2iucal94eeRom3mMbvzMSppxhHKpI'
      try {
        if ('serviceWorker' in navigator){
          const registration = await navigator.serviceWorker.register('/sw.js');
  
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        
          const res = await fetch('/api/notification/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscription: subscription }),
          })
  
          const data = await res.json();
          if(data.error) return showErrorToast(data.error);
          
  
        };
      } catch (error) {
        console.log(error || 'Something went wrong!');
      }
    };


    subscribeToPush();
  }, [showErrorToast, user]);

  useEffect(() => {
      socket?.on("newMessage", (message) => {
        if(selectedConversation._id === message.conversationId){
            setMessages((prevMessages) => [...prevMessages, message]);
            const sound = new Audio(messageSound);
            sound.play();
        };
        
        const isVideo = message.video?.videoUrl ? true : false;
        const isAudio = message.audio.url ? true : false;

        setConversations((prev) => {
            const updatedConversations = prev.map(conversation => {
                if(conversation._id === message.conversationId){
                    return {...conversation, 
                      lastMessage: {
                        text: message.text, 
                        sender: message.sender, 
                        isVideo, 
                        isAudio
                      }
                    }
                }
                return conversation;
            });
            return updatedConversations;
        });
  
        socket.emit("messageArrived", { 
          senderId: message.sender._id, 
          messageId: message._id, 
          receiverId: user?._id, 
          conversationId: message.conversationId, 
          message: message 
        });
  
        if(message.conversationId !== selectedConversation._id || !selectedConversation._id){
          toaster.create({
            title: lang === 'ar' ? "رسالة جديدة!" : "New Message!",
            description: lang === 'ar' ? `لديك رسالة جديدة من ${message.sender.username}` : `You have a new message form ${message.sender.username}`,
            type: 'info',
            dir: lang === 'ar' ? "rtl" : 'ltr',
            action: {
              label: lang === 'ar' ? "فتح" : "Open",
              onClick: () => {
                navigate('/chat');
                setSelectedConversation({
                  _id: message.conversationId,
                  userId: message.sender._id,
                  username: message.sender.username,
                  userProfilePic: message.sender.profilePic,
                  mock: false,
                  isOpened: false
                })
              }
            }
          });
          const sound = new Audio(messageSound);
          sound.play();
        };

        if(message.conversationId !== selectedConversation._id){
          setUnSeenMessages(prev => {
            return [...prev, message];
          });
        };

        if(!outOfChatPage){
          const isConversationExist = conversations.filter(conversation => {
            return message.conversationId === conversation._id;
          })

          if(!isConversationExist[0]){
            setConversations(prev => {
              return [...prev, {
                _id: message.conversationId,
                participants: [{
                  _id: message.sender._id,
                  username: message.sender.username,
                  profilePic: message.sender.profilePic
                }],
                lastMessage: {
                  text: message.text,
                  sender: message.sender._id,
                  isAudio,
                  isVideo
                },
                mock: false,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
              }]
            })
          }
        }        

      });
  
      return () => {
          socket?.off("newMessage");
      };
    }, [socket, setMessages, selectedConversation._id, setConversations, user?._id, selectedConversation.userId, conversations, selectedConversation, setSelectedConversation, navigate, setUnSeenMessages, outOfChatPage, lang]);
  
    useEffect(() => {
      const getUnSeenMessages = async () => {
        if(!user) return;
        try {
          const res = await fetch('/api/messages/unseenmessages');
          const data = await res.json();

          if(data.error) return;
          setUnSeenMessages(data);
        } catch (error) {
          console.log(error)
        }
      };

      getUnSeenMessages();
    }, [user, setUnSeenMessages]);
    
  return (
      <Container maxW={location.pathname === '/' ? {base: '620px', md: '900px'} : "620px"} dir={lang === 'ar' && location.pathname !== '/settings' ? 'rtl' : 'ltr'}>
        <Toaster />
        <Toaster as={chakraToaster}/>
        {!location.pathname.startsWith("/reels") && <Header />}
        {isOnline ? (
          <>
            <Routes>
              <Route path='/' element={user ? <HomePage/> : <Navigate to={'/auth'} />}/>
              <Route path='/auth' element={!user ? <AuthPage /> : <Navigate to={'/'} />}/>
              <Route path='/update' element={user ? <UpdateProfilePage /> : <Navigate to={'/auth'} />}/>

              <Route path='/:username' element={<UserPage />} />
              <Route path='/:username/post/:pid' element={<PostPage/>} />
              <Route path='/chat' element={user? <ChatPage /> : <Navigate to={'/auth'} />} />
              <Route path='/reels' element={user? (<ReelsPage />) : <Navigate to={'/auth'} />} />
              <Route path='/reels/reel/:id' element={user? <ReelItem /> : <Navigate to={'/auth'} />} />
              <Route path='/settings' element={user? <SettingsPage /> : <Navigate to={'/auth'} />} />
              <Route path='/search' element={user? <SearchPage /> : <Navigate to={'/search'} />} />
            </Routes>

            {
              location.pathname === '/' 
                || '/' + user?.username === decodeURIComponent(location.pathname) 
                || location.pathname.startsWith("/reels") ? <CreateReelOrPost /> : ""
            }
            {location.pathname.startsWith("/reels") ? 
              <CloseButton 
                size={'2xl'} 
                position={'fixed'} 
                top={0} 
                right={-3} 
                variant={'plain'} 
                borderRadius={'100%'}
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                  }, 300)
                }}
              /> 
                : ""}
          </>
        ) : (
          <NoInternet />
        )}
      </Container>
  )
}

export default App;
