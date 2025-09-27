import { Box, Button, CloseButton, Field, FieldHelperText, Flex, HStack, Input, Progress, Skeleton, Textarea } from '@chakra-ui/react';
import React, { useRef, useState } from 'react'
import { useColorModeValue } from '../ui/color-mode';
import useShowToast from '@/hooks/useShowToast';
import { MdVideoCameraBack } from 'react-icons/md';
import usePreviewVideo from '@/hooks/usePreviewVideo';
import { FaPlay } from 'react-icons/fa6';
import axios from 'axios';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userReelsAtom, videosAtom } from '@/atoms/reelsAtom';
import userAtom from '@/atoms/userAtom';
import { langAtom } from '@/atoms/langAtom';


const MAX_CHAR = 200;

const CreateReel = ({ setOpen }) => {
    const [ remainingChar, setRemainingChar ] = useState(MAX_CHAR);
    const [ captionText, setCaptionText ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ uploadProgress, setUploadProgress ] = useState(0);

    const videoRef = useRef(null);
    const uploadedVideoRef = useRef(null);

    const setVideos = useSetRecoilState(videosAtom);
    const setUserReels = useSetRecoilState(userReelsAtom);
    const currentUser = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);

    const { showErrorToast, showSuccessToast } = useShowToast();
    const { handleVideoChange, setVideoUrl, videoUrl, uploading, file } = usePreviewVideo();

    const closeButtonBg = useColorModeValue("", "gray.800");

    const handleTextChange = (e) => {
        const inputText = e.target.value;

        if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setCaptionText(truncatedText);
			setRemainingChar(0);
            showErrorToast(lang === 'ar' ? "لقد وصلت الى حد الأحرف الأقصى!" : 'Oops! Character limit reached!')
		} else {
			setCaptionText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
    };

    const handleCreateReel = async () => {
        if(uploadedVideoRef.current?.duration / 60 > 10) return showErrorToast(lang === 'ar' ? "الفيديو طويل للغاية! الحد الأقصى 10 دقائق!" : "Video too long! Max 10 min!");
        if(!videoUrl) return showErrorToast(lang === 'ar' ? "الرجاء رفع فيديو!" : 'Please upload a video!');
        setLoading(true);
        try {
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

            // save secure_url to db
            const res = await fetch(`/api/videos/save?lang=${lang}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: captionText.trim(), video: uploadData.secure_url, publicId: uploadData.public_id })
            });

            const data = await res.json();
            if(data.error) return showErrorToast(data.error);
            
            if(window.location.pathname.startsWith("/reels/reel")){
                setVideos(prev => {
                    return [...prev, data.video];
                });
            };

            if('/' + currentUser?.username === decodeURIComponent(window.location.pathname)){
                setUserReels(prev => {
                    return [...prev, data.video];
                });
            };

            showSuccessToast(data.message || (lang === 'ar' ? "تم إنشاء المقطع بنجاح!" : "Reel created successfully!"));
            
            setOpen(false);
            setCaptionText('');
            setRemainingChar(MAX_CHAR);
            setVideoUrl(null);
            if(videoRef) videoRef.current.value = "";
        } catch (error) {
            showErrorToast(error.message || (lang === 'ar' ? "حدث خطأ ما!" : 'Something went wrong!'));
        } finally{
            setLoading(false);
            setUploadProgress(0);
        };
    };

  return (
    <>
        <Field.Root dir={lang === 'ar' ? "rtl" : "ltr"}>
            <Textarea 
                placeholder={lang === 'ar' ? "اكتب الوصف هنا..." : "Caption goes here..."}
                onChange={handleTextChange}
                value={captionText}
                readOnly={loading}
            />

            <FieldHelperText textAlign={lang === 'ar' ? "left" : 'right'} w={'full'}>
                {remainingChar}/{MAX_CHAR}
            </FieldHelperText>

            <Input 
                type='file'
                hidden
                ref={videoRef}
                onChange={handleVideoChange}
            />

            {!videoUrl && !uploading && (
                <MdVideoCameraBack
                    style={{marginLeft: '5px', cursor: 'pointer'}}
                    size={24}
                    onClick={() => videoRef.current.click()}
                />
            )}
        </Field.Root>
        
        {uploading && (
            <Box position={'relative'} w={'full'} h={'200px'} my={10}>
                <Skeleton height="200px" width="100%" borderRadius={'md'} mt={5} position={'absolute'} />
                <Box position={'absolute'} color={'gray.500'} zIndex={10} top={'60%'} left={'50%'} transform={'translate(-50%, -50%)'}>
                    <FaPlay size={60} />
                </Box>
            </Box>
        )}

        {videoUrl && !uploading && (
            <Flex mt={5} w={'full'} position={'relative'}>
                <video src={videoUrl} controls ref={uploadedVideoRef}/>
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

        {loading && (
            <Box mt={3}>
                <Progress.Root 
                    defaultValue={40} 
                    maxW="sm" value={uploadProgress > 0 && uploadProgress !== 100 ? uploadProgress : null} 
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
                    setCaptionText("");
                    setRemainingChar(MAX_CHAR);
                    setOpen(false);
                    if(videoRef) videoRef.current.value = "";
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
                onClick={handleCreateReel}
                loading={loading}
                disabled={uploading}
            >
                {lang === 'ar' ? "نشر" : "Post"}
            </Button>
        </Flex>
    </>
  )
}

export default CreateReel
