import { atom } from "recoil";

export const videosAtom = atom({
    key: 'videosAtom',
    default: []
});

export const hasMoreAtom = atom({
    key: 'hasMoreAtom',
    default: true
});

export const pageAtom = atom({
    key: 'pageAtom',
    default: 1
});

export const volumeAtom = atom({
    key: 'volumeAtom',
    default: [100]
});

export const currentVideosAtom = atom({
    key: 'currentVideosAtom',
    default: []
});

export const targetIdAtom = atom({
    key: 'targetIdAtom',
    default: null
});

export const userReelsAtom = atom({
    key: 'userReelsAtom',
    default: []
});