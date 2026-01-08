/**
 * Geographic Types for PostGIS and GeoJSON
 * دعم أنواع البيانات الجغرافية لـ PostGIS و GeoJSON
 */

/**
 * GeoJSON Point - نقطة جغرافية
 * Format: { type: 'Point', coordinates: [longitude, latitude] }
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * GeoJSON LineString - خط جغرافي
 */
export interface GeoLineString {
  type: 'LineString';
  coordinates: Array<[number, number]>;
}

/**
 * GeoJSON Polygon - مضلع جغرافي
 */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: Array<Array<[number, number]>>;
}

/**
 * Generic GeoJSON Location
 * نوع عام للبيانات الجغرافية
 */
export interface GeoLocation {
  type: string;
  coordinates: number[] | number[][];
}

/**
 * PostGIS Geography Type
 * النوع المستخدم في قاعدة البيانات PostGIS
 */
export type PostGISGeography = GeoPoint | GeoLineString | GeoPolygon | GeoLocation | null;

/**
 * Simplified coordinates for UI/Forms
 * إحداثيات مبسطة للواجهات والنماذج
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Location with both formats
 * موقع يحتوي على كلا الصيغتين
 */
export interface LocationData {
  lat: number;
  lng: number;
  location?: PostGISGeography;
}

/**
 * Convert simple coordinates to GeoJSON Point
 * تحويل الإحداثيات البسيطة إلى نقطة GeoJSON
 */
export function coordinatesToGeoPoint(lat: number, lng: number): GeoPoint {
  return {
    type: 'Point',
    coordinates: [lng, lat], // PostGIS uses [longitude, latitude]
  };
}

/**
 * Extract lat/lng from GeoPoint
 * استخراج الإحداثيات من نقطة GeoJSON
 */
export function geoPointToCoordinates(point: GeoPoint): Coordinates {
  return {
    lng: point.coordinates[0],
    lat: point.coordinates[1],
  };
}

/**
 * Type guard to check if value is GeoPoint
 * التحقق من أن القيمة هي نقطة GeoJSON
 */
export function isGeoPoint(value: unknown): value is GeoPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'coordinates' in value &&
    (value as GeoPoint).type === 'Point' &&
    Array.isArray((value as GeoPoint).coordinates) &&
    (value as GeoPoint).coordinates.length === 2
  );
}
