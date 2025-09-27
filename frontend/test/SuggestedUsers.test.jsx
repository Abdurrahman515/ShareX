import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "./utils/renderWithProviders";
import SuggestedUsers from "@/components/other/SuggestedUsers";
import { langAtom } from "@/atoms/langAtom";


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

describe("SuggestedUsers Component", () => {
    it("call getSuggestedUsers on first entry", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/users/suggested')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        {
                            _id: "u1", 
                            name: "Test", 
                            username: "testuser", 
                            profilePic: "/test.png",
                            followers: [],
                            following: [],
                        },
                    ]),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<SuggestedUsers />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/users/suggested'));
        });
    });
});