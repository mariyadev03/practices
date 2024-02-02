/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

import { is as R_is } from 'ramda';

// Core
import ServiceLocator from 'framework/di/ServiceLocator';

// Types
export type Params = { [key: string]: any };
export type ModuleMap = { [id: string]: Module };

// Helpers
import FileHelper from 'framework/helpers/FileHelper';
import StringHelper from 'framework/helpers/StringHelper';
import NamespaceHelper from 'framework/helpers/NamespaceHelper';

// Exceptions
import InvalidArgumentException from 'framework/base/InvalidArgumentException';
import CallbackHelper from 'framework/helpers/CallbackHelper';
import InvalidRouteException from 'framework/base/InvalidRouteException';
import Action from 'framework/base/Action';
import ActionEvent from 'framework/base/ActionEvent';
import Controller from 'framework/base/Controller';

// Global variables
/** @type {App} */
declare const App;

/**
 * Module is the base class for module and application classes.
 *
 * A module represents a sub-application which contains MVC elements by itself, such as
 * models, views, controllers, etc.
 *
 * A module may consist of [[modules|sub-modules]].
 *
 * [[components|Components]] may be registered with the module so that they are globally
 * accessible within the module.
 */
export default class Module extends ServiceLocator {
  /**
   * @event ActionEvent - An event raised before executing a controller action.
   * You may set {@link ActionEvent#isValid} to be `false` to cancel the action execution.
   */
  public static readonly EVENT_BEFORE_ACTION = 'beforeAction';

  /**
   * @event ActionEvent - An event raised after executing a controller action.
   */
  public static readonly EVENT_AFTER_ACTION = 'afterAction';

  /**
   * Custom module parameters (name => value).
   */
  public params: Params = {};

  /**
   * An ID that uniquely identifies this module among other modules which have the same [[module|parent]].
   */
  public id: string;

  /**
   * @var Module|null the parent module of this module. `null` if this module does not have a parent.
   */
  public module: Module | null;

  /**
   * The layout that should be applied for views within this module. This refers to a view name
   * relative to {@link layoutPath}. If this is not set, it means the layout value of the [[module|parent module]]
   * will be taken. If this is `false`, layout will be disabled within this module.
   */
  public layout: string | boolean | null = null;

  /**
   * Mapping from controller ID to controller configurations.
   * Each name-value pair specifies the configuration of a single controller.
   * A controller configuration can be either a string or an array.
   * If the former, the string should be the namespace of the controller.
   * If the latter, the array must contain a `namespace` element which specifies
   * the controller's namespace, and the rest of the name-value pairs
   * in the array are used to initialize the corresponding controller properties. For example,
   *
   * @example
   * {
   *   account: 'app/controllers/UserController',
   *   article: {
   *      namespace: 'app/controllers/PostController',
   *      pageTitle: 'something new',
   *   },
   * }
   */
  public controllerMap: { [alias: string]: string | Object } = {};

  /**
   * The namespace that controller classes are in.
   * This namespace will be used to load controller classes by prepending it to the controller
   * namespace.
   *
   * If not set, it will use the `controllers` sub-namespace under the namespace of this module.
   * For example, if the namespace of this module is `foo/bar`, then the default
   * controller namespace would be `foo/bar/controllers`.
   */
  public controllerNamespace: string | null = null;

  /**
   * The default route of this module. Defaults to `default`.
   * The route may consist of child module ID, controller ID, and/or action ID.
   * For example, `help`, `post/create`, `admin/post/create`.
   * If action ID is not given, it will take the default value as specified in
   * {@link Controller#defaultAction}.
   */
  public defaultRoute = 'default';

  /**
   * The root directory of the module.
   */
  private _basePath = '';

  /**
   * The root directory that contains the controller classes for this module.
   */
  private _controllerPath = '';

  /**
   * The root directory that contains view files for this module
   */
  private _viewPath = '';

  /**
   * The root directory that contains layout view files for this module.
   */
  private _layoutPath = '';

  /**
   * Child modules of this module
   */
  private _modules: { [id: string]: Object } = {};

  /**
   * The version of this module.
   * Version can be specified as a callback, which can accept module instance as an argument and should
   * return the actual version. For example:
   *
   * @example
   * function (module: Module) {
   *     //return string|int
   * }
   *
   * If not set, {@link defaultVersion()} will be used to determine actual value.
   */
  private _version: string | Function | null = null;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Module';
  }

  /**
   * Constructor.
   * @param id - The ID of this module.
   * @param parent - The parent module (if any).
   * @param config - Name-value pairs that will be used to initialize the object properties.
   */
  public constructor ( id, parent: Module | null = null, config = {} ) {
    super(config);
    this.id = id;
    this.module = parent;
    this.init();
  }

  /**
   * Returns the currently requested instance of this module class.
   * If the module class is not currently requested, `null` will be returned.
   * This method is provided so that you access the module instance from anywhere within the module.
   * @return The currently requested instance of this module class, or `null` if the module class is not requested.
   */
  public static getInstance (): Module | null {
    const namespace: string = Module.prototype.namespace;
    return namespace in App.app.loadedModules
      ? App.app.loadedModules[namespace]
      : null;
  }

  /**
   * Sets the currently requested instance of this module class.
   * @param instance - The currently requested instance of this module class.
   * If it is `null`, the instance of the calling class will be removed, if any.
   */
  public static setInstance ( instance: Module | null ): void {
    if ( !instance ) {
      delete App.app.loadedModules[Module.prototype.namespace];
    } else {
      App.app.loadedModules[instance.namespace] = instance;
    }
  }

  /**
   * Initializes the module.
   *
   * This method is called after the module is created and initialized with property values
   * given in configuration. The default implementation will initialize {@link controllerNamespace}
   * if it is not set.
   *
   * If you override this method, please make sure you call the parent implementation.
   */
  public init () {
    if ( !this.controllerNamespace ) {
      const namespace = this.namespace;
      const pos: number | false = StringHelper.strpos(namespace, '/');
      if ( pos !== false ) {
        this.controllerNamespace = String(namespace).substring(0, pos) + '/controllers';
      }
    }
  }

  /**
   * Returns an ID that uniquely identifies this module among all modules within the current application.
   * Note that if the module is an application, an empty string will be returned.
   * @return The unique ID of the module.
   */
  public getUniqueId (): string {
    return this.module
      ? StringHelper.rtrim(this.module.getUniqueId() + '/' + this.id, '/')
      : this.id;
  }

  /**
   * Returns the root directory of the module.
   * It defaults to the directory containing the module-class file.
   * @return The root directory of the module.
   */
  public getBasePath (): string {
    if ( !this._basePath ) {
      this._basePath = NamespaceHelper.toBasename(this.namespace);
    }

    return this._basePath;
  }

  /**
   * Sets the root directory of the module.
   * This method can only be invoked at the beginning of the constructor.
   * @param path the root directory of the module. This can be either a directory name or a path alias.
   * @throws {InvalidArgumentException} - If the directory does not exist.
   */
  public setBasePath ( path: string ): void {
    const p: string = App.getAlias(path);
    if ( R_is(String, p) && FileHelper.isDirectory(p) ) {
      this._basePath = p;
    } else {
      throw new InvalidArgumentException(`The directory does not exist: {path}`);
    }
  }

  /**
   * Returns the directory that contains the controller classes according to {@link controllerNamespace}.
   * Note that in order for this method to return a value, you must define
   * an alias for the root namespace of {@link controllerNamespace}.
   * @return The directory that contains the controller classes.
   * @throws {InvalidArgumentException} - If there is no alias defined for the root namespace of {@link controllerNamespace}.
   */
  public getControllerPath (): string {
    if ( !this._controllerPath ) {
      this._controllerPath = App.getAlias('@' + this.controllerNamespace);
    }

    return this._controllerPath;
  }

  /**
   * Sets the directory that contains the controller classes.
   * @param path - The root directory that contains the controller classes.
   * @throws {InvalidArgumentException} - If the directory is invalid.
   */
  public setControllerPath ( path ): void {
    this._controllerPath = App.getAlias(path);
  }

  /**
   * Returns the directory that contains the view files for this module.
   * @return string the root directory of view files. Defaults to "[[basePath]]/views".
   */
  public getViewPath () {
    if ( !this._viewPath ) {
      this._viewPath = this.getBasePath() + '/views';
    }

    return this._viewPath;
  }

  /**
   * Sets the directory that contains the view files.
   * @param path - The root directory of view files.
   * @throws {InvalidArgumentException} - If the directory is invalid.
   */
  public setViewPath ( path ): void {
    this._viewPath = App.getAlias(path);
  }

  /**
   * Returns the directory that contains layout view files for this module.
   * @return string the root directory of layout files. Defaults to "{@link viewPath}/layouts".
   */
  public getLayoutPath (): string {
    if ( !this._layoutPath ) {
      this._layoutPath = this.getViewPath() + '/layouts';
    }

    return this._layoutPath;
  }

  /**
   * Sets the directory that contains the layout files.
   * @param path - The root directory or [path alias] of layout files.
   * @throws {InvalidArgumentException} - If the directory is invalid
   */
  public setLayoutPath ( path ): void {
    this._layoutPath = App.getAlias(path);
  }

  /**
   * Returns a current module version.
   * If a version is not explicitly set, {@link defaultVersion()} method will be used to determine its value.
   * @return string the version of this module.
   */
  public getVersion () {
    if ( !this._version ) {
      this._version = this.defaultVersion();
    } else {
      if ( CallbackHelper.isFunction(this._version) ) {
        this._version = Reflect.apply(this._version as Function, this, [this]);
      }
    }

    return this._version;
  }

  /**
   * Sets a current module version.
   * @param version - The version of this module.
   * The version can be specified as a callback, which can accept module instance as an argument and should
   * return the actual version. For example:
   *
   * @example
   * function ( module: Module ) {
   *     //return string
   * }
   */
  public setVersion ( version: string | Function | null ) {
    this._version = version;
  }

  /**
   * Returns a default module version.
   * Child class may override this method to provide more specific version detection.
   * @return string the version of this module.
   */
  protected defaultVersion () {
    if ( !this.module ) {
      return '1.0';
    }

    return this.module.getVersion();
  }

  /**
   * Defines path aliases.
   * This method calls {@link App.setAlias()} to register the path aliases.
   * This method is provided so that you can define path aliases when configuring a module.
   * @param aliases - List of path aliases to be defined. The array keys are alias names
   * (must start with `@`), and the array values are the corresponding paths or aliases.
   * For example,
   *
   * @example
   * {
   *     '@models': '@app/models',
   *     '@backend': __dirname + '/../app/models',  // a directory
   * }
   */
  public setAliases ( aliases: { [name: string]: string } ): void {
    for ( const [name, alias] of Object.entries(aliases) ) {
      App.setAlias(name, alias);
    }
  }

  /**
   * Checks whether the child module of the specified ID exists.
   * This method supports checking the existence of both child and grand child modules.
   * @param id - Module ID. For grand child modules, use ID path relative to this module (e.g. `admin/content`).
   * @return Whether the named module exists. Both loaded and unloaded modules
   * are considered.
   */
  public hasModule ( id: string ): boolean {
    const pos: number | false = StringHelper.strpos(id, '/');

    if ( pos !== false ) {
      // sub-module
      const module = this.getModule(id.substring(0, pos));
      return module === null ? false : module.hasModule(id.substring(0, pos + 1));
    }

    return id in this._modules;
  }

  /**
   * Retrieves the child module of the specified ID.
   * This method supports retrieving both child modules and grand child modules.
   * @param id - Module ID (case-sensitive). To retrieve grand child modules,
   * use ID path relative to this module (e.g. `admin/content`).
   * @param load - Whether to load the module if it is not yet loaded.
   * @return The module instance, `null` if the module does not exist.
   * @see hasModule()
   */
  public getModule ( id: string, load = true ): Module | null {
    const pos: number | false = StringHelper.strpos(id, '/');

    if ( pos !== false ) {
      // sub-module
      const module = this.getModule(id.substring(0, pos));
      return !module ? null : module.get(id.substring(0, pos + 1), load);
    }

    if ( id in this._modules ) {
      if ( this._modules[id] instanceof Module ) {
        return (this._modules[id] as Module);
      } else if ( load ) {
        const module: Module = App.createObject(this._modules[id], [id, this, {}], this);
        (module.constructor as any).setInstance(module);
        return this._modules[id] = module;
      }
    }

    return null;
  }

  /**
   * Adds a submodule to this module.
   * @param id - Module ID.
   * @param module - The submodule to be added to this module. This can
   * be one of the following:
   *
   * - a {@link Module} object
   * - a configuration object: when {@link getModule()} is called initially, the object
   *   will be used to instantiate the submodule
   * - `null`: the named submodule will be removed from this module
   */
  public setModule ( id: string, module: Module | Params | null ) {
    if ( module === null ) {
      delete this._modules[id];
    } else {
      this._modules[id] = module;
      if ( module instanceof Module ) {
        this.module = module;
      }
    }
  }

  /**
   * Returns the submodules in this module.
   * @param loadedOnly - Whether to return the loaded submodules only. If this is set `false`,
   * then all submodules registered in this module will be returned, whether they are loaded or not.
   * Loaded modules will be returned as objects, while unloaded modules as configuration arrays.
   * @return The modules (indexed by their IDs).
   */
  public getModules ( loadedOnly = false ): ModuleMap {
    if ( loadedOnly ) {
      const modules = {};
      for ( const [id, module] of Object.entries(this._modules) ) {
        if ( module instanceof Module ) {
          modules[id] = module;
        }
      }

      return modules;
    }

    return this._modules as ModuleMap;
  }

  /**
   * Registers submodules in the current module.
   *
   * Each submodule should be specified as a name-value pair, where
   * name refers to the ID of the module and value the module or a configuration
   * array that can be used to create the module. In the latter case, {@link App.createObject()}
   * will be used to create the module.
   *
   * If a new submodule has the same ID as an existing one, the existing one will be overwritten silently.
   *
   * The following is an example for registering two sub-modules:
   *
   * @example
   * {
   *     comment: {
   *         classname: 'app/module/comment/CommentModule',
   *         db: 'db',
   *     },
   *     booking: {classname => 'app/modules/booking/BookingModule'},
   * }
   *
   * @param modules - Modules (id => module configuration or instances).
   */
  public setModules ( modules: { [id: string]: any } ): void {
    for ( const [id, module] of Object.entries(modules) ) {
      this._modules[id] = module;
      if ( module instanceof Module ) {
        module.module = this;
      }
    }
  }

  /**
   * Runs a controller action specified by a route.
   * This method parses the specified route and creates the corresponding child module(s), controller and action
   * instances. It then calls {@link Controller.runAction()} to run the action with the given parameters.
   * If the route is empty, the method will use {@link defaultRoute}.
   * @param route - The route that specifies the action.
   * @param params - The parameters to be passed to the action
   * @return The result of the action.
   * @throws {InvalidRouteException} if the requested route cannot be resolved into an action successfully.
   */
  public runAction ( route: string, params: { [prop: string]: any } = {} ): any {
    const parts = this.createController(route);

    if ( R_is(Object, parts) ) {
      /* @var controller Controller */
      const {controller, actionID} = parts as any;
      const oldController = App.app.controller;

      App.app.controller = controller;

      const result: any = controller.runAction(actionID, params);

      if ( oldController !== null ) {
        App.app.controller = oldController;
      }

      return result;
    }

    this.id = this.getUniqueId();
    throw new InvalidRouteException(`Unable to resolve the request '{this.id === '' ? route : this.id + '/' + route}'.`);
  }

  /**
   * Creates a controller instance based on the given route.
   *
   * The route should be relative to this module. The method implements the following algorithm
   * to resolve the given route:
   *
   * 1. If the route is empty, use [[defaultRoute]];
   * 2. If the first segment of the route is found in {@link controllerMap}, create a controller
   *    based on the corresponding configuration found in {@link controllerMap};
   * 3. If the first segment of the route is a valid module ID as declared in {@link modules},
   *    call the module's {@link createController()} with the rest part of the route;
   * 4. The given route is in the format of `abc/def/xyz`. Try either `abc/DefController`
   *    or `abc/def/XyzController` namespace within the [[controllerNamespace|controller namespace]].
   *
   * If any of the above steps resolves into a controller, it is returned together with the rest
   * part of the route which will be treated as the action ID. Otherwise, `false` will be returned.
   *
   * @param route - The route consisting of module, controller and action IDs.
   * @return array|bool If the controller is created successfully, it will be returned together
   * with the requested action ID. Otherwise, `false` will be returned.
   * @throws InvalidConfigException if the controller namespace and its file do not match.
   */
  public createController ( route: string ): [controller: Controller, route: string] | boolean {
    if ( !route.trim() ) {
      route = this.defaultRoute;
    }

    let id = '';
    route = StringHelper.trim(route, '/');

    if ( StringHelper.strpos(route, '/') !== false ) {
      [id, route] = route.split('/', 2);
    } else {
      id = route;
      route = '';
    }

    if ( id in this.controllerMap ) {
      const controller = App.createObject(this.controllerMap[id], [id, this]);
      return [controller, route];
    }

    const module: Module | null = this.getModule(id);
    if ( module instanceof Module ) {
      return module.createController(route);
    }

    const pos: number | false = StringHelper.strrpos(route, '/');
    if ( pos !== false ) {
      id += `/${route.substring(0, pos)}`;
      route = route.substring(pos + 1);
    }

    let controller: Controller | null = this.createControllerByID(id);

    if ( controller === null && route.trim() ) {
      controller = this.createControllerByID(`${id}/${route}`);
      route = '';
    }

    return controller === null ? false : [controller, route];
  }

  /**
   * Creates a controller based on the given controller ID.
   *
   * The controller ID is relative to this module. The controller class
   * should be namespaced under {@link controllerNamespace}.
   *
   * Note that this method does not check {@link modules} or {@link controllerMap}.
   *
   * @param id - The controller ID. <i>(e.g., `site`)</i>
   * @return The newly created controller instance, or `null` if the controller ID is invalid.
   * @throws {InvalidConfigException} - If the controller class and its file name do not match.
   * This exception is only thrown when in debug mode.
   */
  public createControllerByID ( id: string ): Controller | null {
    const pos: number | false = StringHelper.strrpos(id, '/');

    let prefix = '';
    let className = '';

    if ( pos === false ) {
      prefix = '';
      className = id;
    } else {
      prefix = id.substring(0, pos + 1) || '';
      className = id.substring(pos + 1);
    }

    if ( Module.isIncorrectClassNameOrPrefix(className, prefix) ) {
      return null;
    }

    className = NamespaceHelper.routeToClassName(className) + 'Controller';
    className = StringHelper.ltrim((this.controllerNamespace || '') + '/' + prefix + className, '/');

    if ( StringHelper.strpos(className, '-') !== false
      || !NamespaceHelper.isNamespace(className) ) {
      return null;
    }

    if ( NamespaceHelper.isSubclassOf(className, 'framework/base/Controller') ) {
      const controller = App.createObject(className, [id, this, {}]);
      return controller.namespace === className ? controller : null;
    }

    return null;
  }

  /**
   * Checks if class name or prefix is incorrect
   * @param className Fully qualified classname (namespace)
   * @param prefix='' - Prefix if present
   */
  private static isIncorrectClassNameOrPrefix ( className: string, prefix = '' ): boolean {
    if ( !/^[a-z][a-z0-9/\-_]*$/.test(className) ) {
      return true;
    }

    if ( prefix.trim() && !/^[a-z0-9_/]+$/i.test(prefix) ) {
      return true;
    }

    return false;
  }

  /**
   * This method is invoked right before an action within this module is executed.
   *
   * The method will trigger the {@link EVENT_BEFORE_ACTION} event. The return value of the method
   * will determine whether the action should continue to run.
   *
   * In case the action should not run, the request should be handled inside the {@link beforeAction()} code
   * by either providing the necessary output or redirecting the request. Otherwise, the response will be empty.
   *
   * If you override this method, your code should look like the following:
   *
   * @example
   * public async beforeAction( action: Action ): Promise<boolean>
   * {
   *     if ( !(await super.beforeAction(action)) ) {
   *         return false;
   *     }
   *
   *     // your custom code here
   *
   *     return true; // or false to not run the action
   * }
   * ```
   *
   * @param action - The action to be executed.
   * @return Whether the action should continue to be executed.
   */
  public async beforeAction ( action: Action ): Promise<boolean> {
    const event = new ActionEvent(action);
    await this.trigger(Module.EVENT_BEFORE_ACTION, event);
    return event.isValid;
  }

  /**
   * This method is invoked right after an action within this module is executed.
   *
   * The method will trigger the {@link EVENT_AFTER_ACTION} event. The return value of the method
   * will be used as the action return value.
   *
   * If you override this method, your code should look like the following:
   *
   * @example
   * public async afterAction ( action: Action, result: any ): Promise<any>
   * {
   *     result = await super.afterAction(action, result);
   *     // your custom code here
   *     return result;
   * }
   *
   * @param action - The action just executed.
   * @param result - The action return result.
   * @return The processed action result.
   */
  public async afterAction ( action: Action, result: any ): Promise<any> {
    const event = new ActionEvent(action);
    event.result = result;
    await this.trigger(Module.EVENT_AFTER_ACTION, event);
    return event.result;
  }

  /**
   * @inheritDoc
   *
   * if a component isn't defined in the module, it will be looked up in the parent module.
   * The parent module may be the application.
   */
  public get<T> ( id: string | symbol, throwException: boolean = true ): T | null {
    if ( !this.module ) {
      return super.get<T>(id, throwException);
    }

    let component: T | null = super.get<T>(id, false);

    if ( !component ) {
      component = this.module.get<T>(id, throwException);
    }

    return (component as unknown) as T;
  }

  /**
   * @inheritDoc
   *
   * If a component isn't defined in the module, it will be looked up in the parent module.
   * The parent module may be the application.
   */
  public has ( id, checkInstance = false ) {
    return super.has(id, checkInstance)
      || (this.module && this.module.has(id, checkInstance));
  }
}
