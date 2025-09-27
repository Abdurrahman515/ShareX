import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import RepostedPost from "@/components/other/RepostedPost";
import { DateTime } from 'luxon';
import userAtom from "@/atoms/userAtom";
import postsAtom from "@/atoms/postsAtom";
import { volumeAtom } from "@/atoms/reelsAtom";
import { langAtom } from "@/atoms/langAtom";
import userEvent from "@testing-library/user-event";

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
            isReposted: true,
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
            createdAt: DateTime.now().toISO(),
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
            isReposted: true,
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
            createdAt: DateTime.now().toISO(),
        },
        createdAt: DateTime.now().toISO(),
    },
];

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

describe('RepostedPost Component', () => {
    it("shows the delete icon while the post is own", async () => {
        const { rerender } = render(<RepostedPost post={fakePosts[1]} postedBy={fakePosts[1].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const deleteIcon = screen.getByTestId('delete-icon');
        expect(deleteIcon).toBeInTheDocument();

        rerender(<RepostedPost post={fakePosts[0]} postedBy={fakePosts[0].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.queryByTestId('delete-icon')).toBeNull();
    });

    it("shows alert dialog on click on delete icon and delete it on click on delete button", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/posts/delete/${fakePosts[1]._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'Post deleted successfully!',
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<RepostedPost post={fakePosts[1]} postedBy={fakePosts[1].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const deleteIcon = screen.getByTestId('delete-icon');
        expect(deleteIcon).toBeInTheDocument();

        await user.click(deleteIcon);

        const deleteBtn = await screen.findByText(/Delete/)
        expect(deleteBtn).toBeInTheDocument();

        await user.click(deleteBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/posts/delete/${fakePosts[1]._id}`),
                expect.any(Object)
            )
        });

        expect(mockedShowSuccess).toHaveBeenCalled();
    });

    it("opens the img/video in a dialog on click", async () => {
        const user = userEvent.setup();

        render(<RepostedPost post={fakePosts[0]} postedBy={fakePosts[0].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const img = screen.getByTestId('img');
        expect(img).toBeInTheDocument();

        await user.click(img);

        const openedImg = await screen.findByTestId('opened-img');
        expect(openedImg).toBeInTheDocument();
    });
});