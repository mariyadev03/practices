import { checkPathAccess, resolveRelativePath } from 'framework/helpers/path-utils';

// Types
import type { FastifyServerInstance } from 'framework/types/fastify.flow';

export interface IApplicationBootstrapper {
  /** Inject a bootstrapper from a file or files */
  fromFile ( path: Array<string> | string ): Promise<void>;

  /** Inject a bootstrapper from a callback */
  fromCallback ( callback: ( fastify: FastifyServerInstance ) => Promise<void> ): Promise<void>;
}

/**
 * Fastify bootstrapper files loader
 */
export default function Bootstrapper ( fastify: FastifyServerInstance ): IApplicationBootstrapper {
  const bootstrapper: IApplicationBootstrapper = {};
  bootstrapper.fromFile = async path => {
    if ( typeof path !== 'string' && Array.isArray(path) ) {
      for await ( const file of path ) {
        await bootstrapper.fromFile(file);
      }

      return;
    }

    const filePath: string = resolveRelativePath(path);

    if ( !(await checkPathAccess(filePath)) ) {
      throw new Error(`Bootstrapper file '${filePath.toString()}' is not accessible`);
    }

    const module = await import(filePath);
    await module.default.call(null, fastify);
  };

  bootstrapper.fromCallback = async callback => {
    if ( typeof callback !== 'function' ) {
      throw new Error(`Bootstrapper callback is not a function`);
    }

    await callback(fastify);
  };

  return bootstrapper;
}
