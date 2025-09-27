import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from 'luxon';
import { render, waitFor } from "./utils/renderWithProviders";
import PostsSection from "@/components/other/PostsSection";
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
    try { delete globalThis.fetch; } catch (e) {};
});

describe("PostsSection Component", () => {
    it("calls getPosts function on open the window", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/posts/user/me')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(
                        [
                            {
                                _id: 'post123',
                                postedBy: {
                                    _id: 'me',
                                    username: 'testme',
                                    name: 'Me',
                                    profilePic: '/me.png',
                                    isFrozen: false,
                                },
                                text: 'test post',
                                img: "",
                                video: {
                                    videoUrl: "",
                                    publicId: "",
                                },
                                likes: [],
                                replies: [],
                                repostedPost: {
                                    isReposted: false,
                                },
                                createdAt: DateTime.now().toISO(),
                            },
                        ]
                    ),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<PostsSection user={fakeCurrentUser} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en');
                },
            },
            
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/posts/user/me'),
                expect.any(Object),
            );
        })
    });
});