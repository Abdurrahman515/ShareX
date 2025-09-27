import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import userEvent from "@testing-library/user-event";
import React from "react";
import AudioControls from "@/components/other/AudioControls";

vi.mock('@/utils/formatTime', () => ({
  formatTime: (secs) => `FMT:${Math.floor(secs || 0)}` // مثال: 12.3 -> "FMT:12"
}));

describe("AudioControls component", () => {
    let audioRef;
    let timeUpdateHandler;

    beforeEach(() => {
        timeUpdateHandler = undefined;
        audioRef = {
            current: {
                paused: true,
                duration: 100,       
                currentTime: 0,   
                play: vi.fn(function() { this.paused = false; }),
                pause: vi.fn(function() { this.paused = true; }),
                addEventListener: vi.fn((event, handler) => {
                    if (event === "timeupdate") timeUpdateHandler = handler;
                }),
                removeEventListener: vi.fn(() => {})
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        timeUpdateHandler = undefined;
    });

    it('toggles play/pause and calls audio.play + setIsPlaying', async () => {
        const user = userEvent.setup();

        const setIsPlaying = vi.fn();

        render(
            <AudioControls
                audioRef={audioRef}
                sender={{ userProfilePic: "", profilePic: "" }}
                isPlaying={false}
                setIsPlaying={setIsPlaying}
                ownMessage={false}
                isMessageInput={false}
                duration={"01:40"}
                currentDuration={"00:20"}
            />
        );

        const playBtn = await screen.findByRole('button');
        expect(playBtn).toBeInTheDocument();

        await user.click(playBtn);
        
        expect(audioRef.current.play).toHaveBeenCalled();
        expect(setIsPlaying).toHaveBeenCalledWith(true);

        await user.click(playBtn);

        expect(audioRef.current.pause).toHaveBeenCalled();
        expect(setIsPlaying).toHaveBeenCalledWith(false);

    });

    it("registers timeupdate listener and updates displayed time when handler is fired", async () => {
        const setIsPlaying = vi.fn();

        render(
            <AudioControls
                audioRef={audioRef}
                sender={{ userProfilePic: "", profilePic: "" }}
                isPlaying={true}
                setIsPlaying={setIsPlaying}
                ownMessage={false}
                isMessageInput={false}
                duration={"01:40"}
                currentDuration={"00:20"}
            />
        );

        expect(audioRef.current.addEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));
        expect(typeof timeUpdateHandler).toBe('function');

        await waitFor(() => {
            audioRef.current.currentTime = 42.3;
            timeUpdateHandler();
        });

        const displayed = await screen.findByText(/FMT:42/);
        expect(displayed).toBeInTheDocument();
    });

    it("removes timeupdate lisener on unmount", async () => {
        const setIsPlaying = vi.fn();

        const { unmount } = render(
            <AudioControls
                audioRef={audioRef}
                sender={{ userProfilePic: "", profilePic: "" }}
                isPlaying={true}
                setIsPlaying={setIsPlaying}
                ownMessage={false}
                isMessageInput={false}
                duration={"01:40"}
                currentDuration={"00:20"}
            />
        );

        expect(audioRef.current.addEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));

        unmount();
        
        expect(audioRef.current.removeEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));

    });
});