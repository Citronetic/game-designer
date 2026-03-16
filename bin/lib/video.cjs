/**
 * Video -- Video processing utilities for Game Forge
 *
 * Wraps ffmpeg/ffprobe via child_process.execFileSync to provide:
 * - ffmpeg availability checking
 * - Video metadata extraction (duration, fps, resolution, codec)
 * - Configurable frame extraction with fps filter
 * - Frame budget planning for short/medium/long videos
 * - Temp directory cleanup
 *
 * All functions use Node.js builtins only (zero external deps).
 * ffmpeg/ffprobe must be available on system PATH.
 */

const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * Supported video file extensions for validation.
 * @type {Set<string>}
 */
const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.webm', '.mkv']);

// ─── ffmpeg availability ────────────────────────────────────────────────────

/**
 * Check if ffmpeg is available on the system PATH.
 * Does NOT throw errors -- returns boolean.
 *
 * @returns {boolean} true if ffmpeg is installed and accessible
 */
function checkFfmpeg() {
  try {
    cp.execFileSync('ffmpeg', ['-version'], { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// ─── Video probing ──────────────────────────────────────────────────────────

/**
 * Probe video file for metadata (duration, fps, resolution, codec).
 *
 * @param {string} videoPath - Absolute path to video file
 * @returns {{duration: number, fps: number, width: number, height: number, codec: string}}
 * @throws {Error} if videoPath does not exist or ffprobe fails
 */
function probeVideo(videoPath) {
  const result = cp.execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate,codec_name,duration',
    '-show_entries', 'format=duration',
    '-print_format', 'json',
    videoPath,
  ], { encoding: 'utf-8', timeout: 30000, stdio: 'pipe' });

  const data = JSON.parse(result);
  const stream = data.streams?.[0] || {};
  const format = data.format || {};

  // r_frame_rate is a fraction like "30/1" or "24000/1001"
  const fpsStr = stream.r_frame_rate || '30/1';
  const [num, den] = fpsStr.split('/').map(Number);
  // Handle 0/0 edge case by defaulting to 30
  const fps = (den && num) ? num / den : 30;

  const duration = parseFloat(stream.duration || format.duration || '0');

  return {
    duration,
    fps,
    width: stream.width || 0,
    height: stream.height || 0,
    codec: stream.codec_name || 'unknown',
  };
}

// ─── Frame extraction ───────────────────────────────────────────────────────

/**
 * Extract frames from video at specified fps.
 * Creates outputDir if it does not exist.
 *
 * @param {string} videoPath - Absolute path to video file
 * @param {string} outputDir - Directory to write frame-NNNN.jpg files
 * @param {object} [options={}] - { fps: number }
 * @returns {{frameCount: number, outputDir: string, files: string[]}}
 * @throws {Error} if ffmpeg fails
 */
function extractFrames(videoPath, outputDir, options = {}) {
  const fps = options.fps || 0.5;

  fs.mkdirSync(outputDir, { recursive: true });

  const outputPattern = path.join(outputDir, 'frame-%04d.jpg');

  cp.execFileSync('ffmpeg', [
    '-i', videoPath,
    '-vf', `fps=${fps},scale='min(1024,iw)':-1`,
    '-q:v', '5',
    '-vsync', 'vfr',
    outputPattern,
  ], {
    encoding: 'utf-8',
    timeout: 300000, // 5 minutes
    stdio: 'pipe',
  });

  // Count and sort extracted frames
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
    .sort();

  return {
    frameCount: files.length,
    outputDir,
    files,
  };
}

// ─── Frame budget planning ──────────────────────────────────────────────────

/**
 * Calculate frame extraction plan based on video duration and options.
 *
 * Short clips: extract all at configured fps, analyze all.
 * Medium/long videos: extract all, uniformly sample down to budget.
 *
 * Pure function -- no I/O.
 *
 * @param {number} duration - Video duration in seconds
 * @param {object} [options={}] - { fps: number, maxFrames: number }
 * @returns {{extractFps: number, totalExtracted: number, analyzeCount: number, sampleIndices: number[]}}
 */
function planFrameExtraction(duration, options = {}) {
  const fps = options.fps || 0.5;
  const maxFrames = options.maxFrames || 40;

  const totalExtracted = Math.ceil(duration * fps);

  if (totalExtracted <= maxFrames) {
    // Use all frames
    return {
      extractFps: fps,
      totalExtracted,
      analyzeCount: totalExtracted,
      sampleIndices: Array.from({ length: totalExtracted }, (_, i) => i),
    };
  }

  // Uniform sampling: pick maxFrames evenly distributed
  const step = totalExtracted / maxFrames;
  const sampleIndices = [];
  for (let i = 0; i < maxFrames; i++) {
    sampleIndices.push(Math.round(i * step));
  }

  return {
    extractFps: fps,
    totalExtracted,
    analyzeCount: maxFrames,
    sampleIndices,
  };
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

/**
 * Remove extracted frame directory.
 * No error if directory does not exist.
 *
 * @param {string} frameDir - Path to frame directory to remove
 * @returns {{cleaned: boolean, path: string}}
 */
function cleanupFrames(frameDir) {
  try {
    if (fs.existsSync(frameDir)) {
      fs.rmSync(frameDir, { recursive: true, force: true });
      return { cleaned: true, path: frameDir };
    }
    return { cleaned: false, path: frameDir };
  } catch {
    return { cleaned: false, path: frameDir };
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  checkFfmpeg,
  probeVideo,
  extractFrames,
  planFrameExtraction,
  cleanupFrames,
  SUPPORTED_EXTENSIONS,
};
