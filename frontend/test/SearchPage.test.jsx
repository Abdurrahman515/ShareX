import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "./utils/renderWithProviders";
import SearchPage from "@/pages/SearchPage";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };

beforeEach(() => {
    globalThis.fetch = vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        });
    });
});

afterEach(() => {
    //eslint-disable-next-line
    try { delete globalThis.fetch } catch(e) {};
});

describe("SearchPage Component", () => {
    it("calls getAllusers on first entry", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/users/allusers')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([fakeCurrentUser]),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<SearchPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/allusers'),
            );
        });
    });
});