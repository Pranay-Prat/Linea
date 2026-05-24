import { getChats } from "../actions/chat";

export const ChatRoom = async({id}: {id: string}) => {
    const messages=await getChats(id);
    return (
        <div>
            <h1>ChatRoom</h1>
        </div>
    );
};