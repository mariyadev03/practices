/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

import * as Op from 'object-path';
import { is as R_is } from 'ramda';
import { recursive } from 'merge';

// Cores
import Component from 'framework/base/Component';

// Helpers
import CallbackHelper from 'framework/helpers/CallbackHelper';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';
import NamespaceHelper from 'framework/helpers/NamespaceHelper';
import NotInstantiableException from 'framework/di/NotInstantiableException';

// Interfaces
import { DefinitionRegistry, SingletonRegistry, DefinitionType, Definition, SingletonBatch } from 'framework/di/Container.d';
import { ParamRegistry, Parameters } from 'framework/di/Container.d';

/**
 * Container implements a [dependency injection](http://en.wikipedia.org/wiki/Dependency_injection) container.
 *
 * A dependency injection (DI) container is an object that knows how to instantiate and configure objects and
 * all their dependent objects. For more information about DI, please refer to
 * [Martin Fowler's article](http://martinfowler.com/articles/injection.html).
 *
 * Container supports constructor injection as well as property injection.
 *
 * To use Container, you first need to set up the class dependencies by calling {@link set()}.
 * You then call {@link get()} to create a new class object. The Container will automatically instantiate
 * dependent objects, inject them into the object being created, configure, and finally return the newly created object.
 *
 * By default, {@link App.container} refers to a Container instance which is used by {@link App.createObject()}
 * to create new object instances. You may use this method to replace the `new` operator
 * when creating a new object, which gives you the benefit of automatic dependency resolution and default
 * property configuration.
 */
export default class Container extends Component {
  /**
   * Singleton objects indexed by their types
   */
  private _singletons: SingletonRegistry = {};

  /**
   * Object definitions indexed by their types
   */
  private _definitions: DefinitionRegistry = {};

  /**
   * Constructor parameters indexed by object types
   */
  private _params: ParamRegistry = {};

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/di/Container';
  }

  /**
   * Split given configuration into function args and config data
   * @param configuration - Arguments contains config data (config should be the last one)
   * @returns Parted data
   */
  private static splitConfigList ( configuration: Array<any> = [{}] ): { args: Array<any>, params: Parameters } {
    let params: Parameters = {};
    let args: Array<any> = [];

    if ( configuration.length > 1 ) {
      params = configuration.slice(-1)[0];
      args = configuration.slice(0, configuration.length - 1);
    } else if ( configuration.length === 0 ) {
      params = configuration[0];
    }

    return {args, params};
  }

  /**
   * Returns an instance of the requested class.
   *
   * You may provide constructor parameters (`params`)
   * that will be used during the creation of the instance.
   *
   * Note that if the class is declared to be singleton by calling [[setSingleton()]],
   * the same instance of the class will be returned each time this method is called.
   * In this case, the constructor parameters and object configurations will be used
   * only if the class is instantiated for the first time.
   *
   * @param namespace - Namespace, or an alias name (e.g. `foo`) that was previously
   * registered via {@link set()} or [[setSingleton()]].
   * @param configuration=[{}] - A list of constructor parameter values (Last element should be configuration)
   * @return Sn instance of the requested class.
   * @throws {InvalidConfigException} if the namespace cannot be recognized or correspond to an invalid definition
   * @throws {NotInstantiableException} - If resolved to an abstract or no-component
   */
  public get<T> ( namespace: string, configuration: Array<any> = [{}] ): T {
    const {args, params} = Container.splitConfigList(configuration);

    if ( namespace in this._singletons ) {
      return this._singletons[namespace];
    } else if ( !(namespace in this._definitions) ) {
      return this.build<T>(namespace, configuration);
    }

    const definition = this._definitions[namespace];
    let component: T;

    if ( CallbackHelper.isActualFunction(definition) ) {
      component = this.invoke(definition as Function, configuration, this);

      if ( !R_is(Object, component) || !(component instanceof Component) ) {
        throw new NotInstantiableException(`Callback returns no valid component constructor`);
      }
    } else if ( definition !== null && R_is(Object, definition) ) {
      const concrete = definition['namespace'];
      const newParams: Parameters = this.mergeParams(namespace, params);

      if ( concrete === namespace ) {
        component = this.build(concrete, [...args, newParams]);
      } else {
        component = this.get(concrete, [...args, newParams]);
      }
    } else if ( (definition as any) instanceof Component ) {
      return this._singletons[namespace] = definition as unknown as T;
    } else {
      throw new InvalidConfigException(`Unexpected object definition type: ${typeof definition}`);
    }

    if ( namespace in this._singletons ) {
      this._singletons[namespace] = component;
    }

    return component;
  }

  /**
   * Registers a class definition with this container.
   *
   * @example
   * // For example,
   *
   * // register a namespace as is. This can be skipped.
   * container.set('framework/base/Component');
   *
   * // register an alias name. You can use container.get('comp')
   * // to create an instance of Component
   * container.set('comp', 'framework/base/Component');
   *
   * // Register a namespace with configuration. The configuration
   * // will be applied when the namespace is instantiated by get()
   * container.set('framework/base/Component', {
   *     username: 'root',
   *     password: 'root',
   *     charset: 'utf8',
   * });
   *
   * // Register an alias name with class configuration
   * // will be applied when the namespace is instantiated by get()
   * container.set('comp', {
   *     namespace: 'framework/base/Component',
   *     username: 'root',
   *     password: '',
   *     charset: 'utf8',
   * });
   *
   * // register a callable function
   * // The callable will be executed when container.get('comp') is called
   * container.set('comp', (container, params, config): {
   *     return new Component(config);
   * });
   *
   * @param namespace Namespace name
   * @param definition={} the definition associated with `$class`. See {@link set()} for more details.
   * @param params={} the list of constructor parameters. The parameters will be passed to the class
   * @return The container itself
   */
  public set ( namespace: string, definition: DefinitionType = null, params: Parameters = {} ) {
    this._definitions[namespace] = this.normalizeDefinition(namespace, definition);
    this._params[namespace] = params;
    delete this._singletons[namespace];
    return this;
  }

  /**
   * Registers a namespace definition with this container and marks the class as a singleton class.
   *
   * This method is similar to {@link set()} except that classes registered via this method will only have one
   * instance. Each time {@link get()} is called, the same instance of the specified class will be returned.
   *
   * @param namespace Namespace name
   * @param definition the definition associated with `$class`. See {@link set()} for more details.
   * @param params={} the list of constructor parameters. The parameters will be passed to the class
   * constructor when {@link get()} is called.
   * @return The container itself
   * @see set()
   */
  public setSingleton ( namespace: string, definition: DefinitionType, params: Parameters = {} ) {
    this._definitions[namespace] = this.normalizeDefinition(namespace, definition);
    this._params[namespace] = params || {};
    this._singletons[namespace] = null;
    return this;
  }

  /**
   * Returns a value indicating whether the container has the definition of the specified name.
   * @param namespace - The namespace or alias name
   * @return Whether the container has the definition of the specified name.
   * @see set()
   */
  public has ( namespace: string ): boolean {
    return namespace in this._definitions;
  }

  /**
   * Returns a value indicating whether the given name corresponds to a registered singleton.
   * @param namespace - The namespace or alias name
   * @param checkInstance - Whether to check if the singleton has been instantiated.
   * @return Whether the given name corresponds to a registered singleton. If `$checkInstance` is true,
   * the method should return a value indicating whether the singleton has been instantiated.
   */
  public hasSingleton ( namespace: string, checkInstance = false ): boolean {
    return checkInstance
      ? Op.get(this._singletons, namespace, null) !== null
      && this._singletons[namespace] instanceof Component
      : Op.has(this._singletons, namespace);
  }

  /**
   * Removes the definition for the specified name.
   * @param namespace - The namespace or alias name
   */
  public clear ( namespace: string ): void {
    if ( namespace in this._definitions ) {
      delete this._definitions[namespace];
    }

    if ( namespace in this._singletons ) {
      delete this._singletons[namespace];
    }
  }

  /**
   * Normalizes the class definition.
   * @param namespace - The namespace or alias name
   * @param definition - The namespace definition
   * @return The normalized class definition
   * @throws {InvalidConfigException} - If the definition is invalid.
   */
  protected normalizeDefinition ( namespace: string, definition?: DefinitionType ): Definition {
    if ( !definition || R_is(String, definition) || !Object.keys(definition).length ) {
      return {namespace};
    } else if ( CallbackHelper.isActualFunction(definition) ) {
      return CallbackHelper.promisify(definition as Function);
    } else if ( definition instanceof Component ) {
      return definition;
    } else if ( R_is(Object, definition) ) {
      if ( !Op.has(definition, 'namespace') ) {
        throw new InvalidConfigException(`A namespace definition requires a 'namespace' property`);
      }

      return (definition as Definition);
    }

    throw new InvalidConfigException(`Unsupported definition type for 'namespace': ${typeof definition}`);
  }

  /**
   * Returns the list of the object definitions or the loaded shared objects.
   * @return The list of the object definitions or the loaded shared objects (type or ID: definition or instance).
   */
  public getDefinitions (): DefinitionRegistry {
    return this._definitions;
  }

  /**
   * Creates an instance of the specified namespace.
   * @param namespace - The namespace
   * @param configuration={} - The parameters will be passed to the class
   * @return The newly created instance of the specified namespace
   */
  public build<T> ( namespace: string, configuration: Array<any> = [{}] ): T {
    if ( !NamespaceHelper.isNamespace(namespace) ) {
      throw new NotInstantiableException(`Invalid namespace: ${namespace}`);
    }

    const Module = NamespaceHelper.load(namespace);

    if ( !NamespaceHelper.isConstructor(Module) ) {
      throw new NotInstantiableException(`Can not instantiate namespace: ${namespace}`);
    }

    const instance: T = new Module(...configuration);

    if ( !(instance instanceof Component) ) {
      throw new NotInstantiableException(`Can not instantiate namespace: ${namespace}`);
    }

    return instance;
  }

  /**
   * Merges the user-specified constructor parameters with the ones registered via {@link set()}.
   * @param namespace - The namespace or alias name
   * @param params - The constructor parameters
   * @return The merged parameters
   */
  protected mergeParams ( namespace, params: Parameters ): Parameters {
    if ( !(namespace in this._params) ) {
      return params;
    } else if ( !Object.keys(params).length ) {
      return this._params[namespace];
    }

    return recursive(true, this._params[namespace], params);
  }

  /**
   * Invoke a sync callback with parameters.
   *
   * This method allows invoking a callback and let type hinted parameter names to be
   * resolved as objects of the Container. It additionally allows calling function using named parameters.
   *
   * For example, the following callback may be invoked using the Container to resolve the formatter dependency:
   *
   * ```php
   * formatString = str => {
   *    return str.toUppercase();
   * }
   * App.container.invoke(formatString, ['Hello World!']);
   * ```
   *
   * This will pass the string `'Hello World!'` as the first param, and a formatter instance created
   * by the DI container as the second param to the callable.
   *
   * @param callback - Callable to be invoked.
   * @param configuration=[{}] - The array of parameters for the function.
   * @param thisArg=null - The caller instance
   */
  public invoke<T> ( callback: Function, configuration: Array<any> = [], thisArg?: any ): T {
    if ( !CallbackHelper.isSync(callback) ) {
      throw new InvalidConfigException('Callback function must be sync but async given');
    }
    return Reflect.apply(callback, thisArg || null, configuration);
  }

  /**
   * Invoke an async callback with parameters.
   *
   * This method allows invoking a callback and let type hinted parameter names to be
   * resolved as objects of the Container. It additionally allows calling function using named parameters.
   *
   * For example, the following callback may be invoked using the Container to resolve the formatter dependency:
   *
   * ```js
   * formatString = async str => {
   *    return str.toUppercase();
   * }
   *
   * App.container.invoke(formatString, ['Hello World!']);
   * ```
   *
   * This will pass the string `'Hello World!'` as the first param, and a formatter instance created
   * by the DI container as the second param to the callable.
   *
   * @param callback - Callable to be invoked.
   * @param configuration=[{}] - The array of parameters for the function.
   * @param thisArg=null - The caller instance
   */
  public async invokeAsync<T> ( callback: Function, configuration: Array<any> = [{}], thisArg?: any ): Promise<T> {
    return Reflect.apply(CallbackHelper.promisify(callback), thisArg || null, configuration);
  }

  /**
   * Registers class definitions within this container.
   *
   * @param definitions - Object of definitions. There are two allowed formats of an object.
   * The first format:
   *  - key: class name, or alias name. The key will be passed to the {@link set()} method
   *    as a first argument `namespace`.
   *  - value: the definition associated with `namespace`. Possible values are described in
   *    {@link set()} documentation for the `definition` parameter.
   *
   * Example:
   * @example
   * container.setDefinitions({
   *     'framework/web/Request': 'app/components/Request',
   *     'framework/web/Response': {
   *         'class': 'app/components/Response',
   *         'format': 'json'
   *     },
   *     'foo/Bar': function () {
   *         qux = new Qux;
   *         foo = new Foo(qux);
   *         return new Bar(foo);
   *     }
   * });
   *
   * @see set() to know more about possible values of definitions
   */
  public setDefinitions ( definitions: DefinitionRegistry = {} ): void {
    if ( !R_is(Object, definitions) ) {
      throw new InvalidConfigException(`Definition must be an object but provided ${typeof definitions}`);
    }

    for ( const [namespace, definition] of Object.entries(definitions) ) {
      if ( R_is(Array, definition) ) {
        const [_definition, params = {}] = definition;
        this.set(namespace, _definition, params);
        continue;
      }

      this.set(namespace, definition);
    }
  }

  /**
   * Registers class definitions as singletons within this container by calling {@link setSingleton()}.
   *
   * @param singletons - Object of singleton definitions.
   * See {@link setDefinitions()}
   * for allowed formats of an object.
   *
   * @see {@link setDefinitions()} for allowed formats of singletons parameter
   * @see {@link setSingleton()} to know more about possible values of definitions
   */
  public setSingletons ( singletons: SingletonBatch = {} ): void {
    if ( !R_is(Object, singletons) ) {
      throw new InvalidConfigException(`Singletons must be an object but provided ${typeof singletons}`);
    }

    for ( const [namespace, definitions] of Object.entries(singletons) ) {
      if ( R_is(Array, definitions) ) {
        this.setSingleton(namespace, definitions[0], definitions[1]);
        continue;
      }

      this.setSingleton(namespace, definitions);
    }
  }
}
