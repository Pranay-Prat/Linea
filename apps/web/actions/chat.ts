import { axiosInstance } from "../lib/axios";

export async function getChats(roomId:string){
    const response = await axiosInstance.get(`/chat/get-chats/${roomId}`);
    return response.data.messages;
}