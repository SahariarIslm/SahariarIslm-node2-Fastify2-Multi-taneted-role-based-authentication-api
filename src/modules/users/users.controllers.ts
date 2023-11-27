import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { SYSTEM_ROLES } from "../../config/permissions";
import { logger } from "../../utils/logger";
import { getRoleByName } from "../roles/roles.servises";
import {
  AssignRoleToUserBody,
  createUserBody,
  loginBody,
} from "./users.schemas";
import {
  assignRoleToUser,
  createUser,
  getUserByEmail,
  getUsersByApplication,
} from "./users.services";

export async function createUserHandler(
  request: FastifyRequest<{
    Body: createUserBody;
  }>,
  reply: FastifyReply
) {
  const { initialUser, ...data } = request.body;

  const roleName = initialUser
    ? SYSTEM_ROLES.SUPER_ADMIN
    : SYSTEM_ROLES.APPLICATION_USER;

  if (roleName === SYSTEM_ROLES.SUPER_ADMIN) {
    const appUsers = await getUsersByApplication(data.applicationId);

    if (appUsers.length > 0) {
      return reply.code(400).send({
        message: "Application already has super admin user",
        extensions: {
          code: "APPLICATION_ALRADY_SUPER_USER",
          applicationId: data.applicationId,
        },
      });
    }
  }

  const role = await getRoleByName({
    name: roleName,
    applicationId: data.applicationId,
  });

  if (!role) {
    return reply.code(404).send({
      message: "Role Not Found",
    });
  }

  try {
    const user = await createUser(data);

    // assign a role to the user
    await assignRoleToUser({
      userId: user.id,
      roleId: role.id,
      applicationId: data.applicationId,
    });
    return user;
  } catch (e) {}
}

export async function loginHandler(
  request: FastifyRequest<{
    Body: loginBody;
  }>,
  reply: FastifyReply
) {
  const { applicationId, email, password } = request.body;

  const user = await getUserByEmail({
    applicationId,
    email,
  });

  if (!user) {
    return reply.code(400).send({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email,
      applicationId,
      scopes: user.permissions,
    },
    "secret"
  ); // change this secret or signing method, or get fired

  return { token };
}

export async function assignRoleToUserHandler(
  request: FastifyRequest<{
    Body: AssignRoleToUserBody;
  }>,
  reply: FastifyReply
) {
  const applicationId = request.user.applicationId;
  const { userId, roleId } = request.body;
  try {
    const result = await assignRoleToUser({
      userId,
      applicationId,
      roleId,
    });

    return result;
  } catch (error) {
    logger.error(error, "error assigning role to user");
    return reply.code(400).send({
      message: "could not assign role to user",
    });
  }
}
