import { Box, Button, CloseButton, Field, FieldHelperText, Flex, HStack, Image, Input, Progress, Skeleton, Textarea } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import { useColorModeValue } from '../ui/color-mode';
import usePreviewImg from '@/hooks/usePreviewImg';
import { BsFillImageFill } from 'react-icons/bs';
import useShowToast from '@/hooks/useShowToast';
import { useRecoilState, useRecoilValue } from 'recoil';
import userAtom from '@/atoms/userAtom';
import postsAtom from '@/atoms/postsAtom';
import { useLocation } from 'react-router-dom';
import usePreviewVideo from '@/hooks/usePreviewVideo';
import { MdVideoCameraBack } from 'react-icons/md';
import { FaPlay } from 'react-icons/fa6';
import axios from 'axios';
import { langAtom } from '@/atoms/langAtom';

const MAX_CHAR = 500;

const CreatePost = ({ setOpen }) => {
    const [ postText, setPostText ] = useState('');
    const [ remainingChar, setRemainingChar ] = useState(MAX_CHAR);
    const [ loading, setLoading ] = useState(false);
    const [ uploadProgress, setUploadProgress ] = useState(0);

    const imageRef = useRef(null);
    const videoRef = useRef(null);

    const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
    const { handleVideoChange, file, setVideoUrl, uploading, videoUrl } = usePreviewVideo();
    const { showErrorToast, showSuccessToast } = useShowToast();

    const user = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);
    const [ posts, setPosts ] = useRecoilState(postsAtom);
    
    const location = useLocation();

    const closeButtonBg = useColorModeValue("gray.200", "gray.800");

    const handleTextChange = (e) => {
        const inputText = e.target.value;

        if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setPostText(truncatedText);
			setRemainingChar(0);
            showErrorToast(lang === 'ar' ? "لقد وصلت الى حد الأحرف الأقصى!" : 'Oops! Character limit reached!')
		} else {
			setPostText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
    }

    const handleCreatePost = async () => {
        if(!postText.trim() && !imgUrl && !videoUrl) {
            showErrorToast(lang === 'ar' ? "الرجاء الكتابة أو رفع فيديو أو صورة!" : 'Please write something or select an image or video!');
            return;
        }
        if(loading) return;

        setLoading(true);
        try {
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
                const uploadRes = await axios.post(`https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`, formData, {
                    onUploadProgress: (ProgressEvent) => {
                        const percent = Math.round((ProgressEvent.loaded * 100) / ProgressEvent.total);
                        setUploadProgress(percent);
                    }
                })

                const uploadData = await uploadRes.data;
                if(uploadData.error) return showErrorToast(uploadData.error.message);

                // create the post
                const res = await fetch('/api/posts/create', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        postedBy: user._id, 
                        text: postText.trim(), 
                        img: imgUrl, 
                        video: {
                            videoUrl: uploadData.secure_url, 
                            publicId: uploadData.public_id
                        }
                    })
                });
    
                const data = await res.json();
                if(data.error){
                    showErrorToast(data.error);
                    return;
                };

                showSuccessToast(lang === 'ar' ? "تم إنشاء المنشور بنجاح!" : "Post created successfully!");
                setOpen(false);

                if(location.pathname === '/' || '/' + user.username === decodeURIComponent(location.pathname)){
                    setPosts([data, ...posts]);
                };

                setPostText("");
                setImgUrl("");
                setVideoUrl("");
                setRemainingChar(MAX_CHAR);
                if(videoRef) videoRef.current.value = "";
                if(imageRef) imageRef.current.value = "";

            } else {
                const res = await fetch(`/api/posts/create?lang=${lang}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        postedBy: user._id, 
                        text: postText.trim(), 
                        img: imgUrl,
                        video: {
                            videoUrl: "", 
                            publicId: ""
                        },
                    })
                });
    
                const data = await res.json();
                if(data.error){
                    showErrorToast(data.error);
                    return;
                };
                
                showSuccessToast(lang === 'ar' ? "تم إنشاء المنشور بنجاح!" : "Post created successfully!");
                setOpen(false);
    
                if(location.pathname === '/' || '/' + user.username === decodeURIComponent(location.pathname)){
                    setPosts([data, ...posts]);
                };

                setPostText("");
                setImgUrl("");
                setVideoUrl("");
                setRemainingChar(MAX_CHAR);
                if(videoRef) videoRef.current.value = "";
                if(imageRef) imageRef.current.value = "";
            };

        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!"));
        } finally {
            setLoading(false);
            setUploadProgress(0);
        };
    }
    return (
    <>
        <Field.Root dir={lang === 'ar' ? "rtl" : "ltr"}>
            <Textarea 
                placeholder={lang === 'ar' ? "اكتب محتوى المنشور هنا..." : "Post content goes here..."} 
                onChange={handleTextChange}
                value={postText}
                readOnly={loading}
            />

            <FieldHelperText textAlign={lang === 'ar' ? "left" : 'right'} w={'full'}>
                {remainingChar}/{MAX_CHAR}
            </FieldHelperText>

            <Input 
                type='file'
                hidden
                ref={imageRef}
                onChange={handleImageChange}
            />

            <Input 
                type='file'
                hidden
                ref={videoRef}
                onChange={handleVideoChange}
            />

            {!videoUrl && !imgUrl && !uploading && (
                <Flex gap={2} alignItems={'center'}>
                    <BsFillImageFill 
                        style={{marginLeft: '5px', cursor: 'pointer'}}
                        size={20}
                        onClick={() => imageRef.current.click()}
                    />

                    <MdVideoCameraBack 
                        style={{cursor: "pointer", marginLeft: '5px'}}
                        size={24}
                        onClick={() => videoRef.current.click()}
                    />
                </Flex>
            )}
        </Field.Root>

        {imgUrl && (
            <Flex mt={5} w={'full'} position={'relative'}>
                <Image src={imgUrl} alt='Selected image'/>
                <CloseButton 
                    onClick={() => {
                        setImgUrl("");
                        if(imageRef) imageRef.current.value = "";
                    }}
                    bg={closeButtonBg}
                    position={'absolute'}
                    top={2}                            
                    right={2}                            
                />
            </Flex>
        )}

        {uploading && (
            <Box position={'relative'} w={'full'} h={'200px'} mb={10}>
                <Skeleton height="200px" width="100%" borderRadius={'md'} mt={5} position={'absolute'} />
                <Box position={'absolute'} color={'gray.500'} zIndex={10} top={'60%'} left={'50%'} transform={'translate(-50%, -50%)'}>
                    <FaPlay size={60} />
                </Box>
            </Box>
        )}

        {videoUrl && !uploading && (
            <Flex mt={5} w={'full'} position={'relative'}>
                <video src={videoUrl} controls/>
                <CloseButton 
                    onClick={() => {
                        setVideoUrl("");
                        if(videoRef) videoRef.current.value = "";
                    }}
                    bg={closeButtonBg}
                    position={'absolute'}
                    top={2}                            
                    right={2}                            
                />
            </Flex>
        )}

        {loading && videoUrl && (
            <Box mt={3}>
                <Progress.Root 
                    defaultValue={40} 
                    maxW="sm" 
                    value={uploadProgress > 0 && uploadProgress !== 100 ? uploadProgress : null} 
                    size="xs" 
                    borderRadius={'md'} 
                    variant={"subtle"}
                    dir={lang === 'ar' ? "rtl" : "ltr"}
                >
                <HStack gap="5">
                    <Progress.Label>
                        {uploadProgress === 0 && lang === 'ar' ? "جار البدء"
                        :uploadProgress === 0 && lang !== 'ar' ? "Starting"
                        :uploadProgress === 100 && lang === 'ar' ? "جار الحفظ" 
                        :uploadProgress === 100 && lang !== 'ar' ? "Saving"
                        :lang === 'ar' ? "جار الرفع"
                        :lang !== 'ar' && "Uploading"}
                    </Progress.Label>
                    <Progress.Track flex="1">
                        <Progress.Range />
                    </Progress.Track>
                    <Progress.ValueText>{uploadProgress}%</Progress.ValueText>
                </HStack>
                </Progress.Root>
            </Box>
        )}

        <Flex 
            gap={1} 
            alignSelf={'flex-end'} 
            justifySelf={lang === 'ar' ? "flex-start" : 'flex-end'} 
            mt={5}
            dir={lang === 'ar' ? "rtl" : "ltr"}
        >
            <Button 
                variant="outline"
                flex={50} 
                bg={'red.400'} 
                color={'white'}
                _hover={{
                    bg: 'red.500',
                }}
                onClick={() => {
                    setImgUrl("");
                    setVideoUrl("");
                    setPostText("");
                    setRemainingChar(MAX_CHAR);
                    setOpen(false);
                    if(videoRef) videoRef.current.value = "";
                    if(imageRef) imageRef.current.value = "";
                }}
                disabled={loading}
            >
                {lang === 'ar' ? "إلغاء" : "Cancel"}
            </Button>

            <Button 
                variant="outline" 
                flex={50}
                bg={'green.400'} 
                color={'white'}
                _hover={{
                    bg: 'green.500',
                }}
                w={'15%'}
                onClick={handleCreatePost}
                loading={loading}
            >
                {lang === 'ar' ? "نشر" : "Post"}
            </Button>
        </Flex>
    </>
  )
};

export default CreatePost;
