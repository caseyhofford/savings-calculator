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

container = document.getElementById('calc-container')

h = container.clientHeight - 100
w = container.clientWidth - 50

bar_height = 150

//explicitly hoist variables
var xScale, yScale, xAxis, yAxis, bars, bar_data, axes, motor, battery

function update() {
  calcSav()
  updateDial()
  updateChart()
}

var svg = d3.select('div.charts')
  .append('svg')
  .attr('height',h)
  .attr('width', w);

drawChart()
////////////////////
//Building the bars
////////////////////

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
            .ticks(Math.round(w/80))
            .tickFormat(d => (d/1000+'k'))
  yAxis = d3.axisLeft().tickSize(0).scale(yScale)

  axes = svg.append('g')
      .attr('class', 'axes')

  axes.append('g')
      .append('text')
      .attr('class','xlabel')
      .attr('transform', 'translate(' + (w/2) + ' , 200)')
      .style('text-anchor', 'middle')
      .text('Lifetime Cost Per Vehicle')

  axes.append('g')
    .attr('class','x_axis')
    .attr('transform', 'translate(0, '+bar_height+')')
    .call(xAxis);

  axes.selectAll('.bar')
      .data(bar_data)
    .enter().append('rect')
      .attr('class', d => 'bar '+d.type)
      .attr('y', d => yScale(d.type))
      .attr('height', yScale.bandwidth())
      .transition()
      .duration(3000)
      .ease(d3.easePolyOut)
      .attr('width', d => xScale(d.cost));

  ticks = axes.append('g')
      .attr('class', 'y_axis')
      .call(yAxis)
      .style('color', gray0)
      .selectAll('.tick')

  ticks.attr('class',d => d+' tick')
      .select('text')
      .attr('class',d => d+ ' label')
      .style('text-anchor', 'end')
      .transition()
      .duration(3000)
      .ease(d3.easePolyInOut)
      .attr('x', d => xScale(savings[d.toLowerCase()]['lt_spend'])-40)//relies on the savings object, not D3 bound data;

  motor = axes.select('.tick.Diesel')
      .append('g')
      .attr('transform','translate(-160,-28)')
      .append('svg')
      .attr('class', 'label')
      .append('g')
      .attr('transform', 'scale(.6)')
      .html(d3.select('#motor')
        .html());

  motor.select('text')
      .attr('class',d => d+ ' label')
      .style('text-anchor', 'end')

  battery = axes.select('.tick.Electric')
      .append('g')
      .attr('transform','translate(-180,-28)')
      .append('svg')
      .attr('class', 'label')
      .append('g')
      .attr('transform', 'scale(.6)')
      .html(d3.select('#battery')
        .html());
  axes.selectAll('.y_axis .tick .label')
      .style('stroke', gray1)
      .style('color', gray1)
      .style('fill', gray1);

  axes.selectAll('.y_axis .tick text.label')
      .style('stroke', 'none');


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

  axes.selectAll('.y_axis .tick .label')
      .transition()
      .duration(3000)
      .ease(d3.easePolyInOut)
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

var dials = [{'percent':23,'dollars':1200,'endAngle':pc2ang(23),'oldAngle':pc2ang(0)},
  {'percent':89.3,'dollars':8000,'endAngle':pc2ang(89.3),'oldAngle':pc2ang(0)}];
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
    .property('_current',d=>d.endAngle)
    .transition()
    // .delay(300)
    // .duration(4000)
    // .attrTween('d', arcTween)

function xshift(num,font){return (-(.55*font*(Math.ceil(Math.log10(num))+1))/2)}

//dollar text
var dolsave = dialgroups.append('text')
    .attr('class', 'dolsave calcnum')
    .text('$0').attr('x', 0).attr('y',40)
    .attr('font-size', d => dolfont+'px')
    .property('_current', d => d.dollars)
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
    });

//percent text
var persave = dialgroups.append('text')
    .attr('class', 'persave calcnum')
    .text('0%').attr('x', -10).attr('y',0)
    .attr('font-size', d => perfont+'px')
    .property('_current', d => d.percent)
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

function arcTween(d, i, attr){
  console.log(this)
  var interpolate = d3.interpolate(this._current, d.endAngle);
  return function(t) {
    d.endAngle = interpolate(t);
    this._current = d.endAngle;
    return arc(d);
  }
};

function updateDial() {
  var savings = calcSav()
  dials = [{percent:(savings.total_sav_p*100),dollars:savings.total_sav_d,endAngle:pc2ang(savings.total_sav_p*100)},{percent:(savings.sav_ppm*100),dollars:savings.sav_dpm,endAngle:pc2ang((savings.sav_ppm*100))}]
  angles = dials.map(value => pc2ang(value.percent))
  dialgroups = svg.selectAll('g.dial')
      .data(dials);
  var dialgroupsEnter = dialgroups.enter().append('g');
  dialgroupsEnter.append('path')
  dialgroupsEnter.append('text')
  dialgroupsEnter.append('path.arc')
  // dialgroups.exit().remove()
  // dialgroups.enter()
  //     .append();

  // var arcgroups = svg.selectAll('path.arc')
  //     .data(angles)

  dialgroups.select('path.arc')
      .transition()
      .delay(300)
      .duration(4000)
      .attrTween('d', arcTween);

  // arcgroups = arcgroups.enter()
  //     .append("svg:path")
  //     .attr("class","arc")
  //     .attr("d",d=>console.log(d))

  //dols.exit().remove()

  dialgroups.select('text.dolsave')
    .transition()
    .delay(300)
    .duration(2000)
    .ease(d3.easePolyOut)
    //.attr('x', d => {return xshift(d.dollars,dolfont)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
    .tween('text', function(d) {
      var interpolator = d3.interpolateRound(this._current*100, d.dollars*100);
      return function(t){
        value = interpolator(t)/100;
        formats = formatPrice(value);
        this.textContent = formats.value;
        this._current = value;
        this.attr('x', formats.x);
        console.log(this)
      }
    });
  dialgroups.select('text.persave')
    .transition()
      .delay(300)
      .duration(2000)
      .ease(d3.easePolyOut)
      .attr('x', d => {return xshift(d.percent,perfont)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
      .textTween(function(d) {
        var interpolator = d3.interpolateRound(this._current, d.percent);
        return function(t){
          return formatPercent(this._current = interpolator(t));
        }
      });

  return dials
}

const formatPercent = v => v+'%'

const formatPrice = function(value) {
  mag = Math.ceil(Math.log10(value));
  if (mag > 0){
    thous = value.toString().slice(0,(mag-3))
    return {value:thous+'K', x:(-(.55*dolfont*(mag-3))/2)}
  }
  else {
    cents = value.toString().slice(0,4)
    return {value:'$'+cents,x:-30.250000000000004}
  }
}
