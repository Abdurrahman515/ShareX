import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import PostPage from "@/pages/PostPage";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import postsAtom from "@/atoms/postsAtom";
import { DateTime } from 'luxon';
import userEvent from "@testing-library/user-event";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };
const fakePost = {
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

vi.mock('@/hooks/useGetUserProfile', () => {
    return {
        default: () => ({
            user: fakeCurrentUser,
            loading: false,
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

describe("PostPage Component", () => {
    it("calls getPost on first entry", async () => {
        
        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/posts/${fakePost._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(fakePost),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<PostPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, []);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/posts/${fakePost._id}`));
        });
    });

    it("shows error toast while trying to reply without a content", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/posts/${fakePost._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(fakePost),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<PostPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, [fakePost]);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(async () => {
            const replyBtn = screen.getByText(/Reply/);
            expect(replyBtn).toBeInTheDocument();

            await user.click(replyBtn);
        });


        await waitFor(() => {
            expect(mockedShowError).toHaveBeenCalled();
        });
    });

    it("adding comment while replying with a content", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/posts/${fakePost._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(fakePost),
                });
            };

            if(url.includes(`/api/posts/reply/${fakePost._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        userId: "me",
                        text: 'test comment',
                        userProfilePic: '/me.png',
                        username: 'testme',
                        createdAt: DateTime.now().toISO(),
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<PostPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, [fakePost]);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(async () => {
            const commentInp = screen.getByPlaceholderText(/comment goes here.../i);
            expect(commentInp).toBeInTheDocument();

            await user.type(commentInp, 'test comment');
        });

        await waitFor(async () => {
            const replyBtn = screen.getByText(/Reply/);
            expect(replyBtn).toBeInTheDocument();

            await user.click(replyBtn);
        });


        await waitFor(() => {
            const calls = globalThis.fetch.mock.calls.map(c => c[0]);

            expect(calls.some(u => u.includes(`/api/posts/reply/${fakePost._id}`))).toBeTruthy();
            expect(calls.some(u => u.includes(`/api/posts/${fakePost._id}`))).toBeTruthy();
        });
    });
});