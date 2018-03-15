import {expect} from 'chai';
import {spy} from 'sinon';

import Reducer, {getDefaultAsyncCase} from 'packages/helpers/redux/reducer';

describe('Reducer module', () => {
  describe('Reducer()', () => {
    it('Should create an instance of Reducer.', () => {
      const reducer = new Reducer();
      expect(reducer).to.be.an.instanceof(Reducer);
    });

    it('Should set default `initialState` and `cases` when none are passed to the constructor.', () => {
      const reducer = new Reducer();
      expect(reducer.initialState).to.be.an('object');
      expect(reducer.cases).to.be.an('object');
    });

    it('Should set `initialState` and `cases` when passed to the constructor.', () => {
      const initialState = {loaded: false};
      const cases = {
        someCase: () => {}
      };
      const reducer = new Reducer(initialState, cases);
      expect(reducer.initialState).to.deep.equal(initialState);
      expect(reducer.cases).to.deep.equal(cases);
    });

    it('Should throw an error when either `initialState` or `cases` or both are not objects.', () => {
      const initialState = 'not an object';
      const cases = 'neither';

      function testInitialStateFail() {
        return new Reducer(initialState);
      }

      function testCasesFail() {
        return new Reducer({}, cases);
      }

      function testConstructorFail() {
        return new Reducer(initialState, cases);
      }

      expect(testInitialStateFail).to.throw(Error);
      expect(testCasesFail).to.throw(Error);
      expect(testConstructorFail).to.throw(Error);
    });
  });

  describe('bindReducer()', () => {
    it('Should return a function.', () => {
      const reducer = new Reducer();
      expect(reducer.bindReducer()).to.be.a('function');
    });

    it('Should throw an error when either `state` or `action` or both are not objects.', () => {
      const reducer = new Reducer();
      const testFail = reducer.bindReducer();

      function testStateFail() {
        return testFail(null, {});
      }

      function testActionFail() {
        return testFail({}, null);
      }

      expect(testFail).to.throw(Error);
      expect(testStateFail).to.throw(Error);
      expect(testActionFail).to.throw(Error);
    });

    it('Should throw an error when no action type was provided.', () => {
      const reducer = new Reducer();
      const testFail = reducer.bindReducer();

      function testActionTypeFail() {
        return testFail({}, {payload: {}});
      }

      expect(testActionTypeFail).to.throw(Error);
    });

    it('Should run the cases against the action received.', () => {
      const cases = {
        testAction: spy()
      };
      const reducer = new Reducer({}, cases);
      const testReducer = reducer.bindReducer();
      testReducer({}, {type: 'testAction'});
      expect(cases.testAction.calledOnce).to.equal(true);
    });

    it('Should pass the current state and the current action to the case.', () => {
      const action = {type: 'testAction'};
      const initialState = {loaded: false};
      const cases = {
        testAction: spy()
      };
      const reducer = new Reducer({}, cases);
      const testReducer = reducer.bindReducer();
      testReducer(initialState, action);
      expect(cases.testAction.args[0][0]).to.deep.equal(initialState);
      expect(cases.testAction.args[0][1]).to.deep.equal(action);
    });
  });

  describe('createAction()', () => {
    it('Should throw an error when `type` is not a string.', () => {
      const reducer = new Reducer();

      function testEmptyTypeFail() {
        return reducer.createAction();
      }

      function testObjectTypeFail() {
        return reducer.createAction({});
      }

      expect(testEmptyTypeFail).to.throw(Error);
      expect(testObjectTypeFail).to.throw(Error);
    });

    it('Should return a function.', () => {
      const reducer = new Reducer();
      expect(reducer.createAction('actionType')).to.be.a('function');
    });

    it('Should return a function which returns an object containing the passed `type` and `payload`.', () => {
      const reducer = new Reducer();
      const actionType = 'actionType';
      const action = reducer.createAction(actionType);
      expect(action()).to.be.an('object');
      expect(action()).to.deep.equal({payload: null, type: actionType});
      expect(action({yolo: true})).to.deep.equal({payload: {yolo: true}, type: actionType});
    });
  });

  describe('getDefaultAsyncCase()', () => {
    const type = 'anAction';
    const typeSuccess = 'aSuccess';
    const typeFailure = 'aFailure';
    const states = ['loading', 'loaded', 'loadFailed'];
    const asyncCases = getDefaultAsyncCase(type, typeSuccess, typeFailure, states);

    it('Should return an object.', () => {
      expect(asyncCases).to.be.an('object');
    });

    it('Should return 3 cases corresponding to the passed types.', () => {
      expect(asyncCases).to.have.all.keys(['anAction', 'aSuccess', 'aFailure']);
    });

    it('Should return 3 keys which values should be functions.', () => {
      expect(asyncCases.anAction).to.be.a('function');
      expect(asyncCases.aSuccess).to.be.a('function');
      expect(asyncCases.aFailure).to.be.a('function');
    });

    it('Should return 3 keys which values should return an object containing a passed `state`.', () => {
      const state = {someState: true};
      expect(asyncCases.anAction(state)).to.contain.key('someState');
      expect(asyncCases.aSuccess(state)).to.contain.key('someState');
      expect(asyncCases.aFailure(state)).to.contain.key('someState');
    });

    it('Should return 3 keys which values should return an object containing a key for each passed `states`.', () => {
      expect(asyncCases.anAction()).to.contain.keys(['loading', 'loaded', 'loadFailed']);
      expect(asyncCases.aSuccess()).to.contain.keys(['loading', 'loaded', 'loadFailed']);
      expect(asyncCases.aFailure()).to.contain.keys(['loading', 'loaded', 'loadFailed']);
    });

    it('Should return a success case containing the passed payload. Should defaults to null', () => {
      const state = {someState: true};
      const payload = {payload: 'somePayload'};
      expect(asyncCases.aSuccess()).to.contain.key('payload');
      expect(asyncCases.aSuccess().payload).to.equal(null);
      expect(asyncCases.aSuccess(state, payload).payload).to.deep.equal(payload);
    });

    it('Should return a failure case containing the passed error. Should defaults to null', () => {
      const state = {someState: true};
      const error = {error: 'someError'};
      expect(asyncCases.aFailure()).to.contain.key('error');
      expect(asyncCases.aFailure().error).to.equal(null);
      expect(asyncCases.aFailure(state, error).error).to.deep.equal(error);
    });
  });

  describe('createAsyncAction()', () => {
    it('Should throw an error when `type` is not a string.', () => {
      const reducer = new Reducer();

      function testEmptyTypeFail() {
        return reducer.createAsyncAction();
      }

      function testObjectTypeFail() {
        return reducer.createAsyncAction({});
      }

      expect(testEmptyTypeFail).to.throw(Error);
      expect(testObjectTypeFail).to.throw(Error);
    });

    it('Should throw an error when `promise` is not a function.', () => {
      const reducer = new Reducer();
      const actionType = 'actionType';

      function testEmptyPromiseFail() {
        return reducer.createAsyncAction(actionType);
      }

      function testStringPromiseFail() {
        return reducer.createAsyncAction(actionType, 'A function');
      }

      expect(testEmptyPromiseFail).to.throw(Error);
      expect(testStringPromiseFail).to.throw(Error);
    });

    it('Should return a function.', () => {
      const reducer = new Reducer();
      expect(reducer.createAsyncAction('actionType', () => {})).to.be.a('function');
    });

    it('Should add default cases to the reducer is `states` are provided to the function.', () => {
      const reducer = new Reducer();
      const actionType = 'actionType';
      const states = ['processing', 'processed', 'processFailed'];
      reducer.createAsyncAction(actionType, () => {}, states);
      expect(reducer.cases).to.contain.all.keys(
        getDefaultAsyncCase(actionType, `${actionType}_SUCCESS`, `${actionType}_FAILURE`, states)
      );
    });

    it('Should return a function which returns an object containing the `types` and passed `payload` and `promise`.', () => {
      const reducer = new Reducer();
      const actionType = 'actionType';
      const states = ['processing', 'processed', 'processFailed'];
      const asyncAction = reducer.createAsyncAction(actionType, () => {}, states);
      const payload = {some: 'thing'};

      expect(asyncAction()).to.be.an('object');
      expect(asyncAction(payload).types).to.eql([actionType, `${actionType}_SUCCESS`, `${actionType}_FAILURE`]);
      expect(asyncAction(payload).payload).to.eql(payload);

      const promise = spy();
      const testPromise = reducer.createAsyncAction(actionType, promise, states);
      testPromise(payload).promise(() => {});
      expect(promise.calledOnce).to.equal(true);
      expect(promise.args[0][1]).to.deep.equal(payload);
    });

    it('Should pass down the action `payload` to the action `promise` after passing a `client` argument received in the parent function.', () => {
      const reducer = new Reducer();
      const actionType = 'actionType';
      const payload = {some: 'thing'};
      const promise = spy();
      const client = spy();
      const testPromise = reducer.createAsyncAction(actionType, promise);

      testPromise(payload).promise(client);
      promise.args[0][0]();
      expect(client.calledOnce).to.equal(true);
      expect(promise.args[0][1]).to.deep.equal(payload);

      // Test the default argument for `payload`. Should be `null`.
      const nullPayloadPromise = spy();
      const testNullPayload = reducer.createAsyncAction(actionType, nullPayloadPromise);
      testNullPayload().promise(() => {});
      expect(nullPayloadPromise.args[0][1]).to.equal(null);
    });

    it('Should throw an error if the `client` argument passed to the promise at runtime is not a function nor a class.', () => {
      const reducer = new Reducer();
      const actionType = 'actionType';
      const payload = {some: 'thing'};
      const noClientPromise = spy();
      const testNoClient = reducer.createAsyncAction(actionType, noClientPromise);
      expect(testNoClient(payload).promise).to.throw(Error);
    });
  });
});
