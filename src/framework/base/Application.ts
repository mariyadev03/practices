/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-05
 */

import { is as R_is } from 'ramda';
import { recursive } from 'merge';

// Core
import Module from 'framework/base/Module';
import Action from 'framework/base/Action';
import App from 'framework/App';
import BaseApp from 'framework/BaseApp';

// Types
import { Configuration } from 'framework/base/CoreObject';
import { Bootstrap } from 'framework/interfaces/Application';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';
import CallbackHelper from 'framework/helpers/CallbackHelper';
import StringHelper from 'framework/helpers/StringHelper';
import Bootstrapper from 'framework/base/Bootstraper';

/**
 * Application is the base class for all application classes.
 */
export default abstract class Application extends Module {
  /**
   * @event Event - An event raised before the application starts to handle a request.
   */
  static readonly EVENT_BEFORE_REQUEST: string = 'beforeRequest';
  /**
   * @event Event - An event raised after the application successfully handles a request (before the response is sent out).
   */
  static readonly EVENT_AFTER_REQUEST: string = 'afterRequest';
  /**
   * Application state used by {@link state}: application just started.
   */
  static readonly STATE_BEGIN: number = 0;
  /**
   * Application state used by {@link state}: application is initializing.
   */
  static readonly STATE_INIT: number = 1;
  /**
   * Application state used by {@link state}: application is triggering {@link EVENT_BEFORE_REQUEST}.
   */
  static readonly STATE_BEFORE_REQUEST: number = 2;
  /**
   * Application state used by {@link state}: application is handling the request.
   */
  static readonly STATE_HANDLING_REQUEST: number = 3;
  /**
   * Application state used by {@link state}: application is triggering {@link EVENT_AFTER_REQUEST}..
   */
  static readonly STATE_AFTER_REQUEST: number = 4;
  /**
   * Application state used by {@link state}: application is about to send response.
   */
  static readonly STATE_SENDING_RESPONSE: number = 5;
  /**
   * Application state used by {@link state}: application has ended.
   */
  static readonly STATE_END: number = 6;

  /**
   * The namespace that controller classes are located in.
   * This namespace will be used to load controller classes by prepending it to the controller-class name.
   * The default namespace is `app/controllers`.
   */
  public controllerNamespace: string = 'app/controllers';

  /**
   * The application name.
   */
  public name: string = 'My Application';

  /**
   * The charset currently used it for the application.
   */
  public charset: string = 'UTF-8';

  /**
   * The language that is meant to be used for end users. It is recommended that you
   * use [IETF language tags](http://en.wikipedia.org/wiki/IETF_language_tag). For example, `en` stands
   * for English, while `en-US` stands for English (United States).
   * @see sourceLanguage
   */
  public language: string = 'en-US';

  /**
   * @var string the language that the application is written in. This mainly refers to
   * the language that the messages and view files are written in.
   * @see language
   */
  public sourceLanguage: string = 'en-US';

  /**
   * The requested route
   */
  public requestedRoute: string = '';

  /**
   * The requested Action. If null, it means the request cannot be resolved into an action.
   */
  public requestedAction: Action | null = null;

  /**
   *The parameters supplied to the requested action.
   */
  public requestedParams: { [key: string]: any } = {};

  /**
   * @var array list of components that should be run during the application [[bootstrap()|bootstrapping process]].
   *
   * Each component may be specified in one of the following formats:
   *
   * - an application component ID as specified via {@link components}
   * - a module ID as specified via {@link modules}
   * - a class name.
   * - a configuration array.
   * - a callback
   *
   * During the bootstrapping process, each component will be instantiated. If the component class
   * implements [[BootstrapInterface]], its [[BootstrapInterface::bootstrap()|bootstrap()]] method
   * will be also be called.
   */
  public bootstrap: Array<string | Function | Promise<any> | Configuration> = [];

  /**
   * The current application state during a request handling life cycle.
   * This property is managed by the application. Do not modify this property.
   */
  public state: number = Application.STATE_BEGIN;

  /**
   * The currently active controller instance
   * @type {Controller}
   */
  public controller;

  /**
   * The layout that should be applied for views in this application. Defaults to 'main'.
   * If this is false, layout will be disabled.
   */
  public layout: string | false = 'main';

  /**
   * List of loaded modules indexed by their class names.
   */
  public loadedModules = {};

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Application';
  }

  /**
   * Constructor.
   * @param config - Name-value pairs that will be used to initialize the object properties.
   * Note that the configuration must contain both {@link id} and {@link basePath}
   * @throws {InvalidConfigException} - If either {@link id} or {@link basePath} configuration is missing.
   */
  constructor ( config: Configuration = {} ) {
    super(null);

    this.preInit(config);

    App.configure(this, config);
    global.App.app = this;
    Application.setInstance(this);

    this.state = Application.STATE_BEGIN;
    this.bootstrapper();
  }

  /**
   * Pre-initializes the application.
   * This method is called at the beginning of the application constructor.
   * It initializes several important application properties.
   * If you override this method, please make sure you call the parent implementation.
   * @param config - The application configuration
   * @throws {InvalidConfigException} - If either {@link id} or {@link basePath} configuration is missing.
   */
  public preInit ( config: Configuration ): void {
    if ( !('id' in config) ) {
      throw new InvalidConfigException('The "id" configuration for the Application is required.');
    }

    this.bootstrap = R_is(Array, config['bootstrap']) ? config['bootstrap'] as Bootstrap : [];

    if ( 'basePath' in config ) {
      this.setBasePath(config['basePath']);
      delete config['basePath'];
    } else {
      throw new InvalidConfigException('The "basePath" configuration for the Application is required.');
    }

    if ( 'runtimePath' in config ) {
      this.setRuntimePath(config['runtimePath']);
      delete config['runtimePath'];
    } else {
      // set "@runtime"
      this.getRuntimePath();
    }

    if ( 'timeZone' in config ) {
      this.setTimeZone(config['timeZone']);
      delete config['timeZone'];
    } else {
      this.setTimeZone('UTC');
    }

    if ( 'container' in config ) {
      this.setContainer(config['container']);
      delete config['container'];
    }

    this.loadCoreComponents(config);
  }

  private loadCoreComponents ( config: Configuration ) {
    const newConfig = {...config};
    // merge core components with custom components
    for ( const [id, component] of Object.entries(this.coreComponents()) ) {
      if ( !(id in newConfig['components']) ) {
        newConfig[id] = component;
        continue;
      }

      if ( R_is(Object, newConfig['components'][id]) ) {
        newConfig['components'][id] = recursive(false, component, newConfig['components'][id]);
      }
    }

    this.setComponents(newConfig['components']);
    App.container.setDefinitions(newConfig['components']);

    delete config['components'];
  }

  /**
   * Initializes extensions and executes bootstrap components.
   * This method is called by {@link init()} after the application has been fully configured.
   * If you override this method, make sure you also call the parent implementation.
   */
  protected bootstrapper (): void {
    for ( const mixed of this.bootstrap ) {
      let component: any = null;

      if ( CallbackHelper.isSync(mixed) ) {
        const result = (mixed as Function).call(this, [this]);
        if ( result ) {
          component = result;
        }
      } else if ( typeof mixed === 'string' ) {
        if ( this.has(mixed) ) {
          component = this.get(mixed);
        } else if ( this.hasModule(mixed) ) {
          component = this.getModule(mixed);
        } else if ( StringHelper.strpos(mixed, '/') === false ) {
          throw new InvalidConfigException(`Unknown bootstrapping component ID: '${mixed}'`);
        }
      }

      if ( component === null ) {
        component = App.createObject(mixed as any);
      }

      if ( component instanceof Bootstrapper ) {
        component.bootstrap(this);
      }
    }
  }

  private _runtimePath: any = null;

  /**
   * Returns the directory that stores runtime files.
   * @return string the directory that stores runtime files.
   * Defaults to the "runtime" subdirectory under [[basePath]].
   */
  public getRuntimePath (): string {
    if ( this._runtimePath === null ) {
      this.setRuntimePath(`${this.getBasePath()}/runtime`);
    }

    return this._runtimePath;
  }

  /**
   * Sets the directory that stores runtime files.
   * @param path - The directory that stores runtime files.
   */
  public setRuntimePath ( path: string ) {
    this._runtimePath = global.App.getAlias(path);
    global.App.setAlias('@runtime', this._runtimePath);
  }

  /**
   * Returns the time zone used by this application.
   */
  public getTimeZone (): string {
    return process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Sets the time zone used by this application.
   * @param value - The time zone used by this application.
   */
  public setTimeZone ( value: string ): void {
    process.env.TZ = value;
  }

  /**
   * Returns the configuration of core application components.
   * @see set()
   */
  public coreComponents (): { [id: string]: { namespace: string, [prop: string]: any } } {
    return {
      log: {'namespace': 'framework/log/Dispatcher'},
      server: {'namespace': 'framework/fastify/Server'},
      //view: {'namespace': 'yii\web\View'},
      //formatter: {'namespace': 'yii\i18n\Formatter'},
      //i18n: {'namespace': 'yii\i18n\I18N'},
      //mailer: {'namespace': 'yii\swiftmailer\Mailer'},
      //urlManager: {'namespace': 'yii\web\UrlManager'},
      //assetManager: {'namespace': 'yii\web\AssetManager'},
      //security: {'namespace': 'yii\base\Security'},
    };
  }

  /**
   * Returns an ID that uniquely identifies this module among all modules within the current application.
   * Since this is an application instance, it will always return an empty string.
   * @return The unique ID of the module.
   */
  public getUniqueId (): string {
    return '';
  }

  /**
   * Runs the application.
   * This is the main entrance of an application.
   */
  public async run (): Promise<void> {
    const {
      SERVER_ADDRESS = 'localhost', SERVER_PORT = 9003,
    } = process.env;
    BaseApp.getServer().listen({
      host: SERVER_ADDRESS as string,
      port: SERVER_PORT as number,
    });
  }

  /**
   * Configures {@link App.container} with the {@link config}.
   * @param config - Values given in terms of name-value pairs
   */
  public setContainer ( config: Configuration ) {
    App.configure(App.container, config);
  }
}
