import _classCallCheck from '@babel/runtime/helpers/classCallCheck';
import _createClass from '@babel/runtime/helpers/createClass';
import _inherits from '@babel/runtime/helpers/inherits';
import _possibleConstructorReturn from '@babel/runtime/helpers/possibleConstructorReturn';
import _getPrototypeOf from '@babel/runtime/helpers/getPrototypeOf';
import { template, Events, $, Styler, UICorePlugin } from '@clappr/core';
import { Promise as Promise$1 } from 'es6-promise-polyfill';

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

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

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

    _this._onThumbsLoaded = new Promise$1(function (resolve) {
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
      return template(pluginHtml);
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
      if (Events.CORE_ACTIVE_CONTAINER_CHANGED) {
        this.listenTo(this.core, Events.CORE_ACTIVE_CONTAINER_CHANGED, this.rebindEvents);
      }

      this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSEMOVE_SEEKBAR, this._onMouseMove);
      this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSELEAVE_SEEKBAR, this._onMouseLeave);
      this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_RENDERED, this._init);
      this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED, this._onMediaControlContainerChanged);
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
        this.stopListening(this._oldContainer, Events.CONTAINER_TIMEUPDATE, this._renderPlugin);
      }

      this._oldContainer = this.core.mediaControl.container;
      this.listenTo(this.core.mediaControl.container, Events.CONTAINER_TIMEUPDATE, this._renderPlugin);
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
        return Promise$1.all(promises).then(function () {
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

        return Promise$1.resolve(foundAll);
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
      return Promise$1.all(promises);
    }
  }, {
    key: "_addThumbFromSrc",
    value: function _addThumbFromSrc(thumbSrc) {
      var _this5 = this;

      return new Promise$1(function (resolve, reject) {
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
      var $img = $("<img />").addClass("thumbnail-img").attr("src", thumb.url); // the container will contain the image positioned so that the correct sprite
      // is visible

      var $container = $("<div />").addClass("thumbnail-container");
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
      this.$el.append(Styler.getStyleFor(css_248z)); // cache dom references

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
}(UICorePlugin);

export default ScrubThumbnailsPlugin;
