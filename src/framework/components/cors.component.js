// @flow

import url from 'url';
import fastifyCors from '@fastify/cors';

// Types
import type { FastifyServerInstance } from 'framework/types/fastify.flow';
import type { IApplicationComponent } from 'framework/types/component.flow';

/**
 * @private
 * @internal
 * Get origin from request
 */
const getOrigin = ( fastify: FastifyServerInstance, origin: string ): boolean => {
  // Set true when non-browser request
  if ( !origin ) {
    return true;
  }

  const {hostname} = url.parse(origin);

  /** Whitelist origins (domains only) */
  const whitelist: Array<string> = JSON.parse(process.env.SECURITY_CORS_ALLOWED_ORIGINS || '[]')
    || ['localhost'];

  for ( const domain of whitelist ) {
    if ( domain.includes(hostname) ) {
      return true;
    }
  }

  return false;
};

/**
 * Friendly CORS Fastify Plugin
 */
export default async function ( fastify: FastifyServerInstance ): IApplicationComponent {
  return {
    namespace: 'cors',
    pluginMeta: {
      name: 'fastify-cors',
    },
    async defaultOptions () {
      return {
        optionsSuccessStatus: 204,
        preflightContinue: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        origin ( origin, callback ) {
          false !== getOrigin(fastify, origin)
            ? callback(null, true)
            : callback(new Error('Not allowed by CORS'));
        },
      };
    },
    async init ( fastify, options ) {
      return fastify.register(fastifyCors, options);
    },
  };
}
