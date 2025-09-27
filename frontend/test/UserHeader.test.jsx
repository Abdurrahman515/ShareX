import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "./utils/renderWithProviders";
import UserHeader from "@/components/other/UserHeader";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";

const fakeUser = { _id: "u1", name: "Test", username: "testuser", profilePic: "/test.png", followers: [], following: [] };
const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png", followers: [], following: [] };

const mockedFollowUnFollow = vi.fn();

vi.mock('@/hooks/useFollowUnfollow', () => {
    return {
        default: () => ({
            handleFollowUnfollow: mockedFollowUnFollow,
            following: false,
            loading: false,
        }),
    };
});

vi.mock('@/hooks/useShowSuccessToast', () => {
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

describe("UserHeader Component", () => {
    it('calls handleFollowUnfollow on click on follow button', async () => {
        const user = userEvent.setup();

        render(<UserHeader user={fakeUser} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const followBtn = screen.getByText(/Follow/);
        expect(followBtn).toBeInTheDocument();

        await user.click(followBtn);

        expect(mockedFollowUnFollow).toHaveBeenCalled();
    });

    it("shows 'update profile' button while it's own", async () => {
        render(<UserHeader user={fakeCurrentUser} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const updateProfileBtn = screen.getByText(/update profile/i);
        expect(updateProfileBtn).toBeInTheDocument();
    });
});