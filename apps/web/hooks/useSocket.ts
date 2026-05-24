import { useEffect, useState } from "react";
import { WS_URL } from "../config";
import { getToken } from "../lib/auth";
export function useSocket(){
    const[loading,setLoading] = useState<boolean>(true);
    const[socket,setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        const token = getToken();
        if (!token) return;
        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        setSocket(ws);
        setLoading(false);
        return () => {
            ws.close();
        };
    }, []);
    return { loading, socket };
}