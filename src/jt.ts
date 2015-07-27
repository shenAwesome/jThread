module jt{
	
	//this is the way to set Activity's parent thread
	var CurrentThread:Thread;
	
	class Thread{ 
		
		step = 0
		values = []; //values from activies
		ctx = {}
		labels = {}
		
		private currentActivity:Activity;
		
		constructor(private func:Function, private onFinish:Function){
			
		} 
	   
	    next(){
			try{
				CurrentThread = this;
				var ret = this.func.call(this);
				if (this.onFinish(ret)){//repeat if onFinish return true
					this.start();
				} 
			}catch(e){ 
				 this.step = 0;
				 if (e === parseInt(e, 10)) {//go to the step if it's a number
					var to:Number = e;
                    this.values.length = e; 
                    this.next();
                } else {//an activity is runing, waiting for it
                    if (e instanceof Activity){
						this.currentActivity = e; 
					}else{
						throw e;
					}
                }
			} 
		} 
		 
		start(){
			this.step = 0;
			this.values.length = 0;
			this.next();
		} 
		
		onStep(step){
			console.log('step('+step+')');
		}  
	}
	
	class Activity{ 
		closeHandler:Function;
		constructor(private func:Function, async = true){
			if (!async){
				var func_ = func;
				this.func = function(){
					var args = Array.prototype.slice.call(arguments); 
                	var callback = args.pop();
					var ret = func_.apply(this,args); 
					callback(ret);
				} 
			} 
		} 
		run(args:Array<any>[]){
			var thread = CurrentThread,
				step = thread.step;
			if (thread.values[step] !== undefined) { 
				thread.step++;
                return thread.values[step];
			}
			
			thread.onStep(step);
			var that = this;
			function activityFinish(value){ 
				if (thread.step == -1) return;//finished already
                if (value === undefined) value = null;
				thread.values[step] = value;  
				setTimeout( function(){
                    that.close();
                    thread.next();
                }, 1);
			}
			args.push(<any>activityFinish); 
			this.closeHandler = this.func.apply(thread.ctx,args)
			throw this;
		} 
		close(){
			if (this.closeHandler) this.closeHandler();
		}
		
		toFunction(){ 
			var that = this;
			return function(){ 
				return that.run(Array.prototype.slice.call(arguments));
			}
		}
		
		
	} 
	
	export function jt(func1:Function,func2?:Function):any{
		if (arguments.length==2){
			var thread = new Thread(func1,func2);
			setTimeout(function(){
				thread.start();	
			},1); 
			return thread; 
		}else{
			var act = new Activity(func1,func1.length==1);
			var value = act.toFunction()(); 
			return value;
		} 
	} 
	
	
	jt['label'] = function(label){
		var t = CurrentThread;
		if (t.values[t.step]) return;
		t.onStep(t.step);
		t.labels[label] = t.step; 
		t.values[t.step] = label;
		t.step ++;
	} 
	
	jt['go'] = function(label){
		var t = CurrentThread;
		throw t.labels[label];
	} 
	
	
}