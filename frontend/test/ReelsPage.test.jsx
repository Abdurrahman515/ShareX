import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "./utils/renderWithProviders";
import ReelsPage from "@/pages/ReelsPage";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };

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

const mockedGetFeedVideos = vi.fn();

vi.mock('@/hooks/useGetFeedReels', () => {
    return {
        default: () => ({
            getFeedVideos: mockedGetFeedVideos,
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

describe("ReelsPage Component", () => {
    it("calls getFeedVideos on first entry", async () => {
        render(<ReelsPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(mockedGetFeedVideos).toHaveBeenCalled();
        });
    });
});