import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import Message from "@/components/other/Message";
import userAtom from "@/atoms/userAtom";
import { selectedConversationAtom } from "@/atoms/messagesAtom";
import { langAtom } from "@/atoms/langAtom";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("@/utils/openFullSecreen", () => ({ openFullSecreen: vi.fn() }));
vi.mock("@/utils/DownloadBase64AsFile", () => ({ downloadBase64AsFile: vi.fn() }));

const fakeCurrentUser = { _id: "me", name: "Me", profilePic: "/me.png" };
const fakeSelectedConversation = { _id: 'conv', username: 'bob', userProfilePic: '/bob.png' };

describe("Message Component", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders own text message and seen/arrived icons", async () => {
        const message = {
            text: "Hello from me",
            img: null,
            video: {},
            audio: {},
            createdAt: new Date().toISOString(),
            isSending: false,
            arrived: true,
            seen: true,
        };

        render(
            <Message 
                ownMessage={true}
                isLastMessage={false}
                message={message}
                messagesEndRef={null}
                key={message._id}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(langAtom, 'en');
                },
            },
        );

        expect(screen.getByText(/Hello from me/)).toBeInTheDocument();

        expect(screen.getAllByText((content, node) => {
            return node?.querySelector && node.querySelector('svg');
        })).toBeTruthy();
    });

    it("opens dialog with image when clicking image and calls download on button click", async () => {
        const user = userEvent.setup();
        
        const message = {
            text: "",
            img: "data:image/png;base64,AAA", // base64 placeholder
            video: {},
            audio: {},
            createdAt: new Date().toISOString(),
            isSending: false,
            arrived: false,
            seen: false,
        };

        const { downloadBase64AsFile } = await import("@/utils/downloadBase64AsFile")

        render(
            <Message 
                isLastMessage={false}
                message={message}
                messagesEndRef={null}
                ownMessage={true}
                key={message._id}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(langAtom, 'en');
                },
            },
        );

        const imgEl = screen.getByRole('img');
        expect(imgEl).toBeInTheDocument();

        await user.click(imgEl);

        const downloadBtn = await screen.findByTestId('download-btn');
        
        await user.click(downloadBtn);

        expect(downloadBase64AsFile).toHaveBeenCalledWith(message.img);
    });

    it("assigns messagesEndRef when the message is the latest", async () => {
        const message = {
            text: "last one",
            img: null,
            video: {},
            audio: {},
            createdAt: new Date().toISOString(),
            isSending: false,
            arrived: false,
            seen: false,
        };

        const messagesEndRef = React.createRef();

        render(
            <Message 
                isLastMessage={true}
                message={message}
                messagesEndRef={messagesEndRef}
                ownMessage={true}
                key={message._id}
            />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(userAtom, fakeCurrentUser);
                    snap.set(selectedConversationAtom, fakeSelectedConversation);
                    snap.set(langAtom, 'en');
                },
            },
        );

        await waitFor(() => {
            expect(messagesEndRef.current).not.toBeNull();
        });

        expect(messagesEndRef.current.textContent).toContain('last one');
    });
});