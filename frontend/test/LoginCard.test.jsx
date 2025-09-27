import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import LoginCard from "@/components/other/LoginCard";
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
    try { delete globalThis.fetch; } catch (e) {}
});

describe("LoginCard Component", () => {
    it("shows error toast when sending a login request without data", async () => {
        const user = userEvent.setup();

        render(<LoginCard />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en')
                },
            },
        );

        const loginBtn = screen.getByTestId('login-btn');
        expect(loginBtn).toBeInTheDocument();

        await user.click(loginBtn);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it("logining in when the correct data is entried", async () => {
        const user = userEvent.setup();

        globalThis.fetch((url) => {
            if(url.includes('/api/users/login')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        _id: 'u1',
                        username: 'testuser',
                        name: 'Test'
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<LoginCard />,
            {recoilStateInitializer: (snap) => snap.set(langAtom, 'en')},
        );

        const usernameInput = screen.getByTestId('username-inp');
        expect(usernameInput).toBeInTheDocument();

        const passwordInput = screen.getByTestId('password-inp');
        expect(passwordInput).toBeInTheDocument();

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, '123456');
        await user.click(screen.getByTestId('login-btn'));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/login'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object),
                    body: expect.any(String)
                })
            );
            expect(mockedShowSuccess).toHaveBeenCalled();
        });
    });
});