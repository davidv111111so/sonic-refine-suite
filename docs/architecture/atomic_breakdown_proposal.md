# Codebase Review: Atomic Breakdown Proposal

**Reviewer**: @speckit.reviewer
**Targets**: `src/hooks/useWebAudio.ts`, `python-backend/main.py`
**Objective**: Adhere to Antigravity core principles (Atomicity, Progressive Disclosure, Modular Logic) by decomposing monolithic structures.

---

## 1. `useWebAudio.ts` Breakdown Strategy

**Problem**: 
Currently, `useWebAudio.ts` acts as an "Everything Skill" for the frontend. It spans hundreds of lines handling Web Audio context initiation, crossfader math curves, transport states, and hardware recording. 

**Proposal**:
We should split this monolithic hook into specialized, atomic domain hooks:

*   `useWebAudioCore.ts`: Handles strictly the initialization of the `Tone.context`, the master chain (`masterBus`, `limiter`), and the cue/headphone routing matrix.
*   `useCrossfaderProfile.ts`: Extracts the crossfader math lines (smooth, sharp, cut, constant power) into a dedicated module that returns only `updateCrossfader(value)` and pure curve constants.
*   `useTransport.ts`: Takes over global play/pause, sync logic, and tempo alignment across the decks (decoupling `handleSync` and `masterDeckId` logic).
*   `useDeckRouting.ts`: Plugs individual decks (via `deckA` & `deckB` outputs) into the `useWebAudioCore` mix bus.

*Benefits*: Following **Progressive Disclosure**, a component that only needs to draw a Volume Meter no longer initiates the entire WebAudio graph simply by importing the hook.

---

## 2. `main.py` Breakdown Strategy

**Problem**:
At ~1,184 lines, the Flask entry point acts as a routing engine, background worker dispatcher, schema definer, and direct database interfacing layer. It violates Atomicity.

**Proposal**:
Applying the Antigravity architecture, we will decouple the Python monolith into atomic routes and isolated worker managers:

1.  **`api_router.py`**: Break out isolated Blueprint routes (`/api/master-audio`, `/api/separate-audio`). `main.py` will simply import and register these Blueprints.
2.  **`worker_pool.py`**: Move the `ThreadPoolExecutor` and the definitions of `background_mastering()` and `background_separation()` into a distinct thread controller block.
3.  **`job_lifecycle.py`**: Extract the Supabase database mutations (`create_task_in_db`, `update_task_in_db`, `log_job`) to a dedicated Database Operations class. This minimizes the risk of breaking DB schemas when modifying audio algorithms.

*Benefits*: This ensures that when we upgrade the Stem splitting algorithm, we do not inadvertently touch the UUID tagging logic or the API auth protocols.
