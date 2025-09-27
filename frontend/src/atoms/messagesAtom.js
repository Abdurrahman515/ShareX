import { atom } from "recoil";

export const conversationsAtom = atom({
    key: 'conversationsAtom',
    default: []
});

export const selectedConversationAtom = atom({
    key: 'selectedConversationAtom',
    default: {
        _id: "", // id of the conversation
        userId: "", // the user who we chating with
        username: "",
        userProfilePic: "",
        mock: false,
        isOpened: false
    }
});

export const messagesAtom = atom({
    key: 'messagesAtom',
    default: [],
});

export const unSeenMessagesAtom = atom({
    key: 'unSeenMessagesAtom',
    default: []
})