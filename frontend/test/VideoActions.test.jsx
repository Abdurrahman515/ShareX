import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import VideoActions from "@/components/other/VideoActions";
import userAtom from "@/atoms/userAtom";
import { currentVideosAtom, videosAtom } from "@/atoms/reelsAtom";
import { langAtom } from "@/atoms/langAtom";
import { DateTime } from 'luxon';

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

const mockedShowError = vi.fn();

vi.mock('@/hooks/useShowToast', () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: vi.fn(),
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

describe("VideoActions Component", () => {
    it("shows error toast while trying to like without logining in", async() => {
        const user = userEvent.setup();

        render(<VideoActions video={fakeVideo} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, null);
                    snap.set(videosAtom, [fakeVideo]);
                    snap.set(currentVideosAtom, [fakeVideo]);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const likeIcon = screen.getByLabelText(/Like/);
        expect(likeIcon).toBeInTheDocument();

        await user.click(likeIcon);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it("calls handleLikeUnlike by on click on like icon", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/videos/like/${fakeVideo._id}`)){
                return Promise.resolve({
                    ok: true, 
                    json: () => Promise.resolve({
                        message: 'video liked successfully!',
                    }),
                });
            };

            return Promise.resolve({});
        });

        render(<VideoActions video={fakeVideo} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(videosAtom, [fakeVideo]);
                    snap.set(currentVideosAtom, [fakeVideo]);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const likeIcon = screen.getByLabelText(/Like/);
        expect(likeIcon).toBeInTheDocument();

        await user.click(likeIcon);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/videos/like/${fakeVideo._id}`),
                expect.any(Object),
            );
        });
    });

    it("opens a drawer on click on share icon", async () => {
        const user = userEvent.setup();

        render(<VideoActions video={fakeCurrentUser} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(videosAtom, [fakeVideo]);
                    snap.set(currentVideosAtom, [fakeVideo]);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const shareIcon = screen.getByLabelText(/Share/);
        expect(shareIcon).toBeInTheDocument();

        await user.click(shareIcon);

        const shareTxt = await screen.findByText(/share the video by:/i)
        expect(shareTxt).toBeInTheDocument();
    });

    it("opens a drawer for comments on click on comment icon", async () => {
        const user = userEvent.setup();

        render(<VideoActions video={fakeVideo} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(videosAtom, [fakeVideo]);
                    snap.set(currentVideosAtom, [fakeVideo]);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const commentIcon = screen.getByLabelText(/Comment/);
        expect(commentIcon).toBeInTheDocument();

        await user.click(commentIcon);

        const noCommentMessage = await screen.findByText(/no comments yet!/i);
        expect(noCommentMessage).toBeInTheDocument();
    });

    it("shows error toast while trying to reply without a text", async () => {
        const user = userEvent.setup();

        render(<VideoActions video={fakeVideo} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(videosAtom, [fakeVideo]);
                    snap.set(currentVideosAtom, [fakeVideo]);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const commentIcon = screen.getByLabelText(/Comment/);
        expect(commentIcon).toBeInTheDocument();

        await user.click(commentIcon);

        const replyBtn = await screen.findByText(/Reply/);
        expect(replyBtn).toBeInTheDocument();

        await user.click(replyBtn);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it("calls handleReply while replying with a text", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/videos/reply/${fakeVideo._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        userId: 'me',
                        test: 'test comment',
                        userProfilePic: '/me.png',
                        username: 'testme',
                        createdAt: DateTime.now().toISO(),
                    }),
                })
            }
        });

        render(<VideoActions video={fakeVideo} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(videosAtom, [fakeVideo]);
                    snap.set(currentVideosAtom, [fakeVideo]);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const commentIcon = screen.getByLabelText(/Comment/);
        expect(commentIcon).toBeInTheDocument();

        await user.click(commentIcon);

        const replyBtn = await screen.findByText(/Reply/);
        expect(replyBtn).toBeInTheDocument();

        const commentInp = await screen.findByPlaceholderText(/comment goes here/i);
        expect(commentInp).toBeInTheDocument();

        await user.type(commentInp, 'test comment');

        await user.click(replyBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/videos/reply/${fakeVideo._id}`),
                expect.any(Object),
            );
        });
    });
});