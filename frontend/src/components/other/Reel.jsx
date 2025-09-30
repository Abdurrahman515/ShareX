import { langAtom } from '@/atoms/langAtom';
import { userReelsAtom } from '@/atoms/reelsAtom';
import userAtom from '@/atoms/userAtom';
import useShowToast from '@/hooks/useShowToast';
import { DeleteIcon } from '@chakra-ui/icons';
import { Box, Button, CloseButton, Dialog, Portal } from '@chakra-ui/react'
import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

const Reel = ({ video, postedBy, idx }) => {
    const [ deleting, setDeleting ] = useState(false);
    const [ open, setOpen ] = useState(false);

    const currentUser = useRecoilValue(userAtom);
    const lang = useRecoilValue(langAtom);
    const setUserReels = useSetRecoilState(userReelsAtom);

    const { showErrorToast, showSuccessToast } = useShowToast();

    const videoRef = useRef(null);
    const navigate = useNavigate();


    const handleDelete = async () => {
        if(deleting) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/videos/delete/${video?._id}?lang=${lang}`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();
            if(data.error) return showErrorToast(data.error);

            setUserReels(prev => {
                return prev.filter(v => v._id !== data.videoId);
            });

            showSuccessToast(data.message);
        } catch (error) {
            showErrorToast(error.message || lang === 'ar' ? "حدث خطأ ما!" : "Something went wrong!");
            console.log(error);
        } finally {
            setDeleting(false);
        };
    };
    
    return (
        <Box 
            display={window.location.pathname !== '/' && 'inline-block'} 
            width={window.location.pathname === '/' ? "200px" : '49%'} 
            mr={window.location.pathname === '/' ? "10px" :idx % 2 === 0 && lang !== 'ar' ? '2%' : "0"}
            ml={window.location.pathname === '/' ? "10px" :idx % 2 === 0 && lang === 'ar' ? '2%' : "0"}
            mt={window.location.pathname !== '/' && 5}
            borderRadius={'md'}
            h={window.location.pathname === '/' ? "290px" : '400px'}
            border={'0.2px solid #2e2e2e'}
            position={window.location.pathname !== '/' && 'relative'}
            scrollSnapType={'none'}
            onMouseEnter={() => {
                videoRef.current?.play();
            }}
            onMouseLeave={() => {
                if(videoRef.current){
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                }
            }}
        >
            <video
                src={video?.video}
                muted
                ref={videoRef}
                style={{
                    borderRadius: '5px',
                    height: '100%',
                    objectFit: 'contain',
                    scrollSnapAlign: 'none',
                }}
                onClick={() => {
                    navigate(`/reels/reel/${video?._id}`);
                }}
            />

            {postedBy?._id === currentUser?._id && (
                <Button 
                    position={'absolute'} 
                    top={0} 
                    left={0} 
                    variant={'plain'}
                    onClick={(e) => {
                        e.preventDefault();
                        setOpen(true)
                    }}
                >
                    <DeleteIcon onClick={(e) => e.preventDefault()} data-testid={'delete-icon'} />
                </Button>
            )}

            <Dialog.Root role="alertdialog" lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} dir={lang === 'ar' ? "rtl" : "ltr"}>
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
                                <p>
                                    {lang === 'ar' ? "هذا الإجراء سيحذف الفيديو الخاص بك ولا يمكن التراجع عنه!" 
                                    : "This action will remove your video and cannot be undone!"}
                                </p>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        onClick={(e) => {e.preventDefault(); setOpen(false)}}
                                        disabled={deleting}
                                    >
                                        {lang === 'ar' ? "إلغاء" : "Cancel"}
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button 
                                    colorPalette="red" 
                                    loading={deleting} 
                                    onClick={handleDelete}
                                    data-testid={'delete-btn'}
                                >
                                    {lang === 'ar' ? "حذف" : "Delete"}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="md" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>
  )
}

export default Reel
