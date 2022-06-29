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

import { Controller, POST } from "fastify-decorators";
import { FastifyReply, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { createTokenPair, createUser, login, refresh, TokenResponse } from "../../manager/auth";
import { fastify } from "../index";

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

const RefreshBody = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
});
type RefreshBodyType = Static<typeof RefreshBody>;

const InvalidateBody = Type.Object({
  accessToken: Type.String(),
});
type InvalidateBodyType = Static<typeof InvalidateBody>;

@Controller({ route: "/accounts" })
export default class AccountsController {
  @POST({
    url: "/create",
    options: {
      schema: {
        body: CreateUserBody,
      },
    },
  })
  async createHandler(
    request: FastifyRequest<{
      Body: CreateUserBodyType;
    }>,
    reply: FastifyReply
  ) {
    const { email, username, password } = request.body;
    const user = await createUser(email, username, password);

    const pair = createTokenPair(user, ["*"]);
    return AccountsController.sendLoginResponse(reply, pair.accessToken, pair.refreshToken);
  }

  @POST({
    url: "/login",
    options: {
      schema: {
        body: LoginBody,
      },
    },
  })
  async loginHandler(
    request: FastifyRequest<{
      Body: LoginBodyType;
    }>,
    reply: FastifyReply
  ) {
    const { email, username, password } = request.body;

    if (!email && !username) {
      return fastify.httpErrors.badRequest("Must provide either email or username");
    }

    const token = await login((email || username) as string, password);
    return AccountsController.sendLoginResponse(reply, token.accessToken, token.refreshToken);
  }

  @POST({
    url: "/refresh",
    options: {
      schema: {
        body: RefreshBody,
      },
    },
  })
  async refreshHandler(
    request: FastifyRequest<{
      Body: RefreshBodyType;
    }>,
    reply: FastifyReply
  ) {
    const { accessToken, refreshToken } = request.body;
    const token = await refresh(accessToken, refreshToken);
    return AccountsController.sendLoginResponse(reply, token.accessToken, token.refreshToken);
  }

  // noinspection JSUnusedLocalSymbols
  @POST({
    url: "/invalidate",
    options: {
      schema: {
        body: InvalidateBody,
      },
    },
  })
  async invalidateHandler(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: FastifyRequest<{
      Body: InvalidateBodyType;
    }>
  ) {
    // TODO: Implement
    return { success: true };
  }

  private static sendLoginResponse(reply: FastifyReply, accessToken: string, refreshToken: string) {
    return reply
      .setCookie("token", JSON.stringify(accessToken), {
        httpOnly: true,
      })
      .code(200)
      .send({
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60 * 1000,
        type: "Bearer",
      } as TokenResponse);
  }
}
