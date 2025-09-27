import { atom } from "recoil";

export const outOfChatPageAtom = atom({
    key: 'outOfChatPageAtom',
    default: true
});

export const outOfHomePageAtom = atom({
    key: 'outOfHomePageAtom',
    default: true
})

export const navigatedAtom = atom({
    key: 'navigatedAtom',
    default: {
        isNavigated: false,
        user: {}
    }
});

export const outOfReelsPageAtom = atom({
    key: "outOfReelsPageAtom",
    default: true
});