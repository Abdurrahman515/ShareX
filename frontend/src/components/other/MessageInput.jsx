import { conversationsAtom, messagesAtom, selectedConversationAtom } from '@/atoms/messagesAtom'
import userAtom from '@/atoms/userAtom'
import { useSocket } from '@/context/SocketContext'
import usePreviewImg from '@/hooks/usePreviewImg'
import useShowToast from '@/hooks/useShowToast'
import { Box, Button, CloseButton, Dialog, Flex, Image, InputGroup, Menu, Portal, Skeleton, Textarea } from '@chakra-ui/react'
import React, { useEffect, useRef, useState } from 'react'
import { BsFillImageFill } from 'react-icons/bs'
import { IoSendSharp } from 'react-icons/io5'
import { useRecoilState, useRecoilValue } from 'recoil'
import messageSound from '../../assets/sounds/message.mp3';
import { MdVideoCameraBack } from 'react-icons/md'
import { useColorMode } from '../ui/color-mode'
import usePreviewVideo from '@/hooks/usePreviewVideo'
import { FaPlay } from 'react-icons/fa6'
import { AiFillAudio } from 'react-icons/ai'
import useRecordVoice from '@/hooks/useRecordVoice'
import { SiAudiomack } from "react-icons/si";
import { FaStopCircle } from 'react-icons/fa'
import { DeleteIcon } from '@chakra-ui/icons'
import AudioControls from './AudioControls'
import { GoPlusCircle } from "react-icons/go";
import { langAtom } from '@/atoms/langAtom'
import VideoControls from './VideoControls'
import { openFullSecreen } from '@/utils/openFullScreen'
import { volumeAtom } from '@/atoms/reelsAtom'

const MessageInput = ({ inputRef, messagesEndRef }) => {
  const [ messageText, setMessageText ] = useState("");
  const [ loading, setLoading ] = useState(false);
  const [ hoverBg, setHoverBg ] = useState("");
  const [ open, setOpen ] = useState(false);
  const [ isPlaying, setIsPlaying ] = useState(false);
  const [ isPlaying2, setIsPlaying2 ] = useState(false);
  const [ isFullscreen, setIsFullscreen ] = useState(false);
  const [ hover, setHover ] = useState(true);
  const [ inputHeight, setInputHeight ] = useState('40px');

  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const videoRefToPreview = useRef(null);
  const videoContainerRef = useRef(null);
  const heightRef = useRef(40);

  const { showErrorToast } = useShowToast();
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const { file, handleVideoChange, setVideoUrl, uploading, videoUrl } = usePreviewVideo();
  const { audioUrl, recording, startRecording, stopRecording, blob, setAudioUrl, duration } = useRecordVoice();
  const { socket, onlineUsers } = useSocket();
  
  const [ selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [ conversations, setConversations ] = useRecoilState(conversationsAtom);
  const [ messages, setMessages ] = useRecoilState(messagesAtom);
  const currentUser = useRecoilValue(userAtom);
  const lang = useRecoilValue(langAtom);
  const volume = useRecoilValue(volumeAtom);

  const { colorMode } = useColorMode();

  const disabledColor = audioUrl || recording ? "#797979ff" : "";
  const cursor = audioUrl || recording ? "not-allowed" : "pointer";
  const videoHeight = isFullscreen? "100vh" : "70vh";
  const iconMargin = audioUrl ? "0" : "0 0 6.5px 0"

  const handleHeightChange = () => {
    if(!inputRef) return;
    const inp = inputRef?.current;

    inp.style.height = '0px';

    const minHeight = 40;
    const maxHeight = 160;

    const contentHeight = inp.scrollHeight;

    const newHeight = Math.min(Math.max(contentHeight + 2, minHeight), maxHeight);

    inp.style.height = `${newHeight}px`

    if(heightRef.current !== newHeight){
      heightRef.current = newHeight;
      setInputHeight(`${newHeight}px`);
    };
  }

  useEffect(() => {
    if(messageText.trim() !== ""){
      socket.emit('userWriting', { writingUserId: currentUser._id, recipientId: selectedConversation.userId });
    } else {
      socket.emit('userNotWriting', { recipientId: selectedConversation.userId });
    }
  }, [messageText, currentUser._id, selectedConversation.userId, socket]);

  useEffect(() => {
    if(recording){
      socket.emit('userStartedRecording', { recordingUserId: currentUser._id, recipientId: selectedConversation.userId });
    } else {
      socket.emit('userStoppedRecording', { recipientId: selectedConversation.userId });
    }
  } , [recording, currentUser._id, selectedConversation.userId, socket]);

  const handleSendMessage = async (e) => {
    if(e) e.preventDefault();
    if(loading) return;
    if(!messageText.trim() && !imgUrl && !videoUrl && !audioUrl) return showErrorToast(lang === 'ar' ? "اكتب شيئا أو ارفع صورة/فيديو أو سجل صوت لإرسال رسالة!" : "Type a message or select an image/video or record to send!");
    setLoading(true);
    try {
      setMessages([...messages, 
        {
          _id: Date.now(), 
          conversationId: selectedConversation._id, 
          img: imgUrl, 
          video: {
            videoUrl: videoUrl,
            publicId: "",
          },
          audio: {
            url: audioUrl,
            publicId: "",
            duration: duration,
          },
          text: messageText.trim(), 
          seen: false, 
          sender: currentUser._id, 
          createdAt: new Date().toISOString(), 
          isSending: true
        }
      ]);
        
      const sound = new Audio(messageSound);
      sound.play();

      setMessageText("");
      setImgUrl("");
      imgRef.current.value = "";
      setVideoUrl("");
      videoRef.current.value = "";
      setAudioUrl("");
      if(inputRef.current) inputRef.current.style.height = '40px';
      heightRef.current = 40;
      setInputHeight('40px');

      inputRef?.current?.focus();

      if(videoUrl){
        // get signature from server
        const signRes = await fetch(`/api/videos/get-signature/video?lang=${lang}`);
        const signData = await signRes.json();
        if(signData.error) return showErrorToast(signData.error);

        // getting data for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signData.signature);
        formData.append('timestamp', signData.timestamp);
        formData.append('api_key', signData.apiKey);
        formData.append('folder', 'user_videos');

        // upload video to cludinary
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if(uploadData.error) return showErrorToast(uploadData.error.message);

        //send message
        const res = await fetch(`/api/messages/send?lang=${lang}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              recipientId: selectedConversation.userId,
              message: messageText.trim(),
              img: imgUrl,
              recipientUserName: selectedConversation.username,
              video: {
                videoUrl: uploadData.secure_url,
                publicId: uploadData.public_id,
              },
              audio: {
                url: "",
                publicId: "",
                duration: '00:00',
              },
          })
        });
        const data = await res.json();
  
        if(data.error) return showErrorToast(data.error);
        
        if(selectedConversation.mock){
            setSelectedConversation({
                ...selectedConversation, _id: data.conversationId, mock: false
            });
        };

        const updatedConversations = conversations.map((conversation) => {
            if((conversation._id === data.conversationId || conversation.mock) && conversation.participants[0]._id === selectedConversation.userId){
                return {...conversation, 
                  _id: data.conversationId, 
                  lastMessage: {
                    text: data.text, 
                    sender: data.sender,
                    isVideo: true,
                    isAudio: false,
                  }, 
                  mock: false
                }
            }
            return conversation;
        });
        
        setConversations(updatedConversations);

        setMessages(prev => {
            const updatedMessages = prev.map((message, idx) => {
                if(message.conversationId === selectedConversation._id){
                    if(idx === prev.length -1){
                        return data;
                    }
                    return message;
                };
            });
            return updatedMessages;
        });

        setLoading(false);

        if(!onlineUsers.includes(selectedConversation.userId) || document.hasFocus()) {
          const res2 = await fetch(`/api/notification/send?lang=${lang}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: selectedConversation.userId, 
              payload: { 
                title: lang === 'ar' ? 'رسالة جديدة' : 'New Message', 
                body: lang === 'ar' ? `لديك رسالة جديدة من ${currentUser.username}` : `You have a new message from ${currentUser.username}`,
                data: { url: window.location.href }
              }
            }),
          });
  
          const data2 = await res2.json();
          if(data2.error && data2.error !== "User is not subscribed!") return;
  
          socket.emit("messageArrived", {
            senderId: data.sender,
            messageId: data._id,
            receiverId: selectedConversation.userId,
            conversationId: data.conversationId,
            message: data
          });
        };

      } else if(audioUrl) {
        // get signature from server
        const signRes = await fetch(`/api/videos/get-signature/audio?lang=${lang}`);
        const signData = await signRes.json();

        if(signData.error) return showErrorToast(signData.error);

        //getting data to upload
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('signature', signData.signature);
        formData.append('timestamp', signData.timestamp);
        formData.append('api_key', signData.apiKey);
        formData.append('folder', 'user_voices');

        //upload data to cloudinary
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        
        if(uploadData.error) return showErrorToast(uploadData.error.message);

        //sending message
        const res = await fetch(`/api/messages/send?lang=${lang}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: selectedConversation.userId,
            message: messageText.trim(),
            img: imgUrl,
            recipientUserName: selectedConversation.username,
            video: {
              videoUrl: "",
              publicId: "",
            },
            audio: {
              url: uploadData.secure_url,
              publicId: uploadData.public_id,
              duration: duration,
            },
          })
        });
        const data = await res.json();

        if(data.error) return showErrorToast(data.error);

        if(selectedConversation.mock){
            setSelectedConversation({
                ...selectedConversation, _id: data.conversationId, mock: false
            });
        };
        
        const updatedConversations = conversations.map((conversation) => {
            if((conversation._id === data.conversationId || conversation.mock) && conversation.participants[0]._id === selectedConversation.userId){
                return {...conversation, 
                  _id: data.conversationId, 
                  lastMessage: {
                    text: data.text, 
                    sender: data.sender,
                    isVideo: false,
                    isAudio: true,
                  }, 
                  mock: false
                }
            }
            return conversation;
        });
        
        setConversations(updatedConversations);

        setMessages(prev => {
            const updatedMessages = prev.map((message, idx) => {
                if(message.conversationId === selectedConversation._id){
                    if(idx === prev.length -1){
                        return data;
                    }
                    return message;
                };
            });
            return updatedMessages;
        });

        setLoading(false);

        if(!onlineUsers.includes(selectedConversation.userId) || document.hasFocus()) {
          const res2 = await fetch(`/api/notification/send?lang=${lang}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: selectedConversation.userId, 
              payload: { 
                title: lang === 'ar' ? "رسالة جديدة" : 'New Message', 
                body: lang === 'ar' ? `لديك رسالة جديدة من ${currentUser.username}` : `You have a new message from ${currentUser.username}`,
                data: { url: window.location.href }
              }
            }),
          });
  
          const data2 = await res2.json();
          if(data2.error && data2.error !== "User is not subscribed!") return;
  
          socket.emit("messageArrived", {
            senderId: data.sender,
            messageId: data._id,
            receiverId: selectedConversation.userId,
            conversationId: data.conversationId,
            message: data
          });
        };

      } else {
        const res = await fetch(`/api/messages/send?lang=${lang}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientId: selectedConversation.userId,
                message: messageText.trim(),
                img: imgUrl,
                recipientUserName: selectedConversation.username,
                video: {
                  videoUrl: "",
                  publicId: "",
                },
                audio: {
                  url: "",
                  publicId: "",
                  duration: '00:00'
                },
            })
        });
        const data = await res.json();
  
        if(data.error) return showErrorToast(data.error);
        
        if(selectedConversation.mock){
            setSelectedConversation({
                ...selectedConversation, _id: data.conversationId, mock: false
            });
        };
        
        const updatedConversations = conversations.map((conversation) => {
            if((conversation._id === data.conversationId || conversation.mock) && conversation.participants[0]._id === selectedConversation.userId){
                return {...conversation, 
                  _id: data.conversationId, 
                  lastMessage: {
                    text: data.text, 
                    sender: data.sender,
                    isVideo: false,
                    isAudio: false,
                  }, 
                  mock: false
                }
            }
            return conversation;
        });
        
        setConversations(updatedConversations);
  
        setMessages(prev => {
            const updatedMessages = prev.map((message, idx) => {
                if(message.conversationId === selectedConversation._id){
                    if(idx === prev.length -1){
                        return data;
                    }
                    return message;
                };
            });
            return updatedMessages;
        });
  
        setLoading(false);
  
        if(!onlineUsers.includes(selectedConversation.userId) || document.hasFocus()) {
          const res2 = await fetch(`/api/notification/send?lang=${lang}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: selectedConversation.userId, 
              payload: { 
                title: lang === 'ar' ? "رسالة جديدة" : 'New Message', 
                body: lang === 'ar' ? `لديك رسالة جديدة من ${currentUser.username}` : `You have a new message from ${currentUser.username}`,
                data: { url: window.location.href }
              }
            }),
          });
  
          const data2 = await res2.json();
          if(data2.error && data2.error !== "User is not subscribed!") return;
  
          socket.emit("messageArrived", {
            senderId: data.sender,
            messageId: data._id,
            receiverId: selectedConversation.userId,
            conversationId: data.conversationId,
            message: data
          });
        };

      };
    } catch (error) {
      showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : 'Something went wrong!'));
    } finally {
      setLoading(false);
    }
  }

  if(imgUrl || videoUrl){
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behaivor: 'smooth'});
      inputRef.current?.focus();
    }, 1);
  };

  useEffect(() => {
    if(imgUrl && videoUrl) {
      setImgUrl("");
      imgRef.current.value = "";
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);
  
  useEffect(() => {
    if(imgUrl && videoUrl) {
      setVideoUrl("");
      videoRef.current.value = "";
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgUrl]);

  useEffect(() => {
    if(recording){
      setMessageText("");
      setVideoUrl("");
      setImgUrl("");
      if(videoRef.current) videoRef.current.value = null;
      if(imgRef.current) imgRef.current.value = null;
    };
  }, [recording, setImgUrl, setVideoUrl]);

  return (
    <>
      <form onSubmit={handleSendMessage}>
        <Flex alignItems={'center'} gap={2} flexDir={'column'} dir={'ltr'}>
          {imgUrl && (
            <Flex 
              justifyContent={'space-between'} 
              alignSelf={'flex-start'} 
              bg={'gray.700'} 
              borderRadius={'md'} 
              w={'82%'} 
              height={'100px'} 
              p={1}
              mx={'auto'}
            >
              <Image src={imgUrl} h={'90%'} my={'1%'} mx={'1%'} borderRadius={'md'}/>
              <CloseButton borderRadius={'full'} size={'md'} onClick={() => {
                setImgUrl("");
                if(imgRef){
                  imgRef.current.value = "";
                }
              }}/>
            </Flex>
          )}

          {uploading && (
            <Flex 
              justifyContent={'space-between'} 
              alignSelf={'flex-start'} 
              bg={'gray.700'} 
              borderRadius={'md'} 
              w={'82%'} 
              height={'100px'} 
              p={1}
              position={'relative'}
              mx={'auto'}
            >
              <Box position={'relative'} w={'full'} h={'200px'} mb={10}>
                <Skeleton height="90px" width="50%" borderRadius={'md'} position={'absolute'} />
                <Box position={'absolute'} color={'gray.500'} zIndex={10} top={'22%'} left={'25%'} transform={'translate(-50%, -50%)'}>
                    <FaPlay size={40} />
                </Box>
              </Box>
              <CloseButton borderRadius={'full'} size={'md'}/>
            </Flex>
          )}

          {videoUrl && !uploading && (
            <Flex flexDirection={'column'} w={'full'} gap={2}>

              <Flex 
                justifyContent={'space-between'} 
                alignSelf={'flex-start'} 
                bg={'gray.700'} borderRadius={'md'} 
                w={'82%'} 
                height={'100px'} 
                p={1}
                mx={'auto'}
              >
                <video 
                  src={videoUrl} 
                  height={'90%'} 
                  style={{
                    maxWidth: "50%",
                    objectFit: "contain",
                    borderRadius: "5px",
                  }}
                />

                <Button 
                  variant={'subtle'}
                  px={5}
                  py={1}
                  alignSelf={'flex-end'}
                  onClick={() => setOpen(true)}
                >
                  {lang === 'ar' ? "معاينة" : "Preview"}
                </Button>

                <CloseButton borderRadius={'full'} size={'md'} onClick={() => {
                  setVideoUrl("");
                  if(videoRef){
                    videoRef.current.value = "";
                  }
                }}/>
              </Flex>
            </Flex>
          )}


          <Flex alignItems={'center'} gap={1} w={'full'}>
            <Button 
              size={'md'} 
              variant={'subtle'} 
              p={0}
              disabled={audioUrl}
              onClick={() => {
                if(recording) stopRecording();
                if(!recording) startRecording();
              }}
              mb={audioUrl ? 0.5 : 1.5}
            >
              {recording ? (
                <FaStopCircle data-testid={'stop-record'} cursor={audioUrl ? 'not-allowed' : 'pointer'}/>
              ) : (
                <AiFillAudio data-testid={'record'} cursor={audioUrl ? "not-allowed" : 'pointer'}/>
              )}
            </Button>

            <InputGroup 
              dir={lang === 'ar' ? "rtl" : "ltr"}
              position={'relative'}
              endElement={
                <>
                  {recording && 
                    <Button 
                      variant={'plain'} 
                      color={'red.600'} 
                      onClick={() => {
                        stopRecording();
                        setTimeout(() => {
                          setAudioUrl("");
                        }, 10)
                      }}
                      size={'md'}
                      p={6}
                      pb={7}
                    >
                      <DeleteIcon />
                    </Button>
                  }

                  {audioUrl && 
                    <Button 
                      variant={'plain'} 
                      color={'red.600'} 
                      onClick={() => {
                        setAudioUrl("");
                      }}
                      size={'md'}
                      p={6}
                      pb={7}
                    >
                      <DeleteIcon />
                    </Button>
                  }

                  <Button 
                    size={20} 
                    variant={'plain'} 
                    p={0} 
                    m={0} 
                    type='submit' 
                    disabled={recording} 
                    position={'absolute'} 
                    bottom={audioUrl ? "12px" : '16px'} 
                    left={lang === 'ar' && '11px'}
                    right={lang !== 'ar' && '11px'}
                    pointerEvents={'all'}
                    data-testid={"send-btn"}
                    onClick={() => {handleSendMessage()}}
                  >
                    {lang !== 'ar' && <IoSendSharp size={16} cursor={recording ? "not-allowed" : 'pointer'} />}
                    {lang === 'ar' && 
                      <IoSendSharp 
                        size={16} 
                        cursor={recording ? "not-allowed" : 'pointer'} 
                        style={{ transform: "scaleX(-1)", display: "inline-block" }} 
                      />
                    }
                  </Button>
                </>
              }
              startElement={
                recording && 
                  <Button 
                    size={20} 
                    variant={'plain'} 
                    p={0} 
                    m={0}
                  >
                    <SiAudiomack size={18} />
                  </Button>
              }
            >
              {audioUrl ? (
                <Flex minW={0} maxW={'100%'} w={'100%'}>
                  <Box 
                    bg={colorMode === 'dark' ? 'gray.600' : "gray.400"} 
                    position={'relative'}
                    h={'40px'}
                    w={{
                      base: '75%',
                      md: '70%',
                      lg: '80%'
                    }}
                    borderRadius={'md'}
                  >
                    <audio 
                      src={audioUrl}
                      ref={audioRef}
                      style={{
                        height: '100%',
                        width: '100%',
                      }} 
                      onEnded={() => setIsPlaying(false)}
                      data-testid={'audio'}
                    />

                    <AudioControls 
                      audioRef={audioRef}
                      sender={currentUser}
                      isPlaying={isPlaying}
                      setIsPlaying={setIsPlaying}
                      ownMessage={true}
                      isMessageInput={true}
                      currentDuration={duration}
                    />
                  </Box>
              </Flex>
              ) : (
                <Box w={'100%'}>
                  <Textarea 
                    autoFocus
                    ref={inputRef} 
                    onInput={handleHeightChange}
                    onKeyDown={(e) => {
                      if(e.key === 'Enter'){
                        if(e.shiftKey) return;
                        e.preventDefault();
                        handleSendMessage();
                      };
                    }}
                    w={'full'} 
                    pl={lang !== 'ar' && recording ? "40px" :lang === 'ar' && '30px'}
                    pr={lang === 'ar' && recording ? '40px' :lang !== 'ar' && '30px'}
                    h={inputHeight}
                    boxSizing={'border-box'}
                    maxH={'160px'}
                    placeholder={lang === 'ar' ? "اكتب رسالة ..." : 'Type a message ...'} 
                    value={!recording ? messageText :recording && lang === 'ar' ? "جار التسجيل ..." : "Recording ..."} 
                    color={recording && 'red.600'}
                    fontWeight={recording && '700'}
                    onChange={(e) => setMessageText(e.target.value)}
                    readOnly={recording}
                  />
                </Box>
              )}
            </InputGroup>

            <Menu.Root positioning={{ placement: "top-end" }}>
              <Menu.Trigger asChild
                onMouseEnter={() => {
                  if(recording || audioUrl) return;
                  if(colorMode === 'dark'){
                    setHoverBg("#3f3e3e70");
                  } else {
                    setHoverBg("#3f3e3e1a");
                  }
                }}
                onMouseLeave={() => {
                  if(recording || audioUrl || imgUrl || videoUrl) return;
                  setHoverBg("");
                }}
              >
                <GoPlusCircle
                  size={40} 
                  style={{
                    margin: iconMargin,
                    padding: "2px 7px",
                    borderRadius: "5px",
                    cursor: cursor,
                    color: disabledColor,
                    backgroundColor: hoverBg,
                  }}
                />
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content dir={lang === 'ar' ? "rtl" : "ltr"}>
                    <Menu.Item value="image"
                      onClick={() => {
                        imgRef.current.click();
                      }}
                    >
                        <BsFillImageFill size={16}/>
                        {lang === 'ar' ? "صورة" : "Image"}
                    </Menu.Item>
                    <Menu.Item value="video"
                      onClick={() => {
                        videoRef.current.click();
                      }}
                    >
                      <MdVideoCameraBack size={20}/>
                      {lang === 'ar' ? "فيديو" : "Video"}
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

            <input type="file" hidden ref={imgRef} onChange={handleImageChange}/>
            <input type="file" hidden ref={videoRef} onChange={handleVideoChange}/>
            
          </Flex>
        </Flex>
      </form>

      <Dialog.Root size={'cover'} lazyMount open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Body pb={6}>
                      <Flex mt={5} w={'full'} position={'relative'} h={'100%'} justifyContent={'center'} alignItems={'center'}>
                          <Box 
                              ref={videoContainerRef}
                              h={'100%'}
                              w={'100%'}
                              objectFit={'contain'}
                              onClick={(e) => {
                                e.preventDefault();
                              }}
                              onDoubleClick={() => {
                                if(videoContainerRef.current && !isFullscreen){
                                  setIsFullscreen(true);
                                  openFullSecreen(videoContainerRef.current);
                                }else if(videoContainerRef.current && isFullscreen){
                                  setIsFullscreen(false);
                                  document.exitFullscreen();
                                }
                              }}
                              onMouseEnter={() => {
                                if(!videoRefToPreview.current?.paused){
                                  setHover(true)
                                }
                              }}
                              onMouseLeave={() => {
                                if(!videoRefToPreview.current?.paused){
                                  setTimeout(() => {
                                      setHover(false)
                                  }, 2000);
                                }
                              }}
                              onMouseMove={() => {
                                setHover(true);
                              }}
                          >
                              <video 
                                src={videoUrl}
                                ref={videoRefToPreview}
                                autoPlay
                                style={{
                                  objectFit: 'contain',
                                  height: '100%',
                                  width: '100%',
                                  maxHeight: videoHeight,
                                  scrollSnapAlign: 'none',
                                  borderRadius: '5px'
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if(videoRefToPreview.current && videoRefToPreview.current?.paused){
                                      videoRefToPreview.current.volume = volume[0] / 100;
                                      videoRefToPreview.current?.play();
                                      setHover(true);
                                      setIsPlaying2(true);
                                  } else {
                                      videoRefToPreview.current?.pause();
                                      setHover(true);
                                      setIsPlaying2(false);
                                  }
                                }}
                                onPlay={() => {
                                  setIsPlaying2(true);
                                  if(videoRefToPreview.current) videoRefToPreview.current.volume = volume[0] / 100;
                                }}
                              />
                              
                              {hover && (
                                <VideoControls 
                                  videoRef={{ current: videoRefToPreview?.current }}
                                  videoContainerRef={{ current: videoContainerRef?.current }}
                                  video={{ videoUrl: videoUrl }}
                                  isPlaying={isPlaying2}
                                  setIsPlaying={setIsPlaying2}
                                  openFullSecreen={openFullSecreen}
                                  isFullscreen={isFullscreen}
                                  setIsFullscreen={setIsFullscreen}
                                />
                              )}

                          </Box>
                      </Flex>
                        
                    </Dialog.Body>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="lg" borderRadius={'full'}/>
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog.Root>
    </>
  )
}

export default MessageInput
