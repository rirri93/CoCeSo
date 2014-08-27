/**
 * CoCeSo
 * Client JS - Extensions for knockout.js
 * Copyright (c) WRK\Coceso-Team
 *
 * Licensed under the GNU General Public License, version 3 (GPL-3.0)
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright Copyright (c) 2014 WRK\Coceso-Team
 * @link https://sourceforge.net/projects/coceso/
 * @license GPL-3.0 ( http://opensource.org/licenses/GPL-3.0 )
 */

/**
 * Generate the binding to a jQuery UI widget
 *
 * @param {String} widget The jQuery UI widget constructor
 * @return {BindingHandler}
 */
function uiBindingHandler(widget) {
  return {
    init: function(element, valueAccessor) {
      var options = ko.utils.unwrapObservable(valueAccessor()) || {};
      setTimeout(function() {
        $(element)[widget](options);
      }, 0);

      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        if ($(element).data("ui-" + widget)) {
          $(element)[widget]("destroy");
        }
      });
    },
    update: function(element, valueAccessor) {
      var options = ko.utils.unwrapObservable(valueAccessor()) || {};
      setTimeout(function() {
        $(element)[widget]("destroy")[widget](options);
      }, 0);
    }
  };
}

/**
 * Generate Accordion from loop
 *
 * @type {BindingHandler}
 */
ko.bindingHandlers.accordion = uiBindingHandler("accordion");

/**
 * Subscribe to refresh accordion
 *
 * @type {BindingHandler}
 */
ko.bindingHandlers.accordionRefresh = {
  init: function(element, valueAccessor) {
    ko.utils.unwrapObservable(valueAccessor());
  },
  update: function(element, valueAccessor) {
    ko.utils.unwrapObservable(valueAccessor());
    if ($(element).data("ui-accordion")) {
      $(element)["accordion"]("refresh");
    }
  }
};

ko.bindingHandlers.visibleAndSelect = {
  update: function(element, valueAccessor) {
    ko.bindingHandlers.visible.update(element, valueAccessor);
    if (valueAccessor()) {
      setTimeout(function() {
        $(element).focus().select();
      }, 0);
    }
  }
};

/**
 * Generate Draggable from element
 *
 * @type {BindingHandler}
 */
ko.bindingHandlers.draggable = uiBindingHandler("draggable");

/**
 * Generate Droppable from element
 *
 * @type {BindingHandler}
 */
ko.bindingHandlers.droppable = uiBindingHandler("droppable");

/**
 * Generate Popover from element
 *
 * @type {BindingHandler}
 */
ko.bindingHandlers.popover = uiBindingHandler("popover");

/**
 * Force value to be an integer
 *
 * @param {ko.observable} target
 * @param {void} active
 * @returns {ko.computed}
 */
ko.extenders.integer = function(target, active) {
  //create a writeable computed observable to intercept writes to our observable
  var result = ko.computed({
    read: target, //always return the original observables value
    write: function(newValue) {
      var current = target(),
          newValueInt = (newValue && !isNaN(newValue)) ? parseInt(newValue) : 0;

      //only write if it changed
      if (newValueInt !== current) {
        target(newValueInt);
      } else if (newValue !== current) {
        target.notifySubscribers(newValueInt);
      }
    }
  }).extend({notify: 'always'});

  //initialize with current value
  result(target());

  //return the new computed observable
  return result;
};

/**
 * Allow change detection on observable
 *
 * @param {ko.observable} target
 * @param {Object} options
 * @returns {ko.computed}
 */
ko.extenders.observeChanges = function(target, options) {
  target.server = options.server;
  target.orig = (typeof options.orig !== "undefined") ? ko.observable(options.orig) : ko.observable(ko.utils.unwrapObservable(target.server));

  target.localChange = ko.computed(function() {
    return (typeof this.orig() !== "undefined" && this() !== this.orig());
  }, target);

  target.serverChange = ko.computed(function() {
    var server = ko.utils.unwrapObservable(this.server), orig = this.orig();
    if (typeof server !== "undefined" && server !== orig) {
      return server;
    }
    return null;
  }, target);

  target.reset = function() {
    if (target.localChange()) {
      target(target.orig());
    }
  };

  target.setServer = function(server) {
    target.server = server;
    target.orig.valueHasMutated();
  };

  target.tmp = ko.computed(function() {
    var server = ko.utils.unwrapObservable(this.server), orig = this.orig();
    if (typeof server !== "undefined" && server !== orig) {
      if (!options.keepChanges || !this.localChange() || server === this()) {
        this.orig(server);
        this(server);
      }
    }
  }, target);

  return target;
};

/**
 * Allow change detection on array
 *
 * @param {ko.observableArray} target
 * @param {Object} options
 * @returns {ko.observableArray}
 */
ko.extenders.arrayChanges = function(target, options) {
  //Include those for matching interface with observeChanges
  target.orig = ko.observable(null);
  target.serverChange = ko.observable(null);

  target.localChange = ko.computed(function() {
    var items = ko.utils.unwrapObservable(this);
    if (!items instanceof Array) {
      return false;
    }
    return (ko.utils.arrayFirst(items, function(item) {
      return ko.utils.unwrapObservable(item.localChange);
    }) ? true : false);
  }, target);

  target.reset = function() {
    var items = ko.utils.unwrapObservable(target);
    if (!items instanceof Array) {
      return;
    }
    ko.utils.arrayForEach(items, function(item) {
      if (item.reset instanceof Function) {
        item.reset();
      }
    });
  };

  return target;
};

/**
 * Get a filtered selection of an array
 *
 * @param {ko.observableArray} target
 * @param {Object} options A filterObject (documented below)
 * @returns {ko.computed}
 * @see applyFilter
 */
ko.extenders.filtered = function(target, options) {
  var compare = function(op, a, b) {
    if (a instanceof Object) {
      var i;
      for (i in a) {
        if (compare(op, a[i], b)) {
          return true;
        }
      }
      return false;
    } else {
      if (typeof b === "boolean") {
        if (a === "true") {
          a = true;
        } else if (a === "false") {
          a = false;
        }
      }
      if (op === "not") {
        return (a !== b);
      }

      return (a === b);
    }
  };

  /**
   * Recursively apply filters
   *
   * filterObj has one of the following formats or may even be a mix of both:
   *
   *  {
   *    conn: "and"/"or" (optional, define the logical connection of filters, "and" is default)
   *    filter: {
   *      key1: val1, (matching is done with ===)
   *      key2: val2
   *    }
   *  }
   *
   *  {
   *    conn: "and"/"or"
   *    filter: { (can also be an array)
   *      someKey: filterObj1,
   *      anotherKey: filterObj2,
   *    }
   *  }
   *
   * Each filter may also be an object like
   *  {op: "operator", val: "value"}
   *
   * @param {Object} filterObj
   * @param {ViewModelSingle} val The ViewModel to check
   * @return {boolean} True if
   */
  var applyFilter = function(filterObj, val) {
    var and = (filterObj.conn === "or") ? false : true;
    var i;
    for (i in filterObj.filter) {
      //Check all objects in filter
      if (typeof filterObj.filter[i] !== "undefined") {
        var ret;
        if (typeof filterObj.filter[i].filter !== "undefined") {
          //Checked filter is actually another filterObj: Recursive call
          ret = applyFilter(filterObj.filter[i], val);
        } else {
          //Compare
          if (typeof val[i] === "undefined") {
            ret = false;
          } else {
            var filter = filterObj.filter[i], op = "equal";
            if ((typeof filter.op !== "undefined") && (typeof filter.val !== "undefined")) {
              op = filter.op;
              filter = filter.val;
            } else if (typeof filter.val !== "undefined") {
              filter = filter.val;
            }

            ret = compare(op, filter, ko.utils.unwrapObservable(val[i]));
          }
        }

        if (ret !== and) {
          //"and" connection and this result is false => return false
          //"or" connection and this result is true => return true
          return ret;
        }
      }
    }
    //"and" connection: no result was false, so return true
    //"or" connection: no result was true, so return false
    return and;
  };

  return ko.computed(function() {
    var data = ko.utils.unwrapObservable(target) || [];

    if (!data.length) {
      return data;
    }

    var filters = options.filters ? ko.utils.unwrapObservable(options.filters) || {} : {},
        sort = options.sort ? ko.utils.unwrapObservable(options.sort) : null;

    if (filters.filter) {
      data = ko.utils.arrayFilter(data, function(val) {
        //Apply the filters to all child elements
        return applyFilter(filters, val);
      });
    }

    if (sort) {
      data = data.sort(sort);
    }

    return data;
  });
};

/**
 * Helper for boolean values
 *
 * @param {ko.observable} target
 * @returns {ko.computed}
 */
ko.extenders.boolean = function(target) {
  var ret = ko.computed({
    read: target,
    write: function(val) {
      target(!!val);
    }
  });

  ret.toggle = function() {
    target(!target());
  };

  ret.set = function() {
    target(true);
  };

  ret.unset = function() {
    target(false);
  };

  return ret;
};

/**
 * Force value to be an integer
 *
 * @param {ko.observable} target
 * @param {Integer} length
 * @returns {ko.computed}
 */
ko.extenders.integer = function(target, length) {
  var ret = ko.computed({
    read: target,
    write: function(newValue) {
      var current = target(),
          newValueInt = (newValue && !isNaN(newValue)) ? parseInt(newValue) : 0;

      if (newValue === null || newValue === "") {
        newValueInt = null;
      } else if (length) {
        newValueInt = newValueInt.toString();
        while (newValueInt.length < length) {
          newValueInt = "0" + newValueInt;
        }
      }

      if (newValueInt !== current) {
        target(newValueInt);
      } else if (newValue !== current) {
        target.notifySubscribers(newValueInt);
      }
    }
  }).extend({notify: 'always'});

  ret.valueHasMutated = target.valueHasMutated;
  ret(target());

  return ret;
};
