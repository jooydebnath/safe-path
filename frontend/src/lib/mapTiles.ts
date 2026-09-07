// Shared basemap tile source for every Leaflet map in the app (MapView,
// RouteMap). CARTO's free, keyless Voyager tiles are used instead of raw
// OpenStreetMap tiles — same underlying OSM data, but a cleaner, more
// Google-Maps-like color palette and label density. No API key required;
// CARTO attribution is required alongside the OSM one.
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
export const TILE_SUBDOMAINS = ["a", "b", "c", "d"];
