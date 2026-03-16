/**
 * Tests for video module -- ffmpeg availability check, video probing,
 * frame extraction, frame budget planning, and cleanup utilities.
 *
 * Uses node:test mock API to mock child_process.execFileSync so tests
 * do not require ffmpeg/ffprobe to be installed.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('video module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-video-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const video = require('./video.cjs');
    assert.ok(video);
  });

  // ---- SUPPORTED_EXTENSIONS -----------------------------------------------

  describe('SUPPORTED_EXTENSIONS', () => {
    it('is a Set with 5 extensions', () => {
      const { SUPPORTED_EXTENSIONS } = require('./video.cjs');
      assert.ok(SUPPORTED_EXTENSIONS instanceof Set);
      assert.strictEqual(SUPPORTED_EXTENSIONS.size, 5);
    });

    it('includes .mp4, .mov, and .mkv', () => {
      const { SUPPORTED_EXTENSIONS } = require('./video.cjs');
      assert.ok(SUPPORTED_EXTENSIONS.has('.mp4'));
      assert.ok(SUPPORTED_EXTENSIONS.has('.mov'));
      assert.ok(SUPPORTED_EXTENSIONS.has('.mkv'));
    });

    it('includes .avi and .webm', () => {
      const { SUPPORTED_EXTENSIONS } = require('./video.cjs');
      assert.ok(SUPPORTED_EXTENSIONS.has('.avi'));
      assert.ok(SUPPORTED_EXTENSIONS.has('.webm'));
    });

    it('does not include .txt', () => {
      const { SUPPORTED_EXTENSIONS } = require('./video.cjs');
      assert.ok(!SUPPORTED_EXTENSIONS.has('.txt'));
    });
  });

  // ---- checkFfmpeg --------------------------------------------------------

  describe('checkFfmpeg', () => {
    it('returns true when ffmpeg is available', (t) => {
      const cp = require('node:child_process');
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => 'ffmpeg version 8.0');

      const { checkFfmpeg } = require('./video.cjs');
      const result = checkFfmpeg();

      assert.strictEqual(result, true);
      // Verify it was called with ffmpeg -version
      const call = mockExecFileSync.mock.calls.find(
        c => c.arguments[0] === 'ffmpeg' && c.arguments[1]?.[0] === '-version'
      );
      assert.ok(call, 'should call execFileSync with ffmpeg -version');

      mockExecFileSync.mock.restore();
    });

    it('returns false when ffmpeg is not installed (ENOENT)', (t) => {
      const cp = require('node:child_process');
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => {
        const err = new Error('ENOENT');
        err.code = 'ENOENT';
        throw err;
      });

      const { checkFfmpeg } = require('./video.cjs');
      const result = checkFfmpeg();

      assert.strictEqual(result, false);

      mockExecFileSync.mock.restore();
    });
  });

  // ---- probeVideo ---------------------------------------------------------

  describe('probeVideo', () => {
    const validProbeOutput = JSON.stringify({
      streams: [{
        width: 1920,
        height: 1080,
        r_frame_rate: '30/1',
        codec_name: 'h264',
        duration: '45.600000',
      }],
      format: {
        duration: '45.678000',
      },
    });

    it('parses valid ffprobe JSON output correctly', (t) => {
      const cp = require('node:child_process');
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => validProbeOutput);

      const { probeVideo } = require('./video.cjs');
      const result = probeVideo('/fake/video.mp4');

      assert.strictEqual(result.duration, 45.6);
      assert.strictEqual(result.fps, 30);
      assert.strictEqual(result.width, 1920);
      assert.strictEqual(result.height, 1080);
      assert.strictEqual(result.codec, 'h264');

      mockExecFileSync.mock.restore();
    });

    it('parses fractional fps like 24000/1001', (t) => {
      const cp = require('node:child_process');
      const output = JSON.stringify({
        streams: [{
          width: 1280,
          height: 720,
          r_frame_rate: '24000/1001',
          codec_name: 'h264',
          duration: '120.000000',
        }],
        format: { duration: '120.100000' },
      });
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => output);

      const { probeVideo } = require('./video.cjs');
      const result = probeVideo('/fake/video.mp4');

      // 24000/1001 ~= 23.976
      assert.ok(Math.abs(result.fps - 23.976) < 0.01, `fps should be ~23.976, got ${result.fps}`);

      mockExecFileSync.mock.restore();
    });

    it('falls back to format.duration when stream.duration is missing', (t) => {
      const cp = require('node:child_process');
      const output = JSON.stringify({
        streams: [{
          width: 640,
          height: 480,
          r_frame_rate: '30/1',
          codec_name: 'mpeg4',
          // no duration field in stream
        }],
        format: {
          duration: '90.500000',
        },
      });
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => output);

      const { probeVideo } = require('./video.cjs');
      const result = probeVideo('/fake/video.mp4');

      assert.strictEqual(result.duration, 90.5);

      mockExecFileSync.mock.restore();
    });

    it('throws when ffprobe fails', (t) => {
      const cp = require('node:child_process');
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => {
        throw new Error('ffprobe exited with code 1');
      });

      const { probeVideo } = require('./video.cjs');
      assert.throws(() => probeVideo('/fake/nonexistent.mp4'));

      mockExecFileSync.mock.restore();
    });

    it('handles 0/0 fps edge case by defaulting to 30', (t) => {
      const cp = require('node:child_process');
      const output = JSON.stringify({
        streams: [{
          width: 1920,
          height: 1080,
          r_frame_rate: '0/0',
          codec_name: 'h264',
          duration: '60.000000',
        }],
        format: { duration: '60.000000' },
      });
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => output);

      const { probeVideo } = require('./video.cjs');
      const result = probeVideo('/fake/video.mp4');

      assert.strictEqual(result.fps, 30);

      mockExecFileSync.mock.restore();
    });
  });

  // ---- extractFrames ------------------------------------------------------

  describe('extractFrames', () => {
    it('calls ffmpeg with correct args and returns frame list', (t) => {
      const cp = require('node:child_process');
      const outputDir = path.join(tmpDir, 'frames');
      fs.mkdirSync(outputDir, { recursive: true });

      // Simulate ffmpeg output: create dummy frame files
      fs.writeFileSync(path.join(outputDir, 'frame-0001.jpg'), 'fake');
      fs.writeFileSync(path.join(outputDir, 'frame-0002.jpg'), 'fake');
      fs.writeFileSync(path.join(outputDir, 'frame-0003.jpg'), 'fake');

      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => '');

      const { extractFrames } = require('./video.cjs');
      const result = extractFrames('/fake/video.mp4', outputDir);

      assert.strictEqual(result.frameCount, 3);
      assert.strictEqual(result.outputDir, outputDir);
      assert.deepStrictEqual(result.files, ['frame-0001.jpg', 'frame-0002.jpg', 'frame-0003.jpg']);

      // Verify ffmpeg was called with correct filter (default fps=0.5)
      const call = mockExecFileSync.mock.calls.find(
        c => c.arguments[0] === 'ffmpeg'
      );
      assert.ok(call, 'should call execFileSync with ffmpeg');
      const args = call.arguments[1];
      const vfIndex = args.indexOf('-vf');
      assert.ok(vfIndex >= 0, 'should have -vf flag');
      assert.ok(args[vfIndex + 1].includes('fps=0.5'), 'default fps should be 0.5');

      mockExecFileSync.mock.restore();
    });

    it('respects custom fps option', (t) => {
      const cp = require('node:child_process');
      const outputDir = path.join(tmpDir, 'frames-custom');
      fs.mkdirSync(outputDir, { recursive: true });

      fs.writeFileSync(path.join(outputDir, 'frame-0001.jpg'), 'fake');

      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => '');

      const { extractFrames } = require('./video.cjs');
      extractFrames('/fake/video.mp4', outputDir, { fps: 1.0 });

      const call = mockExecFileSync.mock.calls.find(
        c => c.arguments[0] === 'ffmpeg'
      );
      const args = call.arguments[1];
      const vfIndex = args.indexOf('-vf');
      assert.ok(args[vfIndex + 1].includes('fps=1'), 'should use custom fps=1');

      mockExecFileSync.mock.restore();
    });

    it('returns sorted file list', (t) => {
      const cp = require('node:child_process');
      const outputDir = path.join(tmpDir, 'frames-sort');
      fs.mkdirSync(outputDir, { recursive: true });

      // Create files in reverse order
      fs.writeFileSync(path.join(outputDir, 'frame-0003.jpg'), 'fake');
      fs.writeFileSync(path.join(outputDir, 'frame-0001.jpg'), 'fake');
      fs.writeFileSync(path.join(outputDir, 'frame-0002.jpg'), 'fake');

      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => '');

      const { extractFrames } = require('./video.cjs');
      const result = extractFrames('/fake/video.mp4', outputDir);

      assert.deepStrictEqual(result.files, ['frame-0001.jpg', 'frame-0002.jpg', 'frame-0003.jpg']);

      mockExecFileSync.mock.restore();
    });

    it('creates output directory if it does not exist', (t) => {
      const cp = require('node:child_process');
      const outputDir = path.join(tmpDir, 'new-frames-dir');

      // Mock ffmpeg -- the function should create the dir before calling ffmpeg
      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => {
        // Simulate ffmpeg creating a frame file
        fs.writeFileSync(path.join(outputDir, 'frame-0001.jpg'), 'fake');
        return '';
      });

      const { extractFrames } = require('./video.cjs');
      const result = extractFrames('/fake/video.mp4', outputDir);

      assert.ok(fs.existsSync(outputDir), 'output directory should exist');
      assert.strictEqual(result.frameCount, 1);

      mockExecFileSync.mock.restore();
    });

    it('throws when ffmpeg fails', (t) => {
      const cp = require('node:child_process');
      const outputDir = path.join(tmpDir, 'frames-fail');

      const mockExecFileSync = t.mock.method(cp, 'execFileSync', () => {
        throw new Error('ffmpeg encoding error');
      });

      const { extractFrames } = require('./video.cjs');
      assert.throws(() => extractFrames('/fake/video.mp4', outputDir));

      mockExecFileSync.mock.restore();
    });
  });

  // ---- planFrameExtraction ------------------------------------------------

  describe('planFrameExtraction', () => {
    it('short clip: duration=30, fps=0.5 -> all 15 frames', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(30, { fps: 0.5 });

      assert.strictEqual(plan.extractFps, 0.5);
      assert.strictEqual(plan.totalExtracted, 15);
      assert.strictEqual(plan.analyzeCount, 15);
      assert.strictEqual(plan.sampleIndices.length, 15);
    });

    it('medium clip: duration=120, fps=0.5 -> 60 extracted, 40 analyzed', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(120, { fps: 0.5 });

      assert.strictEqual(plan.totalExtracted, 60);
      assert.strictEqual(plan.analyzeCount, 40);
      assert.strictEqual(plan.sampleIndices.length, 40);
    });

    it('long video: duration=600, fps=0.5 -> 300 extracted, 40 analyzed', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(600, { fps: 0.5 });

      assert.strictEqual(plan.totalExtracted, 300);
      assert.strictEqual(plan.analyzeCount, 40);
      assert.strictEqual(plan.sampleIndices.length, 40);
    });

    it('custom fps: duration=60, fps=1.0 -> 60 extracted, 40 analyzed', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(60, { fps: 1.0 });

      assert.strictEqual(plan.totalExtracted, 60);
      assert.strictEqual(plan.analyzeCount, 40);
    });

    it('custom maxFrames: duration=60, fps=0.5, maxFrames=10 -> 10 analyzed', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(60, { fps: 0.5, maxFrames: 10 });

      assert.strictEqual(plan.totalExtracted, 30);
      assert.strictEqual(plan.analyzeCount, 10);
      assert.strictEqual(plan.sampleIndices.length, 10);
    });

    it('sampleIndices are uniformly distributed', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(600, { fps: 0.5 });

      // First index should be 0
      assert.strictEqual(plan.sampleIndices[0], 0);
      // Last index should be < totalExtracted
      assert.ok(plan.sampleIndices[plan.sampleIndices.length - 1] < plan.totalExtracted);
      // Indices should be monotonically increasing
      for (let i = 1; i < plan.sampleIndices.length; i++) {
        assert.ok(plan.sampleIndices[i] > plan.sampleIndices[i - 1],
          `Index ${i} (${plan.sampleIndices[i]}) should be > index ${i - 1} (${plan.sampleIndices[i - 1]})`);
      }
    });

    it('uses default fps=0.5 and maxFrames=40 when no options given', () => {
      const { planFrameExtraction } = require('./video.cjs');
      const plan = planFrameExtraction(100);

      assert.strictEqual(plan.extractFps, 0.5);
      assert.strictEqual(plan.totalExtracted, 50);
      assert.strictEqual(plan.analyzeCount, 40);
    });
  });

  // ---- cleanupFrames ------------------------------------------------------

  describe('cleanupFrames', () => {
    it('removes directory with files', () => {
      const { cleanupFrames } = require('./video.cjs');

      const frameDir = path.join(tmpDir, 'cleanup-test');
      fs.mkdirSync(frameDir);
      fs.writeFileSync(path.join(frameDir, 'frame-0001.jpg'), 'fake');
      fs.writeFileSync(path.join(frameDir, 'frame-0002.jpg'), 'fake');

      const result = cleanupFrames(frameDir);

      assert.strictEqual(result.cleaned, true);
      assert.strictEqual(result.path, frameDir);
      assert.ok(!fs.existsSync(frameDir), 'directory should be removed');
    });

    it('returns cleaned=false for non-existent directory without error', () => {
      const { cleanupFrames } = require('./video.cjs');
      const nonExistent = path.join(tmpDir, 'does-not-exist');

      const result = cleanupFrames(nonExistent);

      assert.strictEqual(result.cleaned, false);
      assert.strictEqual(result.path, nonExistent);
    });
  });
});
