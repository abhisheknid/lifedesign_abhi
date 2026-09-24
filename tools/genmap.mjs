import fs from 'fs';
import {feature} from 'topojson-client';
import {geoNaturalEarth1, geoMercator, geoPath} from 'd3-geo';
const w50 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const w110 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
const round = s => s.replace(/(\d+)\.\d+/g,'$1');
function view(topo, proj, W, H, bbox, highlight){
  const fc = feature(topo, topo.objects.countries);
  proj.fitExtent([[0,0],[W,H]], {type:'Feature',geometry:{type:'Polygon',coordinates:[[ [bbox[0],bbox[1]],[bbox[0],bbox[3]],[bbox[2],bbox[3]],[bbox[2],bbox[1]],[bbox[0],bbox[1]] ]]}});
  proj.clipExtent([[-5,-5],[W+5,H+5]]); const p = geoPath(proj);
  let land='', hi='';
  for (const f of fc.features){ const d=p(f); if(!d) continue; if(highlight.includes(f.properties.name)) hi+=d; else land+=d; }
  return {W,H,land:round(land),hi:round(hi),proj};
}
const places = {
 patna:[85.14,25.59], delhi:[77.21,28.61], mauritius:[57.55,-20.25], kerala:[76.27,9.93], pondy:[79.83,11.93], goa:[73.83,15.5],
 usa:[-98,39], sf:[-122.42,37.77], berlin:[13.40,52.52], dubai:[55.27,25.2], bangalore:[77.59,12.97], ujjain:[75.78,23.18],
 london:[-0.13,51.51], ny:[-74.0,40.71], la:[-118.24,34.05], boston:[-71.06,42.36]
};
const out={};
const world = view(w110, geoNaturalEarth1(), 1000, 520, [-128,-28,92,60], ['India','United Kingdom','United States of America','Germany','United Arab Emirates','Mauritius']);
const india = view(w50, geoMercator(), 560, 620, [67,7,90,33], ['India']);
for (const [k,v] of Object.entries({world,india})){
  const pts={}; for(const [n,c] of Object.entries(places)){ const xy=v.proj(c); pts[n]=[+xy[0].toFixed(1),+xy[1].toFixed(1)]; }
  out[k]={W:v.W,H:v.H,land:v.land,hi:v.hi,pts};
}
fs.writeFileSync('tools/mapdata.json', JSON.stringify(out));
console.log(fs.statSync('mapdata.json').size, JSON.stringify(out.world.pts), JSON.stringify(out.india.pts));
