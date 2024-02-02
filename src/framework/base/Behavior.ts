/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

import Component from 'framework/base/Component';
import BaseObject from 'framework/base/BaseObject';

// Types
export type BehaviorMap = { [key: string]: Function };
export type BehaviorRegistry = { [name: string]: Behavior };

/**
 * Behavior is the base class for all behavior classes.
 *
 * A behavior can be used to enhance the functionality of an existing component without modifying its code.
 * In particular, it can "inject" its own methods and properties into the component
 * and make them directly accessible via the component. It can also respond to the events triggered in the component
 * and thus intercept the normal code execution.
 */
export default class Behavior extends BaseObject {
  /**
   * The owner of this behavior
   */
  public owner: Component | null = null;

  /**
   * Attached events handlers
   */
  private _attachedEvents: BehaviorMap = {};

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Behavior';
  }

  /**
   * Declares event handlers for the [[owner]]'s events.
   *
   * Child classes may override this method to declare what PHP callbacks should
   * be attached to the events of the [[owner]] component.
   *
   * The callbacks will be attached to the [[owner]]'s events when the behavior is
   * attached to the owner; and they will be detached from the events when
   * the behavior is detached from the component.
   *
   * @example
   * {
   *     Model.EVENT_BEFORE_VALIDATE: 'myBeforeValidate',
   *     Model.EVENT_AFTER_VALIDATE: 'myAfterValidate',
   * }
   *
   * @return The corresponding name and event handler methods.
   */
  public events (): BehaviorMap {
    return {};
  }

  /**
   * Attaches the behavior object to the component.
   * The default implementation will set the [[owner]] property
   * and attach event handlers as declared in [[events]].
   * Make sure you call the parent implementation if you override this method.
   * @param owner the component that this behavior is to be attached to.
   */
  public attach ( owner: Component ): void {
    this.owner = owner;

    for ( const [event, handler] of Object.entries(this.events()) ) {
      this._attachedEvents[event] = handler;
      owner.on(event, handler);
    }
  }

  /**
   * Detaches the behavior object from the component.
   * The default implementation will unset the [[owner]] property
   * and detach event handlers declared in [[events]].
   * Make sure you call the parent implementation if you override this method.
   */
  public detach (): void {
    if ( this.owner ) {
      for ( const [event, handler] of Object.entries(this._attachedEvents) ) {
        this.owner.off(event, handler);
      }

      this._attachedEvents = {};
      this.owner = null;
    }
  }
}
