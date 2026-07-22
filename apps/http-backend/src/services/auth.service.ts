import { prismaClient } from "@repo/db/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export const authService = {
  signup: async (email: string, name: string, passwordPlain: string) => {
    const isExist = await prismaClient.user.findUnique({
      where: { email },
    });
    if (isExist) {
      return { error: "User already exists", status: 422 };
    }
    
    const hashedPass = await bcrypt.hash(passwordPlain, 10);
    const user = await prismaClient.user.create({
      data: {
        email,
        name,
        password: hashedPass,
      },
    });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "3d",
    });
    
    return { user, token };
  },

  login: async (email: string, passwordPlain: string) => {
    const user = await prismaClient.user.findUnique({
      where: { email }
    });
    if (!user) {
      return { error: "User not found", status: 401 };
    }
    
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
    if (!isPasswordValid) {
      return { error: "Invalid credentials", status: 401 };
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { 
      expiresIn: "3d" 
    });
    
    return { user, token };
  }
};
