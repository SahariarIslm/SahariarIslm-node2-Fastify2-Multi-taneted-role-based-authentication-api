import { FastifyReply, FastifyRequest } from "fastify";
import { createRoleBody } from "./roles.schemas";
import { createRole } from "./roles.servises";

export async function createRoleHandler(
  request: FastifyRequest<{
    Body: createRoleBody;
  }>,
  reply: FastifyReply
) {
  const user = request.user;
  const applicationId = user.applicationId;
  const { name, permissions } = request.body;
  const role = await createRole({
    name,
    permissions,
    applicationId,
  });

  return role;
}
