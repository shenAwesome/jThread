var jt;
(function (jt_1) {
    //this is the way to set Activity's parent thread
    var CurrentThread;
    var Thread = (function () {
        function Thread(func, onFinish) {
            this.func = func;
            this.onFinish = onFinish;
            this.step = 0;
            this.values = []; //values from activies
            this.ctx = {};
            this.labels = {};
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
        Thread.prototype.onStep = function (step) {
            console.log('step(' + step + ')');
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
            thread.onStep(step);
            var that = this;
            function activityFinish(value) {
                if (thread.step == -1)
                    return; //finished already
                if (value === undefined)
                    value = null;
                thread.values[step] = value;
                setTimeout(function () {
                    that.close();
                    thread.next();
                }, 1);
            }
            args.push(activityFinish);
            this.closeHandler = this.func.apply(thread.ctx, args);
            throw this;
        };
        Activity.prototype.close = function () {
            if (this.closeHandler)
                this.closeHandler();
        };
        Activity.prototype.toFunction = function () {
            var that = this;
            return function () {
                return that.run(Array.prototype.slice.call(arguments));
            };
        };
        return Activity;
    })();
    function jt(func1, func2) {
        if (arguments.length == 2) {
            var thread = new Thread(func1, func2);
            setTimeout(function () {
                thread.start();
            }, 1);
            return thread;
        }
        else {
            var act = new Activity(func1, func1.length == 1);
            var value = act.toFunction()();
            return value;
        }
    }
    jt_1.jt = jt;
    jt['label'] = function (label) {
        var t = CurrentThread;
        if (t.values[t.step])
            return;
        t.onStep(t.step);
        t.labels[label] = t.step;
        t.values[t.step] = label;
        t.step++;
    };
    jt['go'] = function (label) {
        var t = CurrentThread;
        throw t.labels[label];
    };
})(jt || (jt = {}));
