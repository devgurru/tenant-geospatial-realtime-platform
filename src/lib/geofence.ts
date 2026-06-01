/**
 * Hardcoded geofence: rectangle around downtown San Francisco (WGS84).
 * WKT order: longitude latitude per PostGIS convention.
 */
export const GEOFENCE_WKT =
  "POLYGON((-122.4194 37.7749, -122.4094 37.7749, -122.4094 37.7849, -122.4194 37.7849, -122.4194 37.7749))";

/** Known point inside the polygon (for README / manual testing). */
export const SAMPLE_POINT_INSIDE = { lat: 37.7799, lng: -122.4144 };

/** Known point outside the polygon. */
export const SAMPLE_POINT_OUTSIDE = { lat: 37.8049, lng: -122.2711 };
