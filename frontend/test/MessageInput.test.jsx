import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import userAtom from "@/atoms/userAtom";
import { conversationsAtom, messagesAtom, selectedConversationAtom } from "@/atoms/messagesAtom";
import { langAtom } from "@/atoms/langAtom";
import { volumeAtom } from "@/atoms/reelsAtom";

const fakeCurrentUser = { _id: "me", name: "Me", username: "testme", profilePic: "/me.png" };
const fakeSelectedConversation = { _id: '507f1f77bcf86cd799439011', userId: "u1", username: 'bob', userProfilePic: '/bob.png', mock: false, isOpened: false };
const fakeConversations = [
    { _id: '507f1f77bcf86cd799439011', mock: false, participants: [{ _id: 'u1', username: 'bob', userProfilePic: '/bob.png '}], lastMessage: { text: "hello", sender: 'u1', isAudio: false, isVideo: false, seen: true, arrived: true }},
];
const fakeMessages = [
    { conversationId: '507f1f77bcf86cd799439011', sender: 'u1', receiver: fakeCurrentUser.username, text: 'hello', img: "", audio: { url: "", publicId: "", duration: "00:00" }, video: { videoUrl: "", publicId: "" }, createdAt: new Date().toISOString() },
];

const mockedShowError = vi.fn();

const RecordAudioMock = {
    audioUrl: "",
    recording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    blob: "",
    setAudioUrl: vi.fn(),
    duration: "00:00",
};

const PreviewVideoMock = {
    handleVideoChange: vi.fn(),
    videoUrl: '',
    setVideoUrl: vi.fn(),
    file: null,
    uploading: false,
};

const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
    off: vi.fn(),
};

vi.mock("@/hooks/useShowToast", () => {
    return {
        default: () => ({
            showErrorToast: mockedShowError,
            showSuccessToast: vi.fn(),
        }),
    };
});

vi.mock("@/hooks/usePreviewVideo", () => {
    return {
        default: () => PreviewVideoMock,
    };
});

vi.mock("@/hooks/usePreviewImg", () => {
    return {
        default: () => ({
            handleImageChange: vi.fn(),
            imgUrl: "",
            setImgUrl: vi.fn(),
        }),
    };
});

vi.mock("@/hooks/useRecordVoice", () => {
    return {
        default: () => RecordAudioMock,
    };
});

vi.mock("@/context/SocketContext", () => {
    return {
        useSocket: () => ({ socket: mockSocket, onlineUsers: [] }),
        socketContextProvider: ({ children }) => children,
    };
});

beforeEach(() => {
    PreviewVideoMock.file = "";
    PreviewVideoMock.videoUrl = "";
    PreviewVideoMock.uploading = false;

    RecordAudioMock.audioUrl = "";
    RecordAudioMock.duration = "00:00";
    RecordAudioMock.blob = "";
    RecordAudioMock.recording = false;

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
    try { delete globalThis.fetch; } catch (e) {};
});

describe("MessageInput Component", () => {
    it("shows an error toast when trying to send an empty message", async () => {
        const user = userEvent.setup();

        const { default: MessageInput } = await import('@/components/other/MessageInput');

        render(<MessageInput inputRef={null} messagesEndRef={null}/>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const sendBtn = screen.getByTestId('send-btn');
        expect(sendBtn).toBeInTheDocument();

        await user.click(sendBtn);

        expect(mockedShowError).toHaveBeenCalled();
    });

    it("sending a text message with a notification", async () => {
        const user = userEvent.setup();

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/messages/send')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(
                        { 
                            conversationId: '507f1f77bcf86cd799439011', 
                            sender: fakeCurrentUser._id, 
                            receiver: fakeSelectedConversation.username, 
                            text: 'hi', 
                            img: "", 
                            audio: { url: "", publicId: "", duration: "00:00" }, 
                            video: { videoUrl: "", publicId: "" }, 
                            createdAt: new Date().toISOString() 
                        },
                    ),
                });
            };

            if(url.includes('/api/notification/send')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'notification sent!',
                    }),
                });
            };

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        const { default: MessageInput } = await import('@/components/other/MessageInput');

        let inputRef = { current: null };

        render(<MessageInput inputRef={inputRef} messagesEndRef={null} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const textarea = screen.getByPlaceholderText(/Type a message .../i);
        inputRef.current = textarea;

        expect(textarea).toBeInTheDocument();

        await user.type(textarea, 'hi');

        const sendBtn = screen.getByTestId('send-btn');
        expect(sendBtn).toBeInTheDocument();

        await user.click(sendBtn);
  
        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/messages/send'),
                expect.any(Object),
            );
        });

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/notification/send'),
                expect.any(Object),
            );
        })
    });

    it("recording an voice message on click on audio icon", async () => {
        const user = userEvent.setup();

        const { default: MessageInput } = await import('@/components/other/MessageInput');

        const { rerender } = render(<MessageInput inputRef={{ current: null }} messagesEndRef={null} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const recordBtn = await screen.findByTestId('record')
        expect(recordBtn).toBeInTheDocument();

        await user.click(recordBtn);
        RecordAudioMock.recording = true;
        
        expect(RecordAudioMock.startRecording).toHaveBeenCalled();

        rerender(<MessageInput inputRef={{ current: null }} messagesEndRef={null} />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        )

        const stopBtn = await screen.findByTestId('stop-record')
        await user.click(stopBtn);

        expect(RecordAudioMock.stopRecording).toHaveBeenCalled();
    });

    it("sending a voice message with notification", async () => {
        const user = userEvent.setup();

        const parts = ['RIFF....WAVEfmt '];
        const mockBlob = new Blob(parts, { type: 'audio/wav' });

        RecordAudioMock.blob = mockBlob;
        RecordAudioMock.audioUrl = "local-audio.wav";
        RecordAudioMock.duration = "00:45";

        globalThis.fetch = vi.fn((url) => {
            if(url.includes('/api/videos/get-signature/audio')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        timestamp: '45sec',
                        signature: '123456',
                        cloudName: 'demo-cloud',
                        apiKey: 'key123',
                    }),
                });
            };

            if(url.includes('https://api.cloudinary.com/v1_1/demo-cloud/video/upload')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        secure_url: "https://cloudinary/audio.wav",
                        public_url: 'public123'
                    })
                })
            }

            if(url.includes('/api/messages/send')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(
                        { 
                            conversationId: '507f1f77bcf86cd799439011', 
                            sender: fakeCurrentUser._id, 
                            receiver: fakeSelectedConversation.username, 
                            text: '', 
                            img: "", 
                            audio: { url: "https://cloudinary/audio.wav", publicId: "public123", duration: "00:45" }, 
                            video: { videoUrl: "", publicId: "" }, 
                            createdAt: new Date().toISOString() 
                        },
                    ),
                });
            };

            if(url.includes('/api/notification/send')){
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: 'notification sent',
                    }),
                });
            };

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });

        const { default: MessageInput } = await import('@/components/other/MessageInput');

        render(<MessageInput inputRef={{ current: null }} messagesEndRef={null}/>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(conversationsAtom, fakeConversations);
                    snap.set(messagesAtom, fakeMessages);
                    snap.set(volumeAtom, 1);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const sendBtn = screen.getByTestId('send-btn');
        expect(sendBtn).toBeInTheDocument();

        const audio = screen.getByTestId('audio');
        expect(audio).toBeInTheDocument(); 

        await user.click(sendBtn);

        await waitFor(() => {
            const calls = globalThis.fetch.mock.calls.map(call => call[0]);
            expect(calls.some(call => call.includes('/api/videos/get-signature/audio'))).toBeTruthy();
            expect(calls.some(call => call.includes('https://api.cloudinary.com/v1_1/demo-cloud/video/upload'))).toBeTruthy();
            expect(calls.some(call => call.includes('/api/notification/send'))).toBeTruthy();
        });
    });
});