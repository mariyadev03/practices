// Types
import type { FastifyServerInstance } from 'framework/types/fastify.flow';

/**
 * Fastify application bootstrapper
 */
export default async function bootstrap ( fastify: FastifyServerInstance ): Promise<void> {
  // Installed plugins
  await fastify.register(import('@fastify/sensible'));

  // TODO implementations goes here
}
