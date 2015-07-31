var jt;
(function (jt_1) {
    //this is the way to set Activity's parent thread
    var CurrentThread;
    var Thread = (function () {
        function Thread(func, onFinish) {
            this.func = func;
            this.onFinish = onFinish;
            this.step = -1;
            this.values = []; //values from activies
            this.ctx = {}; //this for every activity function
            this.labels = {}; //to support goto
            var that = this;
            this.onFinish = function () {
                that.updateStep(-1);
                onFinish.apply(that, arguments);
            };
        }
        Thread.prototype.next = function () {
            try {
                CurrentThread = this;
                var ret = this.func.call(this);
                if (this.onFinish(ret)) {
                    this.start();
                }
            }
            catch (e) {
                this.step = 0;
                if (e === parseInt(e, 10)) {
                    var to = e;
                    this.values.length = e;
                    this.next();
                }
                else {
                    if (e instanceof Activity) {
                        this.currentActivity = e;
                    }
                    else {
                        throw e;
                    }
                }
            }
        };
        Thread.prototype.start = function () {
            this.step = 0;
            this.values.length = 0;
            this.next();
        };
        Thread.prototype.stop = function () {
            this.currentActivity.stopHandler();
            this.onFinish(null);
        };
        Thread.prototype.onStep = function (step) {
            console.log('step(' + step + ')');
        };
        Thread.prototype.updateStep = function (s) {
            if (arguments.length)
                this.step = s;
            this.onStep(this.step);
        };
        return Thread;
    })();
    var Activity = (function () {
        function Activity(func, async) {
            if (async === void 0) { async = true; }
            this.func = func;
            if (!async) {
                var func_ = func;
                this.func = function () {
                    var args = Array.prototype.slice.call(arguments);
                    var callback = args.pop();
                    var ret = func_.apply(this, args);
                    callback(ret);
                };
            }
        }
        Activity.prototype.run = function (args) {
            var thread = CurrentThread, step = thread.step;
            if (thread.values[step] !== undefined) {
                thread.step++;
                return thread.values[step];
            }
            //run Activity logic if thread reaches here (means it's the first time)
            thread.updateStep();
            var that = this;
            function activityFinish(value) {
                if (thread.step == -1)
                    return; //finished already
                if (value === undefined)
                    value = null;
                thread.values[step] = value;
                setTimeout(function () {
                    that.stop();
                    thread.next();
                }, 1);
            }
            args.push(activityFinish);
            this.stopHandler = this.func.apply(thread.ctx, args);
            throw this;
        };
        Activity.prototype.stop = function () {
            if (this.stopHandler)
                this.stopHandler();
        };
        Activity.prototype.toFunction = function () {
            var that = this;
            return function () {
                return that.run(Array.prototype.slice.call(arguments));
            };
        };
        return Activity;
    })();
    function toSync(func, async) {
        var act = new Activity(func, async);
        return act.toFunction();
    }
    function jt(func1, func2) {
        if (arguments.length == 2) {
            var thread = new Thread(func1, func2);
            setTimeout(function () {
                thread.start();
            }, 1);
            return thread;
        }
        else {
            return toSync(func1, func1.length == 1)();
        }
    }
    jt_1.jt = jt;
    jt['label'] = toSync(function (label) {
        var t = CurrentThread;
        t.labels[label] = t.step;
    }, false);
    jt['go'] = function (label) {
        var t = CurrentThread;
        throw t.labels[label];
    };
})(jt || (jt = {}));
