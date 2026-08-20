/* Educational screening only. Verify limits at hcr.ny.gov. Effective for reservations accepted July 6, 2026 until further notice. */
window.SONYMA_DATA = (function () {
  var PP_UP = {pp1_non:566350,pp1_target:692210,pp2_non:725140,pp2_target:886280,pp3_non:876490,pp3_target:1071270,pp4_non:1089340,pp4_target:1331410};
  var PP_DN = {pp1_non:1306970,pp1_target:1597410,pp2_non:1673440,pp2_target:2045320,pp3_non:2022730,pp3_target:2472220,pp4_non:2513890,pp4_target:3072530};
  function pack(region, inc, pp, dpal, lir) {
    return {
      region: region,
      atd: {region:region, income1_non:inc[0], income1_target:inc[1], income3_non:inc[2], income3_target:inc[3], pp1_non:pp.pp1_non, pp1_target:pp.pp1_target, pp2_non:pp.pp2_non, pp2_target:pp.pp2_target, pp3_non:pp.pp3_non, pp3_target:pp.pp3_target, pp4_non:pp.pp4_non, pp4_target:pp.pp4_target},
      lir: {region:region, income1_non:lir[0], income1_target:lir[1], income3_non:lir[2], income3_target:lir[3], pp1_non:pp.pp1_non, pp1_target:pp.pp1_target, pp2_non:pp.pp2_non, pp2_target:pp.pp2_target, pp3_non:pp.pp3_non, pp3_target:pp.pp3_target, pp4_non:pp.pp4_non, pp4_target:pp.pp4_target},
      dpalPlus: {income1_non:dpal[0], income1_target:dpal[1], income3_non:dpal[2], income3_target:dpal[3]}
    };
  }
  var BASE=[89520,107420,102940,125320];
  var CAP=[98480,118170,113250,137870];
  var DOWN=[162810,162810,189950,189950];
  var LI=[157720,157720,184010,184010];
  var TOM=[94400,113280,113280,135936];
  var LIR_UP=[111900,134280,128685,156660];
  var LIR_CAP=[123100,147720,141565,172340];
  var LIR_DOWN=[203520,203520,237440,237440];
  var LIR_LI=[197150,197150,230012,230012];
  var DP_UP=[67140,80560,77210,93990];
  var DP_CAP=[73860,88630,84930,103400];
  var DP_NYC=[122110,122110,142460,142460];
  var D={}, i, c;
  var list = [
    ["BUFFALO",["Cattaraugus","Chautauqua","Erie","Niagara","Genesee"],BASE,PP_UP,DP_UP,LIR_UP],
    ["ROCHESTER",["Livingston","Monroe","Ontario","Orleans","Seneca","Wayne","Wyoming"],BASE,PP_UP,DP_UP,LIR_UP],
    ["SYRACUSE",["Cayuga","Cortland","Madison","Onondaga","Oswego","Yates"],BASE,PP_UP,DP_UP,LIR_UP],
    ["BINGHAMTON",["Allegany","Broome","Chemung","Chenango","Delaware","Otsego","Schuyler","Steuben","Tioga"],BASE,PP_UP,DP_UP,LIR_UP],
    ["CAPITAL",["Albany","Montgomery","Rensselaer","Saratoga","Schenectady","Schoharie"],CAP,PP_UP,DP_CAP,LIR_CAP],
    ["MOHAWK VALLEY",["Clinton","Essex","Franklin","Fulton","Hamilton","Herkimer","Jefferson","Lewis","Oneida","St. Lawrence","Warren","Washington"],BASE,PP_UP,DP_UP,LIR_UP],
    ["DOWNSTATE",["Rockland","Westchester"],DOWN,PP_DN,DP_NYC,LIR_DOWN],
    ["NYC",["Bronx","Brooklyn","Manhattan","Queens","Staten Island"],DOWN,PP_DN,DP_NYC,LIR_DOWN],
    ["LONG ISLAND",["Nassau","Suffolk"],LI,PP_DN,DP_NYC,LIR_LI]
  ];
  for (i=0;i<list.length;i++) {
    for (var j=0;j<list[i][1].length;j++) {
      c = list[i][1][j];
      D[c] = pack(list[i][0], list[i][2], list[i][3], list[i][4], list[i][5]);
    }
  }
  D["Tompkins"] = pack("BINGHAMTON", TOM, PP_UP, [70800,84960,81420,99120], [118000,141600,141600,169920]);
  var mid = {
    Columbia:[93440,112120,107450,130810],
    Dutchess:[100720,120860,115820,141000],
    Greene:BASE,
    Orange:[100720,120860,115820,141000],
    Sullivan:BASE,
    Ulster:[93840,112600,107910,132160]
  };
  for (c in mid) {
    var inc = mid[c];
    var lir = [Math.round(inc[0]*1.25),Math.round(inc[1]*1.25),Math.round(inc[2]*1.25),Math.round(inc[3]*1.25)];
    var dpal = (c==="Greene"||c==="Sullivan") ? DP_UP : [Math.round(inc[0]*0.75),Math.round(inc[1]*0.75),Math.round(inc[2]*0.75),Math.round(inc[3]*0.75)];
    D[c] = pack("MID-HUDSON", inc, PP_UP, dpal, lir);
  }
  D["Putnam"] = pack("MID-HUDSON", DOWN, PP_DN, DP_NYC, LIR_DOWN);
  return D;
})();
window.SONYMA_RATES = {
  asOf: "July 2026 snapshot",
  source: "https://hcr.ny.gov/current-rates",
  effective: "Reservations accepted July 6, 2026 until further notice",
  atd: {label:"Achieving the Dream", noDpal:5.700, withDpal:6.100, term:"30-year fixed", points:0},
  lir: {label:"Low Interest Rate", noDpal:6.100, withDpal:6.500, term:"30-year fixed", points:0}
};
