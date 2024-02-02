/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-05
 */

import Event from 'framework/base/Event';
import Action from 'framework/base/Action';

// Types
import { Configuration } from 'framework/base/CoreObject';

/**
 * ActionEvent represents the event parameter used for an action event.
 * By setting the {@link isValid} property, one may control whether to continue running the action.
 */
export default class ActionEvent extends Event {
  /**
   * The action currently being executed
   */
  public action: Action;

  /**
   * The action result. Event handlers may modify this property to change the action result.
   */
  public result: any;

  /**
   * @var bool whether to continue running the action. Event handlers of
   * {@link Controller.EVENT_BEFORE_ACTION} may set this property to decide whether
   * to continue running the current action.
   */
  public isValid = true;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/ActionEvent';
  }

  /**
   * Constructor.
   * @param action - The action associated with this action event.
   * @param config - Name-value pairs that will be used to initialize the object properties
   */
  public constructor ( action: Action, config: Configuration = {} ) {
    super(config);
    this.action = action;
  }
}
