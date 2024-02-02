// @flow

// Types
import type { FastifyServerInstance } from 'framework/types/fastify.flow';
import type { IApplicationConfiguration } from 'framework/base/configuration';
import type { UrlRouter } from 'framework/types/routes.flow';

// Utils
import { processRoutes } from 'framework/web/url-manager';

async function findAllControllers () {}

export async function mapControllers ( app: FastifyServerInstance, config: IApplicationConfiguration ): Promise<void> {
  const routes: UrlRouter = await processRoutes(config);

  console.log('routes:', routes);
}
