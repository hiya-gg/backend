/*
 * HiyaGG - Universal connections for all your accounts
 * Copyright (C) 2022 Zerite Development
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import * as emailValidator from "email-validator";
import { prisma } from "../../database";
import {
  createAccessToken,
  createRefreshToken,
  jwtDecode,
  validateRefreshToken,
} from "./tokens";
import { TokenResponse } from "./types";

const createUser = async (
  email: string,
  username: string,
  password: string
) => {
  if (!emailValidator.validate(email)) {
    throw new Error("Invalid email");
  }

  const passwordHash = await argon2.hash(password);

  try {
    return await prisma.user.create({
      data: {
        email,
        username,
        password: passwordHash,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        throw new Error("User already exists");
      }
    }

    throw e;
  }
};

const login = async (
  usernameOrEmail: string,
  password: string
): Promise<TokenResponse> => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: {
            equals: usernameOrEmail,
            mode: "insensitive",
          },
        },
        {
          username: {
            equals: usernameOrEmail,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!(await argon2.verify(user.password, password))) {
    throw new Error("Invalid credentials");
  }

  const accessToken = createAccessToken(user, ["*"]);
  const refreshToken = createRefreshToken(user, accessToken);

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60,
    type: "Bearer",
  };
};

const refresh = async (
  accessToken: string,
  refreshToken: string
): Promise<TokenResponse> => {
  if (!validateRefreshToken(accessToken, refreshToken)) {
    throw new Error("Invalid refresh token");
  }

  const decoded = await jwtDecode(accessToken);
  if (!decoded.access?.user) {
    throw new Error("Invalid refresh token");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: decoded?.access?.user?.id,
    },
  });

  if (!user) {
    throw new Error("Invalid refresh token");
  }

  // TODO: Invalidate access token & refresh token
  const newAccessToken = createAccessToken(user, ["*"]);
  const newRefreshToken = createRefreshToken(user, newAccessToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 24 * 60 * 60,
    type: "Bearer",
  };
};

export { createUser, login, refresh };
