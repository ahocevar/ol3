goog.provide('ol.interaction.Lock');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.Pixel');
goog.require('ol.interaction.Interaction');
goog.require('ol.render.EventType');



/**
 * @classdesc
 * Interaction for emulating pointer down or drag events on map panning.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 */
ol.interaction.Lock = function() {

  goog.base(this);

  /**
   * @type {goog.events.BrowserEvent}
   * @private
   */
  this.lockEvent_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.pointerLocked_ = false;

};
goog.inherits(ol.interaction.Lock, ol.interaction.Pointer);


/**
 * @inheritDoc
 */
ol.interaction.Lock.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (mapBrowserEvent === this.lockEvent_ ||
      !(mapBrowserEvent instanceof ol.MapBrowserPointerEvent)) {
    return true;
  }
  var stopEvent = false;
  if (goog.isNull(this.lockEvent_) &&
      mapBrowserEvent.type == ol.MapBrowserEvent.EventType.POINTERDOWN) {
    this.lockEvent_ = mapBrowserEvent;
    this.setPointerLocked(true);
  } else if (!goog.isNull(this.lockEvent_) &&
      mapBrowserEvent.type != ol.MapBrowserEvent.EventType.POINTERDRAG) {
    stopEvent = true;
  }
  return !stopEvent;
};


/**
 * @inheritDoc
 */
ol.interaction.Lock.prototype.setMap = function(map) {
  if (goog.isNull(map)) {
    // removing from a map, clean up
    this.setPointerLocked(false);
  }
  goog.base(this, 'setMap', map);
};


/**
 * Locks the next pointer to its pixel position on the viewport to enable
 * precise pointer positioning by moving the map rather than the pointer.
 * @param {boolean} locked True to lock the next pointer, false to release it
 *     and make its current position the final pointer coordinate.
 * @todo api
 */
ol.interaction.Lock.prototype.setPointerLocked = function(locked) {
  if (locked == this.pointerLocked_) {
    return;
  }
  var map = this.getMap();
  if (map) {
    this.pointerLocked_ = locked;
    if (locked) {
      goog.events.listen(map, ol.render.EventType.PRECOMPOSE,
          this.updatePointer_, false, this);
    } else {
      var lockEvent = this.lockEvent_;
      if (!goog.isNull(lockEvent)) {
        lockEvent.type = ol.MapBrowserEvent.EventType.POINTERUP;
        this.lockEvent_ = null;
        this.handlingDownUpSequence = true;
        this.handleMapBrowserEvent(lockEvent);
      }
      goog.events.unlisten(map, ol.render.EventType.PRECOMPOSE,
        this.updatePointer_, false, this);
    }
  }
};


/**
 * @param {ol.render.Event} event Event.
 * @private
 */
ol.interaction.Lock.prototype.updatePointer_ = function(renderEvent) {
  var lockEvent = this.lockEvent_;
  var map = this.getMap();
  if (!goog.isNull(lockEvent) && !goog.isNull(map)) {
    if (!ol.coordinate.equals(renderEvent.frameState.view2DState.center,
        this.lockEvent_.frameState.view2DState.center)) {
      this.lockEvent_ = new ol.MapBrowserEvent(
          ol.MapBrowserEvent.EventType.POINTERMOVE, map, lockEvent.browserEvent,
          renderEvent.frameState);
      map.handleMapBrowserEvent(this.lockEvent_);
    }
  }
};
