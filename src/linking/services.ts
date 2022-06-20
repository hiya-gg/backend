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

import { AuthorizationCode, ModuleOptions } from "simple-oauth2";

interface ServiceMetadata {
  name: string;
  scopes: string[];
  config: ModuleOptions;
}

interface ClientOptions {
  id: string;
  secret: string;
  secretParamName?: string | undefined;
  idParamName?: "client_id" | undefined;
}

const getClientOptions: (name: string) => ClientOptions = (name: string) => ({
  id: process.env[`${name.toUpperCase()}_CLIENT_ID`] || "",
  secret: process.env[`${name.toUpperCase()}_CLIENT_SECRET`] || "",
  idParamName: "client_id",
  secretParamName: "client_secret",
});

const DISCORD_SERVICE: ServiceMetadata = {
  name: "discord",
  scopes: ["identify"],
  config: {
    client: getClientOptions("discord"),
    auth: {
      tokenHost: "https://discord.com",
      authorizePath: "/api/oauth2/authorize",
      tokenPath: "/api/oauth2/token",
    },
  },
};

const services: ServiceMetadata[] = [DISCORD_SERVICE];

const createClient = (service: ServiceMetadata) =>
  new AuthorizationCode(service.config);

export { DISCORD_SERVICE, services, createClient };
