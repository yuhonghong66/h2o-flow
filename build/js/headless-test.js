// Generated by CoffeeScript 2.3.2
(function() {
  var excludeFlowName, excludeFlowsArg, excludeFlowsNames, hostname, j, len, main, opts, outputDir, packNames, packsArg, parseOpts, printUsageAndExit, puppeteer, ref, runner, timeout, timeoutArg, waitFor;

  puppeteer = require('puppeteer');

  printUsageAndExit = function(message) {
    console.log(`*** ${message} ***`);
    console.log('Usage: node headless-test.js [--host ip:port] [--timeout seconds] [--packs foo:bar:baz] [--perf date buildId gitHash gitBranch ncpu os jobName outputDir] [--excludeFlows flow1;flow2]');
    console.log('    ip:port      defaults to localhost:54321');
    console.log('    timeout      defaults to 3600');
    console.log('    packs        defaults to examples');
    console.log('    perf         performance of individual tests will be recorded in perf.csv in the output directory');
    return console.log('    excludeFlows do not run these flows');
  };

  parseOpts = function(args) {
    var i, opts;
    console.log(`Using args ${args.join(' ')}`);
    i = 0;
    opts = {};
    while (i < args.length) {
      if (args[i] === "--host") {
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['hostname'] = args[i];
      } else if (args[i] === "--timeout") {
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['timeout'] = args[i];
      } else if (args[i] === "--packs") {
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['packs'] = args[i];
      } else if (args[i] === "--perf") {
        opts['perf'] = true;
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['date'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['buildId'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['gitHash'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['gitBranch'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['ncpu'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['os'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['jobName'] = args[i];
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['outputDir'] = args[i];
      } else if (args[i] === "--excludeFlows") {
        i = i + 1;
        if (i > args.length) {
          printUsageAndExit(`Unknown argument: ${args[i]}`);
        }
        opts['excludeFlows'] = args[i];
      } else {
        printUsageAndExit(`Unknown argument: ${args[i]}`);
      }
      i = i + 1;
    }
    return opts;
  };

  opts = parseOpts(process.argv.slice(2));

  hostname = (ref = opts['hostname']) != null ? ref : 'localhost:54321';

  console.log(`TEST: Using ${hostname}`);

  timeout = (timeoutArg = opts['timeout']) ? 1000 * parseInt(timeoutArg, 10) : 3600000;

  console.log(`TEST: Using timeout ${timeout}ms`);

  packsArg = opts['packs'];

  packNames = packsArg ? packsArg.split(':') : ['examples'];

  excludeFlowsArg = opts['excludeFlows'];

  excludeFlowsNames = excludeFlowsArg ? excludeFlowsArg.split(';') : [];

  for (j = 0, len = excludeFlowsNames.length; j < len; j++) {
    excludeFlowName = excludeFlowsNames[j];
    console.log(`TEST: Excluding flow: ${excludeFlowName}`);
  }

  if (opts['perf']) {
    console.log(`TEST: Performance of individual tests will be recorded in perf.csv in output directory: ${opts['outputDir']}.`);
    outputDir = opts['outputDir'];
  }

  runner = function(packNames, date, buildId, gitHash, gitBranch, hostname, ncpu, os, jobName, perf, excludeFlowsNames) {
    var async, context, runFlow, runPack, runPacks;
    window._date = date;
    window._buildId = buildId;
    window._gitHash = gitHash;
    window._gitBranch = gitBranch;
    window._hostname = hostname;
    window._ncpu = ncpu;
    window._os = os;
    window._jobName = jobName;
    window._perf = perf;
    window._excludeFlowsNames = excludeFlowsNames;
    console.log("getting context from window.flow", window.flow);
    context = window.flow.context;
    async = window.flow.async || window.Flow.Async;
    if (window._phantom_started_) {
      if (window._phantom_exit_) {
        return true;
      } else {
        return false;
      }
    } else {
      runPacks = function(go) {
        var tasks;
        window._phantom_test_summary_ = {};
        tasks = packNames.map(function(packName) {
          return function(go) {
            return runPack(packName, go);
          };
        });
        return (async.iterate(tasks))(go);
      };
      runPack = function(packName, go) {
        console.log(`Fetching pack: ${packName}...`);
        return context.requestPack(packName, function(error, flowNames) {
          var tasks;
          if (error) {
            console.log(`*** ERROR *** Failed fetching pack ${packName}`);
            return go(new Error(`Failed fetching pack ${packName}`, error));
          } else {
            console.log('Processing pack...');
            tasks = flowNames.map(function(flowName) {
              return function(go) {
                return runFlow(packName, flowName, go);
              };
            });
            return (async.iterate(tasks))(go);
          }
        });
      };
      runFlow = function(packName, flowName, go) {
        var doFlow, flowTitle;
        doFlow = function(flowName, excludeFlowsNames) {
          var f, k, len1;
          for (k = 0, len1 = excludeFlowsNames.length; k < len1; k++) {
            f = excludeFlowsNames[k];
            if (flowName === f) {
              return false;
            }
          }
          return true;
        };
        if (doFlow(flowName, window._excludeFlowsNames)) {
          flowTitle = `${packName} - ${flowName}`;
          window._phantom_test_summary_[flowTitle] = 'FAILED';
          console.log(`Fetching flow document: ${packName} - ${flowName}...`);
          return context.requestFlow(packName, flowName, function(error, flow) {
            var waitForFlow;
            if (error) {
              console.log(`*** ERROR *** Failed fetching flow ${flowTitle}`);
              go(new Error(`Failed fetching flow ${flowTitle}`, error));
            } else {
              console.log(`Opening flow ${flowTitle}...`);
              window._phantom_running_ = true;
              // open flow
              context.open(flowTitle, flow);
              waitForFlow = function() {
                var errors;
                console.log(`Waiting for flow ${flowTitle}...`);
                if (window._phantom_running_) {
                  console.log('ACK');
                  return setTimeout(waitForFlow, 2000);
                } else {
                  console.log('Flow completed!');
                  errors = window._phantom_errors_;
                  // delete all keys from the k/v store
                  return context.requestRemoveAll(function() {
                    return go(errors ? errors : null);
                  });
                }
              };
              console.log('Running flow...');
              window._startTime = new Date().getTime() / 1000;
              context.executeAllCells(true, function(status, errors) {
                window._endTime = new Date().getTime() / 1000;
                console.log(`Flow finished with status: ${status}`);
                if (status === 'failed') {
                  window._pass = 0;
                  window._phantom_errors_ = errors;
                } else {
                  window._pass = 1;
                  window._phantom_test_summary_[flowTitle] = 'PASSED';
                }
                if (window._perf) {
                  window._phantom_perf(`${window._date}, ${window._buildId}, ${window._gitHash}, ${window._gitBranch}, ${window._hostname}, ${flowName}, ${window._startTime}, ${window._endTime}, ${window._pass}, ${window._ncpu}, ${window._os}, ${window._jobName}\n`);
                }
                return window._phantom_running_ = false;
              });
            }
            return setTimeout(waitForFlow, 2000);
          });
        } else {
          console.log(`Ignoring flow: ${flowName}`);
          return go(null);
        }
      };
      console.log('Starting tests...');
      window._phantom_errors_ = null;
      window._phantom_started_ = true;
      runPacks(function(error) {
        var ref1;
        if (error) {
          console.log('*** ERROR *** Error running packs');
          window._phantom_errors_ = (ref1 = error.message) != null ? ref1 : error;
        } else {
          console.log('Finished running all packs!');
        }
        return window._phantom_exit_ = true;
      });
      return false;
    }
  };

  waitFor = function(test, browser, onReady) {
    var interval, isComplete, retest, startTime;
    startTime = new Date().getTime();
    isComplete = false;
    retest = async function() {
      if ((new Date().getTime() - startTime < timeout) && !isComplete) {
        console.log('TEST: PING');
        return isComplete = (await test());
      } else {
        clearInterval(interval);
        if (isComplete) {
          return onReady();
        } else {
          console.log('TEST: *** ERROR *** Timeout Exceeded');
          return (await browser.close());
        }
      }
    };
    return interval = setInterval(retest, 2000);
  };

  main = async function() {
    var browser, errorMessage, page, printErrors, response, test;
    browser = (await puppeteer.launch());
    page = (await browser.newPage());
    page.on('requestfailed', function(request) {
      return console.log(`BROWSER: *** REQUEST FAILED *** ${request.method()} ${request.url()}: ${(request.failure().errorText)}`);
    });
    page.on('console', function(message) {
      return console.log(`BROWSER: ${message.text()}`);
    });
    await page.exposeFunction('_phantom_perf', function(perfLine) {
      var fs;
      fs = require('fs');
      return fs.write(outputDir + '/perf.csv', perfLine, 'a');
    });
    response = (await page.goto(`http://${hostname}`));
    if (response.ok()) {
      test = function() {
        return page.evaluate(runner, packNames, opts['date'], opts['buildId'], opts['gitHash'], opts['gitBranch'], hostname, opts['ncpu'], opts['os'], opts['jobName'], opts['perf'], excludeFlowsNames);
      };
      printErrors = function(errors, prefix = '') {
        var error;
        if (errors) {
          if (Array.isArray(errors)) {
            return ((function() {
              var k, len1, results;
              results = [];
              for (k = 0, len1 = errors.length; k < len1; k++) {
                error = errors[k];
                results.push(printErrors(error, prefix + '  '));
              }
              return results;
            })()).join('\n');
          } else if (errors.message) {
            if (errors.cause) {
              return errors.message + '\n' + printErrors(errors.cause, prefix + '  ');
            } else {
              return errors.message;
            }
          } else {
            return errors;
          }
        } else {
          return errors;
        }
      };
      return waitFor(test, browser, async function() {
        var errors, flowTitle, summary, testCount, testStatus;
        errors = (await page.evaluate(function() {
          return window._phantom_errors_;
        }));
        if (errors) {
          console.log('------------------ FAILED -------------------');
          console.log(printErrors(errors));
          console.log('---------------------------------------------');
        } else {
          summary = (await page.evaluate(function() {
            return window._phantom_test_summary_;
          }));
          console.log('------------------ PASSED -------------------');
          testCount = 0;
          for (flowTitle in summary) {
            testStatus = summary[flowTitle];
            console.log(`${testStatus}: ${flowTitle}`);
            testCount++;
          }
          console.log(`(${testCount} tests executed.)`);
          console.log('---------------------------------------------');
        }
        return (await browser.close());
      });
    } else {
      errorMessage = (await response.text());
      console.log(`TEST: *** ERROR *** Failed to load the page. Message: ${errorMessage}`);
      return (await browser.close());
    }
  };

  main();

}).call(this);
