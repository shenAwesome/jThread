module jt {
    

    
    // The Thread class, don't need to use it directly. 
    class Thread {

        static current: Thread; //used to set Activity's parent thread 
        step = -1
        values = [] //values from activies
        ctx = {} //this for every activity function
        labels = {} //to support goto 
        args;
        private currentActivity: Activity;

        //First argument is the main thread logic. Second argument is the callback function when thread finishes
        constructor(private func: Function, private onFinish: Function) {
            var that = this;
            this.onFinish = function () {
                that.updateStep(-1);
                onFinish.apply(that, arguments);
            }
        }

        //Try to run next activity. 
        //A activity always throw exception the first time it is run. 
        //When it is finished, it will run the thread from the start. But everytime when a activity finishes, the result is cached. so activity won't be run twice.
        //Instead the thread will stop at the next Activity (which is the first time run and throws exception).
        next() {
            if (this.step == -1) return; //dead thread
            try {
                Thread.current = this;
                var ret = this.func.call(this);
                if (this.onFinish(ret)) {//repeat if onFinish return true
                    this.start();
                }
            } catch (e) {
                this.step = 0;
                if (e === parseInt(e, 10)) {//go to the step if it's a number
                    var to: Number = e;
                    this.values.length = e;
                    this.next();
                } else {//an activity is runing, waiting for it
                    if (e instanceof Activity) {
                        this.currentActivity = e;
                    } else {
                        throw e;
                    }
                }
            }
        }

        //start the thread
        start() {
            this.step = 0;
            this.values.length = 0;
            this.next();
        }

        //stop the thread, also call the stopper of the current activity (if it has one)
        stop() {
            if (this.step != -1) {
                this.currentActivity.stop();
                this.onFinish(null);
            }
        }

        //set onStep to track thread execution
        onStep(step) {
        }

        //set the step and call the onStep callback
        updateStep(s?) {
            if (arguments.length) this.step = s;
            this.onStep(this.step);
        }
    }

    //An Activity should only run in Thread main logic. Don't need to use it directly. 
    class Activity {

        private stopper: Function;
        //wrap a function as Activity.  set async = false to wrap sync functions 
        // ```javascript
        // //an async function:
        // function f1(callback){
        //     ... some logic
        //     callback(somevalue); 
        // } 
        // //a sync function: 
        // function f2(){
        //     ... some logic 
        // }
        // var activity1 = new Activity(f1);
        // var activity2 = new Activity(f2,false);  
        // ``` 
        constructor(private func: Function, async = true) {
            if (!async) {
                var func_ = func;
                this.func = function () {
                    var args = Array.prototype.slice.call(arguments);
                    var callback = args.pop();
                    var ret = func_.apply(this, args);
                    callback(ret);
                }
            }
        }

        run(args: Array<any>[]) {
            var thread = Thread.current,
                step = thread.step;
            if (thread.values[step] !== undefined) {
                thread.step++;
                return thread.values[step];
            }
            //run Activity logic if thread reaches here (means it's the first time)
            thread.updateStep();
            var that = this;
            function activityFinish(value) {
                if (thread.step == -1) return;//finished already
                if (value === undefined) value = null;
                thread.values[step] = value;
                setTimeout(function () {
                    that.stop();
                    thread.next();
                }, 1);
            }
            args.push(<any>activityFinish);
            this.stopper = this.func.apply(thread.ctx, args)
            throw this;
        }

        stop() {
            try {
                if (this.stopper) this.stopper();
            } catch (e) { }
        }

        toFunction() {
            var that = this;
            return function () {
                return that.run(Array.prototype.slice.call(arguments));
            }
        }

    }

    function toSync(func, async?) {
        var act = new Activity(func, async);
        return act.toFunction();
    }


    //use jThread() or _() to create thread or activity
    //```javascript
    // _(function(){ // create a thread and run it immediately
    //    //thread logic  
    //    var ret = _(function(){ //an inline Activity
    //       //activity logic
    //    });
    //    return ret;
    // },function() {
    //    //finishing logic
    // });
    //``` 
    export function jThread(func1: Function, func2?: Function, onStep?: Function): any {
        if (arguments.length >= 2) {
            var thread = new Thread(func1, func2);
            setTimeout(function () {
                thread.start();
            }, 1);
            if (arguments[2]) thread.onStep = arguments[2];
            return thread;
        } else {
            return toSync(func1, func1.length == 1)();
        }
    }

    var _: any = jThread;

    // to support goto syntax
    //```javascript
    // _.label('start');
    // //...some logic
    // _.go('start'); //jump back to start label 
    //``` 
    _.label = toSync(function (label) {
        var t = Thread.current;
        t.labels[label] = t.step;
    }, false);

    _.go = function (label) {
        var t = Thread.current;
        throw t.labels[label];
    }
    
    //convert a function to Activity, the activity can be used in thread like normal function
    //```javascript
    // var act = _.sync(function(callback){
    //   //...some logic
    //   callback(ret);
    // }); 
    // _.sync(function(callback){//a thread 
    //   act();
    // },function(){}); 
    //``` 
    _.sync = toSync;

    //convert a thread to Activity
    _.syncThread = function (func) {
        return _.sync(function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var thread = _(function () {
                return func.apply(null, args)
            }, callback);
            return function () {//stopper 
                thread.stop();
            };
        });
    };

    _.install = function (name, func, async?) {
        _[name] = toSync(func, async);
    }

    var win: any = window;

    win.$ = win.$ || jThread;
    win._ = win.$ || jThread;




    _.install('sleep', function (delay, callback) {
        setTimeout(callback, delay);
    });

    function pairOrObj(action, key, value) {
        if (typeof key === 'object') {
            Object.keys(key).forEach(function (k) {
                action(k, key[k]);
            });
        } else {
            action(key, value);
        }
    }

    function getElements(ele) {
        var ret = [];
        if (typeof ele == 'string') {
            var nodes = document.querySelectorAll(ele);
            Array.prototype.forEach.call(document.querySelectorAll(ele), function (node) {
                ret.push(node);
            })
        } else {
            ret.push(ele);
        }
        return ret;
    }

    _.install('set', function (obj, key, value) {
        pairOrObj(function (k, v) {
            obj[k] = v;
        }, key, value);
    }, false);

    _.install('css', function (selector, key, value) {
        if (arguments.length == 2 && typeof key == 'string') {//get
            var element = getElements(selector)[0];
            var style = window.getComputedStyle(element);
            return style[key]; 
        }  
        getElements(selector).forEach(function (ele) {
            var obj = ele.style;
            pairOrObj(function (k, v) {
                obj[k] = v;
            }, key, value);
        });
    }, false);

    _.install('attr', function (selector, key, value) {
        if (arguments.length == 2 && typeof key == 'string') {//get
            var element = getElements(selector)[0]; 
            return element.getAttribute(key);
        }  
        getElements(selector).forEach(function (ele) {
            pairOrObj(function (k, v) {
                ele.setAttribute(k, v);
            }, key, value);
        });
    }, false);

    _.install('get', function (obj, key) {
        return obj[key];
    }, false);


    _.install('log', function (message) {
        console.log(message);
    }, false);

    _.install('alert', function (message) {
        window.alert(message);
    }, false);

    _.install('prompt', function (text, defaultText) {
        return window.prompt(text, defaultText);
    }, false);

    _.install('confirm', function (message) {
        return window.confirm(message);
    }, false);

}