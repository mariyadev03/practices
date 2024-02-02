/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-11
 */

// Core
import Behavior from 'framework/base/Behavior';
import Component from 'framework/base/Component';
import Controller from 'framework/base/Controller';
import ActionEvent from 'framework/base/ActionEvent';
import Action from 'framework/base/Action';
import Module from 'framework/base/Module';

// Helpers
import StringHelper from 'framework/helpers/StringHelper';

/**
 * ActionFilter is the base class for action filters.
 *
 * An action filter will participate in the action execution workflow by responding to
 * the `beforeAction` and `afterAction` events triggered by modules and controllers.
 */
export default class ActionFilter extends Behavior {
  /**
   * @var array list of action IDs that this filter should apply to. If this property is not set,
   * then the filter applies to all actions, unless they are listed in {@link except}
   * If an action ID appears in both {@link only} and {@link except} this filter will NOT apply to it.
   *
   * Note that if the filter is attached to a module, the action IDs should also include child module IDs (if any)
   * and controller IDs.
   *
   * Action IDs can be specified as wildcards, e.g. `site/*`.
   *
   * @see except
   */
  public only;

  /**
   * List of action IDs that this filter should not apply to.
   * @see only
   */
  public except: Array<string> = [];

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/ActionFilter';
  }

  /**
   * @inheritDoc
   */
  public attach ( owner: Component ) {
    this.owner = owner;
    owner.on(Controller.EVENT_BEFORE_ACTION, async ( action: Action ) => this.beforeAction(action));
  }

  /**
   * @inheritDoc
   */
  detach () {
    if ( this.owner ) {
      this.owner.off(Controller.EVENT_BEFORE_ACTION, async ( event: ActionEvent ) => this.beforeFilter(event));
      this.owner.off(Controller.EVENT_AFTER_ACTION, async ( event: ActionEvent ) => this.afterFilter(event));
      this.owner = null;
    }
  }

  /**
   * @param event
   */
  public async beforeFilter ( event: ActionEvent ): Promise<void> {
    if ( !(await this.isActive(event.action)) ) {
      return;
    }

    event.isValid = await this.beforeAction(event.action);
    if ( event.isValid ) {
      // call afterFilter only if beforeFilter succeeds
      // beforeFilter and afterFilter should be properly nested
      if ( this.owner ) {
        this.owner.on(Controller.EVENT_AFTER_ACTION, async ( event: ActionEvent ) => this.afterFilter(event), null, false);
      } else {
        event.handled = true;
      }
    }
  }

  public async afterFilter ( event: ActionEvent ) {
    event.result = this.afterAction(event.action, event.result);
    if ( this.owner ) {
      this.owner.off(Controller.EVENT_AFTER_ACTION, async ( event: ActionEvent ) => this.afterFilter(event));
    }
  }

  /**
   * This method is invoked right before an action is to be executed (after all possible filters.)
   * You may override this method to do last-minute preparation for the action.
   * @param action - The action to be executed.
   * @return Whether the action should continue to be executed.
   */
  public async beforeAction ( action: Action ): Promise<boolean> {
    return true;
  }

  /**
   * This method is invoked right after an action is executed.
   * You may override this method to doing some postprocessing for the action.
   * @param action - The action just executed.
   * @param result - The action execution result
   * @return The processed action result.
   */
  public async afterAction<T> ( action: Action, result: T ): Promise<T> {
    return result;
  }

  /**
   * Returns an action ID by converting {@link Action#getUniqueId()} into an ID relative to the module.
   */
  protected getActionId ( action: Action ): string {
    let id: string = '';

    if ( this.owner instanceof Module ) {
      const mid = this.owner.getUniqueId();
      id = action.getUniqueId();
      if ( mid !== '' && StringHelper.strpos(id, mid) === 0 ) {
        id = id.substring(mid.length + 1);
      }
    } else {
      id = action.id;
    }

    return id;
  }

  /**
   * Returns a value indicating whether the filter is active for the given action.
   * @param action - The action being filtered
   * @return Whether the filter is active for the given action.
   */
  protected isActive ( action: Action ): boolean {
    const id: string = this.getActionId(action);

    let onlyMatch: boolean = false;

    if ( !this.only.length ) {
      onlyMatch = true;
    } else {
      for ( const pattern of this.only ) {
        if ( StringHelper.matchWildcard(pattern, id) ) {
          onlyMatch = true;
          break;
        }
      }
    }

    let exceptMatch: boolean = false;

    for ( const pattern of this.except ) {
      if ( StringHelper.matchWildcard(pattern, id) ) {
        exceptMatch = true;
        break;
      }
    }

    return !exceptMatch && onlyMatch;
  }
}
