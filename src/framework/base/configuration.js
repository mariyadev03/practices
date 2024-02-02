// @flow

import { recursive } from 'merge';
import op from 'object-path';

// Types
import type { IApplicationConfig } from 'framework/types/application.flow';
import type { FastifyServerInstance } from 'framework/types/fastify.flow';

// Utils
import { resolveRelativePath, checkPathAccess } from 'framework/helpers/path-utils';

export interface IApplicationConfiguration {
  /** Load a configuration from file */
  fromFile ( file: Array<string> | string ): Promise<void>;

  /** Load a configuration from a given object */
  fromObject ( configuration: IApplicationConfiguration ): void;

  /** Get configuration object */
  getConfig ( path?: Array<string> | string, defaultValue?: any ): IApplicationConfig | null | undefined | { [string]: any };

  /** Define a configuration decorator and assign configuration object to it */
  decorate ( fastify: FastifyServerInstance ): void;
}

export default function Configuration ( config: IApplicationConfig ): IApplicationConfiguration {
  const namespace: IApplicationConfiguration = {};

  let configuration = {...config};

  const mergeConfig = ( newConfig: IApplicationConfiguration ): IApplicationConfiguration => {
    configuration = recursive(false, configuration, newConfig);
  };

  namespace.fromFile = async ( file ) => {
    if ( typeof file !== 'string' && Array.isArray(file) ) {
      for await ( const filePath of file ) {
        await namespace.fromFile(filePath);
      }

      return;
    }

    const filePath: string = resolveRelativePath(file);

    if ( !(await checkPathAccess(filePath)) ) {
      throw new Error(`Configuration file '${filePath.toString()}' is not accessible`);
    }

    const loadConfig = await import(filePath);
    const appConfig = await loadConfig.default.call(this);

    mergeConfig(appConfig);
  };

  namespace.fromObject = configuration => {
    mergeConfig(configuration);
  };

  namespace.getConfig = ( path, defaultValue ) => {
    return !path
      ? configuration
      : op.get(configuration, path, defaultValue);
  };

  namespace.decorate = ( fastify ) => {
    if ( !fastify.hasDecorator('config') ) {
      fastify.decorate('config', namespace.getConfig());
    }
  };

  return namespace;
}
