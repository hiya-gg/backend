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

import centra from "centra";
import { getClientOptions, ServiceMetadata } from "../types";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
}

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
  connectionBuilder: async (token: string) => {
    const { id, username, discriminator }: DiscordUser = await centra(
      "https://discord.com/api/v10/users/@me"
    )
      .header("Authorization", `Bearer ${token}`)
      .send()
      .then((res) => res.json());

    return {
      username: `${username}#${discriminator}`,
      platformId: id,
      metadata: {
        username,
        discriminator,
      },
    };
  },
};

export default DISCORD_SERVICE;
