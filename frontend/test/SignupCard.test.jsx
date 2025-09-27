import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import SignupCard from "@/components/other/SignupCard";
import { langAtom } from "@/atoms/langAtom";


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

describe("SignupCard Component", () => {
    it("shows error toast while trying to sign up with out data", async () => {
        const user = userEvent.setup();

        render(<SignupCard />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en');
                },
            },
        );

        const signupBtn = screen.getByTestId('signup-btn');
        expect(signupBtn).toBeInTheDocument();

        await user.click(signupBtn);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it("singup and shows success toast while filling in all fields", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/users/signup')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        _id: "u1",
                        name: 'Test User',
                        username: 'testuser',
                        email: 'test@email.com',
                        profilePic: "",
                        bio: "",
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<SignupCard />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en');
                },
            },
        );

        const fullNameInp = screen.getByTestId("full-name-inp");
        expect(fullNameInp).toBeInTheDocument();

        const usernameInp = screen.getByTestId("username-inp");
        expect(usernameInp).toBeInTheDocument();

        const emailInp = screen.getByTestId("email-inp");
        expect(emailInp).toBeInTheDocument();

        const passwordInp = screen.getByTestId("password-inp");
        expect(passwordInp).toBeInTheDocument();

        await user.type(fullNameInp, 'Test User');
        await user.type(usernameInp, 'testuser');
        await user.type(emailInp, 'test@email.com');
        await user.type(passwordInp, '123456');
        
        const signupBtn = screen.getByTestId('signup-btn');
        expect(signupBtn).toBeInTheDocument();

        await user.click(signupBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/signup'),
                expect.any(Object),
            );
        });

        expect(mockedShowSuccess).toHaveBeenCalled();
    });
});