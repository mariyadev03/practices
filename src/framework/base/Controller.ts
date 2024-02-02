/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

// Global vars
declare var App;

// Core
import Component from 'framework/base/Component';
import Module from 'framework/base/Module';
import Action from 'framework/base/Action';
import Application from 'framework/base/Application';
import View from 'framework/base/View';
import Instance from 'framework/di/Instance';
import Request from 'framework/base/Request';
import Response from 'framework/base/Response';

// Types
import { Configuration } from 'framework/base/CoreObject';

// Interfaces
import ViewContextInterface from 'framework/interfaces/ViewContextInterface';
import ActionEvent from 'framework/base/ActionEvent';

/**
 * Controller is the base class of web controllers.
 */
export default class Controller extends Component implements ViewContextInterface {
  /**
   * @event ActionEvent an event raised right before executing a controller action.
   * You may set {@link ActionEvent#isValid()} to be false to cancel the action execution.
   */
  static readonly EVENT_BEFORE_ACTION: string = 'beforeAction';

  /**
   * @event ActionEvent an event raised right after executing a controller action.
   */
  static readonly EVENT_AFTER_ACTION: string = 'afterAction';

  /**
   * The ID of this controller.
   * @type {string}
   */
  public id = '';

  /**
   * @type {Module} the module that this controller belongs to.
   */
  public module;

  /**
   * @var string the ID of the action that is used when the action ID is not specified
   * in the request. Defaults to 'index'.
   */
  public defaultAction = 'index';

  /**
   * The name of the layout to be applied to this controller's views.
   * This property mainly affects the behavior of {@link render()}.
   * Defaults to null, meaning the actual layout value should inherit that from {@link module}'s layout value.
   * If false, no layout will be applied.
   */
  public layout: string | null | false = null;

  /**
   * @type {Action|null} the action that is currently being executed. This property will be set
   * by {@link run()} when it is called by {@link Application} to run an action.
   */
  public action;

  /**
   * @var Request|array|string The request.
   */
  public request = 'request';

  /**
   * @var Response|array|string The response.
   */
  public response = 'response';

  /**
   * The view object that can be used to render views or view files.
   */
  private _view: View | null = null;

  /**
   * The root directory that contains view files for this controller.
   */
  private _viewPath: string | null = null;

  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/Controller';
  }

  /**
   * @inheritDoc
   *
   * @param id - The ID of this controller.
   * @param module - The module that this controller belongs to.
   * @param config - Name-value pairs that will be used to initialize the object properties.
   */
  public constructor ( id: string, module: Module, config: Configuration = {} ) {
    super(config);
    this.id = id;
    this.module = module;
  }

  /**
   * @inheritDoc
   */
  init () {
    super.init();
    this.request = Instance.ensure(this.request, Request.prototype.namespace);
    this.response = Instance.ensure(this.response, Response.prototype.namespace);
  }

  /**
   * Declares external actions for the controller.
   *
   * This method is meant to be overwritten to declare external actions for the controller.
   * It should return an array, with array keys being action IDs, and array values the corresponding
   * action namespaces or action configuration object. For example,
   *
   * ```js
   * return {
   *     action1: 'app/components/Action1',
   *     action2: {
   *         namespace: 'app/components/Action2',
   *         property1: 'value1',
   *         property2: 'value2',
   *     },
   * };
   * ```
   *
   * {@link App.createObject()} will be used later to create the requested action
   * using the configuration provided here.
   */
  public actions (): { [action: string]: string | { namespace: string, [property: string]: any } } {
    return {};
  }

  /**
   * Runs an action within this controller with the specified action ID and parameters.
   * If the action ID is empty, the method will use {@link defaultAction}.
   * @param id - The ID of the action to be executed.
   * @param params - The parameters (name-value pairs) to be passed to the action.
   * @return - The result of the action.
   * @throws {InvalidRouteException} - If the requested action ID cannot be resolved into an action successfully.
   * @see createAction()
   */
  public runAction ( id, params = {} ) {
    // todo: implement logic here
  }

  /**
   * Runs a request specified in terms of a route.
   * The route can be either an ID of an action within this controller or a complete route consisting
   * of module IDs, controller ID and action ID. If the route starts with a slash '/', the parsing of
   * the route will start from the application; otherwise, it will start from the parent module of this controller.
   * @param route - The route to be handled, e.g., 'view', 'comment/view', '/admin/comment/view'.
   * @param params - The parameters to be passed to the action.
   * @return mixed the result of the action.
   * @see runAction()
   */
  public run ( route: string, params: Array<any> = [] ) {
    // todo: implement logic here
  }

  /**
   * Binds the parameters to the action.
   * This method is invoked by {@link Action} when it begins to run with the given parameters.
   * @param action the action to be bound with parameters.
   * @param params the parameters to be bound to the action.
   * @return array the valid parameters that the action can run with.
   */
  public bindActionParams ( action: Action, params = {} ) {
    return {};
  }

  /**
   * Creates an action based on the given action ID.
   * The method first checks if the action ID has been declared in {@link actions}. If so,
   * it will use the configuration declared there to create the action object.
   * If not, it will look for a controller method whose name is in the format of `actionXyz`
   * where `xyz` is the action ID. If found, an {@link InlineAction} representing that
   * method will be created and returned.
   * @param id - The action ID.
   * @return The newly created action instance. Null if the ID doesn't resolve into any action.
   */
  public createAction ( id: string ): Action | null {
    if ( !id.trim() ) {
      id = this.defaultAction;
    }

    const actionMap = this.actions();
    if ( id in actionMap ) {
      return App.createObject(actionMap[id], [id, {}], this);
    }

    if ( /^(?:[a-z0-9_]+-)*[a-z0-9_]+$/.test(id) ) {
      // todo: implement logic here
      //const methodName = 'action' + str_replace(' ', '', ucwords(str_replace('-', ' ', $id)));
      /*if (method_exists($this, $methodName)) {
        $method = new \ReflectionMethod($this, $methodName);
        if ($method->isPublic() && $method->getName() === $methodName) {
          return new InlineAction($id, $this, $methodName);
        }
      }*/
    }

    return null;
  }

  /**
   * This method is invoked right before an action is executed.
   *
   * The method will trigger the {@link EVENT_BEFORE_ACTION} event. The return value of the method
   * will determine whether the action should continue to run.
   *
   * In case the action should not run, the request should be handled inside the `beforeAction` code
   * by either providing the necessary output or redirecting the request. Otherwise, the response will be empty.
   *
   * If you override this method, your code should look like the following:
   *
   * ```js
   * public async beforeAction ( action: Action ): Promise<boolean> {
   *   // your custom code here, if you want the code to run before action filters,
   *   // which are triggered on the 'EVENT_BEFORE_ACTION' event, e.g. PageCache or AccessControl
   *
   *   if ( !(await super.beforeAction(action)) ) {
   *     return false;
   *   }
   *
   *   // other custom code here
   *
   *   return true; // or false to not run the action
   * }
   * ```
   *
   * @param action - The action to be executed.
   * @return Whether the action should continue to run.
   */
  public async beforeAction ( action: Action ): Promise<boolean> {
    const event = new ActionEvent(action);
    await this.trigger(Controller.EVENT_BEFORE_ACTION, event);
    return event.isValid;
  }

  /**
   * This method is invoked right after an action is executed.
   *
   * The method will trigger the {@link EVENT_AFTER_ACTION} event. The return value of the method
   * will be used as the action return value.
   *
   * If you override this method, your code should look like the following:
   *
   * ```js
   * public async afterAction ( action: Action, result: any ): Promise<any> {
   *     result = await super.afterAction(action, result);
   *     // your custom code here
   *     return result;
   * }
   * ```
   *
   * @param action - The action just executed.
   * @param result - The action return result.
   * @return The processed action result.
   */
  public async afterAction ( action: Action, result: any ): Promise<any> {
    const event = new ActionEvent(action);
    event.result = result;
    await this.trigger(Controller.EVENT_AFTER_ACTION, event);
    return event.result;
  }

  /**
   * Returns all ancestor modules of this controller.
   * The first module in the array is the outermost one (i.e., the application instance),
   * while the last is the innermost one.
   * @return Module[] all ancestor modules that this controller is located within.
   */
  public getModules () {
    // TODO: implement logic here
    /*$modules = [$this.module];
    $module = $this.module;
    while ($module.module !== null) {
      array_unshift($modules, $module.module);
      $module = $module.module;
    }

    return $modules;*/
  }

  /**
   * Returns the unique ID of the controller.
   * @return The controller ID that is prefixed with the module ID (if any).
   */
  public getUniqueId (): string {
    return this.module instanceof Application
      ? this.id
      : this.module.getUniqueId() + '/' + this.id;
  }

  /**
   * Returns the route of the current request.
   * @return string the route (module ID, controller ID and action ID) of the current request.
   */
  public getRoute () {
    return this.action !== null ? this.action.getUniqueId() : this.getUniqueId();
  }

  public render ( view, params = {} ) {
    /*content = this.getView().render(view, params, this);
    return this.renderContent(content);*/
  }

  /**
   * Renders a static string by applying a layout.
   * @param content - The static string being rendered
   * @return The rendering result of the layout with the given static string as the `content` variable.
   * If the layout is disabled, the string will be returned.
   */
  public renderContent ( content: string ): string {
    return '';
    /*const layoutFile: string | boolean = this.findLayoutFile(this.getView());
    if ( layoutFile !== false ) {
      return this.getView().renderFile(layoutFile, {content}, this);
    }

    return content;*/
  }

  /**
   * Renders a view without applying layout.
   * This method differs from [[render()]] in that it does not apply any layout.
   * @param view the view name. Please refer to [[render()]] on how to specify a view name.
   * @param params the parameters (name-value pairs) that should be made available in the view.
   * @return string the rendering result.
   * @throws InvalidArgumentException if the view file does not exist.
   */
  public renderPartial ( view, params = {} ): string {
    return '';
    //return this.getView().render(view, params, this);
  }

  /**
   * Renders a view file.
   * @param file the view file to be rendered.
   * @param params the parameters (name-value pairs) that should be made available in the view.
   * @return string the rendering result.
   * @throws InvalidArgumentException if the view file does not exist.
   */
  public renderFile ( file: string, params = {} ): string {
    return '';
    //return this.getView().renderFile(file, params, this);
  }

  /**
   * Returns the view object that can be used to render views or view files.
   * The {@link render()}, {@link renderPartial()} and {@link renderFile()} methods will use
   * this view object to implement the actual view rendering.
   * If not set, it will default to the "view" application component.
   * @return The view object that can be used to render views or view files.
   */
  public getView (): View {
    if ( this._view === null ) {
      // TODO: implementation of logic
      //this._view = App.app.getView();
    }

    return (this._view as View);
  }

  /**
   * Sets the view object to be used by this controller.
   * @param view - The view object that can be used to render views or view files.
   */
  public setView ( view: View ): void {
    this._view = view;
  }

  /**
   * Returns the directory containing view files for this controller.
   * The default implementation returns the directory named as controller {@link id} under the {@link module}'s
   * {@link _viewPath} directory.
   * @return The directory containing the view files for this controller.
   */
  public getViewPath (): string {
    if ( this._viewPath === null ) {
      this._viewPath = this.module.getViewPath() + '/' + this.id;
    }

    return this._viewPath;
  }

  /**
   * Sets the directory that contains the view files.
   * @param path - The root directory of view files.
   * @throws {InvalidArgumentError} if the directory is invalid
   */
  public setViewPath ( path: string ): void {
    // TODO: implementation of logic
    //this._viewPath = App.getAlias(path);
  }

  /**
   * Finds the applicable layout file.
   * @param view - The view object to render the layout file.
   * @return The layout file path, or false if layout is not needed.
   * Please refer to {@link render()} on how to specify this parameter.
   * @throws {InvalidArgumentError} if an invalid path alias is used to specify the layout.
   */
  public findLayoutFile ( view: View ): string | boolean {
    // TODO: implementation of logic
    return '';
  }
}
