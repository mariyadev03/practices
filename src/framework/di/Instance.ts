/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-14
 */

import { is as R_is, isEmpty } from 'ramda';

// Core
import ServiceLocator from 'framework/di/ServiceLocator';
import Container from 'framework/di/Container';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';

// Global vars
declare var App;

/**
 * Instance represents a reference to a named object in a dependency injection (DI) container or a service locator.
 *
 * You may use {@link get()} to obtain the actual object referenced by {@link id}.
 *
 * Instance is mainly used in two places:
 *
 * - When configuring a dependency injection container, you use Instance to reference a namespace
 *   or alias name. The reference can later be resolved into the actual object by the container.
 * - In classes which use service locator to obtain dependent objects.
 *
 * The following example shows how to configure a DI container with Instance:
 *
 * ```js
 * container = new Container;
 * container.set('cache', {
 *   namespace: 'framework/caching/DbCache',
 *   db: Instance.of('db'),
 * });
 * container-.set('db', {
 *   namespace: 'framework/db/Connection',
 *   dsn: 'sqlite:path/to/file.db',
 * });
 * ```
 *
 * And the following example shows how a class retrieves a component from a service locator:
 *
 * ```js
 * class DbCache extends Cache {
 *   public db: string = 'db';
 *
 *   public init() {
 *     super.init();
 *     this.db = Instance.ensure(this.db, 'framework/db/Connection');
 *   }
 * }
 * ```
 */
export default class Instance {
  /**
   * The component ID, namespace or alias name
   */
  public id: string = '';

  /**
   * If null should be returned instead of throwing an exception
   */
  public optional: boolean = false;

  /**
   * Constructor.
   * @param id - The component ID
   * @param optional - If null should be returned instead of throwing an exception
   */
  protected constructor ( id: string, optional: boolean = false ) {
    this.id = id;
    this.optional = optional;
  }

  /**
   * Creates a new Instance object.
   * @param id - The component ID
   * @param [optional=false] - If null should be returned instead of throwing an exception
   * @return The new Instance object.
   */
  public static of ( id: string, optional: boolean = false ): Instance {
    return new Instance(id, optional);
  }

  /**
   * Resolves the specified reference into the actual object and makes sure it is of the specified type.
   *
   * The reference may be specified as a string or an Instance object. If the former,
   * it will be treated as a component ID, a namespace or an alias, depending on the container type.
   *
   * If you do not specify a container, the method will first try `App.app` followed by `App.container`.
   *
   * For example,
   *
   * ```js
   * use app/db/Connection;
   *
   * // returns App.app.db
   * const db = Instance.ensure('db', Connection.prototype.namespace);
   * // returns an instance of Connection using the given configuration
   * const db = Instance.ensure({dsn: 'sqlite:path/to/my.db'}, Connection.prototype.namespace);
   * ```
   *
   * @param reference - An object or a reference to the desired object.
   * You may specify a reference in terms of a component ID or an Instance object.
   * You may also pass in a configuration array for creating the object.
   * If the "namespace" value is not specified in the configuration array, it will use the value of `type`.
   * @param type - The namespace to be checked. If null, type check will not be performed.
   * @param [container] - The container.
   * This will be passed to {@link get()}
   * @return The object referenced by the Instance, or `reference` itself if it is an object.
   * @throws {InvalidConfigException} - If the reference is invalid
   */
  public static ensure ( reference: any, type: string | null = null, container?: ServiceLocator | Container ) {
    if ( R_is(Object, reference) ) {
      const namespace = 'namespace' in reference ? reference.namespace : type;

      if ( !(container instanceof Container) ) {
        container = App.container;
      }

      delete reference.namespace;
      const component = (container as Container).get(namespace, [reference]);

      if ( type === null || component instanceof (type as any) ) {
        return component;
      }

      throw new InvalidConfigException(`Invalid data type: ${namespace}. ${type as string} is expected.`);
    } else if ( isEmpty(reference) ) {
      throw new InvalidConfigException('The required component is not specified.');
    }

    if ( R_is(String, reference) ) {
      reference = new Instance(reference);
    } else if ( type === null || (reference as any) instanceof (type as any) ) {
      return reference;
    }

    if ( reference instanceof Instance ) {
      let component;

      try {
        component = reference.get(container);
      } catch ( e ) {
        throw new InvalidConfigException(`Failed to instantiate component or namespace "${reference.id}".`);
      }

      if ( type === null || component instanceof (type as any) ) {
        return component;
      }
    }

    const valueType = R_is(Object, reference) && 'namespace' in reference ? reference.namespace : typeof reference;
    throw new InvalidConfigException(`Invalid data type: ${valueType}. ${type} is expected.`);
  }

  /**
   * Returns the actual object referenced by this Instance object.
   * @param container - The container used to locate the referenced object.
   * If null, the method will first try `App.app` then `App.container`.
   * @return The actual object referenced by this Instance object.
   */
  public get ( container: ServiceLocator | Container | null = null ): Object | null {
    try {
      if ( container ) {
        return container.get(this.id);
      }
      if ( App.app && App.app.has(this.id) ) {
        return App.app.get(this.id);
      }

      return App.container.get(this.id);
    } catch ( e ) {
      if ( this.optional ) {
        return null;
      }
      throw e;
    }
  }
}
