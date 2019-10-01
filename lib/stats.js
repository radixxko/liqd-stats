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
    return ( timestamp < polling_interval.last_time_interval.end && timestamp > polling_interval.last_time_interval.start )
    ? polling_interval.last_time_interval :
    ( polling_interval.last_time_interval =
      polling_interval.time_intervals[ Math.floor( timestamp / ( polling_interval.interval * polling_interval.precision ))]);
}

module.exports = class Stats
{
    constructor( polling_intervals, precision = 0.1, history_memory = 100 /*sec*/)
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
                }), (bucket_1, bucket_2) => (
                  {
                    from : Math.min(bucket_1.from, bucket_2.from),
                    to   : Math.max(bucket_1.to, bucket_2.to),
                    min  : Math.min(bucket_1.min, bucket_2.min),
                    max  : Math.max(bucket_1.max, bucket_2.max),
                    cnt  : bucket_1.cnt + bucket_2.cnt,
                    sum  : bucket_1.sum + bucket_2.sum
                  }
                ))
            })),
            last_time_interval: { start: -Infinity }, // cache last interval - Proxy.get is slow
            history           : new ArraySegment( history_memory, index => (
              {
                start : Math.floor( interval_s * 1000 * precision * index ),
                end   : Math.floor( interval_s * 1000 * precision * ( index + 1 )),
                min   : undefined,
                max   : undefined,
                cnt   : undefined,
                sum   : undefined,
                avg   : undefined,
                mdn   : undefined
              }
            ))
        }));
    }

    push( value, timestamp = getTimestamp())
    {
        for( let polling_interval of this.polling_intervals )
        {

            if( timestamp > polling_interval.last_time_interval.end &&
                polling_interval.time_intervals[ Math.floor( ( timestamp - polling_interval.interval ) / (polling_interval.interval * polling_interval.precision) )])
            {
              this._push_to_history( polling_interval, timestamp );
            }
            let time_interval = getTimeInterval( polling_interval, timestamp );

            //if( time_interval.value_intervals ) // TODO options to disable value_intervals when not polling nth_item
            {
                updateInterval( time_interval.value_intervals[ time_interval.value_intervals.index( value )] || time_interval.value_intervals.init( value ), value );
            }

            updateInterval( time_interval, value );
        }
    }

    _push_to_history(polling_interval, timestamp)
    {
        let precision = polling_interval.precision,
            interval = polling_interval.interval,
            latest = Math.floor( timestamp / ( interval * precision )) - Math.ceil( 1 / precision + 1 );

        let hist = polling_interval.history[ Math.floor( ( timestamp - interval ) / ( interval * precision) ) ];
        hist.min = polling_interval.time_intervals[latest].min;
        hist.max = polling_interval.time_intervals[latest].max;
        hist.cnt = polling_interval.time_intervals[latest].cnt;
        hist.sum = polling_interval.time_intervals[latest].sum;
        hist.avg = hist.sum / hist.cnt;
        hist.mdn = undefined;
    }

    * _time_iterator( polling_interval, timestamp )
    {
        if( this.interval_index.hasOwnProperty( polling_interval ))
        {
            let interval = this.polling_intervals[ this.interval_index[ polling_interval ]],
                current = Math.floor( timestamp / ( interval.interval * interval.precision )),
                latest = current - Math.round( 1 / interval.precision )

            for( let i = latest; i < current; ++i )
            {
                yield interval.time_intervals[ i ];
            }

            if( !interval.time_intervals[ latest ].cnt )
            {
                yield interval.time_intervals[ current + 1]
            }
        }
    }

    _nth_value( polling_interval, timestamp , percentile )
    {
        let cnt = this.cnt( polling_interval, timestamp ), no = Math.ceil( cnt * percentile ), values = []; // TODO no || 1, pridat test a doplnit

        if( cnt )
        {
            for( let time_interval of this._time_iterator( polling_interval, timestamp ))
            {
                values.push( time_interval.value_intervals.values() );
            }

            values = values.flat().sort(( a, b ) => a.from - b.from ); // TODO iterate from the shorter direction

            for( let cnt = 0, i = 0; i < values.length; ++i )
            {
                if(( cnt += values[i].cnt ) >= no )
                {

                    do
                    {
                      cnt -= values[i].cnt;
                    }
                    while( i && values[i].from === values[i - 1].from && i--)

                    let interval = {
                                      min: values[i].min,
                                      max: values[i].max,
                                      sum: values[i].sum,
                                      cnt: values[i].cnt
                                    };
                    while( ++i < values.length && values[i].from === values[i - 1].from ) // TODO interlaping intervals with different ranges
                    {
                        interval.min > values[i].min && ( interval.min = values[i].min );
                        interval.max < values[i].max && ( interval.max = values[i].max );
                        interval.sum += values[i].sum;
                        interval.cnt += values[i].cnt;
                    }
                    let value = interval.min + ( interval.max - interval.min ) * (( interval.cnt > 1 ) ? ( no - cnt ) / ( interval.cnt ) : 0 ); // TODO direction;

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
        return this._nth_value( interval, timestamp, 1 - percentile );
    }

    pMax( interval, percentile, timestamp = getTimestamp())
    {
        return this._nth_value( interval, timestamp, percentile );
    }
}
