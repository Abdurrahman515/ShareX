import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import MessageContainer from "@/components/other/MessageContainer";
import userAtom from "@/atoms/userAtom";
import { conversationsAtom, messagesAtom, selectedConversationAtom } from "@/atoms/messagesAtom";
import { langAtom } from "@/atoms/langAtom";

const mockedShowSuccess = vi.fn();

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };
const fakeSelectedConversation1 = { _id: '507f1f77bcf86cd799439011', userId: "u1", username: 'bob', userProfilePic: '/bob.png', mock: false, isOpened: false };
const fakeSelectedConversation2 = { _id: '', userId: "u2", username: 'john', userProfilePic: '/john.png', mock: true };
const fakeConversations = [
    { _id: '507f1f77bcf86cd799439011', mock: false, participants: [{ _id: 'u1', username: 'bob', userProfilePic: '/bob.png '}], lastMessage: { text: "hello", sender: 'u1', isAudio: false, isVideo: false, seen: true, arrived: true }},
    { _id: '', mock: true, participants: [{ _id: 'u2', username: 'john', userProfilePic: '/john.png '}], lastMessage: { text: "", sender: '', isAudio: false, isVideo: false, seen: false, arrived: false }},
];
const fakeMessages = [
    { _id: 'm1', conversationId: '507f1f77bcf86cd799439011', sender: 'u1', receiver: fakeCurrentUser.username, text: 'hello', img: "", audio: { url: "", publicId: "", duration: "00:00" }, video: { videoUrl: "", publicId: "" }, createdAt: new Date().toISOString() },
];

const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
};

vi.mock("@/hooks/useShowToast", () => {
    return {
        default: () => ({
            showErrorToast: vi.fn(),
            showSuccessToast: mockedShowSuccess,
        }),
    };
});

vi.mock("@/context/SocketContext", () => {
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
    try { delete globalThis.fetch; } catch (e) {}
});

describe("MessageContainer Component", () => {
    it("shows warning text while the conversation is mock and save it on click on save", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/messages/${fakeSelectedConversation2.userId}/save?lang=en`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        conversationId: "conv2"
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <MessageContainer 
                isOnline={false}
                recordingUserId={""}
                writingUserId={""}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(selectedConversationAtom, fakeSelectedConversation2);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const warningText = document.getElementsByClassName('warningText')[0];
        expect(warningText).toBeInTheDocument();

        const saveBtn = screen.getByText(/Save/);
        expect(saveBtn).toBeInTheDocument();

        await user.click(saveBtn);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/messages/${fakeSelectedConversation2.userId}/save?lang=en`),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
            }),
        );

        expect(mockedShowSuccess).toHaveBeenCalled();
    });

    it("deleting the mock conversation on click delete button", async () => {
        const user = userEvent.setup();

        render(
            <MessageContainer 
                isOnline={false}
                recordingUserId={null}
                writingUserId={null}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(selectedConversationAtom, fakeSelectedConversation2);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const deleteBtn = screen.getByText(/Delete/);
        expect(deleteBtn).toBeInTheDocument();

        await user.click(deleteBtn);

        expect(screen.queryByText("john")).toBeNull();
    });

    it("get messages when selecting a conersations", async () => {
        globalThis.fetch = vi.fn((url) => {
            if(url.includes(`/api/messages/${fakeSelectedConversation1.userId}`)){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(
                        [
                            { 
                                _id: "m1", 
                                conversationId: '507f1f77bcf86cd799439011', 
                                sender: 'u1', 
                                receiver: fakeCurrentUser.username, 
                                text: 'hello', 
                                img: "", 
                                audio: { url: "", publicId: "", duration: "00:00" }, 
                                video: { videoUrl: "", publicId: "" }, createdAt: new Date().toISOString() 
                            },
                        ],
                    ),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({})});
        });

        render(
                <MessageContainer 
                    isOnline={false}
                    recordingUserId={null}
                    writingUserId={null}
                />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(selectedConversationAtom, {...fakeSelectedConversation1, isOpened: false});
                    snap.set(messagesAtom, []);
                    snap.set(langAtom, 'en');
                },
            },
        );
        
        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/messages/${fakeSelectedConversation1.userId}`)
            );
        });

    });
});