/**
 * إصلاح TypeScript Types - استبدال any بـ types صحيحة
 * يناير 2026
 */

// ============================================
// Category Types
// ============================================

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  description_ar?: string;
  icon?: string;
  image_url?: string;
  parent_id?: string | null;
  display_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

// ============================================
// QR Code Scanner Types
// ============================================

export interface QrCodeResult {
  decodedText: string;
  result: {
    text: string;
    format: string;
  };
}

export interface QrCodeSuccessCallback {
  (decodedText: string, result: QrCodeResult): void;
}

export interface QrCodeErrorCallback {
  (errorMessage: string, error: Error): void;
}

export interface Html5QrcodeConfig {
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
}

export interface Html5Qrcode {
  start(
    cameraIdOrConfig: string | MediaTrackConstraints,
    config: Html5QrcodeConfig | undefined,
    qrCodeSuccessCallback: QrCodeSuccessCallback,
    qrCodeErrorCallback?: QrCodeErrorCallback
  ): Promise<void>;
  stop(): Promise<void>;
  clear(): Promise<void>;
  getState(): number;
}

// ============================================
// Leaflet Routing Machine Types
// ============================================

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Waypoint {
  latLng: LatLng;
  name?: string;
}

export interface RoutingControlOptions {
  waypoints: Waypoint[];
  routeWhileDragging?: boolean;
  show?: boolean;
  addWaypoints?: boolean;
  draggableWaypoints?: boolean;
  fitSelectedRoutes?: boolean;
  showAlternatives?: boolean;
  router?: IRouter;
  plan?: RoutingPlan;
  lineOptions?: {
    styles?: Array<{ color: string; opacity: number; weight: number }>;
    extendToWaypoints?: boolean;
    missingRouteTolerance?: number;
  };
  geocoder?: IGeocoder;
}

export interface IRouter {
  route(
    waypoints: Waypoint[],
    callback: (error: Error | null, routes: IRoute[]) => void,
    context?: unknown,
    options?: unknown
  ): void;
}

export interface IGeocoder {
  geocode(
    query: string,
    callback: (results: GeocodingResult[]) => void,
    context?: unknown
  ): void;
}

export interface GeocodingResult {
  name: string;
  center: LatLng;
  bbox?: [number, number, number, number];
}

export interface IRoute {
  name?: string;
  coordinates: LatLng[];
  instructions: RouteInstruction[];
  summary: RouteSummary;
  inputWaypoints: Waypoint[];
  waypoints: Waypoint[];
}

export interface RouteInstruction {
  type: string;
  text: string;
  distance: number;
  time: number;
  direction?: string;
  exit?: number;
}

export interface RouteSummary {
  totalDistance: number;
  totalTime: number;
}

export interface RoutingPlan {
  getWaypoints(): Waypoint[];
  setWaypoints(waypoints: Waypoint[]): void;
  spliceWaypoints(index: number, count: number, ...waypoints: Waypoint[]): void;
}

export interface RoutingControl {
  addTo(map: L.Map): this;
  remove(): this;
  getWaypoints(): Waypoint[];
  setWaypoints(waypoints: Waypoint[]): this;
  getPlan(): RoutingPlan;
  getRouter(): IRouter;
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// ============================================
// Form Types
// ============================================

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================
// Event Handler Types
// ============================================

export type ChangeHandler<T = HTMLInputElement> = (
  e: React.ChangeEvent<T>
) => void;

export type SubmitHandler<T = HTMLFormElement> = (
  e: React.FormEvent<T>
) => void | Promise<void>;

export type ClickHandler<T = HTMLButtonElement> = (
  e: React.MouseEvent<T>
) => void | Promise<void>;

// ============================================
// Component Props Types
// ============================================

export interface WithChildren {
  children: React.ReactNode;
}

export interface WithClassName {
  className?: string;
}

export interface WithOptionalChildren {
  children?: React.ReactNode;
}

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Awaited<T> = T extends Promise<infer U> ? U : T;

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================
// Search/Filter Types
// ============================================

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}
