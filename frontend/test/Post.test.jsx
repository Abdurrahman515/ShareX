import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from 'luxon';
import userEvent from "@testing-library/user-event";
import { render, screen } from "./utils/renderWithProviders";
import Post from "@/components/other/Post";
import userAtom from "@/atoms/userAtom";
import postsAtom from "@/atoms/postsAtom";
import { langAtom } from "@/atoms/langAtom";
import { volumeAtom } from "@/atoms/reelsAtom";

const mockedShowError = vi.fn();
const mockedShowSuccess = vi.fn();

vi.mock("@/hooks/useShowToast", () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: mockedShowSuccess,
        }),
    };
});

vi.mock("@/utils/DownloadBase64AsFile", () => ({ downloadBase64AsFile: vi.fn() }));

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

    // eslint-disable-next-line
    try { delete globalThis.fetch; } catch (e) {};
});

describe("Post component", () => {
    it("opening alert dialog and deleting the post by on click on delete button", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/posts/delete/${fakePosts[1]._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'Post deleted successfully!'
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<Post post={fakePosts[1]} postedBy={fakePosts[1].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1)
                    snap.set(langAtom, 'en');
                },
            },
        );

        const deleteIcon = screen.getByTestId('delete-icon');
        expect(deleteIcon).toBeInTheDocument();

        await user.click(deleteIcon);

        const deleteBtn = await screen.findByText(/Delete/);
        expect(deleteBtn).toBeInTheDocument();

        await user.click(deleteBtn);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/posts/delete/${fakePosts[1]._id}`),
            expect.any(Object),
        );
    });

    it("shows the delete icon just while the post is own", async () => {
        const { rerender } = render(<Post post={fakePosts[0]} postedBy={fakePosts[0].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1)
                    snap.set(langAtom, 'en');
                },
            },
        );

        const deleteIcon = screen.queryByTestId('delete-icon');
        expect(deleteIcon).toBeNull();

        rerender(<Post post={fakePosts[1]} postedBy={fakePosts[1].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1)
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    });

    it("shows the post image in a dialog on click, shows download icon and downloads the image on click", async () => {
        const user = userEvent.setup();

        render(<Post post={fakePosts[1]} postedBy={fakePosts[1].postedBy} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(postsAtom, fakePosts);
                    snap.set(volumeAtom, 1)
                    snap.set(langAtom, 'en');
                },
            },
        );

        const img = screen.getByTestId('post-img');
        expect(img).toBeInTheDocument();

        await user.click(img);

        const downloadIcon = await screen.findByTestId('download-icon');
        expect(downloadIcon).toBeInTheDocument();

        await user.click(downloadIcon);

        const { downloadBase64AsFile } = await import('@/utils/downloadBase64AsFile');

        expect(downloadBase64AsFile).toHaveBeenCalledWith(fakePosts[1].img);
    });
});