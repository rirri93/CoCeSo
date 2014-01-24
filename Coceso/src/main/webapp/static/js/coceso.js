/**
 * CoCeSo
 * Client JS
 * Copyright (c) WRK\Daniel Rohr
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) 2013 Daniel Rohr
 * @link          https://sourceforge.net/projects/coceso/
 * @package       coceso.client.js
 * @since         Rev. 1
 * @license       MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Dependencies:
 *	jquery.js
 *	knockout.js
 *	knockout.mapping.js
 *	coceso.client.winman
 */

/**
 * Object containing the main code
 *
 * @namespace Coceso
 * @type Object
 */
var Coceso = {};

/**
 * Initialize the application
 *
 * @return {void}
 */
Coceso.startup = function() {
  //Initialize window management
  $("#taskbar").winman();

  $(document).on("show.bs.dropdown", ".ui-dialog .dropdown", function(event) {
    $(event.target).find(".dropdown-menu").css({top: 0, left: 0}).position({at: "left bottom", my: "left top", of: $(event.target).find(".dropdown-toggle").first()});
    return true;
  });

  //Preload incidents and units
  Coceso.Ajax.getAll("incidents");
  Coceso.Ajax.getAll("units");
};

/**
 * Some global settings
 *
 * @type Object
 */
Coceso.Conf = {
  interval: 10000,
  contentBase: "content/",
  jsonBase: "data/"
};

/**
 * Constants for some values (states, types)
 *
 * @type Object
 */
Coceso.Constants = {
  Unit: {
    state: {
      ad: "AD",
      eb: "EB",
      neb: "NEB"
    }
  },
  Incident: {
    type: {
      holdposition: "HoldPosition",
      relocation: "Relocation",
      transport: "Transport",
      tohome: "ToHome",
      standby: "Standby",
      task: "Task"
    },
    state: {
      new : "New",
      open: "Open",
      dispo: "Dispo",
      working: "Working",
      done: "Done"
    }
  },
  TaskState: {
    assigned: "Assigned",
    zbo: "ZBO",
    abo: "ABO",
    zao: "ZAO",
    aao: "AAO",
    detached: "Detached"
  }
};

/**
 * Contains all the models
 *
 * @namespace Coceso.Models
 * @type Object
 */
Coceso.Models = {
  /**
   * Incident Dummy
   *
   * @type Coceso.Models.Incident
   */
  Incident: {
    id: null,
    state: Coceso.Constants.Incident.state.new ,
    priority: 0,
    blue: false,
    units: {},
    bo: {info: ""},
    ao: {info: ""},
    casusNr: "",
    info: "",
    caller: "",
    type: null,
    taskState: null
  },
  /**
   * Unit dummy
   *
   * @type Coceso.Models.Unit
   */
  Unit: {
    id: null,
    state: Coceso.Constants.Unit.state.ad,
    call: null,
    ani: null,
    withDoc: false,
    portable: false,
    transportVehicle: false,
    crew: [],
    info: null,
    position: {info: ""},
    home: {info: ""},
    incidents: {},
    taskState: null
  }
};

/**
 * Contains UI related functions and data
 *
 * @namespace Coceso.UI
 * @type Object
 */
Coceso.UI = {
  /**
   * A list of all opened windows
   *
   * @type Object
   */
  windows: {},
  /**
   * Debugging information, such as HTTP errors
   *
   * @type Coceso.ViewModels.Debug
   */
  Debug: null,
  /**
   * Add a window to the UI
   *
   * @param {String} title The title of the window
   * @param {String} src The source to load the HTML from
   * @param {ViewModel} viewmodel The viewmodel to bind with
   * @return {void}
   */
  openWindow: function(title, src, viewmodel, options) {
    var id = $("#taskbar").winman("addWindow", title, src, options, function(el, id) {
      viewmodel.ui = id;
      ko.applyBindings(viewmodel, el);
    }, function(el, id) {
      if (viewmodel.destroy instanceof Function) {
        viewmodel.destroy.call(viewmodel);
      }
      ko.cleanNode(el);
      delete Coceso.UI.windows[id];
    });
    this.windows[id] = viewmodel;
  },
  /**
   * Open the incidents overview
   *
   * @param {String} title
   * @param {String} src
   * @param {Object} options
   * @return {void}
   */
  openIncidents: function(title, src, options, dialog) {
    this.openWindow(title, Coceso.Conf.contentBase + src, new Coceso.ViewModels.Incidents({}, options || {}), dialog);
    return false;
  },
  /**
   * Open a specific incident
   *
   * @param {String} title
   * @param {String} src
   * @param {Object} data Additional incident data
   * @return {void}
   */
  openIncident: function(title, src, data) {
    this.openWindow(title, Coceso.Conf.contentBase + src, new Coceso.ViewModels.Incident(data || {}));
    return false;
  },
  /**
   * Open the units overview
   *
   * @param {String} title
   * @param {String} src
   * @param {Object} options
   * @return {void}
   */
  openUnits: function(title, src, options, dialog) {
    this.openWindow(title, Coceso.Conf.contentBase + src, new Coceso.ViewModels.Units({}, options || {}), dialog);
    return false;
  },
  /**
   * Open the units overview
   *
   * @param {String} title
   * @param {String} src
   * @param {Object} data
   * @return {void}
   */
  openUnit: function(title, src, data) {
    this.openWindow(title, Coceso.Conf.contentBase + src, new Coceso.ViewModels.Unit(data || {}));
    return false;
  },
  /**
   * Open a list of log entries
   *
   * @param {String} title
   * @param {String} src
   * @param {Object} options
   * @return {void}
   */
  openLogs: function(title, src, options) {
    this.openWindow(title, Coceso.Conf.contentBase + src, new Coceso.ViewModels.Logs({}, options || {}));
    return false;
  },
  /**
   * Open debug window
   *
   * @param {String} title
   * @param {String} src
   * @param {Object} options
   * @return {void}
   */
  openDebug: function(title, src, options) {
    this.openWindow(title, Coceso.Conf.contentBase + src, this.Debug);
    return false;
  },
  /**
   * Open static content
   *
   * @param {String} title
   * @param {String} src
   * @return {void}
   */
  openStatic: function(title, src) {
    this.openWindow(title, Coceso.Conf.contentBase + src, {});
    return false;
  }
};

/**
 * AJAX related functions and data
 *
 * @namespace Coceso.Ajax
 * @type Object
 */
Coceso.Ajax = {
  /**
   * Preloaded data
   *
   * @type Object
   */
  data: {
    incidents: {incidentlist: []},
    units: {unitlist: []}
  },
  /**
   * Subscriptions to data loading
   *
   * @type Object
   */
  subscriptions: {
    incidents: [],
    units: []
  },
  loadOptions: {
    units: {
      list: "unitlist",
      url: "unit/getAll.json",
      interval: null,
      id: null
    },
    incidents: {
      list: "incidentlist",
      url: "incident/getAll.json",
      interval: null,
      id: null
    }
  },
  /**
   * Load the specified data
   *
   * @param {String} type The data type
   * @return {void}
   */
  getAll: function(type) {
    if (!Coceso.Ajax.loadOptions[type]) {
      return false;
    }

    var options = Coceso.Ajax.loadOptions[type];
    if (options.id) {
      window.clearTimeout(options.id);
      options.id = null;
    }
    if (options.interval === null) {
      options.interval = Coceso.Conf.interval;
    }

    $.ajax({
      dataType: "json",
      url: Coceso.Conf.jsonBase + options.url,
      ifModified: true,
      success: function(data, status) {
        if (status !== "notmodified") {
          Coceso.Ajax.data[type][options.list] = data;
          ko.utils.arrayForEach(Coceso.Ajax.subscriptions[type], function(item) {
            if (item instanceof Function) {
              item(Coceso.Ajax.data[type]);
            }
          });
        }
      },
      complete: function() {
        if (options.interval) {
          options.id = window.setTimeout(Coceso.Ajax.getAll, options.interval, type);
        }
      }
    });
  },
  /**
   * Subscribe to the loading of specified data
   *
   * @param {String} type The data type
   * @param {Function} func The callback function
   * @return {void}
   */
  subscribe: function(type, func) {
    if (this.subscriptions[type]) {
      this.subscriptions[type].push(func);
    }
  },
  /**
   * Unsubscribe from loading of specified data
   *
   * @param {String} type The data type
   * @param {Function} func The callback function
   * @return {void}
   */
  unsubscribe: function(type, func) {
    if (this.subscriptions[type]) {
      var subscriptions = this.subscriptions[type];
      ko.utils.arrayForEach(subscriptions, function(item) {
        if (item === func) {
          ko.utils.arrayRemoveItem(subscriptions, item);
        }
      });
    }
  },
  /**
   * Save entries with POST
   *
   * @param {Object} data
   * @param {String} url
   * @param {Function} success
   * @param {Function} error
   * @param {Function} httperror
   * @returns {void}
   */
  save: function(data, url, success, error, httperror) {
    $.ajax({
      type: "POST",
      url: Coceso.Conf.jsonBase + url,
      dataType: "json",
      contentType: (typeof data === "string") ? "application/json" : "application/x-www-form-urlencoded",
      data: data,
      processData: (typeof data !== "string"),
      success: function(data) {
        if (data.success) {
          if (success instanceof Function) {
            success(data);
          }
        } else {
          if (error instanceof Function) {
            error(data);
          }
        }
      },
      error: function(jqXHR) {
        Coceso.UI.Debug.pushHttpError(jqXHR, url, data);
        if (httperror instanceof Function) {
          httperror(jqXHR);
        }
      },
      complete: function() {
        var i;
        for (i in Coceso.Ajax.loadOptions) {
          Coceso.Ajax.getAll(i);
        }
      }
    });
  },
  /**
   * Load a single item into a viewmodel
   *
   * NOT USED
   *
   * @param {ViewModel} viewmodel
   * @param {String} url The URL to load from
   * @param {int} interval The interval to reload. 0 or false for no autoload.
   * @return {void}
   */
  get: function(viewmodel, url, interval) {
    $.ajax({
      dataType: "json",
      url: Coceso.Conf.jsonBase + url,
      ifModified: true,
      success: function(data, status) {
        if (status !== "notmodified") {
          //Not used
        }
      },
      complete: function() {
        if (interval) {
          window.setTimeout(function() {
            Coceso.Ajax.get(viewmodel, url, interval);
          }, interval);
        }
      }
    });
  }
};

/**
 * Contains all ViewModels (including baseclasses)
 *
 * @namespace Coceso.ViewModels
 * @type Object
 */
Coceso.ViewModels = {};

/**
 * Base class for all ViewModels
 *
 * @constructor
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.ViewModel = function(data, options) {
  /**
   * Basic options for the model
   *
   * @type Object
   */
  this.options = options || {};

  //Create and populate observables
  ko.mapping.fromJS(data, this.mappingOptions, this);

  //Subscribe to updates
  if (this.getOption("reload") && this.dataType && (this.setData instanceof Function)) {
    Coceso.Ajax.subscribe(this.dataType, this.setData);
  }
};
Coceso.ViewModels.ViewModel.prototype = Object.create({}, /** @lends Coceso.ViewModels.ViewModel.prototype */ {
  /**
   * The entity used in this model
   *
   * @type String
   */
  dataType: {value: null},
  /**
   * Options for mapping
   *
   * @type Object
   */
  mappingOptions: {value: {}},
  /**
   * Read the specified option value
   *
   * @function
   * @param {String|Array} key The option to get
   * @param {mixed} val The default value
   * @return {mixed}
   */
  getOption: {
    value: function(key, val) {
      if (typeof val === "undefined") {
        val = false;
      }

      if (typeof key === "string") {
        return (typeof this.options[key] !== "undefined") ? this.options[key] : val;
      }

      var i, current = this.options;
      for (i in key) {
        if (typeof current[key[i]] === "undefined") {
          return val;
        }
        current = current[key[i]];
      }
      return current;
    }
  },
  /**
   * Destroy the ViewModel
   *
   * @function
   * @return {void}
   */
  destroy: {
    value: function() {
      //Unsubscribe from updates
      if (this.dataType && (this.setData instanceof Function)) {
        Coceso.Ajax.unsubscribe(this.dataType, this.setData);
      }
    }
  }
});

/**
 * Base class for all list style ViewModels
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModel
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.ViewModelList = function(data, options) {
  var self = this;

  //Set default options: Autoload list, don't load children
  options = $.extend({
    initial: true,
    reload: true,
    children: {
      initial: false,
      reload: false,
      writeable: false
    }
  }, options);

  /**
   * Method to set refreshed data
   *
   * @param {Object} data The refreshed data object
   * @return {void}
   */
  this.setData = function(data) {
    ko.mapping.fromJS(data, self);
  };

  if (options.initial && this.dataType) {
    //Inital loading: take preloaded ajax data
    data = $.extend({}, Coceso.Ajax.data[this.dataType], data);
  }

  //Call super constructor
  Coceso.ViewModels.ViewModel.call(this, data, options);
};
Coceso.ViewModels.ViewModelList.prototype = Object.create(Coceso.ViewModels.ViewModel.prototype, /** @lends Coceso.ViewModels.ViewModelList.prototype */ {});

/**
 * Base class for all single element ViewModels
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModel
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.ViewModelSingle = function(data, options) {
  var self = this, orig = {};

  options = $.extend({
    initial: true,
    reload: true,
    writeable: true,
    assigned: true,
    children: {
      //Don't autoload list of assigned data
      initial: false,
      reload: false,
      children: {
        //Autoload assigned data, but not another level of assigned data
        initial: true,
        reload: true,
        writeable: false,
        assigned: false
      }
    }
  }, options);

  if (options.initial && this.dataType && data.id) {
    orig = ko.utils.arrayFirst(Coceso.Ajax.data[this.dataType][this.dataList], function(item) {
      return (item.id === data.id);
    }) || {};
  }

  orig = this.replaceNull($.extend(true, {}, this.model, orig));
  data = this.replaceNull($.extend(true, {}, orig, data));

  this.mappingOptions.orig = orig;

  /**
   * Method to set refreshed data
   *
   * @param {Object} data The refreshed data object
   * @return {void}
   */
  this.setData = function(data) {
    if (data[self.dataList] instanceof Array) {
      data = ko.utils.arrayFirst(data[self.dataList], function(item) {
        return (item.id === self.id());
      });
    }

    data = self.replaceNull($.extend(true, {}, data));

    if (data) {
      ko.mapping.fromJS(data, self);
    }
  };

  //Call super constructor
  Coceso.ViewModels.ViewModel.call(this, data, options);

  /**
   * Watch dependencies
   *
   * @type ko.observableArray
   */
  this.dependencies = ko.observableArray().extend({arrayChanges: {}});

  if (typeof this.taskState !== "undefined") {
    this.dependencies.push(this.taskState);
  }

  /**
   * Return if data has been changed by the user
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.localChange = ko.computed(function() {
    return this.dependencies.localChange();
  }, this);

  /**
   * Return if TaskState is "Assigned"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isAssigned = ko.computed(function() {
    return (this.taskState && (this.taskState() === Coceso.Constants.TaskState.assigned));
  }, this);

  /**
   * Return if TaskState is "ZBO"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isZBO = ko.computed(function() {
    return (this.taskState && (this.taskState() === Coceso.Constants.TaskState.zbo));
  }, this);

  /**
   * Return if TaskState is "ABO"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isABO = ko.computed(function() {
    return (this.taskState && (this.taskState() === Coceso.Constants.TaskState.abo));
  }, this);

  /**
   * Return if TaskState is "ZAO"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isZAO = ko.computed(function() {
    return (this.taskState && (this.taskState() === Coceso.Constants.TaskState.zao));
  }, this);

  /**
   * Return if TaskState is "AAO"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isAAO = ko.computed(function() {
    return (this.taskState && (this.taskState() === Coceso.Constants.TaskState.aao));
  }, this);

  /**
   * Return if TaskState is "Detached"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isDetached = ko.computed(function() {
    return (this.taskState && (this.taskState() === Coceso.Constants.TaskState.detached));
  }, this);

  /**
   * Reset the form to its original state
   *
   * @return {void}
   */
  this.reset = function() {
    self.dependencies.reset();
  };

  /**
   * Callback on error saving
   *
   * @return {void}
   */
  this.saveError = function() {
    $("#" + self.ui + "-error").stop(true).show().fadeOut(7000);
  };
};
Coceso.ViewModels.ViewModelSingle.prototype = Object.create(Coceso.ViewModels.ViewModel.prototype, /** @lends Coceso.ViewModels.ViewModelSingle.prototype */ {
  /**
   * The Model used in this ViewModel
   *
   * @type Coceso.Model
   */
  model: {value: null},
  /**
   * The list name
   *
   * @type String
   */
  dataList: {value: null},
  /**
   * The URL to send the POST to
   *
   * @type String
   */
  saveUrl: {value: null},
  /**
   * Save modified data
   *
   * @function
   * @return {boolean}
   */
  save: {
    value: function() {
      if (!this.getOption("writeable") || !this.saveUrl) {
        return false;
      }

      var data = ko.mapping.toJS(this, {ignore: ["incidents", "units", "taskState"]});

      if (this.beforeSave instanceof Function) {
        data = this.beforeSave(data);
      }

      Coceso.Ajax.save(ko.toJSON(data), this.saveUrl, this.afterSave, this.saveError, this.saveError);
      return true;
    }
  },
  /**
   * Replace null values with empty objects
   *
   * @function
   * @param {Object} data
   * @return {Object}
   */
  replaceNull: {
    value: function(data) {
      if (!this.model) {
        return data;
      }

      var i;
      for (i in data) {
        if ((data[i] === null) && (typeof this.model[i] === "object")) {
          data[i] = this.model[i];
        }
      }
      return data;
    }
  },
  /**
   * Options for draggables
   *
   * @type Object
   */
  dragOptions: {
    value: {
      helper: "clone",
      appendTo: "body",
      cursor: "move",
      zIndex: 1500
    }
  }
});

/**
 * List of incidents
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModelList
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.Incidents = function(data, options) {
  //Call super constructor
  Coceso.ViewModels.ViewModelList.call(this, data, options);

  /**
   * Available filters
   *
   * @type Object
   */
  var filters = {
    overview: {
      filter: {
        type: {val: [Coceso.Constants.Incident.type.task, Coceso.Constants.Incident.type.transport, Coceso.Constants.Incident.type.relocation]}
      }
    },
    active: {
      disable: {state: {done: true}},
      filter: {
        state: {op: "not", val: Coceso.Constants.Incident.state.done}
      }
    },
    "new": {
      disable: {state: true},
      filter: {
        state: Coceso.Constants.Incident.state.new
      }
    },
    open: {
      disable: {state: true},
      filter: {
        state: Coceso.Constants.Incident.state.open
      }
    },
    completed: {
      disable: {state: true},
      filter: {
        state: Coceso.Constants.Incident.state.done
      }
    }
  };

  var filterOption = this.getOption("filter", []);

  this.disableFilter = {};
  for (var i in filterOption) {
    if (filters[filterOption[i]] && filters[filterOption[i]].disable) {
      $.extend(true, this.disable, filters[filterOption[i]].disable);
    }
  }

  /**
   * The selected filters
   *
   * @type Object
   */
  this.filter = {
    type: ko.observableArray(),
    blue: ko.observableArray(),
    state: ko.observableArray()
  };

  /**
   * Generate a list of active filters
   *
   * @function
   * @type ko.computed
   * @return {Object}
   */
  this.activeFilters = ko.computed(function() {
    var activeFilters = {filter: []};

    //Filters selected in user interface
    var i, filter = {};
    for (i in this.filter) {
      var unwrapped = ko.utils.unwrapObservable(this.filter[i]);
      if (unwrapped.length) {
        filter[i] = {val: unwrapped};
      }
    }
    activeFilters.filter.push({
      filter: filter
    });

    //Filters from options
    for (i in filterOption) {
      if (filters[filterOption[i]]) {
        activeFilters.filter.push(filters[filterOption[i]]);
      }
    }

    return activeFilters;
  }, this);

  /**
   * Filtered view of the incidents array
   *
   * @function
   * @type ko.computed
   * @return {Array}
   */
  this.filtered = this.incidentlist.extend({filtered: {filters: this.activeFilters}});
};
Coceso.ViewModels.Incidents.prototype = Object.create(Coceso.ViewModels.ViewModelList.prototype, /** @lends Coceso.ViewModels.Incidents.prototype */ {
  /**
   * @see Coceso.ViewModels.ViewModel#dataType
   * @override
   */
  dataType: {value: "incidents"},
  /**
   * @see Coceso.ViewModels.ViewModel#mappingOptions
   * @override
   */
  mappingOptions: {
    value: {
      incidentlist: {
        key: function(data) {
          return ko.utils.unwrapObservable(data.id);
        },
        create: function(options) {
          return new Coceso.ViewModels.Incident(options.data, options.parent.getOption("children", {}));
        },
        update: function(options) {
          options.target.setData(options.data);
          return options.target;
        }
      }
    }
  }
});

/**
 * Single incident
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModelSingle
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.Incident = function(data, options) {
  var self = this;

  //Call parent constructor
  Coceso.ViewModels.ViewModelSingle.call(this, data, options);

  //Detect changes
  this.dependencies.push(this.type, this.priority, this.blue, this.bo.info, this.ao.info, this.info, this.caller, this.casusNr, this.state);
  if (this.units && this.units.unitlist) {
    this.dependencies.push(this.units.unitlist);
  }

  /**
   * Incident is of type "Task"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isTask = ko.computed(function() {
    return (this.type() === Coceso.Constants.Incident.type.task);
  }, this);

  /**
   * Incident is of type "Relocation"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isRelocation = ko.computed(function() {
    return (this.type() === Coceso.Constants.Incident.type.relocation);
  }, this);

  /**
   * Incident is of type "Relocation"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isTransport = ko.computed(function() {
    return (this.type() === Coceso.Constants.Incident.type.transport);
  }, this);

  /**
   * Incident is of type "ToHome"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isToHome = ko.computed(function() {
    return (this.type() === Coceso.Constants.Incident.type.tohome);
  }, this);

  /**
   * Incident is of type "HoldPosition"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isHoldPosition = ko.computed(function() {
    return (this.type() === Coceso.Constants.Incident.type.holdposition);
  }, this);

  /**
   * Incident is of type "Standby"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isStandby = ko.computed(function() {
    return (this.type() === Coceso.Constants.Incident.type.standby);
  }, this);

  /**
   * Incident has state "New"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isNew = ko.computed(function() {
    return (this.state() === Coceso.Constants.Incident.state.new );
  }, this);

  /**
   * Incident has state "Open"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isOpen = ko.computed(function() {
    return (this.state() === Coceso.Constants.Incident.state.open);
  }, this);

  /**
   * Incident has state "Dispo"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isDispo = ko.computed(function() {
    return (this.state() === Coceso.Constants.Incident.state.dispo);
  }, this);

  /**
   * Incident has state "Working"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isWorking = ko.computed(function() {
    return (this.state() === Coceso.Constants.Incident.state.working);
  }, this);

  /**
   * Incident has state "Done"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isDone = ko.computed(function() {
    return (this.state() === Coceso.Constants.Incident.state.done);
  }, this);

  /**
   * Enable the "Task" type button
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableTask = ko.computed(function() {
    return (this.getOption("writeable") && (!this.id() || this.isTask()));
  }, this);

  /**
   * Enable the "Relocation" type button
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableRelocation = ko.computed(function() {
    return (this.getOption("writeable") && (!this.id() || this.isRelocation()));
  }, this);

  /**
   * Enable the "Transport" type button
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableTransport = ko.computed(function() {
    return (this.getOption("writeable") && (!this.id() || this.isTransport()));
  }, this);

  /**
   * Enable BO field
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableBO = ko.computed(function() {
    return !this.isRelocation();
  }, this);

  /**
   * Allow IncidentState New
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableNew = ko.computed(function() {
    return (this.getOption("writeable") && (!this.id() || (this.state.orig() === Coceso.Constants.Incident.state.new )));
  }, this);

  /**
   * Allow IncidentState Dispo
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableDispo = ko.computed(function() {
    if (!this.getOption("writeable") || !this.units.unitlist) {
      return false;
    }

    return (ko.utils.arrayFirst(this.units.unitlist(), function(unit) {
      return (unit.isAssigned() || unit.isZBO());
    }) !== null);
  }, this);

  /**
   * Allow IncidentState Working
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.enableWorking = ko.computed(function() {
    if (!this.getOption("writeable") || !this.units.unitlist) {
      return false;
    }

    return (ko.utils.arrayFirst(this.units.unitlist(), function(unit) {
      return (unit.isABO() || unit.isZAO() || unit.isAAO());
    }) !== null);
  }, this);

  /**
   * Return a one-letter representation of type
   *
   * @function
   * @type ko.computed
   * @return {String}
   */
  this.typeString = ko.computed(function() {
    if (this.isTask()) {
      return this.blue() ? "E" : "A";
    }
    if (this.isTransport()) {
      return "T";
    }
    if (this.isRelocation()) {
      return "V";
    }
    if (this.isToHome()) {
      return "Einr";
    }
    if (this.isStandby()) {
      return "<span class='glyphicon glyphicon-pause'></span>";
    }
    if (this.isHoldPosition()) {
      return "<span class='glyphicon glyphicon-record'></span>";
    }
    return "";
  }, this);

  /**
   * Set TaskState to next state
   *
   * @param {Integer} unitid
   * @return {void}
   */
  this.nextState = function(unitid) {
    if (unitid && self.id()) {
      Coceso.Ajax.save({incident_id: self.id(), unit_id: unitid}, "incident/nextState.json");
    }
  };

  /**
   * Assign a unit within the form
   *
   * @param {Event} event The jQuery Event (unused)
   * @param {Object} ui jQuery UI properties
   * @return {void}
   */
  this.assignUnitForm = function(event, ui) {
    var viewmodel = ko.dataFor(ui.draggable.context);
    if (!(viewmodel instanceof Coceso.ViewModels.Unit)) {
      return;
    }
    var unitid = ko.utils.unwrapObservable(viewmodel.id);
    if (unitid && self.units.unitlist) {
      var assigned = ko.utils.arrayFirst(self.units.unitlist(), function(unit) {
        return (unit.id() === unitid);
      });
      if (assigned === null) {
        self.units.unitlist.push(new Coceso.ViewModels.Unit({id: unitid, taskState: "Assigned"}, self.getOption(["children", "children"], {assigned: false, writeable: false})));
      }
    }
  };

  /**
   * Assign a unit to an incident in the list
   *
   * @param {Event} event The jQuery Event (unused)
   * @param {Object} ui jQuery UI properties
   * @return {void}
   */
  this.assignUnitList = function(event, ui) {
    var unit = ko.dataFor(ui.draggable.context);

    if ((unit instanceof Coceso.ViewModels.Unit) && self.id() && unit.id()) {
      Coceso.Ajax.save({incident_id: self.id(), unit_id: unit.id()}, "assignUnit.json");
    }
  };

  /**
   * Open in a form
   *
   * @return {void}
   */
  this.openForm = function() {
    Coceso.UI.openIncident("Edit Incident", "incident_form.html", {id: self.id()});
  };

  /**
   * Open log
   *
   * @return {void}
   */
  this.openLog = function() {
    if (self.id()) {
      Coceso.UI.openLogs("Incident-Log", "log.html", {url: "log/getByIncident/" + self.id()});
    }
  };

  /**
   * Callback after saving
   *
   * @param {Object} data The data returned from server
   * @return {void}
   */
  this.afterSave = function(data) {
    if (data.incident_id) {
      self.id(data.incident_id);
    }

    if (self.id() && (typeof self.units.unitlist !== "undefined")) {
      ko.utils.arrayForEach(self.units.unitlist(), function(unit) {
        if (unit.taskState.localChange()) {
          if (unit.taskState.orig() === null) {
            Coceso.Ajax.save({incident_id: self.id(), unit_id: unit.id()}, "assignUnit.json", function() {
              Coceso.Ajax.save({incident_id: self.id(), unit_id: unit.id(), state: unit.taskState()}, "incident/setToState.json");
            });
          } else {
            Coceso.Ajax.save({incident_id: self.id(), unit_id: unit.id(), state: unit.taskState()}, "incident/setToState.json");
          }
        }
      });
    }
  };
};
Coceso.ViewModels.Incident.prototype = Object.create(Coceso.ViewModels.ViewModelSingle.prototype, /** @lends Coceso.ViewModels.Incident.prototype */ {
  /**
   * @see Coceso.ViewModels.ViewModel#dataType
   * @override
   */
  dataType: {value: "incidents"},
  /**
   * @see Coceso.ViewModels.ViewModel#dataList
   * @override
   */
  dataList: {value: "incidentlist"},
  /**
   * @see Coceso.ViewModels.ViewModelSingle#model
   * @override
   */
  model: {value: Coceso.Models.Incident},
  /**
   * @see Coceso.ViewModels.ViewModelSingle#saveUrl
   * @override
   */
  saveUrl: {value: "incident/update.json"},
  /**
   * @see Coceso.ViewModels.ViewModel#mappingOptions
   * @override
   */
  mappingOptions: {
    value: {
      ignore: ["concern"],
      keepChanges: {
        info: true
      },
      units: {
        create: function(options) {
          if (!options.parent.getOption("assigned")) {
            return options.data;
          }
          return new Coceso.ViewModels.Units({unitlist: []}, options.parent.getOption("children", {children: {assigned: false}}));
        },
        update: function(options) {
          if (!options.parent.getOption("assigned")) {
            return options.target;
          }
          var units = [], i;
          for (i in options.data) {
            units.push({id: parseInt(i), taskState: options.data[i]});
          }

          ko.utils.arrayForEach(options.target.unitlist(), function(unit) {
            if ((unit.taskState.orig() === null) && (typeof options.data[unit.id()] === "undefined")) {
              units.push({id: unit.id()});
            }
          });

          options.target.setData({unitlist: units});
          return options.target;
        }
      }
    }
  },
  /**
   * Data manipulation before saving
   *
   * @function
   * @param {Object} data The data to save
   * @return {Object} The manipulated data
   */
  beforeSave: {
    value: function(data) {
      delete data.ao.id;
      delete data.bo.id;

      return data;
    }
  }
});

/**
 * List of units
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModelList
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.Units = function(data, options) {
  Coceso.ViewModels.ViewModelList.call(this, data, options);

  /**
   * Available filters
   *
   * @type Object
   */
  var filters = {
    option: {
      radio: {
        filter: {
          hasAssigned: true
        }
      }
    }
  };

  var filterOption = this.getOption("filter", []);

  /**
   * Generate a list of active filters
   *
   * @function
   * @type ko.computed
   * @return {Object}
   */
  this.activeFilters = ko.computed(function() {
    var activeFilters = {filter: []};

    var i;
    for (i in filterOption) {
      if (filters.option[filterOption[i]]) {
        activeFilters.filter.push(filters.option[filterOption[i]]);
      }
    }

    return activeFilters;
  }, this);

  /**
   * Filtered view of the incidents array
   *
   * @function
   * @type ko.computed
   * @return {Array}
   */
  this.filtered = this.unitlist.extend({filtered: {filters: this.activeFilters}});
};
Coceso.ViewModels.Units.prototype = Object.create(Coceso.ViewModels.ViewModelList.prototype, /** @lends Coceso.ViewModels.Units.prototype */ {
  /**
   * @see Coceso.ViewModels.ViewModel#dataType
   * @override
   */
  dataType: {value: "units"},
  /**
   * @see Coceso.ViewModels.ViewModel#mappingOptions
   * @override
   */
  mappingOptions: {
    value: {
      unitlist: {
        key: function(data) {
          return ko.utils.unwrapObservable(data.id);
        },
        create: function(options) {
          return new Coceso.ViewModels.Unit(options.data, options.parent.getOption("children", {}));
        },
        update: function(options) {
          options.target.setData(options.data);
          return options.target;
        }
      }
    }
  }
});

/**
 * Single unit
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModelSingle
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.Unit = function(data, options) {
  var self = this;

  Coceso.ViewModels.ViewModelSingle.call(this, data, options);

  //Detect changes
  this.dependencies.push(this.position.info, this.info, this.state);
  if (this.incidents && this.incidents.incidentlist) {
    this.dependencies.push(this.incidents.incidentlist);
  }

  /**
   * Return the number of assigned incidents
   *
   * @function
   * @type ko.computed
   * @return {Integer}
   */
  this.incidentCount = ko.computed(function() {
    if (!this.incidents || !this.incidents.incidentlist) {
      return -1;
    }

    return this.incidents.incidentlist().length;
  }, this);

  /**
   * Last known position is home
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isHome = ko.computed(function() {
    return (this.position.info() === this.home.info());
  }, this);

  this.taskText = ko.computed(function() {
    if (this.incidentCount() < 0) {
      return "";
    }
    if (this.incidentCount() > 1) {
      return "<span class='glyphicon glyphicon-plus'></span>";
    }
    if (this.incidentCount() === 0) {
      return "<span class='glyphicon glyphicon-" + (this.isHome() ? "home" : "exclamation-sign") + "'></span>";
    }

    var incident = this.incidents.incidentlist()[0];
    if (incident.isTask() || incident.isTransport() || incident.isRelocation() || incident.isToHome()) {
      return incident.typeString() + ": " + incident.taskState();
    }

    if (incident.isStandby() || incident.isHoldPosition()) {
      return incident.typeString();
    }

    return "";
  }, this);

  this.taskCss = ko.computed(function() {
    if (this.incidentCount() < 0) {
      return "";
    }
    if (this.incidentCount() > 1) {
      return "unit_state_multiple";
    }
    if (this.incidentCount() === 0) {
      return (this.isHome()) ? "unit_state_ishome" : "unit_state_free";
    }

    var incident = this.incidents.incidentlist()[0];
    if (incident.isTask() || incident.isTransport()) {
      return (incident.blue()) ? "unit_state_task_blue" : "unit_state_task";
    }
    if (incident.isRelocation()) {
      return "unit_state_relocation";
    }
    if (incident.isHoldPosition()) {
      return "unit_state_holdposition";
    }
    if (incident.isToHome()) {
      return "unit_state_tohome";
    }
    if (incident.isStandby()) {
      return "unit_state_standby";
    }

    return "";
  }, this);

  /**
   * Unit has state "AD"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isAD = ko.computed(function() {
    return (this.state() === Coceso.Constants.Unit.state.ad);
  }, this);

  /**
   * Unit has state "EB"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isEB = ko.computed(function() {
    return (this.state() === Coceso.Constants.Unit.state.eb);
  }, this);

  /**
   * Unit has state "NEB"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.isNEB = ko.computed(function() {
    return (this.state() === Coceso.Constants.Unit.state.neb);
  }, this);

  /**
   * CSS class based on the unit's state
   *
   * @function
   * @type ko.computed
   * @return {string} The CSS class
   */
  this.stateCss = ko.computed(function() {
    if (this.isEB()) {
      return ((this.incidentCount() === 1) && (this.incidents.incidentlist()[0].isStandby())) ? "unit_state_standby" : "unit_state_eb";
    }
    return this.isNEB() ? "unit_state_neb" : "unit_state_ad";
  }, this);

  /**
   * Unit has incident with TaskState "Assigned"
   *
   * @function
   * @type ko.computed
   * @return {boolean}
   */
  this.hasAssigned = ko.computed(function() {
    if (!this.incidents || !this.incidents.incidents) {
      return false;
    }

    return (ko.utils.arrayFirst(this.incidents.incidents(), function(incident) {
      return incident.isAssigned();
    }) !== null);
  }, this);

  this.popover = ko.computed(function() {
    var content = "Home: " + this.home.info() + "<br /><br />Position: " + this.position.info();
    return {
      trigger: 'hover focus',
      placement: 'auto top',
      html: true,
      container: 'body',
      title: this.call(),
      content: content
    };
  }, this);

  /**
   * Set TaskState to next state
   *
   * @param {Integer} incid
   * @return {void}
   */
  this.nextState = function(incid) {
    if (typeof incid === "undefined" && self.incidentCount() === 1) {
      incid = self.incidents.incidentlist()[0].id();
    }

    if (incid && self.id()) {
      Coceso.Ajax.save({incident_id: incid, unit_id: self.id()}, "incident/nextState.json");
    }
  };

  /**
   * Assign a incident within the form
   *
   * @param {Event} event The jQuery Event (unused)
   * @param {Object} ui jQuery UI properties
   * @return {void}
   */
  this.assignIncidentForm = function(event, ui) {
    var viewmodel = ko.dataFor(ui.draggable.context);
    if (!(viewmodel instanceof Coceso.ViewModels.Incident)) {
      return;
    }

    var incid = ko.utils.unwrapObservable(viewmodel.id);
    if (incid && self.incidents.incidentlist) {
      var assigned = ko.utils.arrayFirst(self.incidents.incidentlist(), function(incident) {
        return (incident.id() === incid);
      });
      if (assigned === null) {
        self.incidents.incidentlist.push(new Coceso.ViewModels.Incident({id: incid, taskState: Coceso.Constants.TaskState.assigned}, self.getOption(["children", "children"], {assigned: false, writeable: false})));
      }
    }
  };

  /**
   * Open incident form
   *
   * @return {void}
   */
  this.addIncident = function() {
    options = {caller: self.call(), units: {}};
    options.units[self.id()] = null;
    Coceso.UI.openIncident("Add Incident", "incident_form.html", options);
  };

  /**
   * Open in a form
   *
   * @return {void}
   */
  this.openForm = function() {
    Coceso.UI.openUnit("Edit Unit", "unit_form.html", {id: self.id()});
  };

  /**
   * Open in a form
   *
   * @return {void}
   */
  this.openLog = function() {
    if (self.id()) {
      Coceso.UI.openLogs("Unit-Log", "log.html", {url: "log/getByUnit/" + self.id()});
    }
  };

  /**
   * Callback after saving
   *
   * @param {Object} data The data returned from server
   * @return {void}
   */
  this.afterSave = function(data) {
    if (data.unit_id) {
      self.id(data.unit_id);
    }

    if (self.id() && (typeof self.incidents.incidentlist !== "undefined")) {
      ko.utils.arrayForEach(self.incidents.incidentlist(), function(inc) {
        if (inc.taskState.localChange()) {
          if (inc.taskState.orig() === null) {
            Coceso.Ajax.save({unit_id: self.id(), incident_id: inc.id()}, "assignUnit.json", function() {
              Coceso.Ajax.save({unit_id: self.id(), incident_id: inc.id(), state: inc.taskState()}, "incident/setToState.json");
            });
          } else {
            Coceso.Ajax.save({unit_id: self.id(), incident_id: inc.id(), state: inc.taskState()}, "incident/setToState.json");
          }
        }
      });
    }
  };
};
Coceso.ViewModels.Unit.prototype = Object.create(Coceso.ViewModels.ViewModelSingle.prototype, /** @lends Coceso.ViewModels.Unit.prototype */ {
  /**
   * @see Coceso.ViewModels.ViewModel#dataType
   * @override
   */
  dataType: {value: "units"},
  /**
   * @see Coceso.ViewModels.ViewModel#dataList
   * @override
   */
  dataList: {value: "unitlist"},
  /**
   * @see Coceso.ViewModels.ViewModelSingle#model
   * @override
   */
  model: {value: Coceso.Models.Unit},
  /**
   * @see Coceso.ViewModels.ViewModel#saveUrl
   * @override
   */
  saveUrl: {value: "unit/update.json"},
  /**
   * @see Coceso.ViewModels.ViewModel#mappingOptions
   * @override
   */
  mappingOptions: {
    value: {
      ignore: ["concern"],
      keepChanges: {
        info: true
      },
      incidents: {
        create: function(options) {
          if (!options.parent.getOption("assigned")) {
            return options.data;
          }
          return new Coceso.ViewModels.Incidents({incidentlist: []}, options.parent.getOption("children", {children: {assigned: false}}));
        },
        update: function(options) {
          if (!options.parent.getOption("assigned")) {
            return options.target;
          }
          var incidents = [], i;
          for (i in options.data) {
            incidents.push({id: parseInt(i), taskState: options.data[i]});
          }

          ko.utils.arrayForEach(options.target.incidentlist, function(incident) {
            if ((incident.taskState.orig() === null) && (typeof options.data[incident.id()] === "undefined")) {
              incidents.push({id: incident.id()});
            }
          });

          options.target.setData({incidentlist: incidents});
          return options.target;
        }
      }
    }
  },
  /**
   * Data manipulation before saving
   *
   * @function
   * @param {Object} data The data to save
   * @return {Object} The manipulated data
   */
  beforeSave: {
    value: function(data) {
      delete data.call;
      delete data.ani;
      delete data.withDoc;
      delete data.portable;
      delete data.transportVehicle;
      delete data.crew;
      delete data.position.id;
      delete data.home;

      return data;
    }
  },
  /**
   * Set unit state to "AD"
   *
   * @function
   * @return {void}
   */
  setAD: {
    value: function() {
      if (!this.isAD() && this.id()) {
        Coceso.Ajax.save(ko.toJSON({id: this.id(), state: Coceso.Constants.Unit.state.ad}), "unit/update.json");
      }
    }
  },
  /**
   * Set unit state to "EB"
   *
   * @function
   * @return {void}
   */
  setEB: {
    value: function() {
      if (!this.isEB() && this.id()) {
        Coceso.Ajax.save(ko.toJSON({id: this.id(), state: Coceso.Constants.Unit.state.eb}), "unit/update.json");
      }
    }
  },
  /**
   * Set unit state to "NEB"
   *
   * @function
   * @return {void}
   */
  setNEB: {
    value: function() {
      if (!this.isNEB() && this.id()) {
        Coceso.Ajax.save(ko.toJSON({id: this.id(), state: Coceso.Constants.Unit.state.neb}), "unit/update.json");
      }
    }
  },
  /**
   * Send unit home
   *
   * @function
   * @return {void}
   */
  sendHome: {
    value: function() {
      if (this.id()) {
        Coceso.Ajax.save({id: this.id()}, "unit/sendHome.json");
      }
    }
  },
  /**
   * Send unit home
   *
   * @function
   * @return {void}
   */
  standby: {
    value: function() {
      if (this.id()) {
        Coceso.Ajax.save({id: this.id()}, "unit/standby.json");
      }
    }
  },
  /**
   * Send unit home
   *
   * @function
   * @return {void}
   */
  holdPosition: {
    value: function() {
      if (this.id()) {
        Coceso.Ajax.save({id: this.id()}, "unit/holdPosition.json");
      }
    }
  }
});

/**
 * List of Logs
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModelList
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.Logs = function(data, options) {
  var self = this;

  /**
   * List of Logs
   *
   * @function
   * @type ko.observableArray
   * @return {Array}
   */
  this.loglist = ko.observableArray();
//options.assigned = false;
  var start = Date.now();
  Coceso.ViewModels.ViewModelList.call(this, data, options);
  var end = Date.now();

  console.log(end - start);

  /**
   * Load the specified data
   *
   * @param {String} url The URL to load from
   * @param {int} interval The interval to reload. 0 or false for no autoload.
   * @return {void}
   */
  this.load = function(url, interval) {
    $.ajax({
      dataType: "json",
      url: Coceso.Conf.jsonBase + url,
      ifModified: true,
      success: function(data, status) {
        if (status !== "notmodified") {
          self.setData({loglist: data});
        }
      },
      complete: function() {
        if (interval) {
          window.setTimeout(function() {
            self.load(url, interval);
          }, interval);
        }
      }
    });
  };

  if (this.getOption("initial")) {
    this.load(this.getOption("url", "log/getAll"), this.getOption("autoload") ? Coceso.Conf.interval : false);
  }

};
Coceso.ViewModels.Logs.prototype = Object.create(Coceso.ViewModels.ViewModelList.prototype, /** @lends Coceso.ViewModels.Logs.prototype */ {
  /**
   * @see Coceso.ViewModels.ViewModel#mappingOptions
   * @override
   */
  mappingOptions: {
    value: {
      loglist: {
        key: function(data) {
          return ko.utils.unwrapObservable(data.id);
        },
        create: function(options) {
          return new Coceso.ViewModels.Log(options.data, options.parent.getOption("children", {}));
        }
      }
    }
  }
});

/**
 * Single log entry
 *
 * @constructor
 * @extends Coceso.ViewModels.ViewModelSingle
 * @param {Object} data
 * @param {Object} options
 */
Coceso.ViewModels.Log = function(data, options) {


  options = $.extend({
    children: {
      initial: false,
      reload: false,
      assigned: false,
      writeable: false
    }
  }, options);

  Coceso.ViewModels.ViewModelSingle.call(this, data, options);

  /**
   * Convert Timestamp
   *
   * @function
   * @type ko.computed
   * @return {string}
   */
  this.time = ko.computed(function() {
    var time = new Date(this.timestamp());
    return time.toLocaleString();
  }, this);
};
Coceso.ViewModels.Log.prototype = Object.create(Coceso.ViewModels.ViewModelSingle.prototype, /** @lends Coceso.ViewModels.Log.prototype */ {
  /**
   * @see Coceso.ViewModels.ViewModel#mappingOptions
   * @override
   */
  mappingOptions: {
    value: {
      ignore: ["concern"],
      incident: {
        create: function(options) {
          if (!options.parent.getOption("assigned")) {
            return options.data;
          }

          return new Coceso.ViewModels.Incident(options.data, options.parent.getOption("children", {}));
        }
      },
      unit: {
        create: function(options) {
          if (!options.parent.getOption("assigned")) {
            return options.data;
          }

          return new Coceso.ViewModels.Unit(options.data, options.parent.getOption("children", {}));
        }
      },
      json: {
        create: function(options) {
          var data = JSON.parse(options.data);
          //var data = null;
          if (!options.parent.getOption("assigned")) {
            return data;
          }

          if (!data) {
            data = [null, null];
          }

          return {
            unit: new Coceso.ViewModels.Unit(data[0], options.parent.getOption("children", {})),
            incident: new Coceso.ViewModels.Incident(data[1], options.parent.getOption("children", {}))
          };
        }
      }
    }
  }
});

/**
 * Debug viewmodel (contains errors)
 *
 * @returns {undefined}
 */
Coceso.UI.Debug = new function() {
  var self = this;

  this.errors = ko.observableArray();

  this.filtered = this.errors.extend({
    filtered: {
      sort: function(a, b) {
        return (b.timestamp - a.timestamp);
      }
    }
  });

  this.pushHttpError = function(jqXHR, url, data) {
    var time = new Date();
    self.errors.push({
      timestamp: time.getTime(),
      time: time.toLocaleString(),
      type: "HTTP-Error",
      status: jqXHR.status,
      message: jqXHR.statusText,
      url: url,
      data: data
    });
  };
};



