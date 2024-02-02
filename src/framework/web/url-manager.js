import { is as R_is } from 'ramda';

// Types
import type { RuleConfig, UrlRouter } from 'framework/types/routes.flow';
import type { IApplicationConfiguration } from 'framework/base/configuration';
import type { RouteOptions } from 'fastify';

// Utils
import { stringToArray, hasDuplicates, contains } from 'framework/helpers/array-utils';
import { resolveRelativePath, checkPathAccess } from 'framework/helpers/path-utils';

type ParsedRouteRule = {
  route: string;
  methods: Array<string> | string;
  path?: string;
  options?: RouteOptions;
}

const PATTERN_PATH = /^([a-z]([a-z0-9]|-[a-z0-9])*)(\/[a-z]([a-z0-9]|-[a-z0-9])*)+$/;
const PATTERN_ROUTE = /^((?<method>[A-Z]{3,}(\s*,\s*[A-Z]{3,5})*)*\s+)*(?<route>(\/([a-z][-a-z0-9]*)+)+(\/:[a-z][a-z0-9_]*)*|\/|(\/:[a-z][a-z0-9_]*))$/;
const SUPPORTED_VERBS: Array<string> = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS'];

/**
 * @private
 * @static
 * @internal
 */
const parsePathString = path => {
  if ( !path || !path.trim() ) {
    throw new Error('Rule params cannot be empty');
  }

  if ( !PATTERN_PATH.test(path) ) {
    throw new Error(`Invalid route path: '${path}'`);
  }

  return {
    path,
  };
};

/**
 * @private
 * @static
 * @internal
 */
const parseRoutePath = ( path: RuleConfig ): ParsedRouteRule => {
  if ( typeof path === 'string' ) {
    return parsePathString(path);
  }

  if ( path?.options && !R_is(Object, path?.options) ) {
    throw new Error('Route options must be an object');
  }

  return {
    ...parsePathString(path?.route),
    options: path?.options ?? {},
  };
};

/**
 * @private
 * @static
 * @internal
 */
const parseRule = ( rule: string ): ParsedRouteRule => {
  if ( !PATTERN_ROUTE.test(rule) ) {
    throw new Error(`Invalid route params: '${rule}'`);
  }

  const {route, method = null} = {...rule.match(PATTERN_ROUTE).groups};

  const methods: Array<string> = !method ? ['GET'] : method.replace(/[^A-Z,]+/g, '').split(',');

  if ( hasDuplicates(methods) ) {
    throw new Error(`Rule contains duplicate HTTP verbs: '${rule}'`);
  }

  if ( contains(SUPPORTED_VERBS, methods) ) {
    throw new Error(`Rule contains invalid HTTP verb: '${rule}'`);
  }

  return {
    route,
    methods,
  };
};

/**
 * @private
 * @static
 * @internal
 */
async function createRouteFromRule ( rule: string, config: RuleConfig ): Promise<ParsedRouteRule> {
  if ( !(R_is(String, config) || R_is(Object, config)) ) {
    throw new Error('Rule options type must be a String or Object');
  }

  if ( !rule.trim() ) {
    throw new Error('Rule params cannot be empty');
  }

  return {
    options: {},
    ...parseRule(rule),
    ...parseRoutePath(config),
  };
}

/**
 * @private
 * @static
 * @internal
 */
async function parseRoutes ( rules: UrlRouter ): Promise<Array<[string, Object]>> {
  const registry: Array<RouteOptions> = [];
  const rulesList: Array<string> = [];

  for await  ( const [rule, config] of Object.entries(rules) ) {
    const parsed = await createRouteFromRule(rule, config);

    if ( rulesList.includes(parsed.route) ) {
      throw new Error(`An identical rule '${parsed.route}' is already added`);
    }

    rulesList.push(parsed.route);
    registry.push(parsed);
  }

  return registry;
}

/**
 * @private
 * @static
 * @internal
 * Load routes files and parse rules
 */
async function loadRoutesFile ( files: Array<string> ): Promise<UrlRouter> {
  const registry = [];

  for await ( const file of files ) {
    const filePath: string = resolveRelativePath(file);

    if ( !(await checkPathAccess(filePath)) ) {
      throw new Error(`Routes file '${filePath.toString()}' is not accessible`);
    }

    const routes: UrlRouter = (await import(filePath)).default.call(null);

    if ( Reflect.ownKeys(routes).length ) {
      const parsedRules = await parseRoutes(routes);
      registry.push(...parsedRules);
    }
  }

  return registry;
}

export async function processRoutes ( config: IApplicationConfiguration ) {
  const files: Array<string> = stringToArray(config.getConfig('routeFile', 'app/config/routes.js'));
  return loadRoutesFile(files);
}
