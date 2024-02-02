// @flow

import { is } from 'ramda';

/**
 * @private
 * @internal
 * Bind properties to the given object and configure a scope registry
 */
const configure = ( obj: { [string]: any }, properties: { [string]: any }, registry: { [string]: string } ): { [string]: any } => {
  if ( !is(Object, obj) ) {
    throw new Error(
      `Properties type must be an object but '${typeof properties}' given`,
    );
  }

  for ( const [name, value] of Object.entries(properties) ) {
    let prop = name;
    if ( name.startsWith('-') ) {
      prop = name.replace(/^-/, '');
      registry[prop] = 'r';
    }
    if ( name.startsWith('!') ) {
      prop = name.replace(/^!/, '');
      registry[prop] = 'p';
    }
    if ( name.startsWith('+') ) {
      prop = name.replace(/^\+/, '');
      registry[prop] = 'w';
    }
    obj[prop] = value;
  }

  return obj;
};

/**
 * @private
 * @internal
 * Base object proxy handler with minimal logic
 */
const proxyHandler: ProxyHandler = {
  construct ( target, args ) {
    const instance = new target(...args);
    instance.isInstance = true;
    return instance;
  },
  get ( target, p, receiver ) {
    if ( !Reflect.has(target, p) ) {
      throw new Error(`Getting unknown property: '${p}'`);
    }
    console.log(target, p, receiver);
    const type: string = target.registry[p];

    if ( type === 'p' ) {
      throw new Error(`Getting private property: '${p}'`);
    }
    return target[p];
  },
  set ( target, p: string | symbol, value: any ): boolean {
    if ( !Reflect.has(target, p) ) {
      throw new Error(`Setting unknown property: '${property}'`);
    }

    const type: string = target.registry[p];

    if ( type === 'p' ) {
      throw new Error(`Setting private property: '${p}'`);
    }

    if ( type === 'r' ) {
      throw new Error(`Setting readonly property: '${p}'`);
    }

    target[p] = value;
    return true;
  },
  has ( target: T, p: string | symbol ): boolean {
    return Reflect.has(target, p) && target.registry[p] !== 'p';
  },
  deleteProperty ( target: T, p: string | symbol ): boolean {
    if ( !Reflect.has(target, p) ) {
      throw new Error(`Deleting unknown property: '${property}'`);
    }
    const type: string = target.registry[p];

    if ( type === 'p' ) {
      throw new Error(`Deleting private property: '${p}'`);
    }

    if ( type === 'r' ) {
      throw new Error(`Deleting readonly property: '${p}'`);
    }

    delete target[p];
  },
};

/**
 * @public
 * @constructor
 * BaseObject is the base class that implements the *property* feature.
 *
 * A property is defined by a getter method, and/or a setter method.
 * For example, the following getter and setter methods define a property named `label`:
 *
 * Property types
 * readOnly -label
 * private !label
 * writeOnly +label
 *
 * Property names are *case-insensitive*
 */
export default class BaseObject implements IBaseObject {
  /**
   * @internal
   * @private
   * Properties visibility registry
   */
  registry: { [string]: string } = {
    registry: 'p',
  };

  /**
   * Constructor.
   *
   * The default implementation does two things:
   *
   * - Initializes the object with the given configuration `$config`.
   * - Call [[init()]].
   *
   * If this method is overridden in a child class, it is recommended that
   *
   * - the last parameter of the constructor is a configuration array, like `config` here.
   * - call the parent implementation at the end of the constructor.
   *
   * @param {{[string]: any}} config={} - Name-value pairs that will be used to initialize the object properties
   */
  constructor ( config: { [string]: any } = {} ): IBaseObject {
    configure(this, config, this.registry);

    this.init();

    return new Proxy(this, proxyHandler);
  }

  /**
   * @public
   * Initializes the object.
   * This method is invoked at the end of the constructor after the object is initialized with the
   * given configuration.
   */
  init (): void {
  }

  /**
   * @public
   * Returns a value indicating whether a property can be read.
   *
   * A property is readable if:
   *
   * - the class has a getter method associated with the specified name
   *   (in this case, property name is case-insensitive);
   *
   * @param {string} name - The property name
   * @return {boolean} - whether the property can be read
   */
  hasProperty ( name: string ): boolean {
    return Reflect.has(this, name) && typeof this[name] !== 'function';
  }

  /**
   * @public
   * Returns a value indicating whether a method can be read.
   *
   * @param {string} name - The method name
   * @return {boolean} - whether the method can be read
   */
  hasMethod ( name: string ): boolean {
    return Reflect.has(this, name) && typeof this[name] === 'function';
  }
}
