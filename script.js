/////////////
//Data Etc.
////////////

//Menu Description
opts = [{'id':'vehicleclass',
        'options':
          [{'value':'6','text':'Class 6'},
          {'value':'7','text':'Class 7'},
          {'value':'8','text':'Class 8'}]
        },
        {'id':'reefer',
        'options':
          [{'value':1,'text':'Yes'},
          {'value':0,'text':'No'}]
        },
        {'id':'tow',
        'options':
          [{'value':1,'text':'Yes'},
          {'value':0,'text':'No'}]
        },
        {'id':'box',
        'options':
          [{'value':1,'text':'Yes'},
          {'value':0,'text':'No'}]
        }
      ]

////////////////
//UI Setup
///////////////

//create input boxes
inputs = d3.select('div.inputs')
            .selectAll('select')
            .data(opts)
            .enter()
            .append('select')
            .attr('id', function(d) {return d.id});

//add input options
inputs.selectAll('option')
      .data(function(d, i) {return d.options})
      .enter()
      .append('option')
      .attr('value', function(d) {return d.value})
      .text(function(d) {return d.text});


////////////////////
//Variables
/////////////////
const lt_miles = 250000

/////////////////////
//diesel
const cost_gas = 4.00

//class 6
const c6_diesel = {upfront: {
    base : 70000,
    reefer : 30000,
    tow : 40000,
    box : 10000
  },
  mpg: 10,
  maintCPM:.2,
  compCPM: .025,
  vpd: 150,
  inc_dpy: 0
}

//class 7
const c7_diesel = {upfront:{
    base : 100000,
    reefer : 35000,
    tow : 50000,
    box : 10000
  },
  mpg: 7.5,
  maintCPM:.25,
  compCPM: .03,
  vpd: 200,
  inc_dpy: 0
}

//class 8
const c8_diesel = {upfront:{
    base:140000,
    reefer : 0,
    tow : 0,
    box : 0
  },
  mpg:6.0,
  maintCPM:.3,
  compCPM: .04,
  vpd: 300,
  inc_dpy: 0
}

const diesel_vehicles = {6:c6_diesel,7:c7_diesel,8:c8_diesel}

/////////////////////
//electric
const cost_kwh = .1
const ev_savings = .5

//class 6
const c6_electric = {upfront: {
    base : 90000,
    reefer : 40000,
    tow : 50000,
    box : 10000
  },
  kwhm: 1,
  maintCPM:((1-ev_savings)*c6_diesel.maintCPM),
  compCPM: 0,
  vpd: 150,
  inc_dpy: 6
}

//class 7
const c7_electric = {upfront:{
    base : 100000,
    reefer : 35000,
    tow : 50000,
    box : 10000
  },
  kwhm: 1.5,
  maintCPM: ((1-ev_savings)*c7_diesel.maintCPM),
  compCPM: 0,
  vpd: 200,
  inc_dpy: 6
}

//class 8
const c8_electric = {upfront:{
    base:140000,
    reefer : null,
    tow : null,
    box : null
  },
  kwhm: 2,
  maintCPM: ((1-ev_savings)*c8_diesel.maintCPM),
  compCPM: 0,
  vpd: 300,
  inc_dpy: 6
}

const electric_vehicles = {6:c6_electric,7:c7_electric,8:c8_electric}

function calcVehicle(vehicle,reefer,tow,box) {
  total_upfront = vehicle.upfront.base
  if (reefer) total_upfront += vehicle.upfront.reefer
  if (tow) total_upfront += vehicle.upfront.tow
  if (box) total_upfront += vehicle.upfront.box
  if ('mpg' in vehicle){
    fuel_spend = cost_gas*(lt_miles/vehicle.mpg)
  }
  else if ('kwhm' in vehicle) {
    fuel_spend = lt_miles*cost_kwh*vehicle.kwhm
  }
  maint_spend = lt_miles*vehicle.maintCPM
  comp_spend = lt_miles*vehicle.compCPM
  inc_up_total = -(vehicle.vpd*vehicle.inc_dpy*10)

  lt_spend = total_upfront + fuel_spend + maint_spend + comp_spend + inc_up_total
  cpm = (fuel_spend + maint_spend + comp_spend)/lt_miles
  return {lt_spend:lt_spend,cpm:cpm}
}

//pulls out the values of each field and recalculates savings
function calcSav(){
  vehicle_class = d3.select("#vehicleclass").property("value")
  reefer = d3.select("#reefer").property("value")
  tow = d3.select("#tow").property("value")
  box = d3.select("#box").property("value")
  electric_totals = calcVehicle(electric_vehicles[vehicle_class],reefer,tow,box)
  diesel_totals = calcVehicle(diesel_vehicles[vehicle_class],reefer,tow,box)
  total_sav_d = diesel_totals.lt_spend - electric_totals.lt_spend
  total_sav_p = total_sav_d/diesel_totals.lt_spend
  sav_dpm = diesel_totals.cpm - electric_totals.cpm
  sav_ppm = sav_dpm/diesel_totals.cpm
  return {
    total_sav_d:total_sav_d,
    total_sav_p:total_sav_p,
    sav_dpm:sav_dpm,
    sav_ppm:sav_ppm
  }
}

///////////////////
//Charts Output
////////////////

h = 200
w = 800

var svg = d3.select('div.charts')
  .append('svg')
  .attr('height',h)
  .attr('width', w);

////////////////////
//Building the arcs
////////////////////

//change the factor of pic to get that percent of a cirlce
slice = Math.PI*.8
start = -slice
end = slice

dolfont = 22
perfont = 65

var initial = 0
var final = [{'value':1200,'symbol':d => `$${d}`,'font':22}]
let pc2ang = d3.scaleLinear()
              .range([start, end])
              .domain([0,100]);

var dials = [{'percent':23,'dollars':1200,'endAngle':pc2ang(0)},{'percent':89.3,'dollars':8000,'endAngle':pc2ang(0)},{'percent':60,'dollars':5000,'endAngle':pc2ang(0)}]


let arcbg = d3.arc()
          .innerRadius(80)
          .outerRadius(100)
          .startAngle(start)
          .endAngle(end);

var arc = d3.arc()
          .innerRadius(80)
          .outerRadius(100)
          .startAngle(start);

//var tot = svg.append('g')
//  .attr("transform", "translate(200,100)")

function arcTween(){
  return function(d){
    var interpolate = d3.interpolate(d.endAngle, pc2ang(d.percent));
    return function(t) {
      d.endAngle = interpolate(t);
      return arc(d);
    }
  }
}

var dialgroups = svg.selectAll('g.dial')
    .data(dials)
    .enter()
    .append('g')
    .attr('class','dial')
    .attr('transform', function(d,i) {return 'translate('+(180+(i*220))+',100)'})


dialgroups.append('path')
    .attr("d", arcbg)
    .attr("class", "arcbg");

dialgroups.append('path')
    .attr('class', 'arc')
    .attr('d', arc)
    .transition()
    .delay(300)
    .duration(4000)
    .attrTween('d', arcTween())

function xshift(num,font){return (-(.55*font*(Math.ceil(Math.log10(num))+1))/2)}

var dolsave = dialgroups.append('text')
    .attr('class', 'dolsave calcnum')
    .text('$0').attr('x', 0).attr('y',40)
    .attr('font-size', d => dolfont+'px')
    .transition()
    .delay(300)
    .duration(2000)
    .ease(d3.easePolyOut)
    .attr('x', d => {return xshift(d.dollars,dolfont)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
    .tween('text', function(d) {
      var interpolator = d3.interpolateRound(initial, d.dollars);
      return function(t){
        this.textContent = '$'+interpolator(t);
      }
    })

var persave = dialgroups.append('text')
    .attr('class', 'persave calcnum')
    .text('0%').attr('x', -10).attr('y',0)
    .attr('font-size', d => perfont+'px')
    .transition()
    .delay(300)
    .duration(2000)
    .ease(d3.easePolyOut)
    .attr('x', d => {return xshift(d.percent,perfont)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
    .tween('text', function(d) {
      var interpolator = d3.interpolateRound(initial, d.percent);
      return function(t){
        this.textContent = interpolator(t)+'%';
      }
    })
