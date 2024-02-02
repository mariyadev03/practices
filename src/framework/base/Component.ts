/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

// Globals
declare var App;

import * as Op from 'object-path';
import { is as R_is } from 'ramda';

// Core
import BaseObject from 'framework/base/BaseObject';
import Event, { EventRegistry, EventsMap } from 'framework/base/Event';
import Behavior, { BehaviorRegistry } from 'framework/base/Behavior';
import UnknownPropertyException from 'framework/base/UnknownPropertyException';
import InvalidCallException from 'framework/base/InvalidCallException';

// Helpers
import CallbackHelper from 'framework/helpers/CallbackHelper';
import StringHelper from 'framework/helpers/StringHelper';

/**
 * Component is the base class that implements the *property*, *event* and *behavior* features.
 *
 * Component provides the *event* and *behavior* features, in addition to the *property* feature which is implemented in
 * its parent class [[framework/base/BaseObject|BaseObject]].
 *
 * Event is a way to "inject" custom code into existing code at certain places. For example, a comment object can trigger
 * an "add" event when the user adds a comment. We can write custom code and attach it to this event so that when the event
 * is triggered (i.e. comment will be added), our custom code will be executed.
 *
 * An event is identified by a name that should be unique within the class it is defined at. Event names are *case-sensitive*.
 *
 * One or multiple PHP callbacks, called *event handlers*, can be attached to an event. You can call [[trigger()]] to
 * raise an event. When an event is raised, the event handlers will be invoked automatically in the order they were
 * attached.
 *
 * To attach an event handler to an event, call [[on()]]:
 *
 * ```js
 * post.on('update', async ( event: Event ) => {
 *     // do some magic.
 * });
 * ```
 *
 * Sometimes, you may want to associate extra data with an event handler when you attach it to an event
 * and then access it when the handler is invoked. You may do so by
 *
 * ```php
 * post.on('update', async ( event: Event ) => {
 *     // the data can be accessed via event.data
 * }, $data);
 * ```
 */
export default class Component extends BaseObject {
  /**
   * @var array the attached event handlers (event name => handlers)
   */
  private _events: EventsMap = {};

  /**
   * The attached behaviors (behavior name => behavior). This is `null` when not initialized.
   */
  private _behaviors: BehaviorRegistry = {};

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Component';
  }

  /**
   * Returns a value indicating whether a property is defined.
   * @param name - The property name
   * @param checkBehaviors=true - Whether to treat behaviors' properties as properties of this component
   * @return Whether the property is defined
   * @see canGetProperty()
   * @see canSetProperty()
   */
  public hasProperty ( name: string | symbol, checkBehaviors = true ): boolean {
    if ( super.hasProperty(name) ) {
      return true;
    }

    if ( checkBehaviors ) {
      this.ensureBehaviors();

      for ( const behavior of Object.values(this._behaviors) ) {
        if ( behavior.hasProperty(name) ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Returns a value indicating whether a property can be read.
   * @param name - The property name
   * @return Whether the property can be read
   * @param checkBehaviors=true - Whether to treat behaviors' properties as properties of this component
   * @see canSetProperty()
   */
  public canGetProperty ( name: string | symbol, checkBehaviors = true ): boolean {
    if ( super.canGetProperty(name) ) {
      return true;
    }

    if ( checkBehaviors ) {
      this.ensureBehaviors();

      for ( const behavior of Object.values(this._behaviors) ) {
        if ( behavior.canGetProperty(name) ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Returns a value indicating whether a property can be set.
   * @param name - The property name
   * @return Whether the property can be read
   * @param checkBehaviors=true - Whether to treat behaviors' properties as properties of this component
   * @see canGetProperty()
   */
  public canSetProperty ( name: string | symbol, checkBehaviors: boolean = true ): boolean {
    if ( super.canSetProperty(name) ) {
      return true;
    }

    if ( checkBehaviors ) {
      this.ensureBehaviors();

      for ( const behavior of Object.values(this._behaviors) ) {
        if ( behavior.canSetProperty(name) ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Returns a value indicating whether a method is defined.
   * @param name - The method name
   * @return Whether the method is defined
   * @param checkBehaviors=true - Whether to treat behaviors' methods as methods of this component
   */
  public hasMethod ( name: string | symbol, checkBehaviors: boolean = true ): boolean {
    if ( super.hasMethod(name) ) {
      return true;
    }

    if ( checkBehaviors ) {
      this.ensureBehaviors();

      for ( const behavior of Object.values(this._behaviors) ) {
        if ( behavior.hasMethod(name) ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Returns the value of an object property.
   *
   * This method will check in the following order and act accordingly:
   *
   *  - a property defined by a getter: return the getter result
   *  - a property of a behavior: return the behavior property value
   *
   * @param name the property name
   * @return mixed the property value
   * @throws UnknownPropertyError if the property is not defined
   * @throws {InvalidCallException} if the property is write-only
   * @see __set()
   */
  public get ( name: string | symbol ): any {
    if ( this.hasProperty(name, false) ) {
      if ( !this.canGetProperty(name, false) ) {
        throw new InvalidCallException(`Getting write-only property: ${(name as string)}'`);
      }

      return this[name];
    }

    this.ensureBehaviors();

    for ( const behavior of Object.values(this._behaviors) ) {
      if ( behavior.hasProperty(name) ) {
        if ( !behavior.canGetProperty(name) ) {
          throw new InvalidCallException(`Getting write-only property: ${(name as string)}'`);
        }
        return behavior.get(name);
      }
    }

    throw new UnknownPropertyException(`Getting unknown property: ${(name as string)}'`);
  }

  /**
   * Sets value of an object property.
   *
   * This method will check in the following order and act accordingly:
   *
   *  - a property defined by a setter: set the property value
   *  - a property of a behavior: set the property value
   *
   * @param name the property name
   * @param value The property value
   * @throws UnknownPropertyException if the property is not defined
   * @throws InvalidCallError if the property is read-only
   * @see set()
   */
  public set ( name: string | symbol, value: any ): void {
    if ( this.hasProperty(name, false) ) {
      if ( !this.canSetProperty(name, false) ) {
        throw new InvalidCallException(`Setting read-only property: ${(name as string)}'`);
      }
      this[name] = value;
      return;
    } else if ( typeof name === 'string' && name.startsWith('on ') ) {
      // on event: attach event handler
      this.on(StringHelper.trim(name.substring(3)), value);
      return;
    } else if ( typeof name === 'string' && name.startsWith('as ') ) {
      // on event: attach event handler
      name = StringHelper.trim(name.substring(3));
      this.attachBehavior(name, value instanceof Behavior ? value : App.createObject(value));
      return;
    }

    this.ensureBehaviors();

    for ( const behavior of Object.values(this._behaviors) ) {
      if ( behavior.hasProperty(name) ) {
        if ( !this.canSetProperty(name, false) ) {
          throw new InvalidCallException(`Setting read-only property: ${(name as string)}'`);
        }
        behavior.set(name, value);
        return;
      }
    }

    throw new UnknownPropertyException(`Setting unknown property: ${(name as string)}'`);
  }

  /**
   * Checks if a property is set, i.e. defined and not null.
   *
   * This method will check in the following order and act accordingly:
   *
   *  - a property defined by a setter: return whether the property is set
   *  - a property of a behavior: return whether the property is set
   *  - return `false` for non-existing properties
   *
   * @param name the property name
   * @param [checkBehaviors=true] - Whether to treat behaviors' properties as properties of this component
   * @throws {UnknownPropertyException} if the property is not defined
   * @throws InvalidCallError if the property is read-only
   * @see __set()
   */
  public has ( name: string | symbol, checkBehaviors: boolean = true ): boolean {
    return this.hasProperty(name, checkBehaviors)
      || this.hasMethod(name, checkBehaviors)
      || false;
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
   * @param checkBehaviors=true - Whether to treat behaviors' properties as properties of this component
   */
  public unset ( name: string | symbol, checkBehaviors: boolean = true ) {
    if ( this.hasProperty(name, false) ) {
      if ( !this.canSetProperty(name, false) ) {
        throw new InvalidCallException(`Setting read-only property: '${(name as string)}'`);
      }

      this[name] = null;
      return;
    }

    if ( checkBehaviors ) {
      this.ensureBehaviors();

      let holder: Behavior | null = null;

      for ( const behavior of Object.values(this._behaviors) ) {
        if ( behavior.hasProperty(name) ) {
          holder = behavior;
          break;
        }
      }

      if ( holder !== null ) {
        if ( holder.canSetProperty(name) ) {
          throw new InvalidCallException(`Setting read-only property: '${(name as string)}'`);
        }

        holder.unset(name);
        return;
      }
    }

    throw new UnknownPropertyException(`Setting unknown property: '${(name as string)}'`);
  }

  /**
   * Returns a list of behaviors that this component should behave as.
   * Child classes may override this method to specify the behaviors they want to behave as.
   * @return The behavior configurations.
   */
  public behaviors (): BehaviorRegistry {
    return {};
  }

  /**
   * Returns a value indicating whether there is any handler attached to the named event.
   * @param name - The event name
   * @return Whether there is any handler attached to the event.
   */
  public hasEventHandlers ( name: string ): boolean {
    this.ensureBehaviors();

    return Op.has(this._events, name)
      ? true
      : Event.hasHandlers(name);
  }

  /**
   * Attaches an event handler to a class-level event.
   *
   * When a class-level event is triggered, event handlers attached
   * to that class and all parent classes will be invoked.
   *
   * For example, the following code attaches an event handler `afterInsert` event:
   *
   * @example
   * Event.on(Component.EVENT_AFTER_INSERT, async event => {
   *     console.log(Component.EVENT_AFTER_INSERT, 'is triggered.');
   * });
   * ```
   *
   * For more details about how to declare an event handler, please refer to [[Component::on()]].
   *
   * @param name the event name.
   * @param handler the event handler.
   * @param data the data to be passed to the event handler when the event is triggered.
   * When the event handler is invoked, these data can be accessed via [[Event::data]].
   * @param append whether to append new event handler to the end of the existing
   * handler list. If `false`, the new handler will be inserted at the beginning of the existing
   * handler list.
   * @see off()
   */
  public on ( name: string, handler: Function, data: any = null, append: boolean = true ): void {
    this.ensureBehaviors();

    if ( !Op.has(this._events, name) ) {
      this._events[name] = [];
    }

    if ( append ) {
      this._events[name].push([handler, data]);
    } else {
      this._events[name].unshift([handler, data]);
    }
  }

  /**
   * Detaches an event handler from a class-level event.
   * This method is the opposite of [on()].
   *
   * @param name the event name.
   * @param handler the event handler to be removed.
   * If it is `null`, all handlers attached to the named event will be removed.
   * @return whether a handler is found and detached.
   * @see on()
   */
  public off ( name, handler: Function | null = null ): boolean {
    this.ensureBehaviors();

    if ( !Op.has(this._events, name) ) {
      return false;
    }

    if ( handler === null ) {
      delete this._events[name];
      return true;
    }

    // plain event names
    let removed: boolean = false;
    let i = 0;

    for ( const data of Object.values(this._events[name]) ) {
      if ( data[0] === handler ) {
        delete this._events[name][i];
        removed = true;
      }

      if ( removed ) {
        this._events[name] = Object.values(this._events[name]);
        return true;
      }

      i++;
    }

    return false;
  }

  /**
   * Triggers a class-level event.
   * This method will cause invocation of event handlers that are attached to the named event
   *
   * @param name - The event name.
   * @param event - The event parameter, If not set, a default {@link Event} object will be created.
   */
  public async trigger ( name, event: Event | null = null ) {
    this.ensureBehaviors();

    if ( !Op.has(this._events, name) ) {
      return;
    }

    if ( event === null ) {
      event = new Event();
    }

    event.handled = false;
    event.name = name;

    const eventHandlers: Array<EventRegistry> = Op.get(this._events, name, []);

    for await ( const [handler, data] of eventHandlers ) {
      if ( R_is(Object, data) && (R_is(Object, event.data) || !event.data) ) {
        event.data = {...data, ...(event.data || {})};
      } else {
        event.data = event.data || data;
      }
      const callback = CallbackHelper.promisify(handler);
      await callback.call(null, event);
      if ( event.handled ) {
        return;
      }
    }
  }

  /**
   * Returns the named behavior object.
   * @param name - The behavior name
   * @return The behavior object, or null if the behavior does not exist
   */
  public getBehavior ( name: string ): Behavior | null {
    this.ensureBehaviors();
    return Op.get<Behavior | null>(this._behaviors, name, null);
  }

  /**
   * Returns all behaviors attached to this component.
   * @returns List of behaviors attached to this component
   */
  public getBehaviors (): BehaviorRegistry {
    this.ensureBehaviors();
    return this._behaviors;
  }

  /**
   * Attaches a behavior to this component.
   * This method will create the behavior object based on the given
   * configuration. After that, the behavior object will be attached to
   * this component by calling the [[Behavior::attach()]] method.
   * @param name - The name of the behavior.
   * @param behavior - The behavior configuration. This can be one of the following:
   * @return The behavior object
   * @see detachBehavior()
   */
  public attachBehavior ( name: string, behavior: Behavior ): Behavior {
    this.ensureBehaviors();
    return this.attachBehaviorInternal(name, behavior);
  }

  /**
   * Attaches a list of behaviors to the component.
   * Each behavior is indexed by its name and should be a [[Behavior]] object,
   * a string specifying the behavior class, or a configuration array for creating the behavior.
   * @param behaviors - List of behaviors to be attached to the component
   * @see attachBehavior()
   */
  public attachBehaviors ( behaviors: BehaviorRegistry ): void {
    this.ensureBehaviors();

    for ( const [name, behavior] of Object.entries(behaviors) ) {
      this.attachBehaviorInternal(name, behavior);
    }
  }

  /**
   * Detaches a behavior from the component.
   * The behavior's [@see detach()] method will be invoked.
   * @param name the behavior's name.
   * @return Behavior|null the detached behavior. Null if the behavior does not exist.
   * @see detach()
   */
  public detachBehavior ( name: string ): Behavior | null {
    this.ensureBehaviors();

    if ( Op.has(this._behaviors, name) ) {
      const behavior: Behavior = this._behaviors[name];
      delete this._behaviors[name];
      behavior.detach();
      return behavior;
    }

    return null;
  }

  /**
   * Detaches all behaviors from the component.
   */
  public detachBehaviors () {
    this.ensureBehaviors();
    for ( const name of Object.keys(this._behaviors) ) {
      this.detachBehavior(name);
    }
  }

  /**
   * Makes sure that the behaviors declared in [[behaviors()]] are attached to this component.
   */
  public ensureBehaviors (): void {
    if ( this._behaviors === null ) {
      this._behaviors = {};
      for ( const [name, behavior] of Object.entries(this.behaviors()) ) {
        this.attachBehaviorInternal(name, behavior);
      }
    }
  }

  /**
   * Attaches a behavior to this component.
   * @param name the name of the behavior.
   * will be detached first.
   * @param behavior the behavior to be attached
   * @return Behavior the attached behavior.
   */
  private attachBehaviorInternal ( name: string, behavior: Behavior ) {
    if ( Op.has(this._behaviors, name) ) {
      this._behaviors[name].detach();
    } else {
      behavior.attach(this);
      this._behaviors[name] = behavior;
    }

    return behavior;
  }
}
