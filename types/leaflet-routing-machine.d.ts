<<<<<<< HEAD
declare module 'leaflet-routing-machine' {
  import * as L from 'leaflet';

  namespace Routing {
    interface RoutingControlOptions extends L.ControlOptions {
      waypoints?: L.LatLng[];
      router?: any;
      plan?: any;
      geocoder?: any;
      fitSelectedRoutes?: boolean;
      lineOptions?: L.PolylineOptions;
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      altLineOptions?: L.PolylineOptions;
    }

    class Control extends L.Control {
      constructor(options?: RoutingControlOptions);
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
      spliceWaypoints(index: number, waypointsToRemove: number, ...waypoints: L.LatLng[]): L.LatLng[];
      getPlan(): any;
      getRouter(): any;
      route(): void;
    }

    function control(options?: RoutingControlOptions): Control;

    interface OSRMOptions {
      serviceUrl?: string;
      profile?: string;
      timeout?: number;
      routingOptions?: any;
    }

    function osrmv1(options?: OSRMOptions): any;
  }

  export = Routing;
}

declare module 'leaflet' {
  namespace Routing {
    interface RoutingControlOptions extends L.ControlOptions {
      waypoints?: L.LatLng[];
      router?: any;
      plan?: any;
      geocoder?: any;
      fitSelectedRoutes?: boolean;
      lineOptions?: L.PolylineOptions;
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      altLineOptions?: L.PolylineOptions;
    }

    class Control extends L.Control {
      constructor(options?: RoutingControlOptions);
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
      spliceWaypoints(index: number, waypointsToRemove: number, ...waypoints: L.LatLng[]): L.LatLng[];
      getPlan(): any;
      getRouter(): any;
      route(): void;
    }

    function control(options?: RoutingControlOptions): Control;

    interface OSRMOptions {
      serviceUrl?: string;
      profile?: string;
      timeout?: number;
      routingOptions?: any;
    }

    function osrmv1(options?: OSRMOptions): any;
  }

  interface PolylineDecoratorOptions {
    patterns?: any[];
  }

  function polylineDecorator(polyline: L.Polyline, options?: PolylineDecoratorOptions): L.LayerGroup;

  namespace Symbol {
    function arrowHead(options?: any): any;
  }
}
=======
declare module 'leaflet-routing-machine' {
  import * as L from 'leaflet';

  namespace Routing {
    interface RoutingControlOptions extends L.ControlOptions {
      waypoints?: L.LatLng[];
      router?: any;
      plan?: any;
      geocoder?: any;
      fitSelectedRoutes?: boolean;
      lineOptions?: L.PolylineOptions;
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      altLineOptions?: L.PolylineOptions;
    }

    class Control extends L.Control {
      constructor(options?: RoutingControlOptions);
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
      spliceWaypoints(index: number, waypointsToRemove: number, ...waypoints: L.LatLng[]): L.LatLng[];
      getPlan(): any;
      getRouter(): any;
      route(): void;
    }

    function control(options?: RoutingControlOptions): Control;

    interface OSRMOptions {
      serviceUrl?: string;
      profile?: string;
      timeout?: number;
      routingOptions?: any;
    }

    function osrmv1(options?: OSRMOptions): any;
  }

  export = Routing;
}

declare module 'leaflet' {
  namespace Routing {
    interface RoutingControlOptions extends L.ControlOptions {
      waypoints?: L.LatLng[];
      router?: any;
      plan?: any;
      geocoder?: any;
      fitSelectedRoutes?: boolean;
      lineOptions?: L.PolylineOptions;
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      altLineOptions?: L.PolylineOptions;
    }

    class Control extends L.Control {
      constructor(options?: RoutingControlOptions);
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
      spliceWaypoints(index: number, waypointsToRemove: number, ...waypoints: L.LatLng[]): L.LatLng[];
      getPlan(): any;
      getRouter(): any;
      route(): void;
    }

    function control(options?: RoutingControlOptions): Control;

    interface OSRMOptions {
      serviceUrl?: string;
      profile?: string;
      timeout?: number;
      routingOptions?: any;
    }

    function osrmv1(options?: OSRMOptions): any;
  }

  interface PolylineDecoratorOptions {
    patterns?: any[];
  }

  function polylineDecorator(polyline: L.Polyline, options?: PolylineDecoratorOptions): L.LayerGroup;

  namespace Symbol {
    function arrowHead(options?: any): any;
  }
}
>>>>>>> 59cb1431e448110cfe49ca35fb79aa53e9d8b18b
