import { FastifyInstance } from "fastify";
import { PERMISSIONS } from "../../config/permissions";
import { createRoleHandler } from "./roles.controller";
import { createRoleBody, createRoleJsonSchema } from "./roles.schemas";

export async function roleRoutes(app: FastifyInstance) {
  app.post<{
    Body: createRoleBody;
  }>(
    "/",
    {
      schema: createRoleJsonSchema,
      preHandler: [app.guard.scope([PERMISSIONS["roles:write"]])],
    },
    createRoleHandler
  );
}
