/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

import fastify, { FastifyInstance } from 'fastify';

// Core
import Component from 'framework/base/Component';
import { ServerListenOptions } from 'framework/fastify/Interfaces';
import Event from 'framework/base/Event';

export default class Server extends Component {
  /**
   * Fastify instance
   */
  private fastify;
  /**
   * @event Event - An event raised before the application starts to handle a request.
   */
  static readonly EVENT_ON_REQUEST: string = 'onRequest';

  /**
   * @event Event - using the preParsing hook, you can transform the request payload stream before it is parsed.
   * It receives the request and reply objects as other hooks, and a stream with the current request payload.
   */
  static readonly EVENT_PRE_PARSING: string = 'preParsing';

  /**
   * @event Event - Can change the payload before it is validated
   */
  static readonly EVENT_PRE_VALIDATION: string = 'preValidation';

  /**
   * @event Event - An event raised before executing the route handler.
   */
  static readonly EVENT_PRE_HANDLER: string = 'preHandler';

  /**
   * @event Event - Can change (or replace) the payload before it is serialized
   */
  static readonly EVENT_PRE_SERIALIZATION: string = 'preSerialization';

  /**
   * @event Event - Custom error logging or add some specific header in case of error.
   */
  static readonly EVENT_ON_ERROR: string = 'onError';

  /**
   * @event Event - Can change the payload
   * @see https://www.fastify.io/docs/latest/Reference/Hooks/#onsend
   */
  static readonly EVENT_ON_SEND: string = 'onSend';

  /**
   * @event Event - Executed when a response has been sent, so you will not be able to send more data to the client.
   * It can, however, be useful for sending data to external services, for example, to gather statistics.
   */
  static readonly EVENT_ON_RESPONSE: string = 'onResponse';

  /**
   * @event Event - Useful if you need to monitor the request timed out in your service
   */
  static readonly EVENT_ON_TIMEOUT: string = 'onTimeout';

  /**
   * @event Event - Triggered before the server starts listening for requests and when .ready() is invoked
   */
  static readonly EVENT_ON_READY: string = 'onReady';

  /**
   * @event Event - Triggered when fastify.close() is invoked to stop the server.
   * It is useful when plugins need a "shutdown" event, for example, to close an open connection to a database.
   */
  static readonly EVENT_ON_CLOSE: string = 'onClose';

  /**
   * @event Event - Triggered when a new route is registered. Listeners are passed a routeOptions object as the sole parameter.
   */
  static readonly EVENT_ON_ROUTE: string = 'onRoute';

  /**
   * @event Event - Triggered when a new plugin is registered and a new encapsulation context is created.
   * The hook will be executed before the registered code.
   */
  static readonly EVENT_ON_REGISTER: string = 'onRegister';

  /**
   * @inheritDoc
   */
  get namespace (): string {
    return 'framework/fastify/Server';
  }

  /**
   * @inheritDoc
   */
  constructor ( config ) {
    config['serverOptions'] = config['serverOptions'] || {};
    super(config);
  }

  /**
   * @inheritDoc
   */
  init (): void {
    this.initServer();
  }

  private initServer (): void {
    this.fastify = fastify({
      ...this.get('serverOptions'),
      logger: true,
    });

    this.registerServerEvents();
  }

  private registerServerEvents (): void {
    const createEvent = data => {
      const event = new Event();
      event.sender = this;
      event.data = data;
      return event;
    };

    this.getInstance().addHook('onRequest', async ( request, reply ) => {
      await this.trigger(Server.EVENT_ON_REQUEST, createEvent({request, reply}));
    });

    this.getInstance().addHook('preParsing', async ( request, reply, payload ) => {
      await this.trigger(Server.EVENT_PRE_PARSING, createEvent({request, reply, payload}));
    });

    this.getInstance().addHook('preValidation', async ( request, reply ) => {
      await this.trigger(Server.EVENT_PRE_VALIDATION, createEvent({request, reply}));
    });

    this.getInstance().addHook('preHandler', async ( request, reply ) => {
      await this.trigger(Server.EVENT_PRE_HANDLER, createEvent({request, reply}));
    });

    this.getInstance().addHook('preSerialization', async ( request, reply, payload ) => {
      await this.trigger(Server.EVENT_PRE_SERIALIZATION, createEvent({request, reply, payload}));
    });

    this.getInstance().addHook('onError', async ( request, reply, error ) => {
      await this.trigger(Server.EVENT_ON_ERROR, createEvent({request, reply, error}));
    });

    this.getInstance().addHook('onSend', async ( request, reply, payload ) => {
      await this.trigger(Server.EVENT_ON_SEND, createEvent({request, reply, payload}));
    });

    this.getInstance().addHook('onResponse', async ( request, reply ) => {
      await this.trigger(Server.EVENT_ON_RESPONSE, createEvent({request, reply}));
    });

    this.getInstance().addHook('onTimeout', async ( request, reply ) => {
      await this.trigger(Server.EVENT_ON_TIMEOUT, createEvent({request, reply}));
    });

    this.getInstance().addHook('onReady', async () => {
      await this.trigger(Server.EVENT_ON_READY, createEvent({}));
    });

    this.getInstance().addHook('onClose', async instance => {
      await this.trigger(Server.EVENT_ON_CLOSE, createEvent({instance}));
    });

    this.getInstance().addHook('onRoute', async routeOptions => {
      await this.trigger(Server.EVENT_ON_ROUTE, createEvent({routeOptions}));
    });

    this.getInstance().addHook('onRegister', async instance => {
      await this.trigger(Server.EVENT_ON_REGISTER, createEvent({instance}));
    });
  }

  /**
   * Get fastify instance
   * @returns {FastifyInstance}
   */
  public getInstance (): FastifyInstance {
    return this.fastify;
  }

  /**
   * Start listening server
   */
  public async listen ( options: ServerListenOptions ): Promise<void> {
    await this.getInstance().listen(options);
  }
}
