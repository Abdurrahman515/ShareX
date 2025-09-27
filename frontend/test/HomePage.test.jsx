import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from 'luxon';
import { render, waitFor } from "./utils/renderWithProviders";
import HomePage from "@/pages/HomePage";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import postsAtom from "@/atoms/postsAtom";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };
const fakePosts = [
    {
        _id: 'post123',
        postedBy: {
            _id: 'u1',
            username: 'testuser',
            name: 'Test',
            profilePic: '/test.png',
            isFrozen: false,
        },
        text: 'test post',
        img: "",
        video: {
            videoUrl: "",
            publicId: "",
        },
        likes: [],
        replies: [],
        repostedPost: {
            isReposted: false,
        },
        createdAt: DateTime.now().toISO(),
    },
    {
        _id: 'post456',
        postedBy: {
            _id: 'me',
            username: 'testme',
            name: 'Me',
            profilePic: '/me.png',
            isFrozen: false,
        },
        text: 'test post2',
        img: "data:image/base64,zzzaa...",
        video: {
            videoUrl: "",
            publicId: "",
        },
        likes: [],
        replies: [],
        repostedPost: {
            isReposted: false,
        },
        createdAt: DateTime.now().toISO(),
    },
];

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

const mockedShowError = vi.fn();
const mockedShowSuccess = vi.fn();

vi.mock('@/hooks/useShowToast', () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: mockedShowSuccess,
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
    try { delete globalThis.fetch } catch (e) {};
});

describe("HomePage Component", () => {

    it("call getFeedPosts, getSuggestedReels and getSuggestedUsers on first entry", async () => {

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/posts/feed')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        posts: fakePosts,
                        hasMore: false
                    }),
                });
            };

            if(url.includes('/api/videos/suggested')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([fakeVideo]),
                });
            };

            if(url.includes('/api/users/suggested')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([]),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<HomePage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, []);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            const calls = globalThis.fetch.mock.calls.map(c => c[0]);
            expect(calls.some(u => u.includes('/api/posts/feed'))).toBeTruthy();
            expect(calls.some(u => u.includes('/api/videos/suggested'))).toBeTruthy();
            expect(calls.some(u => u.includes('/api/users/suggested'))).toBeTruthy();
        });
    });
});