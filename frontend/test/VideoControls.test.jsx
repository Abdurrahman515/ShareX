import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import VideoControls from "@/components/other/VideoControls";
import userAtom from "@/atoms/userAtom";
import { currentVideosAtom, volumeAtom } from "@/atoms/reelsAtom";
import { langAtom } from "@/atoms/langAtom";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };
const fakeVideo = {
    _id: "v8",
    postedBy: {
        _id: 'me',
        username: 'testme',
        name: 'Me',
        profilePic: '/me.png',
    },
    text: "",
    video: "https://cloudinary/video.mp4",
    publicId: 'public123',
    likes: [],
    replies: [],
};
const fakeCurrentVideos = [
    {
        _id: "v8",
        postedBy: {
            _id: 'me',
            username: 'testme',
            name: 'Me',
            profilePic: '/me.png',
        },
        text: "",
        video: "https://cloudinary/video.mp4",
        publicId: 'public123',
        likes: [],
        replies: [],
    },
];

let videoRef;
let timeUpdateHandler;

const originalLocation = window.pathname;

const mockedShowSuccess = vi.fn();

vi.mock('@/hooks/useShowToast', () => {
    return { 
        default: () => ({
            showErrorToast: vi.fn(),
            showSuccessToast: mockedShowSuccess,
        }),
    };
});

vi.mock('@/utils/formatTime', () => ({
  formatTime: (secs) => `FMT:${Math.floor(secs || 0)}` // مثال: 12.3 -> "FMT:12"
}));

beforeEach(() => {
    globalThis.fetch = vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        });
    });

    timeUpdateHandler = undefined;
    videoRef = {
        current: {
            paused: true,
            duration: 100,       
            currentTime: 0,   
            play: vi.fn(function() { this.paused = false; }),
            pause: vi.fn(function() { this.paused = true; }),
            addEventListener: vi.fn((event, handler) => {
                if (event === "timeupdate") timeUpdateHandler = handler;
            }),
            removeEventListener: vi.fn(() => {})
        }
    };

    delete window.location;

    window.location = {
        href: 'http://localhost:3000/reels/reel/v8',
        pathname: '/reels/reel/v8'
    }
});

afterEach(() => {
    vi.resetAllMocks();
    timeUpdateHandler = undefined;

    //eslint-disable-next-line
    try { delete globalThis.fetch } catch(e) {};

    window.location = originalLocation;
});

describe("VideoControls Component", () => {
    it("shows alert dialog on click on delete icon and deleting the video by onclik on delete button and shows success toast", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/videos/delete/${fakeVideo._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'Video deleted successfully!',
                        result: { ok: true },
                        videoId: fakeVideo.video,
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <VideoControls 
                isFullscreen={false}
                isPlaying={false}
                openFullSecreen={vi.fn()}
                postedBy={fakeVideo.postedBy}
                setIsFullscreen={vi.fn()}
                setIsPlaying={vi.fn()}
                suppressAutoNavRef={{ current: null }}
                video={fakeVideo}
                videoContainerRef={{ current: null }}
                videoRef={videoRef}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(currentVideosAtom, fakeCurrentVideos);
                    snap.set(langAtom, 'en');
                    snap.set(volumeAtom, 1);
                },
            },
        );

        const deleteIcon = screen.getByTestId('delete-icon');
        expect(deleteIcon).toBeInTheDocument();

        await user.click(deleteIcon);

        const deleteBtn = await screen.findByText(/Delete/);
        expect(deleteBtn).toBeInTheDocument();

        await user.click(deleteBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/videos/delete/v8'),
                expect.any(Object),
            );
        });

        expect(mockedShowSuccess).toHaveBeenCalled();
    });

    it("toggles play/pause and calls audio.play + setIsPlaying", async () => {
        const user = userEvent.setup();

        const setIsPlaying = vi.fn();

        render(
            <VideoControls 
                isFullscreen={false}
                isPlaying={false}
                openFullSecreen={vi.fn()}
                postedBy={fakeVideo.postedBy}
                setIsFullscreen={vi.fn()}
                setIsPlaying={setIsPlaying}
                suppressAutoNavRef={{ current: null }}
                video={fakeVideo}
                videoContainerRef={{ current: null }}
                videoRef={videoRef}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(currentVideosAtom, fakeCurrentVideos);
                    snap.set(langAtom, 'en');
                    snap.set(volumeAtom, 1);
                },
            },
        );

        const playBtn = screen.getByTestId('play-btn');
        expect(playBtn).toBeInTheDocument();

        await user.click(playBtn);

        expect(videoRef.current.play).toHaveBeenCalled();
        expect(setIsPlaying).toHaveBeenCalledWith(true);

        await user.click(playBtn);

        expect(videoRef.current.pause).toHaveBeenCalled();
        expect(setIsPlaying).toHaveBeenCalledWith(false);
    });

    it("registers timeupdate listener and updates displayed time when handler is fired", async () => {
        const setIsPlaying = vi.fn();

        // because there are no currenttime/duration in the reels - just in homePage's/userPage's videos 
        window.location = {
            pathname: '/'
        };

        render(
            <VideoControls 
                isFullscreen={false}
                isPlaying={true}
                openFullSecreen={vi.fn()}
                postedBy={fakeVideo.postedBy}
                setIsFullscreen={vi.fn()}
                setIsPlaying={setIsPlaying}
                suppressAutoNavRef={{ current : null }}
                video={fakeVideo}
                videoContainerRef={{ current: null }}
                videoRef={videoRef}
            />, 
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(currentVideosAtom, fakeCurrentVideos);
                    snap.set(langAtom, 'en');
                    snap.set(volumeAtom, 1);
                },
            },
        );

        expect(videoRef.current.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
        expect(typeof timeUpdateHandler).toBe('function');

        await waitFor(() => {
            videoRef.current.currentTime = '40.5';
            timeUpdateHandler();
        });

        const displayed = await screen.findByText(/FMT:40/i);
        expect(displayed).toBeInTheDocument();
    });

    it("removes timeupdate lisener on unmount", async () => {
        const setIsPlaying = vi.fn();

        const { unmount } = render(
            <VideoControls 
                isFullscreen={false}
                isPlaying={true}
                openFullSecreen={vi.fn()}
                postedBy={fakeVideo.postedBy}
                setIsFullscreen={vi.fn()}
                setIsPlaying={setIsPlaying}
                suppressAutoNavRef={{ current : null }}
                video={fakeVideo}
                videoContainerRef={{ current: null }}
                videoRef={videoRef}
            />, 
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(currentVideosAtom, fakeCurrentVideos);
                    snap.set(langAtom, 'en');
                    snap.set(volumeAtom, 1);
                },
            },
        );

        expect(videoRef.current.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));

        unmount();

        expect(videoRef.current.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    });
});