goog.provide('ol.source.ImageCanvas');

goog.require('ol.ImageCanvas');
goog.require('ol.extent');
goog.require('ol.source.Image');


/**
 * A function returning the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link ol.Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link ol.Size} the image size, and
 * {@link ol.proj.Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link ol.source.ImageCanvas}.
 *
 * @typedef {function(this:ol.source.ImageCanvas, ol.Extent, number,
 *     number, ol.Size, ol.proj.Projection): HTMLCanvasElement}
 * @api
 */
ol.CanvasFunctionType;


/**
 * @classdesc
 * Base class for image sources where a canvas element is the image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageCanvasOptions} options Constructor options.
 * @api
 */
ol.source.ImageCanvas = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection,
    resolutions: options.resolutions,
    state: options.state
  });

  /**
   * @private
   * @type {ol.CanvasFunctionType}
   */
  this.canvasFunction_ = options.canvasFunction;

  /**
   * @private
   * @type {ol.ImageCanvas}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = options.ratio !== undefined ?
      options.ratio : 1.5;

};
goog.inherits(ol.source.ImageCanvas, ol.source.Image);


/**
 * @inheritDoc
 */
ol.source.ImageCanvas.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  resolution = this.findNearestResolution(resolution);

  var canvas = this.canvas_;
  if (canvas &&
      this.renderedRevision_ == this.getRevision() &&
      canvas.getResolution() == resolution &&
      canvas.getPixelRatio() == pixelRatio &&
      ol.extent.containsExtent(canvas.getExtent(), extent)) {
    return canvas;
  }

  extent = extent.slice();
  ol.extent.scaleFromCenter(extent, this.ratio_);
  var width = ol.extent.getWidth(extent) / resolution;
  var height = ol.extent.getHeight(extent) / resolution;
  var size = [width * pixelRatio, height * pixelRatio];

  var canvasElement = this.canvasFunction_(
      extent, resolution, pixelRatio, size, projection);
  if (canvasElement) {
    canvas = new ol.ImageCanvas(extent, resolution, pixelRatio,
        this.getAttributions(), canvasElement);
  }
  this.canvas_ = canvas;
  this.renderedRevision_ = this.getRevision();

  return canvas;
};
