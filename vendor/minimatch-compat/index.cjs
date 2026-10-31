'use strict';
// Legacy tools call require('minimatch') directly; newer consumers destructure it.
// Both routes delegate to the unmodified, registry-audited engine.
const engine=require('@riovoley/minimatch-engine');
class Minimatch extends engine.Minimatch {
  constructor(...args){
    super(...args);
    // glob 7 reads _glob and uses String.match(segment). The current engine
    // returns nonrecursive Matcher objects instead of RegExp segments.
    for(const row of this.set)for(const segment of row){
      if(segment&&typeof segment==='object'&&typeof segment.test==='function'){
        Object.defineProperties(segment,{
          _glob:{value:segment.pattern,configurable:true},
          [Symbol.match]:{value:input=>segment.test(String(input))?[String(input)]:null,configurable:true},
        });
      }
    }
  }
}
const callable=(...args)=>engine.minimatch(...args);
Object.assign(callable,engine);
callable.Minimatch=Minimatch;
module.exports=callable;
