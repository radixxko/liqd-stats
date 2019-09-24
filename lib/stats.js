'use strict';

const { SparseBuckets, ArraySegment } = require('./array.js');

function getTimestamp()
{
    return Date.now();
}

function updateInterval( interval, value )
{
    interval.min > value && ( interval.min = value );
    interval.max < value && ( interval.max = value );
    interval.sum += value;
    ++interval.cnt;
}

function getTimeInterval( polling_interval, timestamp )
{
    return ( timestamp < polling_interval.last_time_interval.end && timestamp > polling_interval.last_time_interval.start ) ? polling_interval.last_time_interval : ( polling_interval.last_time_interval = polling_interval.time_intervals[ Math.floor( timestamp / ( polling_interval.interval * polling_interval.precision ))]);
}

module.exports = class Stats
{
    constructor( polling_intervals, precision = 0.1 )
    {
        this.interval_index = polling_intervals.reduce(( o, i, n ) => ( o[i] = n, o ), {});
        this.polling_intervals = polling_intervals.map( interval_s => (
        {
            interval        : interval_s * 1000,
            precision       : precision,
            time_intervals  : new ArraySegment( Math.ceil( 1 / precision + 1 ), index => (
            {
                start           : Math.floor( interval_s * 1000 * precision * index ),
                end             : Math.floor( interval_s * 1000 * precision * ( index + 1 )),
                min             : Infinity,
                max             : -Infinity,
                cnt             : 0,
                sum             : 0,
                value_intervals : new SparseBuckets(( from, to ) => (
                {
                    from,
                    to,
                    min : Infinity,
                    max : -Infinity,
                    cnt : 0,
                    sum : 0
                }))
            })),
            last_time_interval: { start: -Infinity } // cache last interval - Proxy.get is slow
        }));
    }

    push( value, timestamp = getTimestamp())
    {
        for( let polling_interval of this.polling_intervals )
        {
            let time_interval = getTimeInterval( polling_interval, timestamp );

            //if( time_interval.value_intervals ) // TODO options to disable value_intervals when not polling nth_item
            {
                updateInterval( time_interval.value_intervals[ time_interval.value_intervals.index( value )] || time_interval.value_intervals.init( value ), value );
            }

            updateInterval( time_interval, value );
        }
    }

    * _time_iterator( polling_interval, timestamp )
    {
        if( this.interval_index.hasOwnProperty( polling_interval ))
        {
            let interval = this.polling_intervals[ this.interval_index[ polling_interval ]],
                current = Math.floor( timestamp / ( interval.interval * interval.precision ));

            for( let i = current - Math.round( 1 / interval.precision ); i < current; ++i )
            {
                yield interval.time_intervals[ i ];
            }
        }
    }

    _nth_value( polling_interval, timestamp , percentile, direction = 1 )
    {
        let cnt = this.cnt( polling_interval, timestamp ), no = Math.ceil( cnt * percentile ), values = []; // TODO no || 1, pridat test a doplnit

        if( cnt )
        {
            for( let time_interval of this._time_iterator( polling_interval, timestamp ))
            {
                values.push( time_interval.value_intervals.values() );
            }

            values = values.flat().sort(( a, b ) => direction * ( a.from - b.from )); // TODO iterate from the shorter direction

            for( let cnt = 0, i = 0; i < values.length; ++i )
            {
                if(( cnt += values[i].cnt ) >= no )
                {
                    let interval = { min: values[i].min, max: values[i].max, sum: values[i].sum, cnt: values[i].cnt };

                    while( ++i < values.length && values[i].from === values[i - 1].from ) // TODO interlaping intervals with different ranges
                    {
                        interval.min > values[i].min && ( interval.min = values[i].min );
                        interval.max < values[i].max && ( interval.max = values[i].max );
                        interval.sum += values[i].sum;
                        interval.cnt += values[i].cnt;
                        cnt += values[i].cnt;
                    }

                    let value = interval.min + ( interval.max - interval.min ) * (( interval.cnt > 1 ) ? ( interval.cnt + no - cnt - 1 ) / ( interval.cnt - 1 ) : 0 ); // TODO direction;

                    /*if( value < interval.min || value > interval.max )
                    {
                        console.log({ interval, no, cnt }); process.exit();
                    }*/

                    return value;
                }
            }
        }
    }

    min( polling_interval, timestamp = getTimestamp())
    {
        let min = Infinity;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            min > time_interval.min && ( min = time_interval.min );
        }

        return min !== Infinity ? min : undefined;
    }

    max( polling_interval, timestamp = getTimestamp())
    {
        let max = -Infinity;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            max < time_interval.max && ( max = time_interval.max );
        }

        return max !== -Infinity ? max : undefined;
    }

    cnt( polling_interval, timestamp = getTimestamp())
    {
        let cnt = 0;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            cnt += time_interval.cnt;
        }

        return cnt;
    }

    sum( polling_interval, timestamp = getTimestamp())
    {
        let sum = 0, not_empty = 0;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            sum += time_interval.sum;
            not_empty |= time_interval.cnt;
        }

        return not_empty ? sum : undefined;
    }

    avg( polling_interval, timestamp = getTimestamp())
    {
        let sum = 0, cnt = 0;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            sum += time_interval.sum;
            cnt += time_interval.cnt;
        }

        return cnt ? sum / cnt : undefined;
    }

    mdn( interval, timestamp = getTimestamp())
    {
        return this._nth_value( interval, timestamp, 0.5 );
    }

    pMin( interval, percentile, timestamp = getTimestamp())
    {
        return this._nth_value( interval, timestamp, percentile, -1 );
    }

    pMax( interval, percentile, timestamp = getTimestamp())
    {
        return this._nth_value( interval, timestamp, percentile );
    }
}
