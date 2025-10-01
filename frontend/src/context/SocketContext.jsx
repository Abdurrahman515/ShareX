import userAtom from "@/atoms/userAtom";
import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { io } from "socket.io-client";

const SocketContext = createContext();

//eslint-disable-next-line
export const useSocket = () => {
    return useContext(SocketContext);
}

export const SocketContextProvider = ({ children }) => {
    const [ socket, setSocket ] = useState(null);
    const [ onlineUsers, setOnlineUsers ] = useState([]);

    const user = useRecoilValue(userAtom);

    
    useEffect(() => {
        // eslint-disable-next-line
        const socketUrl = process.env.NODE_ENV !== 'production' ? "http://localhost:5000" : "wss://d313oyzovamctv.cloudfront.net";
        
        const socket = io(socketUrl, {
            path: "/socket.io",
            transports: ["websocket"],
            query: {
                userId: user?._id
            }
        });

        setSocket(socket);

        socket.on("getOnlineUsers", (users) => { // listening to the event that named at the server and sent from there
            setOnlineUsers(users); // the users is coming from server as array of userId
        });
        
        return () => socket && socket.close();
    }, [user?._id]);
    
    return(
        <SocketContext.Provider value={{socket, onlineUsers}}>
            {children}
        </SocketContext.Provider>
    )
}