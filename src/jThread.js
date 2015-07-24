/*-------------------mimic thread--------------------------------------------------------------------------------------------------*/
(function () {
    var currentWorker;
    /** mimic sync behavior*/
    function run(func, onFinish) {
        var currenFuncHandle = null;
        function next() {
            try {
                currentWorker = worker;
                var ret = func.call();
                //check if the flow needs to be repeated 
                if (onFinish(ret)) {
                    worker.step = 0;
                    worker.act.length = 0;
                    next();
                }
                worker.onStep(-1);
            } catch (e) {
                if (e === parseInt(e, 10)) {//go to the step if it's a number
                    worker.act.length = e;
                    worker.step = 0;
                    //if (worker.log) console.log('goto ' + e)
                    next();
                } else {//an activity is runing, waiting for it
                    if (!e.isHandle) throw e;
                    currenFuncHandle = e;
                    worker.step = 0;
                }
            }
        }
        var worker = {
            onStep: function (step) {
                //console.log(step);
            },
            step: 0,
            act: [],
            next: next,
            ctx: {},
            cancel: function () {//stop the worker and inform the current running function
                currenFuncHandle && currenFuncHandle();
                worker.next = function () { };
                worker.onStep(-1);
                onFinish();
            }
        };
        setTimeout(next, 1);
        return worker;
    }
    /** convert async function to sync style, to be used in run*/
    function sync(func) {
        return function () {
            var c = currentWorker;
            var idx = c.step;
            //to stop this activity from outside, it is also called when activity finishes
            var closeHandle;
            function finish(value) {
                if (value === undefined) value = null;
                c.act[idx] = value;
                setTimeout(function () {
                    closeHandle();
                    c.next();
                }, 1);
            }
            finish['ctx'] = c.ctx;
            if (c.act[idx] === undefined) {
                c.onStep(c.step);
                var args = Array.prototype.slice.call(arguments);
                args.push(finish);
                closeHandle = func.apply(c.ctx, args) || function () { };
                //throw the current function handle.
                closeHandle.isHandle = true;
                throw closeHandle;
            } else {
                c.step++;
                return c.act[idx];
            }
        }
    }

    //short cuts for run() and sync(func)();
    function main() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length == 2) {
            return run(args[0], args[1]);
        } else {
            var func = args[0];
            if (func.length == 0) {//no arguments, then it is just a normal sync block
                func = function (callback) {
                    var ret = args[0]();
                    callback(ret);
                }
            }
            sync(func)();
        }
    }

    //convert a normal function to sync function, if name is given, it is added to the global 'main'
    function install(func, name, autoFinish) {
        var func_;
        if (autoFinish) {
            func_ = sync(function () {
                var args = Array.prototype.slice.call(arguments);
                var callback = args.pop();
                func.apply(null, args);
                callback();
            });
        } else {
            func_ = sync(func);
        }

        if (name) main[name] = func_;
        return func;
    }

    main.sync = install;

    window.jThread = main;
}());

/**------------------batteries*/

(function () {
    var $ = window.jThread;

    $.sync(function (msg) {
        alert(msg);
    }, 'alert', true);

    $.sync(function (msg) {
        console.log(msg);
    }, 'log', true);

    $.sync(function (ele, html) {
        getEle(ele).innerHTML = html;
    }, 'html', true);

    $.sync(function (time, callback) {
        setTimeout(function () {
            callback();
        }, time);
    }, 'sleep');

    function getEle(ele) {
        if (typeof ele == 'string') {
            ele = document.querySelector(ele);
        }
        return ele;
    }
    //ele,key,value,each or ele,obj,each
    function pairOrObj(args, each) {
        var ele = getEle(arg[0]);
        var obj;
        if (args.length == 3) {//read key value from an object, igrnoe the callback.
            obj = args[1];
        } else {
            obj = {};
            obj[args[1]] = args[2];
        }
        Object.keys(obj).forEach(function (k) {
            each(ele, k, obj[k]);
        });
    }

    $.sync(function (ele, key, value) {
        pairOrObj(arguments, function (ele, k, v) {
            ele.style[k] = obj[k];
        });
        callback();
    }, 'css', true);

    $.sync(function (ele, key, value) {
        pairOrObj(arguments, function (ele, k, v) {
            ele.setAttribute(k, v);
        });
    }, 'attr', true);


    function ajax(url, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                function parse(str) {
                    try { str = JSON.parse(str); } catch (e) { }
                    return str
                }
                callback(xmlhttp.status != 404 ? parse(xmlhttp.responseText) : null);
            }
        }
        xmlhttp.open("GET", url, true);
        setTimeout(function () {
            xmlhttp.send();
        }, 1);
    }

    function getJson(server, data, callback) {
        if (arguments.length == 2) {
            callback = data; data = {};
        }
        var jsonpCallback = data.callback;
        var params = [],
            k;
        for (k in data) {
            params.push(k + '=' + encodeURI(data[k]));
        }
        var url = server + '?' + params.join('&');
        if (jsonpCallback) {
            var script = document.createElement('script');
            script.src = url;
            window[jsonpCallback] = callback;
            document.body.appendChild(script);
        } else {
            ajax(url, callback);
        }
    }

    $.sync(ajax, 'ajax');
    $.sync(getJson, 'getJson');

}());