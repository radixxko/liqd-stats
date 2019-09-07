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

time_interval = array[123];
time_interval.min = 5;
time_interval.values.push(5)

console.log( time_interval );

time_interval = array[125];
time_interval.max = 50;

console.log( time_interval );

console.log(array[123]);
