// Leaflet Type Definitions Extension
declare module 'leaflet' {
  export * from '@types/leaflet';
  
  namespace Icon {
    interface Default {
      _getIconUrl?: string;
    }
  }
}
