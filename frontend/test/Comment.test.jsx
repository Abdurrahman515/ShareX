import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import Comment from "@/components/other/Comment";
import { DateTime } from 'luxon';


describe("Comment component", () => {
    let reply;
    
    beforeEach(() => {
        reply = {
            userId: "u1",
            test: "test",
            userProfilePic: "",
            username: "testuser",
            createdAt: DateTime.now().toISO(),
        }
    })
    
    it("shows the divider just while it's last reply", async () => {
        const { rerender } = render(<Comment reply={reply} lastReply={false}/>);

        const divider = screen.getByTestId('divider');
        expect(divider).toBeInTheDocument();

        await waitFor(() => {
            rerender(<Comment reply={reply} lastReply={true} />);
            
            const maybeDivider = screen.queryByTestId('divider');
            expect(maybeDivider).toBeNull();
        });

    });
});