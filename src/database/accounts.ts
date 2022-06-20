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
import { prisma } from "./database";

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

// eslint-disable-next-line import/prefer-default-export
export { createUser };
