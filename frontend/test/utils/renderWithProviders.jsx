import React from "react";
import { render } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { MemoryRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";

const renderWithProviders = (
    ui,
    {
        route = '/',
        recoilStateInitializer = null,
        ...renderOptions
    } = {}
) => {
    const Wrapper = ({ children }) => (
        <RecoilRoot 
            initializeState={(snap) => {
                if (typeof recoilStateInitializer === 'function'){
                    recoilStateInitializer(snap);
                };
            }}
        >
            <ChakraProvider value={defaultSystem}>
                <MemoryRouter initialEntries={[route]}>
                    {children}
                </MemoryRouter>
            </ChakraProvider>
        </RecoilRoot>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

//eslint-disable-next-line
export * from '@testing-library/react';
export { renderWithProviders as render };
