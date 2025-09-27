import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import Reel from "@/components/other/Reel";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";

const mockedShowSuccess = vi.fn();

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

    // eslint-disable-next-line
    try { delete globalThis.fetch; } catch (e) {};
});

describe("Reel Component", () => {
    it('delete the reel on click on delete icon and shows success toast', async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/videos/delete/${fakeVideo._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'Video deleted successfully!',
                        publicId: 'public123',
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<Reel idx={0} postedBy={fakeCurrentUser} video={fakeVideo} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en')
                },
            },
        );

        const deleteIcon = screen.getByTestId('delete-icon');
        expect(deleteIcon).toBeInTheDocument();

        await user.click(deleteIcon);

        const deleteBtn = await screen.findByTestId('delete-btn');
        expect(deleteBtn).toBeInTheDocument();

        await user.click(deleteBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/videos/delete/${fakeVideo._id}`),
                expect.any(Object),
            );
        });

        expect(mockedShowSuccess).toHaveBeenCalled();
    });
});