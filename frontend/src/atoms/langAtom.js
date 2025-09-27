import { atom } from "recoil";

export const langAtom = atom({
    key: 'langAtom',
    default: JSON.parse(localStorage.getItem('user-sharex'))?.lang || navigator.language
});