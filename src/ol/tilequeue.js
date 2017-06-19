goog.provide('ol.TilePriorityFunction');
goog.provide('ol.TileQueue');

goog.require('goog.asserts');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.Coordinate');
goog.require('ol.TileState');
goog.require('ol.structs.PriorityQueue');


/**
 * @typedef {function(ol.Tile, string, ol.Coordinate, number): number}
 */
ol.TilePriorityFunction;


/**
 * @constructor
 * @extends {ol.structs.PriorityQueue.<Array>}
 * @param {ol.TilePriorityFunction} tilePriorityFunction
 *     Tile priority function.
 * @param {function(): ?} tileChangeCallback
 *     Function called on each tile change event.
 * @struct
 */
ol.TileQueue = function(tilePriorityFunction, tileChangeCallback) {

  goog.base(
      this,
      /**
       * @param {Array} element Element.
       * @return {number} Priority.
       */
      function(element) {
        return tilePriorityFunction.apply(null, element);
      },
      /**
       * @param {Array} element Element.
       * @return {string} Key.
       */
      function(element) {
        return /** @type {ol.Tile} */ (element[0]).getKey();
      });

  /**
   * @private
   * @type {function(): ?}
   */
  this.tileChangeCallback_ = tileChangeCallback;

  /**
   * @private
   * @type {number}
   */
  this.tilesLoading_ = 0;

  /**
   * @private
   * @type {!Object.<string,boolean>}
   */
  this.tilesLoadingKeys_ = {};

};
goog.inherits(ol.TileQueue, ol.structs.PriorityQueue);


/**
 * @inheritDoc
 */
ol.TileQueue.prototype.enqueue = function(element) {
  var added = goog.base(this, 'enqueue', element);
  if (added) {
    var tile = element[0];
    ol.events.listen(tile, ol.events.EventType.CHANGE,
        this.handleTileChange, this);
  }
  return added;
};


/**
 * @return {number} Number of tiles loading.
 */
ol.TileQueue.prototype.getTilesLoading = function() {
  return this.tilesLoading_;
};


/**
 * @param {ol.events.Event} event Event.
 * @protected
 */
ol.TileQueue.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  var state = tile.getState();
  if (state === ol.TileState.LOADED || state === ol.TileState.ERROR ||
      state === ol.TileState.EMPTY || state === ol.TileState.ABORT) {
    ol.events.unlisten(tile, ol.events.EventType.CHANGE,
        this.handleTileChange, this);
    var tileKey = tile.getKey();
    if (tileKey in this.tilesLoadingKeys_) {
      delete this.tilesLoadingKeys_[tileKey];
      --this.tilesLoading_;
    }
    this.tileChangeCallback_();
  }
  goog.asserts.assert(Object.keys(this.tilesLoadingKeys_).length === this.tilesLoading_);
};


/**
 * @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
 * @param {number} maxNewLoads Maximum number of new tiles to load.
 */
ol.TileQueue.prototype.loadMoreTiles = function(maxTotalLoading, maxNewLoads) {
  var newLoads = 0;
  var abortedTiles = false;
  var state, tile, tileKey;
  while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads &&
         this.getCount() > 0) {
    tile = /** @type {ol.Tile} */ (this.dequeue()[0]);
    tileKey = tile.getKey();
    state = tile.getState();
    if (state === ol.TileState.ABORT) {
      abortedTiles = true;
    } else if (state === ol.TileState.IDLE && !(tileKey in this.tilesLoadingKeys_)) {
      this.tilesLoadingKeys_[tileKey] = true;
      ++this.tilesLoading_;
      ++newLoads;
      tile.load();
    }
    goog.asserts.assert(Object.keys(this.tilesLoadingKeys_).length === this.tilesLoading_);
  }
  if (newLoads === 0 && abortedTiles) {
    // Do not stop the render loop when all wanted tiles were aborted due to
    // a small, saturated tile cache.
    this.tileChangeCallback_();
  }
};
