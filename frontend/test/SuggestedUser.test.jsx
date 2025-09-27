import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import SuggestedUser from "@/components/other/SuggestedUser";
import { langAtom } from "@/atoms/langAtom";

const fakeUser = { _id: "u1", name: "Test", username: "testuser", profilePic: "/test.png" };

const mockedFollowUnFollow = vi.fn();

vi.mock('@/hooks/useFollowUnfollow', () => {
    return {
        default: () => ({
            handleFollowUnfollow: mockedFollowUnFollow,
            following: false,
            loading: false
        }),
    };
});

// it's inside handleFollowUnfollow function
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
    try { delete globalThis.fetch } catch (e) {};
});

describe("SuggestedUser Component", () => {
    it("follows/unfollows user by onclick on follow/unfollow button", async () => {
        const user = userEvent.setup();

        render(<SuggestedUser user={fakeUser} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en');
                },
            },
        );

        const followBtn = screen.getByText(/Follow/);
        expect(followBtn).toBeInTheDocument();

        await user.click(followBtn);

        await waitFor(() => {
            expect(mockedFollowUnFollow).toHaveBeenCalled();
        });
    });
});