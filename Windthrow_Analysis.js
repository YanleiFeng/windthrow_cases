// *****************************************************************
// =================================================================
// ---------------- Windthrow Case Studies ---------------- ||
// --------------------- West Amazon ---------------------- ||
// =================================================================
// *****************************************************************


// Author:Yanlei Feng
// Start Date: May, 2020

// Information on Case study: West Amazon case 6
// Windthrow occurred:2008-09-10


/////////////////////////////////////////////////////////////////////////////
// Import Data
var ic4 = ee.ImageCollection("LANDSAT/LT04/C01/T1")
var goes1 = users/ylfeng/GOES_west6_band4/goes10_4_2008_254_0028

/////////////////////////////////////////////////////////////////////////////

// Image collection
var  mypoint=(ee.Geometry.Point(-71.071561, -4.56395));
var dateini = '2008-09-09'; 
var datefin = '2008-09-12';

var ic = ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA");
var ic7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_TOA");
var ic8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA")
var icm = ee.ImageCollection('MODIS/006/MOD09GA')
var c = ic.filterBounds(mypoint)
          .filterDate(dateini,datefin)
          .sort("CLOUD_COVER",true);
print(c);

Map.centerObject(mypoint, 13);

var before= ee.Image('LANDSAT/LE07/C01/T1_TOA/LE07_004063_20080824');
var good_before = ee.Image("LANDSAT/LT05/C01/T1_TOA/LT05_004063_20050925")
var good_after = ee.Image('LANDSAT/LT05/C01/T1_TOA/LT05_005063_20080924')
var after = ee.Image('LANDSAT/LE07/C01/T1_TOA/LE07_005063_20081002');
var modis_before = ee.Image('MODIS/006/MOD09GA/2008_09_05')
var modis_after = ee.Image('MODIS/006/MOD09GA/2008_09_13')

Map.addLayer(good_after,{gamma: 1.3, min: 0, max: 0.3, bands: ['B5', 'B4', 'B3']}, 'img_20080924'); //L5 l7  TOA
Map.addLayer(good_before,{gamma: 1.3, min: 0, max: 0.3, bands: ['B5', 'B4', 'B3']}, 'img_20050925',false); //L5 l7  TOA
Map.addLayer(after,{gamma: 1.3, min: 0, max: 0.3, bands: ['B5', 'B4', 'B3']}, 'img_20081002',false); //L5 l7  TOA
Map.addLayer(modis_before, { bands:['sur_refl_b06','sur_refl_b02','sur_refl_b01'],gain:[0.07, 0.06,0.06]}, "modis2008_09_05",false)
Map.addLayer(modis_after, { bands:['sur_refl_b06','sur_refl_b02','sur_refl_b01'],gain:[0.07, 0.06,0.06]}, "modis2008_09_13",false)
var TRMM = ee.ImageCollection("TRMM/3B42")
var trmm_2002 = TRMM.filterDate(dateini,datefin)

/////////////////////////////////////////////////////////////////////////////
// Create and print the TRMM precipitation associated with the windthrow.
print(ui.Chart.image.seriesByRegion(
  trmm_2002, region, ee.Reducer.max(), 'precipitation', 30))


///////////////////////////////////////////////////////////////////////////
//cloud Animation
var animation = require('users/gena/packages:animation')
var utils = require('users/gena/packages:utils')
var palettes = require('users/gena/packages:palettes')
///////////////
var limit = function(i){
  var mask = i.gte(5)
  var p = i.updateMask(mask)
  return p
}
// add GOES images to map
var goes = utils.getFolderImages('users/ylfeng/GOES_west6_band4_temp') 

print(goes, 'goes')

goes = goes.map(function(i) {
  i = i.set({ label: ee.String(i.get('system:id')).slice(45,57) })
  return i
})
print(goes)

// Uncomment to display the animation
// animation.animate(goes.map(limit), {
//   vis: { min:50, max: 200, palette:["white","green","blue"], opacity: 0.8 },
//   label: 'label',
//   maxFrames: goes.size()
// })

///////////////////////////////////////////////////////////////////////////


// Create and print line chart of goes data

print(ui.Chart.image.series(goes,  region,  ee.Reducer.mean(),30, 'label'))

//////////////////////////////////////////////////////////////////
// Cloud masking
// Get BQA band bits
var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};
var cloudMaskL4578 = function(image) {
  var qa = image.select("BQA");
  // If the cloud bit (5) is set and the cloud confidence (7) is high
  // or the cloud shadow bit is set (3), then it's a bad pixel.
  var internalCloud = getQABits(qa, 4,4, 'L5TOA_Cloud');
  var internalCloudshade = getQABits(qa, 5,6, 'L5TOA_cloudshade');
  var internalshade = getQABits(qa, 7,8, 'L5TOA_shade');
  var m = (internalCloud.eq(1).add(internalCloudshade.gte(2)).add(internalshade.gte(2))).not()
  // Return an image masking out cloudy areas.
  return image.mask(m);
};

//////////////////////////////////////////////////////////////////////////
// Count disturbance pixels
var NBR_after = cloudMaskL4578(good_after).normalizedDifference(["B5","B4"]).clip(polygon)
var NBR_before = cloudMaskL4578(good_before).normalizedDifference(["B5","B4"]).clip(polygon)
var NBR_after_clip = NBR_after
var dNBR = NBR_after.subtract(NBR_before)

 var DNPVinte_NBR =
  '<RasterSymbolizer>' +
    '<ColorMap  type="intervals" extended="false" >' +
      '<ColorMapEntry color="#000000" quantity="-200.0" label="-100.0-0.0" />' +        //blue
      '<ColorMapEntry color="#000000" quantity="-10" label="-200--100.0" />' +        //black
       '<ColorMapEntry color="#000000" quantity="-0.3" label="-10.0001--0.300" />' +   //black
      '<ColorMapEntry color="#FF0000" quantity="10.0" label="-0.3001-10.0000" />' +   //Red
    '</ColorMap>' +
  '</RasterSymbolizer>';


  
 var DNPVinte =
  '<RasterSymbolizer>' +
    '<ColorMap  type="intervals" extended="false" >' +
      '<ColorMapEntry color="#000000" quantity="-200.0" label="-100.0-0.0" />' +        //blue
      '<ColorMapEntry color="#000000" quantity="0" label="-200-0.0" />' +        //black
       '<ColorMapEntry color="#000000" quantity="0.12" label="0.0001-0.1200" />' +   //black
      '<ColorMapEntry color="#FF0000" quantity="10.0" label="0.12001-10.0000" />' +   //Red
    '</ColorMap>' +
  '</RasterSymbolizer>';  

// Map.addLayer(NBR_before,{},"NBR_before",false)
Map.addLayer(NBR_after,{min:-0.4,max:-0.04,palette:["white","blue","red"]},"NBR_after")
Map.addLayer(dNBR,{min:-0.05, max: 0.12, palette:["white","blue","red"]},"dNBR",false)
Map.addLayer(NBR_after.sldStyle(DNPVinte_NBR),{},"NBR_disturbance_in_red")
Map.addLayer(dNBR.sldStyle(DNPVinte),{},"dNBR_disturbance_in_red")

//////////////////////////////////////////////////////////////////////
var m = (NBR_after_clip).gte(-0.3)
var n = dNBR.gte(0.12)
var area_NBR = m.reduceRegion(ee.Reducer.sum(),polygon, 30).values();
var area_dNBR = n.reduceRegion(ee.Reducer.sum(),polygon, 30).values();
Map.addLayer(m,{},"m",false)
// Map.addLayer(area_mask,{},"area_mask")
print("area_NBR",area_NBR)
print("area_dNBR",area_dNBR)

//////////////////////////////////////////////////////////////////
/////////////////////////DNPV/////////////////////////////////////
//////////////////////////////////////////////////////////////////
//sma function. 
//----------------------------------
var smaima =function(image){
var gv =   [0.10082010924816132, 0.086686871945858, 0.05864602327346802, 0.366437703371048, 0.16288061439990997, 292.43194580078125, 0.057866420596838];
var npv =  [0.10655567049980164, 0.08736872673034668, 0.08930741995573044, 0.2177921086549759, 0.2327728420495987, 295.529052734375,  0.12441372871398926];    //NPV:    @ -60.173985958099365, -2.276596169278266   . ZF5 windtrhow
var shd =  [0.11007054150104523, 0.08599898219108582, 0.06469277292490005, 0.1082172617316246, 0.02362246811389923, 293.76943969726560, 0.08311159908771515]; //Shade: water   Adam & Guillespie
var sma = image.unmix([npv,gv,shd]);
return sma;
};

function selectBands(image){
  return image.select(["B1","B2","B3","B4","B5","B6","B7"]); // L5.
//  return image.select(["B2","B3","B4","B5","B6","B7"]);  //L8
}

//Apply a forest mask on DNPV
//Apply a forest mask on DNPV
var forestmask = ee.Image("UMD/hansen/global_forest_change_2019_v1_7").select('treecover2000').clip(polygon).gte(50);

var imagewntd_1 = cloudMaskL4578(good_after).clip(polygon)
var imagewntd_2 = cloudMaskL4578(good_before).clip(polygon)
var lndst_1 = ee.Image(imagewntd_1);   //ZF5 nice image  19970621
var lndstcol_1 = ee.ImageCollection([lndst_1]);
var lndstbnds_1 = lndstcol_1.map(selectBands); //select only bands of interest

var lndst_2 = ee.Image(imagewntd_2);   //ZF5 nice image  19970621
var lndstcol_2 = ee.ImageCollection([lndst_2]);
var lndstbnds_2 = lndstcol_2.map(selectBands); //select only bands of interest

var smalndst_1 = lndstbnds_1.map(smaima);
var smalndst_2 = lndstbnds_2.map(smaima);

var npv_1 = ee.Image(smalndst_1.select(0).first());
var gv_1  = ee.Image(smalndst_1.select(1).first());
var nrmlzd_npv_1 =npv_1.divide(npv_1.add(gv_1));

var npv_2 = ee.Image(smalndst_2.select(0).first());
var gv_2  = ee.Image(smalndst_2.select(1).first());
var nrmlzd_npv_2 =npv_2.divide(npv_2.add(gv_2));

var DNPV = npv_1.subtract(npv_2);
var nrmlzdDNPV = nrmlzd_npv_1.subtract(nrmlzd_npv_2).rename("nrmlzdDNPV");

var DNPV_intervals =
  '<RasterSymbolizer>' +
    '<ColorMap  type="intervals" extended="false" >' +
      '<ColorMapEntry color="#000000" quantity="0.0" label="-1.0-0.0" />' +        //black
      '<ColorMapEntry color="#F5F5F5" quantity="0.2" label="0.0001-0.2000" />' +   //WhiteSmoke
      '<ColorMapEntry color="#00FF00" quantity="0.4" label="0.2001-0.4000" />' +   //Lime
      '<ColorMapEntry color="#FFFF00" quantity="0.6" label="0.4001-0.6000" />' +   //Yellow
      '<ColorMapEntry color="#FFA500" quantity="0.8" label="0.6001-0.8000" />' +   //Orange
      '<ColorMapEntry color="#FF0000" quantity="1.0" label="0.8000-1.0000" />' +   //Red
    '</ColorMap>' +
  '</RasterSymbolizer>';

// Map.addLayer(npv_1, {}, 'npv_1');
// Map.addLayer(gv_1, {}, 'gv_1');
// Map.addLayer(npv_1.mask(npv_1.gte(1.0)), {palette:["yellow","yellow","yellow","yellow","yellow","yellow","red"]}, 'npv_1');
// Map.addLayer(gv_1.mask(gv_1.gte(1.0)), {min:1, max: 1.1, palette:["blue","green","yellow","orange","red"]}, 'gv_1');


/////////////////////////////////////////////////////////////////////////////
// Print the area (number of pixels) of windthrow
// Map.addLayer(DNPV, {}, 'DNPV');
Map.addLayer(nrmlzdDNPV.mask(forestmask), {}, 'normalized_DNPV');
// Map.addLayer(DNPV.sldStyle(DNPV_intervals), {}, 'DNPV_clr');
Map.addLayer(nrmlzdDNPV.mask(forestmask).sldStyle(DNPV_intervals), {}, 'normalized_DNPV_clr');
// Map.addLayer(npv_1.sldStyle(DNPV_intervals), {}, 'npv_1_clr');
var DNPV_threshold = nrmlzdDNPV.gte(0.2)
var DNPV_area_mask = DNPV_threshold.reduceRegion(ee.Reducer.sum(),polygon, 30);
print("DNPV_area_mask_greaterthanpoint2", DNPV_area_mask.values())
Map.addLayer(DNPV_threshold, {}, "DNPV_treshold")