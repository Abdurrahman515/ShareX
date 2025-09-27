import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { render, screen } from "./utils/renderWithProviders";
import Conversation from "@/components/other/Conversation";
import userAtom from "@/atoms/userAtom";
import { selectedConversationAtom, unSeenMessagesAtom } from "@/atoms/messagesAtom";
import { langAtom } from "@/atoms/langAtom";
import { useRecoilValue } from "recoil";

const conversation = {
  _id: 'conv1',
  participants: [{ _id: 'u2', username: 'bob', profilePic: '/pic.jpg' }],
  lastMessage: { sender: 'u2', text: 'hello', isAudio: false, isVideo: false, arrived: true, seen: false },
  mock: false
};

const currentUser = { _id: 'u1', username: 'me', profilePic: '/me.jpg' };

const unseenMessages = [
  { conversationId: 'conv1', sender: { username: 'bob' }, text: 'hi' },
  { conversationId: 'conv1', sender: { username: 'bob' }, text: 'hi2' },
];

const ShowSelected = () => {
  const sel = useRecoilValue(selectedConversationAtom);
  return <div data-testid="sel">{sel?._id || 'none'}</div>;
};

describe("Conversation Component", () => {
    it("shows unread messages count and clears it on click", async () => {
        const user = userEvent.setup();

        render(
            <Conversation 
                conversation={conversation}
                isOnline={false}
                isWriting={false}
                isRecording={false}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, unseenMessages);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        const unReadCount = await screen.findByText(/2/i);
        expect(unReadCount).toBeInTheDocument();

        const username = screen.getByText(conversation.participants[0].username);
        expect(username).toBeInTheDocument();

        await user.click(username);

        expect(screen.queryByText('2')).toBeNull();
    });

    it('updates selectedConversation atom on click', async () => {
        const user = userEvent.setup();

        render(
            <>
                <Conversation 
                    conversation={conversation}
                    isOnline={false}
                    isWriting={false}
                    isRecording={false}
                />
                <ShowSelected />
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, []);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByTestId('sel').textContent).toBe('none');

        const username = screen.getByText(conversation.participants[0].username);
        expect(username).toBeInTheDocument();

        await user.click(username);

        expect(screen.getByTestId('sel').textContent).toBe(conversation._id);
    });

    it("shows 'Voice message' when it's last message", async () => {
        const audioConversation = { ...conversation, lastMessage: { ...conversation.lastMessage, isAudio: true, text: "" } };

        render(
            <>
                <Conversation 
                    conversation={audioConversation}
                    isOnline={false}
                    isWriting={false}
                    isRecording={false}
                />
                <ShowSelected />
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, []);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByText(/Voice message/i)).toBeInTheDocument();
    });

    it("shows 'Writing...' while the other user is writing", async () => {
        render(
            <>
                <Conversation 
                    conversation={conversation}
                    isOnline={false}
                    isWriting={true}
                    isRecording={false}
                />
                <ShowSelected />
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, []);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByText(/Writing.../i)).toBeInTheDocument();
    });

    it("shows 'Recording' while the other user is recording", async () => {
        render(
            <>
                <Conversation 
                    conversation={conversation}
                    isOnline={false}
                    isWriting={false}
                    isRecording={true}
                />
                <ShowSelected />
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, []);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByText(/Recording/)).toBeInTheDocument();
    });

    it("shows green circle while the other user is online", async () => {
        const { rerender } = render(
            <>
                <Conversation 
                    conversation={conversation}
                    isOnline={true}
                    isWriting={false}
                    isRecording={false}
                />
                <ShowSelected />
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, []);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByTestId('online')).toBeInTheDocument();

        rerender(
            <>
                <Conversation 
                    conversation={conversation}
                    isOnline={false}
                    isWriting={false}
                    isRecording={false}
                />
                <ShowSelected />
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, currentUser);
                    snap.set(unSeenMessagesAtom, []);
                    snap.set(selectedConversationAtom, {});
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.queryByTestId('online')).toBeNull();
    });
});