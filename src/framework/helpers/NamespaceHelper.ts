/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

import Path from 'node:path';

// Utils
import FileHelper from 'framework/helpers/FileHelper';
import StringHelper from 'framework/helpers/StringHelper';

// Constants
/** Namespace validate regex pattern */
const NAMESPACE_REGEX = /^[a-z][a-z\-0-9]+(\/[a-z][a-z\-0-9]+)*(\/[A-Z][A-Za-z\-0-9]+)$/;

/**
 * Namespace helper.
 */
export default class NamespaceHelper {
  /**
   * Create an absolute module path by a given namespace
   * @example
   * // Example with one argument
   * NamespaceHelper.toNamespacePath('framework/helpers/StringHelper');
   * // Will produce a path like: .../framework/helpers/StringHelper.ts
   * @param namespace - The class namespace (framework/base/Helper)
   * @param extension='ts' - Extension and treat it as a class name
   * @return Absolute file path
   */
  public static toPath ( namespace: string, extension = 'ts' ): string {
    return FileHelper.resolveRelative(namespace)
      + '.' + extension.replace(/^\.+/g, '');
  }

  /**
   * Get an absolute basename of given namespace
   * @example
   * // Example with one argument
   * NamespaceHelper.toBasename('framework/helpers/StringHelper');
   * // Will produce a path like: .../framework/helpers
   * @param namespace
   * @param [extension='ts']
   * @return {string}
   */
  public static toBasename ( namespace: string, extension = 'ts' ): string {
    const filepath: string = NamespaceHelper.toPath(namespace, extension);
    return Path.basename(filepath, extension);
  }

  public static load ( namespace: string, extension = 'ts' ) {
    const filePath: string = NamespaceHelper.toPath(namespace, extension);

    try {
      const mod = require(filePath);
      return 'default' in mod ? mod.default : mod;
    } catch ( e ) {
      return null;
    }
  }

  /**
   * Check that given namespace actually exists
   * @example
   * // Example with one argument
   * NamespaceHelper.isNamespace('framework/helpers/StringHelper');
   * // Will return true | false
   * @param namespace - The class namespace (framework/base/Helper)
   * @return True when it's a namespace / false otherwise
   */
  public static isNamespace ( namespace: string ): boolean {
    if ( !NAMESPACE_REGEX.test(namespace) ) {
      return false;
    }

    const filename: string = NamespaceHelper.toPath(namespace);
    return FileHelper.exists(filename);
  }

  public static isSubclassOf ( source: string, target: string ): boolean {
    if ( !NamespaceHelper.isNamespace(source) || !NamespaceHelper.isNamespace(target) ) {
      return false;
    }

    const Source = NamespaceHelper.load(source);
    const Target = NamespaceHelper.load(target);

    return Source.prototype instanceof Target;
  }

  /**
   * Convert route into class name
   * @param route - The Route (e.g., user-profile))
   *
   * @example
   * console.log(StringHelper.routeToClassName('default-route'))
   * // Output: DefaultRoute
   */
  public static routeToClassName ( route: string ): string {
    return StringHelper.ucFirst(route).replace(/-([a-z0-9_])/gi, ( match: string, contents: string ) => {
      return StringHelper.ucFirst(contents);
    });
  }

  /**
   * Check that given object is a constructor or not
   * @param obj The callback to promisify
   * @return True when constructable / false otherwise
   */
  public static isConstructor ( obj: any ) {
    try {
      Reflect.construct(String, [], obj);
      return true;
    } catch ( e ) {
      return false;
    }
  }
}
