import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "./utils/renderWithProviders";
import UserPage from "@/pages/UserPage";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";

const fakeCurrentUser = { 
    _id: "me", 
    name: "Me", 
    username: "testme", 
    profilePic: "/me.png", 
    bio: 'developer', 
    followers: [], 
    following: [] 
};

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

vi.mock("@/hooks/useGetUserProfile", () => {
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
    try { delete globalThis.fetch } catch(e) {};
});

describe("UserPage Component", () => {
    it("calls getUserProfile on first entry", async () => {
        render(<UserPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalled();
        });
    });
});