'use strict';
function classifyActivity(text,app){
 const escaped=app.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const foreground=new RegExp('(?:topResumedActivity=|mResumedActivity[:=]|ResumedActivity:)\\s*ActivityRecord\\{[^\\r\\n]*\\s'+escaped+'/[^\\r\\n]*').test(text);
 return {foreground,systemUiAnr:/Application Not Responding:\s*com\.android\.systemui\b/.test(text),appAnr:new RegExp('Application Not Responding:\\s*'+escaped+'\\b').test(text),visualUiVerified:false};
}
module.exports={classifyActivity};
