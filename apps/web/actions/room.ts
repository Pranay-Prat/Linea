import { axiosInstance } from "../lib/axios";

export async function getRoomId(slug:string){
    const response = await axiosInstance.get(`/room/${slug}`);
    return response.data.room.id;
}