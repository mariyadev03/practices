/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

// Core
import * as Op from 'object-path';

// Core
import App from 'framework/App';

// Interfaces
import ICoreObject, { IRegistry } from 'framework/interfaces/IBaseObject';

// Exceptions
import UnknownPropertyException from 'framework/base/UnknownPropertyException';
import InvalidCallException from 'framework/base/InvalidCallException';

// Helpers
import CallbackHelper from 'framework/helpers/CallbackHelper';

// Types
export type Configuration = { [p: string | symbol]: any };

/**
 * BaseObject is the base class that implements the *property* feature.
 *
 * Besides the property feature, BaseObject also introduces an important object initialization life cycle. In particular,
 * creating a new instance of BaseObject or its derived class will involve the following life cycles sequentially:
 *
 * 1. the class constructor is invoked;
 * 2. object properties are initialized according to the given configuration;
 * 3. the `init()` method is invoked.
 *
 * In the above, both Step 2 and 3 occur at the end of the class constructor. It is recommended that
 * you perform object initialization in the `init()` method because at that stage, the object configuration
 * is already applied.
 *
 * Property names are *case-insensitive*.
 *
 *
 * That is, a `config` parameter (defaults to `{}`) should be declared as the last parameter
 * of the constructor, and the parent implementation should be called at the end of the constructor.
 *
 */
export default class CoreObject implements ICoreObject {
  /**
   * Properties internal registry to store scope like information
   * +: is for write-only property
   * -: is for read-only property
   */
  private registry: IRegistry = {};

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/CoreObject';
  }

  /**
   * Constructor.
   *
   * The default implementation does two things:
   *
   * - Initializes the object with the given configuration `config`.
   * - Call [[init()]].
   *
   * If this method is overridden in a child class, it is recommended that
   *
   * - the last parameter of the constructor is a configuration array, like `config` here.
   * - call the parent implementation at the end of the constructor.
   *
   * In order to ensure the above life cycles, if a child class of BaseObject needs to override the constructor,
   * it should be done like the following:
   *
   * ```js
   * public constructor (param1, param2, ..., config = {})
   * {
   *     ...
   *     super.constructor(config);
   * }
   * ```
   *
   * @param config Name-value pairs that will be used to initialize the object properties
   */
  public constructor ( config: Configuration = {} ) {
    this.construct(config);

    if ( Object.keys(config).length ) {
      App.configure(this, config);
      App.configureRegistry(this.registry, config);
    }

    this.init();
  }

  /**
   * Pre-construct initialization.
   * This method is invoked beginning of the constructor before the object is initialized with the
   * given configuration.
   * By overriding this method, you can manipulate configuration (e.g., add or remove config properties)
   */
  public construct ( config: Configuration = {} ): void {
    // Overridden by its children
  }

  /**
   * Initializes the object.
   * This method is invoked at the end of the constructor after the object is initialized with the
   * given configuration.
   */
  public init (): void {
    // Overridden by its children
  }

  /**
   * Returns the value of an object property.
   * @param name the property name
   * @return mixed the property value
   * @throws UnknownPropertyError if the property is not defined
   * @throws InvalidCallError if the property is write-only
   * @see __set()
   */
  public get ( name: string | symbol ): any {
    if ( !this.hasProperty(name) ) {
      throw new UnknownPropertyException(`Trying to get unknown property: '${(name as string)}'`);
    }

    if ( !this.canGetProperty(name) ) {
      throw new InvalidCallException(`Trying to get write-only property: '${(name as string)}'`);
    }

    return this[name];
  }

  /**
   * Sets value of an object property.
   *
   * @param name the property name
   * @param value The property value
   * @throws UnknownPropertyException if the property is not defined
   * @throws InvalidCallError if the property is read-only
   * @see __get()
   */
  public set ( name: string | symbol, value: any ): void {
    if ( !this.hasProperty(name) ) {
      throw new UnknownPropertyException(`Trying to set unknown property: '${name as string}'`);
    }

    console.log('name', name);
    if ( !this.canSetProperty(name) ) {
      throw new InvalidCallException(`Trying to set read-only property: '${name as string}'`);
    }

    this[name] = value;
  }

  /**
   * Sets a component property to be null.
   *
   * This method will check in the following order and act accordingly:
   *
   *  - a property defined by a setter: set the property value to be null
   *  - a property of a behavior: set the property value to be null
   *
   * This method will check in the following order and act accordingly:
   * @param name - The property name
   */
  public unset ( name: string | symbol ): void {
    if ( !this.hasProperty(name) ) {
      throw new UnknownPropertyException(`Trying to set unknown property: '${(name as string)}'`);
    }

    if ( this.canSetProperty(name) ) {
      throw new InvalidCallException(`Trying to remove read-only property: '${(name as string)}'`);
    }

    this[name] = null;
  }

  /**
   * Checks if a property is set, i.e. defined and not null.
   *
   * Note that if the property is not defined, false will be returned.
   * @param name the property name or the symbol
   * @return Whether the named property is set (not null).
   */
  public has ( name: string | symbol ): boolean {
    return this.hasMethod(name) || this.hasProperty(name);
  }

  /**
   * Returns a value indicating whether a property is defined.
   * @param name - The property name
   * @return Whether the property is defined
   * @see canGetProperty()
   * @see canSetProperty()
   */
  public hasProperty ( name: string | symbol ): boolean {
    return name in this
      && (typeof name === 'string' && !name.startsWith('__'))
      && Op.has(this.registry, name)
      && CallbackHelper.isActualValue(this.registry[name]);
  }

  /**
   * Returns a value indicating whether a property can be read.
   * @param name - The property name
   * @return Whether the property can be read
   * @see canSetProperty()
   */
  public canGetProperty ( name: string | symbol ): boolean {
    if ( !this.hasProperty(name) ) {
      return false;
    }

    return typeof name === 'symbol'
      ? true
      : ['r', 'a'].includes(this.registry[name]);
  }

  /**
   * Returns a value indicating whether a property can be set.
   * @param name - The property name
   * @return Whether the property can be read
   * @see canGetProperty()
   */
  public canSetProperty ( name: string | symbol ): boolean {
    if ( !this.hasProperty(name) ) {
      return false;
    }

    return typeof name === 'symbol'
      ? true
      : ['w', 'a'].includes(this.registry[name]);
  }

  /**
   * Returns a value indicating whether a method is defined.
   * @param name - The method name
   * @return Whether the method is defined
   */
  public hasMethod ( name: string | symbol ): boolean {
    return name in this
      && (typeof name === 'string' && !name.startsWith('__'))
      && Op.has(this.registry, name)
      && CallbackHelper.isActualFunction(this.registry[name]);
  }
}
