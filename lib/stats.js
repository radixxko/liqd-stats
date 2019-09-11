const ArraySegment = require('../lib/array_segment');
module.exports = class Stats
{
    constructor(Intervals, precision = 10)
    {
        this.sample_cnt = 0;
        this.sample = new Array();
        this.sample_size = 5;
        this.value_bucket_cnt = 10;

        this.init_time = Date.now()
        this.intervals_cnt = Intervals.length;
        this.intervals = new Array(this.intervals_cnt);
        this.value_interval;

        for(let i = 0; i < this.intervals_cnt; ++i)
        {
            this.intervals[i] =
            {
                interval: Intervals[i],
                precision: precision,
                pointer: precision - 1,
                buckets: new Array(precision),
                bucket_size: Intervals[i] / precision,
                bucket: new ArraySegment(precision, index =>(
                {
                    start  :   index * Intervals[i] / precision,
                    min    :   Infinity,
                    max    :   -Infinity,
                    cnt    :   0,
                    sum    :   0,
                    sub    :   []
                }))
            };
            for(let j = 0; j < this.intervals[i].precision; ++j)
            {
                this.intervals[i].buckets[j] =
                 this.intervals[i].bucket[ Math.floor(this.init_time / this.intervals[i].bucket_size) - this.intervals[i].precision + j + 1];
            }
        }
    }

    push( value, timestamp = Date.now(), interval_indx = -1)
    {
        if(this.sample_cnt < this.sample_size)
        {
            this.sample.push(
            {
                value: value,
                timestamp: timestamp
            });
            ++this.sample_cnt;
            return undefined;
        }

        if(this.sample_cnt == this.sample_size)
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

        if(interval_indx != -1)
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
                if(actual_t_bucket.sub[sub_index] == undefined)
                {
                    actual_t_bucket.sub[sub_index] =
                    {
                        start: sub_index * this.value_interval,
                        sum: value,
                        cnt: 1
                    };
                }
                else
                {
                    actual_t_bucket.sub[sub_index].sum += value;
                    ++actual_t_bucket.sub[sub_index].cnt;
                }
                ++actual_t_bucket.cnt;
                actual_t_bucket.sum += value;
                if(actual_t_bucket.max < value)
                {
                    actual_t_bucket.max = value  ;
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

                polling_interval.pointer -= Math.ceil( (actual_t_bucket.start - timestamp) / polling_interval.bucket_size);
                polling_interval.pointer = (polling_interval.pointer + polling_interval.precision) % polling_interval.precision;

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
                console.log('timestamp older than interval no.',intv_index)
            }
        }
    }

    cnt( interval )
    {
        let cnt = 0;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                    cnt += this.intervals[intv_index].buckets[i].cnt;
                }
            }
        }
        return cnt;
    }

    min( interval )
    {
        let min = Infinity;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval == interval)
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
        return min;
    }

    max( interval )
    {
        let max = -Infinity;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval == interval)
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
        return max;
    }

    avg( interval )
    {
        return this.sum(interval)/this.cnt(interval);
    }

    mdn( interval )
    {
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                let count = Math.floor(this.cnt( interval ) / 2);
                let indexes = new Array(this.intervals[intv_index].precision).fill(0);
                let max_val = Math.floor(this.min( interval ) / this.value_interval) * this.value_interval;
                while(1)
                {
                  for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                  {
                    while((this.intervals[intv_index].buckets[i].sub[indexes[i]] === undefined
                       || this.intervals[intv_index].buckets[i].sub[indexes[i]].start < max_val)
                        && this.intervals[intv_index].buckets[i].cnt > 0)
                       {
                         if(this.intervals[intv_index].buckets[i].sub[indexes[i]] !== undefined)
                         {
                           count -= this.intervals[intv_index].buckets[i].sub[indexes[i]].cnt;
                           if(count <= 0)
                           {
                             return this.intervals[intv_index].buckets[i].sub[indexes[i]].start + this.value_interval;
                           }
                         }
                         ++indexes[i];
                         if(indexes[i] === 100){
                           fcyvb;
                         }
                       }
                  }
                  max_val += this.value_interval
                }
            }
        }
    }

    pMax( interval, percentile )
    {
      for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
      {
          if(this.intervals[intv_index].interval == interval)
          {
              let count = Math.floor(this.cnt( interval ) * ( 1 - percentile ) );
              let indexes = new Array( this.intervals[intv_index].precision ).fill(0);
              let max_val = Math.floor(this.min( interval ) / this.value_interval) * this.value_interval;
              while(1)
              {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                  while((this.intervals[intv_index].buckets[i].sub[indexes[i]] === undefined
                     || this.intervals[intv_index].buckets[i].sub[indexes[i]].start < max_val)
                      && this.intervals[intv_index].buckets[i].cnt > 0)
                     {
                       if(this.intervals[intv_index].buckets[i].sub[indexes[i]] !== undefined)
                       {
                         count -= this.intervals[intv_index].buckets[i].sub[indexes[i]].cnt;
                         if(count <= 0)
                         {
                           return this.intervals[intv_index].buckets[i].sub[indexes[i]].start + this.value_interval;
                         }
                       }
                       ++indexes[i];
                       if(indexes[i] === 100){
                         fcyvb;
                       }
                     }
                }
                max_val += this.value_interval
              }
          }
      }
    }

    pMin( interval, percentile )
    {
      for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
      {
          if(this.intervals[intv_index].interval == interval)
          {
              let count = Math.floor(this.cnt( interval ) * percentile );
              let indexes = new Array( this.intervals[intv_index].precision ).fill(0);
              let max_val = Math.floor(this.min( interval ) / this.value_interval) * this.value_interval;
              while(1)
              {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                  while((this.intervals[intv_index].buckets[i].sub[indexes[i]] === undefined
                     || this.intervals[intv_index].buckets[i].sub[indexes[i]].start < max_val)
                      && this.intervals[intv_index].buckets[i].cnt > 0)
                     {
                       if(this.intervals[intv_index].buckets[i].sub[indexes[i]] !== undefined)
                       {
                         count -= this.intervals[intv_index].buckets[i].sub[indexes[i]].cnt;
                         if(count <= 0)
                         {
                           return this.intervals[intv_index].buckets[i].sub[indexes[i]].start + this.value_interval;
                         }
                       }
                       ++indexes[i];
                       if(indexes[i] === 100){
                         fcyvb;
                       }
                     }
                }
                max_val += this.value_interval
              }
          }
      }
    }

    sum( interval )
    {
        let sum = 0;
        for(let intv_index = 0; intv_index < this.intervals_cnt; ++intv_index)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; ++i)
                {
                    sum += this.intervals[intv_index].buckets[i].sum;
                }
            }
        }
        return sum;
    }
}
