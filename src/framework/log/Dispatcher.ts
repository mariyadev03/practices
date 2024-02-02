/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-11
 */

import { is as R_is } from 'ramda';

// Core
import Component from 'framework/base/Component';
import Logger from 'framework/log/Logger';
import Target from 'framework/log/Target';

// Types
import { Level } from 'pino';
import { Configuration } from 'framework/base/CoreObject';

declare var App;

/**
 * Dispatcher manages a set of {@link Target|log targets}.
 *
 * Dispatcher implements the {@link dispatch()} that forwards the log messages from a {@link Logger} to
 * the registered log {@link targets}
 *
 * An instance of Dispatcher is registered as a core application component and can be accessed by using `App.app.log`.
 *
 * You may configure the targets in application configuration, like the following:
 *
 * ```js
 * [
 *     'components': {
 *         'log': {
 *             'targets': {
 *                 'file': {
 *                     'class': 'framework/log/FileTarget',
 *                     'levels': {'trace', 'info'},
 *                     'categories': {'framework/*'},
 *                 ],
 *                 'email': {
 *                     'class': 'framework/log/EmailTarget',
 *                     'levels': {'error', 'warning'},
 *                     'message': {
 *                         'to': 'admin@example.com',
 *                     },
 *                 },
 *             },
 *         },
 *     },
 * }
 * ```
 *
 * Each log target can have a name and can be referenced via the {@link targets} property as follows:
 *
 * ```js
 * App::app.log.targets['file'].enabled = false;
 * ```
 */
export default class Dispatcher extends Component {
  /**
   * The log targets. Each array element represents a single {@link Target|log targets} instance
   * or the configuration for creating the log target instance.
   */
  public targets: {[name: string]: Target} = {};

  /**
   * @var {Logger} The logger.
   */
  private _logger;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/log/Dispatcher';
  }

  /**
   * {@inheritdoc}
   */
  constructor ( config: Configuration = {} ) {
    super(config);

    // ensure logger gets set before any other config option
    if ( 'logger' in config ) {
      this.setLogger(config['logger']);
      delete config['logger'];
    }
    // connect logger and dispatcher
    this.getLogger();
  }

  /**
   * {@inheritdoc}
   */
  public init (): void {
    super.init();

    /*for ( const [name, target] of Object.keys(this.targets) ) {
      if ( !((target as any) instanceof Target) ) {
        this.targets[name] = App.createObject(target);
      }
    }*/
  }

  /**
   * Gets the connected logger.
   * If not set, {@link BaseApp.getLogger()} will be used.
   * @property Logger the logger. If not set, [[\Yii::getLogger()]] will be used.
   * @return Logger the logger.
   */
  public getLogger () {
    if ( !this._logger ) {
      this.setLogger(App.getLogger());
    }

    return this._logger;
  }

  /**
   * Sets the connected logger.
   * @param value - The logger to be used. This can either be a logger instance
   * or a configuration that will be used to create one using {@link App.createObject()}
   */
  public setLogger ( value: Logger | string | Object ) {
    if ( typeof value === 'string' || (R_is(Object, value) && !(value instanceof Logger)) ) {
      value = App.createObject(value);
    }
    this._logger = value;
    this._logger.dispatcher = this;
  }

  /**
   * @return int how many application call stacks should be logged together with each message.
   * This method returns the value of [[Logger::traceLevel]]. Defaults to 0.
   */
  public getTraceLevel (): string {
    return this.getLogger().traceLevel;
  }

  /**
   * @param value - How many application call stacks should be logged together with each message.
   * This method will set the value of [[Logger::traceLevel]]. If the value is greater than 0,
   * at most that number of call stacks will be logged. Note that only application call stacks are counted.
   * Defaults to 0.
   */
  public setTraceLevel ( value: Level ): void {
    this.getLogger().traceLevel = value;
  }
}
