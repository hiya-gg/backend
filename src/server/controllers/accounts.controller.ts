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
import { FastifyInstance, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { createUser } from "../../database";

const CreateUserBody = Type.Object({
  email: Type.String(),
  username: Type.String(),
  password: Type.String(),
});
type CreateUserBodyType = Static<typeof CreateUserBody>;

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

    // TODO: Login
    return createUser(email, username, password);
  }
}
