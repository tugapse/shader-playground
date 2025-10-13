export class ObjectInstanciator {
  /**
    A map that stores dependency injection functions for instantiating classes.
   * @private
    
   * @type {{ [key: string]: Function }}
   */
  private static dependecies: { [key: string]: Function } = {};

  /**
    Adds a class constructor or factory function as a dependency for instantiation.
    
   * @param {string} className - The name of the class.
   * @param {Function} func - The constructor or factory function to be called for instantiation.
   * @returns {void}
   */
  public static addDependency(className: string, func: Function): void {
    ObjectInstanciator.dependecies[className] = func;
  }

  /**
  Adds a class constructor or factory function as a dependency for instantiation.
  
 * @param {string} className - The name of the class.
 * @param {Function} func - The constructor or factory function to be called for instantiation.
 * @returns {void}
 */
  public static getDependency(className: string): Function {
    return ObjectInstanciator.dependecies[className];
  }

  /**
    Instantiates an object from a registered class name.
    
   * @param {string} className - The name of the class to instantiate.
   * @param {any[]} [args] - Optional arguments to pass to the constructor/factory function.
   * @returns {any} - A new instance of the specified class, or null if the class is not found.
   */
  public static instanciateObjectFromJsonData<T>(className: string, args?: any[]): T | undefined {
    if (this.dependecies[className]) {
      if (args && args.length > 0) {
        return this.dependecies[className](...args) as T;
      } else {
        return this.dependecies[className]() as T;
      }
    } else {
      console.warn("[warn] Class Object not found! Implement Class instancing for: ", className);
    }
    return undefined;
  }

}