import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import userEvent from "@testing-library/user-event";
import React from "react";
import postsAtom from "@/atoms/postsAtom";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import Actions from "@/components/other/Actions";
import { Route, Routes } from "react-router-dom";

const mockedShowError = vi.fn();
const mockedShowSuccess = vi.fn();

let fakeUser;
let fakePost;

vi.mock('@/hooks/useShowToast', () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: mockedShowSuccess,
        }),
    };
});

beforeEach(() => {
    globalThis.fetch = vi.fn(() => 
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        })
    );

    mockedShowError.mockClear();
    mockedShowSuccess.mockClear();

    fakeUser = { _id: "u1", username: "testuser"};
    fakePost = {
        _id: 'p1',
        postedBy: { _id: 'u2', username: 'other' },
        likes: [],
        replies: [],
    };
});

afterEach(() => {
    vi.restoreAllMocks();
    
    try { delete globalThis.fetch; } catch (e) {return console.log(e)}
});

describe("Actions Component", () => {
    it("should toggle like and call api with signal", async () => {
        const user = userEvent.setup();

        render(<Actions post={fakePost} isReposted={false}/>, {
            recoilStateInitializer: (snap) => {
                snap.set(userAtom, fakeUser);
                snap.set(postsAtom, [fakePost]);
                snap.set(langAtom, 'en');
            },
        });

        const likeSvg = screen.getByLabelText(/Like/i);

        expect(globalThis.fetch).not.toHaveBeenCalled();

        await user.click(likeSvg);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/posts/like/${fakePost._id}`),
            expect.objectContaining({
                method: 'PUT',
                signal: expect.anything(),
            }),
        );

        expect(likeSvg).toHaveAttribute('fill', "rgb(237, 73, 86)");
    });

    it('should open repost dialog, type text and call repost API and show success toast', async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/posts/repost/${fakePost._id}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        _id: 'newPost',
                        postedBy: { _id: fakeUser._id, username: fakeUser.username },
                        likes: [],
                        replies: [],
                        text: "hello"
                    })
                })
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve()});
        });

        render(<Actions post={fakePost} isReposted={false} />, {
            recoilStateInitializer: (snap) => {
                snap.set(userAtom, fakeUser);
                snap.set(postsAtom, [fakePost]);
                snap.set(langAtom, 'en');
            },
        });

        const repostSVG = screen.getByLabelText(/Repost/i);
        await user.click(repostSVG);

        const textarea = screen.getByPlaceholderText(/Post content goes here|اكتب محتوى المنشور هنا/i);
        await user.type(textarea, "test repost post text");

        const postBtn = screen.getByText(/Post|نشر/);
        await user.click(postBtn);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/posts/repost/${fakePost._id}`),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
                body: expect.any(String),
            }),
        );

        expect(mockedShowSuccess).toHaveBeenCalled();
    });

    it("should open a drawer when the share svg have been clicked and close it when the close button have been clicked", async () => {
        const user = userEvent.setup();

        render(<Actions post={fakePost} isReposted={false} />, {
            recoilStateInitializer: (snap) => {
                snap.set(userAtom, fakeUser);
                snap.set(postsAtom, [fakePost]);
                snap.set(langAtom, 'en');
            },
        });

        const shareSvg = screen.getByLabelText(/Share|مشاركة/i);
        await user.click(shareSvg);

        const drawerTitle = await screen.findByText(/Share the post by:|المشاركة بواسطة:/i);

        expect(drawerTitle).toBeInTheDocument();

        const closBtn = await screen.findByRole('button', { name: /close/i });
        await user.click(closBtn);

        await waitFor(() => expect(drawerTitle).not.toBeInTheDocument());
    });

    it("should navigate the user to post page by click on it", async () => {
        const user = userEvent.setup();

        render(
            <Routes>
                <Route path="/" element={<Actions post={fakePost} isReposted={false} />} />
                <Route path="/:username/post/:pid" element={<div data-testid="post-page">POST PAGE</div>} />
            </Routes>, 
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeUser);
                    snap.set(postsAtom, [fakePost]);
                    snap.set(langAtom, 'en');
                },
                route: '/',
            }
        );

        const commentSVG = screen.getByLabelText(/Comment/i);
        await user.click(commentSVG);

        const postPage = await screen.findByTestId("post-page");
        expect(postPage).toBeInTheDocument();
    });
});