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

import {
  Controller,
  FastifyInstanceToken,
  Inject,
  POST,
} from "fastify-decorators";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import argon2 from "argon2";
import { createUser, prisma } from "../../database";
import { TokenPayload } from "../../manager/auth/types";

const CreateUserBody = Type.Object({
  email: Type.String(),
  username: Type.String(),
  password: Type.String(),
});
type CreateUserBodyType = Static<typeof CreateUserBody>;

const LoginBody = Type.Object({
  email: Type.Optional(Type.String()),
  username: Type.Optional(Type.String()),
  password: Type.String(),
});
type LoginBodyType = Static<typeof LoginBody>;

@Controller({ route: "/accounts" })
export default class AccountsController {
  @Inject(FastifyInstanceToken) declare static instance: FastifyInstance;

  @POST({
    url: "/create",
  })
  async createHandler(
    request: FastifyRequest<{
      Body: CreateUserBodyType;
    }>
  ) {
    const { email, username, password } = request.body;
    await createUser(email, username, password);

    // TODO: Login
    return { success: true };
  }

  @POST({ url: "/login" })
  async loginHandler(
    request: FastifyRequest<{
      Body: LoginBodyType;
    }>,
    reply: FastifyReply
  ) {
    const { email, username, password } = request.body;

    if (!email && !username) {
      return AccountsController.instance.httpErrors.badRequest(
        "Must provide either email or username"
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: {
          email: {
            equals: email,
            mode: "insensitive",
          },
          username: {
            equals: username,
            mode: "insensitive",
          },
        },
      },
    });

    if (!user) {
      return AccountsController.instance.httpErrors.badRequest(
        "Invalid credentials"
      );
    }

    if (!(await argon2.verify(user.password, password))) {
      return AccountsController.instance.httpErrors.badRequest(
        "Invalid credentials"
      );
    }

    // TODO: Refresh token
    const token = await reply.jwtSign(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      } as TokenPayload,
      {
        sign: {
          expiresIn: "1d",
        },
      }
    );

    return reply
      .setCookie("token", token, {
        path: "/",
        httpOnly: true,
      })
      .code(200)
      .send({ token });
  }
}
