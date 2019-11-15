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


///////////////////
//Charts Output
////////////////

h = 500
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

var initial = 0
var final = [{'value':1200,'symbol':d => `$${d}`,'font':22}]
let pc2ang = d3.scaleLinear()
              .range([start, end])
              .domain([0,100]);

var percent = [{'value':23,'symbol':d => `${d}%`,'font':65, 'endAngle':pc2ang(0)},{'value':89.3,'symbol':d => `${d}%`,'font':65, 'endAngle':pc2ang(0)}]

var tot = svg.append('g')
  .attr("transform", "translate(200,100)")


let arcbg = d3.arc()
          .innerRadius(80)
          .outerRadius(100)
          .startAngle(start)
          .endAngle(end);

var arc = d3.arc()
          .innerRadius(80)
          .outerRadius(100)
          .startAngle(start);

tot.append('path')
    .attr("d", arcbg)
    .attr("class", "arcbg");

function arcTween(){
  return function(d){
    var interpolate = d3.interpolate(d.endAngle, pc2ang(d.value));
    return function(t) {
      d.endAngle = interpolate(t);
      return arc(d);
    }
  }
}

var arcPath = tot.selectAll('path')
    .data(percent)
    .enter()
    .append('path')
    .attr('class','arc')
//    .attr('d', arc)
    .transition()
    .delay(300)
    .duration(2500)
    .attrTween('d', arcTween())

var dolsave = tot.append('text')
    .attr('class', 'dolsave calcnum')
    .data(final)
    .text(d => d.symbol(0)).attr('x', 0).attr('y',40)
    .attr('font-size', d => d.font+'px')

var persave = tot.append('text')
    .attr('class', 'persave calcnum')
    .data(percent)
    .text(d => d.symbol(0)).attr('x', -10).attr('y',0)
    .attr('font-size', d => d.font+'px')

svg.selectAll('text.calcnum').transition()
    .delay(300)
    .duration(2000)
    .ease(d3.easePolyOut)
    .attr('x', function(d) {return (-(.55*d.font*(Math.round(Math.log10(d.value))+1))/2)})//apprx half the width of the value string plus symbol for sofia-pro, adjust for other fonts
    .tween('text', function(d) {
      var interpolator = d3.interpolateRound(initial, d.value);
      return function(t){
        this.textContent = d.symbol(interpolator(t));
      }
    })
