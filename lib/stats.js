module.exports = class Stats
{
    constructor( duration ,time ,value)
    {
        this.duration = duration;
        this.interval = time;
        this.value_interval = value;
        this.size = Math.ceil(duration / time)
        this.buckets = new Array(this.size);
        let now = new Date();
        for(let i = 0; i < this.size; i++)
        {
            this.buckets[i] =
            {
                start:now - time*(this.size - 1 - i),
                sub:[],
                min: Infinity,
                max: 0,
                cnt: 0,
                sum: 0
            };
        }
        this.pointer = this.size - 1;
/*
    [{start:*ms*, sub: [{start:*st_val1*, value:[x,y,z]},{start:*st_val2*, value:[x,y,z]}], min:  , max:   , cnt:  , mdn:  , sum: },
     {start:*ms*, sub: [{start:*st_val1*, value:[x,y,z]},{start:*st_val2*, value:[x,y,z]}], min:  , max:   , cnt:  , mdn:  , sum: },
     {start:*ms*, sub: [{start:*st_val1*, value:[x,y,z]},{start:*st_val2*, value:[x,y,z]}], min:  , max:   , cnt:  , mdn:  , sum: },
     {start:*ms*, sub: [{start:*st_val1*, value:[x,y,z]},{start:*st_val2*, value:[x,y,z]}], min:  , max:   , cnt:  , mdn:  , sum: },
     {start:*ms*, sub: [{start:*st_val1*, value:[x,y,z]},{start:*st_val2*, value:[x,y,z]}], min:  , max:   , cnt:  , mdn:  , sum: }]
*/
    }
    push( value, timestamp = Date.now() )
    {
        if(this.buckets[this.pointer].start <= timestamp && timestamp < this.buckets[this.pointer].start + this.interval)
        {
            let sub_index = Math.floor(value/this.value_interval);
            if(this.buckets[this.pointer].sub[sub_index] == undefined)
            {
                this.buckets[this.pointer].sub[sub_index] =
                {
                    start: sub_index * this.value_interval,
                    value: [value]
                };
            }
            else
            {
                this.buckets[this.pointer].sub[sub_index].value.push(value);
            }
            this.buckets[this.pointer].cnt++;
            this.buckets[this.pointer].sum += value;
            if(value > this.buckets[this.pointer].max)
            {
                this.buckets[this.pointer].max = value;
            }
            if(value < this.buckets[this.pointer].min)
            {
                this.buckets[this.pointer].min = value;
            }

        }
        else if(this.buckets[this.pointer].start > timestamp && timestamp >= this.buckets[(this.pointer + 1) % this.size].start)
        {
            let temp = this.pointer;
            this.pointer -= Math.ceil( (this.buckets[this.pointer].start - timestamp) / this.interval);
            this.pointer = (this.pointer + this.size) % this.size;
            this.push(value,timestamp);
            this.pointer = temp;
        }
        else if(this.buckets[this.pointer].start + this.interval <= timestamp)
        {
            this.buckets[(this.pointer + 1) % this.size] = 
            {
                start: this.buckets[this.pointer].start + this.interval,
                sub: [],
                min: Infinity,
                max: 0,
                cnt: 0,
                sum: 0
            };
            this.pointer = (this.pointer + 1) % this.size;
            this.push(value, timestamp);
        }
        else
        {
            console.log('timestamp older than interval');
        }

    }

    cnt( interval )
    {
        let cnt = 0;
        for(let i = 0; i < interval/this.interval; i++)
        {
            cnt += this.buckets[(this.pointer + this.size - i) % this.size].cnt;
        }
        return cnt;
    }

    min( interval )
    {
        let min = Infinity;
        for(let i = 0; i < interval/this.interval; i++)
        {
            if(min > this.buckets[(this.pointer + this.size - i) % this.size].min)
            {
                min = this.buckets[(this.pointer + this.size - i) % this.size].min;
            }
        }
        return min;
    }

    max( interval )
    {
        let max = 0;
        for(let i = 0; i < interval/this.interval; i++)
        {
            if(max < this.buckets[(this.pointer + this.size - i) % this.size].max)
            {
                max = this.buckets[(this.pointer + this.size - i) % this.size].max;
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
        for(let i = 0; i < interval/this.interval; i++)
        {
            sum += this.buckets[(this.pointer + this.size - i) % this.size].sum;
        }
        return sum;
    }
}
