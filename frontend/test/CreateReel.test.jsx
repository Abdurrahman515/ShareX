import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import axios from "axios";


const mockedShowError = vi.fn();
const mockedShowSuccess = vi.fn();

vi.mock('axios');

vi.mock("@/hooks/useShowToast", () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: mockedShowSuccess,
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

const fakeUser = { _id: "u1", username: 'testuser', name: 'Test' };

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

describe("CreateReel Component", () => {
    it('shows error toast while trying to post without a content', async () => {
        const user = userEvent.setup();

        const { default: CreateReel } = await import("@/components/other/CreateReel")

        render(<CreateReel setOpen={vi.fn()} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const postBtn = screen.getByText(/Post|نشر/);
        expect(postBtn).toBeInTheDocument();

        await user.click(postBtn);
        expect(mockedShowError).toHaveBeenCalled();
    });

    it("getting signature, uploads video to cloudinary and saving the url in the database", async () => {
        const user = userEvent.setup();

        PreviewVideoMock.file = new File(["dummy"], "video.mp4", { type: "video/mp4" });
        PreviewVideoMock.videoUrl = "local-video.mp4";

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/videos/get-signature/video')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        signature: "sign123",
                        timestamp: '25min',
                        apiKey: 'test515',
                        cloudName: 'demo-cloud',
                    }),
                });
            };

            if(url.includes('/api/videos/save')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        text: "",
                        video: "https://cloudinary/video.mp4",
                        publicId: 'public123',
                        postedBy: { _id: fakeUser._id, username: fakeUser.username, name: fakeUser.name },
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

        const { default: CreateReel } = await import("@/components/other/CreateReel");

        render(<CreateReel setOpen={vi.fn()} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeUser);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const postBtn = screen.getByText(/Post|نشر/);
        expect(postBtn).toBeInTheDocument();

        await user.click(postBtn);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(mockedShowSuccess).toHaveBeenCalled();
        });

        await waitFor(() => {
            const calls = globalThis.fetch.mock.calls.map(call => call[0]);
            expect(calls.some(url => url.includes('/api/videos/get-signature/video'))).toBeTruthy();
            expect(calls.some(url => url.includes('/api/videos/save'))).toBeTruthy();
        });
    });
});