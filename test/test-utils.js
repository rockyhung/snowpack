const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const glob = require('glob');
const slash = require('slash');

const STRIP_CHUNKHASH = /([\w\-]+\-)[a-z0-9]{8}(\.js)/g;
const STRIP_REV = /\?rev=\w+/gm;
const STRIP_WHITESPACE = /((\s+$)|((\\r\\n)|(\\n)))/gm;
const UTF8_FRIENDLY_EXTS = [
  'css',
  'html',
  'js',
  'map',
  'jsx',
  'ts',
  'tsx',
  'svelte',
  'svg',
  'vue',
  'json',
]; // only read non-binary files (add more exts here as needed)

/** setup for /tests/build/* */
function setupBuildTest(cwd) {
  return execSync('yarn testbuild', {cwd});
}
exports.setupBuildTest = setupBuildTest;

function getFile(results, TEST_OUT, id) {
  const foundFileLoc = path.resolve(TEST_OUT, id);
  const foundFile = results[foundFileLoc];
  if (!foundFile) {
    console.log(results, id);
    throw new Error(`TEST: Attempted to getFile(${foundFileLoc}) but not found!`);
  }
  return foundFile.contents;
}
exports.getFile = getFile;

/** read a directory of files */
function readFiles(directory, {ignore} = {}) {
  if (!directory) throw new Error(`must specify directory`);

  const contents = {};
  const allFiles = glob.sync(`**/*.{${UTF8_FRIENDLY_EXTS.join(',')}}`, {
    cwd: directory,
    nodir: true,
    dot: true,
    ignore,
  });

  allFiles.forEach((filepath) => {
    const relativePath = filepath.replace(/^\/?/, '/');
    contents[slash(relativePath)] = fs.readFileSync(path.join(directory, filepath), 'utf8');
  });

  return contents;
}
exports.readFiles = readFiles;

/** strip chunk hash from URLs */
function stripChunkhash(code) {
  return code.replace(STRIP_CHUNKHASH, '$1XXXXXXXX$2');
}
exports.stripChunkhash = stripChunkhash;

/** strip ?rev= from URLs */
function stripRev(code) {
  return code.replace(STRIP_REV, '?rev=XXXXXXXXXX');
}
exports.stripRev = stripRev;

/** strip whitespace */
function stripWS(code) {
  return code.replace(STRIP_WHITESPACE, '');
}
exports.stripWS = stripWS;

/** strip benchmark */
function stripBenchmark(stdout) {
  return stdout.replace(/\s*\[\d+\.?\d+s\](\n?)/g, '$1'); //remove benchmark
}
exports.stripBenchmark = stripBenchmark;

/** strip stats */
function stripStats(stdout) {
  // Need to strip leading whitespace to get around strange Node v13 behavior
  return stdout.replace(/\s+[\d\.]*? KB/g, '    XXXX KB');
}
exports.stripStats = stripStats;

/** strip whitespace */
function stripWhitespace(stdout) {
  return stdout.replace(/((\s+$)|((\\r\\n)|(\\n)))/gm, '');
}
exports.stripWhitespace = stripWhitespace;

/** strip chunk hash */
function stripChunkHash(stdout) {
  return stdout.replace(/([\w\-]+\-)[a-z0-9]{8}(\.js)/g, '$1XXXXXXXX$2');
}
exports.stripChunkHash = stripChunkHash;

/** strip URL hash */
function stripUrlHash(stdout) {
  return stdout.replace(/\-[A-Za-z0-9]{20}\//g, 'XXXXXXXX');
}
exports.stripUrlHash = stripUrlHash;

/** strip config error path */
function stripConfigErrorPath(stdout) {
  return stdout.replace(/^\[snowpack\] ! (.*)package\.json$/gm, '! XXX/package.json');
}
exports.stripConfigErrorPath = stripConfigErrorPath;

/** strip resolve error path */
function stripResolveErrorPath(stdout) {
  return stdout.replace(/" via "(.*)"/g, '" via "XXX"');
}
exports.stripResolveErrorPath = stripResolveErrorPath;

/** strip stack trace */
function stripStacktrace(stdout) {
  return stdout.replace(/^\s+at\s+.*/gm, ''); // this is OK to show to the user but annoying to have in a test
}
exports.stripStacktrace = stripStacktrace;

/** strip the svelte comment */
function stripSvelteComment(stdout) {
  return stdout.replace(/^.*generated by Svelte.*$/gm, '/* XXXX generated by Svelte vX.X.X */');
}
exports.stripSvelteComment = stripSvelteComment;

/** strip away the home path */
function stripHomePath(stdout) {
  // Use the split->join trick to replace all instances of a string instead of just the first one
  return stdout.split(process.cwd()).join('XHOMEX').replace(/\\/g, '/');
}
exports.stripHomePath = stripHomePath;

/** strip all of the things */
function stripEverything(output) {
  return stripWhitespace(
    stripHomePath(
      stripConfigErrorPath(
        stripResolveErrorPath(stripBenchmark(stripChunkHash(stripStats(stripStacktrace(output))))),
      ),
    ),
  );
}
exports.stripEverything = stripEverything;

/** strip the lockfile */
function stripLockfile(output) {
  return stripWhitespace(stripUrlHash(output));
}
exports.stripLockfile = stripLockfile;
