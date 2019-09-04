module.exports = class Stats
{
    constructor(Intervals, precision = 10)
    {   
        this.init_time = Date.now()
        this.intervals_cnt = Intervals.length;
        this.intervals = new Array(this.intervals_cnt);
        this.value_interval = 5;
        for(let i = 0; i < this.intervals_cnt; i++)
        {
            this.intervals[i] = 
            {
                interval: Intervals[i],
                precision: precision,
                pointer: precision - 1,
                buckets: new Array(precision),
                bucket_size: Intervals[i]/precision
            };
            for(let j = 0; j < this.intervals[i].precision; j++)
            {
                this.intervals[i].buckets[j] =
                {
                    start: this.init_time - this.intervals[i].bucket_size * (this.intervals[i].precision - j),
                    min: Infinity,
                    max: -Infinity,
                    cnt: 0,
                    sum: 0,
                    mdn: undefined,
                    sub: []
                }
            }
        }
    }

    push( value, timestamp = Date.now(), interval_indx = -1)
    {   
        let start = 0, end = this.intervals_cnt;
        if(interval_indx != -1)
        {
            start = interval_indx;
            end = interval_indx + 1;
        }
        for(let intv_index = start; intv_index < end; intv_index++)
        {
            let pointer = this.intervals[intv_index].pointer;
            if(this.intervals[intv_index].buckets[pointer].start <= timestamp 
                && timestamp < this.intervals[intv_index].buckets[pointer].start + this.intervals[intv_index].bucket_size)
            {
                let sub_index = Math.floor(value/this.value_interval);
                if(this.intervals[intv_index].buckets[pointer].sub[sub_index] == undefined)
                {
                    this.intervals[intv_index].buckets[pointer].sub[sub_index] =
                    {
                        start: sub_index * this.value_interval,
                        value: [value],
                        cnt: 1
                    };
                }
                else
                {
                    this.intervals[intv_index].buckets[pointer].sub[sub_index].value.push(value);
                    this.intervals[intv_index].buckets[pointer].sub[sub_index].cnt++;
                }
                this.intervals[intv_index].buckets[pointer].cnt++;
                this.intervals[intv_index].buckets[pointer].sum += value;
                if(this.intervals[intv_index].buckets[pointer].max < value)
                {
                    this.intervals[intv_index].buckets[pointer].max = value  ; 
                }
                if(this.intervals[intv_index].buckets[pointer].min > value)
                {
                    this.intervals[intv_index].buckets[pointer].min = value;
                }
            }
            else if(this.intervals[intv_index].buckets[pointer].start > timestamp 
                && timestamp >= this.intervals[intv_index].buckets[(pointer + 1) % this.intervals[intv_index].precision].start)
            {
                let temp = this.intervals[intv_index].pointer;
                this.intervals[intv_index].pointer -= Math.ceil( (this.intervals[intv_index].buckets[pointer].start - timestamp) / this.intervals[intv_index].bucket_size);
                this.intervals[intv_index].pointer = (this.intervals[intv_index].pointer + this.intervals[intv_index].precision) % this.intervals[intv_index].precision;
                this.push(value, timestamp, intv_index);
                this.intervals[intv_index].pointer = temp;
            }
            else if(this.intervals[intv_index].buckets[pointer].start + this.intervals[intv_index].bucket_size <= timestamp)
            {
                this.intervals[intv_index].buckets[ (pointer + 1) % this.intervals[intv_index].precision] =
                {
                    start: this.intervals[intv_index].buckets[pointer].start + this.intervals[intv_index].bucket_size,
                    min: Infinity,
                    max: -Infinity,
                    cnt: 0,
                    sum: 0,
                    mdn: undefined,
                    sub: []
                };
                this.intervals[intv_index].pointer = (pointer + 1) % this.intervals[intv_index].precision;
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
        for(let intv_index = 0; intv_index < this.intervals_cnt; intv_index++)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; i++)
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
        for(let intv_index = 0; intv_index < this.intervals_cnt; intv_index++)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; i++)
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
        for(let intv_index = 0; intv_index < this.intervals_cnt; intv_index++)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; i++)
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

    }

    sum( interval )
    {
        let sum = 0;
        for(let intv_index = 0; intv_index < this.intervals_cnt; intv_index++)
        {
            if(this.intervals[intv_index].interval == interval)
            {
                for(let i = 0; i < this.intervals[intv_index].precision; i++)
                {
                    sum += this.intervals[intv_index].buckets[i].sum;
                }
            }
        }
        return sum;
    }
}
