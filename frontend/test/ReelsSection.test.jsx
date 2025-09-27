import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "./utils/renderWithProviders";
import ReelsSection from "@/components/other/ReelsSection";
import { userReelsAtom } from "@/atoms/reelsAtom";
import { langAtom } from "@/atoms/langAtom";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };

vi.mock('@/hooks/useShowToast', () => {
    return {
        default: () => ({
            showErrorToast: vi.fn(),
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
    try { delete globalThis.fetch; } catch(e) {};
});

describe("ReelsSection Component", () => {
    it("calls getUserReels on entry", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/videos/${fakeCurrentUser.username}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(
                        [
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
                        ],
                    ),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
        
        render(<ReelsSection user={fakeCurrentUser} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userReelsAtom, []);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/videos/${fakeCurrentUser.username}`),
                expect.any(Object),
            );
        });
    });
});