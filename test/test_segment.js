const ArraySegment = require('../lib/array_segment');

let array = new ArraySegment( 10, index => (
{
    start   : index * 10,
    values  : [],
    min     : Infinity,
    max     : -Infinity,
    cnt     : 0,
    sum     : 0
}));

let time_interval;

time_interval = array[123155];
time_interval.min = 5;

console.log( time_interval );

time_interval = array[123156];
time_interval.max = 50;

console.log( time_interval );
