import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import ChatPage from "@/pages/ChatPage";
import userAtom from "@/atoms/userAtom";
import { conversationsAtom, messagesAtom } from "@/atoms/messagesAtom";
import { langAtom } from "@/atoms/langAtom";
import userEvent from "@testing-library/user-event";


const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };
const fakeConversations = [
    { _id: '507f1f77bcf86cd799439011', mock: false, participants: [{ _id: 'u1', username: 'bob', userProfilePic: '/bob.png '}], lastMessage: { text: "hello", sender: 'u1', isAudio: false, isVideo: false, seen: true, arrived: true }},
];
const fakeMessages = [
    { conversationId: '507f1f77bcf86cd799439011', sender: 'u1', receiver: fakeCurrentUser.username, text: 'hello', img: "", audio: { url: "", publicId: "", duration: "00:00" }, video: { videoUrl: "", publicId: "" }, createdAt: new Date().toISOString() },
];

const mockedShowError = vi.fn();

const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
};

vi.mock('@/hooks/useShowToast', () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: vi.fn(),
        }),
    };
});

vi.mock('@/context/SocketContext', () => {
    return {
        useSocket: () => ({ socket: mockSocket, onlineUsers: [] }),
        socketContextProvider: ({ children }) => children,
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

describe("ChatPage Component", () => {
    it("calls getConversations on firts entry", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/messages/conversations')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        {
                            _id: '507f1f77bcf86cd799439011', 
                            mock: false, 
                            participants: [{ _id: 'u1', username: 'bob', userProfilePic: '/bob.png '}], 
                            lastMessage: { text: "hello", sender: 'u1', isAudio: false, isVideo: false, seen: true, arrived: true }
                        },
                    ]),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<ChatPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(conversationsAtom, []);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/messages/conversations'));
        });
    });

    it("shows an error toast while trying to search without typing anything", async () => {
        const user = userEvent.setup();

        render(<ChatPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const searchIcon = screen.getByTestId('search-icon');
        expect(searchIcon).toBeInTheDocument();

        await user.click(searchIcon);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it("calls search user function while trying to search for a user", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/users/profile/ali_212')){
                return Promise.resolve({
                    ok: true,
                    json: () => ({
                        _id: "u1", 
                        name: "Ali", 
                        username: "ali_212", 
                        profilePic: "/ali.png"
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(<ChatPage />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(langAtom, 'en');
                },
            }
        )

        const searchInp = screen.getByPlaceholderText(/search for a user/i);
        expect(searchInp).toBeInTheDocument();

        await user.type(searchInp, 'ali_212');

        const searchIcon = screen.getByTestId('search-icon');
        expect(searchIcon).toBeInTheDocument();

        await user.click(searchIcon);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/users/profile/ali_212'));
        });
    });
});