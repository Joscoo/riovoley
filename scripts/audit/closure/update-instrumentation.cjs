const fs=require('node:fs');
const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const c=require('../android/context.cjs');
const file='android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java';
fs.copyFileSync(path.join(h.root,file),path.join(c.work,'project',file));
h.write('android/correccion-instrumentacion.json',{file,observedApplicationId:'com.riovoley.app',previousTemplateExpectation:'com.getcapacitor.app',scope:'Se corrige la expectativa del test de plantilla tras observar su fallo real en emulador; no cambia applicationId ni lógica Android.'});
