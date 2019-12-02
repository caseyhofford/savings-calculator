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

//colors
green = '#5e7f65'
orange = '#e18137'
blue = '#5885a0'

yellow = '#d3a645'
brown = '#6b3f1e'

gray0 = '#eee7e3'
gray1 = '#cec8c4'
gray2 = '#a7a19d'
gray3 = '#847f7b'
gray4 = '#686462'
gray5 = '#302f2e'
black = '#181818'

teal = '#9dc8bc'
red = '#df5a35'

//create input boxes
inputs = d3.select('div.inputs')
            .selectAll('select')
            .data(opts)
            .enter()
            .append('select')
            .attr('id', function(d) {return d.id})
            .attr('onchange', 'update()');

//add input options
inputs.selectAll('option')
      .data(function(d, i) {return d.options})
      .enter()
      .append('option')
      .attr('value', function(d) {return d.value})
      .text(function(d) {return d.text});


/*d3.select('div.inputs')
  .selectAll('select').each(function() {this.selectedIndex = -1})*/



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
  let total_upfront = vehicle.upfront.base
  if (reefer) {total_upfront += vehicle.upfront.reefer}
  if (tow) {total_upfront += vehicle.upfront.tow}
  if (box) {total_upfront += vehicle.upfront.box}
  if ('mpg' in vehicle){
    fuel_spend = cost_gas*(lt_miles/vehicle.mpg)
  }
  else if ('kwhm' in vehicle) {
    fuel_spend = lt_miles*cost_kwh*vehicle.kwhm
  }
  maint_spend = lt_miles*vehicle.maintCPM
  comp_spend = lt_miles*vehicle.compCPM
  inc_up_total = -(vehicle.vpd*vehicle.inc_dpy*10)

  let lt_spend = total_upfront + fuel_spend + maint_spend + comp_spend + inc_up_total
  let cpm = (fuel_spend + maint_spend + comp_spend)/lt_miles
  return {lt_spend:lt_spend,cpm:cpm}
}

//pulls out the values of each field and recalculates savings
function calcSav(){
  vehicle_class = d3.select("#vehicleclass").property("value")
  reefer = Number(d3.select("#reefer").property("value"))
  tow = Number(d3.select("#tow").property("value"))
  box = Number(d3.select("#box").property("value"))
  electric_totals = calcVehicle(electric_vehicles[vehicle_class],reefer,tow,box)
  diesel_totals = calcVehicle(diesel_vehicles[vehicle_class],reefer,tow,box)
  total_sav_d = diesel_totals.lt_spend - electric_totals.lt_spend
  total_sav_p = total_sav_d/diesel_totals.lt_spend
  sav_dpm = diesel_totals.cpm - electric_totals.cpm
  sav_ppm = sav_dpm/diesel_totals.cpm
  savings = {
    total_sav_d:total_sav_d,
    total_sav_p:total_sav_p,
    sav_dpm:sav_dpm,
    sav_ppm:sav_ppm,
    electric:electric_totals,
    diesel:diesel_totals
  };
  return savings;
}

var savings = {"total_sav_d":0,"total_sav_p":00,"sav_dpm":0,"sav_ppm":0,"electric":{"lt_spend":0,"cpm":0},"diesel":{"lt_spend":0,"cpm":0}};
//***
///////////////////
//Charts Output
////////////////
//***

function update() {
  calcSav()
  updateDial()
  updateChart()
}

h = 500
w = 800

bar_height = 150

//explicitly hoist variables
var xScale, yScale, xAxis, yAxis, bars, bar_data, axes

var svg = d3.select('div.charts')
  .append('svg')
  .attr('height',h)
  .attr('width', w);

drawChart()
////////////////////
//Building the bars
////////////////////
function drawLine() {
  /*base = axes.append('rect')
          .attr('width',w)
          .attr('height', (yScale.range()[1]-(yScale.paddingOuter()*yScale.step()*2)))
          .attr('y',yScale.padding()*yScale.step())
          .attr('fill', 'black')*/
/*  base = axes.append('rect')
          .attr('width',w/15)
          .attr('height', (yScale.range()[1]-(yScale.paddingOuter()*yScale.step()*2)))
          .attr('y',yScale.padding()*yScale.step())
          .attr('fill', 'yellow')*/
}

function drawChart() {
  bar_data = [{'type':'Electric','cost':savings.electric.lt_spend},{'type':'Diesel','cost':savings.diesel.lt_spend}]
  xScale = d3.scaleLinear()
      .range([0,w-30])
      .domain([0,d3.max(bar_data.map(d => Math.round(d.cost + 5000)))])

  yScale = d3.scaleBand()
      .range([0,bar_height])
      //.padding(.05)
      .domain(['Electric','Diesel'])

//creating the axis
  xAxis = d3.axisBottom(xScale)
      //.tickFormat(d3.format("($.3"))
  yAxis = d3.axisLeft().tickSize(0).scale(yScale)

  axes = svg.append('g')
      .attr('class', 'axes')

  axes.append('g')
      .append('text')
      .attr('class','xlabel')
      .attr('transform', 'translate(' + (w/2) + ' , 200)')
      .style('text-anchor', 'middle')
      .text('Total Cost')

  axes.append('g')
    .attr('class','x_axis')
    .attr('transform', 'translate(0, '+bar_height+')')
    .call(xAxis);

  axes.selectAll('.bar')
      .data(bar_data)
    .enter().append('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.type))
      .attr('height', yScale.bandwidth())
      .transition()
      .duration(3000)
      .ease(d3.easePolyOut)
      .attr('width', d => xScale(d.cost));

  axes.append('g')
      .attr('class', 'y_axis')
      .call(yAxis)
      .style('color', gray0)
      .selectAll('.tick text')
      .style('text-anchor', 'end')
      .attr('class',d => d)
      .transition()
      .duration(3000)
      .ease(d3.easePolyInOut)
      .attr('x', d => xScale(savings[d.toLowerCase()]['lt_spend'])-40)//relies on the savings object, not D3 bound data;

  //draws the center line on the road
  axes.append('line')
      .attr('class', 'line midline')
      .style('stroke-dasharray', (w/20,w/20))
      .style('stroke', yellow)
      .style('stroke-width', '4px')
      .attr('x1',0)
      .attr('y1',bar_height/2)
      .attr('x2',0)
      .attr('y2',bar_height/2)
      .transition()
      .duration(3000)
      .ease(d3.easePolyOut)
      .attr('x2', xScale(d3.min(bar_data.map(d => d.cost))));


  axes.attr('transform', 'translate(15,0)');
}

function updateChart() {
  bar_data = [{'type':'Electric','cost':savings.electric.lt_spend},{'type':'Diesel','cost':savings.diesel.lt_spend}]
  xScale.domain([0,d3.max(bar_data.map(d => Math.round(d.cost + 5000)))])
  xAxis.scale(xScale)

  axes.select('.x_axis')
      .transition()
      .ease(d3.easePolyOut)
      .call(xAxis)

  axes.selectAll('rect')
      .data(bar_data)
      .transition()
      .duration(3000)
      .ease(d3.easePolyOut)
      .attr('width', d => xScale(d.cost))
  axes.selectAll('line.midline')
      .transition()
      .duration(3000)
      .ease(d3.easePolyOut)
      .attr('x2', xScale(d3.min(bar_data.map(d => d.cost))));

  axes.selectAll('.y_axis .tick text')
      .transition()
      .duration(3000)
      .ease(d3.easePolyOut)
      .attr('x', d => xScale(savings[d.toLowerCase()]['lt_spend'])-40);//relies on the savings object, not D3 bound data;
}

////////////////////
//Building the arcs
////////////////////

//change the factor of pi to get that percent of a cirlce
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

var dials = [{'percent':23,'dollars':1200,'endAngle':pc2ang(0)},
  {'percent':89.3,'dollars':8000,'endAngle':pc2ang(0)}];
  /*{'percent':60,'dollars':5000,'endAngle':pc2ang(0)}]*/


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
    .attr('transform', function(d,i) {return 'translate('+(180+(i*400))+',300)'})

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

//dollar text
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

//percent text
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

function updateDial() {
  var savings = calcSav()
  dials = [{percent:(savings.total_sav_p*100),dollars:savings.total_sav_d,endAngle:pc2ang(0)},{percent:(savings.sav_ppm*100),dollars:savings.sav_dpm,endAngle:pc2ang(0)}]
  dialgroups = svg.selectAll('g.dial')
      .data(dials);

  dialgroups.selectAll('.arc')
      .data(dials)
      .append('path')
      .transition()
      .delay(300)
      .duration(4000)
      .attrTween('d', arcTween())

//  arcpaths.enter()
//    .append('path')
//    .transition()
//    .delay(300)
//    .duration(4000)
//    .attrTween('d', arcTween());

  dialgroups.selectAll('text.dolsave')
    .data(dials)
    .append('text')
    .attr('font-size', d => dolfont+'px')
    .transition()
    .delay(300)
    .duration(2000)
    .ease(d3.easePolyOut)
    .attr('x', d => {return xshift(d.dollars,dolfont)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
    .tween('text', function(d) {
      console.log(this.textContent)
      console.log(d)
      var interpolator = d3.interpolateRound(Number(this.textContent.match(/\d+/)), d.dollars);
      return function(t){
        this.textContent = '$'+interpolator(t);
      }
    });
  dialgroups.selectAll('text.persave')
    .attr('font-size', d => perfont+'px')
    .transition()
    .delay(300)
    .duration(2000)
    .ease(d3.easePolyOut)
    .attr('x', d => {return xshift(d.percent,perfont)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
    .tween('text', function(d) {
      var interpolator = d3.interpolateRound(Number(this.textContent.match(/\d+/)), d.percent);
      return function(t){
        this.textContent = interpolator(t)+'%';
      }
    });

  return dials
}
