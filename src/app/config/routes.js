// @flow

import type { UrlRouter } from 'framework/types/routes.flow';

/**
 * @public
 * @static
 * Url rules
 * @example
 * {
 *   // Syntax: '[VERB] <route>': <controller>/<action>
 *   '/': 'site/index', // Plain route
 *   'GET /user/:id': 'user/get', // Route with dynamic params
 *   'POST /user/create': 'user/create', // Route with post verbs
 *   'PUT,PATCH /user/update/:id': 'user/update', // Route with multiple verb
 *   '/user/delete/:id': {route: 'user/update', options: {...}}, // Route with advanced options
 * }
 */
export default function rules (): UrlRouter {
  return {
    '/': 'site/index',
    '/test': {route: 'test/controller', options: {logLevel: 'info'}},
    'PUT,PATCH /user/update/:id': {route: 'site/index'},
  };
}
