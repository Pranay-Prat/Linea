import { axiosInstance } from "../lib/axios";

export async function signin(data: {email: string, password: string}) {
  const response = await axiosInstance.post(
    "/api/auth/signin",
    data
  );

  return response.data;
}