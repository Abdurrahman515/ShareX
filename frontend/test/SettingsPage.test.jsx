import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import SettingsPage from "@/pages/SettingsPage";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import userEvent from "@testing-library/user-event";

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

const mockedLogout = vi.fn();

vi.mock('@/hooks/useLogout', () => {
    return {
        default: () => ({
            logout: mockedLogout,
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

describe("SettingsPage Component", () => {
    it("calls updateLang on unmount", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/users/update/${fakeCurrentUser._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'Profile updated successfully!',
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        const { unmount } = render(<SettingsPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        unmount();

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/users/update/${fakeCurrentUser._id}`),
                expect.any(Object),
            );
        });
    });

    it("opens an alert dialog and freezes the account, logout and shows success toast on click on freeze button", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/users/freeze')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<SettingsPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const firstFreezeBtn = screen.getByTestId(/first-freeze-btn/);
        expect(firstFreezeBtn).toBeInTheDocument();

        await user.click(firstFreezeBtn);

        const secondFreezeBtn = await screen.findByTestId(/second-freeze-btn/);
        expect(secondFreezeBtn).toBeInTheDocument();

        await user.click(secondFreezeBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/freeze'),
                expect.any(Object),
            );
        });

        expect(mockedLogout).toHaveBeenCalled();
        expect(mockedShowSuccess).toHaveBeenCalled();
    });
});