/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

import * as Op from 'object-path';
import { is as R_is } from 'ramda';

// Core
import Container from 'framework/di/Container';
import Component from 'framework/base/Component';
import Logger from 'framework/log/Logger';
import Server from 'framework/fastify/Server';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';
import InvalidArgumentException from 'framework/base/InvalidArgumentException';

// Helpers
import CallbackHelper from 'framework/helpers/CallbackHelper';
import StringHelper from 'framework/helpers/StringHelper';
import FileHelper from 'framework/helpers/FileHelper';
import ArrayHelper from 'framework/helpers/ArrayHelper';

// Types | Interfaces
import { Application } from 'framework/types/Application.d';
import { TypeDefinition } from 'framework/BaseApp.d';
import { IProperties, IRegistry } from 'framework/interfaces/IBaseObject';

// Global variables
/** @type {App} */
declare let App: any;

/**
 * Core helper class for the framework.
 *
 * Do not use BaseApp directly. Instead, use its child class {@link App} which you can replace to
 * customize methods of BaseApp.
 */
export default abstract class BaseApp {
  /**
   * The application instance
   */
  public static app: Application;

  /**
   * The server instance
   */
  public static server: Server;

  /**
   * @var array registered path aliases
   * @see {@link getAlias()}
   * @see {@link setAlias()}
   */
  public static aliases: { [alias: string]: string | { [alias: string]: string | any } } = {
    '@framework': __dirname,
  };

  /**
   * @var Container the dependency injection (DI) container used by {@link createObject()}
   * You may use {@link Container.set()} to set up the needed dependencies of classes and
   * their initial property values.
   * @see createObject()
   * @see Container
   */
  public static container: Container;

  /**
   * Bind properties to the given object
   *
   * @example
   * const obj: Object = {};
   * const properties: IProperties = {language: 'JavaScript', category: 'Web'};
   *
   * App.configure(obj, properties);
   *
   * console.log('Object with dynamic properties:', obj);
   *
   * // Output like
   * // { 'programming': 'JavaScript', 'category': 'Web' }
   *
   * @param instance - The object instance
   * @param properties - Properties bind to the instance
   * @return Instance contain dynamic properties
   */
  public static configure<T> ( instance: T, properties: IProperties ): T {
    if ( !R_is(Object, instance) ) {
      throw new Error(`Instance type must be an object but '${typeof instance}' given`);
    }

    for ( const [name, value] of Object.entries(properties) ) {
      let propName: string | symbol = name;

      if ( typeof name === 'symbol' ) {
        instance[propName] = value;
        continue;
      }

      propName = name.replace(/^[-+]/, '');
      instance[propName] = value;
    }

    return instance;
  }

  /**
   * Configure properties scope registry
   * Note: Do not use this method directory on component, [[framework/base/BaseObject]] relies on it to
   * store scope like registry.
   *
   * Properties internal registry to store scope like information
   * +: is for write-only property
   * -: is for read-only property
   *
   * @example
   * const properties: IProperties = {language: 'PHP', '-category': 'Web'};
   * const registry: IRegistry = App.configureRegistry({}, properties);
   *
   * console.log('Registry:', registry);
   *
   * // Output like
   * // { 'programming': 'a', 'category': 'r' }
   *
   * // The flag types:
   * // r = read-only
   * // w = write-only
   * // a = all means read+write
   *
   * @param registry - The mutable registry object to update
   * @param properties - Properties to manipulate scope visibility
   */
  public static configureRegistry ( registry: IRegistry, properties: IProperties ): IRegistry {
    if ( !R_is(Object, registry) ) {
      throw new Error(`Registry type must be an object but '${typeof registry}' given`);
    }

    for ( const [name] of Object.entries(properties) ) {
      if ( typeof name === 'symbol' ) {
        registry[name] = 'a';
        continue;
      }

      const propName: string = name.replace(/^[-+]/, '');
      let type: string = 'a';

      if ( name.startsWith('-') ) {
        type = 'r';
      } else if ( name.startsWith('+') ) {
        type = 'w';
      }

      registry[propName] = type;
    }

    return registry;
  }

  /**
   * Creates a new object using the given configuration.
   *
   * You may view this method as an enhanced version of the `new` operator.
   * The method supports creating an object based on a class name, a configuration array or
   * an anonymous function.
   *
   * Below are some usage examples:
   *
   * ```js
   * // create an object using a namespace
   * const obj = App.createObject('framework/db/Connection');
   *
   * // create an object using a configuration array
   * const obj = App.createObject({
   *     namespace: 'framework/db/Connection',
   *     dsn: 'mysql:host=127.0.0.1;dbname=demo',
   *     username: 'root',
   *     password: '',
   *     charset: 'utf8',
   * };
   *
   * // create an object with two constructor parameters (params config must be the last one)
   * const obj = App.createObject('framework/db/Connection', [arg1, arg2, {...}]);
   *
   * // create an object with two constructor parameters and <i>this</i> target.
   * const obj = App.createObject('framework/db/Connection', [{...}], this);
   * ```
   *
   * Using {@link Container} this method can also identify
   * dependent objects, instantiate them and inject them into the newly created object.
   *
   * @param type the object type. This can be specified in one of the following forms:
   *
   * - a string: representing the class name of the object to be created
   * - a configuration array: the array must contain a `class` element which is treated as the object class,
   *   and the rest of the name-value pairs will be used to initialize the corresponding object properties
   * - a Callable: An anonymous function should return a new instance of the object being created.
   *
   * @param configuration=[{}] - Arguments pass to constructor
   * @param thisArg=null - The constructor parameters
   * @return The created object
   * @throws {InvalidConfigException} - If the configuration is invalid.
   * @see framework/di/Container
   */
  public static createObject ( type: TypeDefinition, configuration: Array<any> = [{}], thisArg: any = null ): Component | null {
    if ( R_is(String, type) ) {
      return App.container.get(type, configuration);
    }

    if ( CallbackHelper.isActualFunction(type) ) {
      return App.container.invoke(type as Function, configuration, thisArg);
    }

    if ( !R_is(Object, type) ) {
      throw new InvalidConfigException(`Unsupported configuration type: ${typeof type}`);
    }

    if ( 'namespace' in type ) {
      const namespace = type['namespace'];
      Op.del(type, 'namespace');

      const [config = {}] = configuration.slice(-1);

      if ( !Object.keys(config).length ) {
        configuration = configuration.slice(0, configuration.length-1).concat(type);
      }

      return App.container.get(namespace, configuration);
    }

    throw new InvalidConfigException('Type configuration must be an object containing a "namespace" property');
  }

  private static _logger;

  /**
   * @return Message logger
   */
  public static getLogger (): Logger {
    return BaseApp._logger = App.app.get('server') as Logger;
  }

  /**
   * Sets the logger object.
   * @param logger - The logger object.
   */
  public static setLogger ( logger: Logger ): void {
    BaseApp._logger = logger;
  }

  /**
   Returns a server instance.
   */
  public static getServer (): Server {
    return App.app.get('server') as Server;
  }

  /**
   * Returns a string representing the current version of the framework.
   */
  public static getVersion (): string {
    return '0.0.1';
  }

  /**
   * Translates a path alias into an actual path.
   *
   * The translation is done according to the following procedure:
   *
   * 1. If the given alias does not start with '@', it is returned back without change;
   * 2. Otherwise, look for the longest registered alias that matches the beginning part
   *    of the given alias. If it exists, replace the matching part of the given alias with
   *    the corresponding registered path.
   * 3. Throw an exception or return false, depending on the `throwException` parameter.
   *
   * For example, by default '@yii' is registered as the alias to the Yii framework directory,
   * say '/path/to/framework'. The alias '@framework/web' would then be translated into '/path/to/framework/web'.
   *
   * If you have registered two aliases '@foo' and '@foo/bar'. Then translating '@foo/bar/config'
   * would replace the part '@foo/bar' (instead of '@foo') with the corresponding registered path.
   * This is because the longest alias takes precedence.
   *
   * However, if the alias to be translated is '@foo/barbar/config', then '@foo' will be replaced
   * instead of '@foo/bar', because '/' serves as the boundary character.
   *
   * Note, this method does not check if the returned path exists or not.
   *
   * @param alias - The alias to be translated.
   * @param throwException - Whether to throw an exception if the given alias is invalid.
   * If this is false and an invalid alias is given, false will be returned by this method.
   * @return The path corresponding to the alias, is false if the root alias is not previously registered.
   * @throws {InvalidArgumentException} - If the alias is invalid while $throwException is true.
   * @see setAlias()
   */
  public static getAlias ( alias: string, throwException = true ): string | boolean {
    if ( StringHelper.strncmp(alias, '@', 1) ) {
      // not an alias
      return alias;
    }

    const pos: number | false = StringHelper.strpos(alias, '/');
    const root: string = pos === false ? alias : StringHelper.substr(alias, 0, pos);

    if ( root in BaseApp.aliases ) {
      if ( typeof BaseApp.aliases[root] === 'string' ) {
        return pos === false
          ? FileHelper.normalize(BaseApp.aliases[root] as string)
          : FileHelper.normalize(BaseApp.aliases[root] + alias.substring(pos));
      }

      for ( const [name, path] of Object.entries(BaseApp.aliases[root]) ) {
        if ( StringHelper.strpos(`${alias}/`, `${name}/`) === 0 ) {
          return FileHelper.normalize(path + alias.substring(name.length));
        }
      }
    }

    if ( throwException ) {
      throw new InvalidArgumentException(`Invalid path alias: ${alias}`);
    }

    return false;
  }

  /**
   * Returns the root alias part of a given alias.
   * A root alias is an alias that has been registered via {@link setAlias} previously.
   * If a given alias matches multiple root aliases, the longest one will be returned.
   * @param alias - The alias
   * @return The root alias, or false if no root alias is found
   */
  public static getRootAlias ( alias: string ): string | boolean {
    const pos: number | false = StringHelper.strpos(alias, '/');
    const root: string = pos === false ? alias : StringHelper.substr(alias, 0, pos);

    if ( root in BaseApp.aliases ) {
      if ( typeof BaseApp.aliases[root] === 'string' ) {
        return root;
      }

      for ( const [name] of Object.entries(BaseApp.aliases[root]) ) {
        if ( StringHelper.strpos(alias + '/', name + '/') === 0 ) {
          return name;
        }
      }
    }

    return false;
  }

  /**
   * Registers a path alias.
   *
   * A path alias is a short name representing a long path (a file path, a URL, etc.)
   * For example, we use '@framework' as the alias of the path to the framework directory.
   *
   * A path alias must start with the character '@' so that it can be easily differentiated
   * from non-alias paths.
   *
   * Note that this method does not check if the given path exists or not. All it does is
   * to associate the alias with the path.
   *
   * Any trailing '/' and '\' characters in the given path will be trimmed.
   *
   * @param alias - The alias name (e.g. "@framework").
   * It must start with a '@' character.
   * It may contain the forward slash '/' which serves as a boundary character when performing
   * alias translation by {@link getAlias()}.
   * @param path - The path corresponding to the alias. If this is null, the alias will
   * be removed. Trailing '/' and '\' characters will be trimmed. This can be
   *
   * - a directory or a file path (e.g. `/tmp`, `/tmp/main.txt`)
   * - a URL (e.g. `https://github.com/blacksmoke26/fullstack-nodejs-fastify`)
   * - a path alias (e.g. `@framework/base`).<br>
   * In this case, the path alias will be converted into the
   *   actual path first by calling {@link getAlias()}
   *
   * @throws InvalidArgumentException if {@link path} is an invalid alias.
   * @see getAlias()
   */
  public static setAlias ( alias: string, path?: string ): void {
    if ( StringHelper.strncmp(alias, '@', 1) ) {
      alias = `@${alias}`;
    }

    let pos: number | false = StringHelper.strpos(alias, '/');
    const root: string = pos === false ? alias : StringHelper.substr(alias, 0, pos);

    if ( path ) {
      path = StringHelper.strncmp(path, '@', 1)
        ? path.replace(/\\\/$/, path)
        : BaseApp.getAlias(path) as string;

      if ( !(root in BaseApp.aliases) ) {
        if ( pos === false ) {
          BaseApp.aliases[root] = path;
        } else {
          BaseApp.aliases[root] = {[alias]: path};
        }
      } else if ( typeof BaseApp.aliases[root] === 'string' ) {
        if ( pos === false ) {
          BaseApp.aliases[root] = path;
        } else {
          BaseApp.aliases[root] = {
            [alias]: path,
            [root]: BaseApp.aliases[root],
          };
        }
      } else {
        BaseApp.aliases[root][alias] = path;
        BaseApp.aliases[root] = ArrayHelper.krsort(BaseApp.aliases[root]);
      }
    } else if ( root in BaseApp.aliases ) {
      if ( R_is(Object, BaseApp.aliases[root]) ) {
        delete BaseApp.aliases[root][alias];
      } else if ( pos === false ) {
        delete BaseApp.aliases[root];
      }
    }
  }
}
