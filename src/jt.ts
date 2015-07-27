module jt{
	 
	class Thread{ 
		
		static current:Thread; //used to set Activity's parent thread
		
		step = -1
		values = [] //values from activies
		ctx = {} //this for every activity function
		labels = {} //to support goto
		
		private currentActivity:Activity;
		
		constructor(private func:Function, private onFinish:Function){
			var that = this;
			this.onFinish = function(){ 
				that.updateStep(-1);
				onFinish.apply(that,arguments);
			}
		} 
	   
	    next(){
			try{
				Thread.current = this;
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
		
		stop(){
			this.currentActivity.stop();	
			this.onFinish(null);
		}
		
		onStep(step){
			console.log('step('+step+')');
		}  
		
		updateStep(s?){ 
			if (arguments.length) this.step = s;
			this.onStep(this.step);
		}
	}
	
	class Activity{ 
		
		private stopper:Function;
		
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
			var thread = Thread.current ,
				step = thread.step;
			if (thread.values[step] !== undefined) { 
				thread.step++;
                return thread.values[step];
			}
			//run Activity logic if thread reaches here (means it's the first time)
			thread.updateStep();
			var that = this;
			function activityFinish(value){ 
				if (thread.step == -1) return;//finished already
                if (value === undefined) value = null;
				thread.values[step] = value;  
				setTimeout( function(){
                    that.stop();
                    thread.next();
                }, 1);
			}
			args.push(<any>activityFinish); 
			this.stopper = this.func.apply(thread.ctx,args)
			throw this;
		} 
		
		stop(){
			if (this.stopper) this.stopper();
		}
		
		toFunction(){ 
			var that = this;
			return function(){ 
				return that.run(Array.prototype.slice.call(arguments));
			}
		}
		
	} 
	
	function toSync(func,async?){
		var act = new Activity(func,async);
		return act.toFunction(); 
	}
	
	
	export function jt(func1:Function,func2?:Function):any{
		if (arguments.length==2){
			var thread = new Thread(func1,func2);
			setTimeout(function(){
				thread.start();	
			},1); 
			return thread; 
		}else{  
			return toSync(func1,func1.length==1)();
		} 
	} 
	
	
	jt['label'] = toSync(function(label){
		var t = Thread.current ; 
		t.labels[label] = t.step;  
	},false);
	
	jt['go'] = function(label){
		var t = Thread.current ;
		throw t.labels[label];
	}
	
}