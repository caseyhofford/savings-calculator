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
