const h=require('../../e2e/local/harness.cjs');
h.run('unitarias/guard-'+(process.argv[2]||'final'),process.execPath,['--test','tests/unit/localTargetGuard.test.cjs'],{allowFailure:true}).then(r=>{process.exitCode=r.exitCode;});
