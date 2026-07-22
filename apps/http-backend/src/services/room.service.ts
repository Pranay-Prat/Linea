import { prismaClient } from "@repo/db/client";

export const roomService = {
  createRoom: async (roomName: string, adminId: string) => {
    const slug =
      roomName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") +
      "-" +
      Math.random().toString(36).substring(2, 7);

    return await prismaClient.room.create({
      data: {
        slug: slug,
        adminId: adminId,
      },
    });
  },

  getRoomBySlug: async (slug: string) => {
    return await prismaClient.room.findUnique({
      where: {
        slug: slug
      }
    });
  }
};
