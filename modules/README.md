# CommonJS-friendly set of OpenLayers modules

**Work in progress, not yet available.**

This package will contain OpenLayers modules, as outlined in https://github.com/openlayers/ol3/issues/5679. To get the OpenLayers modules set, simply

```
$ npm install --save ol
```

Once installed, it will allow to write OpenLayers applications using code similar to this:

```js
var OLMap = require('ol/Map');
var View = require('ol/View');
var TileLayer = require('ol/layer/Tile');
var osm = new require('ol.source.OSM')();

var map = new OLMap({
  target: 'map',
  layers: [new TileLayer({
    source: osm
  })],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
```
