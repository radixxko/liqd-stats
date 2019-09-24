const ArraySegment = require('../lib/array_segment');
module.exports = class Stats
{
    constructor(Intervals, precision = 10)
    {
        this.sample_cnt = 0;
        this.sample = new Array();
        this.sample_size = 30;
        this.value_bucket_cnt = 10;

        this.init_time = Date.now()
        this.intervals_cnt = Intervals.length;
        this.intervals = new Array(this.intervals_cnt);
        this.value_interval;

        for(let i = 0; i < this.intervals_cnt; ++i)
        {
            this.intervals[i] =
            {
                interval     :   Intervals[i],
                precision    :   precision + 1,
                pointer      :   precision,
                buckets      :   new Array(precision + 1),
                bucket_size  :   Math.ceil( Intervals[i] / precision ),
                bucket       :   new ArraySegment(precision + 1, index =>(
                {
                    start  :   index * Math.ceil( Intervals[i] / precision ),
                    min    :   Infinity,
                    max    :   -Infinity,
                    cnt    :   0,
                    sum    :   0,
                    sub    :   new Map()
                }))
            };
            for(let j = 0; j < this.intervals[i].precision; ++j)
            {
                this.intervals[i].buckets[j] =
                 this.intervals[i].bucket[ Math.floor(this.init_time / this.intervals[i].bucket_size)
                  - this.intervals[i].precision + j + 1];
            }
        }
    }

    push( value, timestamp = Date.now(), interval_indx = -1)
    {
      //console.log(value,timestamp)
        if(this.sample_cnt < this.sample_size)
        {
            this.sample.push(
            {
                value: value,
                timestamp: timestamp
            });
            ++this.sample_cnt;
            return ;
        }

        if(this.sample_cnt === this.sample_size)
        {
            ++this.sample_cnt;
            let min = Infinity, max = -Infinity;
            for(let i = 0; i < this.sample_size; ++i){
                if(min > this.sample[i].value)
                {
                    min = this.sample[i].value;
                }
                if(max < this.sample[i].value)
                {
                    max = this.sample[i].value;
                }
            this.value_interval = (max - min) / this.value_bucket_cnt;
            }
            for(let i = 0; i < this.sample_size; ++i)
            {
                this.push(this.sample[i].value,this.sample[i].timestamp)
            }
        }

        let start = 0, end = this.intervals_cnt;

        if(interval_indx !== -1)
        {
            start = interval_indx;
            end = interval_indx + 1;
        }
        for(let intv_index = start; intv_index < end; ++intv_index)
        {

            let polling_interval = this.intervals[intv_index];
            let time_buckets = polling_interval.buckets;
            let pointer = polling_interval.pointer;
            let actual_t_bucket = time_buckets[pointer]

            if(actual_t_bucket.start <= timestamp && timestamp < actual_t_bucket.start + polling_interval.bucket_size)
            {
                let sub_index = Math.floor(value/this.value_interval);
                if( !actual_t_bucket.sub.has( sub_index ) )
                {
                    actual_t_bucket.sub.set( sub_index,
                    {
                        start: sub_index,
                        sum: value,
                        cnt: 1
                    });
                }
                else
                {
                    actual_t_bucket.sub.get(sub_index).sum += value;
                    ++actual_t_bucket.sub.get(sub_index).cnt;
                }
                ++actual_t_bucket.cnt;
                actual_t_bucket.sum += value;
                if(actual_t_bucket.max < value)
                {
                    actual_t_bucket.max = value;
                }
                if(actual_t_bucket.min > value)
                {
                    actual_t_bucket.min = value;
                }
            }

            else if(actual_t_bucket.start > timestamp
                && timestamp >= time_buckets[(pointer + 1) % polling_interval.precision].start)
            {
                let temp = polling_interval.pointer;

                polling_interval.pointer -=
                Math.ceil( (actual_t_bucket.start - timestamp) / polling_interval.bucket_size);

                polling_interval.pointer =
                (polling_interval.pointer + polling_interval.precision) % polling_interval.precision;

                this.push(value, timestamp, intv_index);
                polling_interval.pointer = temp;
            }

            else if(actual_t_bucket.start + polling_interval.bucket_size <= timestamp)
            {
                polling_interval.buckets[ (pointer + 1) % polling_interval.precision] =
                polling_interval.bucket[ Math.floor( timestamp / polling_interval.bucket_size ) ];
                polling_interval.pointer = (pointer + 1) % polling_interval.precision;
                this.push(value,timestamp,intv_index)
            }
            else
            {
                //console.log('timestamp older than interval no.',intv_index)
            }
        }
    }

    cnt( interval )
    {
      let cnt = 0;
      for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
      {
        if(this.intervals[intv_index].interval === interval)
        {
          for(let i = 0; i < this.intervals[intv_index].precision; ++i)
          {
            cnt += this.intervals[intv_index].buckets[i].cnt;
          }
        }
      }
      //console.log('cnt');
      return cnt;
    }

    min( interval )
    {
        let min = Infinity;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval === interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                    if(this.intervals[intv_index].buckets[i].min < min)
                    {
                        min = this.intervals[intv_index].buckets[i].min;
                    }
                }
            }
        }
        //console.log('min');
        return min;
    }

    max( interval )
    {
        let max = -Infinity;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval === interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                    if(this.intervals[intv_index].buckets[i].max > max)
                    {
                        max = this.intervals[intv_index].buckets[i].max;
                    }
                }
            }
        }
        //console.log('max');
        return max;
    }

    avg( interval )
    {
        //console.log('avg');
        return this.sum( interval ) / this.cnt( interval );
    }

    mdn( interval )
    {
      for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
      {
        if(this.intervals[intv_index].interval === interval)
        {
          let polling_interval = this.intervals[intv_index];
          let count = Math.floor(this.cnt( interval ) / 2);
          let indexes = new Array(polling_interval.precision).fill(0);
          let keys = new Array(polling_interval.precision);
          for(let i = 0; i < polling_interval.precision; ++i)
          {
            keys[i] = Array.from(polling_interval.buckets[i].sub.keys()).sort( (a,b) => a - b);
          }
          let max_key = Math.floor(this.min( interval ) / this.value_interval);
          while(1)
          {
            for(let i = 0; i < polling_interval.precision; ++i)
            {
              while(keys[i][ indexes[i] ] <= max_key)
              {
                 count -= polling_interval.buckets[i].sub.get(keys[i][ indexes[i] ]).cnt;
                 if(count < 0)
                 {
                   //console.log('mdn');
                   return ( keys[i][ indexes[i] ] + 1/2 ) * this.value_interval;
                 }
                 ++indexes[i];
               }
            }
            ++max_key;
          }
        }
      }
    }

    pMax( interval, percentile )
    {
      for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
      {
        if(this.intervals[intv_index].interval === interval)
        {
          let polling_interval = this.intervals[intv_index];
          let count = Math.floor(this.cnt( interval ) * percentile );
          let indexes = new Array(polling_interval.precision).fill(0);
          let keys = new Array(polling_interval.precision);
          for(let i = 0; i < polling_interval.precision; ++i)
          {
            keys[i] = Array.from(polling_interval.buckets[i].sub.keys()).sort( (a,b) => b - a);
          }
          let min_key = Math.floor(this.max( interval ) / this.value_interval);
          while(1)
          {
            for(let i = 0; i < polling_interval.precision; ++i)
            {
              while(keys[i][ indexes[i] ] >= min_key)
              {
                 count -= polling_interval.buckets[i].sub.get(keys[i][ indexes[i] ]).cnt;
                 if(count < 0)
                 {
                   //console.log('mdn');
                   return ( keys[i][ indexes[i] ] + 1/2 ) * this.value_interval;
                 }
                 ++indexes[i];
               }
            }
            --min_key;
          }
        }
      }
    }

    pMin( interval, percentile )
    {
      for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
      {
        if(this.intervals[intv_index].interval === interval)
        {
          let polling_interval = this.intervals[intv_index];
          //console.log(polling_interval.buckets);
          let count = Math.floor(this.cnt( interval ) * percentile );
          let indexes = new Array(polling_interval.precision).fill(0);
          let keys = new Array(polling_interval.precision);
          //console.log(count);
          //console.log(polling_interval.buckets);
          for(let i = 0; i < polling_interval.precision; ++i)
          {
            keys[i] = Array.from(polling_interval.buckets[i].sub.keys()).sort( (a,b) => a - b);
          }
          //console.log(keys);
          //console.log(indexes);
          let max_key = Math.floor(this.min( interval ) / this.value_interval);
          //console.log(max_key);
          while(1)
          {
            //console.log(max_key,indexes,count);
            for(let i = 0; i < polling_interval.precision; ++i)
            {
              while(keys[i][ indexes[i] ] < max_key)
              {
                 count -= polling_interval.buckets[i].sub.get(keys[i][ indexes[i] ]).cnt;
                 if(count < 0)
                 {
                   //console.log('mdn');
                   return ( keys[i][ indexes[i] ] + 1/2 ) * this.value_interval;
                 }
                 ++indexes[i];
               }
            }
            ++max_key;
          }
        }
      }
    }

    sum( interval )
    {
        let sum = 0;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval === interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                  sum += this.intervals[intv_index].buckets[i].sum;
                }
            }
        }
        //console.log('sum');
        return sum;
    }
}
