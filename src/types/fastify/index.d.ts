import { TokenPayload } from "../../manager/auth";

declare module "fastify" {
  interface FastifyRequest {
    getSession(): Promise<TokenPayload>;
  }
}
