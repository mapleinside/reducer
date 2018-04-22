import { isPlainObject, isObjectLike, isUndefined, isString, isFunction } from 'lodash';

/**
 * Creates the cases every async actions handle by default
 *
 * @param type {String} The type of the base action.
 * @param typeSuccess {String} The type of the success action.
 * @param typeFailure {String} The type of the failure action.
 * @param states {Array} The states to be mutated by the action.
 * @returns {Object} The default cases an async action should cover.
 */
export function getDefaultAsyncCase(type, typeSuccess, typeFailure, states) {
  return {
    [type]: (state = {}) => ({
      ...state,
      [states[0]]: true,
      [states[1]]: false,
      [states[2]]: false,
    }),
    [typeSuccess]: (state = {}, payload = null) => ({
      ...state,
      [states[0]]: false,
      [states[1]]: true,
      [states[2]]: false,
      payload,
    }),
    [typeFailure]: (state = {}, error = null) => ({
      ...state,
      [states[0]]: false,
      [states[1]]: false,
      [states[2]]: true,
      error,
    }),
  };
}

/**
 * Creates an easy to use interface to reduce boilerplate and force conventions in the
 * reducer realm of an application
 *
 * Can be used in web applications but also on native platforms.
 *
 * @method Reducer
 * @param initialState {Object} The initial state of the reducer.
 * @param cases {Object} The cases the reducer should handle.
 * @constructor
 */
export default class {
  /**
   * Creates a synchronous action to be dispatched in Redux
   *
   * @method createAction
   * @param type {String} The type of the action.
   * @returns {function(Object): {type: String, payload: Object}}
   */
  static createAction(type) {
    if (!isString(type)) throw new Error('Type must be a string');

    return (payload = null) => ({
      type,
      payload,
    });
  }

  constructor(initialState = {}, cases = {}) {
    if (!isPlainObject(initialState)) {
      const message = `A reducer initial state MUST be an object. Received: ${initialState}`;

      throw new Error(message);
    }

    if (!isPlainObject(cases)) {
      throw new Error(`Reducer's cases MUST be an object. Received: ${cases}`);
    }

    this.initialState = initialState;
    this.cases = cases;
  }

  /**
   * Thunk that exports the reducer to be passed to Redux
   *
   * @method bindReducer
   * @returns {function(Object, Object)}
   */
  bindReducer() {
    return (state = this.initialState, action) => {
      if (!isPlainObject(state)) throw new Error('State must be a plain object');

      if (isUndefined(action)) {
        throw new Error('No action provided');
      } else if (!isPlainObject(action)) {
        throw new Error('Action must be a plain object');
      } else if (!action.type) {
        throw new Error('No action type provided');
      }

      Object.keys(this.cases).forEach((i) => {
        if (action.type === i) return this.cases[i](state, action);

        return null;
      });

      return state;
    };
  }

  /**
   * Creates an asynchronous action to be dispatched in Redux
   *
   * @method createAsyncAction
   * @param type {String} The type of the base action.
   * @param promise {Function} The async action to perform.
   * @param states {Array} The states to be mutated.
   * @returns {function(Object): {types: Array, promise: Function, payload: Object}}
   */
  createAsyncAction(type, promise, states = null) {
    if (!isString(type)) throw new Error('Type must be a string');
    if (!isFunction(promise)) throw new Error('Promise must be a function');

    const typeSuccess = `${type}_SUCCESS`;
    const typeFailure = `${type}_FAILURE`;

    if (states) {
      this.cases = {
        ...getDefaultAsyncCase(type, typeSuccess, typeFailure, states),
        ...this.cases,
      };
    }

    return (payload = null) => ({
      types: [type, typeSuccess, typeFailure],
      promise: (client) => {
        // The client argument must either be a function or a class.
        // But we can't really check if the argument is of type `class`.
        // So we test if it is an "object-like".
        if (!isFunction(client) && !isObjectLike(client)) {
          const message = 'Client must either be a function or a class';

          throw new Error(message);
        }

        return promise(client, payload);
      },
      payload,
    });
  }
}
