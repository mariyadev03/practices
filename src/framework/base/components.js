// @flow

import { recursive } from 'merge';
import fp from 'fastify-plugin';
import op from 'object-path';
import Glob from 'glob';

// Types
import type { IApplicationConfiguration } from 'framework/base/configuration';
import type { FastifyServerInstance } from 'framework/types/fastify.flow';
import type { IApplicationComponent } from 'framework/types/component.flow';

// Utils
import { resolveRelativePath, checkPathAccess, normalize } from 'framework/helpers/path-utils';
import { stringToArray } from 'framework/helpers/array-utils';

interface IApplicationComponentLoader {
  /** Load a component file of files */
  fromFile ( file: Array<string> | string ): Promise<void>;

  /** Load components from a directory or directories */
  fromDirectory ( dir: Array<string> ): Promise<void>;
}

export default function ApplicationComponentLoader ( fastify: FastifyServerInstance, config: IApplicationConfiguration ): IApplicationComponentLoader {
  const namespace: IApplicationComponentLoader = {};

  /**
   * @interface
   * @private
   */
  const registerFromFile = async ( file: string, checkAccess: boolean = false ): Promise<void> => {
    const filePath: string = resolveRelativePath(file);

    if ( checkAccess && !(await checkPathAccess(filePath)) ) {
      throw new Error(`Component file '${filePath.toString()}' is not accessible`);
    }

    const component: IApplicationComponent = await loadComponentToObject(filePath);
    await registerFromObject(component);
  };

  const loadComponentToObject = async ( filePath ): Promise<IApplicationComponent> => {
    const module = await import(filePath);
    return module.default.call(fastify);
  };

  /**
   * @interface
   * @private
   */
  const registerFromObject = async ( component: IApplicationComponent ): Promise<void> => {
    const defaultOptions = await component.defaultOptions();
    const globalOptions = config.getConfig(['components', component.namespace], {});

    if ( globalOptions === null ) {
      // Component disabled / ignore post-processing
      return;
    }

    config.fromObject({
      components: {
        [component.namespace]: recursive(false, defaultOptions, globalOptions),
      },
    });

    await fastify.register(fp(async ( app ) => {
      return component.init(app, config.getConfig(['components', component.namespace], {}));
    }, component.pluginMeta));
  };

  namespace.fromFile = async file => {
    if ( typeof file === 'string' ) {
      return registerFromFile(file, true);
    }

    if ( Array.isArray(file) ) {
      for await ( const filePath of file ) {
        await registerFromFile(filePath, true);
      }
      return;
    }

    throw new Error(`Unknown input given: ${file}`);
  };

  const getDirectoryFiles = async ( dir: Array<string> | string ): Promise<Array<string>> => {
    const directories: Array<string> = stringToArray(dir);

    const files = [];

    for await ( const dirPath of directories ) {
      const absolutePath: string = resolveRelativePath(dirPath);

      if ( !(await checkPathAccess(absolutePath)) ) {
        throw new Error(`Components directory '${absolutePath}' is not accessible`);
      }

      const dirFiles = Glob.sync(normalize(`${absolutePath}/**/*.component.js`));

      files.push(...dirFiles);
    }

    return files;
  };

  namespace.fromDirectory = async dir => {
    const files = await getDirectoryFiles(dir);
    const registry: { [string]: IApplicationComponent } = {};

    const catalogue: Array<string> = op.get(fastify, 'config.componentCatalogue', []);
    const catalogueTotal: number = catalogue.length;

    for await ( const file of files ) {
      const component: IApplicationComponent = await loadComponentToObject(file);

      if ( !catalogueTotal ) {
        await registerFromObject(component);
        continue;
      }

      registry[component.namespace] = component;
    }

    if ( !catalogueTotal ) {
      return;
    }

    for await ( const name of catalogue ) {
      if ( !registry.hasOwnProperty(name) ) {
        throw new Error(`Unknown component namespace '${name}'`);
      }

      await registerFromObject(registry[name]);
    }
  };

  return namespace;
}
