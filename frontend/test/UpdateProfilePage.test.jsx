import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import UpdateProfilePage from "@/pages/UpdateProfilePage";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png", bio: 'developer' };

const mockedPreviewImg = {
    handleImageChange: vi.fn(),
    imgUrl: "",
    setImgUrl: vi.fn(),
};

const mockedShowError = vi.fn();
const mockedShowSuccess = vi.fn();

vi.mock('@/hooks/usePreviewImg', () => {
    return {
        default: () => (mockedPreviewImg),
    };
});

vi.mock("@/hooks/useShowToast", () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: mockedShowSuccess,
        }),
    };
});

beforeEach(() => {
    globalThis.fetch = vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json:() => Promise.resolve({}),
        });
    });
});

afterEach(() => {
    vi.resetAllMocks();

    //eslint-disable-next-line
    try { delete globalThis.fetch } catch (e) {};
});

describe("UpdateProfilePage Component", () => {
    it("updates user data on click on Save button", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/users/update/${fakeCurrentUser._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'Profile updated successfully!',
                        user: fakeCurrentUser,
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<UpdateProfilePage />,{
            recoilStateInitializer: (snap) => {
                snap.set(userAtom, fakeCurrentUser);
                snap.set(langAtom, 'en');
            },
        });

        const saveBtn = screen.getByText(/Save/);
        expect(saveBtn).toBeInTheDocument();

        await user.click(saveBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/users/update/${fakeCurrentUser._id}`),
                expect.any(Object),
            );
        });

        expect(mockedShowSuccess).toHaveBeenCalled();
    });
});