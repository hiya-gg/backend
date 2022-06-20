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
import { Static, Type } from "@sinclair/typebox";
import { createClient, services } from "../../linking/services";

const OAuthParams = Type.Object({
  id: Type.String(),
});
type OAuthParamsType = Static<typeof OAuthParams>;

const OAuthCodeQuery = Type.Object({
  code: Type.String(),
});
type OAuthCodeQueryType = Static<typeof OAuthCodeQuery>;

@Controller({ route: "/oauth" })
export default class OauthController {
  @Inject(FastifyInstanceToken) declare static instance: FastifyInstance;

  @GET({
    url: "/:id/authorize",
    options: {
      schema: {
        params: OAuthParams,
      },
    },
  })
  async authorizeHandler(
    request: FastifyRequest<{
      Params: OAuthParamsType;
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

  @GET({
    url: "/:id/callback",
    options: {
      schema: {
        params: OAuthParams,
        querystring: OAuthCodeQuery,
      },
    },
  })
  async callbackHandler(
    request: FastifyRequest<{
      Params: OAuthParamsType;
      Querystring: OAuthCodeQueryType;
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
