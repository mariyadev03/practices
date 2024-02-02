/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-02
 */

import * as Op from 'object-path';
import { is as R_is } from 'ramda';

// Core
import BaseObject from 'framework/base/BaseObject';

// Helpers
import CallbackHelper from 'framework/helpers/CallbackHelper';

// Types
export type EventRegistry = [Function, any];
export type EventsMap = { [name: string]: Array<EventRegistry> };

/**
 * Event is the base class for all event classes.
 *
 * It encapsulates the parameters associated with an event.
 * And the {@link handled} property indicates if the event is handled.
 * If an event handler sets [[handled]] to be `true`, the rest of the
 * uninvoked handlers will no longer be called to handle the event.
 *
 * Additionally, when attaching an event handler, extra data may be passed
 * and be available via the [[data]] property when the event handler is invoked.
 */
export default class Event extends BaseObject {
  /**
   * The event name, This property is set by [[Component.trigger()]] and [[trigger()]].
   * Event handlers may use this property to check what event it is handling.
   */
  public name = '';

  /**
   * The sender of this event. If not set, this property will be
   * set as the object whose `trigger()` method is called.
   * This property may also be a `null` when this event is a
   * class-level event which is triggered in a static context.
   */
  public sender: any = null;

  /**
   * Whether the event is handled. Defaults to `false`.
   * When a handler sets this to be `true`, the event processing will stop and
   * ignore the rest of the uninvoked event handlers.
   */
  public handled = false;

  /**
   * The data that is passed to [[Component.on()]] when attaching an event handler.
   * Note that this varies according to which event handler is currently executing.
   */
  public data: any = null;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Event';
  }

  /**
   * Contains all globally registered event handlers.
   */
  private static _events: EventsMap = {};

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
  public static on ( name: string, handler: Function, data: any = null, append = true ): void {
    if ( !Op.has(Event._events, name) ) {
      Event._events[name] = [];
    }

    if ( append ) {
      Event._events[name].push([handler, data]);
    } else {
      Event._events[name].unshift([handler, data]);
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
  public static off ( name: string, handler: Function | null ): boolean {
    if ( !Op.has(Event._events, name) ) {
      return false;
    }

    if ( handler === null ) {
      delete Event._events[name];
      return true;
    }

    // plain event names
    let removed = false;
    let i = 0;

    for ( const data of Object.values(Event._events[name]) ) {
      if ( data[0] === handler ) {
        delete Event._events[name][i];
        removed = true;
      }

      if ( removed ) {
        Event._events[name] = Object.values(Event._events[name]);
        return true;
      }

      i++;
    }

    return false;
  }

  /**
   * Detaches all registered class-level event handlers.
   * @see on()
   * @see off()
   */
  public static offAll (): void {
    Event._events = {};
  }

  /**
   * Returns a value indicating whether there is any handler attached to the specified class-level event.
   * Note that this method will also check all parent classes to see if there is any handler attached
   * to the named event.
   * @param name the event name.
   * @return whether there is any handler attached to the event.
   */
  public static hasHandlers ( name: string ): boolean {
    return !!Op.get(Event._events, name, []).length;
  }

  /**
   * Triggers a class-level event.
   * This method will cause invocation of event handlers that are attached to the named event
   *
   * @param name The event name.
   * @param event The event parameter, If not set, a default [[Event]] object will be created.
   */
  public static async trigger ( name: string, event: Event | null = null ): Promise<void> {
    if ( !Op.has(Event._events, name) ) {
      return;
    }

    if ( event === null ) {
      event = new Event();
    }

    event.handled = false;
    event.name = name;

    const eventHandlers: Array<EventRegistry> = Op.get(Event._events, name, []);

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
}
