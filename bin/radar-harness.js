#!/usr/bin/env node

"use strict";

require("../harness/src/cli").main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
