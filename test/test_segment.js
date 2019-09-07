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

time_interval = array[4125];
time_interval.min = 3;
console.log(time_interval);
console.log(array[123]);

for( let start = Math.floor( time / precision ); i < N; ++i )
{
    sum += this.intervals[0].time_intervals[start + i].sum;
}

push( value, time )
{
    let time_interval = this.intervals[0].time_intervals[ Math.floor( time / precision ) ]; // N + 1

    if( time_interval.min > value )
    {
        time_interval.min = value;
    }
}

min( interval )
{

}


// median
// ideme cez let start = Math.floor( time / precision ); i < N; ++i
let indexes = array( N ); pointer do kazdeho z time_intervalov co som uz spracoval

naivny algoritmus - spravim si zjednotenie value intervalov

time_interval

[               { value_interval }, { value_interval }, {}, {} ],
[ { value_interval }, {}, {}, {} ], ...
[ { value_interval }, {}, {}, {} ];

vytvorime novy interval ktory bude zjednotenie tych intervalov

[{ from: 0, to: 1, sum: 12, cnt: 3 }, { from: 1, to: 2, sum: 12, cnt: 3 }, { from: 4, to: 4, sum: 12, cnt: 3 }]
[{ from: 1, to: 2, sum: 12, cnt: 3 }, { from: 2, to: 3, sum: 12, cnt: 3 }]
[{ from: 0, to: 1, sum: 13, cnt: 5 }, { from: 4, to: 4, sum: 12, cnt: 3 }]

[ { sum: reduce( pre vsetky value intervaly ) } ]

=>

[{ from: 0, to: 1, sum: 12 + 13 = 25, cnt: 3 + 5 = 8 }, ...


realny algoritmus

vieme cnt celkove pre vsetky intervaly spolu, takze vieme kde sa nachadza median






















.
