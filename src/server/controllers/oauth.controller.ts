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
  GET,
  Inject,
} from "fastify-decorators";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createClient, services } from "../../linking/services";

@Controller({ route: "/oauth" })
export default class OauthController {
  @Inject(FastifyInstanceToken) declare static instance: FastifyInstance;

  @GET("/:id/authorize")
  async authorizeHandler(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id.toLowerCase();
    const service = services.find((s) => s.name.toLowerCase() === id);

    if (!service) {
      return OauthController.instance.httpErrors.notFound();
    }

    // TODO: State
    const client = createClient(service);
    const url = client.authorizeURL({
      redirect_uri: `${request.protocol}://${request.hostname}/oauth/${id}/callback`,
      scope: service.scopes,
    });

    return reply.redirect(url);
  }

  // TODO: Schema validation
  @GET("/:id/callback")
  async callbackHandler(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
      Querystring: {
        code: string;
      };
    }>
  ) {
    const id = request.params.id.toLowerCase();
    const service = services.find((s) => s.name.toLowerCase() === id);

    if (!service) {
      return OauthController.instance.httpErrors.notFound();
    }

    const client = createClient(service);

    try {
      const token = await client.getToken({
        code: request.query.code,
        redirect_uri: `${request.protocol}://${request.hostname}/oauth/${id}/callback`,
      });

      if (!token || token.expired()) {
        return OauthController.instance.httpErrors.badRequest();
      }

      return token.token;
    } catch (e) {
      return OauthController.instance.httpErrors.internalServerError();
    }
  }
}
