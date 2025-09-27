import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { render, screen } from "./utils/renderWithProviders";
import CreateReelOrPost from "@/components/other/CreateReelOrPost";
import { outOfReelsPageAtom } from "@/atoms/placeAtom";
import { langAtom } from "@/atoms/langAtom";


describe("CreateReelOrPost component", () => {
    it("open the dialog on click on the addIcon", async() => {
        const user = userEvent.setup();

        render(<CreateReelOrPost />,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(outOfReelsPageAtom, 'true');
                    snap.set(langAtom, 'en');
                },
            },
        );

        const addIcon = screen.getByRole('button');
        expect(addIcon).toBeInTheDocument();

        await user.click(addIcon)

        expect(screen.getByPlaceholderText(/Post content goes here.../i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Caption goes here.../i)).toBeInTheDocument();
    });
});