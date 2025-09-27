import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import userEvent from "@testing-library/user-event";
import { render, screen } from "./utils/renderWithProviders";
import { waitFor } from '@testing-library/react';
import userAtom from "@/atoms/userAtom";
import postsAtom from "@/atoms/postsAtom";
import { langAtom } from "@/atoms/langAtom";

const mockedShowError = vi.fn();
const mockedShowSuccess = vi.fn();

vi.mock('axios');

vi.mock('@/hooks/useShowToast', () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: mockedShowSuccess,
        }),
    };
});

vi.mock("@/hooks/usePreviewImg", () => {
    return {
        default: () => ({
            handleImageChange: vi.fn(),
            imgUrl: "",
            setImgUrl: vi.fn()
        }),
    };
});

const PreviewVideoMock = {
    handleVideoChange: vi.fn(),
    videoUrl: '',
    setVideoUrl: vi.fn(),
    file: null,
    uploading: false,
}

vi.mock("@/hooks/usePreviewVideo", () => {
    return {
        default: () => PreviewVideoMock,
    };
});

const fakeUser = { _id: "u1", username: 'testuser'};

beforeEach(() => {
    vi.resetAllMocks();

    PreviewVideoMock.file = null;
    PreviewVideoMock.videoUrl = "";
    PreviewVideoMock.uploading = false;

    globalThis.fetch = vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
        });
    });
});

afterEach(() => {
    //eslint-disable-next-line
    try { delete globalThis.fetch; } catch (e) {}
});

describe("CreatePost Component", () => {
    it("show error toast when trying to post without content", async () => {
        const user = userEvent.setup();

        const { default: CreatePost } = await import("@/components/other/CreatePost");

        render(<CreatePost setOpen={vi.fn()} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeUser);
                    snap.set(postsAtom, []);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const postBtn = screen.getByText(/Post|نشر/);
        expect(postBtn).toBeInTheDocument();

        await user.click(postBtn);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it('creates text-only post by calling /api/posts/create', async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/posts/create')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        _id: 'newPost1',
                        postedBy: { _id: fakeUser._id, username: fakeUser.username },
                        text: 'Hello',
                        likes: [],
                        replies: [],
                    }),
                });
            };
            return () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        const { default: CreatePost } = await import("@/components/other/CreatePost");

        render(<CreatePost setOpen={vi.fn()} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeUser);
                    snap.set(postsAtom, []);
                    snap.set(langAtom, 'en');
                }
            }
        );

        const textarea = screen.getByPlaceholderText(/Post content goes here...|اكتب محتوى المنشور هنا.../i);
        expect(textarea).toBeInTheDocument();

        await user.type(textarea, "Hello");

        const postBtn = screen.getByText(/Post|نشر/);
        expect(postBtn).toBeInTheDocument();

        await user.click(postBtn);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/posts/create'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
                body: expect.anything(String),
            }),
        );

        expect(mockedShowSuccess).toHaveBeenCalled();
    });

    it("handles video upload flow: gets signature, uploads with axios, then creates post", async () => {
        const user = userEvent.setup();

        PreviewVideoMock.file = new File(["dummy"], "video.mp4", { type: "video/mp4" });
        PreviewVideoMock.videoUrl = "local-video.mp4";

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/videos/get-signature/video')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        signature: "sig123",
                        timestamp: "12345",
                        apiKey: "api-key",
                        cloudName: "demo-cloud"
                    })
                })
            }

            if(url.includes('/api/posts/create')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        _id: 'newVideoPost',
                        postedBy: { _id: fakeUser._id, username: fakeUser.username },
                        text: 'video post',
                        video: { videoUrl: 'https://cloudinary/video.mp4', publicId: 'public123' },
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        axios.post.mockResolvedValue({
            data: {
                secure_url: 'https://cloudinary/video.mp4',
                public_id: 'public123'
            }
        });

        const { default: CreatePost } = await import("@/components/other/CreatePost");

        render(<CreatePost setOpen={vi.fn()} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeUser);
                    snap.set(postsAtom, []);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const postBtn = screen.getByText(/Post|نشر/i);
        expect(postBtn).toBeInTheDocument();

        await user.click(postBtn);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(mockedShowSuccess).toHaveBeenCalled();
        });

        await waitFor(() => {
            const urls = globalThis.fetch.mock.calls.map(c => c[0]);
            expect(urls.some(u => u.includes('/api/videos/get-signature/video'))).toBeTruthy();
            expect(urls.some(u => u.includes('/api/posts/create'))).toBeTruthy();
        });
    });
});