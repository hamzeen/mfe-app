var zone = {};

var hasRequiredZone;

function requireZone () {
	if (hasRequiredZone) return zone;
	hasRequiredZone = 1;

	/**
	 * @license Angular v<unknown>
	 * (c) 2010-2025 Google LLC. https://angular.io/
	 * License: MIT
	 */
	const global = globalThis;
	// __Zone_symbol_prefix global can be used to override the default zone
	// symbol prefix with a custom one if needed.
	function __symbol__(name) {
	  const symbolPrefix = global['__Zone_symbol_prefix'] || '__zone_symbol__';
	  return symbolPrefix + name;
	}
	function initZone() {
	  const performance = global['performance'];
	  function mark(name) {
	    performance && performance['mark'] && performance['mark'](name);
	  }
	  function performanceMeasure(name, label) {
	    performance && performance['measure'] && performance['measure'](name, label);
	  }
	  mark('Zone');
	  let ZoneImpl = /*#__PURE__*/(() => {
	    class ZoneImpl {
	      static __symbol__ = __symbol__;
	      static assertZonePatched() {
	        if (global['Promise'] !== patches['ZoneAwarePromise']) {
	          throw new Error('Zone.js has detected that ZoneAwarePromise `(window|global).Promise` ' + 'has been overwritten.\n' + 'Most likely cause is that a Promise polyfill has been loaded ' + 'after Zone.js (Polyfilling Promise api is not necessary when zone.js is loaded. ' + 'If you must load one, do so before loading zone.js.)');
	        }
	      }
	      static get root() {
	        let zone = ZoneImpl.current;
	        while (zone.parent) {
	          zone = zone.parent;
	        }
	        return zone;
	      }
	      static get current() {
	        return _currentZoneFrame.zone;
	      }
	      static get currentTask() {
	        return _currentTask;
	      }
	      static __load_patch(name, fn, ignoreDuplicate = false) {
	        if (patches.hasOwnProperty(name)) {
	          // `checkDuplicate` option is defined from global variable
	          // so it works for all modules.
	          // `ignoreDuplicate` can work for the specified module
	          const checkDuplicate = global[__symbol__('forceDuplicateZoneCheck')] === true;
	          if (!ignoreDuplicate && checkDuplicate) {
	            throw Error('Already loaded patch: ' + name);
	          }
	        } else if (!global['__Zone_disable_' + name]) {
	          const perfName = 'Zone:' + name;
	          mark(perfName);
	          patches[name] = fn(global, ZoneImpl, _api);
	          performanceMeasure(perfName, perfName);
	        }
	      }
	      get parent() {
	        return this._parent;
	      }
	      get name() {
	        return this._name;
	      }
	      _parent;
	      _name;
	      _properties;
	      _zoneDelegate;
	      constructor(parent, zoneSpec) {
	        this._parent = parent;
	        this._name = zoneSpec ? zoneSpec.name || 'unnamed' : '<root>';
	        this._properties = zoneSpec && zoneSpec.properties || {};
	        this._zoneDelegate = new _ZoneDelegate(this, this._parent && this._parent._zoneDelegate, zoneSpec);
	      }
	      get(key) {
	        const zone = this.getZoneWith(key);
	        if (zone) return zone._properties[key];
	      }
	      getZoneWith(key) {
	        let current = this;
	        while (current) {
	          if (current._properties.hasOwnProperty(key)) {
	            return current;
	          }
	          current = current._parent;
	        }
	        return null;
	      }
	      fork(zoneSpec) {
	        if (!zoneSpec) throw new Error('ZoneSpec required!');
	        return this._zoneDelegate.fork(this, zoneSpec);
	      }
	      wrap(callback, source) {
	        if (typeof callback !== 'function') {
	          throw new Error('Expecting function got: ' + callback);
	        }
	        const _callback = this._zoneDelegate.intercept(this, callback, source);
	        const zone = this;
	        return function () {
	          return zone.runGuarded(_callback, this, arguments, source);
	        };
	      }
	      run(callback, applyThis, applyArgs, source) {
	        _currentZoneFrame = {
	          parent: _currentZoneFrame,
	          zone: this
	        };
	        try {
	          return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
	        } finally {
	          _currentZoneFrame = _currentZoneFrame.parent;
	        }
	      }
	      runGuarded(callback, applyThis = null, applyArgs, source) {
	        _currentZoneFrame = {
	          parent: _currentZoneFrame,
	          zone: this
	        };
	        try {
	          try {
	            return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
	          } catch (error) {
	            if (this._zoneDelegate.handleError(this, error)) {
	              throw error;
	            }
	          }
	        } finally {
	          _currentZoneFrame = _currentZoneFrame.parent;
	        }
	      }
	      runTask(task, applyThis, applyArgs) {
	        if (task.zone != this) {
	          throw new Error('A task can only be run in the zone of creation! (Creation: ' + (task.zone || NO_ZONE).name + '; Execution: ' + this.name + ')');
	        }
	        const zoneTask = task;
	        // https://github.com/angular/zone.js/issues/778, sometimes eventTask
	        // will run in notScheduled(canceled) state, we should not try to
	        // run such kind of task but just return
	        const {
	          type,
	          data: {
	            isPeriodic = false,
	            isRefreshable = false
	          } = {}
	        } = task;
	        if (task.state === notScheduled && (type === eventTask || type === macroTask)) {
	          return;
	        }
	        const reEntryGuard = task.state != running;
	        reEntryGuard && zoneTask._transitionTo(running, scheduled);
	        const previousTask = _currentTask;
	        _currentTask = zoneTask;
	        _currentZoneFrame = {
	          parent: _currentZoneFrame,
	          zone: this
	        };
	        try {
	          if (type == macroTask && task.data && !isPeriodic && !isRefreshable) {
	            task.cancelFn = undefined;
	          }
	          try {
	            return this._zoneDelegate.invokeTask(this, zoneTask, applyThis, applyArgs);
	          } catch (error) {
	            if (this._zoneDelegate.handleError(this, error)) {
	              throw error;
	            }
	          }
	        } finally {
	          // if the task's state is notScheduled or unknown, then it has already been cancelled
	          // we should not reset the state to scheduled
	          const state = task.state;
	          if (state !== notScheduled && state !== unknown) {
	            if (type == eventTask || isPeriodic || isRefreshable && state === scheduling) {
	              reEntryGuard && zoneTask._transitionTo(scheduled, running, scheduling);
	            } else {
	              const zoneDelegates = zoneTask._zoneDelegates;
	              this._updateTaskCount(zoneTask, -1);
	              reEntryGuard && zoneTask._transitionTo(notScheduled, running, notScheduled);
	              if (isRefreshable) {
	                zoneTask._zoneDelegates = zoneDelegates;
	              }
	            }
	          }
	          _currentZoneFrame = _currentZoneFrame.parent;
	          _currentTask = previousTask;
	        }
	      }
	      scheduleTask(task) {
	        if (task.zone && task.zone !== this) {
	          // check if the task was rescheduled, the newZone
	          // should not be the children of the original zone
	          let newZone = this;
	          while (newZone) {
	            if (newZone === task.zone) {
	              throw Error(`can not reschedule task to ${this.name} which is descendants of the original zone ${task.zone.name}`);
	            }
	            newZone = newZone.parent;
	          }
	        }
	        task._transitionTo(scheduling, notScheduled);
	        const zoneDelegates = [];
	        task._zoneDelegates = zoneDelegates;
	        task._zone = this;
	        try {
	          task = this._zoneDelegate.scheduleTask(this, task);
	        } catch (err) {
	          // should set task's state to unknown when scheduleTask throw error
	          // because the err may from reschedule, so the fromState maybe notScheduled
	          task._transitionTo(unknown, scheduling, notScheduled);
	          // TODO: @JiaLiPassion, should we check the result from handleError?
	          this._zoneDelegate.handleError(this, err);
	          throw err;
	        }
	        if (task._zoneDelegates === zoneDelegates) {
	          // we have to check because internally the delegate can reschedule the task.
	          this._updateTaskCount(task, 1);
	        }
	        if (task.state == scheduling) {
	          task._transitionTo(scheduled, scheduling);
	        }
	        return task;
	      }
	      scheduleMicroTask(source, callback, data, customSchedule) {
	        return this.scheduleTask(new ZoneTask(microTask, source, callback, data, customSchedule, undefined));
	      }
	      scheduleMacroTask(source, callback, data, customSchedule, customCancel) {
	        return this.scheduleTask(new ZoneTask(macroTask, source, callback, data, customSchedule, customCancel));
	      }
	      scheduleEventTask(source, callback, data, customSchedule, customCancel) {
	        return this.scheduleTask(new ZoneTask(eventTask, source, callback, data, customSchedule, customCancel));
	      }
	      cancelTask(task) {
	        if (task.zone != this) throw new Error('A task can only be cancelled in the zone of creation! (Creation: ' + (task.zone || NO_ZONE).name + '; Execution: ' + this.name + ')');
	        if (task.state !== scheduled && task.state !== running) {
	          return;
	        }
	        task._transitionTo(canceling, scheduled, running);
	        try {
	          this._zoneDelegate.cancelTask(this, task);
	        } catch (err) {
	          // if error occurs when cancelTask, transit the state to unknown
	          task._transitionTo(unknown, canceling);
	          this._zoneDelegate.handleError(this, err);
	          throw err;
	        }
	        this._updateTaskCount(task, -1);
	        task._transitionTo(notScheduled, canceling);
	        task.runCount = -1;
	        return task;
	      }
	      _updateTaskCount(task, count) {
	        const zoneDelegates = task._zoneDelegates;
	        if (count == -1) {
	          task._zoneDelegates = null;
	        }
	        for (let i = 0; i < zoneDelegates.length; i++) {
	          zoneDelegates[i]._updateTaskCount(task.type, count);
	        }
	      }
	    }
	    return ZoneImpl;
	  })();
	  const DELEGATE_ZS = {
	    name: '',
	    onHasTask: (delegate, _, target, hasTaskState) => delegate.hasTask(target, hasTaskState),
	    onScheduleTask: (delegate, _, target, task) => delegate.scheduleTask(target, task),
	    onInvokeTask: (delegate, _, target, task, applyThis, applyArgs) => delegate.invokeTask(target, task, applyThis, applyArgs),
	    onCancelTask: (delegate, _, target, task) => delegate.cancelTask(target, task)
	  };
	  class _ZoneDelegate {
	    get zone() {
	      return this._zone;
	    }
	    _zone;
	    _taskCounts = {
	      'microTask': 0,
	      'macroTask': 0,
	      'eventTask': 0
	    };
	    _parentDelegate;
	    _forkDlgt;
	    _forkZS;
	    _forkCurrZone;
	    _interceptDlgt;
	    _interceptZS;
	    _interceptCurrZone;
	    _invokeDlgt;
	    _invokeZS;
	    _invokeCurrZone;
	    _handleErrorDlgt;
	    _handleErrorZS;
	    _handleErrorCurrZone;
	    _scheduleTaskDlgt;
	    _scheduleTaskZS;
	    _scheduleTaskCurrZone;
	    _invokeTaskDlgt;
	    _invokeTaskZS;
	    _invokeTaskCurrZone;
	    _cancelTaskDlgt;
	    _cancelTaskZS;
	    _cancelTaskCurrZone;
	    _hasTaskDlgt;
	    _hasTaskDlgtOwner;
	    _hasTaskZS;
	    _hasTaskCurrZone;
	    constructor(zone, parentDelegate, zoneSpec) {
	      this._zone = zone;
	      this._parentDelegate = parentDelegate;
	      this._forkZS = zoneSpec && (zoneSpec && zoneSpec.onFork ? zoneSpec : parentDelegate._forkZS);
	      this._forkDlgt = zoneSpec && (zoneSpec.onFork ? parentDelegate : parentDelegate._forkDlgt);
	      this._forkCurrZone = zoneSpec && (zoneSpec.onFork ? this._zone : parentDelegate._forkCurrZone);
	      this._interceptZS = zoneSpec && (zoneSpec.onIntercept ? zoneSpec : parentDelegate._interceptZS);
	      this._interceptDlgt = zoneSpec && (zoneSpec.onIntercept ? parentDelegate : parentDelegate._interceptDlgt);
	      this._interceptCurrZone = zoneSpec && (zoneSpec.onIntercept ? this._zone : parentDelegate._interceptCurrZone);
	      this._invokeZS = zoneSpec && (zoneSpec.onInvoke ? zoneSpec : parentDelegate._invokeZS);
	      this._invokeDlgt = zoneSpec && (zoneSpec.onInvoke ? parentDelegate : parentDelegate._invokeDlgt);
	      this._invokeCurrZone = zoneSpec && (zoneSpec.onInvoke ? this._zone : parentDelegate._invokeCurrZone);
	      this._handleErrorZS = zoneSpec && (zoneSpec.onHandleError ? zoneSpec : parentDelegate._handleErrorZS);
	      this._handleErrorDlgt = zoneSpec && (zoneSpec.onHandleError ? parentDelegate : parentDelegate._handleErrorDlgt);
	      this._handleErrorCurrZone = zoneSpec && (zoneSpec.onHandleError ? this._zone : parentDelegate._handleErrorCurrZone);
	      this._scheduleTaskZS = zoneSpec && (zoneSpec.onScheduleTask ? zoneSpec : parentDelegate._scheduleTaskZS);
	      this._scheduleTaskDlgt = zoneSpec && (zoneSpec.onScheduleTask ? parentDelegate : parentDelegate._scheduleTaskDlgt);
	      this._scheduleTaskCurrZone = zoneSpec && (zoneSpec.onScheduleTask ? this._zone : parentDelegate._scheduleTaskCurrZone);
	      this._invokeTaskZS = zoneSpec && (zoneSpec.onInvokeTask ? zoneSpec : parentDelegate._invokeTaskZS);
	      this._invokeTaskDlgt = zoneSpec && (zoneSpec.onInvokeTask ? parentDelegate : parentDelegate._invokeTaskDlgt);
	      this._invokeTaskCurrZone = zoneSpec && (zoneSpec.onInvokeTask ? this._zone : parentDelegate._invokeTaskCurrZone);
	      this._cancelTaskZS = zoneSpec && (zoneSpec.onCancelTask ? zoneSpec : parentDelegate._cancelTaskZS);
	      this._cancelTaskDlgt = zoneSpec && (zoneSpec.onCancelTask ? parentDelegate : parentDelegate._cancelTaskDlgt);
	      this._cancelTaskCurrZone = zoneSpec && (zoneSpec.onCancelTask ? this._zone : parentDelegate._cancelTaskCurrZone);
	      this._hasTaskZS = null;
	      this._hasTaskDlgt = null;
	      this._hasTaskDlgtOwner = null;
	      this._hasTaskCurrZone = null;
	      const zoneSpecHasTask = zoneSpec && zoneSpec.onHasTask;
	      const parentHasTask = parentDelegate && parentDelegate._hasTaskZS;
	      if (zoneSpecHasTask || parentHasTask) {
	        // If we need to report hasTask, than this ZS needs to do ref counting on tasks. In such
	        // a case all task related interceptors must go through this ZD. We can't short circuit it.
	        this._hasTaskZS = zoneSpecHasTask ? zoneSpec : DELEGATE_ZS;
	        this._hasTaskDlgt = parentDelegate;
	        this._hasTaskDlgtOwner = this;
	        this._hasTaskCurrZone = this._zone;
	        if (!zoneSpec.onScheduleTask) {
	          this._scheduleTaskZS = DELEGATE_ZS;
	          this._scheduleTaskDlgt = parentDelegate;
	          this._scheduleTaskCurrZone = this._zone;
	        }
	        if (!zoneSpec.onInvokeTask) {
	          this._invokeTaskZS = DELEGATE_ZS;
	          this._invokeTaskDlgt = parentDelegate;
	          this._invokeTaskCurrZone = this._zone;
	        }
	        if (!zoneSpec.onCancelTask) {
	          this._cancelTaskZS = DELEGATE_ZS;
	          this._cancelTaskDlgt = parentDelegate;
	          this._cancelTaskCurrZone = this._zone;
	        }
	      }
	    }
	    fork(targetZone, zoneSpec) {
	      return this._forkZS ? this._forkZS.onFork(this._forkDlgt, this.zone, targetZone, zoneSpec) : new ZoneImpl(targetZone, zoneSpec);
	    }
	    intercept(targetZone, callback, source) {
	      return this._interceptZS ? this._interceptZS.onIntercept(this._interceptDlgt, this._interceptCurrZone, targetZone, callback, source) : callback;
	    }
	    invoke(targetZone, callback, applyThis, applyArgs, source) {
	      return this._invokeZS ? this._invokeZS.onInvoke(this._invokeDlgt, this._invokeCurrZone, targetZone, callback, applyThis, applyArgs, source) : callback.apply(applyThis, applyArgs);
	    }
	    handleError(targetZone, error) {
	      return this._handleErrorZS ? this._handleErrorZS.onHandleError(this._handleErrorDlgt, this._handleErrorCurrZone, targetZone, error) : true;
	    }
	    scheduleTask(targetZone, task) {
	      let returnTask = task;
	      if (this._scheduleTaskZS) {
	        if (this._hasTaskZS) {
	          returnTask._zoneDelegates.push(this._hasTaskDlgtOwner);
	        }
	        returnTask = this._scheduleTaskZS.onScheduleTask(this._scheduleTaskDlgt, this._scheduleTaskCurrZone, targetZone, task);
	        if (!returnTask) returnTask = task;
	      } else {
	        if (task.scheduleFn) {
	          task.scheduleFn(task);
	        } else if (task.type == microTask) {
	          scheduleMicroTask(task);
	        } else {
	          throw new Error('Task is missing scheduleFn.');
	        }
	      }
	      return returnTask;
	    }
	    invokeTask(targetZone, task, applyThis, applyArgs) {
	      return this._invokeTaskZS ? this._invokeTaskZS.onInvokeTask(this._invokeTaskDlgt, this._invokeTaskCurrZone, targetZone, task, applyThis, applyArgs) : task.callback.apply(applyThis, applyArgs);
	    }
	    cancelTask(targetZone, task) {
	      let value;
	      if (this._cancelTaskZS) {
	        value = this._cancelTaskZS.onCancelTask(this._cancelTaskDlgt, this._cancelTaskCurrZone, targetZone, task);
	      } else {
	        if (!task.cancelFn) {
	          throw Error('Task is not cancelable');
	        }
	        value = task.cancelFn(task);
	      }
	      return value;
	    }
	    hasTask(targetZone, isEmpty) {
	      // hasTask should not throw error so other ZoneDelegate
	      // can still trigger hasTask callback
	      try {
	        this._hasTaskZS && this._hasTaskZS.onHasTask(this._hasTaskDlgt, this._hasTaskCurrZone, targetZone, isEmpty);
	      } catch (err) {
	        this.handleError(targetZone, err);
	      }
	    }
	    _updateTaskCount(type, count) {
	      const counts = this._taskCounts;
	      const prev = counts[type];
	      const next = counts[type] = prev + count;
	      if (next < 0) {
	        throw new Error('More tasks executed then were scheduled.');
	      }
	      if (prev == 0 || next == 0) {
	        const isEmpty = {
	          microTask: counts['microTask'] > 0,
	          macroTask: counts['macroTask'] > 0,
	          eventTask: counts['eventTask'] > 0,
	          change: type
	        };
	        this.hasTask(this._zone, isEmpty);
	      }
	    }
	  }
	  class ZoneTask {
	    type;
	    source;
	    invoke;
	    callback;
	    data;
	    scheduleFn;
	    cancelFn;
	    _zone = null;
	    runCount = 0;
	    _zoneDelegates = null;
	    _state = 'notScheduled';
	    constructor(type, source, callback, options, scheduleFn, cancelFn) {
	      this.type = type;
	      this.source = source;
	      this.data = options;
	      this.scheduleFn = scheduleFn;
	      this.cancelFn = cancelFn;
	      if (!callback) {
	        throw new Error('callback is not defined');
	      }
	      this.callback = callback;
	      const self = this;
	      // TODO: @JiaLiPassion options should have interface
	      if (type === eventTask && options && options.useG) {
	        this.invoke = ZoneTask.invokeTask;
	      } else {
	        this.invoke = function () {
	          return ZoneTask.invokeTask.call(global, self, this, arguments);
	        };
	      }
	    }
	    static invokeTask(task, target, args) {
	      if (!task) {
	        task = this;
	      }
	      _numberOfNestedTaskFrames++;
	      try {
	        task.runCount++;
	        return task.zone.runTask(task, target, args);
	      } finally {
	        if (_numberOfNestedTaskFrames == 1) {
	          drainMicroTaskQueue();
	        }
	        _numberOfNestedTaskFrames--;
	      }
	    }
	    get zone() {
	      return this._zone;
	    }
	    get state() {
	      return this._state;
	    }
	    cancelScheduleRequest() {
	      this._transitionTo(notScheduled, scheduling);
	    }
	    _transitionTo(toState, fromState1, fromState2) {
	      if (this._state === fromState1 || this._state === fromState2) {
	        this._state = toState;
	        if (toState == notScheduled) {
	          this._zoneDelegates = null;
	        }
	      } else {
	        throw new Error(`${this.type} '${this.source}': can not transition to '${toState}', expecting state '${fromState1}'${fromState2 ? " or '" + fromState2 + "'" : ''}, was '${this._state}'.`);
	      }
	    }
	    toString() {
	      if (this.data && typeof this.data.handleId !== 'undefined') {
	        return this.data.handleId.toString();
	      } else {
	        return Object.prototype.toString.call(this);
	      }
	    }
	    // add toJSON method to prevent cyclic error when
	    // call JSON.stringify(zoneTask)
	    toJSON() {
	      return {
	        type: this.type,
	        state: this.state,
	        source: this.source,
	        zone: this.zone.name,
	        runCount: this.runCount
	      };
	    }
	  }
	  //////////////////////////////////////////////////////
	  //////////////////////////////////////////////////////
	  ///  MICROTASK QUEUE
	  //////////////////////////////////////////////////////
	  //////////////////////////////////////////////////////
	  const symbolSetTimeout = __symbol__('setTimeout');
	  const symbolPromise = __symbol__('Promise');
	  const symbolThen = __symbol__('then');
	  let _microTaskQueue = [];
	  let _isDrainingMicrotaskQueue = false;
	  let nativeMicroTaskQueuePromise;
	  function nativeScheduleMicroTask(func) {
	    if (!nativeMicroTaskQueuePromise) {
	      if (global[symbolPromise]) {
	        nativeMicroTaskQueuePromise = global[symbolPromise].resolve(0);
	      }
	    }
	    if (nativeMicroTaskQueuePromise) {
	      let nativeThen = nativeMicroTaskQueuePromise[symbolThen];
	      if (!nativeThen) {
	        // native Promise is not patchable, we need to use `then` directly
	        // issue 1078
	        nativeThen = nativeMicroTaskQueuePromise['then'];
	      }
	      nativeThen.call(nativeMicroTaskQueuePromise, func);
	    } else {
	      global[symbolSetTimeout](func, 0);
	    }
	  }
	  function scheduleMicroTask(task) {
	    // if we are not running in any task, and there has not been anything scheduled
	    // we must bootstrap the initial task creation by manually scheduling the drain
	    if (_numberOfNestedTaskFrames === 0 && _microTaskQueue.length === 0) {
	      // We are not running in Task, so we need to kickstart the microtask queue.
	      nativeScheduleMicroTask(drainMicroTaskQueue);
	    }
	    task && _microTaskQueue.push(task);
	  }
	  function drainMicroTaskQueue() {
	    if (!_isDrainingMicrotaskQueue) {
	      _isDrainingMicrotaskQueue = true;
	      while (_microTaskQueue.length) {
	        const queue = _microTaskQueue;
	        _microTaskQueue = [];
	        for (let i = 0; i < queue.length; i++) {
	          const task = queue[i];
	          try {
	            task.zone.runTask(task, null, null);
	          } catch (error) {
	            _api.onUnhandledError(error);
	          }
	        }
	      }
	      _api.microtaskDrainDone();
	      _isDrainingMicrotaskQueue = false;
	    }
	  }
	  //////////////////////////////////////////////////////
	  //////////////////////////////////////////////////////
	  ///  BOOTSTRAP
	  //////////////////////////////////////////////////////
	  //////////////////////////////////////////////////////
	  const NO_ZONE = {
	    name: 'NO ZONE'
	  };
	  const notScheduled = 'notScheduled',
	    scheduling = 'scheduling',
	    scheduled = 'scheduled',
	    running = 'running',
	    canceling = 'canceling',
	    unknown = 'unknown';
	  const microTask = 'microTask',
	    macroTask = 'macroTask',
	    eventTask = 'eventTask';
	  const patches = {};
	  const _api = {
	    symbol: __symbol__,
	    currentZoneFrame: () => _currentZoneFrame,
	    onUnhandledError: noop,
	    microtaskDrainDone: noop,
	    scheduleMicroTask: scheduleMicroTask,
	    showUncaughtError: () => !ZoneImpl[__symbol__('ignoreConsoleErrorUncaughtError')],
	    patchEventTarget: () => [],
	    patchOnProperties: noop,
	    patchMethod: () => noop,
	    bindArguments: () => [],
	    patchThen: () => noop,
	    patchMacroTask: () => noop,
	    patchEventPrototype: () => noop,
	    isIEOrEdge: () => false,
	    getGlobalObjects: () => undefined,
	    ObjectDefineProperty: () => noop,
	    ObjectGetOwnPropertyDescriptor: () => undefined,
	    ObjectCreate: () => undefined,
	    ArraySlice: () => [],
	    patchClass: () => noop,
	    wrapWithCurrentZone: () => noop,
	    filterProperties: () => [],
	    attachOriginToPatched: () => noop,
	    _redefineProperty: () => noop,
	    patchCallbacks: () => noop,
	    nativeScheduleMicroTask: nativeScheduleMicroTask
	  };
	  let _currentZoneFrame = {
	    parent: null,
	    zone: new ZoneImpl(null, null)
	  };
	  let _currentTask = null;
	  let _numberOfNestedTaskFrames = 0;
	  function noop() {}
	  performanceMeasure('Zone', 'Zone');
	  return ZoneImpl;
	}
	function loadZone() {
	  // if global['Zone'] already exists (maybe zone.js was already loaded or
	  // some other lib also registered a global object named Zone), we may need
	  // to throw an error, but sometimes user may not want this error.
	  // For example,
	  // we have two web pages, page1 includes zone.js, page2 doesn't.
	  // and the 1st time user load page1 and page2, everything work fine,
	  // but when user load page2 again, error occurs because global['Zone'] already exists.
	  // so we add a flag to let user choose whether to throw this error or not.
	  // By default, if existing Zone is from zone.js, we will not throw the error.
	  const global = globalThis;
	  const checkDuplicate = global[__symbol__('forceDuplicateZoneCheck')] === true;
	  if (global['Zone'] && (checkDuplicate || typeof global['Zone'].__symbol__ !== 'function')) {
	    throw new Error('Zone already loaded.');
	  }
	  // Initialize global `Zone` constant.
	  global['Zone'] ??= initZone();
	  return global['Zone'];
	}

	/**
	 * Suppress closure compiler errors about unknown 'Zone' variable
	 * @fileoverview
	 * @suppress {undefinedVars,globalThis,missingRequire}
	 */
	/// <reference types="node"/>
	// issue #989, to reduce bundle size, use short name
	/** Object.getOwnPropertyDescriptor */
	const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	/** Object.defineProperty */
	const ObjectDefineProperty = Object.defineProperty;
	/** Object.getPrototypeOf */
	const ObjectGetPrototypeOf = Object.getPrototypeOf;
	/** Object.create */
	const ObjectCreate = Object.create;
	/** Array.prototype.slice */
	const ArraySlice = Array.prototype.slice;
	/** addEventListener string const */
	const ADD_EVENT_LISTENER_STR = 'addEventListener';
	/** removeEventListener string const */
	const REMOVE_EVENT_LISTENER_STR = 'removeEventListener';
	/** zoneSymbol addEventListener */
	const ZONE_SYMBOL_ADD_EVENT_LISTENER = __symbol__(ADD_EVENT_LISTENER_STR);
	/** zoneSymbol removeEventListener */
	const ZONE_SYMBOL_REMOVE_EVENT_LISTENER = __symbol__(REMOVE_EVENT_LISTENER_STR);
	/** true string const */
	const TRUE_STR = 'true';
	/** false string const */
	const FALSE_STR = 'false';
	/** Zone symbol prefix string const. */
	const ZONE_SYMBOL_PREFIX = __symbol__('');
	function wrapWithCurrentZone(callback, source) {
	  return Zone.current.wrap(callback, source);
	}
	function scheduleMacroTaskWithCurrentZone(source, callback, data, customSchedule, customCancel) {
	  return Zone.current.scheduleMacroTask(source, callback, data, customSchedule, customCancel);
	}
	const zoneSymbol = __symbol__;
	const isWindowExists = typeof window !== 'undefined';
	const internalWindow = isWindowExists ? window : undefined;
	const _global = isWindowExists && internalWindow || globalThis;
	const REMOVE_ATTRIBUTE = 'removeAttribute';
	function bindArguments(args, source) {
	  for (let i = args.length - 1; i >= 0; i--) {
	    if (typeof args[i] === 'function') {
	      args[i] = wrapWithCurrentZone(args[i], source + '_' + i);
	    }
	  }
	  return args;
	}
	function patchPrototype(prototype, fnNames) {
	  const source = prototype.constructor['name'];
	  for (let i = 0; i < fnNames.length; i++) {
	    const name = fnNames[i];
	    const delegate = prototype[name];
	    if (delegate) {
	      const prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, name);
	      if (!isPropertyWritable(prototypeDesc)) {
	        continue;
	      }
	      prototype[name] = (delegate => {
	        const patched = function () {
	          return delegate.apply(this, bindArguments(arguments, source + '.' + name));
	        };
	        attachOriginToPatched(patched, delegate);
	        return patched;
	      })(delegate);
	    }
	  }
	}
	function isPropertyWritable(propertyDesc) {
	  if (!propertyDesc) {
	    return true;
	  }
	  if (propertyDesc.writable === false) {
	    return false;
	  }
	  return !(typeof propertyDesc.get === 'function' && typeof propertyDesc.set === 'undefined');
	}
	const isWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
	// Make sure to access `process` through `_global` so that WebPack does not accidentally browserify
	// this code.
	const isNode = !('nw' in _global) && typeof _global.process !== 'undefined' && _global.process.toString() === '[object process]';
	const isBrowser = !isNode && !isWebWorker && !!(isWindowExists && internalWindow['HTMLElement']);
	// we are in electron of nw, so we are both browser and nodejs
	// Make sure to access `process` through `_global` so that WebPack does not accidentally browserify
	// this code.
	const isMix = typeof _global.process !== 'undefined' && _global.process.toString() === '[object process]' && !isWebWorker && !!(isWindowExists && internalWindow['HTMLElement']);
	const zoneSymbolEventNames$1 = {};
	const enableBeforeunloadSymbol = zoneSymbol('enable_beforeunload');
	const wrapFn = function (event) {
	  // https://github.com/angular/zone.js/issues/911, in IE, sometimes
	  // event will be undefined, so we need to use window.event
	  event = event || _global.event;
	  if (!event) {
	    return;
	  }
	  let eventNameSymbol = zoneSymbolEventNames$1[event.type];
	  if (!eventNameSymbol) {
	    eventNameSymbol = zoneSymbolEventNames$1[event.type] = zoneSymbol('ON_PROPERTY' + event.type);
	  }
	  const target = this || event.target || _global;
	  const listener = target[eventNameSymbol];
	  let result;
	  if (isBrowser && target === internalWindow && event.type === 'error') {
	    // window.onerror have different signature
	    // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror#window.onerror
	    // and onerror callback will prevent default when callback return true
	    const errorEvent = event;
	    result = listener && listener.call(this, errorEvent.message, errorEvent.filename, errorEvent.lineno, errorEvent.colno, errorEvent.error);
	    if (result === true) {
	      event.preventDefault();
	    }
	  } else {
	    result = listener && listener.apply(this, arguments);
	    if (
	    // https://github.com/angular/angular/issues/47579
	    // https://www.w3.org/TR/2011/WD-html5-20110525/history.html#beforeunloadevent
	    // This is the only specific case we should check for. The spec defines that the
	    // `returnValue` attribute represents the message to show the user. When the event
	    // is created, this attribute must be set to the empty string.
	    event.type === 'beforeunload' &&
	    // To prevent any breaking changes resulting from this change, given that
	    // it was already causing a significant number of failures in G3, we have hidden
	    // that behavior behind a global configuration flag. Consumers can enable this
	    // flag explicitly if they want the `beforeunload` event to be handled as defined
	    // in the specification.
	    _global[enableBeforeunloadSymbol] &&
	    // The IDL event definition is `attribute DOMString returnValue`, so we check whether
	    // `typeof result` is a string.
	    typeof result === 'string') {
	      event.returnValue = result;
	    } else if (result != undefined && !result) {
	      event.preventDefault();
	    }
	  }
	  return result;
	};
	function patchProperty(obj, prop, prototype) {
	  let desc = ObjectGetOwnPropertyDescriptor(obj, prop);
	  if (!desc && prototype) {
	    // when patch window object, use prototype to check prop exist or not
	    const prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, prop);
	    if (prototypeDesc) {
	      desc = {
	        enumerable: true,
	        configurable: true
	      };
	    }
	  }
	  // if the descriptor not exists or is not configurable
	  // just return
	  if (!desc || !desc.configurable) {
	    return;
	  }
	  const onPropPatchedSymbol = zoneSymbol('on' + prop + 'patched');
	  if (obj.hasOwnProperty(onPropPatchedSymbol) && obj[onPropPatchedSymbol]) {
	    return;
	  }
	  // A property descriptor cannot have getter/setter and be writable
	  // deleting the writable and value properties avoids this error:
	  //
	  // TypeError: property descriptors must not specify a value or be writable when a
	  // getter or setter has been specified
	  delete desc.writable;
	  delete desc.value;
	  const originalDescGet = desc.get;
	  const originalDescSet = desc.set;
	  // slice(2) cuz 'onclick' -> 'click', etc
	  const eventName = prop.slice(2);
	  let eventNameSymbol = zoneSymbolEventNames$1[eventName];
	  if (!eventNameSymbol) {
	    eventNameSymbol = zoneSymbolEventNames$1[eventName] = zoneSymbol('ON_PROPERTY' + eventName);
	  }
	  desc.set = function (newValue) {
	    // In some versions of Windows, the `this` context may be undefined
	    // in on-property callbacks.
	    // To handle this edge case, we check if `this` is falsy and
	    // fallback to `_global` if needed.
	    let target = this;
	    if (!target && obj === _global) {
	      target = _global;
	    }
	    if (!target) {
	      return;
	    }
	    const previousValue = target[eventNameSymbol];
	    if (typeof previousValue === 'function') {
	      target.removeEventListener(eventName, wrapFn);
	    }
	    // https://github.com/angular/zone.js/issues/978
	    // If an inline handler (like `onload`) was defined before zone.js was loaded,
	    // call the original descriptor's setter to clean it up.
	    originalDescSet?.call(target, null);
	    target[eventNameSymbol] = newValue;
	    if (typeof newValue === 'function') {
	      target.addEventListener(eventName, wrapFn, false);
	    }
	  };
	  // The getter would return undefined for unassigned properties but the default value of an
	  // unassigned property is null
	  desc.get = function () {
	    // in some of windows's onproperty callback, this is undefined
	    // so we need to check it
	    let target = this;
	    if (!target && obj === _global) {
	      target = _global;
	    }
	    if (!target) {
	      return null;
	    }
	    const listener = target[eventNameSymbol];
	    if (listener) {
	      return listener;
	    } else if (originalDescGet) {
	      // result will be null when use inline event attribute,
	      // such as <button onclick="func();">OK</button>
	      // because the onclick function is internal raw uncompiled handler
	      // the onclick will be evaluated when first time event was triggered or
	      // the property is accessed, https://github.com/angular/zone.js/issues/525
	      // so we should use original native get to retrieve the handler
	      let value = originalDescGet.call(this);
	      if (value) {
	        desc.set.call(this, value);
	        if (typeof target[REMOVE_ATTRIBUTE] === 'function') {
	          target.removeAttribute(prop);
	        }
	        return value;
	      }
	    }
	    return null;
	  };
	  ObjectDefineProperty(obj, prop, desc);
	  obj[onPropPatchedSymbol] = true;
	}
	function patchOnProperties(obj, properties, prototype) {
	  if (properties) {
	    for (let i = 0; i < properties.length; i++) {
	      patchProperty(obj, 'on' + properties[i], prototype);
	    }
	  } else {
	    const onProperties = [];
	    for (const prop in obj) {
	      if (prop.slice(0, 2) == 'on') {
	        onProperties.push(prop);
	      }
	    }
	    for (let j = 0; j < onProperties.length; j++) {
	      patchProperty(obj, onProperties[j], prototype);
	    }
	  }
	}
	const originalInstanceKey = zoneSymbol('originalInstance');
	// wrap some native API on `window`
	function patchClass(className) {
	  const OriginalClass = _global[className];
	  if (!OriginalClass) return;
	  // keep original class in global
	  _global[zoneSymbol(className)] = OriginalClass;
	  _global[className] = function () {
	    const a = bindArguments(arguments, className);
	    switch (a.length) {
	      case 0:
	        this[originalInstanceKey] = new OriginalClass();
	        break;
	      case 1:
	        this[originalInstanceKey] = new OriginalClass(a[0]);
	        break;
	      case 2:
	        this[originalInstanceKey] = new OriginalClass(a[0], a[1]);
	        break;
	      case 3:
	        this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2]);
	        break;
	      case 4:
	        this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2], a[3]);
	        break;
	      default:
	        throw new Error('Arg list too long.');
	    }
	  };
	  // attach original delegate to patched function
	  attachOriginToPatched(_global[className], OriginalClass);
	  const instance = new OriginalClass(function () {});
	  let prop;
	  for (prop in instance) {
	    // https://bugs.webkit.org/show_bug.cgi?id=44721
	    if (className === 'XMLHttpRequest' && prop === 'responseBlob') continue;
	    (function (prop) {
	      if (typeof instance[prop] === 'function') {
	        _global[className].prototype[prop] = function () {
	          return this[originalInstanceKey][prop].apply(this[originalInstanceKey], arguments);
	        };
	      } else {
	        ObjectDefineProperty(_global[className].prototype, prop, {
	          set: function (fn) {
	            if (typeof fn === 'function') {
	              this[originalInstanceKey][prop] = wrapWithCurrentZone(fn, className + '.' + prop);
	              // keep callback in wrapped function so we can
	              // use it in Function.prototype.toString to return
	              // the native one.
	              attachOriginToPatched(this[originalInstanceKey][prop], fn);
	            } else {
	              this[originalInstanceKey][prop] = fn;
	            }
	          },
	          get: function () {
	            return this[originalInstanceKey][prop];
	          }
	        });
	      }
	    })(prop);
	  }
	  for (prop in OriginalClass) {
	    if (prop !== 'prototype' && OriginalClass.hasOwnProperty(prop)) {
	      _global[className][prop] = OriginalClass[prop];
	    }
	  }
	}
	function patchMethod(target, name, patchFn) {
	  let proto = target;
	  while (proto && !proto.hasOwnProperty(name)) {
	    proto = ObjectGetPrototypeOf(proto);
	  }
	  if (!proto && target[name]) {
	    // somehow we did not find it, but we can see it. This happens on IE for Window properties.
	    proto = target;
	  }
	  const delegateName = zoneSymbol(name);
	  let delegate = null;
	  if (proto && (!(delegate = proto[delegateName]) || !proto.hasOwnProperty(delegateName))) {
	    delegate = proto[delegateName] = proto[name];
	    // check whether proto[name] is writable
	    // some property is readonly in safari, such as HtmlCanvasElement.prototype.toBlob
	    const desc = proto && ObjectGetOwnPropertyDescriptor(proto, name);
	    if (isPropertyWritable(desc)) {
	      const patchDelegate = patchFn(delegate, delegateName, name);
	      proto[name] = function () {
	        return patchDelegate(this, arguments);
	      };
	      attachOriginToPatched(proto[name], delegate);
	    }
	  }
	  return delegate;
	}
	// TODO: @JiaLiPassion, support cancel task later if necessary
	function patchMacroTask(obj, funcName, metaCreator) {
	  let setNative = null;
	  function scheduleTask(task) {
	    const data = task.data;
	    data.args[data.cbIdx] = function () {
	      task.invoke.apply(this, arguments);
	    };
	    setNative.apply(data.target, data.args);
	    return task;
	  }
	  setNative = patchMethod(obj, funcName, delegate => function (self, args) {
	    const meta = metaCreator(self, args);
	    if (meta.cbIdx >= 0 && typeof args[meta.cbIdx] === 'function') {
	      return scheduleMacroTaskWithCurrentZone(meta.name, args[meta.cbIdx], meta, scheduleTask);
	    } else {
	      // cause an error by calling it directly.
	      return delegate.apply(self, args);
	    }
	  });
	}
	function attachOriginToPatched(patched, original) {
	  patched[zoneSymbol('OriginalDelegate')] = original;
	}
	let isDetectedIEOrEdge = false;
	let ieOrEdge = false;
	function isIEOrEdge() {
	  if (isDetectedIEOrEdge) {
	    return ieOrEdge;
	  }
	  isDetectedIEOrEdge = true;
	  try {
	    const ua = internalWindow.navigator.userAgent;
	    if (ua.indexOf('MSIE ') !== -1 || ua.indexOf('Trident/') !== -1 || ua.indexOf('Edge/') !== -1) {
	      ieOrEdge = true;
	    }
	  } catch (error) {}
	  return ieOrEdge;
	}
	function isFunction(value) {
	  return typeof value === 'function';
	}
	function isNumber(value) {
	  return typeof value === 'number';
	}

	/**
	 * @fileoverview
	 * @suppress {missingRequire}
	 */
	// an identifier to tell ZoneTask do not create a new invoke closure
	const OPTIMIZED_ZONE_EVENT_TASK_DATA = {
	  useG: true
	};
	const zoneSymbolEventNames = {};
	const globalSources = {};
	const EVENT_NAME_SYMBOL_REGX = new RegExp('^' + ZONE_SYMBOL_PREFIX + '(\\w+)(true|false)$');
	const IMMEDIATE_PROPAGATION_SYMBOL = zoneSymbol('propagationStopped');
	function prepareEventNames(eventName, eventNameToString) {
	  const falseEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + FALSE_STR;
	  const trueEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + TRUE_STR;
	  const symbol = ZONE_SYMBOL_PREFIX + falseEventName;
	  const symbolCapture = ZONE_SYMBOL_PREFIX + trueEventName;
	  zoneSymbolEventNames[eventName] = {};
	  zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
	  zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
	}
	function patchEventTarget(_global, api, apis, patchOptions) {
	  const ADD_EVENT_LISTENER = patchOptions && patchOptions.add || ADD_EVENT_LISTENER_STR;
	  const REMOVE_EVENT_LISTENER = patchOptions && patchOptions.rm || REMOVE_EVENT_LISTENER_STR;
	  const LISTENERS_EVENT_LISTENER = patchOptions && patchOptions.listeners || 'eventListeners';
	  const REMOVE_ALL_LISTENERS_EVENT_LISTENER = patchOptions && patchOptions.rmAll || 'removeAllListeners';
	  const zoneSymbolAddEventListener = zoneSymbol(ADD_EVENT_LISTENER);
	  const ADD_EVENT_LISTENER_SOURCE = '.' + ADD_EVENT_LISTENER + ':';
	  const PREPEND_EVENT_LISTENER = 'prependListener';
	  const PREPEND_EVENT_LISTENER_SOURCE = '.' + PREPEND_EVENT_LISTENER + ':';
	  const invokeTask = function (task, target, event) {
	    // for better performance, check isRemoved which is set
	    // by removeEventListener
	    if (task.isRemoved) {
	      return;
	    }
	    const delegate = task.callback;
	    if (typeof delegate === 'object' && delegate.handleEvent) {
	      // create the bind version of handleEvent when invoke
	      task.callback = event => delegate.handleEvent(event);
	      task.originalDelegate = delegate;
	    }
	    // invoke static task.invoke
	    // need to try/catch error here, otherwise, the error in one event listener
	    // will break the executions of the other event listeners. Also error will
	    // not remove the event listener when `once` options is true.
	    let error;
	    try {
	      task.invoke(task, target, [event]);
	    } catch (err) {
	      error = err;
	    }
	    const options = task.options;
	    if (options && typeof options === 'object' && options.once) {
	      // if options.once is true, after invoke once remove listener here
	      // only browser need to do this, nodejs eventEmitter will cal removeListener
	      // inside EventEmitter.once
	      const delegate = task.originalDelegate ? task.originalDelegate : task.callback;
	      target[REMOVE_EVENT_LISTENER].call(target, event.type, delegate, options);
	    }
	    return error;
	  };
	  function globalCallback(context, event, isCapture) {
	    // https://github.com/angular/zone.js/issues/911, in IE, sometimes
	    // event will be undefined, so we need to use window.event
	    event = event || _global.event;
	    if (!event) {
	      return;
	    }
	    // event.target is needed for Samsung TV and SourceBuffer
	    // || global is needed https://github.com/angular/zone.js/issues/190
	    const target = context || event.target || _global;
	    const tasks = target[zoneSymbolEventNames[event.type][isCapture ? TRUE_STR : FALSE_STR]];
	    if (tasks) {
	      const errors = [];
	      // invoke all tasks which attached to current target with given event.type and capture = false
	      // for performance concern, if task.length === 1, just invoke
	      if (tasks.length === 1) {
	        const err = invokeTask(tasks[0], target, event);
	        err && errors.push(err);
	      } else {
	        // https://github.com/angular/zone.js/issues/836
	        // copy the tasks array before invoke, to avoid
	        // the callback will remove itself or other listener
	        const copyTasks = tasks.slice();
	        for (let i = 0; i < copyTasks.length; i++) {
	          if (event && event[IMMEDIATE_PROPAGATION_SYMBOL] === true) {
	            break;
	          }
	          const err = invokeTask(copyTasks[i], target, event);
	          err && errors.push(err);
	        }
	      }
	      // Since there is only one error, we don't need to schedule microTask
	      // to throw the error.
	      if (errors.length === 1) {
	        throw errors[0];
	      } else {
	        for (let i = 0; i < errors.length; i++) {
	          const err = errors[i];
	          api.nativeScheduleMicroTask(() => {
	            throw err;
	          });
	        }
	      }
	    }
	  }
	  // global shared zoneAwareCallback to handle all event callback with capture = false
	  const globalZoneAwareCallback = function (event) {
	    return globalCallback(this, event, false);
	  };
	  // global shared zoneAwareCallback to handle all event callback with capture = true
	  const globalZoneAwareCaptureCallback = function (event) {
	    return globalCallback(this, event, true);
	  };
	  function patchEventTargetMethods(obj, patchOptions) {
	    if (!obj) {
	      return false;
	    }
	    let useGlobalCallback = true;
	    if (patchOptions && patchOptions.useG !== undefined) {
	      useGlobalCallback = patchOptions.useG;
	    }
	    const validateHandler = patchOptions && patchOptions.vh;
	    let checkDuplicate = true;
	    if (patchOptions && patchOptions.chkDup !== undefined) {
	      checkDuplicate = patchOptions.chkDup;
	    }
	    let returnTarget = false;
	    if (patchOptions && patchOptions.rt !== undefined) {
	      returnTarget = patchOptions.rt;
	    }
	    let proto = obj;
	    while (proto && !proto.hasOwnProperty(ADD_EVENT_LISTENER)) {
	      proto = ObjectGetPrototypeOf(proto);
	    }
	    if (!proto && obj[ADD_EVENT_LISTENER]) {
	      // somehow we did not find it, but we can see it. This happens on IE for Window properties.
	      proto = obj;
	    }
	    if (!proto) {
	      return false;
	    }
	    if (proto[zoneSymbolAddEventListener]) {
	      return false;
	    }
	    const eventNameToString = patchOptions && patchOptions.eventNameToString;
	    // We use a shared global `taskData` to pass data for `scheduleEventTask`,
	    // eliminating the need to create a new object solely for passing data.
	    // WARNING: This object has a static lifetime, meaning it is not created
	    // each time `addEventListener` is called. It is instantiated only once
	    // and captured by reference inside the `addEventListener` and
	    // `removeEventListener` functions. Do not add any new properties to this
	    // object, as doing so would necessitate maintaining the information
	    // between `addEventListener` calls.
	    const taskData = {};
	    const nativeAddEventListener = proto[zoneSymbolAddEventListener] = proto[ADD_EVENT_LISTENER];
	    const nativeRemoveEventListener = proto[zoneSymbol(REMOVE_EVENT_LISTENER)] = proto[REMOVE_EVENT_LISTENER];
	    const nativeListeners = proto[zoneSymbol(LISTENERS_EVENT_LISTENER)] = proto[LISTENERS_EVENT_LISTENER];
	    const nativeRemoveAllListeners = proto[zoneSymbol(REMOVE_ALL_LISTENERS_EVENT_LISTENER)] = proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER];
	    let nativePrependEventListener;
	    if (patchOptions && patchOptions.prepend) {
	      nativePrependEventListener = proto[zoneSymbol(patchOptions.prepend)] = proto[patchOptions.prepend];
	    }
	    /**
	     * This util function will build an option object with passive option
	     * to handle all possible input from the user.
	     */
	    function buildEventListenerOptions(options, passive) {
	      if (!passive) {
	        return options;
	      }
	      if (typeof options === 'boolean') {
	        return {
	          capture: options,
	          passive: true
	        };
	      }
	      if (!options) {
	        return {
	          passive: true
	        };
	      }
	      if (typeof options === 'object' && options.passive !== false) {
	        return {
	          ...options,
	          passive: true
	        };
	      }
	      return options;
	    }
	    const customScheduleGlobal = function (task) {
	      // if there is already a task for the eventName + capture,
	      // just return, because we use the shared globalZoneAwareCallback here.
	      if (taskData.isExisting) {
	        return;
	      }
	      return nativeAddEventListener.call(taskData.target, taskData.eventName, taskData.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, taskData.options);
	    };
	    /**
	     * In the context of events and listeners, this function will be
	     * called at the end by `cancelTask`, which, in turn, calls `task.cancelFn`.
	     * Cancelling a task is primarily used to remove event listeners from
	     * the task target.
	     */
	    const customCancelGlobal = function (task) {
	      // if task is not marked as isRemoved, this call is directly
	      // from Zone.prototype.cancelTask, we should remove the task
	      // from tasksList of target first
	      if (!task.isRemoved) {
	        const symbolEventNames = zoneSymbolEventNames[task.eventName];
	        let symbolEventName;
	        if (symbolEventNames) {
	          symbolEventName = symbolEventNames[task.capture ? TRUE_STR : FALSE_STR];
	        }
	        const existingTasks = symbolEventName && task.target[symbolEventName];
	        if (existingTasks) {
	          for (let i = 0; i < existingTasks.length; i++) {
	            const existingTask = existingTasks[i];
	            if (existingTask === task) {
	              existingTasks.splice(i, 1);
	              // set isRemoved to data for faster invokeTask check
	              task.isRemoved = true;
	              if (task.removeAbortListener) {
	                task.removeAbortListener();
	                task.removeAbortListener = null;
	              }
	              if (existingTasks.length === 0) {
	                // all tasks for the eventName + capture have gone,
	                // remove globalZoneAwareCallback and remove the task cache from target
	                task.allRemoved = true;
	                task.target[symbolEventName] = null;
	              }
	              break;
	            }
	          }
	        }
	      }
	      // if all tasks for the eventName + capture have gone,
	      // we will really remove the global event callback,
	      // if not, return
	      if (!task.allRemoved) {
	        return;
	      }
	      return nativeRemoveEventListener.call(task.target, task.eventName, task.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, task.options);
	    };
	    const customScheduleNonGlobal = function (task) {
	      return nativeAddEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
	    };
	    const customSchedulePrepend = function (task) {
	      return nativePrependEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
	    };
	    const customCancelNonGlobal = function (task) {
	      return nativeRemoveEventListener.call(task.target, task.eventName, task.invoke, task.options);
	    };
	    const customSchedule = useGlobalCallback ? customScheduleGlobal : customScheduleNonGlobal;
	    const customCancel = useGlobalCallback ? customCancelGlobal : customCancelNonGlobal;
	    const compareTaskCallbackVsDelegate = function (task, delegate) {
	      const typeOfDelegate = typeof delegate;
	      return typeOfDelegate === 'function' && task.callback === delegate || typeOfDelegate === 'object' && task.originalDelegate === delegate;
	    };
	    const compare = patchOptions?.diff || compareTaskCallbackVsDelegate;
	    const unpatchedEvents = Zone[zoneSymbol('UNPATCHED_EVENTS')];
	    const passiveEvents = _global[zoneSymbol('PASSIVE_EVENTS')];
	    function copyEventListenerOptions(options) {
	      if (typeof options === 'object' && options !== null) {
	        // We need to destructure the target `options` object since it may
	        // be frozen or sealed (possibly provided implicitly by a third-party
	        // library), or its properties may be readonly.
	        const newOptions = {
	          ...options
	        };
	        // The `signal` option was recently introduced, which caused regressions in
	        // third-party scenarios where `AbortController` was directly provided to
	        // `addEventListener` as options. For instance, in cases like
	        // `document.addEventListener('keydown', callback, abortControllerInstance)`,
	        // which is valid because `AbortController` includes a `signal` getter, spreading
	        // `{...options}` wouldn't copy the `signal`. Additionally, using `Object.create`
	        // isn't feasible since `AbortController` is a built-in object type, and attempting
	        // to create a new object directly with it as the prototype might result in
	        // unexpected behavior.
	        if (options.signal) {
	          newOptions.signal = options.signal;
	        }
	        return newOptions;
	      }
	      return options;
	    }
	    const makeAddListener = function (nativeListener, addSource, customScheduleFn, customCancelFn, returnTarget = false, prepend = false) {
	      return function () {
	        const target = this || _global;
	        let eventName = arguments[0];
	        if (patchOptions && patchOptions.transferEventName) {
	          eventName = patchOptions.transferEventName(eventName);
	        }
	        let delegate = arguments[1];
	        if (!delegate) {
	          return nativeListener.apply(this, arguments);
	        }
	        if (isNode && eventName === 'uncaughtException') {
	          // don't patch uncaughtException of nodejs to prevent endless loop
	          return nativeListener.apply(this, arguments);
	        }
	        // To improve `addEventListener` performance, we will create the callback
	        // for the task later when the task is invoked.
	        let isEventListenerObject = false;
	        if (typeof delegate !== 'function') {
	          // This checks whether the provided listener argument is an object with
	          // a `handleEvent` method (since we can call `addEventListener` with a
	          // function `event => ...` or with an object `{ handleEvent: event => ... }`).
	          if (!delegate.handleEvent) {
	            return nativeListener.apply(this, arguments);
	          }
	          isEventListenerObject = true;
	        }
	        if (validateHandler && !validateHandler(nativeListener, delegate, target, arguments)) {
	          return;
	        }
	        const passive = !!passiveEvents && passiveEvents.indexOf(eventName) !== -1;
	        const options = copyEventListenerOptions(buildEventListenerOptions(arguments[2], passive));
	        const signal = options?.signal;
	        if (signal?.aborted) {
	          // the signal is an aborted one, just return without attaching the event listener.
	          return;
	        }
	        if (unpatchedEvents) {
	          // check unpatched list
	          for (let i = 0; i < unpatchedEvents.length; i++) {
	            if (eventName === unpatchedEvents[i]) {
	              if (passive) {
	                return nativeListener.call(target, eventName, delegate, options);
	              } else {
	                return nativeListener.apply(this, arguments);
	              }
	            }
	          }
	        }
	        const capture = !options ? false : typeof options === 'boolean' ? true : options.capture;
	        const once = options && typeof options === 'object' ? options.once : false;
	        const zone = Zone.current;
	        let symbolEventNames = zoneSymbolEventNames[eventName];
	        if (!symbolEventNames) {
	          prepareEventNames(eventName, eventNameToString);
	          symbolEventNames = zoneSymbolEventNames[eventName];
	        }
	        const symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
	        let existingTasks = target[symbolEventName];
	        let isExisting = false;
	        if (existingTasks) {
	          // already have task registered
	          isExisting = true;
	          if (checkDuplicate) {
	            for (let i = 0; i < existingTasks.length; i++) {
	              if (compare(existingTasks[i], delegate)) {
	                // same callback, same capture, same event name, just return
	                return;
	              }
	            }
	          }
	        } else {
	          existingTasks = target[symbolEventName] = [];
	        }
	        let source;
	        const constructorName = target.constructor['name'];
	        const targetSource = globalSources[constructorName];
	        if (targetSource) {
	          source = targetSource[eventName];
	        }
	        if (!source) {
	          source = constructorName + addSource + (eventNameToString ? eventNameToString(eventName) : eventName);
	        }
	        // In the code below, `options` should no longer be reassigned; instead, it
	        // should only be mutated. This is because we pass that object to the native
	        // `addEventListener`.
	        // It's generally recommended to use the same object reference for options.
	        // This ensures consistency and avoids potential issues.
	        taskData.options = options;
	        if (once) {
	          // When using `addEventListener` with the `once` option, we don't pass
	          // the `once` option directly to the native `addEventListener` method.
	          // Instead, we keep the `once` setting and handle it ourselves.
	          taskData.options.once = false;
	        }
	        taskData.target = target;
	        taskData.capture = capture;
	        taskData.eventName = eventName;
	        taskData.isExisting = isExisting;
	        const data = useGlobalCallback ? OPTIMIZED_ZONE_EVENT_TASK_DATA : undefined;
	        // keep taskData into data to allow onScheduleEventTask to access the task information
	        if (data) {
	          data.taskData = taskData;
	        }
	        if (signal) {
	          // When using `addEventListener` with the `signal` option, we don't pass
	          // the `signal` option directly to the native `addEventListener` method.
	          // Instead, we keep the `signal` setting and handle it ourselves.
	          taskData.options.signal = undefined;
	        }
	        // The `scheduleEventTask` function will ultimately call `customScheduleGlobal`,
	        // which in turn calls the native `addEventListener`. This is why `taskData.options`
	        // is updated before scheduling the task, as `customScheduleGlobal` uses
	        // `taskData.options` to pass it to the native `addEventListener`.
	        const task = zone.scheduleEventTask(source, delegate, data, customScheduleFn, customCancelFn);
	        if (signal) {
	          // after task is scheduled, we need to store the signal back to task.options
	          taskData.options.signal = signal;
	          // Wrapping `task` in a weak reference would not prevent memory leaks. Weak references are
	          // primarily used for preventing strong references cycles. `onAbort` is always reachable
	          // as it's an event listener, so its closure retains a strong reference to the `task`.
	          const onAbort = () => task.zone.cancelTask(task);
	          nativeListener.call(signal, 'abort', onAbort, {
	            once: true
	          });
	          // We need to remove the `abort` listener when the event listener is going to be removed,
	          // as it creates a closure that captures `task`. This closure retains a reference to the
	          // `task` object even after it goes out of scope, preventing `task` from being garbage
	          // collected.
	          task.removeAbortListener = () => signal.removeEventListener('abort', onAbort);
	        }
	        // should clear taskData.target to avoid memory leak
	        // issue, https://github.com/angular/angular/issues/20442
	        taskData.target = null;
	        // need to clear up taskData because it is a global object
	        if (data) {
	          data.taskData = null;
	        }
	        // have to save those information to task in case
	        // application may call task.zone.cancelTask() directly
	        if (once) {
	          taskData.options.once = true;
	        }
	        if (typeof task.options !== 'boolean') {
	          // We should save the options on the task (if it's an object) because
	          // we'll be using `task.options` later when removing the event listener
	          // and passing it back to `removeEventListener`.
	          task.options = options;
	        }
	        task.target = target;
	        task.capture = capture;
	        task.eventName = eventName;
	        if (isEventListenerObject) {
	          // save original delegate for compare to check duplicate
	          task.originalDelegate = delegate;
	        }
	        if (!prepend) {
	          existingTasks.push(task);
	        } else {
	          existingTasks.unshift(task);
	        }
	        if (returnTarget) {
	          return target;
	        }
	      };
	    };
	    proto[ADD_EVENT_LISTENER] = makeAddListener(nativeAddEventListener, ADD_EVENT_LISTENER_SOURCE, customSchedule, customCancel, returnTarget);
	    if (nativePrependEventListener) {
	      proto[PREPEND_EVENT_LISTENER] = makeAddListener(nativePrependEventListener, PREPEND_EVENT_LISTENER_SOURCE, customSchedulePrepend, customCancel, returnTarget, true);
	    }
	    proto[REMOVE_EVENT_LISTENER] = function () {
	      const target = this || _global;
	      let eventName = arguments[0];
	      if (patchOptions && patchOptions.transferEventName) {
	        eventName = patchOptions.transferEventName(eventName);
	      }
	      const options = arguments[2];
	      const capture = !options ? false : typeof options === 'boolean' ? true : options.capture;
	      const delegate = arguments[1];
	      if (!delegate) {
	        return nativeRemoveEventListener.apply(this, arguments);
	      }
	      if (validateHandler && !validateHandler(nativeRemoveEventListener, delegate, target, arguments)) {
	        return;
	      }
	      const symbolEventNames = zoneSymbolEventNames[eventName];
	      let symbolEventName;
	      if (symbolEventNames) {
	        symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
	      }
	      const existingTasks = symbolEventName && target[symbolEventName];
	      // `existingTasks` may not exist if the `addEventListener` was called before
	      // it was patched by zone.js. Please refer to the attached issue for
	      // clarification, particularly after the `if` condition, before calling
	      // the native `removeEventListener`.
	      if (existingTasks) {
	        for (let i = 0; i < existingTasks.length; i++) {
	          const existingTask = existingTasks[i];
	          if (compare(existingTask, delegate)) {
	            existingTasks.splice(i, 1);
	            // set isRemoved to data for faster invokeTask check
	            existingTask.isRemoved = true;
	            if (existingTasks.length === 0) {
	              // all tasks for the eventName + capture have gone,
	              // remove globalZoneAwareCallback and remove the task cache from target
	              existingTask.allRemoved = true;
	              target[symbolEventName] = null;
	              // in the target, we have an event listener which is added by on_property
	              // such as target.onclick = function() {}, so we need to clear this internal
	              // property too if all delegates with capture=false were removed
	              // https:// github.com/angular/angular/issues/31643
	              // https://github.com/angular/angular/issues/54581
	              if (!capture && typeof eventName === 'string') {
	                const onPropertySymbol = ZONE_SYMBOL_PREFIX + 'ON_PROPERTY' + eventName;
	                target[onPropertySymbol] = null;
	              }
	            }
	            // In all other conditions, when `addEventListener` is called after being
	            // patched by zone.js, we would always find an event task on the `EventTarget`.
	            // This will trigger `cancelFn` on the `existingTask`, leading to `customCancelGlobal`,
	            // which ultimately removes an event listener and cleans up the abort listener
	            // (if an `AbortSignal` was provided when scheduling a task).
	            existingTask.zone.cancelTask(existingTask);
	            if (returnTarget) {
	              return target;
	            }
	            return;
	          }
	        }
	      }
	      // https://github.com/angular/zone.js/issues/930
	      // We may encounter a situation where the `addEventListener` was
	      // called on the event target before zone.js is loaded, resulting
	      // in no task being stored on the event target due to its invocation
	      // of the native implementation. In this scenario, we simply need to
	      // invoke the native `removeEventListener`.
	      return nativeRemoveEventListener.apply(this, arguments);
	    };
	    proto[LISTENERS_EVENT_LISTENER] = function () {
	      const target = this || _global;
	      let eventName = arguments[0];
	      if (patchOptions && patchOptions.transferEventName) {
	        eventName = patchOptions.transferEventName(eventName);
	      }
	      const listeners = [];
	      const tasks = findEventTasks(target, eventNameToString ? eventNameToString(eventName) : eventName);
	      for (let i = 0; i < tasks.length; i++) {
	        const task = tasks[i];
	        let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
	        listeners.push(delegate);
	      }
	      return listeners;
	    };
	    proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER] = function () {
	      const target = this || _global;
	      let eventName = arguments[0];
	      if (!eventName) {
	        const keys = Object.keys(target);
	        for (let i = 0; i < keys.length; i++) {
	          const prop = keys[i];
	          const match = EVENT_NAME_SYMBOL_REGX.exec(prop);
	          let evtName = match && match[1];
	          // in nodejs EventEmitter, removeListener event is
	          // used for monitoring the removeListener call,
	          // so just keep removeListener eventListener until
	          // all other eventListeners are removed
	          if (evtName && evtName !== 'removeListener') {
	            this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, evtName);
	          }
	        }
	        // remove removeListener listener finally
	        this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, 'removeListener');
	      } else {
	        if (patchOptions && patchOptions.transferEventName) {
	          eventName = patchOptions.transferEventName(eventName);
	        }
	        const symbolEventNames = zoneSymbolEventNames[eventName];
	        if (symbolEventNames) {
	          const symbolEventName = symbolEventNames[FALSE_STR];
	          const symbolCaptureEventName = symbolEventNames[TRUE_STR];
	          const tasks = target[symbolEventName];
	          const captureTasks = target[symbolCaptureEventName];
	          if (tasks) {
	            const removeTasks = tasks.slice();
	            for (let i = 0; i < removeTasks.length; i++) {
	              const task = removeTasks[i];
	              let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
	              this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
	            }
	          }
	          if (captureTasks) {
	            const removeTasks = captureTasks.slice();
	            for (let i = 0; i < removeTasks.length; i++) {
	              const task = removeTasks[i];
	              let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
	              this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
	            }
	          }
	        }
	      }
	      if (returnTarget) {
	        return this;
	      }
	    };
	    // for native toString patch
	    attachOriginToPatched(proto[ADD_EVENT_LISTENER], nativeAddEventListener);
	    attachOriginToPatched(proto[REMOVE_EVENT_LISTENER], nativeRemoveEventListener);
	    if (nativeRemoveAllListeners) {
	      attachOriginToPatched(proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER], nativeRemoveAllListeners);
	    }
	    if (nativeListeners) {
	      attachOriginToPatched(proto[LISTENERS_EVENT_LISTENER], nativeListeners);
	    }
	    return true;
	  }
	  let results = [];
	  for (let i = 0; i < apis.length; i++) {
	    results[i] = patchEventTargetMethods(apis[i], patchOptions);
	  }
	  return results;
	}
	function findEventTasks(target, eventName) {
	  if (!eventName) {
	    const foundTasks = [];
	    for (let prop in target) {
	      const match = EVENT_NAME_SYMBOL_REGX.exec(prop);
	      let evtName = match && match[1];
	      if (evtName && (!eventName || evtName === eventName)) {
	        const tasks = target[prop];
	        if (tasks) {
	          for (let i = 0; i < tasks.length; i++) {
	            foundTasks.push(tasks[i]);
	          }
	        }
	      }
	    }
	    return foundTasks;
	  }
	  let symbolEventName = zoneSymbolEventNames[eventName];
	  if (!symbolEventName) {
	    prepareEventNames(eventName);
	    symbolEventName = zoneSymbolEventNames[eventName];
	  }
	  const captureFalseTasks = target[symbolEventName[FALSE_STR]];
	  const captureTrueTasks = target[symbolEventName[TRUE_STR]];
	  if (!captureFalseTasks) {
	    return captureTrueTasks ? captureTrueTasks.slice() : [];
	  } else {
	    return captureTrueTasks ? captureFalseTasks.concat(captureTrueTasks) : captureFalseTasks.slice();
	  }
	}
	function patchEventPrototype(global, api) {
	  const Event = global['Event'];
	  if (Event && Event.prototype) {
	    api.patchMethod(Event.prototype, 'stopImmediatePropagation', delegate => function (self, args) {
	      self[IMMEDIATE_PROPAGATION_SYMBOL] = true;
	      // we need to call the native stopImmediatePropagation
	      // in case in some hybrid application, some part of
	      // application will be controlled by zone, some are not
	      delegate && delegate.apply(self, args);
	    });
	  }
	}

	/**
	 * @fileoverview
	 * @suppress {missingRequire}
	 */
	function patchQueueMicrotask(global, api) {
	  api.patchMethod(global, 'queueMicrotask', delegate => {
	    return function (self, args) {
	      Zone.current.scheduleMicroTask('queueMicrotask', args[0]);
	    };
	  });
	}

	/**
	 * @fileoverview
	 * @suppress {missingRequire}
	 */
	const taskSymbol = zoneSymbol('zoneTask');
	function patchTimer(window, setName, cancelName, nameSuffix) {
	  let setNative = null;
	  let clearNative = null;
	  setName += nameSuffix;
	  cancelName += nameSuffix;
	  const tasksByHandleId = {};
	  function scheduleTask(task) {
	    const data = task.data;
	    data.args[0] = function () {
	      return task.invoke.apply(this, arguments);
	    };
	    const handleOrId = setNative.apply(window, data.args);
	    // Whlist on Node.js when get can the ID by using `[Symbol.toPrimitive]()` we do
	    // to this so that we do not cause potentally leaks when using `setTimeout`
	    // since this can be periodic when using `.refresh`.
	    if (isNumber(handleOrId)) {
	      data.handleId = handleOrId;
	    } else {
	      data.handle = handleOrId;
	      // On Node.js a timeout and interval can be restarted over and over again by using the `.refresh` method.
	      data.isRefreshable = isFunction(handleOrId.refresh);
	    }
	    return task;
	  }
	  function clearTask(task) {
	    const {
	      handle,
	      handleId
	    } = task.data;
	    return clearNative.call(window, handle ?? handleId);
	  }
	  setNative = patchMethod(window, setName, delegate => function (self, args) {
	    if (isFunction(args[0])) {
	      const options = {
	        isRefreshable: false,
	        isPeriodic: nameSuffix === 'Interval',
	        delay: nameSuffix === 'Timeout' || nameSuffix === 'Interval' ? args[1] || 0 : undefined,
	        args: args
	      };
	      const callback = args[0];
	      args[0] = function timer() {
	        try {
	          return callback.apply(this, arguments);
	        } finally {
	          // issue-934, task will be cancelled
	          // even it is a periodic task such as
	          // setInterval
	          // https://github.com/angular/angular/issues/40387
	          // Cleanup tasksByHandleId should be handled before scheduleTask
	          // Since some zoneSpec may intercept and doesn't trigger
	          // scheduleFn(scheduleTask) provided here.
	          const {
	            handle,
	            handleId,
	            isPeriodic,
	            isRefreshable
	          } = options;
	          if (!isPeriodic && !isRefreshable) {
	            if (handleId) {
	              // in non-nodejs env, we remove timerId
	              // from local cache
	              delete tasksByHandleId[handleId];
	            } else if (handle) {
	              // Node returns complex objects as handleIds
	              // we remove task reference from timer object
	              handle[taskSymbol] = null;
	            }
	          }
	        }
	      };
	      const task = scheduleMacroTaskWithCurrentZone(setName, args[0], options, scheduleTask, clearTask);
	      if (!task) {
	        return task;
	      }
	      // Node.js must additionally support the ref and unref functions.
	      const {
	        handleId,
	        handle,
	        isRefreshable,
	        isPeriodic
	      } = task.data;
	      if (handleId) {
	        // for non nodejs env, we save handleId: task
	        // mapping in local cache for clearTimeout
	        tasksByHandleId[handleId] = task;
	      } else if (handle) {
	        // for nodejs env, we save task
	        // reference in timerId Object for clearTimeout
	        handle[taskSymbol] = task;
	        if (isRefreshable && !isPeriodic) {
	          const originalRefresh = handle.refresh;
	          handle.refresh = function () {
	            const {
	              zone,
	              state
	            } = task;
	            if (state === 'notScheduled') {
	              task._state = 'scheduled';
	              zone._updateTaskCount(task, 1);
	            } else if (state === 'running') {
	              task._state = 'scheduling';
	            }
	            return originalRefresh.call(this);
	          };
	        }
	      }
	      return handle ?? handleId ?? task;
	    } else {
	      // cause an error by calling it directly.
	      return delegate.apply(window, args);
	    }
	  });
	  clearNative = patchMethod(window, cancelName, delegate => function (self, args) {
	    const id = args[0];
	    let task;
	    if (isNumber(id)) {
	      // non nodejs env.
	      task = tasksByHandleId[id];
	      delete tasksByHandleId[id];
	    } else {
	      // nodejs env ?? other environments.
	      task = id?.[taskSymbol];
	      if (task) {
	        id[taskSymbol] = null;
	      } else {
	        task = id;
	      }
	    }
	    if (task?.type) {
	      if (task.cancelFn) {
	        // Do not cancel already canceled functions
	        task.zone.cancelTask(task);
	      }
	    } else {
	      // cause an error by calling it directly.
	      delegate.apply(window, args);
	    }
	  });
	}
	function patchCustomElements(_global, api) {
	  const {
	    isBrowser,
	    isMix
	  } = api.getGlobalObjects();
	  if (!isBrowser && !isMix || !_global['customElements'] || !('customElements' in _global)) {
	    return;
	  }
	  // https://html.spec.whatwg.org/multipage/custom-elements.html#concept-custom-element-definition-lifecycle-callbacks
	  const callbacks = ['connectedCallback', 'disconnectedCallback', 'adoptedCallback', 'attributeChangedCallback', 'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback', 'formStateRestoreCallback'];
	  api.patchCallbacks(api, _global.customElements, 'customElements', 'define', callbacks);
	}
	function eventTargetPatch(_global, api) {
	  if (Zone[api.symbol('patchEventTarget')]) {
	    // EventTarget is already patched.
	    return;
	  }
	  const {
	    eventNames,
	    zoneSymbolEventNames,
	    TRUE_STR,
	    FALSE_STR,
	    ZONE_SYMBOL_PREFIX
	  } = api.getGlobalObjects();
	  //  predefine all __zone_symbol__ + eventName + true/false string
	  for (let i = 0; i < eventNames.length; i++) {
	    const eventName = eventNames[i];
	    const falseEventName = eventName + FALSE_STR;
	    const trueEventName = eventName + TRUE_STR;
	    const symbol = ZONE_SYMBOL_PREFIX + falseEventName;
	    const symbolCapture = ZONE_SYMBOL_PREFIX + trueEventName;
	    zoneSymbolEventNames[eventName] = {};
	    zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
	    zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
	  }
	  const EVENT_TARGET = _global['EventTarget'];
	  if (!EVENT_TARGET || !EVENT_TARGET.prototype) {
	    return;
	  }
	  api.patchEventTarget(_global, api, [EVENT_TARGET && EVENT_TARGET.prototype]);
	  return true;
	}
	function patchEvent(global, api) {
	  api.patchEventPrototype(global, api);
	}

	/**
	 * @fileoverview
	 * @suppress {globalThis}
	 */
	function filterProperties(target, onProperties, ignoreProperties) {
	  if (!ignoreProperties || ignoreProperties.length === 0) {
	    return onProperties;
	  }
	  const tip = ignoreProperties.filter(ip => ip.target === target);
	  if (tip.length === 0) {
	    return onProperties;
	  }
	  const targetIgnoreProperties = tip[0].ignoreProperties;
	  return onProperties.filter(op => targetIgnoreProperties.indexOf(op) === -1);
	}
	function patchFilteredProperties(target, onProperties, ignoreProperties, prototype) {
	  // check whether target is available, sometimes target will be undefined
	  // because different browser or some 3rd party plugin.
	  if (!target) {
	    return;
	  }
	  const filteredProperties = filterProperties(target, onProperties, ignoreProperties);
	  patchOnProperties(target, filteredProperties, prototype);
	}
	/**
	 * Get all event name properties which the event name startsWith `on`
	 * from the target object itself, inherited properties are not considered.
	 */
	function getOnEventNames(target) {
	  return Object.getOwnPropertyNames(target).filter(name => name.startsWith('on') && name.length > 2).map(name => name.substring(2));
	}
	function propertyDescriptorPatch(api, _global) {
	  if (isNode && !isMix) {
	    return;
	  }
	  if (Zone[api.symbol('patchEvents')]) {
	    // events are already been patched by legacy patch.
	    return;
	  }
	  const ignoreProperties = _global['__Zone_ignore_on_properties'];
	  // for browsers that we can patch the descriptor:  Chrome & Firefox
	  let patchTargets = [];
	  if (isBrowser) {
	    const internalWindow = window;
	    patchTargets = patchTargets.concat(['Document', 'SVGElement', 'Element', 'HTMLElement', 'HTMLBodyElement', 'HTMLMediaElement', 'HTMLFrameSetElement', 'HTMLFrameElement', 'HTMLIFrameElement', 'HTMLMarqueeElement', 'Worker']);
	    const ignoreErrorProperties = [];
	    // In older browsers like IE or Edge, event handler properties (e.g., `onclick`)
	    // may not be defined directly on the `window` object but on its prototype (`WindowPrototype`).
	    // To ensure complete coverage, we use the prototype when checking
	    // for and patching these properties.
	    patchFilteredProperties(internalWindow, getOnEventNames(internalWindow), ignoreProperties ? ignoreProperties.concat(ignoreErrorProperties) : ignoreProperties, ObjectGetPrototypeOf(internalWindow));
	  }
	  patchTargets = patchTargets.concat(['XMLHttpRequest', 'XMLHttpRequestEventTarget', 'IDBIndex', 'IDBRequest', 'IDBOpenDBRequest', 'IDBDatabase', 'IDBTransaction', 'IDBCursor', 'WebSocket']);
	  for (let i = 0; i < patchTargets.length; i++) {
	    const target = _global[patchTargets[i]];
	    target?.prototype && patchFilteredProperties(target.prototype, getOnEventNames(target.prototype), ignoreProperties);
	  }
	}

	/**
	 * @fileoverview
	 * @suppress {missingRequire}
	 */
	function patchBrowser(Zone) {
	  Zone.__load_patch('legacy', global => {
	    const legacyPatch = global[Zone.__symbol__('legacyPatch')];
	    if (legacyPatch) {
	      legacyPatch();
	    }
	  });
	  Zone.__load_patch('timers', global => {
	    const set = 'set';
	    const clear = 'clear';
	    patchTimer(global, set, clear, 'Timeout');
	    patchTimer(global, set, clear, 'Interval');
	    patchTimer(global, set, clear, 'Immediate');
	  });
	  Zone.__load_patch('requestAnimationFrame', global => {
	    patchTimer(global, 'request', 'cancel', 'AnimationFrame');
	    patchTimer(global, 'mozRequest', 'mozCancel', 'AnimationFrame');
	    patchTimer(global, 'webkitRequest', 'webkitCancel', 'AnimationFrame');
	  });
	  Zone.__load_patch('blocking', (global, Zone) => {
	    const blockingMethods = ['alert', 'prompt', 'confirm'];
	    for (let i = 0; i < blockingMethods.length; i++) {
	      const name = blockingMethods[i];
	      patchMethod(global, name, (delegate, symbol, name) => {
	        return function (s, args) {
	          return Zone.current.run(delegate, global, args, name);
	        };
	      });
	    }
	  });
	  Zone.__load_patch('EventTarget', (global, Zone, api) => {
	    patchEvent(global, api);
	    eventTargetPatch(global, api);
	    // patch XMLHttpRequestEventTarget's addEventListener/removeEventListener
	    const XMLHttpRequestEventTarget = global['XMLHttpRequestEventTarget'];
	    if (XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype) {
	      api.patchEventTarget(global, api, [XMLHttpRequestEventTarget.prototype]);
	    }
	  });
	  Zone.__load_patch('MutationObserver', (global, Zone, api) => {
	    patchClass('MutationObserver');
	    patchClass('WebKitMutationObserver');
	  });
	  Zone.__load_patch('IntersectionObserver', (global, Zone, api) => {
	    patchClass('IntersectionObserver');
	  });
	  Zone.__load_patch('FileReader', (global, Zone, api) => {
	    patchClass('FileReader');
	  });
	  Zone.__load_patch('on_property', (global, Zone, api) => {
	    propertyDescriptorPatch(api, global);
	  });
	  Zone.__load_patch('customElements', (global, Zone, api) => {
	    patchCustomElements(global, api);
	  });
	  Zone.__load_patch('XHR', (global, Zone) => {
	    // Treat XMLHttpRequest as a macrotask.
	    patchXHR(global);
	    const XHR_TASK = zoneSymbol('xhrTask');
	    const XHR_SYNC = zoneSymbol('xhrSync');
	    const XHR_LISTENER = zoneSymbol('xhrListener');
	    const XHR_SCHEDULED = zoneSymbol('xhrScheduled');
	    const XHR_URL = zoneSymbol('xhrURL');
	    const XHR_ERROR_BEFORE_SCHEDULED = zoneSymbol('xhrErrorBeforeScheduled');
	    function patchXHR(window) {
	      const XMLHttpRequest = window['XMLHttpRequest'];
	      if (!XMLHttpRequest) {
	        // XMLHttpRequest is not available in service worker
	        return;
	      }
	      const XMLHttpRequestPrototype = XMLHttpRequest.prototype;
	      function findPendingTask(target) {
	        return target[XHR_TASK];
	      }
	      let oriAddListener = XMLHttpRequestPrototype[ZONE_SYMBOL_ADD_EVENT_LISTENER];
	      let oriRemoveListener = XMLHttpRequestPrototype[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
	      if (!oriAddListener) {
	        const XMLHttpRequestEventTarget = window['XMLHttpRequestEventTarget'];
	        if (XMLHttpRequestEventTarget) {
	          const XMLHttpRequestEventTargetPrototype = XMLHttpRequestEventTarget.prototype;
	          oriAddListener = XMLHttpRequestEventTargetPrototype[ZONE_SYMBOL_ADD_EVENT_LISTENER];
	          oriRemoveListener = XMLHttpRequestEventTargetPrototype[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
	        }
	      }
	      const READY_STATE_CHANGE = 'readystatechange';
	      const SCHEDULED = 'scheduled';
	      function scheduleTask(task) {
	        const data = task.data;
	        const target = data.target;
	        target[XHR_SCHEDULED] = false;
	        target[XHR_ERROR_BEFORE_SCHEDULED] = false;
	        // remove existing event listener
	        const listener = target[XHR_LISTENER];
	        if (!oriAddListener) {
	          oriAddListener = target[ZONE_SYMBOL_ADD_EVENT_LISTENER];
	          oriRemoveListener = target[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
	        }
	        if (listener) {
	          oriRemoveListener.call(target, READY_STATE_CHANGE, listener);
	        }
	        const newListener = target[XHR_LISTENER] = () => {
	          if (target.readyState === target.DONE) {
	            // sometimes on some browsers XMLHttpRequest will fire onreadystatechange with
	            // readyState=4 multiple times, so we need to check task state here
	            if (!data.aborted && target[XHR_SCHEDULED] && task.state === SCHEDULED) {
	              // check whether the xhr has registered onload listener
	              // if that is the case, the task should invoke after all
	              // onload listeners finish.
	              // Also if the request failed without response (status = 0), the load event handler
	              // will not be triggered, in that case, we should also invoke the placeholder callback
	              // to close the XMLHttpRequest::send macroTask.
	              // https://github.com/angular/angular/issues/38795
	              const loadTasks = target[Zone.__symbol__('loadfalse')];
	              if (target.status !== 0 && loadTasks && loadTasks.length > 0) {
	                const oriInvoke = task.invoke;
	                task.invoke = function () {
	                  // need to load the tasks again, because in other
	                  // load listener, they may remove themselves
	                  const loadTasks = target[Zone.__symbol__('loadfalse')];
	                  for (let i = 0; i < loadTasks.length; i++) {
	                    if (loadTasks[i] === task) {
	                      loadTasks.splice(i, 1);
	                    }
	                  }
	                  if (!data.aborted && task.state === SCHEDULED) {
	                    oriInvoke.call(task);
	                  }
	                };
	                loadTasks.push(task);
	              } else {
	                task.invoke();
	              }
	            } else if (!data.aborted && target[XHR_SCHEDULED] === false) {
	              // error occurs when xhr.send()
	              target[XHR_ERROR_BEFORE_SCHEDULED] = true;
	            }
	          }
	        };
	        oriAddListener.call(target, READY_STATE_CHANGE, newListener);
	        const storedTask = target[XHR_TASK];
	        if (!storedTask) {
	          target[XHR_TASK] = task;
	        }
	        sendNative.apply(target, data.args);
	        target[XHR_SCHEDULED] = true;
	        return task;
	      }
	      function placeholderCallback() {}
	      function clearTask(task) {
	        const data = task.data;
	        // Note - ideally, we would call data.target.removeEventListener here, but it's too late
	        // to prevent it from firing. So instead, we store info for the event listener.
	        data.aborted = true;
	        return abortNative.apply(data.target, data.args);
	      }
	      const openNative = patchMethod(XMLHttpRequestPrototype, 'open', () => function (self, args) {
	        self[XHR_SYNC] = args[2] == false;
	        self[XHR_URL] = args[1];
	        return openNative.apply(self, args);
	      });
	      const XMLHTTPREQUEST_SOURCE = 'XMLHttpRequest.send';
	      const fetchTaskAborting = zoneSymbol('fetchTaskAborting');
	      const fetchTaskScheduling = zoneSymbol('fetchTaskScheduling');
	      const sendNative = patchMethod(XMLHttpRequestPrototype, 'send', () => function (self, args) {
	        if (Zone.current[fetchTaskScheduling] === true) {
	          // a fetch is scheduling, so we are using xhr to polyfill fetch
	          // and because we already schedule macroTask for fetch, we should
	          // not schedule a macroTask for xhr again
	          return sendNative.apply(self, args);
	        }
	        if (self[XHR_SYNC]) {
	          // if the XHR is sync there is no task to schedule, just execute the code.
	          return sendNative.apply(self, args);
	        } else {
	          const options = {
	            target: self,
	            url: self[XHR_URL],
	            isPeriodic: false,
	            args: args,
	            aborted: false
	          };
	          const task = scheduleMacroTaskWithCurrentZone(XMLHTTPREQUEST_SOURCE, placeholderCallback, options, scheduleTask, clearTask);
	          if (self && self[XHR_ERROR_BEFORE_SCHEDULED] === true && !options.aborted && task.state === SCHEDULED) {
	            // xhr request throw error when send
	            // we should invoke task instead of leaving a scheduled
	            // pending macroTask
	            task.invoke();
	          }
	        }
	      });
	      const abortNative = patchMethod(XMLHttpRequestPrototype, 'abort', () => function (self, args) {
	        const task = findPendingTask(self);
	        if (task && typeof task.type == 'string') {
	          // If the XHR has already completed, do nothing.
	          // If the XHR has already been aborted, do nothing.
	          // Fix #569, call abort multiple times before done will cause
	          // macroTask task count be negative number
	          if (task.cancelFn == null || task.data && task.data.aborted) {
	            return;
	          }
	          task.zone.cancelTask(task);
	        } else if (Zone.current[fetchTaskAborting] === true) {
	          // the abort is called from fetch polyfill, we need to call native abort of XHR.
	          return abortNative.apply(self, args);
	        }
	        // Otherwise, we are trying to abort an XHR which has not yet been sent, so there is no
	        // task
	        // to cancel. Do nothing.
	      });
	    }
	  });
	  Zone.__load_patch('geolocation', global => {
	    /// GEO_LOCATION
	    if (global['navigator'] && global['navigator'].geolocation) {
	      patchPrototype(global['navigator'].geolocation, ['getCurrentPosition', 'watchPosition']);
	    }
	  });
	  Zone.__load_patch('PromiseRejectionEvent', (global, Zone) => {
	    // handle unhandled promise rejection
	    function findPromiseRejectionHandler(evtName) {
	      return function (e) {
	        const eventTasks = findEventTasks(global, evtName);
	        eventTasks.forEach(eventTask => {
	          // windows has added unhandledrejection event listener
	          // trigger the event listener
	          const PromiseRejectionEvent = global['PromiseRejectionEvent'];
	          if (PromiseRejectionEvent) {
	            const evt = new PromiseRejectionEvent(evtName, {
	              promise: e.promise,
	              reason: e.rejection
	            });
	            eventTask.invoke(evt);
	          }
	        });
	      };
	    }
	    if (global['PromiseRejectionEvent']) {
	      Zone[zoneSymbol('unhandledPromiseRejectionHandler')] = findPromiseRejectionHandler('unhandledrejection');
	      Zone[zoneSymbol('rejectionHandledHandler')] = findPromiseRejectionHandler('rejectionhandled');
	    }
	  });
	  Zone.__load_patch('queueMicrotask', (global, Zone, api) => {
	    patchQueueMicrotask(global, api);
	  });
	}
	function patchPromise(Zone) {
	  Zone.__load_patch('ZoneAwarePromise', (global, Zone, api) => {
	    const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	    const ObjectDefineProperty = Object.defineProperty;
	    function readableObjectToString(obj) {
	      if (obj && obj.toString === Object.prototype.toString) {
	        const className = obj.constructor && obj.constructor.name;
	        return (className ? className : '') + ': ' + JSON.stringify(obj);
	      }
	      return obj ? obj.toString() : Object.prototype.toString.call(obj);
	    }
	    const __symbol__ = api.symbol;
	    const _uncaughtPromiseErrors = [];
	    const isDisableWrappingUncaughtPromiseRejection = global[__symbol__('DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION')] !== false;
	    const symbolPromise = __symbol__('Promise');
	    const symbolThen = __symbol__('then');
	    const creationTrace = '__creationTrace__';
	    api.onUnhandledError = e => {
	      if (api.showUncaughtError()) {
	        const rejection = e && e.rejection;
	        if (rejection) {
	          console.error('Unhandled Promise rejection:', rejection instanceof Error ? rejection.message : rejection, '; Zone:', e.zone.name, '; Task:', e.task && e.task.source, '; Value:', rejection, rejection instanceof Error ? rejection.stack : undefined);
	        } else {
	          console.error(e);
	        }
	      }
	    };
	    api.microtaskDrainDone = () => {
	      while (_uncaughtPromiseErrors.length) {
	        const uncaughtPromiseError = _uncaughtPromiseErrors.shift();
	        try {
	          uncaughtPromiseError.zone.runGuarded(() => {
	            if (uncaughtPromiseError.throwOriginal) {
	              throw uncaughtPromiseError.rejection;
	            }
	            throw uncaughtPromiseError;
	          });
	        } catch (error) {
	          handleUnhandledRejection(error);
	        }
	      }
	    };
	    const UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL = __symbol__('unhandledPromiseRejectionHandler');
	    function handleUnhandledRejection(e) {
	      api.onUnhandledError(e);
	      try {
	        const handler = Zone[UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL];
	        if (typeof handler === 'function') {
	          handler.call(this, e);
	        }
	      } catch (err) {}
	    }
	    function isThenable(value) {
	      return value && typeof value.then === 'function';
	    }
	    function forwardResolution(value) {
	      return value;
	    }
	    function forwardRejection(rejection) {
	      return ZoneAwarePromise.reject(rejection);
	    }
	    const symbolState = __symbol__('state');
	    const symbolValue = __symbol__('value');
	    const symbolFinally = __symbol__('finally');
	    const symbolParentPromiseValue = __symbol__('parentPromiseValue');
	    const symbolParentPromiseState = __symbol__('parentPromiseState');
	    const source = 'Promise.then';
	    const UNRESOLVED = null;
	    const RESOLVED = true;
	    const REJECTED = false;
	    const REJECTED_NO_CATCH = 0;
	    function makeResolver(promise, state) {
	      return v => {
	        try {
	          resolvePromise(promise, state, v);
	        } catch (err) {
	          resolvePromise(promise, false, err);
	        }
	        // Do not return value or you will break the Promise spec.
	      };
	    }
	    const once = function () {
	      let wasCalled = false;
	      return function wrapper(wrappedFunction) {
	        return function () {
	          if (wasCalled) {
	            return;
	          }
	          wasCalled = true;
	          wrappedFunction.apply(null, arguments);
	        };
	      };
	    };
	    const TYPE_ERROR = 'Promise resolved with itself';
	    const CURRENT_TASK_TRACE_SYMBOL = __symbol__('currentTaskTrace');
	    // Promise Resolution
	    function resolvePromise(promise, state, value) {
	      const onceWrapper = once();
	      if (promise === value) {
	        throw new TypeError(TYPE_ERROR);
	      }
	      if (promise[symbolState] === UNRESOLVED) {
	        // should only get value.then once based on promise spec.
	        let then = null;
	        try {
	          if (typeof value === 'object' || typeof value === 'function') {
	            then = value && value.then;
	          }
	        } catch (err) {
	          onceWrapper(() => {
	            resolvePromise(promise, false, err);
	          })();
	          return promise;
	        }
	        // if (value instanceof ZoneAwarePromise) {
	        if (state !== REJECTED && value instanceof ZoneAwarePromise && value.hasOwnProperty(symbolState) && value.hasOwnProperty(symbolValue) && value[symbolState] !== UNRESOLVED) {
	          clearRejectedNoCatch(value);
	          resolvePromise(promise, value[symbolState], value[symbolValue]);
	        } else if (state !== REJECTED && typeof then === 'function') {
	          try {
	            then.call(value, onceWrapper(makeResolver(promise, state)), onceWrapper(makeResolver(promise, false)));
	          } catch (err) {
	            onceWrapper(() => {
	              resolvePromise(promise, false, err);
	            })();
	          }
	        } else {
	          promise[symbolState] = state;
	          const queue = promise[symbolValue];
	          promise[symbolValue] = value;
	          if (promise[symbolFinally] === symbolFinally) {
	            // the promise is generated by Promise.prototype.finally
	            if (state === RESOLVED) {
	              // the state is resolved, should ignore the value
	              // and use parent promise value
	              promise[symbolState] = promise[symbolParentPromiseState];
	              promise[symbolValue] = promise[symbolParentPromiseValue];
	            }
	          }
	          // record task information in value when error occurs, so we can
	          // do some additional work such as render longStackTrace
	          if (state === REJECTED && value instanceof Error) {
	            // check if longStackTraceZone is here
	            const trace = Zone.currentTask && Zone.currentTask.data && Zone.currentTask.data[creationTrace];
	            if (trace) {
	              // only keep the long stack trace into error when in longStackTraceZone
	              ObjectDefineProperty(value, CURRENT_TASK_TRACE_SYMBOL, {
	                configurable: true,
	                enumerable: false,
	                writable: true,
	                value: trace
	              });
	            }
	          }
	          for (let i = 0; i < queue.length;) {
	            scheduleResolveOrReject(promise, queue[i++], queue[i++], queue[i++], queue[i++]);
	          }
	          if (queue.length == 0 && state == REJECTED) {
	            promise[symbolState] = REJECTED_NO_CATCH;
	            let uncaughtPromiseError = value;
	            try {
	              // Here we throws a new Error to print more readable error log
	              // and if the value is not an error, zone.js builds an `Error`
	              // Object here to attach the stack information.
	              throw new Error('Uncaught (in promise): ' + readableObjectToString(value) + (value && value.stack ? '\n' + value.stack : ''));
	            } catch (err) {
	              uncaughtPromiseError = err;
	            }
	            if (isDisableWrappingUncaughtPromiseRejection) {
	              // If disable wrapping uncaught promise reject
	              // use the value instead of wrapping it.
	              uncaughtPromiseError.throwOriginal = true;
	            }
	            uncaughtPromiseError.rejection = value;
	            uncaughtPromiseError.promise = promise;
	            uncaughtPromiseError.zone = Zone.current;
	            uncaughtPromiseError.task = Zone.currentTask;
	            _uncaughtPromiseErrors.push(uncaughtPromiseError);
	            api.scheduleMicroTask(); // to make sure that it is running
	          }
	        }
	      }
	      // Resolving an already resolved promise is a noop.
	      return promise;
	    }
	    const REJECTION_HANDLED_HANDLER = __symbol__('rejectionHandledHandler');
	    function clearRejectedNoCatch(promise) {
	      if (promise[symbolState] === REJECTED_NO_CATCH) {
	        // if the promise is rejected no catch status
	        // and queue.length > 0, means there is a error handler
	        // here to handle the rejected promise, we should trigger
	        // windows.rejectionhandled eventHandler or nodejs rejectionHandled
	        // eventHandler
	        try {
	          const handler = Zone[REJECTION_HANDLED_HANDLER];
	          if (handler && typeof handler === 'function') {
	            handler.call(this, {
	              rejection: promise[symbolValue],
	              promise: promise
	            });
	          }
	        } catch (err) {}
	        promise[symbolState] = REJECTED;
	        for (let i = 0; i < _uncaughtPromiseErrors.length; i++) {
	          if (promise === _uncaughtPromiseErrors[i].promise) {
	            _uncaughtPromiseErrors.splice(i, 1);
	          }
	        }
	      }
	    }
	    function scheduleResolveOrReject(promise, zone, chainPromise, onFulfilled, onRejected) {
	      clearRejectedNoCatch(promise);
	      const promiseState = promise[symbolState];
	      const delegate = promiseState ? typeof onFulfilled === 'function' ? onFulfilled : forwardResolution : typeof onRejected === 'function' ? onRejected : forwardRejection;
	      zone.scheduleMicroTask(source, () => {
	        try {
	          const parentPromiseValue = promise[symbolValue];
	          const isFinallyPromise = !!chainPromise && symbolFinally === chainPromise[symbolFinally];
	          if (isFinallyPromise) {
	            // if the promise is generated from finally call, keep parent promise's state and value
	            chainPromise[symbolParentPromiseValue] = parentPromiseValue;
	            chainPromise[symbolParentPromiseState] = promiseState;
	          }
	          // should not pass value to finally callback
	          const value = zone.run(delegate, undefined, isFinallyPromise && delegate !== forwardRejection && delegate !== forwardResolution ? [] : [parentPromiseValue]);
	          resolvePromise(chainPromise, true, value);
	        } catch (error) {
	          // if error occurs, should always return this error
	          resolvePromise(chainPromise, false, error);
	        }
	      }, chainPromise);
	    }
	    const ZONE_AWARE_PROMISE_TO_STRING = 'function ZoneAwarePromise() { [native code] }';
	    const noop = function () {};
	    const AggregateError = global.AggregateError;
	    class ZoneAwarePromise {
	      static toString() {
	        return ZONE_AWARE_PROMISE_TO_STRING;
	      }
	      static resolve(value) {
	        if (value instanceof ZoneAwarePromise) {
	          return value;
	        }
	        return resolvePromise(new this(null), RESOLVED, value);
	      }
	      static reject(error) {
	        return resolvePromise(new this(null), REJECTED, error);
	      }
	      static withResolvers() {
	        const result = {};
	        result.promise = new ZoneAwarePromise((res, rej) => {
	          result.resolve = res;
	          result.reject = rej;
	        });
	        return result;
	      }
	      static any(values) {
	        if (!values || typeof values[Symbol.iterator] !== 'function') {
	          return Promise.reject(new AggregateError([], 'All promises were rejected'));
	        }
	        const promises = [];
	        let count = 0;
	        try {
	          for (let v of values) {
	            count++;
	            promises.push(ZoneAwarePromise.resolve(v));
	          }
	        } catch (err) {
	          return Promise.reject(new AggregateError([], 'All promises were rejected'));
	        }
	        if (count === 0) {
	          return Promise.reject(new AggregateError([], 'All promises were rejected'));
	        }
	        let finished = false;
	        const errors = [];
	        return new ZoneAwarePromise((resolve, reject) => {
	          for (let i = 0; i < promises.length; i++) {
	            promises[i].then(v => {
	              if (finished) {
	                return;
	              }
	              finished = true;
	              resolve(v);
	            }, err => {
	              errors.push(err);
	              count--;
	              if (count === 0) {
	                finished = true;
	                reject(new AggregateError(errors, 'All promises were rejected'));
	              }
	            });
	          }
	        });
	      }
	      static race(values) {
	        let resolve;
	        let reject;
	        let promise = new this((res, rej) => {
	          resolve = res;
	          reject = rej;
	        });
	        function onResolve(value) {
	          resolve(value);
	        }
	        function onReject(error) {
	          reject(error);
	        }
	        for (let value of values) {
	          if (!isThenable(value)) {
	            value = this.resolve(value);
	          }
	          value.then(onResolve, onReject);
	        }
	        return promise;
	      }
	      static all(values) {
	        return ZoneAwarePromise.allWithCallback(values);
	      }
	      static allSettled(values) {
	        const P = this && this.prototype instanceof ZoneAwarePromise ? this : ZoneAwarePromise;
	        return P.allWithCallback(values, {
	          thenCallback: value => ({
	            status: 'fulfilled',
	            value
	          }),
	          errorCallback: err => ({
	            status: 'rejected',
	            reason: err
	          })
	        });
	      }
	      static allWithCallback(values, callback) {
	        let resolve;
	        let reject;
	        let promise = new this((res, rej) => {
	          resolve = res;
	          reject = rej;
	        });
	        // Start at 2 to prevent prematurely resolving if .then is called immediately.
	        let unresolvedCount = 2;
	        let valueIndex = 0;
	        const resolvedValues = [];
	        for (let value of values) {
	          if (!isThenable(value)) {
	            value = this.resolve(value);
	          }
	          const curValueIndex = valueIndex;
	          try {
	            value.then(value => {
	              resolvedValues[curValueIndex] = callback ? callback.thenCallback(value) : value;
	              unresolvedCount--;
	              if (unresolvedCount === 0) {
	                resolve(resolvedValues);
	              }
	            }, err => {
	              if (!callback) {
	                reject(err);
	              } else {
	                resolvedValues[curValueIndex] = callback.errorCallback(err);
	                unresolvedCount--;
	                if (unresolvedCount === 0) {
	                  resolve(resolvedValues);
	                }
	              }
	            });
	          } catch (thenErr) {
	            reject(thenErr);
	          }
	          unresolvedCount++;
	          valueIndex++;
	        }
	        // Make the unresolvedCount zero-based again.
	        unresolvedCount -= 2;
	        if (unresolvedCount === 0) {
	          resolve(resolvedValues);
	        }
	        return promise;
	      }
	      constructor(executor) {
	        const promise = this;
	        if (!(promise instanceof ZoneAwarePromise)) {
	          throw new Error('Must be an instanceof Promise.');
	        }
	        promise[symbolState] = UNRESOLVED;
	        promise[symbolValue] = []; // queue;
	        try {
	          const onceWrapper = once();
	          executor && executor(onceWrapper(makeResolver(promise, RESOLVED)), onceWrapper(makeResolver(promise, REJECTED)));
	        } catch (error) {
	          resolvePromise(promise, false, error);
	        }
	      }
	      get [Symbol.toStringTag]() {
	        return 'Promise';
	      }
	      get [Symbol.species]() {
	        return ZoneAwarePromise;
	      }
	      then(onFulfilled, onRejected) {
	        // We must read `Symbol.species` safely because `this` may be anything. For instance, `this`
	        // may be an object without a prototype (created through `Object.create(null)`); thus
	        // `this.constructor` will be undefined. One of the use cases is SystemJS creating
	        // prototype-less objects (modules) via `Object.create(null)`. The SystemJS creates an empty
	        // object and copies promise properties into that object (within the `getOrCreateLoad`
	        // function). The zone.js then checks if the resolved value has the `then` method and
	        // invokes it with the `value` context. Otherwise, this will throw an error: `TypeError:
	        // Cannot read properties of undefined (reading 'Symbol(Symbol.species)')`.
	        let C = this.constructor?.[Symbol.species];
	        if (!C || typeof C !== 'function') {
	          C = this.constructor || ZoneAwarePromise;
	        }
	        const chainPromise = new C(noop);
	        const zone = Zone.current;
	        if (this[symbolState] == UNRESOLVED) {
	          this[symbolValue].push(zone, chainPromise, onFulfilled, onRejected);
	        } else {
	          scheduleResolveOrReject(this, zone, chainPromise, onFulfilled, onRejected);
	        }
	        return chainPromise;
	      }
	      catch(onRejected) {
	        return this.then(null, onRejected);
	      }
	      finally(onFinally) {
	        // See comment on the call to `then` about why thee `Symbol.species` is safely accessed.
	        let C = this.constructor?.[Symbol.species];
	        if (!C || typeof C !== 'function') {
	          C = ZoneAwarePromise;
	        }
	        const chainPromise = new C(noop);
	        chainPromise[symbolFinally] = symbolFinally;
	        const zone = Zone.current;
	        if (this[symbolState] == UNRESOLVED) {
	          this[symbolValue].push(zone, chainPromise, onFinally, onFinally);
	        } else {
	          scheduleResolveOrReject(this, zone, chainPromise, onFinally, onFinally);
	        }
	        return chainPromise;
	      }
	    }
	    // Protect against aggressive optimizers dropping seemingly unused properties.
	    // E.g. Closure Compiler in advanced mode.
	    ZoneAwarePromise['resolve'] = ZoneAwarePromise.resolve;
	    ZoneAwarePromise['reject'] = ZoneAwarePromise.reject;
	    ZoneAwarePromise['race'] = ZoneAwarePromise.race;
	    ZoneAwarePromise['all'] = ZoneAwarePromise.all;
	    const NativePromise = global[symbolPromise] = global['Promise'];
	    global['Promise'] = ZoneAwarePromise;
	    const symbolThenPatched = __symbol__('thenPatched');
	    function patchThen(Ctor) {
	      const proto = Ctor.prototype;
	      const prop = ObjectGetOwnPropertyDescriptor(proto, 'then');
	      if (prop && (prop.writable === false || !prop.configurable)) {
	        // check Ctor.prototype.then propertyDescriptor is writable or not
	        // in meteor env, writable is false, we should ignore such case
	        return;
	      }
	      const originalThen = proto.then;
	      // Keep a reference to the original method.
	      proto[symbolThen] = originalThen;
	      Ctor.prototype.then = function (onResolve, onReject) {
	        const wrapped = new ZoneAwarePromise((resolve, reject) => {
	          originalThen.call(this, resolve, reject);
	        });
	        return wrapped.then(onResolve, onReject);
	      };
	      Ctor[symbolThenPatched] = true;
	    }
	    api.patchThen = patchThen;
	    function zoneify(fn) {
	      return function (self, args) {
	        let resultPromise = fn.apply(self, args);
	        if (resultPromise instanceof ZoneAwarePromise) {
	          return resultPromise;
	        }
	        let ctor = resultPromise.constructor;
	        if (!ctor[symbolThenPatched]) {
	          patchThen(ctor);
	        }
	        return resultPromise;
	      };
	    }
	    if (NativePromise) {
	      patchThen(NativePromise);
	      patchMethod(global, 'fetch', delegate => zoneify(delegate));
	    }
	    // This is not part of public API, but it is useful for tests, so we expose it.
	    Promise[Zone.__symbol__('uncaughtPromiseErrors')] = _uncaughtPromiseErrors;
	    return ZoneAwarePromise;
	  });
	}
	function patchToString(Zone) {
	  // override Function.prototype.toString to make zone.js patched function
	  // look like native function
	  Zone.__load_patch('toString', global => {
	    // patch Func.prototype.toString to let them look like native
	    const originalFunctionToString = Function.prototype.toString;
	    const ORIGINAL_DELEGATE_SYMBOL = zoneSymbol('OriginalDelegate');
	    const PROMISE_SYMBOL = zoneSymbol('Promise');
	    const ERROR_SYMBOL = zoneSymbol('Error');
	    const newFunctionToString = function toString() {
	      if (typeof this === 'function') {
	        const originalDelegate = this[ORIGINAL_DELEGATE_SYMBOL];
	        if (originalDelegate) {
	          if (typeof originalDelegate === 'function') {
	            return originalFunctionToString.call(originalDelegate);
	          } else {
	            return Object.prototype.toString.call(originalDelegate);
	          }
	        }
	        if (this === Promise) {
	          const nativePromise = global[PROMISE_SYMBOL];
	          if (nativePromise) {
	            return originalFunctionToString.call(nativePromise);
	          }
	        }
	        if (this === Error) {
	          const nativeError = global[ERROR_SYMBOL];
	          if (nativeError) {
	            return originalFunctionToString.call(nativeError);
	          }
	        }
	      }
	      return originalFunctionToString.call(this);
	    };
	    newFunctionToString[ORIGINAL_DELEGATE_SYMBOL] = originalFunctionToString;
	    Function.prototype.toString = newFunctionToString;
	    // patch Object.prototype.toString to let them look like native
	    const originalObjectToString = Object.prototype.toString;
	    const PROMISE_OBJECT_TO_STRING = '[object Promise]';
	    Object.prototype.toString = function () {
	      if (typeof Promise === 'function' && this instanceof Promise) {
	        return PROMISE_OBJECT_TO_STRING;
	      }
	      return originalObjectToString.call(this);
	    };
	  });
	}
	function patchCallbacks(api, target, targetName, method, callbacks) {
	  const symbol = Zone.__symbol__(method);
	  if (target[symbol]) {
	    return;
	  }
	  const nativeDelegate = target[symbol] = target[method];
	  target[method] = function (name, opts, options) {
	    if (opts && opts.prototype) {
	      callbacks.forEach(function (callback) {
	        const source = `${targetName}.${method}::` + callback;
	        const prototype = opts.prototype;
	        // Note: the `patchCallbacks` is used for patching the `document.registerElement` and
	        // `customElements.define`. We explicitly wrap the patching code into try-catch since
	        // callbacks may be already patched by other web components frameworks (e.g. LWC), and they
	        // make those properties non-writable. This means that patching callback will throw an error
	        // `cannot assign to read-only property`. See this code as an example:
	        // https://github.com/salesforce/lwc/blob/master/packages/@lwc/engine-core/src/framework/base-bridge-element.ts#L180-L186
	        // We don't want to stop the application rendering if we couldn't patch some
	        // callback, e.g. `attributeChangedCallback`.
	        try {
	          if (prototype.hasOwnProperty(callback)) {
	            const descriptor = api.ObjectGetOwnPropertyDescriptor(prototype, callback);
	            if (descriptor && descriptor.value) {
	              descriptor.value = api.wrapWithCurrentZone(descriptor.value, source);
	              api._redefineProperty(opts.prototype, callback, descriptor);
	            } else if (prototype[callback]) {
	              prototype[callback] = api.wrapWithCurrentZone(prototype[callback], source);
	            }
	          } else if (prototype[callback]) {
	            prototype[callback] = api.wrapWithCurrentZone(prototype[callback], source);
	          }
	        } catch {
	          // Note: we leave the catch block empty since there's no way to handle the error related
	          // to non-writable property.
	        }
	      });
	    }
	    return nativeDelegate.call(target, name, opts, options);
	  };
	  api.attachOriginToPatched(target[method], nativeDelegate);
	}
	function patchUtil(Zone) {
	  Zone.__load_patch('util', (global, Zone, api) => {
	    // Collect native event names by looking at properties
	    // on the global namespace, e.g. 'onclick'.
	    const eventNames = getOnEventNames(global);
	    api.patchOnProperties = patchOnProperties;
	    api.patchMethod = patchMethod;
	    api.bindArguments = bindArguments;
	    api.patchMacroTask = patchMacroTask;
	    // In earlier version of zone.js (<0.9.0), we use env name `__zone_symbol__BLACK_LISTED_EVENTS`
	    // to define which events will not be patched by `Zone.js`. In newer version (>=0.9.0), we
	    // change the env name to `__zone_symbol__UNPATCHED_EVENTS` to keep the name consistent with
	    // angular repo. The  `__zone_symbol__BLACK_LISTED_EVENTS` is deprecated, but it is still be
	    // supported for backwards compatibility.
	    const SYMBOL_BLACK_LISTED_EVENTS = Zone.__symbol__('BLACK_LISTED_EVENTS');
	    const SYMBOL_UNPATCHED_EVENTS = Zone.__symbol__('UNPATCHED_EVENTS');
	    if (global[SYMBOL_UNPATCHED_EVENTS]) {
	      global[SYMBOL_BLACK_LISTED_EVENTS] = global[SYMBOL_UNPATCHED_EVENTS];
	    }
	    if (global[SYMBOL_BLACK_LISTED_EVENTS]) {
	      Zone[SYMBOL_BLACK_LISTED_EVENTS] = Zone[SYMBOL_UNPATCHED_EVENTS] = global[SYMBOL_BLACK_LISTED_EVENTS];
	    }
	    api.patchEventPrototype = patchEventPrototype;
	    api.patchEventTarget = patchEventTarget;
	    api.isIEOrEdge = isIEOrEdge;
	    api.ObjectDefineProperty = ObjectDefineProperty;
	    api.ObjectGetOwnPropertyDescriptor = ObjectGetOwnPropertyDescriptor;
	    api.ObjectCreate = ObjectCreate;
	    api.ArraySlice = ArraySlice;
	    api.patchClass = patchClass;
	    api.wrapWithCurrentZone = wrapWithCurrentZone;
	    api.filterProperties = filterProperties;
	    api.attachOriginToPatched = attachOriginToPatched;
	    api._redefineProperty = Object.defineProperty;
	    api.patchCallbacks = patchCallbacks;
	    api.getGlobalObjects = () => ({
	      globalSources,
	      zoneSymbolEventNames,
	      eventNames,
	      isBrowser,
	      isMix,
	      isNode,
	      TRUE_STR,
	      FALSE_STR,
	      ZONE_SYMBOL_PREFIX,
	      ADD_EVENT_LISTENER_STR,
	      REMOVE_EVENT_LISTENER_STR
	    });
	  });
	}
	function patchCommon(Zone) {
	  patchPromise(Zone);
	  patchToString(Zone);
	  patchUtil(Zone);
	}
	const Zone$1 = loadZone();
	patchCommon(Zone$1);
	patchBrowser(Zone$1);
	return zone;
}

requireZone();

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */

/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
let _currentInjector = undefined;
function getCurrentInjector() {
  return _currentInjector;
}
function setCurrentInjector(injector) {
  const former = _currentInjector;
  _currentInjector = injector;
  return former;
}

/**
 * Value returned if the key-value pair couldn't be found in the context
 * hierarchy.
 */
const NOT_FOUND$1 = /*#__PURE__*/Symbol('NotFound');
/**
 * Type guard for checking if an unknown value is a NotFound.
 */
function isNotFound(e) {
  return e === NOT_FOUND$1 || e?.name === 'ɵNotFound';
}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
let activeConsumer = null;
let epoch = 1;
const SIGNAL = /* @__PURE__ */ Symbol("SIGNAL");
function setActiveConsumer(consumer) {
  const prev = activeConsumer;
  activeConsumer = consumer;
  return prev;
}
function getActiveConsumer() {
  return activeConsumer;
}
const REACTIVE_NODE = {
  version: 0,
  lastCleanEpoch: 0,
  dirty: false,
  producers: void 0,
  producersTail: void 0,
  consumers: void 0,
  consumersTail: void 0,
  recomputing: false,
  consumerAllowSignalWrites: false,
  consumerIsAlwaysLive: false,
  kind: "unknown",
  producerMustRecompute: () => false,
  producerRecomputeValue: () => {
  },
  consumerMarkedDirty: () => {
  },
  consumerOnSignalRead: () => {
  }
};
function producerUpdateValueVersion(node) {
  if (consumerIsLive(node) && !node.dirty) {
    return;
  }
  if (!node.dirty && node.lastCleanEpoch === epoch) {
    return;
  }
  if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
    producerMarkClean(node);
    return;
  }
  node.producerRecomputeValue(node);
  producerMarkClean(node);
}
function producerMarkClean(node) {
  node.dirty = false;
  node.lastCleanEpoch = epoch;
}
function consumerBeforeComputation(node) {
  if (node) resetConsumerBeforeComputation(node);
  return setActiveConsumer(node);
}
function resetConsumerBeforeComputation(node) {
  node.producersTail = void 0;
  node.recomputing = true;
}
function consumerAfterComputation(node, prevConsumer) {
  setActiveConsumer(prevConsumer);
  if (node) finalizeConsumerAfterComputation(node);
}
function finalizeConsumerAfterComputation(node) {
  node.recomputing = false;
  const producersTail = node.producersTail;
  let toRemove = producersTail !== void 0 ? producersTail.nextProducer : node.producers;
  if (toRemove !== void 0) {
    if (consumerIsLive(node)) {
      do {
        toRemove = producerRemoveLiveConsumerLink(toRemove);
      } while (toRemove !== void 0);
    }
    if (producersTail !== void 0) {
      producersTail.nextProducer = void 0;
    } else {
      node.producers = void 0;
    }
  }
}
function consumerPollProducersForChange(node) {
  for (let link = node.producers; link !== void 0; link = link.nextProducer) {
    const producer = link.producer;
    const seenVersion = link.lastReadVersion;
    if (seenVersion !== producer.version) {
      return true;
    }
    producerUpdateValueVersion(producer);
    if (seenVersion !== producer.version) {
      return true;
    }
  }
  return false;
}
function consumerDestroy(node) {
  if (consumerIsLive(node)) {
    let link = node.producers;
    while (link !== void 0) {
      link = producerRemoveLiveConsumerLink(link);
    }
  }
  node.producers = void 0;
  node.producersTail = void 0;
  node.consumers = void 0;
  node.consumersTail = void 0;
}
function producerRemoveLiveConsumerLink(link) {
  const producer = link.producer;
  const nextProducer = link.nextProducer;
  const nextConsumer = link.nextConsumer;
  const prevConsumer = link.prevConsumer;
  link.nextConsumer = void 0;
  link.prevConsumer = void 0;
  if (nextConsumer !== void 0) {
    nextConsumer.prevConsumer = prevConsumer;
  } else {
    producer.consumersTail = prevConsumer;
  }
  if (prevConsumer !== void 0) {
    prevConsumer.nextConsumer = nextConsumer;
  } else {
    producer.consumers = nextConsumer;
    if (!consumerIsLive(producer)) {
      let producerLink = producer.producers;
      while (producerLink !== void 0) {
        producerLink = producerRemoveLiveConsumerLink(producerLink);
      }
    }
  }
  return nextProducer;
}
function consumerIsLive(node) {
  return node.consumerIsAlwaysLive || node.consumers !== void 0;
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function isFunction(value) {
    return typeof value === 'function';
}

function createErrorClass(createImpl) {
    var _super = function (instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}

var UnsubscriptionError = createErrorClass(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});

function arrRemove(arr, item) {
    if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}

var Subscription = (function () {
    function Subscription(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
    }
    Subscription.prototype.unsubscribe = function () {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
            this.closed = true;
            var _parentage = this._parentage;
            if (_parentage) {
                this._parentage = null;
                if (Array.isArray(_parentage)) {
                    try {
                        for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                            var parent_1 = _parentage_1_1.value;
                            parent_1.remove(this);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                else {
                    _parentage.remove(this);
                }
            }
            var initialFinalizer = this.initialTeardown;
            if (isFunction(initialFinalizer)) {
                try {
                    initialFinalizer();
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError ? e.errors : [e];
                }
            }
            var _finalizers = this._finalizers;
            if (_finalizers) {
                this._finalizers = null;
                try {
                    for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                        var finalizer = _finalizers_1_1.value;
                        try {
                            execFinalizer(finalizer);
                        }
                        catch (err) {
                            errors = errors !== null && errors !== void 0 ? errors : [];
                            if (err instanceof UnsubscriptionError) {
                                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                            }
                            else {
                                errors.push(err);
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (errors) {
                throw new UnsubscriptionError(errors);
            }
        }
    };
    Subscription.prototype.add = function (teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execFinalizer(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    };
    Subscription.prototype._hasParent = function (parent) {
        var _parentage = this._parentage;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    };
    Subscription.prototype._addParent = function (parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription.prototype._removeParent = function (parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            arrRemove(_parentage, parent);
        }
    };
    Subscription.prototype.remove = function (teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    };
    Subscription.EMPTY = (function () {
        var empty = new Subscription();
        empty.closed = true;
        return empty;
    })();
    return Subscription;
}());
var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
}
function execFinalizer(finalizer) {
    if (isFunction(finalizer)) {
        finalizer();
    }
    else {
        finalizer.unsubscribe();
    }
}

var config = {
    Promise: undefined};

var timeoutProvider = {
    setTimeout: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function (handle) {
        return (clearTimeout)(handle);
    },
    delegate: undefined,
};

function reportUnhandledError(err) {
    timeoutProvider.setTimeout(function () {
        {
            throw err;
        }
    });
}

function noop$1() { }

function errorContext(cb) {
    {
        cb();
    }
}

var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
            _this.destination = destination;
            if (isSubscription(destination)) {
                destination.add(_this);
            }
        }
        else {
            _this.destination = EMPTY_OBSERVER;
        }
        return _this;
    }
    Subscriber.create = function (next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    };
    Subscriber.prototype.next = function (value) {
        if (this.isStopped) ;
        else {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (this.isStopped) ;
        else {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (this.isStopped) ;
        else {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
            this.destination = null;
        }
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        try {
            this.destination.error(err);
        }
        finally {
            this.unsubscribe();
        }
    };
    Subscriber.prototype._complete = function () {
        try {
            this.destination.complete();
        }
        finally {
            this.unsubscribe();
        }
    };
    return Subscriber;
}(Subscription));
var ConsumerObserver = (function () {
    function ConsumerObserver(partialObserver) {
        this.partialObserver = partialObserver;
    }
    ConsumerObserver.prototype.next = function (value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
            try {
                partialObserver.next(value);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    ConsumerObserver.prototype.error = function (err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
            try {
                partialObserver.error(err);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
        else {
            handleUnhandledError(err);
        }
    };
    ConsumerObserver.prototype.complete = function () {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
            try {
                partialObserver.complete();
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    return ConsumerObserver;
}());
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction(observerOrNext) || !observerOrNext) {
            partialObserver = {
                next: (observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined),
                error: error !== null && error !== void 0 ? error : undefined,
                complete: complete !== null && complete !== void 0 ? complete : undefined,
            };
        }
        else {
            {
                partialObserver = observerOrNext;
            }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
    }
    return SafeSubscriber;
}(Subscriber));
function handleUnhandledError(error) {
    {
        reportUnhandledError(error);
    }
}
function defaultErrorHandler(err) {
    throw err;
}
var EMPTY_OBSERVER = {
    closed: true,
    next: noop$1,
    error: defaultErrorHandler,
    complete: noop$1,
};

var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

function identity(x) {
    return x;
}

function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}

var Observable = (function () {
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
        errorContext(function () {
            var _a = _this, operator = _a.operator, source = _a.source;
            subscriber.add(operator
                ?
                    operator.call(subscriber, source)
                : source
                    ?
                        _this._subscribe(subscriber)
                    :
                        _this._trySubscribe(subscriber));
        });
        return subscriber;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscriber = new SafeSubscriber({
                next: function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            _this.subscribe(subscriber);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable.prototype[observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return pipeFromArray(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
}

function hasLift(source) {
    return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
    return function (source) {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}

function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = (function (_super) {
    __extends(OperatorSubscriber, _super);
    function OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    destination.error(err);
                }
            }
            : _super.prototype._next;
        _this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._error;
        _this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._complete;
        return _this;
    }
    OperatorSubscriber.prototype.unsubscribe = function () {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
            var closed_1 = this.closed;
            _super.prototype.unsubscribe.call(this);
            !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
    };
    return OperatorSubscriber;
}(Subscriber));

var ObjectUnsubscribedError = createErrorClass(function (_super) {
    return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = 'ObjectUnsubscribedError';
        this.message = 'object unsubscribed';
    };
});

var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.closed = false;
        _this.currentObservers = null;
        _this.observers = [];
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype._throwIfClosed = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
    };
    Subject.prototype.next = function (value) {
        var _this = this;
        errorContext(function () {
            var e_1, _a;
            _this._throwIfClosed();
            if (!_this.isStopped) {
                if (!_this.currentObservers) {
                    _this.currentObservers = Array.from(_this.observers);
                }
                try {
                    for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var observer = _c.value;
                        observer.next(value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        });
    };
    Subject.prototype.error = function (err) {
        var _this = this;
        errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.hasError = _this.isStopped = true;
                _this.thrownError = err;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().error(err);
                }
            }
        });
    };
    Subject.prototype.complete = function () {
        var _this = this;
        errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.isStopped = true;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().complete();
                }
            }
        });
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
    };
    Object.defineProperty(Subject.prototype, "observed", {
        get: function () {
            var _a;
            return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
        },
        enumerable: false,
        configurable: true
    });
    Subject.prototype._trySubscribe = function (subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
    };
    Subject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    };
    Subject.prototype._innerSubscribe = function (subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        if (hasError || isStopped) {
            return EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription(function () {
            _this.currentObservers = null;
            arrRemove(observers, subscriber);
        });
    };
    Subject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable));
var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    };
    AnonymousSubject.prototype.error = function (err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    };
    AnonymousSubject.prototype.complete = function () {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
    };
    return AnonymousSubject;
}(Subject));

var BehaviorSubject = (function (_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: false,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, (this._value = value));
    };
    return BehaviorSubject;
}(Subject));

function map(project, thisArg) {
    return operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
class RuntimeError extends Error {
  code;
  constructor(code, message) {
    super(formatRuntimeError(code, message));
    this.code = code;
  }
}
function formatRuntimeErrorCode(code) {
  return `NG0${Math.abs(code)}`;
}
function formatRuntimeError(code, message) {
  const fullCode = formatRuntimeErrorCode(code);
  let errorMessage = `${fullCode}${message ? ": " + message : ""}`;
  return errorMessage;
}
function getClosureSafeProperty(objWithPropertyToExtract) {
  for (let key in objWithPropertyToExtract) {
    if (objWithPropertyToExtract[key] === getClosureSafeProperty) {
      return key;
    }
  }
  throw Error("");
}
function stringify(token) {
  if (typeof token === "string") {
    return token;
  }
  if (Array.isArray(token)) {
    return `[${token.map(stringify).join(", ")}]`;
  }
  if (token == null) {
    return "" + token;
  }
  const name = token.overriddenName || token.name;
  if (name) {
    return `${name}`;
  }
  const result = token.toString();
  if (result == null) {
    return "" + result;
  }
  const newLineIndex = result.indexOf("\n");
  return newLineIndex >= 0 ? result.slice(0, newLineIndex) : result;
}
function concatStringsWithSpace(before, after) {
  if (!before) return after || "";
  if (!after) return before;
  return `${before} ${after}`;
}
const __forward_ref__ = /* @__PURE__ */ getClosureSafeProperty({
  __forward_ref__: getClosureSafeProperty
});
function forwardRef(forwardRefFn) {
  forwardRefFn.__forward_ref__ = forwardRef;
  forwardRefFn.toString = function() {
    return stringify(this());
  };
  return forwardRefFn;
}
function resolveForwardRef(type) {
  return isForwardRef(type) ? type() : type;
}
function isForwardRef(fn) {
  return typeof fn === "function" && fn.hasOwnProperty(__forward_ref__) && fn.__forward_ref__ === forwardRef;
}
function throwError(msg, actual, expected, comparison) {
  throw new Error(`ASSERTION ERROR: ${msg}` + ("" ));
}
function ɵɵdefineInjectable(opts) {
  return {
    token: opts.token,
    providedIn: opts.providedIn || null,
    factory: opts.factory,
    value: void 0
  };
}
function getInjectableDef(type) {
  return getOwnDefinition(type, NG_PROV_DEF);
}
function getOwnDefinition(type, field) {
  return type.hasOwnProperty(field) && type[field] || null;
}
function getInheritedInjectableDef(type) {
  const def = type?.[NG_PROV_DEF] ?? null;
  if (def) {
    return def;
  } else {
    return null;
  }
}
function getInjectorDef(type) {
  return type && type.hasOwnProperty(NG_INJ_DEF) ? type[NG_INJ_DEF] : null;
}
const NG_PROV_DEF = /* @__PURE__ */ getClosureSafeProperty({
  ɵprov: getClosureSafeProperty
});
const NG_INJ_DEF = /* @__PURE__ */ getClosureSafeProperty({
  ɵinj: getClosureSafeProperty
});
class InjectionToken {
  _desc;
  /** @internal */
  ngMetadataName = "InjectionToken";
  ɵprov;
  /**
   * @param _desc   Description for the token,
   *                used only for debugging purposes,
   *                it should but does not need to be unique
   * @param options Options for the token's usage, as described above
   */
  constructor(_desc, options) {
    this._desc = _desc;
    this.ɵprov = void 0;
    if (typeof options == "number") {
      this.__NG_ELEMENT_ID__ = options;
    } else if (options !== void 0) {
      this.ɵprov = ɵɵdefineInjectable({
        token: this,
        providedIn: options.providedIn || "root",
        factory: options.factory
      });
    }
  }
  /**
   * @internal
   */
  get multi() {
    return this;
  }
  toString() {
    return `InjectionToken ${this._desc}`;
  }
}
let _injectorProfilerContext;
function getInjectorProfilerContext() {
  throwError("getInjectorProfilerContext should never be called in production mode");
  return _injectorProfilerContext;
}
function setInjectorProfilerContext(context) {
  throwError("setInjectorProfilerContext should never be called in production mode");
  const previous = _injectorProfilerContext;
  _injectorProfilerContext = context;
  return previous;
}
const injectorProfilerCallbacks = [];
function injectorProfiler(event) {
  throwError("Injector profiler should never be called in production mode");
  for (let i = 0; i < injectorProfilerCallbacks.length; i++) {
    const injectorProfilerCallback = injectorProfilerCallbacks[i];
    injectorProfilerCallback(event);
  }
}
function emitProviderConfiguredEvent(eventProvider, isViewProvider = false) {
  throwError("Injector profiler should never be called in production mode");
  let token;
  if (typeof eventProvider === "function") {
    token = eventProvider;
  } else if (eventProvider instanceof InjectionToken) {
    token = eventProvider;
  } else {
    token = resolveForwardRef(eventProvider.provide);
  }
  let provider = eventProvider;
  if (eventProvider instanceof InjectionToken) {
    provider = eventProvider.ɵprov || eventProvider;
  }
  injectorProfiler({
    type: 2,
    context: getInjectorProfilerContext(),
    providerRecord: {
      token,
      provider,
      isViewProvider
    }
  });
}
function emitInjectorToCreateInstanceEvent(token) {
  throwError("Injector profiler should never be called in production mode");
  injectorProfiler({
    type: 4,
    context: getInjectorProfilerContext(),
    token
  });
}
function emitInstanceCreatedByInjectorEvent(instance) {
  throwError("Injector profiler should never be called in production mode");
  injectorProfiler({
    type: 1,
    context: getInjectorProfilerContext(),
    instance: {
      value: instance
    }
  });
}
function runInInjectorProfilerContext(injector, token, callback) {
  throwError("runInInjectorProfilerContext should never be called in production mode");
  const prevInjectContext = setInjectorProfilerContext({
    injector,
    token
  });
  try {
    callback();
  } finally {
    setInjectorProfilerContext(prevInjectContext);
  }
}
function isEnvironmentProviders(value) {
  return value && !!value.ɵproviders;
}
const NG_COMP_DEF = /* @__PURE__ */ getClosureSafeProperty({
  ɵcmp: getClosureSafeProperty
});
const NG_DIR_DEF = /* @__PURE__ */ getClosureSafeProperty({
  ɵdir: getClosureSafeProperty
});
const NG_PIPE_DEF = /* @__PURE__ */ getClosureSafeProperty({
  ɵpipe: getClosureSafeProperty
});
const NG_FACTORY_DEF = /* @__PURE__ */ getClosureSafeProperty({
  ɵfac: getClosureSafeProperty
});
const NG_ELEMENT_ID = /* @__PURE__ */ getClosureSafeProperty({
  __NG_ELEMENT_ID__: getClosureSafeProperty
});
const NG_ENV_ID = /* @__PURE__ */ getClosureSafeProperty({
  __NG_ENV_ID__: getClosureSafeProperty
});
function renderStringify(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}
function stringifyForError(value) {
  if (typeof value === "function") return value.name || value.toString();
  if (typeof value === "object" && value != null && typeof value.type === "function") {
    return value.type.name || value.type.toString();
  }
  return renderStringify(value);
}
const NG_RUNTIME_ERROR_CODE = /* @__PURE__ */ getClosureSafeProperty({
  "ngErrorCode": getClosureSafeProperty
});
const NG_RUNTIME_ERROR_MESSAGE = /* @__PURE__ */ getClosureSafeProperty({
  "ngErrorMessage": getClosureSafeProperty
});
function cyclicDependencyError(token, path) {
  const message = "";
  return createRuntimeError(message, -200);
}
function throwProviderNotFoundError(token, injectorName) {
  const errorMessage = false;
  throw new RuntimeError(-201, errorMessage);
}
function createRuntimeError(message, code, path) {
  const error = new RuntimeError(code, message);
  error[NG_RUNTIME_ERROR_CODE] = code;
  error[NG_RUNTIME_ERROR_MESSAGE] = message;
  return error;
}
function getRuntimeErrorCode(error) {
  return error[NG_RUNTIME_ERROR_CODE];
}
let _injectImplementation;
function getInjectImplementation() {
  return _injectImplementation;
}
function setInjectImplementation(impl) {
  const previous = _injectImplementation;
  _injectImplementation = impl;
  return previous;
}
function injectRootLimpMode(token, notFoundValue, flags) {
  const injectableDef = getInjectableDef(token);
  if (injectableDef && injectableDef.providedIn == "root") {
    return injectableDef.value === void 0 ? injectableDef.value = injectableDef.factory() : injectableDef.value;
  }
  if (flags & 8) return null;
  if (notFoundValue !== void 0) return notFoundValue;
  throwProviderNotFoundError();
}
const _THROW_IF_NOT_FOUND = {};
const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
const DI_DECORATOR_FLAG = "__NG_DI_FLAG__";
class RetrievingInjector {
  injector;
  constructor(injector) {
    this.injector = injector;
  }
  retrieve(token, options) {
    const flags = convertToBitFlags(options) || 0;
    try {
      return this.injector.get(
        token,
        // When a dependency is requested with an optional flag, DI returns null as the default value.
        flags & 8 ? null : THROW_IF_NOT_FOUND,
        flags
      );
    } catch (e) {
      if (isNotFound(e)) {
        return e;
      }
      throw e;
    }
  }
}
function injectInjectorOnly(token, flags = 0) {
  const currentInjector = getCurrentInjector();
  if (currentInjector === void 0) {
    throw new RuntimeError(-203, false);
  } else if (currentInjector === null) {
    return injectRootLimpMode(token, void 0, flags);
  } else {
    const options = convertToInjectOptions(flags);
    const value = currentInjector.retrieve(token, options);
    if (isNotFound(value)) {
      if (options.optional) {
        return null;
      }
      throw value;
    }
    return value;
  }
}
function ɵɵinject(token, flags = 0) {
  return (getInjectImplementation() || injectInjectorOnly)(resolveForwardRef(token), flags);
}
function inject(token, options) {
  return ɵɵinject(token, convertToBitFlags(options));
}
function convertToBitFlags(flags) {
  if (typeof flags === "undefined" || typeof flags === "number") {
    return flags;
  }
  return 0 | // comment to force a line break in the formatter
  (flags.optional && 8) | (flags.host && 1) | (flags.self && 2) | (flags.skipSelf && 4);
}
function convertToInjectOptions(flags) {
  return {
    optional: !!(flags & 8),
    host: !!(flags & 1),
    self: !!(flags & 2),
    skipSelf: !!(flags & 4)
  };
}
function injectArgs(types) {
  const args = [];
  for (let i = 0; i < types.length; i++) {
    const arg = resolveForwardRef(types[i]);
    if (Array.isArray(arg)) {
      if (arg.length === 0) {
        throw new RuntimeError(900, false);
      }
      let type = void 0;
      let flags = 0;
      for (let j = 0; j < arg.length; j++) {
        const meta = arg[j];
        const flag = getInjectFlag(meta);
        if (typeof flag === "number") {
          if (flag === -1) {
            type = meta.token;
          } else {
            flags |= flag;
          }
        } else {
          type = meta;
        }
      }
      args.push(ɵɵinject(type, flags));
    } else {
      args.push(ɵɵinject(arg));
    }
  }
  return args;
}
function getInjectFlag(token) {
  return token[DI_DECORATOR_FLAG];
}
function getFactoryDef(type, throwNotFound) {
  const hasFactoryDef = type.hasOwnProperty(NG_FACTORY_DEF);
  if (!hasFactoryDef && throwNotFound === true && false) {
    throw new Error(`Type ${stringify(type)} does not have 'ɵfac' property.`);
  }
  return hasFactoryDef ? type[NG_FACTORY_DEF] : null;
}
function deepForEach(input, fn) {
  input.forEach((value) => Array.isArray(value) ? deepForEach(value, fn) : fn(value));
}
function removeFromArray(arr, index) {
  if (index >= arr.length - 1) {
    return arr.pop();
  } else {
    return arr.splice(index, 1)[0];
  }
}
const EMPTY_OBJ = {};
const EMPTY_ARRAY = [];
const ENVIRONMENT_INITIALIZER = /* @__PURE__ */ new InjectionToken("");
const INJECTOR$1 = /* @__PURE__ */ new InjectionToken(
  "",
  // Disable tslint because this is const enum which gets inlined not top level prop access.
  // tslint:disable-next-line: no-toplevel-property-access
  -1
  /* InjectorMarkers.Injector */
);
const INJECTOR_DEF_TYPES = /* @__PURE__ */ new InjectionToken("");
class NullInjector {
  get(token, notFoundValue = THROW_IF_NOT_FOUND) {
    if (notFoundValue === THROW_IF_NOT_FOUND) {
      const message = "";
      const error = createRuntimeError(
        message,
        -201
        /* RuntimeErrorCode.PROVIDER_NOT_FOUND */
      );
      error.name = "ɵNotFound";
      throw error;
    }
    return notFoundValue;
  }
}
function getComponentDef(type) {
  return type[NG_COMP_DEF] || null;
}
function getDirectiveDef(type) {
  return type[NG_DIR_DEF] || null;
}
function getPipeDef(type) {
  return type[NG_PIPE_DEF] || null;
}
function importProvidersFrom(...sources) {
  return {
    ɵproviders: internalImportProvidersFrom(true, sources),
    ɵfromNgModule: true
  };
}
function internalImportProvidersFrom(checkForStandaloneCmp, ...sources) {
  const providersOut = [];
  const dedup = /* @__PURE__ */ new Set();
  let injectorTypesWithProviders;
  const collectProviders = (provider) => {
    providersOut.push(provider);
  };
  deepForEach(sources, (source) => {
    const internalSource = source;
    if (walkProviderTree(internalSource, collectProviders, [], dedup)) {
      injectorTypesWithProviders ||= [];
      injectorTypesWithProviders.push(internalSource);
    }
  });
  if (injectorTypesWithProviders !== void 0) {
    processInjectorTypesWithProviders(injectorTypesWithProviders, collectProviders);
  }
  return providersOut;
}
function processInjectorTypesWithProviders(typesWithProviders, visitor) {
  for (let i = 0; i < typesWithProviders.length; i++) {
    const {
      ngModule,
      providers
    } = typesWithProviders[i];
    deepForEachProvider(providers, (provider) => {
      visitor(provider, ngModule);
    });
  }
}
function walkProviderTree(container, visitor, parents, dedup) {
  container = resolveForwardRef(container);
  if (!container) return false;
  let defType = null;
  let injDef = getInjectorDef(container);
  const cmpDef = !injDef && getComponentDef(container);
  if (!injDef && !cmpDef) {
    const ngModule = container.ngModule;
    injDef = getInjectorDef(ngModule);
    if (injDef) {
      defType = ngModule;
    } else {
      return false;
    }
  } else if (cmpDef && !cmpDef.standalone) {
    return false;
  } else {
    defType = container;
  }
  const isDuplicate = dedup.has(defType);
  if (cmpDef) {
    if (isDuplicate) {
      return false;
    }
    dedup.add(defType);
    if (cmpDef.dependencies) {
      const deps = typeof cmpDef.dependencies === "function" ? cmpDef.dependencies() : cmpDef.dependencies;
      for (const dep of deps) {
        walkProviderTree(dep, visitor, parents, dedup);
      }
    }
  } else if (injDef) {
    if (injDef.imports != null && !isDuplicate) {
      dedup.add(defType);
      let importTypesWithProviders;
      try {
        deepForEach(injDef.imports, (imported) => {
          if (walkProviderTree(imported, visitor, parents, dedup)) {
            importTypesWithProviders ||= [];
            importTypesWithProviders.push(imported);
          }
        });
      } finally {
      }
      if (importTypesWithProviders !== void 0) {
        processInjectorTypesWithProviders(importTypesWithProviders, visitor);
      }
    }
    if (!isDuplicate) {
      const factory = getFactoryDef(defType) || (() => new defType());
      visitor({
        provide: defType,
        useFactory: factory,
        deps: EMPTY_ARRAY
      }, defType);
      visitor({
        provide: INJECTOR_DEF_TYPES,
        useValue: defType,
        multi: true
      }, defType);
      visitor({
        provide: ENVIRONMENT_INITIALIZER,
        useValue: () => ɵɵinject(defType),
        multi: true
      }, defType);
    }
    const defProviders = injDef.providers;
    if (defProviders != null && !isDuplicate) {
      const injectorType = container;
      deepForEachProvider(defProviders, (provider) => {
        visitor(provider, injectorType);
      });
    }
  } else {
    return false;
  }
  return defType !== container && container.providers !== void 0;
}
function deepForEachProvider(providers, fn) {
  for (let provider of providers) {
    if (isEnvironmentProviders(provider)) {
      provider = provider.ɵproviders;
    }
    if (Array.isArray(provider)) {
      deepForEachProvider(provider, fn);
    } else {
      fn(provider);
    }
  }
}
const USE_VALUE = /* @__PURE__ */ getClosureSafeProperty({
  provide: String,
  useValue: getClosureSafeProperty
});
function isValueProvider(value) {
  return value !== null && typeof value == "object" && USE_VALUE in value;
}
function isExistingProvider(value) {
  return !!(value && value.useExisting);
}
function isFactoryProvider(value) {
  return !!(value && value.useFactory);
}
function isTypeProvider(value) {
  return typeof value === "function";
}
const INJECTOR_SCOPE = /* @__PURE__ */ new InjectionToken("");
const NOT_YET = {};
const CIRCULAR = {};
let NULL_INJECTOR = void 0;
function getNullInjector() {
  if (NULL_INJECTOR === void 0) {
    NULL_INJECTOR = new NullInjector();
  }
  return NULL_INJECTOR;
}
class EnvironmentInjector {
}
class R3Injector extends EnvironmentInjector {
  parent;
  source;
  scopes;
  /**
   * Map of tokens to records which contain the instances of those tokens.
   * - `null` value implies that we don't have the record. Used by tree-shakable injectors
   * to prevent further searches.
   */
  records = /* @__PURE__ */ new Map();
  /**
   * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
   */
  _ngOnDestroyHooks = /* @__PURE__ */ new Set();
  _onDestroyHooks = [];
  /**
   * Flag indicating that this injector was previously destroyed.
   */
  get destroyed() {
    return this._destroyed;
  }
  _destroyed = false;
  injectorDefTypes;
  constructor(providers, parent, source, scopes) {
    super();
    this.parent = parent;
    this.source = source;
    this.scopes = scopes;
    forEachSingleProvider(providers, (provider) => this.processProvider(provider));
    this.records.set(INJECTOR$1, makeRecord(void 0, this));
    if (scopes.has("environment")) {
      this.records.set(EnvironmentInjector, makeRecord(void 0, this));
    }
    const record = this.records.get(INJECTOR_SCOPE);
    if (record != null && typeof record.value === "string") {
      this.scopes.add(record.value);
    }
    this.injectorDefTypes = new Set(this.get(INJECTOR_DEF_TYPES, EMPTY_ARRAY, {
      self: true
    }));
  }
  retrieve(token, options) {
    const flags = convertToBitFlags(options) || 0;
    try {
      return this.get(
        token,
        // When a dependency is requested with an optional flag, DI returns null as the default value.
        THROW_IF_NOT_FOUND,
        flags
      );
    } catch (e) {
      if (isNotFound(e)) {
        return e;
      }
      throw e;
    }
  }
  /**
   * Destroy the injector and release references to every instance or provider associated with it.
   *
   * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
   * hook was found.
   */
  destroy() {
    assertNotDestroyed(this);
    this._destroyed = true;
    const prevConsumer = setActiveConsumer(null);
    try {
      for (const service of this._ngOnDestroyHooks) {
        service.ngOnDestroy();
      }
      const onDestroyHooks = this._onDestroyHooks;
      this._onDestroyHooks = [];
      for (const hook of onDestroyHooks) {
        hook();
      }
    } finally {
      this.records.clear();
      this._ngOnDestroyHooks.clear();
      this.injectorDefTypes.clear();
      setActiveConsumer(prevConsumer);
    }
  }
  onDestroy(callback) {
    assertNotDestroyed(this);
    this._onDestroyHooks.push(callback);
    return () => this.removeOnDestroy(callback);
  }
  runInContext(fn) {
    assertNotDestroyed(this);
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(void 0);
    try {
      return fn();
    } finally {
      setCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
    }
  }
  get(token, notFoundValue = THROW_IF_NOT_FOUND, options) {
    assertNotDestroyed(this);
    if (token.hasOwnProperty(NG_ENV_ID)) {
      return token[NG_ENV_ID](this);
    }
    const flags = convertToBitFlags(options);
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(void 0);
    try {
      if (!(flags & 4)) {
        let record = this.records.get(token);
        if (record === void 0) {
          const def = couldBeInjectableType(token) && getInjectableDef(token);
          if (def && this.injectableDefInScope(def)) {
            if (false) ;
            record = makeRecord(injectableDefOrInjectorDefFactory(token), NOT_YET);
          } else {
            record = null;
          }
          this.records.set(token, record);
        }
        if (record != null) {
          return this.hydrate(token, record, flags);
        }
      }
      const nextInjector = !(flags & 2) ? this.parent : getNullInjector();
      notFoundValue = flags & 8 && notFoundValue === THROW_IF_NOT_FOUND ? null : notFoundValue;
      return nextInjector.get(token, notFoundValue);
    } catch (error) {
      const errorCode = getRuntimeErrorCode(error);
      if (errorCode === -200 || errorCode === -201) {
        {
          throw new RuntimeError(errorCode, null);
        }
      } else {
        throw error;
      }
    } finally {
      setInjectImplementation(previousInjectImplementation);
      setCurrentInjector(previousInjector);
    }
  }
  /** @internal */
  resolveInjectorInitializers() {
    const prevConsumer = setActiveConsumer(null);
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(void 0);
    try {
      const initializers = this.get(ENVIRONMENT_INITIALIZER, EMPTY_ARRAY, {
        self: true
      });
      if (false) ;
      for (const initializer of initializers) {
        initializer();
      }
    } finally {
      setCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
      setActiveConsumer(prevConsumer);
    }
  }
  toString() {
    const tokens = [];
    const records = this.records;
    for (const token of records.keys()) {
      tokens.push(stringify(token));
    }
    return `R3Injector[${tokens.join(", ")}]`;
  }
  /**
   * Process a `SingleProvider` and add it.
   */
  processProvider(provider) {
    provider = resolveForwardRef(provider);
    let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider && provider.provide);
    const record = providerToRecord(provider);
    if (!isTypeProvider(provider) && provider.multi === true) {
      let multiRecord = this.records.get(token);
      if (multiRecord) ; else {
        multiRecord = makeRecord(void 0, NOT_YET, true);
        multiRecord.factory = () => injectArgs(multiRecord.multi);
        this.records.set(token, multiRecord);
      }
      token = provider;
      multiRecord.multi.push(provider);
    }
    this.records.set(token, record);
  }
  hydrate(token, record, flags) {
    const prevConsumer = setActiveConsumer(null);
    try {
      if (record.value === CIRCULAR) {
        throw cyclicDependencyError(stringify(token));
      } else if (record.value === NOT_YET) {
        record.value = CIRCULAR;
        if (false) ; else {
          record.value = record.factory(void 0, flags);
        }
      }
      if (typeof record.value === "object" && record.value && hasOnDestroy(record.value)) {
        this._ngOnDestroyHooks.add(record.value);
      }
      return record.value;
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
  injectableDefInScope(def) {
    if (!def.providedIn) {
      return false;
    }
    const providedIn = resolveForwardRef(def.providedIn);
    if (typeof providedIn === "string") {
      return providedIn === "any" || this.scopes.has(providedIn);
    } else {
      return this.injectorDefTypes.has(providedIn);
    }
  }
  removeOnDestroy(callback) {
    const destroyCBIdx = this._onDestroyHooks.indexOf(callback);
    if (destroyCBIdx !== -1) {
      this._onDestroyHooks.splice(destroyCBIdx, 1);
    }
  }
}
function injectableDefOrInjectorDefFactory(token) {
  const injectableDef = getInjectableDef(token);
  const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);
  if (factory !== null) {
    return factory;
  }
  if (token instanceof InjectionToken) {
    throw new RuntimeError(204, false);
  }
  if (token instanceof Function) {
    return getUndecoratedInjectableFactory(token);
  }
  throw new RuntimeError(204, false);
}
function getUndecoratedInjectableFactory(token) {
  const paramLength = token.length;
  if (paramLength > 0) {
    throw new RuntimeError(204, false);
  }
  const inheritedInjectableDef = getInheritedInjectableDef(token);
  if (inheritedInjectableDef !== null) {
    return () => inheritedInjectableDef.factory(token);
  } else {
    return () => new token();
  }
}
function providerToRecord(provider) {
  if (isValueProvider(provider)) {
    return makeRecord(void 0, provider.useValue);
  } else {
    const factory = providerToFactory(provider);
    return makeRecord(factory, NOT_YET);
  }
}
function providerToFactory(provider, ngModuleType, providers) {
  let factory = void 0;
  if (isTypeProvider(provider)) {
    const unwrappedProvider = resolveForwardRef(provider);
    return getFactoryDef(unwrappedProvider) || injectableDefOrInjectorDefFactory(unwrappedProvider);
  } else {
    if (isValueProvider(provider)) {
      factory = () => resolveForwardRef(provider.useValue);
    } else if (isFactoryProvider(provider)) {
      factory = () => provider.useFactory(...injectArgs(provider.deps || []));
    } else if (isExistingProvider(provider)) {
      factory = (_, flags) => ɵɵinject(resolveForwardRef(provider.useExisting), flags !== void 0 && flags & 8 ? 8 : void 0);
    } else {
      const classRef = resolveForwardRef(provider && (provider.useClass || provider.provide));
      if (hasDeps(provider)) {
        factory = () => new classRef(...injectArgs(provider.deps));
      } else {
        return getFactoryDef(classRef) || injectableDefOrInjectorDefFactory(classRef);
      }
    }
  }
  return factory;
}
function assertNotDestroyed(injector) {
  if (injector.destroyed) {
    throw new RuntimeError(205, false);
  }
}
function makeRecord(factory, value, multi = false) {
  return {
    factory,
    value,
    multi: multi ? [] : void 0
  };
}
function hasDeps(value) {
  return !!value.deps;
}
function hasOnDestroy(value) {
  return value !== null && typeof value === "object" && typeof value.ngOnDestroy === "function";
}
function couldBeInjectableType(value) {
  return typeof value === "function" || typeof value === "object" && value.ngMetadataName === "InjectionToken";
}
function forEachSingleProvider(providers, fn) {
  for (const provider of providers) {
    if (Array.isArray(provider)) {
      forEachSingleProvider(provider, fn);
    } else if (provider && isEnvironmentProviders(provider)) {
      forEachSingleProvider(provider.ɵproviders, fn);
    } else {
      fn(provider);
    }
  }
}
function runInInjectionContext(injector, fn) {
  let internalInjector;
  if (injector instanceof R3Injector) {
    assertNotDestroyed(injector);
    internalInjector = injector;
  } else {
    internalInjector = new RetrievingInjector(injector);
  }
  const prevInjector = setCurrentInjector(internalInjector);
  const previousInjectImplementation = setInjectImplementation(void 0);
  try {
    return fn();
  } finally {
    setCurrentInjector(prevInjector);
    setInjectImplementation(previousInjectImplementation);
  }
}
function isInInjectionContext() {
  return getInjectImplementation() !== void 0 || getCurrentInjector() != null;
}
const HOST = 0;
const TVIEW = 1;
const FLAGS = 2;
const PARENT = 3;
const NEXT = 4;
const T_HOST = 5;
const HYDRATION = 6;
const CLEANUP = 7;
const CONTEXT = 8;
const INJECTOR = 9;
const ENVIRONMENT = 10;
const RENDERER = 11;
const CHILD_HEAD = 12;
const CHILD_TAIL = 13;
const DECLARATION_VIEW = 14;
const DECLARATION_COMPONENT_VIEW = 15;
const DECLARATION_LCONTAINER = 16;
const PREORDER_HOOK_FLAGS = 17;
const QUERIES = 18;
const ID = 19;
const EMBEDDED_VIEW_INJECTOR = 20;
const ON_DESTROY_HOOKS = 21;
const EFFECTS_TO_SCHEDULE = 22;
const EFFECTS = 23;
const REACTIVE_TEMPLATE_CONSUMER = 24;
const AFTER_RENDER_SEQUENCES_TO_ADD = 25;
const ANIMATIONS = 26;
const HEADER_OFFSET = 27;
const TYPE = 1;
const NATIVE = 7;
const VIEW_REFS = 8;
const MOVED_VIEWS = 9;
const CONTAINER_HEADER_OFFSET = 10;
function isLView(value) {
  return Array.isArray(value) && typeof value[TYPE] === "object";
}
function isLContainer(value) {
  return Array.isArray(value) && value[TYPE] === true;
}
function isContentQueryHost(tNode) {
  return (tNode.flags & 4) !== 0;
}
function isComponentHost(tNode) {
  return tNode.componentOffset > -1;
}
function isDirectiveHost(tNode) {
  return (tNode.flags & 1) === 1;
}
function isComponentDef(def) {
  return !!def.template;
}
function isRootView(target) {
  return (target[FLAGS] & 512) !== 0;
}
function isDestroyed(lView) {
  return (lView[FLAGS] & 256) === 256;
}
const SVG_NAMESPACE = "svg";
const MATH_ML_NAMESPACE = "math";
function unwrapRNode(value) {
  while (Array.isArray(value)) {
    value = value[HOST];
  }
  return value;
}
function getNativeByIndex(index, lView) {
  return unwrapRNode(lView[index]);
}
function getNativeByTNode(tNode, lView) {
  const node = unwrapRNode(lView[tNode.index]);
  return node;
}
function getTNode(tView, index) {
  const tNode = tView.data[index];
  return tNode;
}
function getComponentLViewByIndex(nodeIndex, hostView) {
  const slotValue = hostView[nodeIndex];
  const lView = isLView(slotValue) ? slotValue : slotValue[HOST];
  return lView;
}
function viewAttachedToChangeDetector(view) {
  return (view[FLAGS] & 128) === 128;
}
function getConstant(consts, index) {
  if (index === null || index === void 0) return null;
  return consts[index];
}
function resetPreOrderHookFlags(lView) {
  lView[PREORDER_HOOK_FLAGS] = 0;
}
function markViewForRefresh(lView) {
  if (lView[FLAGS] & 1024) {
    return;
  }
  lView[FLAGS] |= 1024;
  if (viewAttachedToChangeDetector(lView)) {
    markAncestorsForTraversal(lView);
  }
}
function requiresRefreshOrTraversal(lView) {
  return !!(lView[FLAGS] & (1024 | 8192) || lView[REACTIVE_TEMPLATE_CONSUMER]?.dirty);
}
function updateAncestorTraversalFlagsOnAttach(lView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(
    8
    /* NotificationSource.ViewAttached */
  );
  if (lView[FLAGS] & 64) {
    lView[FLAGS] |= 1024;
  }
  if (requiresRefreshOrTraversal(lView)) {
    markAncestorsForTraversal(lView);
  }
}
function markAncestorsForTraversal(lView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(
    0
    /* NotificationSource.MarkAncestorsForTraversal */
  );
  let parent = getLViewParent(lView);
  while (parent !== null) {
    if (parent[FLAGS] & 8192) {
      break;
    }
    parent[FLAGS] |= 8192;
    if (!viewAttachedToChangeDetector(parent)) {
      break;
    }
    parent = getLViewParent(parent);
  }
}
function storeLViewOnDestroy(lView, onDestroyCallback) {
  if (isDestroyed(lView)) {
    throw new RuntimeError(911, false);
  }
  if (lView[ON_DESTROY_HOOKS] === null) {
    lView[ON_DESTROY_HOOKS] = [];
  }
  lView[ON_DESTROY_HOOKS].push(onDestroyCallback);
}
function removeLViewOnDestroy(lView, onDestroyCallback) {
  if (lView[ON_DESTROY_HOOKS] === null) return;
  const destroyCBIdx = lView[ON_DESTROY_HOOKS].indexOf(onDestroyCallback);
  if (destroyCBIdx !== -1) {
    lView[ON_DESTROY_HOOKS].splice(destroyCBIdx, 1);
  }
}
function getLViewParent(lView) {
  const parent = lView[PARENT];
  return isLContainer(parent) ? parent[PARENT] : parent;
}
const instructionState = {
  lFrame: /* @__PURE__ */ createLFrame(null),
  skipHydrationRootTNode: null
};
let _isRefreshingViews = false;
function getElementDepthCount() {
  return instructionState.lFrame.elementDepthCount;
}
function increaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount++;
}
function decreaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount--;
}
function isInSkipHydrationBlock() {
  return instructionState.skipHydrationRootTNode !== null;
}
function isSkipHydrationRootTNode(tNode) {
  return instructionState.skipHydrationRootTNode === tNode;
}
function leaveSkipHydrationBlock() {
  instructionState.skipHydrationRootTNode = null;
}
function getLView() {
  return instructionState.lFrame.lView;
}
function getTView() {
  return instructionState.lFrame.tView;
}
function getCurrentTNode() {
  let currentTNode = getCurrentTNodePlaceholderOk();
  while (currentTNode !== null && currentTNode.type === 64) {
    currentTNode = currentTNode.parent;
  }
  return currentTNode;
}
function getCurrentTNodePlaceholderOk() {
  return instructionState.lFrame.currentTNode;
}
function getCurrentParentTNode() {
  const lFrame = instructionState.lFrame;
  const currentTNode = lFrame.currentTNode;
  return lFrame.isParent ? currentTNode : currentTNode.parent;
}
function setCurrentTNode(tNode, isParent) {
  const lFrame = instructionState.lFrame;
  lFrame.currentTNode = tNode;
  lFrame.isParent = isParent;
}
function isCurrentTNodeParent() {
  return instructionState.lFrame.isParent;
}
function setCurrentTNodeAsNotParent() {
  instructionState.lFrame.isParent = false;
}
function isRefreshingViews() {
  return _isRefreshingViews;
}
function setIsRefreshingViews(mode) {
  const prev = _isRefreshingViews;
  _isRefreshingViews = mode;
  return prev;
}
function setBindingIndex(value) {
  return instructionState.lFrame.bindingIndex = value;
}
function nextBindingIndex() {
  return instructionState.lFrame.bindingIndex++;
}
function isInI18nBlock() {
  return instructionState.lFrame.inI18n;
}
function setBindingRootForHostBindings(bindingRootIndex, currentDirectiveIndex) {
  const lFrame = instructionState.lFrame;
  lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
  setCurrentDirectiveIndex(currentDirectiveIndex);
}
function getCurrentDirectiveIndex() {
  return instructionState.lFrame.currentDirectiveIndex;
}
function setCurrentDirectiveIndex(currentDirectiveIndex) {
  instructionState.lFrame.currentDirectiveIndex = currentDirectiveIndex;
}
function setCurrentQueryIndex(value) {
  instructionState.lFrame.currentQueryIndex = value;
}
function getDeclarationTNode(lView) {
  const tView = lView[TVIEW];
  if (tView.type === 2) {
    return tView.declTNode;
  }
  if (tView.type === 1) {
    return lView[T_HOST];
  }
  return null;
}
function enterDI(lView, tNode, flags) {
  if (flags & 4) {
    let parentTNode = tNode;
    let parentLView = lView;
    while (true) {
      parentTNode = parentTNode.parent;
      if (parentTNode === null && !(flags & 1)) {
        parentTNode = getDeclarationTNode(parentLView);
        if (parentTNode === null) break;
        parentLView = parentLView[DECLARATION_VIEW];
        if (parentTNode.type & (2 | 8)) {
          break;
        }
      } else {
        break;
      }
    }
    if (parentTNode === null) {
      return false;
    } else {
      tNode = parentTNode;
      lView = parentLView;
    }
  }
  const lFrame = instructionState.lFrame = allocLFrame();
  lFrame.currentTNode = tNode;
  lFrame.lView = lView;
  return true;
}
function enterView(newView) {
  const newLFrame = allocLFrame();
  const tView = newView[TVIEW];
  instructionState.lFrame = newLFrame;
  newLFrame.currentTNode = tView.firstChild;
  newLFrame.lView = newView;
  newLFrame.tView = tView;
  newLFrame.contextLView = newView;
  newLFrame.bindingIndex = tView.bindingStartIndex;
  newLFrame.inI18n = false;
}
function allocLFrame() {
  const currentLFrame = instructionState.lFrame;
  const childLFrame = currentLFrame === null ? null : currentLFrame.child;
  const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
  return newLFrame;
}
function createLFrame(parent) {
  const lFrame = {
    currentTNode: null,
    isParent: true,
    lView: null,
    tView: null,
    selectedIndex: -1,
    contextLView: null,
    elementDepthCount: 0,
    currentNamespace: null,
    currentDirectiveIndex: -1,
    bindingRootIndex: -1,
    bindingIndex: -1,
    currentQueryIndex: 0,
    parent,
    child: null,
    inI18n: false
  };
  parent !== null && (parent.child = lFrame);
  return lFrame;
}
function leaveViewLight() {
  const oldLFrame = instructionState.lFrame;
  instructionState.lFrame = oldLFrame.parent;
  oldLFrame.currentTNode = null;
  oldLFrame.lView = null;
  return oldLFrame;
}
const leaveDI = leaveViewLight;
function leaveView() {
  const oldLFrame = leaveViewLight();
  oldLFrame.isParent = true;
  oldLFrame.tView = null;
  oldLFrame.selectedIndex = -1;
  oldLFrame.contextLView = null;
  oldLFrame.elementDepthCount = 0;
  oldLFrame.currentDirectiveIndex = -1;
  oldLFrame.currentNamespace = null;
  oldLFrame.bindingRootIndex = -1;
  oldLFrame.bindingIndex = -1;
  oldLFrame.currentQueryIndex = 0;
}
function getSelectedIndex() {
  return instructionState.lFrame.selectedIndex;
}
function setSelectedIndex(index) {
  instructionState.lFrame.selectedIndex = index;
}
function getNamespace() {
  return instructionState.lFrame.currentNamespace;
}
let _wasLastNodeCreated = true;
function wasLastNodeCreated() {
  return _wasLastNodeCreated;
}
function lastNodeWasCreated(flag) {
  _wasLastNodeCreated = flag;
}
function createInjector(defType, parent = null, additionalProviders = null, name) {
  const injector = createInjectorWithoutInjectorInstances(defType, parent, additionalProviders, name);
  injector.resolveInjectorInitializers();
  return injector;
}
function createInjectorWithoutInjectorInstances(defType, parent = null, additionalProviders = null, name, scopes = /* @__PURE__ */ new Set()) {
  const providers = [additionalProviders || EMPTY_ARRAY, importProvidersFrom(defType)];
  name = name || (typeof defType === "object" ? void 0 : stringify(defType));
  return new R3Injector(providers, parent || getNullInjector(), name || null, scopes);
}
class Injector {
  static THROW_IF_NOT_FOUND = THROW_IF_NOT_FOUND;
  static NULL = /* @__PURE__ */ new NullInjector();
  static create(options, parent) {
    if (Array.isArray(options)) {
      return createInjector({
        name: ""
      }, parent, options, "");
    } else {
      const name = options.name ?? "";
      return createInjector({
        name
      }, options.parent, options.providers, name);
    }
  }
  /** @nocollapse */
  static ɵprov = (
    /** @pureOrBreakMyCode */
    /* @__PURE__ */ ɵɵdefineInjectable({
      token: Injector,
      providedIn: "any",
      factory: () => ɵɵinject(INJECTOR$1)
    })
  );
  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = -1;
}
const DOCUMENT$1 = /* @__PURE__ */ new InjectionToken("");
let DestroyRef = /* @__PURE__ */ (() => {
  class DestroyRef2 {
    /**
     * @internal
     * @nocollapse
     */
    static __NG_ELEMENT_ID__ = injectDestroyRef;
    /**
     * @internal
     * @nocollapse
     */
    static __NG_ENV_ID__ = (injector) => injector;
  }
  return DestroyRef2;
})();
class NodeInjectorDestroyRef extends DestroyRef {
  _lView;
  constructor(_lView) {
    super();
    this._lView = _lView;
  }
  get destroyed() {
    return isDestroyed(this._lView);
  }
  onDestroy(callback) {
    const lView = this._lView;
    storeLViewOnDestroy(lView, callback);
    return () => removeLViewOnDestroy(lView, callback);
  }
}
function injectDestroyRef() {
  return new NodeInjectorDestroyRef(getLView());
}
class ErrorHandler {
  /**
   * @internal
   */
  _console = console;
  handleError(error) {
    this._console.error("ERROR", error);
  }
}
const INTERNAL_APPLICATION_ERROR_HANDLER = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => {
    const injector = inject(EnvironmentInjector);
    let userErrorHandler;
    return (e) => {
      if (injector.destroyed && !userErrorHandler) {
        setTimeout(() => {
          throw e;
        });
      } else {
        userErrorHandler ??= injector.get(ErrorHandler);
        userErrorHandler.handleError(e);
      }
    };
  }
});
const errorHandlerEnvironmentInitializer = {
  provide: ENVIRONMENT_INITIALIZER,
  useValue: () => void inject(ErrorHandler),
  multi: true
};
class ChangeDetectionScheduler {
}
const ZONELESS_ENABLED = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => false
});
const ZONELESS_SCHEDULER_DISABLED = /* @__PURE__ */ new InjectionToken("");
const SCHEDULE_IN_ROOT_ZONE = /* @__PURE__ */ new InjectionToken("");
let PendingTasksInternal = /* @__PURE__ */ (() => {
  class PendingTasksInternal2 {
    taskId = 0;
    pendingTasks = /* @__PURE__ */ new Set();
    destroyed = false;
    pendingTask = new BehaviorSubject(false);
    get hasPendingTasks() {
      return this.destroyed ? false : this.pendingTask.value;
    }
    /**
     * In case the service is about to be destroyed, return a self-completing observable.
     * Otherwise, return the observable that emits the current state of pending tasks.
     */
    get hasPendingTasksObservable() {
      if (this.destroyed) {
        return new Observable((subscriber) => {
          subscriber.next(false);
          subscriber.complete();
        });
      }
      return this.pendingTask;
    }
    add() {
      if (!this.hasPendingTasks && !this.destroyed) {
        this.pendingTask.next(true);
      }
      const taskId = this.taskId++;
      this.pendingTasks.add(taskId);
      return taskId;
    }
    has(taskId) {
      return this.pendingTasks.has(taskId);
    }
    remove(taskId) {
      this.pendingTasks.delete(taskId);
      if (this.pendingTasks.size === 0 && this.hasPendingTasks) {
        this.pendingTask.next(false);
      }
    }
    ngOnDestroy() {
      this.pendingTasks.clear();
      if (this.hasPendingTasks) {
        this.pendingTask.next(false);
      }
      this.destroyed = true;
      this.pendingTask.unsubscribe();
    }
    /** @nocollapse */
    static ɵprov = (
      /** @pureOrBreakMyCode */
      /* @__PURE__ */ ɵɵdefineInjectable({
        token: PendingTasksInternal2,
        providedIn: "root",
        factory: () => new PendingTasksInternal2()
      })
    );
  }
  return PendingTasksInternal2;
})();
function noop(...args) {
}
let EffectScheduler = /* @__PURE__ */ (() => {
  class EffectScheduler2 {
    /** @nocollapse */
    static ɵprov = (
      /** @pureOrBreakMyCode */
      /* @__PURE__ */ ɵɵdefineInjectable({
        token: EffectScheduler2,
        providedIn: "root",
        factory: () => new ZoneAwareEffectScheduler()
      })
    );
  }
  return EffectScheduler2;
})();
class ZoneAwareEffectScheduler {
  dirtyEffectCount = 0;
  queues = /* @__PURE__ */ new Map();
  add(handle) {
    this.enqueue(handle);
    this.schedule(handle);
  }
  schedule(handle) {
    if (!handle.dirty) {
      return;
    }
    this.dirtyEffectCount++;
  }
  remove(handle) {
    const zone = handle.zone;
    const queue = this.queues.get(zone);
    if (!queue.has(handle)) {
      return;
    }
    queue.delete(handle);
    if (handle.dirty) {
      this.dirtyEffectCount--;
    }
  }
  enqueue(handle) {
    const zone = handle.zone;
    if (!this.queues.has(zone)) {
      this.queues.set(zone, /* @__PURE__ */ new Set());
    }
    const queue = this.queues.get(zone);
    if (queue.has(handle)) {
      return;
    }
    queue.add(handle);
  }
  /**
   * Run all scheduled effects.
   *
   * Execution order of effects within the same zone is guaranteed to be FIFO, but there is no
   * ordering guarantee between effects scheduled in different zones.
   */
  flush() {
    while (this.dirtyEffectCount > 0) {
      let ranOneEffect = false;
      for (const [zone, queue] of this.queues) {
        if (zone === null) {
          ranOneEffect ||= this.flushQueue(queue);
        } else {
          ranOneEffect ||= zone.run(() => this.flushQueue(queue));
        }
      }
      if (!ranOneEffect) {
        this.dirtyEffectCount = 0;
      }
    }
  }
  flushQueue(queue) {
    let ranOneEffect = false;
    for (const handle of queue) {
      if (!handle.dirty) {
        continue;
      }
      this.dirtyEffectCount--;
      ranOneEffect = true;
      handle.run();
    }
    return ranOneEffect;
  }
}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
function noSideEffects(fn) {
  return {
    toString: fn
  }.toString();
}
class SimpleChange {
  previousValue;
  currentValue;
  firstChange;
  constructor(previousValue, currentValue, firstChange) {
    this.previousValue = previousValue;
    this.currentValue = currentValue;
    this.firstChange = firstChange;
  }
  /**
   * Check whether the new value is the first value assigned.
   */
  isFirstChange() {
    return this.firstChange;
  }
}
function applyValueToInputField(instance, inputSignalNode, privateName, value) {
  if (inputSignalNode !== null) {
    inputSignalNode.applyValueToInputSignal(inputSignalNode, value);
  } else {
    instance[privateName] = value;
  }
}
function NgOnChangesFeatureImpl(definition) {
  if (definition.type.prototype.ngOnChanges) {
    definition.setInput = ngOnChangesSetInput;
  }
  return rememberChangeHistoryAndInvokeOnChangesHook;
}
function rememberChangeHistoryAndInvokeOnChangesHook() {
  const simpleChangesStore = getSimpleChangesStore(this);
  const current = simpleChangesStore?.current;
  if (current) {
    const previous = simpleChangesStore.previous;
    if (previous === EMPTY_OBJ) {
      simpleChangesStore.previous = current;
    } else {
      for (let key in current) {
        previous[key] = current[key];
      }
    }
    simpleChangesStore.current = null;
    this.ngOnChanges(current);
  }
}
function ngOnChangesSetInput(instance, inputSignalNode, value, publicName, privateName) {
  const declaredName = this.declaredInputs[publicName];
  const simpleChangesStore = getSimpleChangesStore(instance) || setSimpleChangesStore(instance, {
    previous: EMPTY_OBJ,
    current: null
  });
  const current = simpleChangesStore.current || (simpleChangesStore.current = {});
  const previous = simpleChangesStore.previous;
  const previousChange = previous[declaredName];
  current[declaredName] = new SimpleChange(previousChange && previousChange.currentValue, value, previous === EMPTY_OBJ);
  applyValueToInputField(instance, inputSignalNode, privateName, value);
}
const SIMPLE_CHANGES_STORE = "__ngSimpleChanges__";
function getSimpleChangesStore(instance) {
  return instance[SIMPLE_CHANGES_STORE] || null;
}
function setSimpleChangesStore(instance, store2) {
  return instance[SIMPLE_CHANGES_STORE] = store2;
}
const profilerCallbacks = [];
const profiler = function(event, instance = null, eventFn) {
  for (let i = 0; i < profilerCallbacks.length; i++) {
    const profilerCallback = profilerCallbacks[i];
    profilerCallback(event, instance, eventFn);
  }
};
function registerPreOrderHooks(directiveIndex, directiveDef, tView) {
  const {
    ngOnChanges,
    ngOnInit,
    ngDoCheck
  } = directiveDef.type.prototype;
  if (ngOnChanges) {
    const wrappedOnChanges = NgOnChangesFeatureImpl(directiveDef);
    (tView.preOrderHooks ??= []).push(directiveIndex, wrappedOnChanges);
    (tView.preOrderCheckHooks ??= []).push(directiveIndex, wrappedOnChanges);
  }
  if (ngOnInit) {
    (tView.preOrderHooks ??= []).push(0 - directiveIndex, ngOnInit);
  }
  if (ngDoCheck) {
    (tView.preOrderHooks ??= []).push(directiveIndex, ngDoCheck);
    (tView.preOrderCheckHooks ??= []).push(directiveIndex, ngDoCheck);
  }
}
function registerPostOrderHooks(tView, tNode) {
  for (let i = tNode.directiveStart, end = tNode.directiveEnd; i < end; i++) {
    const directiveDef = tView.data[i];
    const lifecycleHooks = directiveDef.type.prototype;
    const {
      ngAfterContentInit,
      ngAfterContentChecked,
      ngAfterViewInit,
      ngAfterViewChecked,
      ngOnDestroy
    } = lifecycleHooks;
    if (ngAfterContentInit) {
      (tView.contentHooks ??= []).push(-i, ngAfterContentInit);
    }
    if (ngAfterContentChecked) {
      (tView.contentHooks ??= []).push(i, ngAfterContentChecked);
      (tView.contentCheckHooks ??= []).push(i, ngAfterContentChecked);
    }
    if (ngAfterViewInit) {
      (tView.viewHooks ??= []).push(-i, ngAfterViewInit);
    }
    if (ngAfterViewChecked) {
      (tView.viewHooks ??= []).push(i, ngAfterViewChecked);
      (tView.viewCheckHooks ??= []).push(i, ngAfterViewChecked);
    }
    if (ngOnDestroy != null) {
      (tView.destroyHooks ??= []).push(i, ngOnDestroy);
    }
  }
}
function executeCheckHooks(lView, hooks, nodeIndex) {
  callHooks(lView, hooks, 3, nodeIndex);
}
function executeInitAndCheckHooks(lView, hooks, initPhase, nodeIndex) {
  if ((lView[FLAGS] & 3) === initPhase) {
    callHooks(lView, hooks, initPhase, nodeIndex);
  }
}
function incrementInitPhaseFlags(lView, initPhase) {
  let flags = lView[FLAGS];
  if ((flags & 3) === initPhase) {
    flags &= 16383;
    flags += 1;
    lView[FLAGS] = flags;
  }
}
function callHooks(currentView, arr, initPhase, currentNodeIndex) {
  const startIndex = currentNodeIndex !== void 0 ? currentView[PREORDER_HOOK_FLAGS] & 65535 : 0;
  const nodeIndexLimit = currentNodeIndex != null ? currentNodeIndex : -1;
  const max = arr.length - 1;
  let lastNodeIndexFound = 0;
  for (let i = startIndex; i < max; i++) {
    const hook = arr[i + 1];
    if (typeof hook === "number") {
      lastNodeIndexFound = arr[i];
      if (currentNodeIndex != null && lastNodeIndexFound >= currentNodeIndex) {
        break;
      }
    } else {
      const isInitHook = arr[i] < 0;
      if (isInitHook) {
        currentView[PREORDER_HOOK_FLAGS] += 65536;
      }
      if (lastNodeIndexFound < nodeIndexLimit || nodeIndexLimit == -1) {
        callHook(currentView, initPhase, arr, i);
        currentView[PREORDER_HOOK_FLAGS] = (currentView[PREORDER_HOOK_FLAGS] & 4294901760) + i + 2;
      }
      i++;
    }
  }
}
function callHookInternal(directive, hook) {
  profiler(4, directive, hook);
  const prevConsumer = setActiveConsumer(null);
  try {
    hook.call(directive);
  } finally {
    setActiveConsumer(prevConsumer);
    profiler(5, directive, hook);
  }
}
function callHook(currentView, initPhase, arr, i) {
  const isInitHook = arr[i] < 0;
  const hook = arr[i + 1];
  const directiveIndex = isInitHook ? -arr[i] : arr[i];
  const directive = currentView[directiveIndex];
  if (isInitHook) {
    const indexWithintInitPhase = currentView[FLAGS] >> 14;
    if (indexWithintInitPhase < currentView[PREORDER_HOOK_FLAGS] >> 16 && (currentView[FLAGS] & 3) === initPhase) {
      currentView[FLAGS] += 16384;
      callHookInternal(directive, hook);
    }
  } else {
    callHookInternal(directive, hook);
  }
}
const NO_PARENT_INJECTOR = -1;
class NodeInjectorFactory {
  factory;
  name;
  /**
   * The inject implementation to be activated when using the factory.
   */
  injectImpl;
  /**
   * Marker set to true during factory invocation to see if we get into recursive loop.
   * Recursive loop causes an error to be displayed.
   */
  resolving = false;
  /**
   * Marks that the token can see other Tokens declared in `viewProviders` on the same node.
   */
  canSeeViewProviders;
  /**
   * An array of factories to use in case of `multi` provider.
   */
  multi;
  /**
   * Number of `multi`-providers which belong to the component.
   *
   * This is needed because when multiple components and directives declare the `multi` provider
   * they have to be concatenated in the correct order.
   *
   * Example:
   *
   * If we have a component and directive active an a single element as declared here
   * ```ts
   * component:
   *   providers: [ {provide: String, useValue: 'component', multi: true} ],
   *   viewProviders: [ {provide: String, useValue: 'componentView', multi: true} ],
   *
   * directive:
   *   providers: [ {provide: String, useValue: 'directive', multi: true} ],
   * ```
   *
   * Then the expected results are:
   *
   * ```ts
   * providers: ['component', 'directive']
   * viewProviders: ['component', 'componentView', 'directive']
   * ```
   *
   * The way to think about it is that the `viewProviders` have been inserted after the component
   * but before the directives, which is why we need to know how many `multi`s have been declared by
   * the component.
   */
  componentProviders;
  /**
   * Current index of the Factory in the `data`. Needed for `viewProviders` and `providers` merging.
   * See `providerFactory`.
   */
  index;
  /**
   * Because the same `multi` provider can be declared in `providers` and `viewProviders` it is
   * possible for `viewProviders` to shadow the `providers`. For this reason we store the
   * `provideFactory` of the `providers` so that `providers` can be extended with `viewProviders`.
   *
   * Example:
   *
   * Given:
   * ```ts
   * providers: [ {provide: String, useValue: 'all', multi: true} ],
   * viewProviders: [ {provide: String, useValue: 'viewOnly', multi: true} ],
   * ```
   *
   * We have to return `['all']` in case of content injection, but `['all', 'viewOnly']` in case
   * of view injection. We further have to make sure that the shared instances (in our case
   * `all`) are the exact same instance in both the content as well as the view injection. (We
   * have to make sure that we don't double instantiate.) For this reason the `viewProviders`
   * `Factory` has a pointer to the shadowed `providers` factory so that it can instantiate the
   * `providers` (`['all']`) and then extend it with `viewProviders` (`['all'] + ['viewOnly'] =
   * ['all', 'viewOnly']`).
   */
  providerFactory;
  constructor(factory, isViewProvider, injectImplementation, name) {
    this.factory = factory;
    this.name = name;
    this.canSeeViewProviders = isViewProvider;
    this.injectImpl = injectImplementation;
  }
}
function setUpAttributes(renderer, native, attrs) {
  let i = 0;
  while (i < attrs.length) {
    const value = attrs[i];
    if (typeof value === "number") {
      if (value !== 0) {
        break;
      }
      i++;
      const namespaceURI = attrs[i++];
      const attrName = attrs[i++];
      const attrVal = attrs[i++];
      renderer.setAttribute(native, attrName, attrVal, namespaceURI);
    } else {
      const attrName = value;
      const attrVal = attrs[++i];
      if (isAnimationProp(attrName)) {
        renderer.setProperty(native, attrName, attrVal);
      } else {
        renderer.setAttribute(native, attrName, attrVal);
      }
      i++;
    }
  }
  return i;
}
function isAnimationProp(name) {
  return name.charCodeAt(0) === 64;
}
function mergeHostAttrs(dst, src) {
  if (src === null || src.length === 0) ;
  else if (dst === null || dst.length === 0) {
    dst = src.slice();
  } else {
    let srcMarker = -1;
    for (let i = 0; i < src.length; i++) {
      const item = src[i];
      if (typeof item === "number") {
        srcMarker = item;
      } else {
        if (srcMarker === 0) ;
        else if (srcMarker === -1 || srcMarker === 2) {
          mergeHostAttribute(dst, srcMarker, item, null, src[++i]);
        } else {
          mergeHostAttribute(dst, srcMarker, item, null, null);
        }
      }
    }
  }
  return dst;
}
function mergeHostAttribute(dst, marker, key1, key2, value) {
  let i = 0;
  let markerInsertPosition = dst.length;
  if (marker === -1) {
    markerInsertPosition = -1;
  } else {
    while (i < dst.length) {
      const dstValue = dst[i++];
      if (typeof dstValue === "number") {
        if (dstValue === marker) {
          markerInsertPosition = -1;
          break;
        } else if (dstValue > marker) {
          markerInsertPosition = i - 1;
          break;
        }
      }
    }
  }
  while (i < dst.length) {
    const item = dst[i];
    if (typeof item === "number") {
      break;
    } else if (item === key1) {
      {
        if (value !== null) {
          dst[i + 1] = value;
        }
        return;
      }
    }
    i++;
    if (value !== null) i++;
  }
  if (markerInsertPosition !== -1) {
    dst.splice(markerInsertPosition, 0, marker);
    i = markerInsertPosition + 1;
  }
  dst.splice(i++, 0, key1);
  if (value !== null) {
    dst.splice(i++, 0, value);
  }
}
function hasParentInjector(parentLocation) {
  return parentLocation !== NO_PARENT_INJECTOR;
}
function getParentInjectorIndex(parentLocation) {
  return parentLocation & 32767;
}
function getParentInjectorViewOffset(parentLocation) {
  return parentLocation >> 16;
}
function getParentInjectorView(location, startView) {
  let viewOffset = getParentInjectorViewOffset(location);
  let parentView = startView;
  while (viewOffset > 0) {
    parentView = parentView[DECLARATION_VIEW];
    viewOffset--;
  }
  return parentView;
}
let includeViewProviders = true;
function setIncludeViewProviders(v) {
  const oldValue = includeViewProviders;
  includeViewProviders = v;
  return oldValue;
}
const BLOOM_SIZE = 256;
const BLOOM_MASK = BLOOM_SIZE - 1;
const BLOOM_BUCKET_BITS = 5;
let nextNgElementId = 0;
const NOT_FOUND = {};
function bloomAdd(injectorIndex, tView, type) {
  let id;
  if (typeof type === "string") {
    id = type.charCodeAt(0) || 0;
  } else if (type.hasOwnProperty(NG_ELEMENT_ID)) {
    id = type[NG_ELEMENT_ID];
  }
  if (id == null) {
    id = type[NG_ELEMENT_ID] = nextNgElementId++;
  }
  const bloomHash = id & BLOOM_MASK;
  const mask = 1 << bloomHash;
  tView.data[injectorIndex + (bloomHash >> BLOOM_BUCKET_BITS)] |= mask;
}
function getOrCreateNodeInjectorForNode(tNode, lView) {
  const existingInjectorIndex = getInjectorIndex(tNode, lView);
  if (existingInjectorIndex !== -1) {
    return existingInjectorIndex;
  }
  const tView = lView[TVIEW];
  if (tView.firstCreatePass) {
    tNode.injectorIndex = lView.length;
    insertBloom(tView.data, tNode);
    insertBloom(lView, null);
    insertBloom(tView.blueprint, null);
  }
  const parentLoc = getParentInjectorLocation(tNode, lView);
  const injectorIndex = tNode.injectorIndex;
  if (hasParentInjector(parentLoc)) {
    const parentIndex = getParentInjectorIndex(parentLoc);
    const parentLView = getParentInjectorView(parentLoc, lView);
    const parentData = parentLView[TVIEW].data;
    for (let i = 0; i < 8; i++) {
      lView[injectorIndex + i] = parentLView[parentIndex + i] | parentData[parentIndex + i];
    }
  }
  lView[
    injectorIndex + 8
    /* NodeInjectorOffset.PARENT */
  ] = parentLoc;
  return injectorIndex;
}
function insertBloom(arr, footer) {
  arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
}
function getInjectorIndex(tNode, lView) {
  if (tNode.injectorIndex === -1 || // If the injector index is the same as its parent's injector index, then the index has been
  // copied down from the parent node. No injector has been created yet on this node.
  tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex || // After the first template pass, the injector index might exist but the parent values
  // might not have been calculated yet for this instance
  lView[
    tNode.injectorIndex + 8
    /* NodeInjectorOffset.PARENT */
  ] === null) {
    return -1;
  } else {
    return tNode.injectorIndex;
  }
}
function getParentInjectorLocation(tNode, lView) {
  if (tNode.parent && tNode.parent.injectorIndex !== -1) {
    return tNode.parent.injectorIndex;
  }
  let declarationViewOffset = 0;
  let parentTNode = null;
  let lViewCursor = lView;
  while (lViewCursor !== null) {
    parentTNode = getTNodeFromLView(lViewCursor);
    if (parentTNode === null) {
      return NO_PARENT_INJECTOR;
    }
    declarationViewOffset++;
    lViewCursor = lViewCursor[DECLARATION_VIEW];
    if (parentTNode.injectorIndex !== -1) {
      return parentTNode.injectorIndex | declarationViewOffset << 16;
    }
  }
  return NO_PARENT_INJECTOR;
}
function diPublicInInjector(injectorIndex, tView, token) {
  bloomAdd(injectorIndex, tView, token);
}
function notFoundValueOrThrow(notFoundValue, token, flags) {
  if (flags & 8 || notFoundValue !== void 0) {
    return notFoundValue;
  } else {
    throwProviderNotFoundError();
  }
}
function lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue) {
  if (flags & 8 && notFoundValue === void 0) {
    notFoundValue = null;
  }
  if ((flags & (2 | 1)) === 0) {
    const moduleInjector = lView[INJECTOR];
    const previousInjectImplementation = setInjectImplementation(void 0);
    try {
      if (moduleInjector) {
        return moduleInjector.get(
          token,
          notFoundValue,
          flags & 8
          /* InternalInjectFlags.Optional */
        );
      } else {
        return injectRootLimpMode(
          token,
          notFoundValue,
          flags & 8
          /* InternalInjectFlags.Optional */
        );
      }
    } finally {
      setInjectImplementation(previousInjectImplementation);
    }
  }
  return notFoundValueOrThrow(notFoundValue, token, flags);
}
function getOrCreateInjectable(tNode, lView, token, flags = 0, notFoundValue) {
  if (tNode !== null) {
    if (lView[FLAGS] & 2048 && // The token must be present on the current node injector when the `Self`
    // flag is set, so the lookup on embedded view injector(s) can be skipped.
    !(flags & 2)) {
      const embeddedInjectorValue = lookupTokenUsingEmbeddedInjector(tNode, lView, token, flags, NOT_FOUND);
      if (embeddedInjectorValue !== NOT_FOUND) {
        return embeddedInjectorValue;
      }
    }
    const value = lookupTokenUsingNodeInjector(tNode, lView, token, flags, NOT_FOUND);
    if (value !== NOT_FOUND) {
      return value;
    }
  }
  return lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue);
}
function lookupTokenUsingNodeInjector(tNode, lView, token, flags, notFoundValue) {
  const bloomHash = bloomHashBitOrFactory(token);
  if (typeof bloomHash === "function") {
    if (!enterDI(lView, tNode, flags)) {
      return flags & 1 ? notFoundValueOrThrow(notFoundValue, token, flags) : lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue);
    }
    try {
      let value;
      if (false) ; else {
        value = bloomHash(flags);
      }
      if (value == null && !(flags & 8)) {
        throwProviderNotFoundError(token);
      } else {
        return value;
      }
    } finally {
      leaveDI();
    }
  } else if (typeof bloomHash === "number") {
    let previousTView = null;
    let injectorIndex = getInjectorIndex(tNode, lView);
    let parentLocation = NO_PARENT_INJECTOR;
    let hostTElementNode = flags & 1 ? lView[DECLARATION_COMPONENT_VIEW][T_HOST] : null;
    if (injectorIndex === -1 || flags & 4) {
      parentLocation = injectorIndex === -1 ? getParentInjectorLocation(tNode, lView) : lView[
        injectorIndex + 8
        /* NodeInjectorOffset.PARENT */
      ];
      if (parentLocation === NO_PARENT_INJECTOR || !shouldSearchParent(flags, false)) {
        injectorIndex = -1;
      } else {
        previousTView = lView[TVIEW];
        injectorIndex = getParentInjectorIndex(parentLocation);
        lView = getParentInjectorView(parentLocation, lView);
      }
    }
    while (injectorIndex !== -1) {
      const tView = lView[TVIEW];
      if (bloomHasToken(bloomHash, injectorIndex, tView.data)) {
        const instance = searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode);
        if (instance !== NOT_FOUND) {
          return instance;
        }
      }
      parentLocation = lView[
        injectorIndex + 8
        /* NodeInjectorOffset.PARENT */
      ];
      if (parentLocation !== NO_PARENT_INJECTOR && shouldSearchParent(flags, lView[TVIEW].data[
        injectorIndex + 8
        /* NodeInjectorOffset.TNODE */
      ] === hostTElementNode) && bloomHasToken(bloomHash, injectorIndex, lView)) {
        previousTView = tView;
        injectorIndex = getParentInjectorIndex(parentLocation);
        lView = getParentInjectorView(parentLocation, lView);
      } else {
        injectorIndex = -1;
      }
    }
  }
  return notFoundValue;
}
function searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode) {
  const currentTView = lView[TVIEW];
  const tNode = currentTView.data[
    injectorIndex + 8
    /* NodeInjectorOffset.TNODE */
  ];
  const canAccessViewProviders = previousTView == null ? (
    // 1) This is the first invocation `previousTView == null` which means that we are at the
    // `TNode` of where injector is starting to look. In such a case the only time we are allowed
    // to look into the ViewProviders is if:
    // - we are on a component
    // - AND the injector set `includeViewProviders` to true (implying that the token can see
    // ViewProviders because it is the Component or a Service which itself was declared in
    // ViewProviders)
    isComponentHost(tNode) && includeViewProviders
  ) : (
    // 2) `previousTView != null` which means that we are now walking across the parent nodes.
    // In such a case we are only allowed to look into the ViewProviders if:
    // - We just crossed from child View to Parent View `previousTView != currentTView`
    // - AND the parent TNode is an Element.
    // This means that we just came from the Component's View and therefore are allowed to see
    // into the ViewProviders.
    previousTView != currentTView && (tNode.type & 3) !== 0
  );
  const isHostSpecialCase = flags & 1 && hostTElementNode === tNode;
  const injectableIdx = locateDirectiveOrProvider(tNode, currentTView, token, canAccessViewProviders, isHostSpecialCase);
  if (injectableIdx !== null) {
    return getNodeInjectable(lView, currentTView, injectableIdx, tNode, flags);
  } else {
    return NOT_FOUND;
  }
}
function locateDirectiveOrProvider(tNode, tView, token, canAccessViewProviders, isHostSpecialCase) {
  const nodeProviderIndexes = tNode.providerIndexes;
  const tInjectables = tView.data;
  const injectablesStart = nodeProviderIndexes & 1048575;
  const directivesStart = tNode.directiveStart;
  const directiveEnd = tNode.directiveEnd;
  const cptViewProvidersCount = nodeProviderIndexes >> 20;
  const startingIndex = canAccessViewProviders ? injectablesStart : injectablesStart + cptViewProvidersCount;
  const endIndex = isHostSpecialCase ? injectablesStart + cptViewProvidersCount : directiveEnd;
  for (let i = startingIndex; i < endIndex; i++) {
    const providerTokenOrDef = tInjectables[i];
    if (i < directivesStart && token === providerTokenOrDef || i >= directivesStart && providerTokenOrDef.type === token) {
      return i;
    }
  }
  if (isHostSpecialCase) {
    const dirDef = tInjectables[directivesStart];
    if (dirDef && isComponentDef(dirDef) && dirDef.type === token) {
      return directivesStart;
    }
  }
  return null;
}
function getNodeInjectable(lView, tView, index, tNode, flags) {
  let value = lView[index];
  const tData = tView.data;
  if (value instanceof NodeInjectorFactory) {
    const factory = value;
    if (factory.resolving) {
      stringifyForError(tData[index]);
      {
        throw cyclicDependencyError();
      }
    }
    const previousIncludeViewProviders = setIncludeViewProviders(factory.canSeeViewProviders);
    factory.resolving = true;
    tData[index].type || tData[index];
    const previousInjectImplementation = factory.injectImpl ? setInjectImplementation(factory.injectImpl) : null;
    enterDI(
      lView,
      tNode,
      0
      /* InternalInjectFlags.Default */
    );
    try {
      value = lView[index] = factory.factory(void 0, flags, tData, lView, tNode);
      if (tView.firstCreatePass && index >= tNode.directiveStart) {
        registerPreOrderHooks(index, tData[index], tView);
      }
    } finally {
      previousInjectImplementation !== null && setInjectImplementation(previousInjectImplementation);
      setIncludeViewProviders(previousIncludeViewProviders);
      factory.resolving = false;
      leaveDI();
    }
  }
  return value;
}
function bloomHashBitOrFactory(token) {
  if (typeof token === "string") {
    return token.charCodeAt(0) || 0;
  }
  const tokenId = (
    // First check with `hasOwnProperty` so we don't get an inherited ID.
    token.hasOwnProperty(NG_ELEMENT_ID) ? token[NG_ELEMENT_ID] : void 0
  );
  if (typeof tokenId === "number") {
    if (tokenId >= 0) {
      return tokenId & BLOOM_MASK;
    } else {
      return createNodeInjector;
    }
  } else {
    return tokenId;
  }
}
function bloomHasToken(bloomHash, injectorIndex, injectorView) {
  const mask = 1 << bloomHash;
  const value = injectorView[injectorIndex + (bloomHash >> BLOOM_BUCKET_BITS)];
  return !!(value & mask);
}
function shouldSearchParent(flags, isFirstHostTNode) {
  return !(flags & 2) && !(flags & 1 && isFirstHostTNode);
}
class NodeInjector {
  _tNode;
  _lView;
  constructor(_tNode, _lView) {
    this._tNode = _tNode;
    this._lView = _lView;
  }
  get(token, notFoundValue, flags) {
    return getOrCreateInjectable(this._tNode, this._lView, token, convertToBitFlags(flags), notFoundValue);
  }
}
function createNodeInjector() {
  return new NodeInjector(getCurrentTNode(), getLView());
}
function lookupTokenUsingEmbeddedInjector(tNode, lView, token, flags, notFoundValue) {
  let currentTNode = tNode;
  let currentLView = lView;
  while (currentTNode !== null && currentLView !== null && currentLView[FLAGS] & 2048 && !isRootView(currentLView)) {
    const nodeInjectorValue = lookupTokenUsingNodeInjector(currentTNode, currentLView, token, flags | 2, NOT_FOUND);
    if (nodeInjectorValue !== NOT_FOUND) {
      return nodeInjectorValue;
    }
    let parentTNode = currentTNode.parent;
    if (!parentTNode) {
      const embeddedViewInjector = currentLView[EMBEDDED_VIEW_INJECTOR];
      if (embeddedViewInjector) {
        const embeddedViewInjectorValue = embeddedViewInjector.get(token, NOT_FOUND, flags);
        if (embeddedViewInjectorValue !== NOT_FOUND) {
          return embeddedViewInjectorValue;
        }
      }
      parentTNode = getTNodeFromLView(currentLView);
      currentLView = currentLView[DECLARATION_VIEW];
    }
    currentTNode = parentTNode;
  }
  return notFoundValue;
}
function getTNodeFromLView(lView) {
  const tView = lView[TVIEW];
  const tViewType = tView.type;
  if (tViewType === 2) {
    return tView.declTNode;
  } else if (tViewType === 1) {
    return lView[T_HOST];
  }
  return null;
}
function injectElementRef() {
  return createElementRef(getCurrentTNode(), getLView());
}
function createElementRef(tNode, lView) {
  return new ElementRef(getNativeByTNode(tNode, lView));
}
let ElementRef = /* @__PURE__ */ (() => {
  class ElementRef2 {
    /**
     * <div class="docs-alert docs-alert-important">
     *   <header>Use with caution</header>
     *   <p>
     *    Use this API as the last resort when direct access to DOM is needed. Use templating and
     *    data-binding provided by Angular instead. If used, it is recommended in combination with
     *    {@link /best-practices/security#direct-use-of-the-dom-apis-and-explicit-sanitization-calls DomSanitizer}
     *    for maxiumum security;
     *   </p>
     * </div>
     */
    nativeElement;
    constructor(nativeElement) {
      this.nativeElement = nativeElement;
    }
    /**
     * @internal
     * @nocollapse
     */
    static __NG_ELEMENT_ID__ = injectElementRef;
  }
  return ElementRef2;
})();
function hasInSkipHydrationBlockFlag(tNode) {
  return (tNode.flags & 128) === 128;
}
var ChangeDetectionStrategy = /* @__PURE__ */ (function(ChangeDetectionStrategy2) {
  ChangeDetectionStrategy2[ChangeDetectionStrategy2["OnPush"] = 0] = "OnPush";
  ChangeDetectionStrategy2[ChangeDetectionStrategy2["Default"] = 1] = "Default";
  return ChangeDetectionStrategy2;
})(ChangeDetectionStrategy || {});
const TRACKED_LVIEWS = /* @__PURE__ */ new Map();
let uniqueIdCounter = 0;
function getUniqueLViewId() {
  return uniqueIdCounter++;
}
function registerLView(lView) {
  TRACKED_LVIEWS.set(lView[ID], lView);
}
function unregisterLView(lView) {
  TRACKED_LVIEWS.delete(lView[ID]);
}
const MONKEY_PATCH_KEY_NAME = "__ngContext__";
function attachPatchData(target, data) {
  if (isLView(data)) {
    target[MONKEY_PATCH_KEY_NAME] = data[ID];
    registerLView(data);
  } else {
    target[MONKEY_PATCH_KEY_NAME] = data;
  }
}
function getFirstLContainer(lView) {
  return getNearestLContainer(lView[CHILD_HEAD]);
}
function getNextLContainer(container) {
  return getNearestLContainer(container[NEXT]);
}
function getNearestLContainer(viewOrContainer) {
  while (viewOrContainer !== null && !isLContainer(viewOrContainer)) {
    viewOrContainer = viewOrContainer[NEXT];
  }
  return viewOrContainer;
}
let DOCUMENT = void 0;
function setDocument(document2) {
  DOCUMENT = document2;
}
function getDocument() {
  if (DOCUMENT !== void 0) {
    return DOCUMENT;
  } else if (typeof document !== "undefined") {
    return document;
  }
  throw new RuntimeError(210, false);
}
const APP_ID = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => DEFAULT_APP_ID
});
const DEFAULT_APP_ID = "ng";
const PLATFORM_INITIALIZER = /* @__PURE__ */ new InjectionToken("");
const PLATFORM_ID = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "platform",
  factory: () => "unknown"
  // set a default platform name, when none set explicitly
});
const CSP_NONCE = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => {
    return getDocument().body?.querySelector("[ngCspNonce]")?.getAttribute("ngCspNonce") || null;
  }
});
const IMAGE_CONFIG_DEFAULTS = {
  breakpoints: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  placeholderResolution: 30,
  disableImageSizeWarning: false,
  disableImageLazyLoadWarning: false
};
const IMAGE_CONFIG = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => IMAGE_CONFIG_DEFAULTS
});
const PRESERVE_HOST_CONTENT_DEFAULT = false;
const PRESERVE_HOST_CONTENT = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => PRESERVE_HOST_CONTENT_DEFAULT
});
function isDetachedByI18n(tNode) {
  return (tNode.flags & 32) === 32;
}
let _retrieveHydrationInfoImpl = () => null;
function retrieveHydrationInfo(rNode, injector, isRootView2 = false) {
  return _retrieveHydrationInfoImpl();
}
function refreshContentQueries(tView, lView) {
  const contentQueries = tView.contentQueries;
  if (contentQueries !== null) {
    const prevConsumer = setActiveConsumer(null);
    try {
      for (let i = 0; i < contentQueries.length; i += 2) {
        const queryStartIdx = contentQueries[i];
        const directiveDefIdx = contentQueries[i + 1];
        if (directiveDefIdx !== -1) {
          const directiveDef = tView.data[directiveDefIdx];
          setCurrentQueryIndex(queryStartIdx);
          directiveDef.contentQueries(2, lView[directiveDefIdx], directiveDefIdx);
        }
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}
function executeViewQueryFn(flags, viewQueryFn, component) {
  setCurrentQueryIndex(0);
  const prevConsumer = setActiveConsumer(null);
  try {
    viewQueryFn(flags, component);
  } finally {
    setActiveConsumer(prevConsumer);
  }
}
function executeContentQueries(tView, tNode, lView) {
  if (isContentQueryHost(tNode)) {
    const prevConsumer = setActiveConsumer(null);
    try {
      const start = tNode.directiveStart;
      const end = tNode.directiveEnd;
      for (let directiveIndex = start; directiveIndex < end; directiveIndex++) {
        const def = tView.data[directiveIndex];
        if (def.contentQueries) {
          const directiveInstance = lView[directiveIndex];
          def.contentQueries(1, directiveInstance, directiveIndex);
        }
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}
var ViewEncapsulation = /* @__PURE__ */ (function(ViewEncapsulation2) {
  ViewEncapsulation2[ViewEncapsulation2["Emulated"] = 0] = "Emulated";
  ViewEncapsulation2[ViewEncapsulation2["None"] = 2] = "None";
  ViewEncapsulation2[ViewEncapsulation2["ShadowDom"] = 3] = "ShadowDom";
  return ViewEncapsulation2;
})(ViewEncapsulation || {});
function createTextNode(renderer, value) {
  return renderer.createText(value);
}
function updateTextNode(renderer, rNode, value) {
  renderer.setValue(rNode, value);
}
function createElementNode(renderer, name, namespace) {
  return renderer.createElement(name, namespace);
}
function nativeInsertBefore(renderer, parent, child, beforeNode, isMove) {
  renderer.insertBefore(parent, child, beforeNode, isMove);
}
function nativeAppendChild(renderer, parent, child) {
  renderer.appendChild(parent, child);
}
function nativeAppendOrInsertBefore(renderer, parent, child, beforeNode, isMove) {
  if (beforeNode !== null) {
    nativeInsertBefore(renderer, parent, child, beforeNode, isMove);
  } else {
    nativeAppendChild(renderer, parent, child);
  }
}
function nativeRemoveNode(renderer, rNode, isHostElement, requireSynchronousElementRemoval) {
  renderer.removeChild(null, rNode, isHostElement, requireSynchronousElementRemoval);
}
function writeDirectStyle(renderer, element, newValue) {
  renderer.setAttribute(element, "style", newValue);
}
function writeDirectClass(renderer, element, newValue) {
  if (newValue === "") {
    renderer.removeAttribute(element, "class");
  } else {
    renderer.setAttribute(element, "class", newValue);
  }
}
function setupStaticAttributes(renderer, element, tNode) {
  const {
    mergedAttrs,
    classes,
    styles
  } = tNode;
  if (mergedAttrs !== null) {
    setUpAttributes(renderer, element, mergedAttrs);
  }
  if (classes !== null) {
    writeDirectClass(renderer, element, classes);
  }
  if (styles !== null) {
    writeDirectStyle(renderer, element, styles);
  }
}
function assertStandaloneComponentType(type) {
  assertComponentDef(type);
  const componentDef = getComponentDef(type);
  if (!componentDef.standalone) {
    throw new RuntimeError(907, `The ${stringifyForError(type)} component is not marked as standalone, but Angular expects to have a standalone component here. Please make sure the ${stringifyForError(type)} component has the \`standalone: true\` flag in the decorator.`);
  }
}
function assertComponentDef(type) {
  if (!getComponentDef(type)) {
    throw new RuntimeError(906, `The ${stringifyForError(type)} is not an Angular component, make sure it has the \`@Component\` decorator.`);
  }
}
const NG_TEMPLATE_SELECTOR = "ng-template";
function isInlineTemplate(tNode) {
  return tNode.type === 4 && tNode.value !== NG_TEMPLATE_SELECTOR;
}
function isPositive(mode) {
  return (mode & 1) === 0;
}
function maybeWrapInNotSelector(isNegativeMode, chunk) {
  return isNegativeMode ? ":not(" + chunk.trim() + ")" : chunk;
}
function stringifyCSSSelector(selector) {
  let result = selector[0];
  let i = 1;
  let mode = 2;
  let currentChunk = "";
  let isNegativeMode = false;
  while (i < selector.length) {
    let valueOrMarker = selector[i];
    if (typeof valueOrMarker === "string") {
      if (mode & 2) {
        const attrValue = selector[++i];
        currentChunk += "[" + valueOrMarker + (attrValue.length > 0 ? '="' + attrValue + '"' : "") + "]";
      } else if (mode & 8) {
        currentChunk += "." + valueOrMarker;
      } else if (mode & 4) {
        currentChunk += " " + valueOrMarker;
      }
    } else {
      if (currentChunk !== "" && !isPositive(valueOrMarker)) {
        result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
        currentChunk = "";
      }
      mode = valueOrMarker;
      isNegativeMode = isNegativeMode || !isPositive(mode);
    }
    i++;
  }
  if (currentChunk !== "") {
    result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
  }
  return result;
}
function stringifyCSSSelectorList(selectorList) {
  return selectorList.map(stringifyCSSSelector).join(",");
}
function extractAttrsAndClassesFromSelector(selector) {
  const attrs = [];
  const classes = [];
  let i = 1;
  let mode = 2;
  while (i < selector.length) {
    let valueOrMarker = selector[i];
    if (typeof valueOrMarker === "string") {
      if (mode === 2) {
        if (valueOrMarker !== "") {
          attrs.push(valueOrMarker, selector[++i]);
        }
      } else if (mode === 8) {
        classes.push(valueOrMarker);
      }
    } else {
      if (!isPositive(mode)) break;
      mode = valueOrMarker;
    }
    i++;
  }
  if (classes.length) {
    attrs.push(1, ...classes);
  }
  return attrs;
}
const NO_CHANGE = {};
function createTView(type, declTNode, templateFn, decls, vars, directives, pipes, viewQuery, schemas, constsOrFactory, ssrId) {
  const bindingStartIndex = HEADER_OFFSET + decls;
  const initialViewLength = bindingStartIndex + vars;
  const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
  const consts = typeof constsOrFactory === "function" ? constsOrFactory() : constsOrFactory;
  const tView = blueprint[TVIEW] = {
    type,
    blueprint,
    template: templateFn,
    queries: null,
    viewQuery,
    declTNode,
    data: blueprint.slice().fill(null, bindingStartIndex),
    bindingStartIndex,
    expandoStartIndex: initialViewLength,
    hostBindingOpCodes: null,
    firstCreatePass: true,
    firstUpdatePass: true,
    staticViewQueries: false,
    staticContentQueries: false,
    preOrderHooks: null,
    preOrderCheckHooks: null,
    contentHooks: null,
    contentCheckHooks: null,
    viewHooks: null,
    viewCheckHooks: null,
    destroyHooks: null,
    cleanup: null,
    contentQueries: null,
    components: null,
    directiveRegistry: typeof directives === "function" ? directives() : directives,
    pipeRegistry: typeof pipes === "function" ? pipes() : pipes,
    firstChild: null,
    schemas,
    consts,
    incompleteFirstPass: false,
    ssrId
  };
  return tView;
}
function createViewBlueprint(bindingStartIndex, initialViewLength) {
  const blueprint = [];
  for (let i = 0; i < initialViewLength; i++) {
    blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
  }
  return blueprint;
}
function getOrCreateComponentTView(def) {
  const tView = def.tView;
  if (tView === null || tView.incompleteFirstPass) {
    const declTNode = null;
    return def.tView = createTView(1, declTNode, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts, def.id);
  }
  return tView;
}
function createLView(parentLView, tView, context, flags, host, tHostNode, environment, renderer, injector, embeddedViewInjector, hydrationInfo) {
  const lView = tView.blueprint.slice();
  lView[HOST] = host;
  lView[FLAGS] = flags | 4 | 128 | 8 | 64 | 1024;
  if (parentLView && parentLView[FLAGS] & 2048) {
    lView[FLAGS] |= 2048;
  }
  resetPreOrderHookFlags(lView);
  lView[PARENT] = lView[DECLARATION_VIEW] = parentLView;
  lView[CONTEXT] = context;
  lView[ENVIRONMENT] = environment || parentLView && parentLView[ENVIRONMENT];
  lView[RENDERER] = renderer || parentLView && parentLView[RENDERER];
  lView[INJECTOR] = injector || parentLView && parentLView[INJECTOR] || null;
  lView[T_HOST] = tHostNode;
  lView[ID] = getUniqueLViewId();
  lView[HYDRATION] = hydrationInfo;
  lView[EMBEDDED_VIEW_INJECTOR] = embeddedViewInjector;
  lView[DECLARATION_COMPONENT_VIEW] = tView.type == 2 ? parentLView[DECLARATION_COMPONENT_VIEW] : lView;
  return lView;
}
function createComponentLView(lView, hostTNode, def) {
  const native = getNativeByTNode(hostTNode, lView);
  const tView = getOrCreateComponentTView(def);
  const rendererFactory = lView[ENVIRONMENT].rendererFactory;
  const componentView = addToEndOfViewTree(lView, createLView(lView, tView, null, getInitialLViewFlagsFromDef(def), native, hostTNode, null, rendererFactory.createRenderer(native, def), null, null, null));
  return lView[hostTNode.index] = componentView;
}
function getInitialLViewFlagsFromDef(def) {
  let flags = 16;
  if (def.signals) {
    flags = 4096;
  } else if (def.onPush) {
    flags = 64;
  }
  return flags;
}
function allocExpando(tView, lView, numSlotsToAlloc, initialValue) {
  if (numSlotsToAlloc === 0) return -1;
  const allocIdx = lView.length;
  for (let i = 0; i < numSlotsToAlloc; i++) {
    lView.push(initialValue);
    tView.blueprint.push(initialValue);
    tView.data.push(null);
  }
  return allocIdx;
}
function addToEndOfViewTree(lView, lViewOrLContainer) {
  if (lView[CHILD_HEAD]) {
    lView[CHILD_TAIL][NEXT] = lViewOrLContainer;
  } else {
    lView[CHILD_HEAD] = lViewOrLContainer;
  }
  lView[CHILD_TAIL] = lViewOrLContainer;
  return lViewOrLContainer;
}
function ɵɵadvance(delta = 1) {
  selectIndexInternal(getTView(), getLView(), getSelectedIndex() + delta);
}
function selectIndexInternal(tView, lView, index, checkNoChangesMode) {
  {
    const hooksInitPhaseCompleted = (lView[FLAGS] & 3) === 3;
    if (hooksInitPhaseCompleted) {
      const preOrderCheckHooks = tView.preOrderCheckHooks;
      if (preOrderCheckHooks !== null) {
        executeCheckHooks(lView, preOrderCheckHooks, index);
      }
    } else {
      const preOrderHooks = tView.preOrderHooks;
      if (preOrderHooks !== null) {
        executeInitAndCheckHooks(lView, preOrderHooks, 0, index);
      }
    }
  }
  setSelectedIndex(index);
}
var InputFlags = /* @__PURE__ */ (function(InputFlags2) {
  InputFlags2[InputFlags2["None"] = 0] = "None";
  InputFlags2[InputFlags2["SignalBased"] = 1] = "SignalBased";
  InputFlags2[InputFlags2["HasDecoratorInputTransform"] = 2] = "HasDecoratorInputTransform";
  return InputFlags2;
})(InputFlags || {});
function writeToDirectiveInput(def, instance, publicName, value) {
  const prevConsumer = setActiveConsumer(null);
  try {
    if (false) ;
    const [privateName, flags, transform] = def.inputs[publicName];
    let inputSignalNode = null;
    if ((flags & InputFlags.SignalBased) !== 0) {
      const field = instance[privateName];
      inputSignalNode = field[SIGNAL];
    }
    if (inputSignalNode !== null && inputSignalNode.transformFn !== void 0) {
      value = inputSignalNode.transformFn(value);
    } else if (transform !== null) {
      value = transform.call(instance, value);
    }
    if (def.setInput !== null) {
      def.setInput(instance, inputSignalNode, value, publicName, privateName);
    } else {
      applyValueToInputField(instance, inputSignalNode, privateName, value);
    }
  } finally {
    setActiveConsumer(prevConsumer);
  }
}
var RendererStyleFlags2 = /* @__PURE__ */ (function(RendererStyleFlags22) {
  RendererStyleFlags22[RendererStyleFlags22["Important"] = 1] = "Important";
  RendererStyleFlags22[RendererStyleFlags22["DashCase"] = 2] = "DashCase";
  return RendererStyleFlags22;
})(RendererStyleFlags2 || {});
let _icuContainerIterate;
function icuContainerIterate(tIcuContainerNode, lView) {
  return _icuContainerIterate(tIcuContainerNode, lView);
}
const allLeavingAnimations = /* @__PURE__ */ new Set();
var TracingAction = /* @__PURE__ */ (function(TracingAction2) {
  TracingAction2[TracingAction2["CHANGE_DETECTION"] = 0] = "CHANGE_DETECTION";
  TracingAction2[TracingAction2["AFTER_NEXT_RENDER"] = 1] = "AFTER_NEXT_RENDER";
  return TracingAction2;
})(TracingAction || {});
const TracingService = /* @__PURE__ */ new InjectionToken("");
const markedFeatures = /* @__PURE__ */ new Set();
function performanceMarkFeature(feature) {
  if (markedFeatures.has(feature)) {
    return;
  }
  markedFeatures.add(feature);
  performance?.mark?.("mark_feature_usage", {
    detail: {
      feature
    }
  });
}
const SCHEDULE_IN_ROOT_ZONE_DEFAULT = false;
class EventEmitter_ extends Subject {
  // tslint:disable-next-line:require-internal-with-underscore
  __isAsync;
  destroyRef = void 0;
  pendingTasks = void 0;
  constructor(isAsync = false) {
    super();
    this.__isAsync = isAsync;
    if (isInInjectionContext()) {
      this.destroyRef = inject(DestroyRef, {
        optional: true
      }) ?? void 0;
      this.pendingTasks = inject(PendingTasksInternal, {
        optional: true
      }) ?? void 0;
    }
  }
  emit(value) {
    const prevConsumer = setActiveConsumer(null);
    try {
      super.next(value);
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
  subscribe(observerOrNext, error, complete) {
    let nextFn = observerOrNext;
    let errorFn = error || (() => null);
    let completeFn = complete;
    if (observerOrNext && typeof observerOrNext === "object") {
      const observer = observerOrNext;
      nextFn = observer.next?.bind(observer);
      errorFn = observer.error?.bind(observer);
      completeFn = observer.complete?.bind(observer);
    }
    if (this.__isAsync) {
      errorFn = this.wrapInTimeout(errorFn);
      if (nextFn) {
        nextFn = this.wrapInTimeout(nextFn);
      }
      if (completeFn) {
        completeFn = this.wrapInTimeout(completeFn);
      }
    }
    const sink = super.subscribe({
      next: nextFn,
      error: errorFn,
      complete: completeFn
    });
    if (observerOrNext instanceof Subscription) {
      observerOrNext.add(sink);
    }
    return sink;
  }
  wrapInTimeout(fn) {
    return (value) => {
      const taskId = this.pendingTasks?.add();
      setTimeout(() => {
        try {
          fn(value);
        } finally {
          if (taskId !== void 0) {
            this.pendingTasks?.remove(taskId);
          }
        }
      });
    };
  }
}
const EventEmitter = EventEmitter_;
function scheduleCallbackWithRafRace(callback) {
  let timeoutId;
  let animationFrameId;
  function cleanup() {
    callback = noop;
    try {
      if (animationFrameId !== void 0 && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId !== void 0) {
        clearTimeout(timeoutId);
      }
    } catch {
    }
  }
  timeoutId = setTimeout(() => {
    callback();
    cleanup();
  });
  if (typeof requestAnimationFrame === "function") {
    animationFrameId = requestAnimationFrame(() => {
      callback();
      cleanup();
    });
  }
  return () => cleanup();
}
function scheduleCallbackWithMicrotask(callback) {
  queueMicrotask(() => callback());
  return () => {
    callback = noop;
  };
}
const isAngularZoneProperty = "isAngularZone";
const angularZoneInstanceIdProperty = isAngularZoneProperty + "_ID";
let ngZoneInstanceId = 0;
class NgZone {
  hasPendingMacrotasks = false;
  hasPendingMicrotasks = false;
  /**
   * Whether there are no outstanding microtasks or macrotasks.
   */
  isStable = true;
  /**
   * Notifies when code enters Angular Zone. This gets fired first on VM Turn.
   */
  onUnstable = /* @__PURE__ */ new EventEmitter(false);
  /**
   * Notifies when there is no more microtasks enqueued in the current VM Turn.
   * This is a hint for Angular to do change detection, which may enqueue more microtasks.
   * For this reason this event can fire multiple times per VM Turn.
   */
  onMicrotaskEmpty = /* @__PURE__ */ new EventEmitter(false);
  /**
   * Notifies when the last `onMicrotaskEmpty` has run and there are no more microtasks, which
   * implies we are about to relinquish VM turn.
   * This event gets called just once.
   */
  onStable = /* @__PURE__ */ new EventEmitter(false);
  /**
   * Notifies that an error has been delivered.
   */
  onError = /* @__PURE__ */ new EventEmitter(false);
  constructor(options) {
    const {
      enableLongStackTrace = false,
      shouldCoalesceEventChangeDetection = false,
      shouldCoalesceRunChangeDetection = false,
      scheduleInRootZone = SCHEDULE_IN_ROOT_ZONE_DEFAULT
    } = options;
    if (typeof Zone == "undefined") {
      throw new RuntimeError(908, false);
    }
    Zone.assertZonePatched();
    const self = this;
    self._nesting = 0;
    self._outer = self._inner = Zone.current;
    if (Zone["TaskTrackingZoneSpec"]) {
      self._inner = self._inner.fork(new Zone["TaskTrackingZoneSpec"]());
    }
    if (enableLongStackTrace && Zone["longStackTraceZoneSpec"]) {
      self._inner = self._inner.fork(Zone["longStackTraceZoneSpec"]);
    }
    self.shouldCoalesceEventChangeDetection = !shouldCoalesceRunChangeDetection && shouldCoalesceEventChangeDetection;
    self.shouldCoalesceRunChangeDetection = shouldCoalesceRunChangeDetection;
    self.callbackScheduled = false;
    self.scheduleInRootZone = scheduleInRootZone;
    forkInnerZoneWithAngularBehavior(self);
  }
  /**
    This method checks whether the method call happens within an Angular Zone instance.
  */
  static isInAngularZone() {
    return typeof Zone !== "undefined" && Zone.current.get(isAngularZoneProperty) === true;
  }
  /**
    Assures that the method is called within the Angular Zone, otherwise throws an error.
  */
  static assertInAngularZone() {
    if (!NgZone.isInAngularZone()) {
      throw new RuntimeError(909, false);
    }
  }
  /**
    Assures that the method is called outside of the Angular Zone, otherwise throws an error.
  */
  static assertNotInAngularZone() {
    if (NgZone.isInAngularZone()) {
      throw new RuntimeError(909, false);
    }
  }
  /**
   * Executes the `fn` function synchronously within the Angular zone and returns value returned by
   * the function.
   *
   * Running functions via `run` allows you to reenter Angular zone from a task that was executed
   * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
   *
   * Any future tasks or microtasks scheduled from within this function will continue executing from
   * within the Angular zone.
   *
   * If a synchronous error happens it will be rethrown and not reported via `onError`.
   */
  run(fn, applyThis, applyArgs) {
    return this._inner.run(fn, applyThis, applyArgs);
  }
  /**
   * Executes the `fn` function synchronously within the Angular zone as a task and returns value
   * returned by the function.
   *
   * Running functions via `runTask` allows you to reenter Angular zone from a task that was executed
   * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
   *
   * Any future tasks or microtasks scheduled from within this function will continue executing from
   * within the Angular zone.
   *
   * If a synchronous error happens it will be rethrown and not reported via `onError`.
   */
  runTask(fn, applyThis, applyArgs, name) {
    const zone = this._inner;
    const task = zone.scheduleEventTask("NgZoneEvent: " + name, fn, EMPTY_PAYLOAD, noop, noop);
    try {
      return zone.runTask(task, applyThis, applyArgs);
    } finally {
      zone.cancelTask(task);
    }
  }
  /**
   * Same as `run`, except that synchronous errors are caught and forwarded via `onError` and not
   * rethrown.
   */
  runGuarded(fn, applyThis, applyArgs) {
    return this._inner.runGuarded(fn, applyThis, applyArgs);
  }
  /**
   * Executes the `fn` function synchronously in Angular's parent zone and returns value returned by
   * the function.
   *
   * Running functions via {@link #runOutsideAngular} allows you to escape Angular's zone and do
   * work that
   * doesn't trigger Angular change-detection or is subject to Angular's error handling.
   *
   * Any future tasks or microtasks scheduled from within this function will continue executing from
   * outside of the Angular zone.
   *
   * Use {@link #run} to reenter the Angular zone and do work that updates the application model.
   */
  runOutsideAngular(fn) {
    return this._outer.run(fn);
  }
}
const EMPTY_PAYLOAD = {};
function checkStable(zone) {
  if (zone._nesting == 0 && !zone.hasPendingMicrotasks && !zone.isStable) {
    try {
      zone._nesting++;
      zone.onMicrotaskEmpty.emit(null);
    } finally {
      zone._nesting--;
      if (!zone.hasPendingMicrotasks) {
        try {
          zone.runOutsideAngular(() => zone.onStable.emit(null));
        } finally {
          zone.isStable = true;
        }
      }
    }
  }
}
function delayChangeDetectionForEvents(zone) {
  if (zone.isCheckStableRunning || zone.callbackScheduled) {
    return;
  }
  zone.callbackScheduled = true;
  function scheduleCheckStable() {
    scheduleCallbackWithRafRace(() => {
      zone.callbackScheduled = false;
      updateMicroTaskStatus(zone);
      zone.isCheckStableRunning = true;
      checkStable(zone);
      zone.isCheckStableRunning = false;
    });
  }
  if (zone.scheduleInRootZone) {
    Zone.root.run(() => {
      scheduleCheckStable();
    });
  } else {
    zone._outer.run(() => {
      scheduleCheckStable();
    });
  }
  updateMicroTaskStatus(zone);
}
function forkInnerZoneWithAngularBehavior(zone) {
  const delayChangeDetectionForEventsDelegate = () => {
    delayChangeDetectionForEvents(zone);
  };
  const instanceId = ngZoneInstanceId++;
  zone._inner = zone._inner.fork({
    name: "angular",
    properties: {
      [isAngularZoneProperty]: true,
      [angularZoneInstanceIdProperty]: instanceId,
      [angularZoneInstanceIdProperty + instanceId]: true
    },
    onInvokeTask: (delegate, current, target, task, applyThis, applyArgs) => {
      if (shouldBeIgnoredByZone(applyArgs)) {
        return delegate.invokeTask(target, task, applyThis, applyArgs);
      }
      try {
        onEnter(zone);
        return delegate.invokeTask(target, task, applyThis, applyArgs);
      } finally {
        if (zone.shouldCoalesceEventChangeDetection && task.type === "eventTask" || zone.shouldCoalesceRunChangeDetection) {
          delayChangeDetectionForEventsDelegate();
        }
        onLeave(zone);
      }
    },
    onInvoke: (delegate, current, target, callback, applyThis, applyArgs, source) => {
      try {
        onEnter(zone);
        return delegate.invoke(target, callback, applyThis, applyArgs, source);
      } finally {
        if (zone.shouldCoalesceRunChangeDetection && // Do not delay change detection when the task is the scheduler's tick.
        // We need to synchronously trigger the stability logic so that the
        // zone-based scheduler can prevent a duplicate ApplicationRef.tick
        // by first checking if the scheduler tick is running. This does seem a bit roundabout,
        // but we _do_ still want to trigger all the correct events when we exit the zone.run
        // (`onMicrotaskEmpty` and `onStable` _should_ emit; developers can have code which
        // relies on these events happening after change detection runs).
        // Note: `zone.callbackScheduled` is already in delayChangeDetectionForEventsDelegate
        // but is added here as well to prevent reads of applyArgs when not necessary
        !zone.callbackScheduled && !isSchedulerTick(applyArgs)) {
          delayChangeDetectionForEventsDelegate();
        }
        onLeave(zone);
      }
    },
    onHasTask: (delegate, current, target, hasTaskState) => {
      delegate.hasTask(target, hasTaskState);
      if (current === target) {
        if (hasTaskState.change == "microTask") {
          zone._hasPendingMicrotasks = hasTaskState.microTask;
          updateMicroTaskStatus(zone);
          checkStable(zone);
        } else if (hasTaskState.change == "macroTask") {
          zone.hasPendingMacrotasks = hasTaskState.macroTask;
        }
      }
    },
    onHandleError: (delegate, current, target, error) => {
      delegate.handleError(target, error);
      zone.runOutsideAngular(() => zone.onError.emit(error));
      return false;
    }
  });
}
function updateMicroTaskStatus(zone) {
  if (zone._hasPendingMicrotasks || (zone.shouldCoalesceEventChangeDetection || zone.shouldCoalesceRunChangeDetection) && zone.callbackScheduled === true) {
    zone.hasPendingMicrotasks = true;
  } else {
    zone.hasPendingMicrotasks = false;
  }
}
function onEnter(zone) {
  zone._nesting++;
  if (zone.isStable) {
    zone.isStable = false;
    zone.onUnstable.emit(null);
  }
}
function onLeave(zone) {
  zone._nesting--;
  checkStable(zone);
}
class NoopNgZone {
  hasPendingMicrotasks = false;
  hasPendingMacrotasks = false;
  isStable = true;
  onUnstable = /* @__PURE__ */ new EventEmitter();
  onMicrotaskEmpty = /* @__PURE__ */ new EventEmitter();
  onStable = /* @__PURE__ */ new EventEmitter();
  onError = /* @__PURE__ */ new EventEmitter();
  run(fn, applyThis, applyArgs) {
    return fn.apply(applyThis, applyArgs);
  }
  runGuarded(fn, applyThis, applyArgs) {
    return fn.apply(applyThis, applyArgs);
  }
  runOutsideAngular(fn) {
    return fn();
  }
  runTask(fn, applyThis, applyArgs, name) {
    return fn.apply(applyThis, applyArgs);
  }
}
function shouldBeIgnoredByZone(applyArgs) {
  return hasApplyArgsData(applyArgs, "__ignore_ng_zone__");
}
function isSchedulerTick(applyArgs) {
  return hasApplyArgsData(applyArgs, "__scheduler_tick__");
}
function hasApplyArgsData(applyArgs, key) {
  if (!Array.isArray(applyArgs)) {
    return false;
  }
  if (applyArgs.length !== 1) {
    return false;
  }
  return applyArgs[0]?.data?.[key] === true;
}
let AfterRenderManager = /* @__PURE__ */ (() => {
  class AfterRenderManager2 {
    impl = null;
    execute() {
      this.impl?.execute();
    }
    /** @nocollapse */
    static ɵprov = (
      /** @pureOrBreakMyCode */
      /* @__PURE__ */ ɵɵdefineInjectable({
        token: AfterRenderManager2,
        providedIn: "root",
        factory: () => new AfterRenderManager2()
      })
    );
  }
  return AfterRenderManager2;
})();
const ANIMATION_QUEUE = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => {
    return {
      queue: /* @__PURE__ */ new Set(),
      isScheduled: false,
      scheduler: null
    };
  }
});
function addToAnimationQueue(injector, animationFns, animationData) {
  const animationQueue = injector.get(ANIMATION_QUEUE);
  if (Array.isArray(animationFns)) {
    for (const animateFn of animationFns) {
      animationQueue.queue.add(animateFn);
      animationData?.detachedLeaveAnimationFns?.push(animateFn);
    }
  } else {
    animationQueue.queue.add(animationFns);
    animationData?.detachedLeaveAnimationFns?.push(animationFns);
  }
  animationQueue.scheduler && animationQueue.scheduler(injector);
}
function maybeQueueEnterAnimation(parentLView, parent, tNode, injector) {
  parentLView?.[ANIMATIONS]?.enter;
}
function applyToElementOrContainer(action, renderer, injector, parent, lNodeToHandle, tNode, beforeNode, parentLView) {
  if (lNodeToHandle != null) {
    let lContainer;
    let isComponent2 = false;
    if (isLContainer(lNodeToHandle)) {
      lContainer = lNodeToHandle;
    } else if (isLView(lNodeToHandle)) {
      isComponent2 = true;
      lNodeToHandle = lNodeToHandle[HOST];
    }
    const rNode = unwrapRNode(lNodeToHandle);
    if (action === 0 && parent !== null) {
      maybeQueueEnterAnimation(parentLView);
      if (beforeNode == null) {
        nativeAppendChild(renderer, parent, rNode);
      } else {
        nativeInsertBefore(renderer, parent, rNode, beforeNode || null, true);
      }
    } else if (action === 1 && parent !== null) {
      maybeQueueEnterAnimation(parentLView);
      nativeInsertBefore(renderer, parent, rNode, beforeNode || null, true);
    } else if (action === 2) {
      runLeaveAnimationsWithCallback(parentLView, tNode, injector, (nodeHasLeaveAnimations) => {
        nativeRemoveNode(renderer, rNode, isComponent2, nodeHasLeaveAnimations);
      });
    } else if (action === 3) {
      runLeaveAnimationsWithCallback(parentLView, tNode, injector, () => {
        renderer.destroyNode(rNode);
      });
    }
    if (lContainer != null) {
      applyContainer(renderer, action, injector, lContainer, tNode, parent, beforeNode);
    }
  }
}
function removeViewFromDOM(tView, lView) {
  detachViewFromDOM(tView, lView);
  lView[HOST] = null;
  lView[T_HOST] = null;
}
function detachViewFromDOM(tView, lView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(
    9
    /* NotificationSource.ViewDetachedFromDOM */
  );
  applyView(tView, lView, lView[RENDERER], 2, null, null);
}
function destroyViewTree(rootView) {
  let lViewOrLContainer = rootView[CHILD_HEAD];
  if (!lViewOrLContainer) {
    return cleanUpView(rootView[TVIEW], rootView);
  }
  while (lViewOrLContainer) {
    let next = null;
    if (isLView(lViewOrLContainer)) {
      next = lViewOrLContainer[CHILD_HEAD];
    } else {
      const firstView = lViewOrLContainer[CONTAINER_HEADER_OFFSET];
      if (firstView) next = firstView;
    }
    if (!next) {
      while (lViewOrLContainer && !lViewOrLContainer[NEXT] && lViewOrLContainer !== rootView) {
        if (isLView(lViewOrLContainer)) {
          cleanUpView(lViewOrLContainer[TVIEW], lViewOrLContainer);
        }
        lViewOrLContainer = lViewOrLContainer[PARENT];
      }
      if (lViewOrLContainer === null) lViewOrLContainer = rootView;
      if (isLView(lViewOrLContainer)) {
        cleanUpView(lViewOrLContainer[TVIEW], lViewOrLContainer);
      }
      next = lViewOrLContainer && lViewOrLContainer[NEXT];
    }
    lViewOrLContainer = next;
  }
}
function detachMovedView(declarationContainer, lView) {
  const movedViews = declarationContainer[MOVED_VIEWS];
  const declarationViewIndex = movedViews.indexOf(lView);
  movedViews.splice(declarationViewIndex, 1);
}
function destroyLView(tView, lView) {
  if (isDestroyed(lView)) {
    return;
  }
  const renderer = lView[RENDERER];
  if (renderer.destroyNode) {
    applyView(tView, lView, renderer, 3, null, null);
  }
  destroyViewTree(lView);
}
function cleanUpView(tView, lView) {
  if (isDestroyed(lView)) {
    return;
  }
  const prevConsumer = setActiveConsumer(null);
  try {
    lView[FLAGS] &= ~128;
    lView[FLAGS] |= 256;
    lView[REACTIVE_TEMPLATE_CONSUMER] && consumerDestroy(lView[REACTIVE_TEMPLATE_CONSUMER]);
    executeOnDestroys(tView, lView);
    processCleanups(tView, lView);
    if (lView[TVIEW].type === 1) {
      lView[RENDERER].destroy();
    }
    const declarationContainer = lView[DECLARATION_LCONTAINER];
    if (declarationContainer !== null && isLContainer(lView[PARENT])) {
      if (declarationContainer !== lView[PARENT]) {
        detachMovedView(declarationContainer, lView);
      }
      const lQueries = lView[QUERIES];
      if (lQueries !== null) {
        lQueries.detachView(tView);
      }
    }
    unregisterLView(lView);
  } finally {
    setActiveConsumer(prevConsumer);
  }
}
function runLeaveAnimationsWithCallback(lView, tNode, injector, callback) {
  const animations = lView?.[ANIMATIONS];
  if (animations == null || animations.leave == void 0 || !animations.leave.has(tNode.index)) return callback(false);
  if (lView) allLeavingAnimations.add(lView);
  addToAnimationQueue(injector, () => {
    if (animations.leave && animations.leave.has(tNode.index)) {
      const leaveAnimationMap = animations.leave;
      const leaveAnimations = leaveAnimationMap.get(tNode.index);
      const runningAnimations = [];
      if (leaveAnimations) {
        for (let index = 0; index < leaveAnimations.animateFns.length; index++) {
          const animationFn = leaveAnimations.animateFns[index];
          const {
            promise
          } = animationFn();
          runningAnimations.push(promise);
        }
        animations.detachedLeaveAnimationFns = void 0;
      }
      animations.running = Promise.allSettled(runningAnimations);
      runAfterLeaveAnimations(lView, callback);
    } else {
      if (lView) allLeavingAnimations.delete(lView);
      callback(false);
    }
  }, animations);
}
function runAfterLeaveAnimations(lView, callback) {
  const runningAnimations = lView[ANIMATIONS]?.running;
  if (runningAnimations) {
    runningAnimations.then(() => {
      lView[ANIMATIONS].running = void 0;
      allLeavingAnimations.delete(lView);
      callback(true);
    });
    return;
  }
  callback(false);
}
function processCleanups(tView, lView) {
  const tCleanup = tView.cleanup;
  const lCleanup = lView[CLEANUP];
  if (tCleanup !== null) {
    for (let i = 0; i < tCleanup.length - 1; i += 2) {
      if (typeof tCleanup[i] === "string") {
        const targetIdx = tCleanup[i + 3];
        if (targetIdx >= 0) {
          lCleanup[targetIdx]();
        } else {
          lCleanup[-targetIdx].unsubscribe();
        }
        i += 2;
      } else {
        const context = lCleanup[tCleanup[i + 1]];
        tCleanup[i].call(context);
      }
    }
  }
  if (lCleanup !== null) {
    lView[CLEANUP] = null;
  }
  const destroyHooks = lView[ON_DESTROY_HOOKS];
  if (destroyHooks !== null) {
    lView[ON_DESTROY_HOOKS] = null;
    for (let i = 0; i < destroyHooks.length; i++) {
      const destroyHooksFn = destroyHooks[i];
      destroyHooksFn();
    }
  }
  const effects = lView[EFFECTS];
  if (effects !== null) {
    lView[EFFECTS] = null;
    for (const effect of effects) {
      effect.destroy();
    }
  }
}
function executeOnDestroys(tView, lView) {
  let destroyHooks;
  if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
    for (let i = 0; i < destroyHooks.length; i += 2) {
      const context = lView[destroyHooks[i]];
      if (!(context instanceof NodeInjectorFactory)) {
        const toCall = destroyHooks[i + 1];
        if (Array.isArray(toCall)) {
          for (let j = 0; j < toCall.length; j += 2) {
            const callContext = context[toCall[j]];
            const hook = toCall[j + 1];
            profiler(4, callContext, hook);
            try {
              hook.call(callContext);
            } finally {
              profiler(5, callContext, hook);
            }
          }
        } else {
          profiler(4, context, toCall);
          try {
            toCall.call(context);
          } finally {
            profiler(5, context, toCall);
          }
        }
      }
    }
  }
}
function getParentRElement(tView, tNode, lView) {
  return getClosestRElement(tView, tNode.parent, lView);
}
function getClosestRElement(tView, tNode, lView) {
  let parentTNode = tNode;
  while (parentTNode !== null && parentTNode.type & (8 | 32 | 128)) {
    tNode = parentTNode;
    parentTNode = tNode.parent;
  }
  if (parentTNode === null) {
    return lView[HOST];
  } else {
    if (isComponentHost(parentTNode)) {
      const {
        encapsulation
      } = tView.data[parentTNode.directiveStart + parentTNode.componentOffset];
      if (encapsulation === ViewEncapsulation.None || encapsulation === ViewEncapsulation.Emulated) {
        return null;
      }
    }
    return getNativeByTNode(parentTNode, lView);
  }
}
function getInsertInFrontOfRNode(parentTNode, currentTNode, lView) {
  return _getInsertInFrontOfRNodeWithI18n(parentTNode, currentTNode, lView);
}
function getInsertInFrontOfRNodeWithNoI18n(parentTNode, currentTNode, lView) {
  if (parentTNode.type & (8 | 32)) {
    return getNativeByTNode(parentTNode, lView);
  }
  return null;
}
let _getInsertInFrontOfRNodeWithI18n = getInsertInFrontOfRNodeWithNoI18n;
function appendChild(tView, lView, childRNode, childTNode) {
  const parentRNode = getParentRElement(tView, childTNode, lView);
  const renderer = lView[RENDERER];
  const parentTNode = childTNode.parent || lView[T_HOST];
  const anchorNode = getInsertInFrontOfRNode(parentTNode, childTNode, lView);
  if (parentRNode != null) {
    if (Array.isArray(childRNode)) {
      for (let i = 0; i < childRNode.length; i++) {
        nativeAppendOrInsertBefore(renderer, parentRNode, childRNode[i], anchorNode, false);
      }
    } else {
      nativeAppendOrInsertBefore(renderer, parentRNode, childRNode, anchorNode, false);
    }
  }
}
function getProjectionNodes(lView, tNode) {
  if (tNode !== null) {
    const componentView = lView[DECLARATION_COMPONENT_VIEW];
    const componentHost = componentView[T_HOST];
    const slotIdx = tNode.projection;
    return componentHost.projection[slotIdx];
  }
  return null;
}
function applyNodes(renderer, action, tNode, lView, parentRElement, beforeNode, isProjection) {
  while (tNode != null) {
    const injector = lView[INJECTOR];
    if (tNode.type === 128) {
      tNode = tNode.next;
      continue;
    }
    const rawSlotValue = lView[tNode.index];
    const tNodeType = tNode.type;
    if (isProjection) {
      if (action === 0) {
        rawSlotValue && attachPatchData(unwrapRNode(rawSlotValue), lView);
        tNode.flags |= 2;
      }
    }
    if (!isDetachedByI18n(tNode)) {
      if (tNodeType & 8) {
        applyNodes(renderer, action, tNode.child, lView, parentRElement, beforeNode, false);
        applyToElementOrContainer(action, renderer, injector, parentRElement, rawSlotValue, tNode, beforeNode, lView);
      } else if (tNodeType & 32) {
        const nextRNode = icuContainerIterate(tNode, lView);
        let rNode;
        while (rNode = nextRNode()) {
          applyToElementOrContainer(action, renderer, injector, parentRElement, rNode, tNode, beforeNode, lView);
        }
        applyToElementOrContainer(action, renderer, injector, parentRElement, rawSlotValue, tNode, beforeNode, lView);
      } else if (tNodeType & 16) {
        applyProjectionRecursive(renderer, action, lView, tNode, parentRElement, beforeNode);
      } else {
        applyToElementOrContainer(action, renderer, injector, parentRElement, rawSlotValue, tNode, beforeNode, lView);
      }
    }
    tNode = isProjection ? tNode.projectionNext : tNode.next;
  }
}
function applyView(tView, lView, renderer, action, parentRElement, beforeNode) {
  applyNodes(renderer, action, tView.firstChild, lView, parentRElement, beforeNode, false);
}
function applyProjectionRecursive(renderer, action, lView, tProjectionNode, parentRElement, beforeNode) {
  const componentLView = lView[DECLARATION_COMPONENT_VIEW];
  const componentNode = componentLView[T_HOST];
  const nodeToProjectOrRNodes = componentNode.projection[tProjectionNode.projection];
  if (Array.isArray(nodeToProjectOrRNodes)) {
    for (let i = 0; i < nodeToProjectOrRNodes.length; i++) {
      const rNode = nodeToProjectOrRNodes[i];
      applyToElementOrContainer(action, renderer, lView[INJECTOR], parentRElement, rNode, tProjectionNode, beforeNode, lView);
    }
  } else {
    let nodeToProject = nodeToProjectOrRNodes;
    const projectedComponentLView = componentLView[PARENT];
    if (hasInSkipHydrationBlockFlag(tProjectionNode)) {
      nodeToProject.flags |= 128;
    }
    applyNodes(renderer, action, nodeToProject, projectedComponentLView, parentRElement, beforeNode, true);
  }
}
function applyContainer(renderer, action, injector, lContainer, tNode, parentRElement, beforeNode) {
  const anchor = lContainer[NATIVE];
  const native = unwrapRNode(lContainer);
  if (anchor !== native) {
    applyToElementOrContainer(action, renderer, injector, parentRElement, anchor, tNode, beforeNode);
  }
  for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
    const lView = lContainer[i];
    applyView(lView[TVIEW], lView, renderer, action, parentRElement, anchor);
  }
}
function executeTemplate(tView, lView, templateFn, rf, context) {
  const prevSelectedIndex = getSelectedIndex();
  const isUpdatePhase = rf & 2;
  try {
    setSelectedIndex(-1);
    if (isUpdatePhase && lView.length > HEADER_OFFSET) {
      selectIndexInternal(tView, lView, HEADER_OFFSET, false);
    }
    const preHookType = isUpdatePhase ? 2 : 0;
    profiler(preHookType, context, templateFn);
    templateFn(rf, context);
  } finally {
    setSelectedIndex(prevSelectedIndex);
    const postHookType = isUpdatePhase ? 3 : 1;
    profiler(postHookType, context, templateFn);
  }
}
function createDirectivesInstances(tView, lView, tNode) {
  instantiateAllDirectives(tView, lView, tNode);
  if ((tNode.flags & 64) === 64) {
    invokeDirectivesHostBindings(tView, lView, tNode);
  }
}
function saveResolvedLocalsInData(viewData, tNode, localRefExtractor = getNativeByTNode) {
  const localNames = tNode.localNames;
  if (localNames !== null) {
    let localIndex = tNode.index + 1;
    for (let i = 0; i < localNames.length; i += 2) {
      const index = localNames[i + 1];
      const value = index === -1 ? localRefExtractor(tNode, viewData) : viewData[index];
      viewData[localIndex++] = value;
    }
  }
}
function locateHostElement(renderer, elementOrSelector, encapsulation, injector) {
  const preserveHostContent = injector.get(PRESERVE_HOST_CONTENT, PRESERVE_HOST_CONTENT_DEFAULT);
  const preserveContent = preserveHostContent || encapsulation === ViewEncapsulation.ShadowDom;
  const rootElement = renderer.selectRootElement(elementOrSelector, preserveContent);
  return rootElement;
}
function instantiateAllDirectives(tView, lView, tNode) {
  const start = tNode.directiveStart;
  const end = tNode.directiveEnd;
  if (isComponentHost(tNode)) {
    createComponentLView(lView, tNode, tView.data[start + tNode.componentOffset]);
  }
  if (!tView.firstCreatePass) {
    getOrCreateNodeInjectorForNode(tNode, lView);
  }
  const initialInputs = tNode.initialInputs;
  for (let i = start; i < end; i++) {
    const def = tView.data[i];
    const directive = getNodeInjectable(lView, tView, i, tNode);
    attachPatchData(directive, lView);
    if (initialInputs !== null) {
      setInputsFromAttrs(lView, i - start, directive, def, tNode, initialInputs);
    }
    if (isComponentDef(def)) {
      const componentView = getComponentLViewByIndex(tNode.index, lView);
      componentView[CONTEXT] = getNodeInjectable(lView, tView, i, tNode);
    }
  }
}
function invokeDirectivesHostBindings(tView, lView, tNode) {
  const start = tNode.directiveStart;
  const end = tNode.directiveEnd;
  const elementIndex = tNode.index;
  const currentDirectiveIndex = getCurrentDirectiveIndex();
  try {
    setSelectedIndex(elementIndex);
    for (let dirIndex = start; dirIndex < end; dirIndex++) {
      const def = tView.data[dirIndex];
      const directive = lView[dirIndex];
      setCurrentDirectiveIndex(dirIndex);
      if (def.hostBindings !== null || def.hostVars !== 0 || def.hostAttrs !== null) {
        invokeHostBindingsInCreationMode(def, directive);
      }
    }
  } finally {
    setSelectedIndex(-1);
    setCurrentDirectiveIndex(currentDirectiveIndex);
  }
}
function invokeHostBindingsInCreationMode(def, directive) {
  if (def.hostBindings !== null) {
    def.hostBindings(1, directive);
  }
}
function setInputsFromAttrs(lView, directiveIndex, instance, def, tNode, initialInputData) {
  const initialInputs = initialInputData[directiveIndex];
  if (initialInputs !== null) {
    for (let i = 0; i < initialInputs.length; i += 2) {
      const lookupName = initialInputs[i];
      const value = initialInputs[i + 1];
      writeToDirectiveInput(def, instance, lookupName, value);
    }
  }
}
function elementLikeStartShared(tNode, lView, index, name, locateOrCreateNativeNode) {
  const adjustedIndex = HEADER_OFFSET + index;
  const tView = lView[TVIEW];
  const native = locateOrCreateNativeNode(tView, lView, tNode, name, index);
  lView[adjustedIndex] = native;
  setCurrentTNode(tNode, true);
  const isElement = tNode.type === 2;
  if (isElement) {
    setupStaticAttributes(lView[RENDERER], native, tNode);
    if (getElementDepthCount() === 0 || isDirectiveHost(tNode)) {
      attachPatchData(native, lView);
    }
    increaseElementDepthCount();
  } else {
    attachPatchData(native, lView);
  }
  if (wasLastNodeCreated() && (!isElement || !isDetachedByI18n(tNode))) {
    appendChild(tView, lView, native, tNode);
  }
  return tNode;
}
function elementLikeEndShared(tNode) {
  let currentTNode = tNode;
  if (isCurrentTNodeParent()) {
    setCurrentTNodeAsNotParent();
  } else {
    currentTNode = currentTNode.parent;
    setCurrentTNode(currentTNode, false);
  }
  return currentTNode;
}
function setAllInputsForProperty(tNode, tView, lView, publicName, value) {
  const inputs = tNode.inputs?.[publicName];
  const hostDirectiveInputs = tNode.hostDirectiveInputs?.[publicName];
  let hasMatch = false;
  if (hostDirectiveInputs) {
    for (let i = 0; i < hostDirectiveInputs.length; i += 2) {
      const index = hostDirectiveInputs[i];
      const publicName2 = hostDirectiveInputs[i + 1];
      const def = tView.data[index];
      writeToDirectiveInput(def, lView[index], publicName2, value);
      hasMatch = true;
    }
  }
  if (inputs) {
    for (const index of inputs) {
      const instance = lView[index];
      const def = tView.data[index];
      writeToDirectiveInput(def, instance, publicName, value);
      hasMatch = true;
    }
  }
  return hasMatch;
}
function renderComponent(hostLView, componentHostIdx) {
  const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
  const componentTView = componentView[TVIEW];
  syncViewWithBlueprint(componentTView, componentView);
  const hostRNode = componentView[HOST];
  if (hostRNode !== null && componentView[HYDRATION] === null) {
    componentView[HYDRATION] = retrieveHydrationInfo(hostRNode, componentView[INJECTOR]);
  }
  profiler(
    18
    /* ProfilerEvent.ComponentStart */
  );
  renderView(componentTView, componentView, componentView[CONTEXT]);
  profiler(19, componentView[CONTEXT]);
}
function syncViewWithBlueprint(tView, lView) {
  for (let i = lView.length; i < tView.blueprint.length; i++) {
    lView.push(tView.blueprint[i]);
  }
}
function renderView(tView, lView, context) {
  enterView(lView);
  try {
    const viewQuery = tView.viewQuery;
    if (viewQuery !== null) {
      executeViewQueryFn(1, viewQuery, context);
    }
    const templateFn = tView.template;
    if (templateFn !== null) {
      executeTemplate(tView, lView, templateFn, 1, context);
    }
    if (tView.firstCreatePass) {
      tView.firstCreatePass = false;
    }
    lView[QUERIES]?.finishViewCreation(tView);
    if (tView.staticContentQueries) {
      refreshContentQueries(tView, lView);
    }
    if (tView.staticViewQueries) {
      executeViewQueryFn(2, tView.viewQuery, context);
    }
    const components = tView.components;
    if (components !== null) {
      renderChildComponents(lView, components);
    }
  } catch (error) {
    if (tView.firstCreatePass) {
      tView.incompleteFirstPass = true;
      tView.firstCreatePass = false;
    }
    throw error;
  } finally {
    lView[FLAGS] &= -5;
    leaveView();
  }
}
function renderChildComponents(hostLView, components) {
  for (let i = 0; i < components.length; i++) {
    renderComponent(hostLView, components[i]);
  }
}
function collectNativeNodes(tView, lView, tNode, result, isProjection = false) {
  while (tNode !== null) {
    if (tNode.type === 128) {
      tNode = isProjection ? tNode.projectionNext : tNode.next;
      continue;
    }
    const lNode = lView[tNode.index];
    if (lNode !== null) {
      result.push(unwrapRNode(lNode));
    }
    if (isLContainer(lNode)) {
      collectNativeNodesInLContainer(lNode, result);
    }
    const tNodeType = tNode.type;
    if (tNodeType & 8) {
      collectNativeNodes(tView, lView, tNode.child, result);
    } else if (tNodeType & 32) {
      const nextRNode = icuContainerIterate(tNode, lView);
      let rNode;
      while (rNode = nextRNode()) {
        result.push(rNode);
      }
    } else if (tNodeType & 16) {
      const nodesInSlot = getProjectionNodes(lView, tNode);
      if (Array.isArray(nodesInSlot)) {
        result.push(...nodesInSlot);
      } else {
        const parentView = getLViewParent(lView[DECLARATION_COMPONENT_VIEW]);
        collectNativeNodes(parentView[TVIEW], parentView, nodesInSlot, result, true);
      }
    }
    tNode = isProjection ? tNode.projectionNext : tNode.next;
  }
  return result;
}
function collectNativeNodesInLContainer(lContainer, result) {
  for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
    const lViewInAContainer = lContainer[i];
    const lViewFirstChildTNode = lViewInAContainer[TVIEW].firstChild;
    if (lViewFirstChildTNode !== null) {
      collectNativeNodes(lViewInAContainer[TVIEW], lViewInAContainer, lViewFirstChildTNode, result);
    }
  }
  if (lContainer[NATIVE] !== lContainer[HOST]) {
    result.push(lContainer[NATIVE]);
  }
}
function addAfterRenderSequencesForView(lView) {
  if (lView[AFTER_RENDER_SEQUENCES_TO_ADD] !== null) {
    for (const sequence of lView[AFTER_RENDER_SEQUENCES_TO_ADD]) {
      sequence.impl.addSequence(sequence);
    }
    lView[AFTER_RENDER_SEQUENCES_TO_ADD].length = 0;
  }
}
let freeConsumers = [];
function getOrBorrowReactiveLViewConsumer(lView) {
  return lView[REACTIVE_TEMPLATE_CONSUMER] ?? borrowReactiveLViewConsumer(lView);
}
function borrowReactiveLViewConsumer(lView) {
  const consumer = freeConsumers.pop() ?? Object.create(REACTIVE_LVIEW_CONSUMER_NODE);
  consumer.lView = lView;
  return consumer;
}
function maybeReturnReactiveLViewConsumer(consumer) {
  if (consumer.lView[REACTIVE_TEMPLATE_CONSUMER] === consumer) {
    return;
  }
  consumer.lView = null;
  freeConsumers.push(consumer);
}
const REACTIVE_LVIEW_CONSUMER_NODE = {
  ...REACTIVE_NODE,
  consumerIsAlwaysLive: true,
  kind: "template",
  consumerMarkedDirty: (node) => {
    markAncestorsForTraversal(node.lView);
  },
  consumerOnSignalRead() {
    this.lView[REACTIVE_TEMPLATE_CONSUMER] = this;
  }
};
function getOrCreateTemporaryConsumer(lView) {
  const consumer = lView[REACTIVE_TEMPLATE_CONSUMER] ?? Object.create(TEMPORARY_CONSUMER_NODE);
  consumer.lView = lView;
  return consumer;
}
const TEMPORARY_CONSUMER_NODE = {
  ...REACTIVE_NODE,
  consumerIsAlwaysLive: true,
  kind: "template",
  consumerMarkedDirty: (node) => {
    let parent = getLViewParent(node.lView);
    while (parent && !viewShouldHaveReactiveConsumer(parent[TVIEW])) {
      parent = getLViewParent(parent);
    }
    if (!parent) {
      return;
    }
    markViewForRefresh(parent);
  },
  consumerOnSignalRead() {
    this.lView[REACTIVE_TEMPLATE_CONSUMER] = this;
  }
};
function viewShouldHaveReactiveConsumer(tView) {
  return tView.type !== 2;
}
function runEffectsInView(view) {
  if (view[EFFECTS] === null) {
    return;
  }
  let tryFlushEffects = true;
  while (tryFlushEffects) {
    let foundDirtyEffect = false;
    for (const effect of view[EFFECTS]) {
      if (!effect.dirty) {
        continue;
      }
      foundDirtyEffect = true;
      if (effect.zone === null || Zone.current === effect.zone) {
        effect.run();
      } else {
        effect.zone.run(() => effect.run());
      }
    }
    tryFlushEffects = foundDirtyEffect && !!(view[FLAGS] & 8192);
  }
}
const MAXIMUM_REFRESH_RERUNS$1 = 100;
function detectChangesInternal(lView, mode = 0) {
  const environment = lView[ENVIRONMENT];
  const rendererFactory = environment.rendererFactory;
  {
    rendererFactory.begin?.();
  }
  try {
    detectChangesInViewWhileDirty(lView, mode);
  } finally {
    {
      rendererFactory.end?.();
    }
  }
}
function detectChangesInViewWhileDirty(lView, mode) {
  const lastIsRefreshingViewsValue = isRefreshingViews();
  try {
    setIsRefreshingViews(true);
    detectChangesInView(lView, mode);
    if (false) ;
    let retries = 0;
    while (requiresRefreshOrTraversal(lView)) {
      if (retries === MAXIMUM_REFRESH_RERUNS$1) {
        throw new RuntimeError(103, false);
      }
      retries++;
      detectChangesInView(
        lView,
        1
        /* ChangeDetectionMode.Targeted */
      );
    }
  } finally {
    setIsRefreshingViews(lastIsRefreshingViewsValue);
  }
}
function refreshView(tView, lView, templateFn, context) {
  if (isDestroyed(lView)) return;
  const flags = lView[FLAGS];
  const isInCheckNoChangesPass = false;
  const isInExhaustiveCheckNoChangesPass = false;
  enterView(lView);
  let returnConsumerToPool = true;
  let prevConsumer = null;
  let currentConsumer = null;
  {
    if (viewShouldHaveReactiveConsumer(tView)) {
      currentConsumer = getOrBorrowReactiveLViewConsumer(lView);
      prevConsumer = consumerBeforeComputation(currentConsumer);
    } else if (getActiveConsumer() === null) {
      returnConsumerToPool = false;
      currentConsumer = getOrCreateTemporaryConsumer(lView);
      prevConsumer = consumerBeforeComputation(currentConsumer);
    } else if (lView[REACTIVE_TEMPLATE_CONSUMER]) {
      consumerDestroy(lView[REACTIVE_TEMPLATE_CONSUMER]);
      lView[REACTIVE_TEMPLATE_CONSUMER] = null;
    }
  }
  try {
    resetPreOrderHookFlags(lView);
    setBindingIndex(tView.bindingStartIndex);
    if (templateFn !== null) {
      executeTemplate(tView, lView, templateFn, 2, context);
    }
    const hooksInitPhaseCompleted = (flags & 3) === 3;
    if (!isInCheckNoChangesPass) {
      if (hooksInitPhaseCompleted) {
        const preOrderCheckHooks = tView.preOrderCheckHooks;
        if (preOrderCheckHooks !== null) {
          executeCheckHooks(lView, preOrderCheckHooks, null);
        }
      } else {
        const preOrderHooks = tView.preOrderHooks;
        if (preOrderHooks !== null) {
          executeInitAndCheckHooks(lView, preOrderHooks, 0, null);
        }
        incrementInitPhaseFlags(
          lView,
          0
          /* InitPhaseState.OnInitHooksToBeRun */
        );
      }
    }
    if (!isInExhaustiveCheckNoChangesPass) {
      markTransplantedViewsForRefresh(lView);
    }
    runEffectsInView(lView);
    detectChangesInEmbeddedViews(
      lView,
      0
      /* ChangeDetectionMode.Global */
    );
    if (tView.contentQueries !== null) {
      refreshContentQueries(tView, lView);
    }
    if (!isInCheckNoChangesPass) {
      if (hooksInitPhaseCompleted) {
        const contentCheckHooks = tView.contentCheckHooks;
        if (contentCheckHooks !== null) {
          executeCheckHooks(lView, contentCheckHooks);
        }
      } else {
        const contentHooks = tView.contentHooks;
        if (contentHooks !== null) {
          executeInitAndCheckHooks(
            lView,
            contentHooks,
            1
            /* InitPhaseState.AfterContentInitHooksToBeRun */
          );
        }
        incrementInitPhaseFlags(
          lView,
          1
          /* InitPhaseState.AfterContentInitHooksToBeRun */
        );
      }
    }
    processHostBindingOpCodes(tView, lView);
    const components = tView.components;
    if (components !== null) {
      detectChangesInChildComponents(
        lView,
        components,
        0
        /* ChangeDetectionMode.Global */
      );
    }
    const viewQuery = tView.viewQuery;
    if (viewQuery !== null) {
      executeViewQueryFn(2, viewQuery, context);
    }
    if (!isInCheckNoChangesPass) {
      if (hooksInitPhaseCompleted) {
        const viewCheckHooks = tView.viewCheckHooks;
        if (viewCheckHooks !== null) {
          executeCheckHooks(lView, viewCheckHooks);
        }
      } else {
        const viewHooks = tView.viewHooks;
        if (viewHooks !== null) {
          executeInitAndCheckHooks(
            lView,
            viewHooks,
            2
            /* InitPhaseState.AfterViewInitHooksToBeRun */
          );
        }
        incrementInitPhaseFlags(
          lView,
          2
          /* InitPhaseState.AfterViewInitHooksToBeRun */
        );
      }
    }
    if (tView.firstUpdatePass === true) {
      tView.firstUpdatePass = false;
    }
    if (lView[EFFECTS_TO_SCHEDULE]) {
      for (const notifyEffect of lView[EFFECTS_TO_SCHEDULE]) {
        notifyEffect();
      }
      lView[EFFECTS_TO_SCHEDULE] = null;
    }
    if (!isInCheckNoChangesPass) {
      addAfterRenderSequencesForView(lView);
      lView[FLAGS] &= ~(64 | 8);
    }
  } catch (e) {
    {
      markAncestorsForTraversal(lView);
    }
    throw e;
  } finally {
    if (currentConsumer !== null) {
      consumerAfterComputation(currentConsumer, prevConsumer);
      if (returnConsumerToPool) {
        maybeReturnReactiveLViewConsumer(currentConsumer);
      }
    }
    leaveView();
  }
}
function detectChangesInEmbeddedViews(lView, mode) {
  for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
      const embeddedLView = lContainer[i];
      detectChangesInViewIfAttached(embeddedLView, mode);
    }
  }
}
function markTransplantedViewsForRefresh(lView) {
  for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
    if (!(lContainer[FLAGS] & 2)) continue;
    const movedViews = lContainer[MOVED_VIEWS];
    for (let i = 0; i < movedViews.length; i++) {
      const movedLView = movedViews[i];
      markViewForRefresh(movedLView);
    }
  }
}
function detectChangesInComponent(hostLView, componentHostIdx, mode) {
  profiler(
    18
    /* ProfilerEvent.ComponentStart */
  );
  const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
  detectChangesInViewIfAttached(componentView, mode);
  profiler(19, componentView[CONTEXT]);
}
function detectChangesInViewIfAttached(lView, mode) {
  if (!viewAttachedToChangeDetector(lView)) {
    return;
  }
  detectChangesInView(lView, mode);
}
function detectChangesInView(lView, mode) {
  const isInCheckNoChangesPass = false;
  const tView = lView[TVIEW];
  const flags = lView[FLAGS];
  const consumer = lView[REACTIVE_TEMPLATE_CONSUMER];
  let shouldRefreshView = !!(mode === 0 && flags & 16);
  shouldRefreshView ||= !!(flags & 64 && mode === 0 && !isInCheckNoChangesPass);
  shouldRefreshView ||= !!(flags & 1024);
  shouldRefreshView ||= !!(consumer?.dirty && consumerPollProducersForChange(consumer));
  shouldRefreshView ||= false;
  if (consumer) {
    consumer.dirty = false;
  }
  lView[FLAGS] &= -9217;
  if (shouldRefreshView) {
    refreshView(tView, lView, tView.template, lView[CONTEXT]);
  } else if (flags & 8192) {
    const prevConsumer = setActiveConsumer(null);
    try {
      if (!isInCheckNoChangesPass) {
        runEffectsInView(lView);
      }
      detectChangesInEmbeddedViews(
        lView,
        1
        /* ChangeDetectionMode.Targeted */
      );
      const components = tView.components;
      if (components !== null) {
        detectChangesInChildComponents(
          lView,
          components,
          1
          /* ChangeDetectionMode.Targeted */
        );
      }
      if (!isInCheckNoChangesPass) {
        addAfterRenderSequencesForView(lView);
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}
function detectChangesInChildComponents(hostLView, components, mode) {
  for (let i = 0; i < components.length; i++) {
    detectChangesInComponent(hostLView, components[i], mode);
  }
}
function processHostBindingOpCodes(tView, lView) {
  const hostBindingOpCodes = tView.hostBindingOpCodes;
  if (hostBindingOpCodes === null) return;
  try {
    for (let i = 0; i < hostBindingOpCodes.length; i++) {
      const opCode = hostBindingOpCodes[i];
      if (opCode < 0) {
        setSelectedIndex(~opCode);
      } else {
        const directiveIdx = opCode;
        const bindingRootIndx = hostBindingOpCodes[++i];
        const hostBindingFn = hostBindingOpCodes[++i];
        setBindingRootForHostBindings(bindingRootIndx, directiveIdx);
        const context = lView[directiveIdx];
        profiler(24, context);
        hostBindingFn(2, context);
        profiler(25, context);
      }
    }
  } finally {
    setSelectedIndex(-1);
  }
}
function markViewDirty(lView, source) {
  const dirtyBitsToUse = isRefreshingViews() ? (
    // When we are actively refreshing views, we only use the `Dirty` bit to mark a view
    64
  ) : (
    // When we are not actively refreshing a view tree, it is absolutely
    // valid to update state and mark views dirty. We use the `RefreshView` flag in this
    // case to allow synchronously rerunning change detection. This applies today to
    // afterRender hooks as well as animation listeners which execute after detecting
    // changes in a view when the render factory flushes.
    1024 | 64
  );
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(source);
  while (lView) {
    lView[FLAGS] |= dirtyBitsToUse;
    const parent = getLViewParent(lView);
    if (isRootView(lView) && !parent) {
      return lView;
    }
    lView = parent;
  }
  return null;
}
function detachView(lContainer, removeIndex) {
  if (lContainer.length <= CONTAINER_HEADER_OFFSET) return;
  const indexInContainer = CONTAINER_HEADER_OFFSET + removeIndex;
  const viewToDetach = lContainer[indexInContainer];
  if (viewToDetach) {
    const declarationLContainer = viewToDetach[DECLARATION_LCONTAINER];
    if (declarationLContainer !== null && declarationLContainer !== lContainer) {
      detachMovedView(declarationLContainer, viewToDetach);
    }
    if (removeIndex > 0) {
      lContainer[indexInContainer - 1][NEXT] = viewToDetach[NEXT];
    }
    const removedLView = removeFromArray(lContainer, CONTAINER_HEADER_OFFSET + removeIndex);
    removeViewFromDOM(viewToDetach[TVIEW], viewToDetach);
    const lQueries = removedLView[QUERIES];
    if (lQueries !== null) {
      lQueries.detachView(removedLView[TVIEW]);
    }
    viewToDetach[PARENT] = null;
    viewToDetach[NEXT] = null;
    viewToDetach[FLAGS] &= -129;
  }
  return viewToDetach;
}
function trackMovedView(declarationContainer, lView) {
  const movedViews = declarationContainer[MOVED_VIEWS];
  const parent = lView[PARENT];
  if (isLView(parent)) {
    declarationContainer[FLAGS] |= 2;
  } else {
    const insertedComponentLView = parent[PARENT][DECLARATION_COMPONENT_VIEW];
    const declaredComponentLView = lView[DECLARATION_COMPONENT_VIEW];
    if (declaredComponentLView !== insertedComponentLView) {
      declarationContainer[FLAGS] |= 2;
    }
  }
  if (movedViews === null) {
    declarationContainer[MOVED_VIEWS] = [lView];
  } else {
    movedViews.push(lView);
  }
}
class ViewRef {
  _lView;
  _cdRefInjectingView;
  _appRef = null;
  _attachedToViewContainer = false;
  exhaustive;
  get rootNodes() {
    const lView = this._lView;
    const tView = lView[TVIEW];
    return collectNativeNodes(tView, lView, tView.firstChild, []);
  }
  constructor(_lView, _cdRefInjectingView) {
    this._lView = _lView;
    this._cdRefInjectingView = _cdRefInjectingView;
  }
  get context() {
    return this._lView[CONTEXT];
  }
  /**
   * @deprecated Replacing the full context object is not supported. Modify the context
   *   directly, or consider using a `Proxy` if you need to replace the full object.
   * // TODO(devversion): Remove this.
   */
  set context(value) {
    this._lView[CONTEXT] = value;
  }
  get destroyed() {
    return isDestroyed(this._lView);
  }
  destroy() {
    if (this._appRef) {
      this._appRef.detachView(this);
    } else if (this._attachedToViewContainer) {
      const parent = this._lView[PARENT];
      if (isLContainer(parent)) {
        const viewRefs = parent[VIEW_REFS];
        const index = viewRefs ? viewRefs.indexOf(this) : -1;
        if (index > -1) {
          detachView(parent, index);
          removeFromArray(viewRefs, index);
        }
      }
      this._attachedToViewContainer = false;
    }
    destroyLView(this._lView[TVIEW], this._lView);
  }
  onDestroy(callback) {
    storeLViewOnDestroy(this._lView, callback);
  }
  /**
   * Marks a view and all of its ancestors dirty.
   *
   * This can be used to ensure an {@link ChangeDetectionStrategy#OnPush} component is
   * checked when it needs to be re-rendered but the two normal triggers haven't marked it
   * dirty (i.e. inputs haven't changed and events haven't fired in the view).
   *
   * <!-- TODO: Add a link to a chapter on OnPush components -->
   *
   * @usageNotes
   * ### Example
   *
   * ```ts
   * @Component({
   *   selector: 'app-root',
   *   template: `Number of ticks: {{numberOfTicks}}`
   *   changeDetection: ChangeDetectionStrategy.OnPush,
   * })
   * class AppComponent {
   *   numberOfTicks = 0;
   *
   *   constructor(private ref: ChangeDetectorRef) {
   *     setInterval(() => {
   *       this.numberOfTicks++;
   *       // the following is required, otherwise the view will not be updated
   *       this.ref.markForCheck();
   *     }, 1000);
   *   }
   * }
   * ```
   */
  markForCheck() {
    markViewDirty(
      this._cdRefInjectingView || this._lView,
      4
      /* NotificationSource.MarkForCheck */
    );
  }
  /**
   * Detaches the view from the change detection tree.
   *
   * Detached views will not be checked during change detection runs until they are
   * re-attached, even if they are dirty. `detach` can be used in combination with
   * {@link ChangeDetectorRef#detectChanges} to implement local change
   * detection checks.
   *
   * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
   * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
   *
   * @usageNotes
   * ### Example
   *
   * The following example defines a component with a large list of readonly data.
   * Imagine the data changes constantly, many times per second. For performance reasons,
   * we want to check and update the list every five seconds. We can do that by detaching
   * the component's change detector and doing a local check every five seconds.
   *
   * ```ts
   * class DataProvider {
   *   // in a real application the returned data will be different every time
   *   get data() {
   *     return [1,2,3,4,5];
   *   }
   * }
   *
   * @Component({
   *   selector: 'giant-list',
   *   template: `
   *     @for(d of dataProvider.data; track $index) {
   *        <li>Data {{d}}</li>
   *     }
   *   `,
   * })
   * class GiantList {
   *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {
   *     ref.detach();
   *     setInterval(() => {
   *       this.ref.detectChanges();
   *     }, 5000);
   *   }
   * }
   *
   * @Component({
   *   selector: 'app',
   *   providers: [DataProvider],
   *   template: `
   *     <giant-list><giant-list>
   *   `,
   * })
   * class App {
   * }
   * ```
   */
  detach() {
    this._lView[FLAGS] &= -129;
  }
  /**
   * Re-attaches a view to the change detection tree.
   *
   * This can be used to re-attach views that were previously detached from the tree
   * using {@link ChangeDetectorRef#detach}. Views are attached to the tree by default.
   *
   * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
   *
   * @usageNotes
   * ### Example
   *
   * The following example creates a component displaying `live` data. The component will detach
   * its change detector from the main change detector tree when the component's live property
   * is set to false.
   *
   * ```ts
   * class DataProvider {
   *   data = 1;
   *
   *   constructor() {
   *     setInterval(() => {
   *       this.data = this.data * 2;
   *     }, 500);
   *   }
   * }
   *
   * @Component({
   *   selector: 'live-data',
   *   inputs: ['live'],
   *   template: 'Data: {{dataProvider.data}}'
   * })
   * class LiveData {
   *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {}
   *
   *   set live(value) {
   *     if (value) {
   *       this.ref.reattach();
   *     } else {
   *       this.ref.detach();
   *     }
   *   }
   * }
   *
   * @Component({
   *   selector: 'app-root',
   *   providers: [DataProvider],
   *   template: `
   *     Live Update: <input type="checkbox" [(ngModel)]="live">
   *     <live-data [live]="live"><live-data>
   *   `,
   * })
   * class AppComponent {
   *   live = true;
   * }
   * ```
   */
  reattach() {
    updateAncestorTraversalFlagsOnAttach(this._lView);
    this._lView[FLAGS] |= 128;
  }
  /**
   * Checks the view and its children.
   *
   * This can also be used in combination with {@link ChangeDetectorRef#detach} to implement
   * local change detection checks.
   *
   * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
   * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
   *
   * @usageNotes
   * ### Example
   *
   * The following example defines a component with a large list of readonly data.
   * Imagine, the data changes constantly, many times per second. For performance reasons,
   * we want to check and update the list every five seconds.
   *
   * We can do that by detaching the component's change detector and doing a local change detection
   * check every five seconds.
   *
   * See {@link ChangeDetectorRef#detach} for more information.
   */
  detectChanges() {
    this._lView[FLAGS] |= 1024;
    detectChangesInternal(this._lView);
  }
  /**
   * Checks the change detector and its children, and throws if any changes are detected.
   *
   * This is used in development mode to verify that running change detection doesn't
   * introduce other changes.
   */
  checkNoChanges() {
  }
  attachToViewContainerRef() {
    if (this._appRef) {
      throw new RuntimeError(902, false);
    }
    this._attachedToViewContainer = true;
  }
  detachFromAppRef() {
    this._appRef = null;
    const isRoot = isRootView(this._lView);
    const declarationContainer = this._lView[DECLARATION_LCONTAINER];
    if (declarationContainer !== null && !isRoot) {
      detachMovedView(declarationContainer, this._lView);
    }
    detachViewFromDOM(this._lView[TVIEW], this._lView);
  }
  attachToAppRef(appRef) {
    if (this._attachedToViewContainer) {
      throw new RuntimeError(902, false);
    }
    this._appRef = appRef;
    const isRoot = isRootView(this._lView);
    const declarationContainer = this._lView[DECLARATION_LCONTAINER];
    if (declarationContainer !== null && !isRoot) {
      trackMovedView(declarationContainer, this._lView);
    }
    updateAncestorTraversalFlagsOnAttach(this._lView);
  }
}
function getOrCreateTNode(tView, index, type, name, attrs) {
  let tNode = tView.data[index];
  if (tNode === null) {
    tNode = createTNodeAtIndex(tView, index, type, name, attrs);
    if (isInI18nBlock()) {
      tNode.flags |= 32;
    }
  } else if (tNode.type & 64) {
    tNode.type = type;
    tNode.value = name;
    tNode.attrs = attrs;
    const parent = getCurrentParentTNode();
    tNode.injectorIndex = parent === null ? -1 : parent.injectorIndex;
  }
  setCurrentTNode(tNode, true);
  return tNode;
}
function createTNodeAtIndex(tView, index, type, name, attrs) {
  const currentTNode = getCurrentTNodePlaceholderOk();
  const isParent = isCurrentTNodeParent();
  const parent = isParent ? currentTNode : currentTNode && currentTNode.parent;
  const tNode = tView.data[index] = createTNode(tView, parent, type, index, name, attrs);
  linkTNodeInTView(tView, tNode, currentTNode, isParent);
  return tNode;
}
function linkTNodeInTView(tView, tNode, currentTNode, isParent) {
  if (tView.firstChild === null) {
    tView.firstChild = tNode;
  }
  if (currentTNode !== null) {
    if (isParent) {
      if (currentTNode.child == null && tNode.parent !== null) {
        currentTNode.child = tNode;
      }
    } else {
      if (currentTNode.next === null) {
        currentTNode.next = tNode;
        tNode.prev = currentTNode;
      }
    }
  }
}
function createTNode(tView, tParent, type, index, value, attrs) {
  let injectorIndex = tParent ? tParent.injectorIndex : -1;
  let flags = 0;
  if (isInSkipHydrationBlock()) {
    flags |= 128;
  }
  const tNode = {
    type,
    index,
    insertBeforeIndex: null,
    injectorIndex,
    directiveStart: -1,
    directiveEnd: -1,
    directiveStylingLast: -1,
    componentOffset: -1,
    propertyBindings: null,
    flags,
    providerIndexes: 0,
    value,
    namespace: getNamespace(),
    attrs,
    mergedAttrs: null,
    localNames: null,
    initialInputs: null,
    inputs: null,
    hostDirectiveInputs: null,
    outputs: null,
    hostDirectiveOutputs: null,
    directiveToIndex: null,
    tView: null,
    next: null,
    prev: null,
    projectionNext: null,
    child: null,
    parent: tParent,
    projection: null,
    styles: null,
    stylesWithoutHost: null,
    residualStyles: void 0,
    classes: null,
    classesWithoutHost: null,
    residualClasses: void 0,
    classBindings: 0,
    styleBindings: 0
  };
  return tNode;
}
let ComponentRef$1 = class ComponentRef {
};
let ComponentFactory$1 = class ComponentFactory {
};
class _NullComponentFactoryResolver {
  resolveComponentFactory(component) {
    throw new RuntimeError(917, false);
  }
}
let ComponentFactoryResolver$1 = class ComponentFactoryResolver {
  static NULL = /* @__PURE__ */ new _NullComponentFactoryResolver();
};
class RendererFactory2 {
}
let Sanitizer = /* @__PURE__ */ (() => {
  class Sanitizer2 {
    /** @nocollapse */
    static ɵprov = (
      /** @pureOrBreakMyCode */
      /* @__PURE__ */ ɵɵdefineInjectable({
        token: Sanitizer2,
        providedIn: "root",
        factory: () => null
      })
    );
  }
  return Sanitizer2;
})();
const NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = {};
class ChainedInjector {
  injector;
  parentInjector;
  constructor(injector, parentInjector) {
    this.injector = injector;
    this.parentInjector = parentInjector;
  }
  get(token, notFoundValue, options) {
    const value = this.injector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, options);
    if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR || notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
      return value;
    }
    return this.parentInjector.get(token, notFoundValue, options);
  }
}
function computeStaticStyling(tNode, attrs, writeToHost) {
  let styles = writeToHost ? tNode.styles : null;
  let classes = writeToHost ? tNode.classes : null;
  let mode = 0;
  if (attrs !== null) {
    for (let i = 0; i < attrs.length; i++) {
      const value = attrs[i];
      if (typeof value === "number") {
        mode = value;
      } else if (mode == 1) {
        classes = concatStringsWithSpace(classes, value);
      } else if (mode == 2) {
        const style = value;
        const styleValue = attrs[++i];
        styles = concatStringsWithSpace(styles, style + ": " + styleValue + ";");
      }
    }
  }
  writeToHost ? tNode.styles = styles : tNode.stylesWithoutHost = styles;
  writeToHost ? tNode.classes = classes : tNode.classesWithoutHost = classes;
}
function ɵɵdirectiveInject(token, flags = 0) {
  const lView = getLView();
  if (lView === null) {
    return ɵɵinject(token, flags);
  }
  const tNode = getCurrentTNode();
  const value = getOrCreateInjectable(tNode, lView, resolveForwardRef(token), flags);
  return value;
}
function resolveDirectives(tView, lView, tNode, localRefs, directiveMatcher) {
  const exportsMap = localRefs === null ? null : {
    "": -1
  };
  const matchedDirectiveDefs = directiveMatcher(tView, tNode);
  if (matchedDirectiveDefs !== null) {
    let directiveDefs = matchedDirectiveDefs;
    let hostDirectiveDefs = null;
    let hostDirectiveRanges = null;
    for (const def of matchedDirectiveDefs) {
      if (def.resolveHostDirectives !== null) {
        [directiveDefs, hostDirectiveDefs, hostDirectiveRanges] = def.resolveHostDirectives(matchedDirectiveDefs);
        break;
      }
    }
    initializeDirectives(tView, lView, tNode, directiveDefs, exportsMap, hostDirectiveDefs, hostDirectiveRanges);
  }
  if (exportsMap !== null && localRefs !== null) {
    cacheMatchingLocalNames(tNode, localRefs, exportsMap);
  }
}
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
  const localNames = tNode.localNames = [];
  for (let i = 0; i < localRefs.length; i += 2) {
    const index = exportsMap[localRefs[i + 1]];
    if (index == null) throw new RuntimeError(-301, false);
    localNames.push(localRefs[i], index);
  }
}
function markAsComponentHost(tView, hostTNode, componentOffset) {
  hostTNode.componentOffset = componentOffset;
  (tView.components ??= []).push(hostTNode.index);
}
function initializeDirectives(tView, lView, tNode, directives, exportsMap, hostDirectiveDefs, hostDirectiveRanges) {
  const directivesLength = directives.length;
  let hasSeenComponent = false;
  for (let i = 0; i < directivesLength; i++) {
    const def = directives[i];
    if (!hasSeenComponent && isComponentDef(def)) {
      hasSeenComponent = true;
      markAsComponentHost(tView, tNode, i);
    }
    diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, def.type);
  }
  initTNodeFlags(tNode, tView.data.length, directivesLength);
  for (let i = 0; i < directivesLength; i++) {
    const def = directives[i];
    if (def.providersResolver) def.providersResolver(def);
  }
  let preOrderHooksFound = false;
  let preOrderCheckHooksFound = false;
  let directiveIdx = allocExpando(tView, lView, directivesLength, null);
  if (directivesLength > 0) {
    tNode.directiveToIndex = /* @__PURE__ */ new Map();
  }
  for (let i = 0; i < directivesLength; i++) {
    const def = directives[i];
    tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, def.hostAttrs);
    configureViewWithDirective(tView, tNode, lView, directiveIdx, def);
    saveNameToExportMap(directiveIdx, def, exportsMap);
    if (hostDirectiveRanges !== null && hostDirectiveRanges.has(def)) {
      const [start, end] = hostDirectiveRanges.get(def);
      tNode.directiveToIndex.set(def.type, [directiveIdx, start + tNode.directiveStart, end + tNode.directiveStart]);
    } else if (hostDirectiveDefs === null || !hostDirectiveDefs.has(def)) {
      tNode.directiveToIndex.set(def.type, directiveIdx);
    }
    if (def.contentQueries !== null) tNode.flags |= 4;
    if (def.hostBindings !== null || def.hostAttrs !== null || def.hostVars !== 0) tNode.flags |= 64;
    const lifeCycleHooks = def.type.prototype;
    if (!preOrderHooksFound && (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngOnInit || lifeCycleHooks.ngDoCheck)) {
      (tView.preOrderHooks ??= []).push(tNode.index);
      preOrderHooksFound = true;
    }
    if (!preOrderCheckHooksFound && (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngDoCheck)) {
      (tView.preOrderCheckHooks ??= []).push(tNode.index);
      preOrderCheckHooksFound = true;
    }
    directiveIdx++;
  }
  initializeInputAndOutputAliases(tView, tNode, hostDirectiveDefs);
}
function initializeInputAndOutputAliases(tView, tNode, hostDirectiveDefs) {
  for (let index = tNode.directiveStart; index < tNode.directiveEnd; index++) {
    const directiveDef = tView.data[index];
    if (hostDirectiveDefs === null || !hostDirectiveDefs.has(directiveDef)) {
      setupSelectorMatchedInputsOrOutputs(0, tNode, directiveDef, index);
      setupSelectorMatchedInputsOrOutputs(1, tNode, directiveDef, index);
      setupInitialInputs(tNode, index, false);
    } else {
      const hostDirectiveDef = hostDirectiveDefs.get(directiveDef);
      setupHostDirectiveInputsOrOutputs(0, tNode, hostDirectiveDef, index);
      setupHostDirectiveInputsOrOutputs(1, tNode, hostDirectiveDef, index);
      setupInitialInputs(tNode, index, true);
    }
  }
}
function setupSelectorMatchedInputsOrOutputs(mode, tNode, def, directiveIndex) {
  const aliasMap = mode === 0 ? def.inputs : def.outputs;
  for (const publicName in aliasMap) {
    if (aliasMap.hasOwnProperty(publicName)) {
      let bindings;
      if (mode === 0) {
        bindings = tNode.inputs ??= {};
      } else {
        bindings = tNode.outputs ??= {};
      }
      bindings[publicName] ??= [];
      bindings[publicName].push(directiveIndex);
      setShadowStylingInputFlags(tNode, publicName);
    }
  }
}
function setupHostDirectiveInputsOrOutputs(mode, tNode, config, directiveIndex) {
  const aliasMap = mode === 0 ? config.inputs : config.outputs;
  for (const initialName in aliasMap) {
    if (aliasMap.hasOwnProperty(initialName)) {
      const publicName = aliasMap[initialName];
      let bindings;
      if (mode === 0) {
        bindings = tNode.hostDirectiveInputs ??= {};
      } else {
        bindings = tNode.hostDirectiveOutputs ??= {};
      }
      bindings[publicName] ??= [];
      bindings[publicName].push(directiveIndex, initialName);
      setShadowStylingInputFlags(tNode, publicName);
    }
  }
}
function setShadowStylingInputFlags(tNode, publicName) {
  if (publicName === "class") {
    tNode.flags |= 8;
  } else if (publicName === "style") {
    tNode.flags |= 16;
  }
}
function setupInitialInputs(tNode, directiveIndex, isHostDirective) {
  const {
    attrs,
    inputs,
    hostDirectiveInputs
  } = tNode;
  if (attrs === null || !isHostDirective && inputs === null || isHostDirective && hostDirectiveInputs === null || // Do not use unbound attributes as inputs to structural directives, since structural
  // directive inputs can only be set using microsyntax (e.g. `<div *dir="exp">`).
  isInlineTemplate(tNode)) {
    tNode.initialInputs ??= [];
    tNode.initialInputs.push(null);
    return;
  }
  let inputsToStore = null;
  let i = 0;
  while (i < attrs.length) {
    const attrName = attrs[i];
    if (attrName === 0) {
      i += 4;
      continue;
    } else if (attrName === 5) {
      i += 2;
      continue;
    } else if (typeof attrName === "number") {
      break;
    }
    if (!isHostDirective && inputs.hasOwnProperty(attrName)) {
      const inputConfig = inputs[attrName];
      for (const index of inputConfig) {
        if (index === directiveIndex) {
          inputsToStore ??= [];
          inputsToStore.push(attrName, attrs[i + 1]);
          break;
        }
      }
    } else if (isHostDirective && hostDirectiveInputs.hasOwnProperty(attrName)) {
      const config = hostDirectiveInputs[attrName];
      for (let j = 0; j < config.length; j += 2) {
        if (config[j] === directiveIndex) {
          inputsToStore ??= [];
          inputsToStore.push(config[j + 1], attrs[i + 1]);
          break;
        }
      }
    }
    i += 2;
  }
  tNode.initialInputs ??= [];
  tNode.initialInputs.push(inputsToStore);
}
function configureViewWithDirective(tView, tNode, lView, directiveIndex, def) {
  tView.data[directiveIndex] = def;
  const directiveFactory = def.factory || (def.factory = getFactoryDef(def.type, true));
  const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), ɵɵdirectiveInject, null);
  tView.blueprint[directiveIndex] = nodeInjectorFactory;
  lView[directiveIndex] = nodeInjectorFactory;
  registerHostBindingOpCodes(tView, tNode, directiveIndex, allocExpando(tView, lView, def.hostVars, NO_CHANGE), def);
}
function registerHostBindingOpCodes(tView, tNode, directiveIdx, directiveVarsIdx, def) {
  const hostBindings = def.hostBindings;
  if (hostBindings) {
    let hostBindingOpCodes = tView.hostBindingOpCodes;
    if (hostBindingOpCodes === null) {
      hostBindingOpCodes = tView.hostBindingOpCodes = [];
    }
    const elementIndx = ~tNode.index;
    if (lastSelectedElementIdx(hostBindingOpCodes) != elementIndx) {
      hostBindingOpCodes.push(elementIndx);
    }
    hostBindingOpCodes.push(directiveIdx, directiveVarsIdx, hostBindings);
  }
}
function lastSelectedElementIdx(hostBindingOpCodes) {
  let i = hostBindingOpCodes.length;
  while (i > 0) {
    const value = hostBindingOpCodes[--i];
    if (typeof value === "number" && value < 0) {
      return value;
    }
  }
  return 0;
}
function saveNameToExportMap(directiveIdx, def, exportsMap) {
  if (exportsMap) {
    if (def.exportAs) {
      for (let i = 0; i < def.exportAs.length; i++) {
        exportsMap[def.exportAs[i]] = directiveIdx;
      }
    }
    if (isComponentDef(def)) exportsMap[""] = directiveIdx;
  }
}
function initTNodeFlags(tNode, index, numberOfDirectives) {
  tNode.flags |= 1;
  tNode.directiveStart = index;
  tNode.directiveEnd = index + numberOfDirectives;
  tNode.providerIndexes = index;
}
function directiveHostFirstCreatePass(index, lView, type, name, directiveMatcher, bindingsEnabled, attrsIndex, localRefsIndex) {
  const tView = lView[TVIEW];
  const tViewConsts = tView.consts;
  const attrs = getConstant(tViewConsts, attrsIndex);
  const tNode = getOrCreateTNode(tView, index, type, name, attrs);
  {
    resolveDirectives(tView, lView, tNode, getConstant(tViewConsts, localRefsIndex), directiveMatcher);
  }
  tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);
  if (tNode.attrs !== null) {
    computeStaticStyling(tNode, tNode.attrs, false);
  }
  if (tNode.mergedAttrs !== null) {
    computeStaticStyling(tNode, tNode.mergedAttrs, true);
  }
  if (tView.queries !== null) {
    tView.queries.elementStart(tView, tNode);
  }
  return tNode;
}
function directiveHostEndFirstCreatePass(tView, tNode) {
  registerPostOrderHooks(tView, tNode);
  if (isContentQueryHost(tNode)) {
    tView.queries.elementEnd(tNode);
  }
}
function domOnlyFirstCreatePass(index, tView, type, name, attrsIndex, localRefsIndex) {
  const tViewConsts = tView.consts;
  const attrs = getConstant(tViewConsts, attrsIndex);
  const tNode = getOrCreateTNode(tView, index, type, name, attrs);
  tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);
  if (localRefsIndex != null) {
    const refs = getConstant(tViewConsts, localRefsIndex);
    tNode.localNames = [];
    for (let i = 0; i < refs.length; i += 2) {
      tNode.localNames.push(refs[i], -1);
    }
  }
  if (tNode.attrs !== null) {
    computeStaticStyling(tNode, tNode.attrs, false);
  }
  if (tNode.mergedAttrs !== null) {
    computeStaticStyling(tNode, tNode.mergedAttrs, true);
  }
  if (tView.queries !== null) {
    tView.queries.elementStart(tView, tNode);
  }
  return tNode;
}
function bindingUpdated(lView, bindingIndex, value) {
  if (value === NO_CHANGE) {
    return false;
  }
  const oldValue = lView[bindingIndex];
  if (Object.is(oldValue, value)) {
    return false;
  } else {
    lView[bindingIndex] = value;
    return true;
  }
}
/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
const BINDING = /* @__PURE__ */ Symbol("BINDING");
class ComponentFactoryResolver2 extends ComponentFactoryResolver$1 {
  ngModule;
  /**
   * @param ngModule The NgModuleRef to which all resolved factories are bound.
   */
  constructor(ngModule) {
    super();
    this.ngModule = ngModule;
  }
  resolveComponentFactory(component) {
    const componentDef = getComponentDef(component);
    return new ComponentFactory2(componentDef, this.ngModule);
  }
}
function toInputRefArray(map2) {
  return Object.keys(map2).map((name) => {
    const [propName, flags, transform] = map2[name];
    const inputData = {
      propName,
      templateName: name,
      isSignal: (flags & InputFlags.SignalBased) !== 0
    };
    if (transform) {
      inputData.transform = transform;
    }
    return inputData;
  });
}
function toOutputRefArray(map2) {
  return Object.keys(map2).map((name) => ({
    propName: map2[name],
    templateName: name
  }));
}
function createRootViewInjector(componentDef, environmentInjector, injector) {
  let realEnvironmentInjector = environmentInjector instanceof EnvironmentInjector ? environmentInjector : environmentInjector?.injector;
  if (realEnvironmentInjector && componentDef.getStandaloneInjector !== null) {
    realEnvironmentInjector = componentDef.getStandaloneInjector(realEnvironmentInjector) || realEnvironmentInjector;
  }
  const rootViewInjector = realEnvironmentInjector ? new ChainedInjector(injector, realEnvironmentInjector) : injector;
  return rootViewInjector;
}
function createRootLViewEnvironment(rootLViewInjector) {
  const rendererFactory = rootLViewInjector.get(RendererFactory2, null);
  if (rendererFactory === null) {
    throw new RuntimeError(407, false);
  }
  const sanitizer = rootLViewInjector.get(Sanitizer, null);
  const changeDetectionScheduler = rootLViewInjector.get(ChangeDetectionScheduler, null);
  let ngReflect = false;
  return {
    rendererFactory,
    sanitizer,
    changeDetectionScheduler,
    ngReflect
  };
}
function createHostElement(componentDef, renderer) {
  const tagName = inferTagNameFromDefinition(componentDef);
  const namespace = tagName === "svg" ? SVG_NAMESPACE : tagName === "math" ? MATH_ML_NAMESPACE : null;
  return createElementNode(renderer, tagName, namespace);
}
function assertNotScriptHostElement(tagName) {
  if (tagName?.toLowerCase() === "script") {
    throw new RuntimeError(905, false);
  }
}
function inferTagNameFromDefinition(componentDef) {
  return (componentDef.selectors[0][0] || "div").toLowerCase();
}
class ComponentFactory2 extends ComponentFactory$1 {
  componentDef;
  ngModule;
  selector;
  componentType;
  ngContentSelectors;
  isBoundToModule;
  cachedInputs = null;
  cachedOutputs = null;
  get inputs() {
    this.cachedInputs ??= toInputRefArray(this.componentDef.inputs);
    return this.cachedInputs;
  }
  get outputs() {
    this.cachedOutputs ??= toOutputRefArray(this.componentDef.outputs);
    return this.cachedOutputs;
  }
  /**
   * @param componentDef The component definition.
   * @param ngModule The NgModuleRef to which the factory is bound.
   */
  constructor(componentDef, ngModule) {
    super();
    this.componentDef = componentDef;
    this.ngModule = ngModule;
    this.componentType = componentDef.type;
    this.selector = stringifyCSSSelectorList(componentDef.selectors);
    this.ngContentSelectors = componentDef.ngContentSelectors ?? [];
    this.isBoundToModule = !!ngModule;
  }
  create(injector, projectableNodes, rootSelectorOrNode, environmentInjector, directives, componentBindings) {
    profiler(
      22
      /* ProfilerEvent.DynamicComponentStart */
    );
    const prevConsumer = setActiveConsumer(null);
    try {
      const cmpDef = this.componentDef;
      const rootTView = createRootTView(rootSelectorOrNode, cmpDef, componentBindings, directives);
      const rootViewInjector = createRootViewInjector(cmpDef, environmentInjector || this.ngModule, injector);
      const environment = createRootLViewEnvironment(rootViewInjector);
      const hostRenderer = environment.rendererFactory.createRenderer(null, cmpDef);
      const hostElement = rootSelectorOrNode ? locateHostElement(hostRenderer, rootSelectorOrNode, cmpDef.encapsulation, rootViewInjector) : createHostElement(cmpDef, hostRenderer);
      assertNotScriptHostElement(hostElement?.tagName);
      const hasInputBindings = componentBindings?.some(isInputBinding) || directives?.some((d) => typeof d !== "function" && d.bindings.some(isInputBinding));
      const rootLView = createLView(null, rootTView, null, 512 | getInitialLViewFlagsFromDef(cmpDef), null, null, environment, hostRenderer, rootViewInjector, null, retrieveHydrationInfo(
        hostElement,
        rootViewInjector,
        true
        /* isRootView */
      ));
      rootLView[HEADER_OFFSET] = hostElement;
      enterView(rootLView);
      let componentView = null;
      try {
        const hostTNode = directiveHostFirstCreatePass(HEADER_OFFSET, rootLView, 2, "#host", () => rootTView.directiveRegistry, true, 0);
        setupStaticAttributes(hostRenderer, hostElement, hostTNode);
        attachPatchData(hostElement, rootLView);
        createDirectivesInstances(rootTView, rootLView, hostTNode);
        executeContentQueries(rootTView, hostTNode, rootLView);
        directiveHostEndFirstCreatePass(rootTView, hostTNode);
        if (projectableNodes !== void 0) {
          projectNodes(hostTNode, this.ngContentSelectors, projectableNodes);
        }
        componentView = getComponentLViewByIndex(hostTNode.index, rootLView);
        rootLView[CONTEXT] = componentView[CONTEXT];
        renderView(rootTView, rootLView, null);
      } catch (e) {
        if (componentView !== null) {
          unregisterLView(componentView);
        }
        unregisterLView(rootLView);
        throw e;
      } finally {
        profiler(
          23
          /* ProfilerEvent.DynamicComponentEnd */
        );
        leaveView();
      }
      return new ComponentRef2(this.componentType, rootLView, !!hasInputBindings);
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}
function createRootTView(rootSelectorOrNode, componentDef, componentBindings, directives) {
  const tAttributes = rootSelectorOrNode ? ["ng-version", "20.3.35"] : (
    // Extract attributes and classes from the first selector only to match VE behavior.
    extractAttrsAndClassesFromSelector(componentDef.selectors[0])
  );
  let creationBindings = null;
  let updateBindings = null;
  let varsToAllocate = 0;
  if (componentBindings) {
    for (const binding of componentBindings) {
      varsToAllocate += binding[BINDING].requiredVars;
      if (binding.create) {
        binding.targetIdx = 0;
        (creationBindings ??= []).push(binding);
      }
      if (binding.update) {
        binding.targetIdx = 0;
        (updateBindings ??= []).push(binding);
      }
    }
  }
  if (directives) {
    for (let i = 0; i < directives.length; i++) {
      const directive = directives[i];
      if (typeof directive !== "function") {
        for (const binding of directive.bindings) {
          varsToAllocate += binding[BINDING].requiredVars;
          const targetDirectiveIdx = i + 1;
          if (binding.create) {
            binding.targetIdx = targetDirectiveIdx;
            (creationBindings ??= []).push(binding);
          }
          if (binding.update) {
            binding.targetIdx = targetDirectiveIdx;
            (updateBindings ??= []).push(binding);
          }
        }
      }
    }
  }
  const directivesToApply = [componentDef];
  if (directives) {
    for (const directive of directives) {
      const directiveType = typeof directive === "function" ? directive : directive.type;
      const directiveDef = getDirectiveDef(directiveType);
      directivesToApply.push(directiveDef);
    }
  }
  const rootTView = createTView(0, null, getRootTViewTemplate(creationBindings, updateBindings), 1, varsToAllocate, directivesToApply, null, null, null, [tAttributes], null);
  return rootTView;
}
function getRootTViewTemplate(creationBindings, updateBindings) {
  if (!creationBindings && !updateBindings) {
    return null;
  }
  return (flags) => {
    if (flags & 1 && creationBindings) {
      for (const binding of creationBindings) {
        binding.create();
      }
    }
    if (flags & 2 && updateBindings) {
      for (const binding of updateBindings) {
        binding.update();
      }
    }
  };
}
function isInputBinding(binding) {
  const kind = binding[BINDING].kind;
  return kind === "input" || kind === "twoWay";
}
class ComponentRef2 extends ComponentRef$1 {
  _rootLView;
  _hasInputBindings;
  instance;
  hostView;
  changeDetectorRef;
  componentType;
  location;
  previousInputValues = null;
  _tNode;
  constructor(componentType, _rootLView, _hasInputBindings) {
    super();
    this._rootLView = _rootLView;
    this._hasInputBindings = _hasInputBindings;
    this._tNode = getTNode(_rootLView[TVIEW], HEADER_OFFSET);
    this.location = createElementRef(this._tNode, _rootLView);
    this.instance = getComponentLViewByIndex(this._tNode.index, _rootLView)[CONTEXT];
    this.hostView = this.changeDetectorRef = new ViewRef(
      _rootLView,
      void 0
      /* _cdRefInjectingView */
    );
    this.componentType = componentType;
  }
  setInput(name, value) {
    if (this._hasInputBindings && false) ;
    const tNode = this._tNode;
    this.previousInputValues ??= /* @__PURE__ */ new Map();
    if (this.previousInputValues.has(name) && Object.is(this.previousInputValues.get(name), value)) {
      return;
    }
    const lView = this._rootLView;
    setAllInputsForProperty(tNode, lView[TVIEW], lView, name, value);
    this.previousInputValues.set(name, value);
    const childComponentLView = getComponentLViewByIndex(tNode.index, lView);
    markViewDirty(
      childComponentLView,
      1
      /* NotificationSource.SetInput */
    );
  }
  get injector() {
    return new NodeInjector(this._tNode, this._rootLView);
  }
  destroy() {
    this.hostView.destroy();
  }
  onDestroy(callback) {
    this.hostView.onDestroy(callback);
  }
}
function projectNodes(tNode, ngContentSelectors, projectableNodes) {
  const projection = tNode.projection = [];
  for (let i = 0; i < ngContentSelectors.length; i++) {
    const nodesforSlot = projectableNodes[i];
    projection.push(nodesforSlot != null && nodesforSlot.length ? Array.from(nodesforSlot) : null);
  }
}
let NgModuleRef$1 = class NgModuleRef {
};
class EnvironmentNgModuleRefAdapter extends NgModuleRef$1 {
  injector;
  componentFactoryResolver = /* @__PURE__ */ new ComponentFactoryResolver2(this);
  instance = null;
  constructor(config) {
    super();
    const injector = new R3Injector([...config.providers, {
      provide: NgModuleRef$1,
      useValue: this
    }, {
      provide: ComponentFactoryResolver$1,
      useValue: this.componentFactoryResolver
    }], config.parent || getNullInjector(), config.debugName, /* @__PURE__ */ new Set(["environment"]));
    this.injector = injector;
    if (config.runEnvironmentInitializers) {
      injector.resolveInjectorInitializers();
    }
  }
  destroy() {
    this.injector.destroy();
  }
  onDestroy(callback) {
    this.injector.onDestroy(callback);
  }
}
function createEnvironmentInjector(providers, parent, debugName = null) {
  const adapter = new EnvironmentNgModuleRefAdapter({
    providers,
    parent,
    debugName,
    runEnvironmentInitializers: true
  });
  return adapter.injector;
}
let StandaloneService = /* @__PURE__ */ (() => {
  class StandaloneService2 {
    _injector;
    cachedInjectors = /* @__PURE__ */ new Map();
    constructor(_injector) {
      this._injector = _injector;
    }
    getOrCreateStandaloneInjector(componentDef) {
      if (!componentDef.standalone) {
        return null;
      }
      if (!this.cachedInjectors.has(componentDef)) {
        const providers = internalImportProvidersFrom(false, componentDef.type);
        const standaloneInjector = providers.length > 0 ? createEnvironmentInjector([providers], this._injector, `Standalone[${componentDef.type.name}]`) : null;
        this.cachedInjectors.set(componentDef, standaloneInjector);
      }
      return this.cachedInjectors.get(componentDef);
    }
    ngOnDestroy() {
      try {
        for (const injector of this.cachedInjectors.values()) {
          if (injector !== null) {
            injector.destroy();
          }
        }
      } finally {
        this.cachedInjectors.clear();
      }
    }
    /** @nocollapse */
    static ɵprov = (
      /** @pureOrBreakMyCode */
      /* @__PURE__ */ ɵɵdefineInjectable({
        token: StandaloneService2,
        providedIn: "environment",
        factory: () => new StandaloneService2(ɵɵinject(EnvironmentInjector))
      })
    );
  }
  return StandaloneService2;
})();
function ɵɵdefineComponent(componentDefinition) {
  return noSideEffects(() => {
    const baseDef = getNgDirectiveDef(componentDefinition);
    const def = {
      ...baseDef,
      decls: componentDefinition.decls,
      vars: componentDefinition.vars,
      template: componentDefinition.template,
      consts: componentDefinition.consts || null,
      ngContentSelectors: componentDefinition.ngContentSelectors,
      onPush: componentDefinition.changeDetection === ChangeDetectionStrategy.OnPush,
      directiveDefs: null,
      // assigned in noSideEffects
      pipeDefs: null,
      // assigned in noSideEffects
      dependencies: baseDef.standalone && componentDefinition.dependencies || null,
      getStandaloneInjector: baseDef.standalone ? (parentInjector) => {
        return parentInjector.get(StandaloneService).getOrCreateStandaloneInjector(def);
      } : null,
      getExternalStyles: null,
      signals: componentDefinition.signals ?? false,
      data: componentDefinition.data || {},
      encapsulation: componentDefinition.encapsulation || ViewEncapsulation.Emulated,
      styles: componentDefinition.styles || EMPTY_ARRAY,
      _: null,
      schemas: componentDefinition.schemas || null,
      tView: null,
      id: ""
    };
    if (baseDef.standalone) {
      performanceMarkFeature("NgStandalone");
    }
    initFeatures(def);
    const dependencies = componentDefinition.dependencies;
    def.directiveDefs = extractDefListOrFactory(dependencies, extractDirectiveDef);
    def.pipeDefs = extractDefListOrFactory(dependencies, getPipeDef);
    def.id = getComponentId(def);
    return def;
  });
}
function extractDirectiveDef(type) {
  return getComponentDef(type) || getDirectiveDef(type);
}
function parseAndConvertInputsForDefinition(obj, declaredInputs) {
  if (obj == null) return EMPTY_OBJ;
  const newLookup = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      const value = obj[minifiedKey];
      let publicName;
      let declaredName;
      let inputFlags;
      let transform;
      if (Array.isArray(value)) {
        inputFlags = value[0];
        publicName = value[1];
        declaredName = value[2] ?? publicName;
        transform = value[3] || null;
      } else {
        publicName = value;
        declaredName = value;
        inputFlags = InputFlags.None;
        transform = null;
      }
      newLookup[publicName] = [minifiedKey, inputFlags, transform];
      declaredInputs[publicName] = declaredName;
    }
  }
  return newLookup;
}
function parseAndConvertOutputsForDefinition(obj) {
  if (obj == null) return EMPTY_OBJ;
  const newLookup = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      newLookup[obj[minifiedKey]] = minifiedKey;
    }
  }
  return newLookup;
}
function getNgDirectiveDef(directiveDefinition) {
  const declaredInputs = {};
  return {
    type: directiveDefinition.type,
    providersResolver: null,
    factory: null,
    hostBindings: directiveDefinition.hostBindings || null,
    hostVars: directiveDefinition.hostVars || 0,
    hostAttrs: directiveDefinition.hostAttrs || null,
    contentQueries: directiveDefinition.contentQueries || null,
    declaredInputs,
    inputConfig: directiveDefinition.inputs || EMPTY_OBJ,
    exportAs: directiveDefinition.exportAs || null,
    standalone: directiveDefinition.standalone ?? true,
    signals: directiveDefinition.signals === true,
    selectors: directiveDefinition.selectors || EMPTY_ARRAY,
    viewQuery: directiveDefinition.viewQuery || null,
    features: directiveDefinition.features || null,
    setInput: null,
    resolveHostDirectives: null,
    hostDirectives: null,
    inputs: parseAndConvertInputsForDefinition(directiveDefinition.inputs, declaredInputs),
    outputs: parseAndConvertOutputsForDefinition(directiveDefinition.outputs),
    debugInfo: null
  };
}
function initFeatures(definition) {
  definition.features?.forEach((fn) => fn(definition));
}
function extractDefListOrFactory(dependencies, defExtractor) {
  if (!dependencies) {
    return null;
  }
  return () => {
    const resolvedDependencies = typeof dependencies === "function" ? dependencies() : dependencies;
    const result = [];
    for (const dep of resolvedDependencies) {
      const definition = defExtractor(dep);
      if (definition !== null) {
        result.push(definition);
      }
    }
    return result;
  };
}
function getComponentId(componentDef) {
  let hash = 0;
  const componentDefConsts = typeof componentDef.consts === "function" ? "" : componentDef.consts;
  const hashSelectors = [
    componentDef.selectors,
    componentDef.ngContentSelectors,
    componentDef.hostVars,
    componentDef.hostAttrs,
    componentDefConsts,
    componentDef.vars,
    componentDef.decls,
    componentDef.encapsulation,
    componentDef.standalone,
    componentDef.signals,
    componentDef.exportAs,
    JSON.stringify(componentDef.inputs),
    JSON.stringify(componentDef.outputs),
    // We cannot use 'componentDef.type.name' as the name of the symbol will change and will not
    // match in the server and browser bundles.
    Object.getOwnPropertyNames(componentDef.type.prototype),
    !!componentDef.contentQueries,
    !!componentDef.viewQuery
  ];
  for (const char of hashSelectors.join("|")) {
    hash = Math.imul(31, hash) + char.charCodeAt(0) << 0;
  }
  hash += 2147483647 + 1;
  const compId = "c" + hash;
  return compId;
}
const TESTABILITY = /* @__PURE__ */ new InjectionToken("");
function isPromise(obj) {
  return !!obj && typeof obj.then === "function";
}
function isSubscribable(obj) {
  return !!obj && typeof obj.subscribe === "function";
}
const APP_INITIALIZER = /* @__PURE__ */ new InjectionToken("");
let ApplicationInitStatus = /* @__PURE__ */ (() => {
  class ApplicationInitStatus2 {
    // Using non null assertion, these fields are defined below
    // within the `new Promise` callback (synchronously).
    resolve;
    reject;
    initialized = false;
    done = false;
    donePromise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
    appInits = inject(APP_INITIALIZER, {
      optional: true
    }) ?? [];
    injector = inject(Injector);
    constructor() {
    }
    /** @internal */
    runInitializers() {
      if (this.initialized) {
        return;
      }
      const asyncInitPromises = [];
      for (const appInits of this.appInits) {
        const initResult = runInInjectionContext(this.injector, appInits);
        if (isPromise(initResult)) {
          asyncInitPromises.push(initResult);
        } else if (isSubscribable(initResult)) {
          const observableAsPromise = new Promise((resolve, reject) => {
            initResult.subscribe({
              complete: resolve,
              error: reject
            });
          });
          asyncInitPromises.push(observableAsPromise);
        }
      }
      const complete = () => {
        this.done = true;
        this.resolve();
      };
      Promise.all(asyncInitPromises).then(() => {
        complete();
      }).catch((e) => {
        this.reject(e);
      });
      if (asyncInitPromises.length === 0) {
        complete();
      }
      this.initialized = true;
    }
    static ɵfac = function ApplicationInitStatus_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || ApplicationInitStatus2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: ApplicationInitStatus2,
      factory: ApplicationInitStatus2.ɵfac,
      providedIn: "root"
    });
  }
  return ApplicationInitStatus2;
})();
const APP_BOOTSTRAP_LISTENER = /* @__PURE__ */ new InjectionToken("");
function isBoundToModule(cf) {
  return cf.isBoundToModule;
}
const MAXIMUM_REFRESH_RERUNS = 10;
let ApplicationRef = /* @__PURE__ */ (() => {
  class ApplicationRef2 {
    /** @internal */
    _runningTick = false;
    _destroyed = false;
    _destroyListeners = [];
    /** @internal */
    _views = [];
    internalErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
    afterRenderManager = inject(AfterRenderManager);
    zonelessEnabled = inject(ZONELESS_ENABLED);
    rootEffectScheduler = inject(EffectScheduler);
    /**
     * Current dirty state of the application across a number of dimensions (views, afterRender hooks,
     * etc).
     *
     * A flag set here means that `tick()` will attempt to resolve the dirtiness when executed.
     *
     * @internal
     */
    dirtyFlags = 0;
    /**
     * Most recent snapshot from the `TracingService`, if any.
     *
     * This snapshot attempts to capture the context when `tick()` was first
     * scheduled. It then runs wrapped in this context.
     *
     * @internal
     */
    tracingSnapshot = null;
    // Needed for ComponentFixture temporarily during migration of autoDetect behavior
    // Eventually the hostView of the fixture should just attach to ApplicationRef.
    allTestViews = /* @__PURE__ */ new Set();
    autoDetectTestViews = /* @__PURE__ */ new Set();
    includeAllTestViews = false;
    /** @internal */
    afterTick = new Subject();
    /** @internal */
    get allViews() {
      return [...(this.includeAllTestViews ? this.allTestViews : this.autoDetectTestViews).keys(), ...this._views];
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
      return this._destroyed;
    }
    /**
     * Get a list of component types registered to this application.
     * This list is populated even before the component is created.
     */
    componentTypes = [];
    /**
     * Get a list of components registered to this application.
     */
    components = [];
    internalPendingTask = inject(PendingTasksInternal);
    /**
     * Returns an Observable that indicates when the application is stable or unstable.
     */
    get isStable() {
      return this.internalPendingTask.hasPendingTasksObservable.pipe(map((pending) => !pending));
    }
    constructor() {
      inject(TracingService, {
        optional: true
      });
    }
    /**
     * @returns A promise that resolves when the application becomes stable
     */
    whenStable() {
      let subscription;
      return new Promise((resolve) => {
        subscription = this.isStable.subscribe({
          next: (stable) => {
            if (stable) {
              resolve();
            }
          }
        });
      }).finally(() => {
        subscription.unsubscribe();
      });
    }
    _injector = inject(EnvironmentInjector);
    _rendererFactory = null;
    /**
     * The `EnvironmentInjector` used to create this application.
     */
    get injector() {
      return this._injector;
    }
    /**
     * Bootstrap a component onto the element identified by its selector or, optionally, to a
     * specified element.
     *
     * @usageNotes
     * ### Bootstrap process
     *
     * When bootstrapping a component, Angular mounts it onto a target DOM element
     * and kicks off automatic change detection. The target DOM element can be
     * provided using the `rootSelectorOrNode` argument.
     *
     * If the target DOM element is not provided, Angular tries to find one on a page
     * using the `selector` of the component that is being bootstrapped
     * (first matched element is used).
     *
     * ### Example
     *
     * Generally, we define the component to bootstrap in the `bootstrap` array of `NgModule`,
     * but it requires us to know the component while writing the application code.
     *
     * Imagine a situation where we have to wait for an API call to decide about the component to
     * bootstrap. We can use the `ngDoBootstrap` hook of the `NgModule` and call this method to
     * dynamically bootstrap a component.
     *
     * {@example core/ts/platform/platform.ts region='componentSelector'}
     *
     * Optionally, a component can be mounted onto a DOM element that does not match the
     * selector of the bootstrapped component.
     *
     * In the following example, we are providing a CSS selector to match the target element.
     *
     * {@example core/ts/platform/platform.ts region='cssSelector'}
     *
     * While in this example, we are providing reference to a DOM node.
     *
     * {@example core/ts/platform/platform.ts region='domNode'}
     */
    bootstrap(componentOrFactory, rootSelectorOrNode) {
      return this.bootstrapImpl(componentOrFactory, rootSelectorOrNode);
    }
    bootstrapImpl(componentOrFactory, rootSelectorOrNode, injector = Injector.NULL) {
      const ngZone = this._injector.get(NgZone);
      return ngZone.run(() => {
        profiler(
          10
          /* ProfilerEvent.BootstrapComponentStart */
        );
        const isComponentFactory = componentOrFactory instanceof ComponentFactory$1;
        const initStatus = this._injector.get(ApplicationInitStatus);
        if (!initStatus.done) {
          let errorMessage = "";
          throw new RuntimeError(405, errorMessage);
        }
        let componentFactory;
        if (isComponentFactory) {
          componentFactory = componentOrFactory;
        } else {
          const resolver = this._injector.get(ComponentFactoryResolver$1);
          componentFactory = resolver.resolveComponentFactory(componentOrFactory);
        }
        this.componentTypes.push(componentFactory.componentType);
        const ngModule = isBoundToModule(componentFactory) ? void 0 : this._injector.get(NgModuleRef$1);
        const selectorOrNode = rootSelectorOrNode || componentFactory.selector;
        const compRef = componentFactory.create(injector, [], selectorOrNode, ngModule);
        const nativeElement = compRef.location.nativeElement;
        const testability = compRef.injector.get(TESTABILITY, null);
        testability?.registerApplication(nativeElement);
        compRef.onDestroy(() => {
          this.detachView(compRef.hostView);
          remove(this.components, compRef);
          testability?.unregisterApplication(nativeElement);
        });
        this._loadComponent(compRef);
        profiler(11, compRef);
        return compRef;
      });
    }
    /**
     * Invoke this method to explicitly process change detection and its side-effects.
     *
     * In development mode, `tick()` also performs a second change detection cycle to ensure that no
     * further changes are detected. If additional changes are picked up during this second cycle,
     * bindings in the app have side-effects that cannot be resolved in a single change detection
     * pass.
     * In this case, Angular throws an error, since an Angular application can only have one change
     * detection pass during which all change detection must complete.
     */
    tick() {
      if (!this.zonelessEnabled) {
        this.dirtyFlags |= 1;
      }
      this._tick();
    }
    /** @internal */
    _tick() {
      profiler(
        12
        /* ProfilerEvent.ChangeDetectionStart */
      );
      if (this.tracingSnapshot !== null) {
        this.tracingSnapshot.run(TracingAction.CHANGE_DETECTION, this.tickImpl);
      } else {
        this.tickImpl();
      }
    }
    tickImpl = () => {
      if (this._runningTick) {
        throw new RuntimeError(101, false);
      }
      const prevConsumer = setActiveConsumer(null);
      try {
        this._runningTick = true;
        this.synchronize();
        if (false) ;
      } finally {
        this._runningTick = false;
        this.tracingSnapshot?.dispose();
        this.tracingSnapshot = null;
        setActiveConsumer(prevConsumer);
        this.afterTick.next();
        profiler(
          13
          /* ProfilerEvent.ChangeDetectionEnd */
        );
      }
    };
    /**
     * Performs the core work of synchronizing the application state with the UI, resolving any
     * pending dirtiness (potentially in a loop).
     */
    synchronize() {
      if (this._rendererFactory === null && !this._injector.destroyed) {
        this._rendererFactory = this._injector.get(RendererFactory2, null, {
          optional: true
        });
      }
      let runs = 0;
      while (this.dirtyFlags !== 0 && runs++ < MAXIMUM_REFRESH_RERUNS) {
        profiler(
          14
          /* ProfilerEvent.ChangeDetectionSyncStart */
        );
        this.synchronizeOnce();
        profiler(
          15
          /* ProfilerEvent.ChangeDetectionSyncEnd */
        );
      }
    }
    /**
     * Perform a single synchronization pass.
     */
    synchronizeOnce() {
      if (this.dirtyFlags & 16) {
        this.dirtyFlags &= -17;
        this.rootEffectScheduler.flush();
      }
      let ranDetectChanges = false;
      if (this.dirtyFlags & 7) {
        const useGlobalCheck = Boolean(
          this.dirtyFlags & 1
          /* ApplicationRefDirtyFlags.ViewTreeGlobal */
        );
        this.dirtyFlags &= -8;
        this.dirtyFlags |= 8;
        for (let {
          _lView
        } of this.allViews) {
          if (!useGlobalCheck && !requiresRefreshOrTraversal(_lView)) {
            continue;
          }
          const mode = useGlobalCheck && !this.zonelessEnabled ? (
            // Global mode includes `CheckAlways` views.
            0
          ) : (
            // Only refresh views with the `RefreshView` flag or views is a changed signal
            1
          );
          detectChangesInternal(_lView, mode);
          ranDetectChanges = true;
        }
        this.dirtyFlags &= -5;
        this.syncDirtyFlagsWithViews();
        if (this.dirtyFlags & (7 | 16)) {
          return;
        }
      }
      if (!ranDetectChanges) {
        this._rendererFactory?.begin?.();
        this._rendererFactory?.end?.();
      }
      if (this.dirtyFlags & 8) {
        this.dirtyFlags &= -9;
        this.afterRenderManager.execute();
      }
      this.syncDirtyFlagsWithViews();
    }
    /**
     * Checks `allViews` for views which require refresh/traversal, and updates `dirtyFlags`
     * accordingly, with two potential behaviors:
     *
     * 1. If any of our views require updating, then this adds the `ViewTreeTraversal` dirty flag.
     *    This _should_ be a no-op, since the scheduler should've added the flag at the same time the
     *    view was marked as needing updating.
     *
     *    TODO(alxhub): figure out if this behavior is still needed for edge cases.
     *
     * 2. If none of our views require updating, then clear the view-related `dirtyFlag`s. This
     *    happens when the scheduler is notified of a view becoming dirty, but the view itself isn't
     *    reachable through traversal from our roots (e.g. it's detached from the CD tree).
     */
    syncDirtyFlagsWithViews() {
      if (this.allViews.some(({
        _lView
      }) => requiresRefreshOrTraversal(_lView))) {
        this.dirtyFlags |= 2;
        return;
      } else {
        this.dirtyFlags &= -8;
      }
    }
    /**
     * Attaches a view so that it will be dirty checked.
     * The view will be automatically detached when it is destroyed.
     * This will throw if the view is already attached to a ViewContainer.
     */
    attachView(viewRef) {
      const view = viewRef;
      this._views.push(view);
      view.attachToAppRef(this);
    }
    /**
     * Detaches a view from dirty checking again.
     */
    detachView(viewRef) {
      const view = viewRef;
      remove(this._views, view);
      view.detachFromAppRef();
    }
    _loadComponent(componentRef) {
      this.attachView(componentRef.hostView);
      try {
        this.tick();
      } catch (e) {
        this.internalErrorHandler(e);
      }
      this.components.push(componentRef);
      const listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []);
      listeners.forEach((listener) => listener(componentRef));
    }
    /** @internal */
    ngOnDestroy() {
      if (this._destroyed) return;
      try {
        this._destroyListeners.forEach((listener) => listener());
        this._views.slice().forEach((view) => view.destroy());
      } finally {
        this._destroyed = true;
        this._views = [];
        this._destroyListeners = [];
      }
    }
    /**
     * Registers a listener to be called when an instance is destroyed.
     *
     * @param callback A callback function to add as a listener.
     * @returns A function which unregisters a listener.
     */
    onDestroy(callback) {
      this._destroyListeners.push(callback);
      return () => remove(this._destroyListeners, callback);
    }
    /**
     * Destroys an Angular application represented by this `ApplicationRef`. Calling this function
     * will destroy the associated environment injectors as well as all the bootstrapped components
     * with their views.
     */
    destroy() {
      if (this._destroyed) {
        throw new RuntimeError(406, false);
      }
      const injector = this._injector;
      if (injector.destroy && !injector.destroyed) {
        injector.destroy();
      }
    }
    /**
     * Returns the number of attached views.
     */
    get viewCount() {
      return this._views.length;
    }
    static ɵfac = function ApplicationRef_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || ApplicationRef2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: ApplicationRef2,
      factory: ApplicationRef2.ɵfac,
      providedIn: "root"
    });
  }
  return ApplicationRef2;
})();
function remove(list, el) {
  const index = list.indexOf(el);
  if (index > -1) {
    list.splice(index, 1);
  }
}
typeof document !== "undefined" && // tslint:disable-next-line:no-toplevel-property-access
typeof document?.documentElement?.getAnimations === "function";
function ɵɵdomElementStart(index, name, attrsIndex, localRefsIndex) {
  const lView = getLView();
  const tView = lView[TVIEW];
  const adjustedIndex = index + HEADER_OFFSET;
  const tNode = tView.firstCreatePass ? domOnlyFirstCreatePass(adjustedIndex, tView, 2, name, attrsIndex, localRefsIndex) : tView.data[adjustedIndex];
  elementLikeStartShared(tNode, lView, index, name, _locateOrCreateElementNode);
  if (localRefsIndex != null) {
    saveResolvedLocalsInData(lView, tNode);
  }
  return ɵɵdomElementStart;
}
function ɵɵdomElementEnd() {
  const initialTNode = getCurrentTNode();
  const currentTNode = elementLikeEndShared(initialTNode);
  if (isSkipHydrationRootTNode(currentTNode)) {
    leaveSkipHydrationBlock();
  }
  decreaseElementDepthCount();
  return ɵɵdomElementEnd;
}
function ɵɵdomElement(index, name, attrsIndex, localRefsIndex) {
  ɵɵdomElementStart(index, name, attrsIndex, localRefsIndex);
  ɵɵdomElementEnd();
  return ɵɵdomElement;
}
let _locateOrCreateElementNode = (tView, lView, tNode, name, index) => {
  lastNodeWasCreated(true);
  return createElementNode(lView[RENDERER], name, getNamespace());
};
const DEFAULT_LOCALE_ID = "en-US";
function setLocaleId(localeId) {
  if (typeof localeId === "string") {
    localeId.toLowerCase().replace(/_/g, "-");
  }
}
function ɵɵtext(index, value = "") {
  const lView = getLView();
  const tView = getTView();
  const adjustedIndex = index + HEADER_OFFSET;
  const tNode = tView.firstCreatePass ? getOrCreateTNode(tView, adjustedIndex, 1, value, null) : tView.data[adjustedIndex];
  const textNative = _locateOrCreateTextNode(tView, lView, tNode, value);
  lView[adjustedIndex] = textNative;
  if (wasLastNodeCreated()) {
    appendChild(tView, lView, textNative, tNode);
  }
  setCurrentTNode(tNode, false);
}
let _locateOrCreateTextNode = (tView, lView, tNode, value, index) => {
  lastNodeWasCreated(true);
  return createTextNode(lView[RENDERER], value);
};
function interpolation1(lView, prefix, v0, suffix = "") {
  const different = bindingUpdated(lView, nextBindingIndex(), v0);
  return different ? prefix + renderStringify(v0) + suffix : NO_CHANGE;
}
function ɵɵtextInterpolate(v0) {
  ɵɵtextInterpolate1("", v0);
  return ɵɵtextInterpolate;
}
function ɵɵtextInterpolate1(prefix, v0, suffix) {
  const lView = getLView();
  const interpolated = interpolation1(lView, prefix, v0, suffix);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated);
  }
  return ɵɵtextInterpolate1;
}
function textBindingInternal(lView, index, value) {
  const element = getNativeByIndex(index, lView);
  updateTextNode(lView[RENDERER], element, value);
}
let NgZoneChangeDetectionScheduler = /* @__PURE__ */ (() => {
  class NgZoneChangeDetectionScheduler2 {
    zone = inject(NgZone);
    changeDetectionScheduler = inject(ChangeDetectionScheduler);
    applicationRef = inject(ApplicationRef);
    applicationErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
    _onMicrotaskEmptySubscription;
    initialize() {
      if (this._onMicrotaskEmptySubscription) {
        return;
      }
      this._onMicrotaskEmptySubscription = this.zone.onMicrotaskEmpty.subscribe({
        next: () => {
          if (this.changeDetectionScheduler.runningTick) {
            return;
          }
          this.zone.run(() => {
            try {
              this.applicationRef.dirtyFlags |= 1;
              this.applicationRef._tick();
            } catch (e) {
              this.applicationErrorHandler(e);
            }
          });
        }
      });
    }
    ngOnDestroy() {
      this._onMicrotaskEmptySubscription?.unsubscribe();
    }
    static ɵfac = function NgZoneChangeDetectionScheduler_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || NgZoneChangeDetectionScheduler2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: NgZoneChangeDetectionScheduler2,
      factory: NgZoneChangeDetectionScheduler2.ɵfac,
      providedIn: "root"
    });
  }
  return NgZoneChangeDetectionScheduler2;
})();
function internalProvideZoneChangeDetection({
  ngZoneFactory,
  ignoreChangesOutsideZone,
  scheduleInRootZone
}) {
  ngZoneFactory ??= () => new NgZone({
    ...getNgZoneOptions(),
    scheduleInRootZone
  });
  return [
    {
      provide: NgZone,
      useFactory: ngZoneFactory
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => {
        const ngZoneChangeDetectionScheduler = inject(NgZoneChangeDetectionScheduler, {
          optional: true
        });
        return () => ngZoneChangeDetectionScheduler.initialize();
      }
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => {
        const service = inject(ZoneStablePendingTask);
        return () => {
          service.initialize();
        };
      }
    },
    // Always disable scheduler whenever explicitly disabled, even if another place called
    // `provideZoneChangeDetection` without the 'ignore' option.
    ignoreChangesOutsideZone === true ? {
      provide: ZONELESS_SCHEDULER_DISABLED,
      useValue: true
    } : [],
    {
      provide: SCHEDULE_IN_ROOT_ZONE,
      useValue: scheduleInRootZone ?? SCHEDULE_IN_ROOT_ZONE_DEFAULT
    },
    {
      provide: INTERNAL_APPLICATION_ERROR_HANDLER,
      useFactory: () => {
        const zone = inject(NgZone);
        const injector = inject(EnvironmentInjector);
        let userErrorHandler;
        return (e) => {
          zone.runOutsideAngular(() => {
            if (injector.destroyed && !userErrorHandler) {
              setTimeout(() => {
                throw e;
              });
            } else {
              userErrorHandler ??= injector.get(ErrorHandler);
              userErrorHandler.handleError(e);
            }
          });
        };
      }
    }
  ];
}
function getNgZoneOptions(options) {
  return {
    enableLongStackTrace: false,
    shouldCoalesceEventChangeDetection: options?.eventCoalescing ?? false,
    shouldCoalesceRunChangeDetection: options?.runCoalescing ?? false
  };
}
let ZoneStablePendingTask = /* @__PURE__ */ (() => {
  class ZoneStablePendingTask2 {
    subscription = new Subscription();
    initialized = false;
    zone = inject(NgZone);
    pendingTasks = inject(PendingTasksInternal);
    initialize() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;
      let task = null;
      if (!this.zone.isStable && !this.zone.hasPendingMacrotasks && !this.zone.hasPendingMicrotasks) {
        task = this.pendingTasks.add();
      }
      this.zone.runOutsideAngular(() => {
        this.subscription.add(this.zone.onStable.subscribe(() => {
          NgZone.assertNotInAngularZone();
          queueMicrotask(() => {
            if (task !== null && !this.zone.hasPendingMacrotasks && !this.zone.hasPendingMicrotasks) {
              this.pendingTasks.remove(task);
              task = null;
            }
          });
        }));
      });
      this.subscription.add(this.zone.onUnstable.subscribe(() => {
        NgZone.assertInAngularZone();
        task ??= this.pendingTasks.add();
      }));
    }
    ngOnDestroy() {
      this.subscription.unsubscribe();
    }
    static ɵfac = function ZoneStablePendingTask_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || ZoneStablePendingTask2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: ZoneStablePendingTask2,
      factory: ZoneStablePendingTask2.ɵfac,
      providedIn: "root"
    });
  }
  return ZoneStablePendingTask2;
})();
let ChangeDetectionSchedulerImpl = /* @__PURE__ */ (() => {
  class ChangeDetectionSchedulerImpl2 {
    applicationErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
    appRef = inject(ApplicationRef);
    taskService = inject(PendingTasksInternal);
    ngZone = inject(NgZone);
    zonelessEnabled = inject(ZONELESS_ENABLED);
    tracing = inject(TracingService, {
      optional: true
    });
    disableScheduling = inject(ZONELESS_SCHEDULER_DISABLED, {
      optional: true
    }) ?? false;
    zoneIsDefined = typeof Zone !== "undefined" && !!Zone.root.run;
    schedulerTickApplyArgs = [{
      data: {
        "__scheduler_tick__": true
      }
    }];
    subscriptions = new Subscription();
    angularZoneId = this.zoneIsDefined ? this.ngZone._inner?.get(angularZoneInstanceIdProperty) : null;
    scheduleInRootZone = !this.zonelessEnabled && this.zoneIsDefined && (inject(SCHEDULE_IN_ROOT_ZONE, {
      optional: true
    }) ?? false);
    cancelScheduledCallback = null;
    useMicrotaskScheduler = false;
    runningTick = false;
    pendingRenderTaskId = null;
    constructor() {
      this.subscriptions.add(this.appRef.afterTick.subscribe(() => {
        if (!this.runningTick) {
          this.cleanup();
        }
      }));
      this.subscriptions.add(this.ngZone.onUnstable.subscribe(() => {
        if (!this.runningTick) {
          this.cleanup();
        }
      }));
      this.disableScheduling ||= !this.zonelessEnabled && // NoopNgZone without enabling zoneless means no scheduling whatsoever
      (this.ngZone instanceof NoopNgZone || // The same goes for the lack of Zone without enabling zoneless scheduling
      !this.zoneIsDefined);
    }
    notify(source) {
      if (!this.zonelessEnabled && source === 5) {
        return;
      }
      let force = false;
      switch (source) {
        case 0: {
          this.appRef.dirtyFlags |= 2;
          break;
        }
        case 3:
        case 2:
        case 4:
        case 5:
        case 1: {
          this.appRef.dirtyFlags |= 4;
          break;
        }
        case 6: {
          this.appRef.dirtyFlags |= 2;
          force = true;
          break;
        }
        case 12: {
          this.appRef.dirtyFlags |= 16;
          force = true;
          break;
        }
        case 13: {
          this.appRef.dirtyFlags |= 2;
          force = true;
          break;
        }
        case 11: {
          force = true;
          break;
        }
        case 9:
        case 8:
        case 7:
        case 10:
        default: {
          this.appRef.dirtyFlags |= 8;
        }
      }
      this.appRef.tracingSnapshot = this.tracing?.snapshot(this.appRef.tracingSnapshot) ?? null;
      if (!this.shouldScheduleTick(force)) {
        return;
      }
      const scheduleCallback = this.useMicrotaskScheduler ? scheduleCallbackWithMicrotask : scheduleCallbackWithRafRace;
      this.pendingRenderTaskId = this.taskService.add();
      if (this.scheduleInRootZone) {
        this.cancelScheduledCallback = Zone.root.run(() => scheduleCallback(() => this.tick()));
      } else {
        this.cancelScheduledCallback = this.ngZone.runOutsideAngular(() => scheduleCallback(() => this.tick()));
      }
    }
    shouldScheduleTick(force) {
      if (this.disableScheduling && !force || this.appRef.destroyed) {
        return false;
      }
      if (this.pendingRenderTaskId !== null || this.runningTick || this.appRef._runningTick) {
        return false;
      }
      if (!this.zonelessEnabled && this.zoneIsDefined && Zone.current.get(angularZoneInstanceIdProperty + this.angularZoneId)) {
        return false;
      }
      return true;
    }
    /**
     * Calls ApplicationRef._tick inside the `NgZone`.
     *
     * Calling `tick` directly runs change detection and cancels any change detection that had been
     * scheduled previously.
     *
     * @param shouldRefreshViews Passed directly to `ApplicationRef._tick` and skips straight to
     *     render hooks when `false`.
     */
    tick() {
      if (this.runningTick || this.appRef.destroyed) {
        return;
      }
      if (this.appRef.dirtyFlags === 0) {
        this.cleanup();
        return;
      }
      if (!this.zonelessEnabled && this.appRef.dirtyFlags & 7) {
        this.appRef.dirtyFlags |= 1;
      }
      const task = this.taskService.add();
      try {
        this.ngZone.run(() => {
          this.runningTick = true;
          this.appRef._tick();
        }, void 0, this.schedulerTickApplyArgs);
      } catch (e) {
        this.taskService.remove(task);
        this.applicationErrorHandler(e);
      } finally {
        this.cleanup();
      }
      this.useMicrotaskScheduler = true;
      scheduleCallbackWithMicrotask(() => {
        this.useMicrotaskScheduler = false;
        this.taskService.remove(task);
      });
    }
    ngOnDestroy() {
      this.subscriptions.unsubscribe();
      this.cleanup();
    }
    cleanup() {
      this.runningTick = false;
      this.cancelScheduledCallback?.();
      this.cancelScheduledCallback = null;
      if (this.pendingRenderTaskId !== null) {
        const taskId = this.pendingRenderTaskId;
        this.pendingRenderTaskId = null;
        this.taskService.remove(taskId);
      }
    }
    static ɵfac = function ChangeDetectionSchedulerImpl_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || ChangeDetectionSchedulerImpl2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: ChangeDetectionSchedulerImpl2,
      factory: ChangeDetectionSchedulerImpl2.ɵfac,
      providedIn: "root"
    });
  }
  return ChangeDetectionSchedulerImpl2;
})();
function getGlobalLocale() {
  {
    return typeof $localize !== "undefined" && $localize.locale || DEFAULT_LOCALE_ID;
  }
}
const LOCALE_ID = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => inject(LOCALE_ID, {
    optional: true,
    skipSelf: true
  }) || getGlobalLocale()
});

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
const HOST_TAG_NAME = /* @__PURE__ */ new InjectionToken("");
HOST_TAG_NAME.__NG_ELEMENT_ID__ = (flags) => {
  const tNode = getCurrentTNode();
  if (tNode === null) {
    throw new RuntimeError(204, false);
  }
  if (tNode.type & 2) {
    return tNode.value;
  }
  if (flags & 8) {
    return null;
  }
  throw new RuntimeError(204, false);
};
const SCAN_DELAY = 200;
const OVERSIZED_IMAGE_TOLERANCE = 1200;
let ImagePerformanceWarning = /* @__PURE__ */ (() => {
  class ImagePerformanceWarning2 {
    // Map of full image URLs -> original `ngSrc` values.
    window = null;
    observer = null;
    options = inject(IMAGE_CONFIG);
    lcpImageUrl;
    start() {
      if (typeof PerformanceObserver === "undefined" || this.options?.disableImageSizeWarning && this.options?.disableImageLazyLoadWarning) {
        return;
      }
      this.observer = this.initPerformanceObserver();
      const doc = getDocument();
      const win = doc.defaultView;
      if (win) {
        this.window = win;
        const waitToScan = () => {
          setTimeout(this.scanImages.bind(this), SCAN_DELAY);
        };
        const setup = () => {
          if (doc.readyState === "complete") {
            waitToScan();
          } else {
            this.window?.addEventListener("load", waitToScan, {
              once: true
            });
          }
        };
        if (typeof Zone !== "undefined") {
          Zone.root.run(() => setup());
        } else {
          setup();
        }
      }
    }
    ngOnDestroy() {
      this.observer?.disconnect();
    }
    initPerformanceObserver() {
      if (typeof PerformanceObserver === "undefined") {
        return null;
      }
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length === 0) return;
        const lcpElement = entries[entries.length - 1];
        const imgSrc = lcpElement.element?.src ?? "";
        if (imgSrc.startsWith("data:") || imgSrc.startsWith("blob:")) return;
        this.lcpImageUrl = imgSrc;
      });
      observer.observe({
        type: "largest-contentful-paint",
        buffered: true
      });
      return observer;
    }
    scanImages() {
      const images = getDocument().querySelectorAll("img");
      let lcpElementFound, lcpElementLoadedCorrectly = false;
      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        if (!image) {
          continue;
        }
        if (!this.options?.disableImageSizeWarning) {
          if (!image.getAttribute("ng-img") && this.isOversized(image)) {
            logOversizedImageWarning(image.src);
          }
        }
        if (!this.options?.disableImageLazyLoadWarning && this.lcpImageUrl) {
          if (image.src === this.lcpImageUrl) {
            lcpElementFound = true;
            if (image.loading !== "lazy" || image.getAttribute("ng-img")) {
              lcpElementLoadedCorrectly = true;
            }
          }
        }
      }
      if (lcpElementFound && !lcpElementLoadedCorrectly && this.lcpImageUrl && !this.options?.disableImageLazyLoadWarning) {
        logLazyLCPWarning(this.lcpImageUrl);
      }
    }
    isOversized(image) {
      if (!this.window) {
        return false;
      }
      const nonOversizedImageExtentions = [
        // SVG images are vector-based, which means they can scale
        // to any size without losing quality.
        ".svg"
      ];
      const imageSource = (image.src || "").toLowerCase();
      if (nonOversizedImageExtentions.some((extension) => imageSource.endsWith(extension))) {
        return false;
      }
      const computedStyle = this.window.getComputedStyle(image);
      let renderedWidth = parseFloat(computedStyle.getPropertyValue("width"));
      let renderedHeight = parseFloat(computedStyle.getPropertyValue("height"));
      const boxSizing = computedStyle.getPropertyValue("box-sizing");
      const objectFit = computedStyle.getPropertyValue("object-fit");
      if (objectFit === `cover`) {
        return false;
      }
      if (boxSizing === "border-box") {
        const paddingTop = computedStyle.getPropertyValue("padding-top");
        const paddingRight = computedStyle.getPropertyValue("padding-right");
        const paddingBottom = computedStyle.getPropertyValue("padding-bottom");
        const paddingLeft = computedStyle.getPropertyValue("padding-left");
        renderedWidth -= parseFloat(paddingRight) + parseFloat(paddingLeft);
        renderedHeight -= parseFloat(paddingTop) + parseFloat(paddingBottom);
      }
      const intrinsicWidth = image.naturalWidth;
      const intrinsicHeight = image.naturalHeight;
      const recommendedWidth = this.window.devicePixelRatio * renderedWidth;
      const recommendedHeight = this.window.devicePixelRatio * renderedHeight;
      const oversizedWidth = intrinsicWidth - recommendedWidth >= OVERSIZED_IMAGE_TOLERANCE;
      const oversizedHeight = intrinsicHeight - recommendedHeight >= OVERSIZED_IMAGE_TOLERANCE;
      return oversizedWidth || oversizedHeight;
    }
    static ɵfac = function ImagePerformanceWarning_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || ImagePerformanceWarning2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: ImagePerformanceWarning2,
      factory: ImagePerformanceWarning2.ɵfac,
      providedIn: "root"
    });
  }
  return ImagePerformanceWarning2;
})();
function logLazyLCPWarning(src) {
  console.warn(formatRuntimeError(-913, `An image with src ${src} is the Largest Contentful Paint (LCP) element but was given a "loading" value of "lazy", which can negatively impact application loading performance. This warning can be addressed by changing the loading value of the LCP image to "eager", or by using the NgOptimizedImage directive's prioritization utilities. For more information about addressing or disabling this warning, see https://angular.dev/errors/NG0913`));
}
function logOversizedImageWarning(src) {
  console.warn(formatRuntimeError(-913, `An image with src ${src} has intrinsic file dimensions much larger than its rendered size. This can negatively impact application loading performance. For more information about addressing or disabling this warning, see https://angular.dev/errors/NG0913`));
}
const PLATFORM_DESTROY_LISTENERS = /* @__PURE__ */ new InjectionToken("");
const ENABLE_ROOT_COMPONENT_BOOTSTRAP = /* @__PURE__ */ new InjectionToken("");
function isApplicationBootstrapConfig(config) {
  return !config.moduleRef;
}
function bootstrap$1(config) {
  const envInjector = isApplicationBootstrapConfig(config) ? config.r3Injector : config.moduleRef.injector;
  const ngZone = envInjector.get(NgZone);
  return ngZone.run(() => {
    if (isApplicationBootstrapConfig(config)) {
      config.r3Injector.resolveInjectorInitializers();
    } else {
      config.moduleRef.resolveInjectorInitializers();
    }
    const exceptionHandler = envInjector.get(INTERNAL_APPLICATION_ERROR_HANDLER);
    let onErrorSubscription;
    ngZone.runOutsideAngular(() => {
      onErrorSubscription = ngZone.onError.subscribe({
        next: exceptionHandler
      });
    });
    if (isApplicationBootstrapConfig(config)) {
      const destroyListener = () => envInjector.destroy();
      const onPlatformDestroyListeners = config.platformInjector.get(PLATFORM_DESTROY_LISTENERS);
      onPlatformDestroyListeners.add(destroyListener);
      envInjector.onDestroy(() => {
        onErrorSubscription.unsubscribe();
        onPlatformDestroyListeners.delete(destroyListener);
      });
    } else {
      const destroyListener = () => config.moduleRef.destroy();
      const onPlatformDestroyListeners = config.platformInjector.get(PLATFORM_DESTROY_LISTENERS);
      onPlatformDestroyListeners.add(destroyListener);
      config.moduleRef.onDestroy(() => {
        remove(config.allPlatformModules, config.moduleRef);
        onErrorSubscription.unsubscribe();
        onPlatformDestroyListeners.delete(destroyListener);
      });
    }
    return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
      const pendingTasks = envInjector.get(PendingTasksInternal);
      const taskId = pendingTasks.add();
      const initStatus = envInjector.get(ApplicationInitStatus);
      initStatus.runInitializers();
      return initStatus.donePromise.then(() => {
        const localeId = envInjector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
        setLocaleId(localeId || DEFAULT_LOCALE_ID);
        const enableRootComponentbootstrap = envInjector.get(ENABLE_ROOT_COMPONENT_BOOTSTRAP, true);
        if (!enableRootComponentbootstrap) {
          if (isApplicationBootstrapConfig(config)) {
            return envInjector.get(ApplicationRef);
          }
          config.allPlatformModules.push(config.moduleRef);
          return config.moduleRef;
        }
        if (false) ;
        if (isApplicationBootstrapConfig(config)) {
          const appRef = envInjector.get(ApplicationRef);
          if (config.rootComponent !== void 0) {
            appRef.bootstrap(config.rootComponent);
          }
          return appRef;
        } else {
          moduleBootstrapImpl?.(config.moduleRef, config.allPlatformModules);
          return config.moduleRef;
        }
      }).finally(() => void pendingTasks.remove(taskId));
    });
  });
}
let moduleBootstrapImpl;
function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
  try {
    const result = callback();
    if (isPromise(result)) {
      return result.catch((e) => {
        ngZone.runOutsideAngular(() => errorHandler(e));
        throw e;
      });
    }
    return result;
  } catch (e) {
    ngZone.runOutsideAngular(() => errorHandler(e));
    throw e;
  }
}
let _platformInjector = null;
function createPlatformInjector(providers = [], name) {
  return Injector.create({
    name,
    providers: [{
      provide: INJECTOR_SCOPE,
      useValue: "platform"
    }, {
      provide: PLATFORM_DESTROY_LISTENERS,
      useValue: /* @__PURE__ */ new Set([() => _platformInjector = null])
    }, ...providers]
  });
}
function createOrReusePlatformInjector(providers = []) {
  if (_platformInjector) return _platformInjector;
  const injector = createPlatformInjector(providers);
  {
    _platformInjector = injector;
  }
  runPlatformInitializers(injector);
  return injector;
}
function runPlatformInitializers(injector) {
  const inits = injector.get(PLATFORM_INITIALIZER, null);
  runInInjectionContext(injector, () => {
    inits?.forEach((init) => init());
  });
}
function internalCreateApplication(config) {
  const {
    rootComponent,
    appProviders,
    platformProviders,
    platformRef
  } = config;
  profiler(
    8
    /* ProfilerEvent.BootstrapApplicationStart */
  );
  try {
    const platformInjector = platformRef?.injector ?? createOrReusePlatformInjector(platformProviders);
    if (false) ;
    const allAppProviders = [internalProvideZoneChangeDetection({}), {
      provide: ChangeDetectionScheduler,
      useExisting: ChangeDetectionSchedulerImpl
    }, errorHandlerEnvironmentInitializer, ...appProviders || []];
    const adapter = new EnvironmentNgModuleRefAdapter({
      providers: allAppProviders,
      parent: platformInjector,
      debugName: false ? "Environment Injector" : "",
      // We skip environment initializers because we need to run them inside the NgZone, which
      // happens after we get the NgZone instance from the Injector.
      runEnvironmentInitializers: false
    });
    return bootstrap$1({
      r3Injector: adapter.injector,
      platformInjector,
      rootComponent
    });
  } catch (e) {
    return Promise.reject(e);
  } finally {
    profiler(
      9
      /* ProfilerEvent.BootstrapApplicationEnd */
    );
  }
}
function createComponent(component, options) {
  const componentDef = getComponentDef(component);
  const elementInjector = options.elementInjector || getNullInjector();
  const factory = new ComponentFactory2(componentDef);
  return factory.create(elementInjector, options.projectableNodes, options.hostElement, options.environmentInjector, options.directives, options.bindings);
}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
let _DOM = null;
function getDOM() {
  return _DOM;
}
function setRootDomAdapter(adapter) {
  _DOM ??= adapter;
}
class DomAdapter {
}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */

function parseCookieValue(cookieStr, name) {
  name = encodeURIComponent(name);
  for (const cookie of cookieStr.split(';')) {
    const eqIndex = cookie.indexOf('=');
    const [cookieName, cookieValue] = eqIndex == -1 ? [cookie, ''] : [cookie.slice(0, eqIndex), cookie.slice(eqIndex + 1)];
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * A wrapper around the `XMLHttpRequest` constructor.
 *
 * @publicApi
 */
class XhrFactory {}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
const PLATFORM_BROWSER_ID = "browser";

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
class EventManagerPlugin {
  _doc;
  // TODO: remove (has some usage in G3)
  constructor(_doc) {
    this._doc = _doc;
  }
  // Using non-null assertion because it's set by EventManager's constructor
  manager;
}
let DomEventsPlugin = /* @__PURE__ */ (() => {
  class DomEventsPlugin2 extends EventManagerPlugin {
    constructor(doc) {
      super(doc);
    }
    // This plugin should come last in the list of plugins, because it accepts all
    // events.
    supports(eventName) {
      return true;
    }
    addEventListener(element, eventName, handler, options) {
      element.addEventListener(eventName, handler, options);
      return () => this.removeEventListener(element, eventName, handler, options);
    }
    removeEventListener(target, eventName, callback, options) {
      return target.removeEventListener(eventName, callback, options);
    }
    static ɵfac = function DomEventsPlugin_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || DomEventsPlugin2)(ɵɵinject(DOCUMENT$1));
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: DomEventsPlugin2,
      factory: DomEventsPlugin2.ɵfac
    });
  }
  return DomEventsPlugin2;
})();
const EVENT_MANAGER_PLUGINS = /* @__PURE__ */ new InjectionToken("");
let EventManager = /* @__PURE__ */ (() => {
  class EventManager2 {
    _zone;
    _plugins;
    _eventNameToPlugin = /* @__PURE__ */ new Map();
    /**
     * Initializes an instance of the event-manager service.
     */
    constructor(plugins, _zone) {
      this._zone = _zone;
      plugins.forEach((plugin) => {
        plugin.manager = this;
      });
      const otherPlugins = plugins.filter((p) => !(p instanceof DomEventsPlugin));
      this._plugins = otherPlugins.slice().reverse();
      const domEventPlugin = plugins.find((p) => p instanceof DomEventsPlugin);
      if (domEventPlugin) {
        this._plugins.push(domEventPlugin);
      }
    }
    /**
     * Registers a handler for a specific element and event.
     *
     * @param element The HTML element to receive event notifications.
     * @param eventName The name of the event to listen for.
     * @param handler A function to call when the notification occurs. Receives the
     * event object as an argument.
     * @param options Options that configure how the event listener is bound.
     * @returns  A callback function that can be used to remove the handler.
     */
    addEventListener(element, eventName, handler, options) {
      const plugin = this._findPluginFor(eventName);
      return plugin.addEventListener(element, eventName, handler, options);
    }
    /**
     * Retrieves the compilation zone in which event listeners are registered.
     */
    getZone() {
      return this._zone;
    }
    /** @internal */
    _findPluginFor(eventName) {
      let plugin = this._eventNameToPlugin.get(eventName);
      if (plugin) {
        return plugin;
      }
      const plugins = this._plugins;
      plugin = plugins.find((plugin2) => plugin2.supports(eventName));
      if (!plugin) {
        throw new RuntimeError(5101, false);
      }
      this._eventNameToPlugin.set(eventName, plugin);
      return plugin;
    }
    static ɵfac = function EventManager_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || EventManager2)(ɵɵinject(EVENT_MANAGER_PLUGINS), ɵɵinject(NgZone));
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: EventManager2,
      factory: EventManager2.ɵfac
    });
  }
  return EventManager2;
})();
const APP_ID_ATTRIBUTE_NAME = "ng-app-id";
function removeElements(elements) {
  for (const element of elements) {
    element.remove();
  }
}
function createStyleElement(style, doc) {
  const styleElement = doc.createElement("style");
  styleElement.textContent = style;
  return styleElement;
}
function addServerStyles(doc, appId, inline, external) {
  const elements = doc.head?.querySelectorAll(`style[${APP_ID_ATTRIBUTE_NAME}="${appId}"],link[${APP_ID_ATTRIBUTE_NAME}="${appId}"]`);
  if (elements) {
    for (const styleElement of elements) {
      styleElement.removeAttribute(APP_ID_ATTRIBUTE_NAME);
      if (styleElement instanceof HTMLLinkElement) {
        external.set(styleElement.href.slice(styleElement.href.lastIndexOf("/") + 1), {
          usage: 0,
          elements: [styleElement]
        });
      } else if (styleElement.textContent) {
        inline.set(styleElement.textContent, {
          usage: 0,
          elements: [styleElement]
        });
      }
    }
  }
}
function createLinkElement(url, doc) {
  const linkElement = doc.createElement("link");
  linkElement.setAttribute("rel", "stylesheet");
  linkElement.setAttribute("href", url);
  return linkElement;
}
let SharedStylesHost = /* @__PURE__ */ (() => {
  class SharedStylesHost2 {
    doc;
    appId;
    nonce;
    /**
     * Provides usage information for active inline style content and associated HTML <style> elements.
     * Embedded styles typically originate from the `styles` metadata of a rendered component.
     */
    inline = /* @__PURE__ */ new Map();
    /**
     * Provides usage information for active external style URLs and the associated HTML <link> elements.
     * External styles typically originate from the `ɵɵExternalStylesFeature` of a rendered component.
     */
    external = /* @__PURE__ */ new Map();
    /**
     * Set of host DOM nodes that will have styles attached.
     */
    hosts = /* @__PURE__ */ new Set();
    constructor(doc, appId, nonce, platformId = {}) {
      this.doc = doc;
      this.appId = appId;
      this.nonce = nonce;
      addServerStyles(doc, appId, this.inline, this.external);
      this.hosts.add(doc.head);
    }
    /**
     * Adds embedded styles to the DOM via HTML `style` elements.
     * @param styles An array of style content strings.
     */
    addStyles(styles, urls) {
      for (const value of styles) {
        this.addUsage(value, this.inline, createStyleElement);
      }
      urls?.forEach((value) => this.addUsage(value, this.external, createLinkElement));
    }
    /**
     * Removes embedded styles from the DOM that were added as HTML `style` elements.
     * @param styles An array of style content strings.
     */
    removeStyles(styles, urls) {
      for (const value of styles) {
        this.removeUsage(value, this.inline);
      }
      urls?.forEach((value) => this.removeUsage(value, this.external));
    }
    addUsage(value, usages, creator) {
      const record = usages.get(value);
      if (record) {
        record.usage++;
      } else {
        usages.set(value, {
          usage: 1,
          elements: [...this.hosts].map((host) => this.addElement(host, creator(value, this.doc)))
        });
      }
    }
    removeUsage(value, usages) {
      const record = usages.get(value);
      if (record) {
        record.usage--;
        if (record.usage <= 0) {
          removeElements(record.elements);
          usages.delete(value);
        }
      }
    }
    ngOnDestroy() {
      for (const [, {
        elements
      }] of [...this.inline, ...this.external]) {
        removeElements(elements);
      }
      this.hosts.clear();
    }
    /**
     * Adds a host node to the set of style hosts and adds all existing style usage to
     * the newly added host node.
     *
     * This is currently only used for Shadow DOM encapsulation mode.
     */
    addHost(hostNode) {
      this.hosts.add(hostNode);
      for (const [style, {
        elements
      }] of this.inline) {
        elements.push(this.addElement(hostNode, createStyleElement(style, this.doc)));
      }
      for (const [url, {
        elements
      }] of this.external) {
        elements.push(this.addElement(hostNode, createLinkElement(url, this.doc)));
      }
    }
    removeHost(hostNode) {
      this.hosts.delete(hostNode);
    }
    addElement(host, element) {
      if (this.nonce) {
        element.setAttribute("nonce", this.nonce);
      }
      return host.appendChild(element);
    }
    static ɵfac = function SharedStylesHost_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || SharedStylesHost2)(ɵɵinject(DOCUMENT$1), ɵɵinject(APP_ID), ɵɵinject(CSP_NONCE, 8), ɵɵinject(PLATFORM_ID));
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: SharedStylesHost2,
      factory: SharedStylesHost2.ɵfac
    });
  }
  return SharedStylesHost2;
})();
const NAMESPACE_URIS = {
  "svg": "http://www.w3.org/2000/svg",
  "xhtml": "http://www.w3.org/1999/xhtml",
  "xlink": "http://www.w3.org/1999/xlink",
  "xml": "http://www.w3.org/XML/1998/namespace",
  "xmlns": "http://www.w3.org/2000/xmlns/",
  "math": "http://www.w3.org/1998/Math/MathML"
};
const COMPONENT_REGEX = /%COMP%/g;
const COMPONENT_VARIABLE = "%COMP%";
const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
const REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT = true;
const REMOVE_STYLES_ON_COMPONENT_DESTROY = /* @__PURE__ */ new InjectionToken("", {
  providedIn: "root",
  factory: () => REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT
});
function shimContentAttribute(componentShortId) {
  return CONTENT_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimHostAttribute(componentShortId) {
  return HOST_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimStylesContent(compId, styles) {
  return styles.map((s) => s.replace(COMPONENT_REGEX, compId));
}
let DomRendererFactory2 = /* @__PURE__ */ (() => {
  class DomRendererFactory22 {
    eventManager;
    sharedStylesHost;
    appId;
    removeStylesOnCompDestroy;
    doc;
    ngZone;
    nonce;
    tracingService;
    rendererByCompId = /* @__PURE__ */ new Map();
    defaultRenderer;
    platformIsServer;
    constructor(eventManager, sharedStylesHost, appId, removeStylesOnCompDestroy, doc, ngZone, nonce = null, tracingService = null) {
      this.eventManager = eventManager;
      this.sharedStylesHost = sharedStylesHost;
      this.appId = appId;
      this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
      this.doc = doc;
      this.ngZone = ngZone;
      this.nonce = nonce;
      this.tracingService = tracingService;
      this.platformIsServer = false;
      this.defaultRenderer = new DefaultDomRenderer2(eventManager, doc, ngZone, this.platformIsServer, this.tracingService);
    }
    createRenderer(element, type) {
      if (!element || !type) {
        return this.defaultRenderer;
      }
      const renderer = this.getOrCreateRenderer(element, type);
      if (renderer instanceof EmulatedEncapsulationDomRenderer2) {
        renderer.applyToHost(element);
      } else if (renderer instanceof NoneEncapsulationDomRenderer) {
        renderer.applyStyles();
      }
      return renderer;
    }
    getOrCreateRenderer(element, type) {
      const rendererByCompId = this.rendererByCompId;
      let renderer = rendererByCompId.get(type.id);
      if (!renderer) {
        const doc = this.doc;
        const ngZone = this.ngZone;
        const eventManager = this.eventManager;
        const sharedStylesHost = this.sharedStylesHost;
        const removeStylesOnCompDestroy = this.removeStylesOnCompDestroy;
        const platformIsServer = this.platformIsServer;
        const tracingService = this.tracingService;
        switch (type.encapsulation) {
          case ViewEncapsulation.Emulated:
            renderer = new EmulatedEncapsulationDomRenderer2(eventManager, sharedStylesHost, type, this.appId, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService);
            break;
          case ViewEncapsulation.ShadowDom:
            return new ShadowDomRenderer(eventManager, sharedStylesHost, element, type, doc, ngZone, this.nonce, platformIsServer, tracingService);
          default:
            renderer = new NoneEncapsulationDomRenderer(eventManager, sharedStylesHost, type, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService);
            break;
        }
        rendererByCompId.set(type.id, renderer);
      }
      return renderer;
    }
    ngOnDestroy() {
      this.rendererByCompId.clear();
    }
    /**
     * Used during HMR to clear any cached data about a component.
     * @param componentId ID of the component that is being replaced.
     */
    componentReplaced(componentId) {
      this.rendererByCompId.delete(componentId);
    }
    static ɵfac = function DomRendererFactory2_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || DomRendererFactory22)(ɵɵinject(EventManager), ɵɵinject(SharedStylesHost), ɵɵinject(APP_ID), ɵɵinject(REMOVE_STYLES_ON_COMPONENT_DESTROY), ɵɵinject(DOCUMENT$1), ɵɵinject(NgZone), ɵɵinject(CSP_NONCE), ɵɵinject(TracingService, 8));
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: DomRendererFactory22,
      factory: DomRendererFactory22.ɵfac
    });
  }
  return DomRendererFactory22;
})();
class DefaultDomRenderer2 {
  eventManager;
  doc;
  ngZone;
  platformIsServer;
  tracingService;
  data = /* @__PURE__ */ Object.create(null);
  /**
   * By default this renderer throws when encountering synthetic properties
   * This can be disabled for example by the AsyncAnimationRendererFactory
   */
  throwOnSyntheticProps = true;
  constructor(eventManager, doc, ngZone, platformIsServer, tracingService) {
    this.eventManager = eventManager;
    this.doc = doc;
    this.ngZone = ngZone;
    this.platformIsServer = platformIsServer;
    this.tracingService = tracingService;
  }
  destroy() {
  }
  destroyNode = null;
  createElement(name, namespace) {
    if (namespace) {
      return this.doc.createElementNS(NAMESPACE_URIS[namespace] || namespace, name);
    }
    return this.doc.createElement(name);
  }
  createComment(value) {
    return this.doc.createComment(value);
  }
  createText(value) {
    return this.doc.createTextNode(value);
  }
  appendChild(parent, newChild) {
    const targetParent = isTemplateNode(parent) ? parent.content : parent;
    targetParent.appendChild(newChild);
  }
  insertBefore(parent, newChild, refChild) {
    if (parent) {
      const targetParent = isTemplateNode(parent) ? parent.content : parent;
      targetParent.insertBefore(newChild, refChild);
    }
  }
  removeChild(_parent, oldChild) {
    oldChild.remove();
  }
  selectRootElement(selectorOrNode, preserveContent) {
    let el = typeof selectorOrNode === "string" ? this.doc.querySelector(selectorOrNode) : selectorOrNode;
    if (!el) {
      throw new RuntimeError(-5104, false);
    }
    if (!preserveContent) {
      el.textContent = "";
    }
    return el;
  }
  parentNode(node) {
    return node.parentNode;
  }
  nextSibling(node) {
    return node.nextSibling;
  }
  setAttribute(el, name, value, namespace) {
    if (namespace) {
      name = namespace + ":" + name;
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.setAttributeNS(namespaceUri, name, value);
      } else {
        el.setAttribute(name, value);
      }
    } else {
      el.setAttribute(name, value);
    }
  }
  removeAttribute(el, name, namespace) {
    if (namespace) {
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.removeAttributeNS(namespaceUri, name);
      } else {
        el.removeAttribute(`${namespace}:${name}`);
      }
    } else {
      el.removeAttribute(name);
    }
  }
  addClass(el, name) {
    el.classList.add(name);
  }
  removeClass(el, name) {
    el.classList.remove(name);
  }
  setStyle(el, style, value, flags) {
    if (flags & (RendererStyleFlags2.DashCase | RendererStyleFlags2.Important)) {
      el.style.setProperty(style, value, flags & RendererStyleFlags2.Important ? "important" : "");
    } else {
      el.style[style] = value;
    }
  }
  removeStyle(el, style, flags) {
    if (flags & RendererStyleFlags2.DashCase) {
      el.style.removeProperty(style);
    } else {
      el.style[style] = "";
    }
  }
  setProperty(el, name, value) {
    if (el == null) {
      return;
    }
    el[name] = value;
  }
  setValue(node, value) {
    node.nodeValue = value;
  }
  listen(target, event, callback, options) {
    if (typeof target === "string") {
      target = getDOM().getGlobalEventTarget(this.doc, target);
      if (!target) {
        throw new RuntimeError(5102, false);
      }
    }
    let wrappedCallback = this.decoratePreventDefault(callback);
    if (this.tracingService?.wrapEventListener) {
      wrappedCallback = this.tracingService.wrapEventListener(target, event, wrappedCallback);
    }
    return this.eventManager.addEventListener(target, event, wrappedCallback, options);
  }
  decoratePreventDefault(eventHandler) {
    return (event) => {
      if (event === "__ngUnwrap__") {
        return eventHandler;
      }
      const allowDefaultBehavior = eventHandler(event);
      if (allowDefaultBehavior === false) {
        event.preventDefault();
      }
      return void 0;
    };
  }
}
function isTemplateNode(node) {
  return node.tagName === "TEMPLATE" && node.content !== void 0;
}
class ShadowDomRenderer extends DefaultDomRenderer2 {
  sharedStylesHost;
  hostEl;
  shadowRoot;
  constructor(eventManager, sharedStylesHost, hostEl, component, doc, ngZone, nonce, platformIsServer, tracingService) {
    super(eventManager, doc, ngZone, platformIsServer, tracingService);
    this.sharedStylesHost = sharedStylesHost;
    this.hostEl = hostEl;
    this.shadowRoot = hostEl.attachShadow({
      mode: "open"
    });
    this.sharedStylesHost.addHost(this.shadowRoot);
    let styles = component.styles;
    styles = shimStylesContent(component.id, styles);
    for (const style of styles) {
      const styleEl = document.createElement("style");
      if (nonce) {
        styleEl.setAttribute("nonce", nonce);
      }
      styleEl.textContent = style;
      this.shadowRoot.appendChild(styleEl);
    }
    const styleUrls = component.getExternalStyles?.();
    if (styleUrls) {
      for (const styleUrl of styleUrls) {
        const linkEl = createLinkElement(styleUrl, doc);
        if (nonce) {
          linkEl.setAttribute("nonce", nonce);
        }
        this.shadowRoot.appendChild(linkEl);
      }
    }
  }
  nodeOrShadowRoot(node) {
    return node === this.hostEl ? this.shadowRoot : node;
  }
  appendChild(parent, newChild) {
    return super.appendChild(this.nodeOrShadowRoot(parent), newChild);
  }
  insertBefore(parent, newChild, refChild) {
    return super.insertBefore(this.nodeOrShadowRoot(parent), newChild, refChild);
  }
  removeChild(_parent, oldChild) {
    return super.removeChild(null, oldChild);
  }
  parentNode(node) {
    return this.nodeOrShadowRoot(super.parentNode(this.nodeOrShadowRoot(node)));
  }
  destroy() {
    this.sharedStylesHost.removeHost(this.shadowRoot);
  }
}
class NoneEncapsulationDomRenderer extends DefaultDomRenderer2 {
  sharedStylesHost;
  removeStylesOnCompDestroy;
  styles;
  styleUrls;
  constructor(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, compId) {
    super(eventManager, doc, ngZone, platformIsServer, tracingService);
    this.sharedStylesHost = sharedStylesHost;
    this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
    let styles = component.styles;
    this.styles = compId ? shimStylesContent(compId, styles) : styles;
    this.styleUrls = component.getExternalStyles?.(compId);
  }
  applyStyles() {
    this.sharedStylesHost.addStyles(this.styles, this.styleUrls);
  }
  destroy() {
    if (!this.removeStylesOnCompDestroy) {
      return;
    }
    if (allLeavingAnimations.size === 0) {
      this.sharedStylesHost.removeStyles(this.styles, this.styleUrls);
    }
  }
}
class EmulatedEncapsulationDomRenderer2 extends NoneEncapsulationDomRenderer {
  contentAttr;
  hostAttr;
  constructor(eventManager, sharedStylesHost, component, appId, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService) {
    const compId = appId + "-" + component.id;
    super(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, compId);
    this.contentAttr = shimContentAttribute(compId);
    this.hostAttr = shimHostAttribute(compId);
  }
  applyToHost(element) {
    this.applyStyles();
    this.setAttribute(element, this.hostAttr, "");
  }
  createElement(parent, name) {
    const el = super.createElement(parent, name);
    super.setAttribute(el, this.contentAttr, "");
    return el;
  }
}

/**
 * @license Angular v20.3.35
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */
class BrowserDomAdapter extends DomAdapter {
  supportsDOMEvents = true;
  static makeCurrent() {
    setRootDomAdapter(new BrowserDomAdapter());
  }
  onAndCancel(el, evt, listener, options) {
    el.addEventListener(evt, listener, options);
    return () => {
      el.removeEventListener(evt, listener, options);
    };
  }
  dispatchEvent(el, evt) {
    el.dispatchEvent(evt);
  }
  remove(node) {
    node.remove();
  }
  createElement(tagName, doc) {
    doc = doc || this.getDefaultDocument();
    return doc.createElement(tagName);
  }
  createHtmlDocument() {
    return document.implementation.createHTMLDocument("fakeTitle");
  }
  getDefaultDocument() {
    return document;
  }
  isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  isShadowRoot(node) {
    return node instanceof DocumentFragment;
  }
  /** @deprecated No longer being used in Ivy code. To be removed in version 14. */
  getGlobalEventTarget(doc, target) {
    if (target === "window") {
      return window;
    }
    if (target === "document") {
      return doc;
    }
    if (target === "body") {
      return doc.body;
    }
    return null;
  }
  getBaseHref(doc) {
    const href = getBaseElementHref();
    return href == null ? null : relativePath(href);
  }
  resetBaseElement() {
    baseElement = null;
  }
  getUserAgent() {
    return window.navigator.userAgent;
  }
  getCookie(name) {
    return parseCookieValue(document.cookie, name);
  }
}
let baseElement = null;
function getBaseElementHref() {
  baseElement = baseElement || document.head.querySelector("base");
  return baseElement ? baseElement.getAttribute("href") : null;
}
function relativePath(url) {
  return new URL(url, document.baseURI).pathname;
}
let BrowserXhr = /* @__PURE__ */ (() => {
  class BrowserXhr2 {
    build() {
      return new XMLHttpRequest();
    }
    static ɵfac = function BrowserXhr_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || BrowserXhr2)();
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: BrowserXhr2,
      factory: BrowserXhr2.ɵfac
    });
  }
  return BrowserXhr2;
})();
const MODIFIER_KEYS = ["alt", "control", "meta", "shift"];
const _keyMap = {
  "\b": "Backspace",
  "	": "Tab",
  "": "Delete",
  "\x1B": "Escape",
  "Del": "Delete",
  "Esc": "Escape",
  "Left": "ArrowLeft",
  "Right": "ArrowRight",
  "Up": "ArrowUp",
  "Down": "ArrowDown",
  "Menu": "ContextMenu",
  "Scroll": "ScrollLock",
  "Win": "OS"
};
const MODIFIER_KEY_GETTERS = {
  "alt": (event) => event.altKey,
  "control": (event) => event.ctrlKey,
  "meta": (event) => event.metaKey,
  "shift": (event) => event.shiftKey
};
let KeyEventsPlugin = /* @__PURE__ */ (() => {
  class KeyEventsPlugin2 extends EventManagerPlugin {
    /**
     * Initializes an instance of the browser plug-in.
     * @param doc The document in which key events will be detected.
     */
    constructor(doc) {
      super(doc);
    }
    /**
     * Reports whether a named key event is supported.
     * @param eventName The event name to query.
     * @return True if the named key event is supported.
     */
    supports(eventName) {
      return KeyEventsPlugin2.parseEventName(eventName) != null;
    }
    /**
     * Registers a handler for a specific element and key event.
     * @param element The HTML element to receive event notifications.
     * @param eventName The name of the key event to listen for.
     * @param handler A function to call when the notification occurs. Receives the
     * event object as an argument.
     * @returns The key event that was registered.
     */
    addEventListener(element, eventName, handler, options) {
      const parsedEvent = KeyEventsPlugin2.parseEventName(eventName);
      const outsideHandler = KeyEventsPlugin2.eventCallback(parsedEvent["fullKey"], handler, this.manager.getZone());
      return this.manager.getZone().runOutsideAngular(() => {
        return getDOM().onAndCancel(element, parsedEvent["domEventName"], outsideHandler, options);
      });
    }
    /**
     * Parses the user provided full keyboard event definition and normalizes it for
     * later internal use. It ensures the string is all lowercase, converts special
     * characters to a standard spelling, and orders all the values consistently.
     *
     * @param eventName The name of the key event to listen for.
     * @returns an object with the full, normalized string, and the dom event name
     * or null in the case when the event doesn't match a keyboard event.
     */
    static parseEventName(eventName) {
      const parts = eventName.toLowerCase().split(".");
      const domEventName = parts.shift();
      if (parts.length === 0 || !(domEventName === "keydown" || domEventName === "keyup")) {
        return null;
      }
      const key = KeyEventsPlugin2._normalizeKey(parts.pop());
      let fullKey = "";
      let codeIX = parts.indexOf("code");
      if (codeIX > -1) {
        parts.splice(codeIX, 1);
        fullKey = "code.";
      }
      MODIFIER_KEYS.forEach((modifierName) => {
        const index = parts.indexOf(modifierName);
        if (index > -1) {
          parts.splice(index, 1);
          fullKey += modifierName + ".";
        }
      });
      fullKey += key;
      if (parts.length != 0 || key.length === 0) {
        return null;
      }
      const result = {};
      result["domEventName"] = domEventName;
      result["fullKey"] = fullKey;
      return result;
    }
    /**
     * Determines whether the actual keys pressed match the configured key code string.
     * The `fullKeyCode` event is normalized in the `parseEventName` method when the
     * event is attached to the DOM during the `addEventListener` call. This is unseen
     * by the end user and is normalized for internal consistency and parsing.
     *
     * @param event The keyboard event.
     * @param fullKeyCode The normalized user defined expected key event string
     * @returns boolean.
     */
    static matchEventFullKeyCode(event, fullKeyCode) {
      let keycode = _keyMap[event.key] || event.key;
      let key = "";
      if (fullKeyCode.indexOf("code.") > -1) {
        keycode = event.code;
        key = "code.";
      }
      if (keycode == null || !keycode) return false;
      keycode = keycode.toLowerCase();
      if (keycode === " ") {
        keycode = "space";
      } else if (keycode === ".") {
        keycode = "dot";
      }
      MODIFIER_KEYS.forEach((modifierName) => {
        if (modifierName !== keycode) {
          const modifierGetter = MODIFIER_KEY_GETTERS[modifierName];
          if (modifierGetter(event)) {
            key += modifierName + ".";
          }
        }
      });
      key += keycode;
      return key === fullKeyCode;
    }
    /**
     * Configures a handler callback for a key event.
     * @param fullKey The event name that combines all simultaneous keystrokes.
     * @param handler The function that responds to the key event.
     * @param zone The zone in which the event occurred.
     * @returns A callback function.
     */
    static eventCallback(fullKey, handler, zone) {
      return (event) => {
        if (KeyEventsPlugin2.matchEventFullKeyCode(event, fullKey)) {
          zone.runGuarded(() => handler(event));
        }
      };
    }
    /** @internal */
    static _normalizeKey(keyName) {
      return keyName === "esc" ? "escape" : keyName;
    }
    static ɵfac = function KeyEventsPlugin_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || KeyEventsPlugin2)(ɵɵinject(DOCUMENT$1));
    };
    static ɵprov = /* @__PURE__ */ ɵɵdefineInjectable({
      token: KeyEventsPlugin2,
      factory: KeyEventsPlugin2.ɵfac
    });
  }
  return KeyEventsPlugin2;
})();
function createApplication(options) {
  return internalCreateApplication(createProvidersConfig());
}
function createProvidersConfig(options) {
  return {
    appProviders: [...BROWSER_MODULE_PROVIDERS, ...[]],
    platformProviders: INTERNAL_BROWSER_PLATFORM_PROVIDERS
  };
}
function initDomAdapter() {
  BrowserDomAdapter.makeCurrent();
}
function errorHandler() {
  return new ErrorHandler();
}
function _document() {
  setDocument(document);
  return document;
}
const INTERNAL_BROWSER_PLATFORM_PROVIDERS = [{
  provide: PLATFORM_ID,
  useValue: PLATFORM_BROWSER_ID
}, {
  provide: PLATFORM_INITIALIZER,
  useValue: initDomAdapter,
  multi: true
}, {
  provide: DOCUMENT$1,
  useFactory: _document
}];
const BROWSER_MODULE_PROVIDERS = [{
  provide: INJECTOR_SCOPE,
  useValue: "root"
}, {
  provide: ErrorHandler,
  useFactory: errorHandler
}, {
  provide: EVENT_MANAGER_PLUGINS,
  useClass: DomEventsPlugin,
  multi: true,
  deps: [DOCUMENT$1]
}, {
  provide: EVENT_MANAGER_PLUGINS,
  useClass: KeyEventsPlugin,
  multi: true,
  deps: [DOCUMENT$1]
}, DomRendererFactory2, SharedStylesHost, EventManager, {
  provide: RendererFactory2,
  useExisting: DomRendererFactory2
}, {
  provide: XhrFactory,
  useClass: BrowserXhr
}, []];

const EVENTS = {
    frameworkActive: "mfe:framework-active",
    state: "mfe:state",
    error: "mfe:error",
    theme: "shell:theme-changed",
    session: "shell:session-changed",
};
function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}
function subscribe(name, listener) {
    const handler = (event) => listener(event.detail);
    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
}
const emitFrameworkActive = (detail) => emit(EVENTS.frameworkActive, detail);
const emitMfeState = (detail) => emit(EVENTS.state, detail);
const emitMfeError = (detail) => emit(EVENTS.error, detail);

class HomeComponent {
  constructor() {
    this.sessionNote = sessionStorage.getItem("mfe-demo-session") ?? "Northstar workspace";
    this.theme = document.documentElement.dataset.theme ?? "light";
    this.uptime = 0;
  }
  ngOnInit() {
    this.disposeSession = subscribe(EVENTS.session, ({ value }) => this.sessionNote = value);
    this.disposeTheme = subscribe(EVENTS.theme, ({ theme }) => this.theme = theme);
    this.intervalId = window.setInterval(() => this.uptime += 1, 1e3);
  }
  ngOnDestroy() {
    this.disposeSession?.();
    this.disposeTheme?.();
    if (this.intervalId !== void 0)
      window.clearInterval(this.intervalId);
  }
  static {
    this.ɵfac = function HomeComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || HomeComponent)();
    };
  }
  static {
    this.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({ type: HomeComponent, selectors: [["mfe-home-angular"]], decls: 38, vars: 3, consts: [["aria-labelledby", "home-title", 1, "mfe-content"], [1, "content-kicker"], [1, "framework-tag"], [1, "content-grid"], [1, "content-label"], ["id", "home-title"], [1, "content-copy"], ["aria-label", "Angular frontend diagnostics", 1, "runtime-note"], [1, "note-index"], [1, "shared-note"], [1, "note-rule"], [1, "runtime-counter"], [1, "theme-value"], [1, "home-bottomline"]], template: function HomeComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵdomElementStart(0, "main", 0)(1, "div", 1)(2, "span");
        ɵɵtext(3, "01 / HOME");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(4, "span", 2);
        ɵɵtext(5, "ANGULAR 20");
        ɵɵdomElementEnd()();
        ɵɵdomElementStart(6, "div", 3)(7, "section")(8, "p", 4);
        ɵɵtext(9, "INDEPENDENT APPLICATION / STANDALONE DEPLOYMENT");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(10, "h1", 5);
        ɵɵtext(11, "A front door,");
        ɵɵdomElement(12, "br");
        ɵɵdomElementStart(13, "em");
        ɵɵtext(14, "not a monolith.");
        ɵɵdomElementEnd()();
        ɵɵdomElementStart(15, "p", 6);
        ɵɵtext(16, " This view is an Angular application mounted into a shell-owned element. Its compiled runtime arrives from a separate URL and leaves cleanly when the route changes. ");
        ɵɵdomElementEnd()();
        ɵɵdomElementStart(17, "aside", 7)(18, "span", 8);
        ɵɵtext(19, "LIVE / A");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(20, "strong");
        ɵɵtext(21, "Shared workspace");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(22, "p", 9);
        ɵɵtext(23);
        ɵɵdomElementEnd();
        ɵɵdomElement(24, "span", 10);
        ɵɵdomElementStart(25, "span", 11);
        ɵɵtext(26, "MOUNT UPTIME ");
        ɵɵdomElementStart(27, "b");
        ɵɵtext(28);
        ɵɵdomElementEnd()();
        ɵɵdomElementStart(29, "span", 12);
        ɵɵtext(30);
        ɵɵdomElementEnd()()();
        ɵɵdomElementStart(31, "div", 13)(32, "span");
        ɵɵtext(33, "ANGULAR COMPONENT");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(34, "span");
        ɵɵtext(35, "BOOTSTRAP → MOUNT → UNMOUNT");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(36, "span");
        ɵɵtext(37, "ROUTE /");
        ɵɵdomElementEnd()()();
      }
      if (rf & 2) {
        ɵɵadvance(23);
        ɵɵtextInterpolate(ctx.sessionNote);
        ɵɵadvance(5);
        ɵɵtextInterpolate1("", ctx.uptime, "s");
        ɵɵadvance(2);
        ɵɵtextInterpolate1("SHELL THEME / ", ctx.theme);
      }
    }, styles: ['[_nghost-%COMP%] {\n                display: block;\n            }\n            .mfe-content[_ngcontent-%COMP%] {\n                min-height: 270px;\n                padding: 24px 26px 19px;\n                color: var(--ink);\n            }\n            .content-kicker[_ngcontent-%COMP%], \n   .home-bottomline[_ngcontent-%COMP%] {\n                display: flex;\n                justify-content: space-between;\n                gap: 12px;\n                color: var(--muted);\n                font-size: 9px;\n                font-weight: 800;\n                letter-spacing: 1px;\n            }\n            .framework-tag[_ngcontent-%COMP%] {\n                color: var(--brand);\n            }\n            .content-grid[_ngcontent-%COMP%] {\n                display: grid;\n                grid-template-columns: minmax(0, 1fr) 205px;\n                align-items: center;\n                gap: 34px;\n                padding: 27px 0 25px;\n            }\n            .content-label[_ngcontent-%COMP%] {\n                margin: 0;\n                color: var(--muted);\n                font-size: 9px;\n                font-weight: 800;\n                letter-spacing: 1.1px;\n            }\n            h1[_ngcontent-%COMP%] {\n                margin: 11px 0 12px;\n                font-family: Georgia, "Times New Roman", serif;\n                font-size: clamp(28px, 4vw, 42px);\n                font-weight: 400;\n                line-height: 1;\n            }\n            h1[_ngcontent-%COMP%]   em[_ngcontent-%COMP%] {\n                color: var(--brand);\n                font-weight: 400;\n            }\n            .content-copy[_ngcontent-%COMP%] {\n                max-width: 480px;\n                margin: 0;\n                color: var(--muted);\n                font-size: 12px;\n                line-height: 1.7;\n            }\n            .runtime-note[_ngcontent-%COMP%] {\n                min-height: 132px;\n                padding: 14px;\n                border-left: 2px solid var(--accent);\n                background: var(--surface-quiet);\n            }\n            .note-index[_ngcontent-%COMP%], \n   .runtime-counter[_ngcontent-%COMP%] {\n                display: block;\n                color: var(--muted);\n                font-size: 8px;\n                font-weight: 800;\n                letter-spacing: 1px;\n            }\n            .runtime-note[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n                display: block;\n                margin-top: 12px;\n                font-family: Georgia, "Times New Roman", serif;\n                font-size: 17px;\n                font-weight: 400;\n            }\n            .shared-note[_ngcontent-%COMP%] {\n                overflow-wrap: anywhere;\n                min-height: 16px;\n                margin: 4px 0 11px;\n                color: var(--brand);\n                font-size: 11px;\n            }\n            .note-rule[_ngcontent-%COMP%] {\n                display: block;\n                height: 1px;\n                margin-bottom: 9px;\n                background: var(--line);\n            }\n            .runtime-counter[_ngcontent-%COMP%]   b[_ngcontent-%COMP%] {\n                float: right;\n                color: var(--ink);\n                font-variant-numeric: tabular-nums;\n            }\n            .theme-value[_ngcontent-%COMP%] {\n                display: block;\n                margin-top: 8px;\n                color: var(--muted);\n                font-size: 8px;\n                font-weight: 800;\n                letter-spacing: 1px;\n            }\n            .home-bottomline[_ngcontent-%COMP%] {\n                padding-top: 12px;\n                border-top: 1px solid var(--line);\n                font-size: 8px;\n            }\n            @media (max-width: 600px) {\n                .mfe-content[_ngcontent-%COMP%] {\n                    padding: 18px 16px;\n                }\n                .content-grid[_ngcontent-%COMP%] {\n                    grid-template-columns: 1fr;\n                    gap: 18px;\n                    padding: 22px 0;\n                }\n                .runtime-note[_ngcontent-%COMP%] {\n                    min-height: 0;\n                }\n                .home-bottomline[_ngcontent-%COMP%] {\n                    flex-wrap: wrap;\n                }\n            }'] });
  }
}

let application = null;
let component = null;
let container = null;
async function bootstrap() { }
async function mount(props) {
    container = props.domElementGetter();
    emitMfeState({ app: "home-angular", state: "loading", message: "Starting Angular frontend" });
    try {
        application = await createApplication();
        component = createComponent(HomeComponent, {
            environmentInjector: application.injector,
            hostElement: document.createElement("div"),
        });
        component.location.nativeElement.dataset.mfe = "home-angular";
        container.replaceChildren(component.location.nativeElement);
        application.attachView(component.hostView);
        emitFrameworkActive({ framework: "Angular", route: window.location.pathname });
        emitMfeState({
            app: "home-angular",
            state: "ready",
            message: "Angular frontend is mounted",
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Angular mount failed";
        emitMfeError({ app: "home-angular", message });
        emitMfeState({
            app: "home-angular",
            state: "error",
            message: "Angular frontend failed to mount",
        });
        await unmount();
        throw error;
    }
}
async function unmount(_props) {
    if (component && application)
        application.detachView(component.hostView);
    component?.destroy();
    component = null;
    application?.destroy();
    application = null;
    container?.replaceChildren();
    container = null;
}

export { bootstrap, mount, unmount };
//# sourceMappingURL=entry.js.map
