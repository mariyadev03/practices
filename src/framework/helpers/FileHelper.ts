/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

import { existsSync, lstatSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Types
import { PathLike } from 'node:fs';

/**
 * File system helper.
 */
export default class FileHelper {
  /**
   * Check that given file is accessible or not
   * @param path - Absolute directory or file to check access
   * @return True when accessible / false otherwise
   */
  public static async isAccessible ( path: PathLike ): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch ( e ) {
      return false;
    }
  }

  /**
   * Check that given file exists or not
   * @param path - Absolute directory or file
   * @return True when exist / false otherwise
   */
  public static exists ( path: PathLike ): boolean {
    return existsSync(path);
  }

  /**
   * Normalize a path, Fix path slashes issue (OS related)<br>
   * <i>Note: this function replaces backslashes (\) with forward slashes (/)</i>
   */
  public static normalize ( path: string ): string {
    return resolve(path)
      .replace(/\\/g, '/');
  }

  /**
   * Get normalized project's root path
   * @example
   * // Example with one argument
   * FileHelper.getRoot('framework/base');
   *
   * // Example with multiple arguments
   * FileHelper.getRoot('framework', 'base');
   * @param append Append one or more path (directory names)
   * @return A joined base path
   */
  public static getRoot ( ...append: Array<string> ): string {
    return FileHelper.normalize(resolve(join(__dirname, '../../', ...append)));
  }

  /**
   * Resolve to give relative path name by joining project's root path and creates an absolute file path
   * @param parts - The file or directory name (framework/base)
   * @return {string}
   */
  public static resolveRelative ( ...parts: Array<string> ): string {
    return FileHelper.getRoot(...parts);
  }

  /**
   * Check that given path exists and is a directory or not
   * @param path - Absolute path
   */
  public static isDirectory ( path: PathLike ): boolean {
    return lstatSync(path).isDirectory();
  }

  /**
   * Check that given path exists and is a file or not
   * @param path - Absolute path
   */
  public static isFile ( path: PathLike ): boolean {
    return lstatSync(path).isFile();
  }
}
