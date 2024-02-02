/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-05
 */

// Core
import Component from 'framework/base/Component';
import Controller from 'framework/base/Controller';

// Exceptions
import InvalidConfigException from 'framework/base/InvalidConfigException';

// Types
import { Configuration } from 'framework/base/CoreObject';

// Decorators
import namespace from 'framework/decorators/namespace';

/**
 * Action is the base class for all controller action classes.
 *
 * Action provides a way to reuse action method code. An action method in an Action
 * class can be used in multiple controllers or in different projects.
 *
 * Derived classes must implement a method named `run()`. This method
 * will be invoked by the controller when the action is requested.
 * The `run()` method can have parameters which will be filled up
 * with user input values automatically according to their names.
 * For example, if the `run()` method is declared as follows:
 *
 * And the parameters provided for the action are: `{'id': 1}`.
 * Then the `run()` method will be invoked as `run(1)` automatically.
 *
 * @example
 * public async run ( id: number, type: string = 'book' ) { ... }
 */
export default class Action extends Component {
  /**
   * ID of the action
   */
  public id: string;

  /**
   * The controller that owns this action
   */
  public controller: Controller;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Action';
  }

  /**
   * Constructor.
   *
   * @param id - The ID of this action
   * @param controller - The controller that owns this action
   * @param config - Name-value pairs that will be used to initialize the object properties
   */
  constructor ( id: string, controller: Controller, config: Configuration = {} ) {
    super(config);
    this.controller = controller;
    this.id = id;
  }

  /**
   * Returns the unique ID of this action among the whole application.
   * @return The unique ID of this action among the whole application.
   */
  public getUniqueId (): string {
    return this.controller.getUniqueId() + '/' + this.id;
  }

  /**
   * Runs this action with the specified parameters.
   * This method is mainly invoked by the controller.
   *
   * @param params - Rhe parameters to be bound to the action's run() method.
   * @return The result of the action
   * @throws {InvalidConfigException} if the action class does not have a run() method
   */
  public runWithParams ( params: { [param: string]: any } ): any {
    if ( !this.hasMethod('run') ) {
      throw new InvalidConfigException(`${this.constructor.name} must define a 'run()' method.`);
    }
  }

  /**
   * This method is called right before `run()` is executed.
   * You may override this method to do preparation work for the action run.
   * If the method returns false, it will cancel the action.
   *
   * @return Whether to run the action.
   */
  protected beforeRun (): boolean {
    return true;
  }

  /**
   * This method is called right after `run()` is executed.
   * You may override this method to do post-processing work for the action run.
   */
  protected afterRun (): void {
  }
}
