import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "./utils/renderWithProviders";
import ReelItem from "@/components/other/ReelItem";
import { currentVideosAtom, pageAtom, targetIdAtom, videosAtom, volumeAtom } from "@/atoms/reelsAtom";
import { langAtom } from "@/atoms/langAtom";
import userAtom from "@/atoms/userAtom";

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

vi.mock("@/hooks/useShowToast", () => {
    return {
        default: () => ({
            showErrorToast: vi.fn(),
            showSuccessToast: vi.fn(),
        }),
    };
});

vi.mock("@hooks/useGetFeedReels", () => {
    return {
        default: () => ({
            default: () => ({
                getFeedVideos: vi.fn(),
                loading: false,
            }),
        }),
    };
});

beforeEach(() => {
    globalThis.fetch = vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        });
    });
});

afterEach(() => {
    vi.resetAllMocks();

    //eslint-disable-next-line
    try { delete globalThis.fetch; } catch (e) {};
});

describe("ReelItem Component", () => {
    it("calls getReelVideo while you entry to link without passing from reelsPage (by a link)", async () => {
        
        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/videos/reel/${fakeVideo._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
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
                    }),
                });
            };

            return Promise.resolve({ ok:true, json: () => Promise.resolve({}) });
        });
        
        render(<ReelItem />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(currentVideosAtom, []);
                    snap.set(videosAtom, []);
                    snap.set(targetIdAtom, null);
                    snap.set(pageAtom, 1);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/videos/reel/${fakeVideo._id}`)
            );
        });
    });
});