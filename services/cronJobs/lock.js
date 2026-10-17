/*
 *   Copyright (c) 2020 Ratio Software, LLC
 *   All rights reserved.
 *   @author Clayton Gulick <clay@ratiosoftware.com>
 */
const lockfile = require('proper-lockfile');

module.exports = async function(name, fn) {
  let release;
  let executionError;
  try {
    const locked = await lockfile.check(name);
    if (locked) return 'locked';

    release = await lockfile.lock(name);
  } catch (err) {
    console.error(`Failed to aquire lock: ${name}, error: ${err}`);
    throw new Error(`Failed to aquire lock: ${name}, error: ${err}`);
  }

  try {
    await fn();
  } catch (err) {
    console.error(`Failed to execute lock function: ${err}`);
    executionError = err;
  }

  try {
    await release();
  } catch (err) {
    console.error(`Failed to release lock: ${name}, error: ${err}`);
    throw err;
  }

  if (executionError) throw executionError;

  return executionError;
};
