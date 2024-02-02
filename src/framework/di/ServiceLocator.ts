import { is as R_is } from 'ramda';

// Core
import App from 'framework/App';
import Component from 'framework/base/Component';

// Types
import { Components } from 'framework/interfaces/ServiceLocator';

// Helpers
import CallbackHelper from 'framework/helpers/CallbackHelper';
import NamespaceHelper from 'framework/helpers/NamespaceHelper';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';

export type TypeDefinition = string | Component | Function
  | { [key: string]: any }
  | { namespace: string, [key: string]: any };

/**
 * ServiceLocator implements a [service locator](http://en.wikipedia.org/wiki/Service_locator_pattern).
 *
 * To use ServiceLocator, you first need to register component IDs with the corresponding component
 * definitions with the locator by calling [[set()]] or [[setComponents()]].
 * You can then call [[get()]] to retrieve a component with the specified ID. The locator will automatically
 * instantiate and configure the component, according to the definition.
 *
 * @example
 * For example,
 *
 * locator = new ServiceLocator();
 * locator.setComponents({
 *     db: {
 *         namespace: 'framework/db/Connection',
 *         dsn: 'sqlite:path/to/file.db',
 *     },
 *     cache: {
 *         namespace: 'framework/caching/DbCache',
 *         db: 'db',
 *     },
 * });
 *
 * db = locator.get('db');
 * cache = locator.get('cache');
 *
 * Because {@link Module} extends from ServiceLocator, modules and the application are all service locators.
 */
export default class ServiceLocator extends Component {
  /**
   * Shared component instances indexed by their IDs
   */
  private _components: Components = {};

  /**
   * Component definitions indexed by their IDs
   */
  private _definitions = {};

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/di/ServiceLocator';
  }

  /**
   * Returns a value indicating whether the locator has the specified component definition or has instantiated the component.
   * This method may return different results depending on the value of `checkInstance`.
   *
   * - If `checkInstance` is false (default), the method will return a value indicating whether the locator has the specified
   *   component definition.
   * - If `checkInstance` is true, the method will return a value indicating whether the locator has
   *   instantiated the specified component.
   *
   * @param id component ID (e.g. `db`).
   * @param checkInstance whether the method should check if the component is shared and instantiated.
   * @return Whether the locator has the specified component definition or has instantiated the component.
   * @see set()
   */
  public has ( id: string | symbol, checkInstance: boolean = false ): boolean {
    return checkInstance ? id in this._components : id in this._definitions;
  }

  /**
   * Returns the component instance with the specified ID.
   *
   * @param id component ID (e.g. `db`).
   * @param throwException whether to throw an error if `id` is not registered with the locator before.
   * @return object|null the component of the specified ID. If `throwException` is false and `id`
   * is not registered before, null will be returned.
   * @throws {InvalidConfigException} if `id` refers to a nonexistent component ID
   * @see has()
   * @see set()
   */
  public get<T> ( id: string | symbol, throwException: boolean = true ): T | null {
    if ( id in this._components ) {
      return this._components[id];
    }

    if ( id in this._definitions ) {
      const definition: T = this._definitions[id];

      if ( definition instanceof Component ) {
        delete this._definitions[id];
        return this._components[id] = definition;
      }

      if ( typeof id === 'string' ) {
        const config = id in this._definitions ? this._definitions[id] : id;
        return this._components[id] = (App.createObject(config) as unknown) as T;
      }
    }

    if ( throwException ) {
      throw new InvalidConfigException(`Unknown component ID: '${(id as string)}'`);
    }

    return null;
  }

  /**
   * Registers a component definition with this locator.
   *
   * @example
   * For example,
   *
   * // a class name
   * locator.set('cache', 'framework/caching/FileCache');
   *
   * // a configuration object
   * locator.set('db', {
   *     namespace => 'framework/db/Connection',
   *     dsn => 'mysql:host=127.0.0.1;dbname=demo',
   *     username => 'root',
   *     password => '',
   *     charset => 'utf8',
   * });
   *
   * // an anonymous function
   * locator.set('cache', function ( params ) {
   *     return new FileCache();
   * });
   *
   * // an instance
   * locator.set('cache', new FileCache());
   *
   * If a component definition with the same ID already exists, it will be overwritten.
   *
   * @param id component ID (e.g. `db`) or symbol.
   * @param definition the component definition to be registered with this locator.
   * @throws {InvalidConfigException} - If the definition is an invalid configuration array
   */
  public set ( id: string | symbol, definition: TypeDefinition ): void {
    if ( id in this._components ) {
      delete this._components[id];
    }

    if ( definition === null ) {
      delete this._definitions[id];
    }

    if ( typeof definition === 'string' && NamespaceHelper.isNamespace(definition) ) {
      this._definitions[id] = {namespace: definition};
    } else if ( definition instanceof Component ) {
      this._definitions[id] = definition;
    } else if ( CallbackHelper.isSync(definition) ) {
      const instance: any = Reflect.apply(definition as Function, this, []);
      if ( !(instance instanceof Component) ) {
        throw new InvalidConfigException(`The callback for the '${id.toString()}' doesn't return Component instance.`);
      }
      this._definitions[id] = instance;
    } else if ( R_is(Object, definition) ) {
      if ( 'namespace' in (definition as Object) ) {
        this._definitions[id] = definition;
      } else {
        throw new InvalidConfigException(`The configuration for the '${id.toString()}' component must contain a 'namespace' property.`);
      }
    } else {
      throw new InvalidConfigException(`Unexpected configuration type for the ${id.toString()} component: ${typeof definition}`);
    }
  }

  /**
   * Removes the component from the locator.
   * @param id the component ID
   */
  public clear ( id: string | symbol ): void {
    if ( id in this._components ) {
      delete this._components[id];
    }

    if ( id in this._definitions ) {
      delete this._definitions[id];
    }
  }

  /**
   * Returns the list of the component definitions or the loaded component instances.
   * @param returnDefinitions whether to return component definitions instead of the loaded component instances.
   * @return array the list of the component definitions or the loaded component instances (ID => definition or instance).
   */
  public getComponents ( returnDefinitions: boolean = true ) {
    return returnDefinitions ? this._definitions : this._components;
  }

  /**
   * Registers a set of component definitions in this locator.
   *
   * This is the bulk version of [[set()]]. The parameter should be an array
   * whose keys are component IDs and values the corresponding component definitions.
   *
   * For more details on how to specify component IDs and definitions, please refer to [[set()]].
   *
   * If a component definition with the same ID already exists, it will be overwritten.
   *
   * The following is an example for registering two component definitions:
   *
   * @example
   * {
   *     db: {
   *         namespace: 'framework/db/Connection',
   *         dsn: 'sqlite:path/to/file.db',
   *     },
   *     cache: {
   *         namespace: 'framework/caching/DbCache',
   *         db: 'db',
   *     },
   * }
   * ```
   *
   * @param components - Component definitions or instances
   */
  public setComponents ( components: { [id: string]: { [string: string]: any } } ) {
    if ( !R_is(Object, components) ) {
      throw new InvalidConfigException(`Unexpected configuration type for the 'component': ${typeof components}`);
    }

    for ( const [id, component] of Object.entries(components) ) {
      this.set(id, component);
    }
  }
}
