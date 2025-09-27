import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "./utils/renderWithProviders";
import Header from "@/components/other/Header";
import userAtom from "@/atoms/userAtom";
import { langAtom } from "@/atoms/langAtom";
import { useSetRecoilState } from "recoil";
import { useEffect } from "react";


describe("Header Component", () => {
    const SetUser = ({ user }) => {
        const setUser = useSetRecoilState(userAtom);
        useEffect(() => {
            setUser(user);
        }, [user, setUser]);
        
        return null;
    }


    it("shows signup/login options while there are no user", async () => {
        const { rerender } = render(
            <>
                <Header />
                <SetUser user={null}/>
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en');
                },
            }
        );

        expect(screen.getByText(/Login/)).toBeInTheDocument();
        expect(screen.getByText(/Signup/)).toBeInTheDocument();

        rerender(
            <>
                <Header />
                <SetUser user={{ _id: 'u1', username: 'testuser', name: 'Test' }}/>
            </>,
            {
                recoilStateInitializer: (snap) => {
                    snap.set(langAtom, 'en')
                },
            },
        );

        await waitFor(() => {
            expect(screen.queryByText(/Login/)).toBeNull();
            expect(screen.queryByText(/Signup/)).toBeNull();
        });

    });
});