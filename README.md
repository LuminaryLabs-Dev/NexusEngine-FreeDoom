# NexusEngine FreeDoom

A focused NexusEngine runtime package for launching and testing FreeDoom through a Doom-compatible engine without rebuilding Doom gameplay inside NexusEngine.

## Intent

- NexusEngine owns startup, lifecycle, input, presentation, audio, storage, diagnostics, and testing.
- A Doom-compatible runtime owns Doom simulation and gameplay behavior.
- FreeDoom supplies the freely distributable game content.
- The browser application proves the complete path works end to end.

## Domain structure

```txt
n:freedoom
├─ n:freedoom:runtime
├─ n:freedoom:content
├─ n:freedoom:presentation
├─ n:freedoom:interaction
├─ n:freedoom:persistence
├─ n:freedoom:session
├─ n:freedoom:diagnostics
└─ n:freedoom:validation
```

## FreeDoom parent domain

### `freedoom-domain-kit`

Owns installation, lifecycle, coordination, readiness, reset, disposal, and the combined runtime snapshot.

```txt
prepare()
start()
pause()
resume()
restart()
stop()
snapshot()
dispose()
```

## Runtime domain

### `doom-runtime-kit`

Loads, creates, runs, stops, isolates, and disposes the Doom-compatible runtime.

### `doom-runtime-bridge-kit`

Carries commands, events, framebuffer data, audio buffers, save files, and status between NexusEngine and the runtime.

### `doom-runtime-clock-kit`

Owns fixed stepping, browser synchronization, pause, background suspension, runaway-frame protection, and timing evidence.

## Content domain

### `freedoom-content-kit`

Describes and exposes the packaged FreeDoom WAD, verifies its identity, and reports version and license metadata.

### `runtime-content-mount-kit`

Mounts the WAD read-only, exposes writable save/config paths, normalizes paths, and unmounts cleanly.

### `content-license-kit`

Owns FreeDoom and runtime license files, attribution, source references, and build-time license validation.

## Presentation domain

### `doom-framebuffer-kit`

Receives indexed or RGBA frames, tracks dimensions and pitch, exposes frame snapshots, and rejects malformed buffers.

### `doom-screen-kit`

Owns canvas creation, pixel-perfect scaling, aspect ratio, viewport fitting, fullscreen, and smoothing preferences.

### `doom-palette-kit`

Required only for indexed frames. Owns palettes, indexed-to-RGBA conversion, palette changes, and screen flashes.

## Interaction domain

### `doom-input-kit`

Owns keyboard, mouse, pointer lock, controller input, focus loss, and input clearing on pause.

### `doom-control-profile-kit`

Owns semantic actions, default bindings, rebinding, controller mapping, runtime key translation, and stored preferences.

```txt
move
strafe
turn
look
fire
use
run
map
pause
weapon select
```

## Audio domain

### `doom-audio-kit`

Owns PCM intake, Web Audio playback, resampling, buffering, volume, suspension, and underrun reporting.

### `doom-music-kit`

Add only when music is not already mixed by the runtime. Owns MIDI/MUS playback, volume, track lifecycle, and fallback behavior.

## Persistence domain

### `doom-storage-kit`

Owns save games, configuration, controls, IndexedDB persistence, import/export, and storage versioning.

### `doom-save-sync-kit`

Detects changed files, flushes safely, restores before startup, prevents partial writes, and reports save status.

## Session domain

### `freedoom-session-kit`

Owns the user-facing play session.

```txt
idle
preparing
ready
running
paused
failed
stopped
```

### `freedoom-startup-kit`

Runs startup in order:

```txt
validate environment
load runtime
verify content
mount filesystem
restore saves
connect input
connect video
connect audio
start runtime
verify first frame
enter running state
```

## Diagnostics domain

### `freedoom-diagnostics-kit`

Tracks startup phase, readiness, first-frame time, frame rate, audio underruns, dropped ticks, memory, saves, and last failure.

### `freedoom-failure-kit`

Normalizes failures:

```txt
runtime unavailable
content missing
content invalid
framebuffer invalid
audio unavailable
storage unavailable
startup timeout
runtime crash
```

## Validation domain

### `freedoom-validation-kit`

Owns environment, package, runtime boot, content mount, first-frame, input, audio, save, restart, and disposal validation.

### `freedoom-smoke-test-kit`

Runs one complete playable path:

```txt
load application
prepare runtime
mount FreeDoom WAD
start game
wait for first frame
send menu input
start a level
move player
fire weapon
pause
resume
save
restart runtime
restore save
stop
release resources
```

### `freedoom-test-observer-kit`

Collects lifecycle events, frame checksums, audio activity, accepted inputs, filesystem writes, runtime errors, and disposal evidence.

## Test layers

### Unit tests

- domain installation
- lifecycle transitions
- input mapping
- path normalization
- content manifest validation
- framebuffer validation
- audio-buffer validation
- save synchronization
- failure normalization

### Integration tests

- runtime module loads
- FreeDoom WAD mounts
- runtime reads mounted content
- first frame reaches the canvas
- input reaches the runtime
- pointer lock resets correctly
- audio reaches Web Audio
- saves survive runtime restart
- pause suspends execution and audio
- disposal releases workers, audio nodes, and canvas resources

### Browser smoke tests

Run in Chromium, Firefox, and Safari.

Verify:

- page loads without console errors
- game reaches the menu
- game reaches a playable level
- controls respond
- sound starts after user gesture
- fullscreen works
- resize preserves aspect ratio
- save and reload work
- refresh restores stored files

### Continuous integration

CI verifies:

- install
- typecheck
- lint
- unit tests
- integration tests
- production build
- required licenses
- content manifest
- browser first-frame smoke test
- absence of proprietary Doom WAD files

## Repository structure

```txt
NexusEngine-FreeDoom/
├─ src/
│  ├─ domains/
│  │  ├─ freedoom/
│  │  ├─ runtime/
│  │  ├─ content/
│  │  ├─ presentation/
│  │  ├─ interaction/
│  │  ├─ audio/
│  │  ├─ persistence/
│  │  ├─ session/
│  │  ├─ diagnostics/
│  │  └─ validation/
│  ├─ app/
│  └─ index.js
├─ public/content/
├─ tests/unit/
├─ tests/integration/
├─ tests/browser/
├─ licenses/
├─ scripts/
├─ .github/workflows/
├─ package.json
└─ README.md
```

## Implementation order

1. Establish the parent domain and lifecycle contract.
2. Select and compile the Doom-compatible runtime.
3. Add the runtime bridge and clock.
4. Package and mount the FreeDoom WAD.
5. Present the first framebuffer.
6. Connect keyboard and mouse input.
7. Connect Web Audio.
8. Add persistent saves and configuration.
9. Add diagnostics and normalized failures.
10. Add the end-to-end smoke test.
11. Add cross-browser validation.
12. Add license and proprietary-content checks.

## Completion contract

The repository is ready when a clean browser session can:

- load the packaged runtime
- mount the packaged FreeDoom WAD
- reach the FreeDoom menu
- begin a playable level
- accept keyboard and mouse input
- produce stable video and audio
- save and restore progress
- restart without leaking resources
- pass automated browser smoke tests
- ship with all required licenses
- contain no original commercial Doom game data
