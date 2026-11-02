import type {Map as MlMap} from 'maplibre-gl';
// Optional satellite imagery (Esri World Imagery, keyless) placed under the
// style's labels so street/area names stay readable. Off by default.
const SRC='satellite',LAYER='satellite-imagery';
export function setSatellite(map:MlMap,on:boolean){
 if(on&&!map.getSource(SRC)){
  map.addSource(SRC,{type:'raster',tileSize:256,maxzoom:19,attribution:'Imagery © Esri, Maxar, Earthstar Geographics',
   tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']});
  const firstLabel=map.getStyle().layers.find(l=>l.type==='symbol')?.id;
  map.addLayer({id:LAYER,type:'raster',source:SRC},firstLabel);
 }
 if(map.getLayer(LAYER))map.setLayoutProperty(LAYER,'visibility',on?'visible':'none');
 // Keep the approximate-area outline readable on imagery.
 if(map.getLayer('area-line'))map.setPaintProperty('area-line','line-color',on?'#ffffff':'#a18860');
}
