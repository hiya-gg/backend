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

import { ModuleOptions } from "simple-oauth2";
import { Prisma } from "@prisma/client";

interface ServiceMetadata {
  name: string;
  scopes: string[];
  config: ModuleOptions;
  connectionBuilder: (token: string) => Promise<ConnectionResult>;
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

interface ConnectionResult {
  platformId: string;
  username: string;
  metadata: Prisma.InputJsonValue;
}

export { ServiceMetadata, ClientOptions, getClientOptions, ConnectionResult };
