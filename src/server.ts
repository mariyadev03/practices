/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-02
 */

// Env
import dotEnv from 'dotenv';
import { FastifyRequest } from 'fastify';

import Application from 'framework/web/Application';

// Config
import config from 'app/config/main';
import Server from 'framework/fastify/Server';

declare var App;

dotEnv.config();

(async () => {
  const configuration = await config();
  await (new Application(configuration)).run();
  console.log('Require', require.main?.filename);
  App.getServer().on(Server.EVENT_ON_REQUEST, async event => {
    const request: FastifyRequest = event.data.request;
    console.log('Request:', request.hostname);
  });
})();

/*
console.log(new Event({test: 'case'}));

Event.on('insert', async event => {
  console.log('TRIGGERED', event.data);
}, {type: 'Test'});

console.log('hasHandlers', Event.hasHandlers('insert'));

(async () => {
  await Event.trigger('insert');
  console.log('Event', Event);
})();
*/


/*const module = new Module({
  'programming': 'PHP',
});*/
//console.log('App.controllerMap:', App.app.createControllerByID('profile'));
//console.log('module.className:', module.createControllerByID('app/controllers/site'));

//console.log(module.createControllerByID('user/profile'));

(async () => {
  /*const container = new Component({
    'programming': 'PHP',
  });

  console.log('Prop:', container.get('programming'));

  container.set('programming', 'JavaScript')
  try {
    container.set('namespace', '');
  } catch (e) {
    throw e;
  }
  console.log('Prop:', container.get('namespace'));
*/
  //container.set('helper', {namespace: 'framework/helpers/CallbackHelper'});

  //console.log('newInstance', container.get<Component>('helper'));
})();


