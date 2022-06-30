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
import * as emailValidator from "email-validator";
import { container } from "tsyringe";
import { createTokenPair, jwtDecode, jwtVerify, snowflake, validateRefreshToken } from "./tokens";
import { TokenResponse } from "./types";
import { Prisma, PrismaConnection, RedisConnection } from "../../external";

const createUser = async (email: string, username: string, password: string) => {
  if (!emailValidator.validate(email)) {
    throw new Error("Invalid email");
  }

  const passwordHash = await argon2.hash(password);

  try {
    return container.resolve(PrismaConnection).user.create({
      data: {
        id: snowflake.getUniqueID().toString(),
        email,
        username,
        password: passwordHash,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        throw new Error("User already exists");
      }
    }

    throw e;
  }
};

const login = async (usernameOrEmail: string, password: string): Promise<TokenResponse> => {
  const user = await container.resolve(PrismaConnection).user.findFirst({
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

  return createTokenPair(user, ["*"]);
};

/**
 * Invalidates a token pair.
 * @param token The token to invalidate.
 * @returns Whether the token was invalidated.
 */
const invalidate = async (token: string): Promise<boolean> => {
  const verify = await jwtVerify(token);
  const userId = verify.type === "access" ? verify.access?.user.id : verify.refresh?.user?.id;

  if (!userId) {
    throw new Error("Invalid token");
  }

  const rows = await container.resolve(RedisConnection).redis.sAdd(`invalid:${userId}`, verify.pairId);
  return rows === 1;
};

const isInvalidated = async (token: string) => {
  const decoded = await jwtDecode(token);
  const userId = decoded.type === "access" ? decoded.access?.user.id : decoded.refresh?.user?.id;

  const { redis } = container.resolve(RedisConnection);
  if (decoded.exp && decoded.exp < Date.now() / 1000) {
    // Since this is already invalidated, we can return true
    // and not block for the removal operation.
    redis.sRem(`invalid:${userId}`, decoded.pairId).then();
    return true;
  }

  return redis.sIsMember(`invalid:${userId}`, decoded.pairId);
};

const refresh = async (accessToken: string, refreshToken: string): Promise<TokenResponse> => {
  if (!validateRefreshToken(accessToken, refreshToken)) {
    throw new Error("Invalid refresh token");
  }

  const decoded = await jwtDecode(accessToken);
  if (!decoded.access?.user) {
    throw new Error("Invalid refresh token");
  }

  if ((await isInvalidated(accessToken)) || (await isInvalidated(refreshToken))) {
    throw new Error("Invalid token pair");
  }

  const user = await container.resolve(PrismaConnection).user.findFirst({
    where: {
      id: decoded?.access?.user?.id,
    },
  });

  if (!user) {
    throw new Error("Invalid refresh token");
  }

  await invalidate(accessToken);
  return createTokenPair(user, ["*"]);
};

export { createUser, login, refresh, invalidate, isInvalidated };
