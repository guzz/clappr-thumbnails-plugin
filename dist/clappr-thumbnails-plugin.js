(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@clappr/core')) :
  typeof define === 'function' && define.amd ? define(['@clappr/core'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ScrubThumbnailsPlugin = factory(global.Clappr));
}(this, (function (core) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  var promise = createCommonjsModule(function (module, exports) {
  (function(global){

  //
  // Check for native Promise and it has correct interface
  //

  var NativePromise = global['Promise'];
  var nativePromiseSupported =
    NativePromise &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    'resolve' in NativePromise &&
    'reject' in NativePromise &&
    'all' in NativePromise &&
    'race' in NativePromise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function(){
      var resolve;
      new NativePromise(function(r){ resolve = r; });
      return typeof resolve === 'function';
    })();


  //
  // export if necessary
  //

  if (exports)
  {
    // node.js
    exports.Promise = nativePromiseSupported ? NativePromise : Promise;
    exports.Polyfill = Promise;
  }
  else
  {
    // AMD
    {
      // in browser add to global
      if (!nativePromiseSupported)
        global['Promise'] = Promise;
    }
  }


  //
  // Polyfill
  //

  var PENDING = 'pending';
  var SEALED = 'sealed';
  var FULFILLED = 'fulfilled';
  var REJECTED = 'rejected';
  var NOOP = function(){};

  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  // async calls
  var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
  var asyncQueue = [];
  var asyncTimer;

  function asyncFlush(){
    // run promise callbacks
    for (var i = 0; i < asyncQueue.length; i++)
      asyncQueue[i][0](asyncQueue[i][1]);

    // reset async asyncQueue
    asyncQueue = [];
    asyncTimer = false;
  }

  function asyncCall(callback, arg){
    asyncQueue.push([callback, arg]);

    if (!asyncTimer)
    {
      asyncTimer = true;
      asyncSetTimer(asyncFlush, 0);
    }
  }


  function invokeResolver(resolver, promise) {
    function resolvePromise(value) {
      resolve(promise, value);
    }

    function rejectPromise(reason) {
      reject(promise, reason);
    }

    try {
      resolver(resolvePromise, rejectPromise);
    } catch(e) {
      rejectPromise(e);
    }
  }

  function invokeCallback(subscriber){
    var owner = subscriber.owner;
    var settled = owner.state_;
    var value = owner.data_;  
    var callback = subscriber[settled];
    var promise = subscriber.then;

    if (typeof callback === 'function')
    {
      settled = FULFILLED;
      try {
        value = callback(value);
      } catch(e) {
        reject(promise, e);
      }
    }

    if (!handleThenable(promise, value))
    {
      if (settled === FULFILLED)
        resolve(promise, value);

      if (settled === REJECTED)
        reject(promise, value);
    }
  }

  function handleThenable(promise, value) {
    var resolved;

    try {
      if (promise === value)
        throw new TypeError('A promises callback cannot return that same promise.');

      if (value && (typeof value === 'function' || typeof value === 'object'))
      {
        var then = value.then;  // then should be retrived only once

        if (typeof then === 'function')
        {
          then.call(value, function(val){
            if (!resolved)
            {
              resolved = true;

              if (value !== val)
                resolve(promise, val);
              else
                fulfill(promise, val);
            }
          }, function(reason){
            if (!resolved)
            {
              resolved = true;

              reject(promise, reason);
            }
          });

          return true;
        }
      }
    } catch (e) {
      if (!resolved)
        reject(promise, e);

      return true;
    }

    return false;
  }

  function resolve(promise, value){
    if (promise === value || !handleThenable(promise, value))
      fulfill(promise, value);
  }

  function fulfill(promise, value){
    if (promise.state_ === PENDING)
    {
      promise.state_ = SEALED;
      promise.data_ = value;

      asyncCall(publishFulfillment, promise);
    }
  }

  function reject(promise, reason){
    if (promise.state_ === PENDING)
    {
      promise.state_ = SEALED;
      promise.data_ = reason;

      asyncCall(publishRejection, promise);
    }
  }

  function publish(promise) {
    var callbacks = promise.then_;
    promise.then_ = undefined;

    for (var i = 0; i < callbacks.length; i++) {
      invokeCallback(callbacks[i]);
    }
  }

  function publishFulfillment(promise){
    promise.state_ = FULFILLED;
    publish(promise);
  }

  function publishRejection(promise){
    promise.state_ = REJECTED;
    publish(promise);
  }

  /**
  * @class
  */
  function Promise(resolver){
    if (typeof resolver !== 'function')
      throw new TypeError('Promise constructor takes a function argument');

    if (this instanceof Promise === false)
      throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');

    this.then_ = [];

    invokeResolver(resolver, this);
  }

  Promise.prototype = {
    constructor: Promise,

    state_: PENDING,
    then_: null,
    data_: undefined,

    then: function(onFulfillment, onRejection){
      var subscriber = {
        owner: this,
        then: new this.constructor(NOOP),
        fulfilled: onFulfillment,
        rejected: onRejection
      };

      if (this.state_ === FULFILLED || this.state_ === REJECTED)
      {
        // already resolved, call callback async
        asyncCall(invokeCallback, subscriber);
      }
      else
      {
        // subscribe
        this.then_.push(subscriber);
      }

      return subscriber.then;
    },

    'catch': function(onRejection) {
      return this.then(null, onRejection);
    }
  };

  Promise.all = function(promises){
    var Class = this;

    if (!isArray(promises))
      throw new TypeError('You must pass an array to Promise.all().');

    return new Class(function(resolve, reject){
      var results = [];
      var remaining = 0;

      function resolver(index){
        remaining++;
        return function(value){
          results[index] = value;
          if (!--remaining)
            resolve(results);
        };
      }

      for (var i = 0, promise; i < promises.length; i++)
      {
        promise = promises[i];

        if (promise && typeof promise.then === 'function')
          promise.then(resolver(i), reject);
        else
          results[i] = promise;
      }

      if (!remaining)
        resolve(results);
    });
  };

  Promise.race = function(promises){
    var Class = this;

    if (!isArray(promises))
      throw new TypeError('You must pass an array to Promise.race().');

    return new Class(function(resolve, reject) {
      for (var i = 0, promise; i < promises.length; i++)
      {
        promise = promises[i];

        if (promise && typeof promise.then === 'function')
          promise.then(resolve, reject);
        else
          resolve(promise);
      }
    });
  };

  Promise.resolve = function(value){
    var Class = this;

    if (value && typeof value === 'object' && value.constructor === Class)
      return value;

    return new Class(function(resolve){
      resolve(value);
    });
  };

  Promise.reject = function(reason){
    var Class = this;

    return new Class(function(resolve, reject){
      reject(reason);
    });
  };

  })(typeof window != 'undefined' ? window : typeof commonjsGlobal != 'undefined' ? commonjsGlobal : typeof self != 'undefined' ? self : commonjsGlobal);
  });

  var pluginHtml = "<% if (backdropHeight) { %>\n<div class=\"backdrop\" style=\"height: <%= backdropHeight%>px;\">\n\t<div class=\"carousel\"></div>\n</div>\n<% }; %>\n<% if (spotlightHeight) { %>\n<div class=\"spotlight\" style=\"height: <%= spotlightHeight%>px;\"></div>\n<% }; %>\n";

  function styleInject(css, ref) {
    if ( ref === void 0 ) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css_248z = ".scrub-thumbnails {\n  position: absolute;\n  bottom: 55px;\n  width: 100%;\n  -webkit-transition: opacity 0.3s ease;\n  -moz-transition: opacity 0.3s ease;\n  -o-transition: opacity 0.3s ease;\n  transition: opacity 0.3s ease; }\n  .scrub-thumbnails.hidden {\n    opacity: 0; }\n  .scrub-thumbnails .thumbnail-container {\n    display: inline-block;\n    position: relative;\n    overflow: hidden;\n    background-color: #000000; }\n    .scrub-thumbnails .thumbnail-container .thumbnail-img {\n      position: absolute;\n      width: auto; }\n  .scrub-thumbnails .spotlight {\n    background-color: #000000;\n    overflow: hidden;\n    position: absolute;\n    bottom: 0;\n    left: 0;\n    border-color: #ffffff;\n    border-style: solid;\n    border-width: 2px; }\n    .scrub-thumbnails .spotlight img {\n      width: auto; }\n  .scrub-thumbnails .backdrop {\n    position: absolute;\n    left: 0;\n    bottom: 0;\n    right: 0;\n    background-color: #000000;\n    overflow: hidden; }\n    .scrub-thumbnails .backdrop .carousel {\n      position: absolute;\n      top: 0;\n      left: 0;\n      height: 100%;\n      white-space: nowrap; }\n      .scrub-thumbnails .backdrop .carousel img {\n        width: auto; }\n";
  styleInject(css_248z);

  var ScrubThumbnailsPlugin = /*#__PURE__*/function (_UICorePlugin) {
    _inherits(ScrubThumbnailsPlugin, _UICorePlugin);

    var _super = _createSuper(ScrubThumbnailsPlugin);

    // TODO check if seek enabled
    function ScrubThumbnailsPlugin(core) {
      var _this;

      _classCallCheck(this, ScrubThumbnailsPlugin);

      _this = _super.call(this, core);
      _this._thumbsLoaded = false;
      _this._show = false; // proportion into seek bar that the user is hovered over 0-1

      _this._hoverPosition = 0;
      _this._oldContainer = null; // each element is {x, y, w, h, imageW, imageH, url, time, duration, src}
      // one entry for each thumbnail

      _this._thumbs = [];
      _this._spotlightThumb = null; // a promise that will be resolved when thumbs have loaded

      _this._onThumbsLoaded = new promise.Promise(function (resolve) {
        _this._onThumbsLoadedResolve = resolve;
      });

      _this._buildThumbsFromOptions().then(function () {
        _this._thumbsLoaded = true;

        _this._onThumbsLoadedResolve();

        _this._init();
      })["catch"](function (err) {
        throw err;
      });

      return _this;
    }

    _createClass(ScrubThumbnailsPlugin, [{
      key: "name",
      get: function get() {
        return 'scrub-thumbnails';
      }
    }, {
      key: "attributes",
      get: function get() {
        return {
          'class': this.name
        };
      }
    }, {
      key: "template",
      get: function get() {
        return core.template(pluginHtml);
      }
      /* 
       * Helper to build the "thumbs" property for a sprite sheet.
       *
       * spriteSheetUrl- The url to the sprite sheet image
       * numThumbs- The number of thumbnails on the sprite sheet
       * thumbWidth- The width of each thumbnail.
       * thumbHeight- The height of each thumbnail.
       * numColumns- The number of columns in the sprite sheet.
       * timeInterval- The interval (in seconds) between the thumbnails.
       * startTime- The time (in seconds) that the first thumbnail represents. (defaults to 0)
       */

    }, {
      key: "bindEvents",
      value: function bindEvents() {
        // Clappr 0.3 support
        if (core.Events.CORE_ACTIVE_CONTAINER_CHANGED) {
          this.listenTo(this.core, core.Events.CORE_ACTIVE_CONTAINER_CHANGED, this.rebindEvents);
        }

        this.listenTo(this.core.mediaControl, core.Events.MEDIACONTROL_MOUSEMOVE_SEEKBAR, this._onMouseMove);
        this.listenTo(this.core.mediaControl, core.Events.MEDIACONTROL_MOUSELEAVE_SEEKBAR, this._onMouseLeave);
        this.listenTo(this.core.mediaControl, core.Events.MEDIACONTROL_RENDERED, this._init);
        this.listenTo(this.core.mediaControl, core.Events.MEDIACONTROL_CONTAINERCHANGED, this._onMediaControlContainerChanged);
      }
    }, {
      key: "rebindEvents",
      value: function rebindEvents() {
        this.stopListening();
        this.bindEvents();
      }
    }, {
      key: "_bindContainerEvents",
      value: function _bindContainerEvents() {
        if (this._oldContainer) {
          this.stopListening(this._oldContainer, core.Events.CONTAINER_TIMEUPDATE, this._renderPlugin);
        }

        this._oldContainer = this.core.mediaControl.container;
        this.listenTo(this.core.mediaControl.container, core.Events.CONTAINER_TIMEUPDATE, this._renderPlugin);
      }
    }, {
      key: "_onMediaControlContainerChanged",
      value: function _onMediaControlContainerChanged() {
        this._bindContainerEvents();
      } // thumbSrc may be an array to add multiple

    }, {
      key: "addThumbnail",
      value: function addThumbnail(thumbSrc) {
        var _this2 = this;

        var thumbSrcs = thumbSrc.constructor === Array ? thumbSrc : [thumbSrc];
        return this._onThumbsLoaded.then(function () {
          var promises = thumbSrcs.map(function (a) {
            return _this2._addThumbFromSrc(a).then(function (thumb) {
              if (_this2._getOptions().backdropHeight) {
                // append thumb to backdrop
                var index = _this2._thumbs.indexOf(thumb);

                var $img = _this2._buildImg(thumb, _this2._getOptions().backdropHeight); // Add thumbnail reference


                _this2._$backdropCarouselImgs.splice(index, 0, $img); // Add thumbnail to DOM


                if (_this2._$backdropCarouselImgs.length === 1) {
                  _this2._$carousel.append($img);
                } else if (index === 0) {
                  _this2._$backdropCarouselImgs[1].before($img);
                } else {
                  _this2._$backdropCarouselImgs[index - 1].after($img);
                }
              }
            });
          });
          return promise.Promise.all(promises).then(function () {
            if (promises.length > 0) {
              _this2._renderPlugin();
            }
          });
        });
      } // provide a reference to the thumb object you provided to remove it
      // thumbSrc may be an array to remove multiple

    }, {
      key: "removeThumbnail",
      value: function removeThumbnail(thumbSrc) {
        var _this3 = this;

        var thumbSrcs = thumbSrc.constructor === Array ? thumbSrc : [thumbSrc];
        return this._onThumbsLoaded.then(function () {
          var foundAll = true;
          var foundOne = false;
          thumbSrcs.forEach(function (a) {
            var found = _this3._thumbs.some(function (thumb, i) {
              if (thumb.src === a) {
                _this3._thumbs.splice(i, 1);

                if (_this3._getOptions().backdropHeight) {
                  // remove image from carousel
                  _this3._$backdropCarouselImgs[i].remove();

                  _this3._$backdropCarouselImgs.splice(i, 1);
                }

                return true;
              }

              return false;
            });

            if (!found) {
              foundAll = false;
            } else {
              foundOne = true;
            }
          });

          if (foundOne) {
            _this3._renderPlugin();
          }

          return promise.Promise.resolve(foundAll);
        });
      }
    }, {
      key: "_init",
      value: function _init() {
        if (!this._thumbsLoaded) {
          // _init() will be called when the thumbs are loaded,
          // and whenever the media control rendered event is fired as just before this the dom elements get wiped in IE (https://github.com/tjenkinson/clappr-thumbnails-plugin/issues/5)
          return;
        } // Init the backdropCarousel as array to keep reference of thumbnail images


        this._$backdropCarouselImgs = []; // create/recreate the dom elements for the plugin

        this._createElements();

        this._loadBackdrop();

        this._renderPlugin();
      }
    }, {
      key: "_getOptions",
      value: function _getOptions() {
        if (!("scrubThumbnails" in this.core.options)) {
          throw "'scrubThumbnails property missing from options object.";
        }

        return this.core.options.scrubThumbnails;
      }
    }, {
      key: "_appendElToMediaControl",
      value: function _appendElToMediaControl() {
        // insert after the background
        this.core.mediaControl.$el.find(".media-control-background").first().after(this.el);
      }
    }, {
      key: "_onMouseMove",
      value: function _onMouseMove(e) {
        this._calculateHoverPosition(e);

        this._show = true;

        this._renderPlugin();
      }
    }, {
      key: "_onMouseLeave",
      value: function _onMouseLeave() {
        this._show = false;

        this._renderPlugin();
      }
    }, {
      key: "_calculateHoverPosition",
      value: function _calculateHoverPosition(e) {
        var offset = e.pageX - this.core.mediaControl.$seekBarContainer.offset().left; // proportion into the seek bar that the mouse is hovered over 0-1

        this._hoverPosition = Math.min(1, Math.max(offset / this.core.mediaControl.$seekBarContainer.width(), 0));
      }
    }, {
      key: "_buildThumbsFromOptions",
      value: function _buildThumbsFromOptions() {
        var _this4 = this;

        var thumbs = this._getOptions().thumbs;

        var promises = thumbs.map(function (thumb) {
          return _this4._addThumbFromSrc(thumb);
        });
        return promise.Promise.all(promises);
      }
    }, {
      key: "_addThumbFromSrc",
      value: function _addThumbFromSrc(thumbSrc) {
        var _this5 = this;

        return new promise.Promise(function (resolve, reject) {
          var img = new Image();

          img.onload = function () {
            resolve(img);
          };

          img.onerror = reject;
          img.src = thumbSrc.url;
        }).then(function (img) {
          var startTime = thumbSrc.time; // determine the thumb index

          var index = null;

          _this5._thumbs.some(function (thumb, i) {
            if (startTime < thumb.time) {
              index = i;
              return true;
            }

            return false;
          });

          if (index === null) {
            index = _this5._thumbs.length;
          }

          var next = index < _this5._thumbs.length ? _this5._thumbs[index] : null;
          var prev = index > 0 ? _this5._thumbs[index - 1] : null;

          if (prev) {
            // update the duration of the previous thumbnail
            prev.duration = startTime - prev.time;
          } // the duration this thumb lasts for
          // if it is the last thumb then duration will be null


          var duration = next ? next.time - thumbSrc.time : null;
          var imageW = img.width;
          var imageH = img.height;
          var thumb = {
            imageW: imageW,
            // actual width of image
            imageH: imageH,
            // actual height of image
            x: thumbSrc.x || 0,
            // x coord in image of sprite
            y: thumbSrc.y || 0,
            // y coord in image of sprite
            w: thumbSrc.w || imageW,
            // width of sprite
            h: thumbSrc.h || imageH,
            // height of sprite
            url: thumbSrc.url,
            time: startTime,
            // time this thumb represents
            duration: duration,
            // how long (from time) this thumb represents
            src: thumbSrc
          };

          _this5._thumbs.splice(index, 0, thumb);

          return thumb;
        });
      } // builds a dom element which represents the thumbnail
      // scaled to the provided height

    }, {
      key: "_buildImg",
      value: function _buildImg(thumb, height) {
        var scaleFactor = height / thumb.h;
        var $img = core.$("<img />").addClass("thumbnail-img").attr("src", thumb.url); // the container will contain the image positioned so that the correct sprite
        // is visible

        var $container = core.$("<div />").addClass("thumbnail-container");
        $container.css("width", thumb.w * scaleFactor);
        $container.css("height", height);
        $img.css({
          height: thumb.imageH * scaleFactor,
          left: -1 * thumb.x * scaleFactor,
          top: -1 * thumb.y * scaleFactor
        });
        $container.append($img);
        return $container;
      }
    }, {
      key: "_loadBackdrop",
      value: function _loadBackdrop() {
        if (!this._getOptions().backdropHeight) {
          // disabled
          return;
        } // append each of the thumbnails to the backdrop carousel


        var $carousel = this._$carousel;

        for (var i = 0; i < this._thumbs.length; i++) {
          var $img = this._buildImg(this._thumbs[i], this._getOptions().backdropHeight); // Keep reference to thumbnail


          this._$backdropCarouselImgs.push($img); // Add thumbnail to DOM


          $carousel.append($img);
        }
      } // calculate how far along the carousel should currently be slid
      // depending on where the user is hovering on the progress bar

    }, {
      key: "_updateCarousel",
      value: function _updateCarousel() {
        if (!this._getOptions().backdropHeight) {
          // disabled
          return;
        }

        var hoverPosition = this._hoverPosition;
        var videoDuration = this.core.mediaControl.container.getDuration();
        var startTimeOffset = this.core.mediaControl.container.getStartTimeOffset(); // the time into the video at the current hover position

        var hoverTime = startTimeOffset + videoDuration * hoverPosition;

        var backdropWidth = this._$backdrop.width();

        var $carousel = this._$carousel;
        var carouselWidth = $carousel.width(); // slide the carousel so that the image on the carousel that is above where the person
        // is hovering maps to that position in time.
        // Thumbnails may not be distributed at even times along the video

        var thumbs = this._thumbs; // assuming that each thumbnail has the same width

        var thumbWidth = carouselWidth / thumbs.length; // determine which thumbnail applies to the current time

        var thumbIndex = this._getThumbIndexForTime(hoverTime);

        var thumb = thumbs[thumbIndex];
        var thumbDuration = thumb.duration;

        if (thumbDuration === null) {
          // the last thumbnail duration will be null as it can't be determined
          // e.g the duration of the video may increase over time (live stream)
          // so calculate the duration now so this last thumbnail lasts till the end
          thumbDuration = Math.max(videoDuration + startTimeOffset - thumb.time, 0);
        } // determine how far accross that thumbnail we are


        var timeIntoThumb = hoverTime - thumb.time;
        var positionInThumb = timeIntoThumb / thumbDuration;
        var xCoordInThumb = thumbWidth * positionInThumb; // now calculate the position along carousel that we want to be above the hover position

        var xCoordInCarousel = thumbIndex * thumbWidth + xCoordInThumb; // and finally the position of the carousel when the hover position is taken in to consideration

        var carouselXCoord = xCoordInCarousel - hoverPosition * backdropWidth;
        $carousel.css("left", -carouselXCoord);
        var maxOpacity = this._getOptions().backdropMaxOpacity || 0.6;
        var minOpacity = this._getOptions().backdropMinOpacity || 0.08; // now update the transparencies so that they fade in around the active one

        for (var i = 0; i < thumbs.length; i++) {
          var thumbXCoord = thumbWidth * i;
          var distance = thumbXCoord - xCoordInCarousel;

          if (distance < 0) {
            // adjust so that distance is always a measure away from
            // each side of the active thumbnail
            // at every point on the active thumbnail the distance should
            // be 0
            distance = Math.min(0, distance + thumbWidth);
          } // fade over the width of 2 thumbnails


          var opacity = Math.max(maxOpacity - Math.abs(distance) / (2 * thumbWidth), minOpacity);

          this._$backdropCarouselImgs[i].css("opacity", opacity);
        }
      }
    }, {
      key: "_updateSpotlightThumb",
      value: function _updateSpotlightThumb() {
        if (!this._getOptions().spotlightHeight) {
          // disabled
          return;
        }

        var hoverPosition = this._hoverPosition;
        var videoDuration = this.core.mediaControl.container.getDuration(); // the time into the video at the current hover position

        var startTimeOffset = this.core.mediaControl.container.getStartTimeOffset();
        var hoverTime = startTimeOffset + videoDuration * hoverPosition; // determine which thumbnail applies to the current time

        var thumbIndex = this._getThumbIndexForTime(hoverTime);

        var thumb = this._thumbs[thumbIndex];
        var $spotlight = this._$spotlight;

        if (this._spotlightThumb !== thumb) {
          // update thumbnail
          $spotlight.empty();
          $spotlight.append(this._buildImg(thumb, this._getOptions().spotlightHeight));
          this._spotlightThumb = thumb;
        }

        var elWidth = this.$el.width();
        var thumbWidth = $spotlight.width();
        var spotlightXPos = elWidth * hoverPosition - thumbWidth / 2; // adjust so the entire thumbnail is always visible

        spotlightXPos = Math.max(Math.min(spotlightXPos, elWidth - thumbWidth), 0);
        $spotlight.css("left", spotlightXPos);
      } // returns the thumbnail which represents a time in the video
      // or null if there is no thumbnail that can represent the time

    }, {
      key: "_getThumbIndexForTime",
      value: function _getThumbIndexForTime(time) {
        var thumbs = this._thumbs;

        for (var i = thumbs.length - 1; i >= 0; i--) {
          var thumb = thumbs[i];

          if (thumb.time <= time) {
            return i;
          }
        } // stretch the first thumbnail back to the start


        return 0;
      }
    }, {
      key: "_renderPlugin",
      value: function _renderPlugin() {
        if (!this._thumbsLoaded) {
          return;
        }

        if (this._show && this._thumbs.length > 0) {
          this.$el.removeClass("hidden");

          this._updateCarousel();

          this._updateSpotlightThumb();
        } else {
          this.$el.addClass("hidden");
        }
      }
    }, {
      key: "_createElements",
      value: function _createElements() {
        this.$el.html(this.template({
          'backdropHeight': this._getOptions().backdropHeight,
          'spotlightHeight': this._getOptions().spotlightHeight
        }));
        this.$el.append(core.Styler.getStyleFor(css_248z)); // cache dom references

        this._$spotlight = this.$el.find(".spotlight");
        this._$backdrop = this.$el.find(".backdrop");
        this._$carousel = this._$backdrop.find(".carousel");
        this.$el.addClass("hidden");

        this._appendElToMediaControl();
      }
    }], [{
      key: "buildSpriteConfig",
      value: function buildSpriteConfig(spriteSheetUrl, numThumbs, thumbWidth, thumbHeight, numColumns, timeInterval, startTime) {
        startTime = startTime || 0;
        var thumbs = [];

        for (var i = 0; i < numThumbs; i++) {
          thumbs.push({
            url: spriteSheetUrl,
            time: startTime + i * timeInterval,
            w: thumbWidth,
            h: thumbHeight,
            x: i % numColumns * thumbWidth,
            y: Math.floor(i / numColumns) * thumbHeight
          });
        }

        return thumbs;
      }
    }]);

    return ScrubThumbnailsPlugin;
  }(core.UICorePlugin);

  return ScrubThumbnailsPlugin;

})));
