# GSoC 2026 Proposal: EduAid Backend Hardening

**Proposal Title:** Hardening EduAid: Security, Scalability, and Reliability Improvements

## Summary
EduAid has real problems that get in the way of running it in production. File uploads have security holes. AI processing ties up the server whenever more than one person uses it at the same time. Memory usage runs past 15GB in a configuration where shared model instances could bring it under 5GB.

This project fixes all three. I will patch the file handling layer to close the directory traversal vulnerability and enforce proper cleanup, wire up Celery and Redis so heavy AI work runs in background workers instead of blocking request threads, and consolidate model loading so the same instance is shared across generator classes rather than loaded fresh each time.

When this is done, EduAid will handle concurrent users without timeouts, have no known file handling or injection vulnerabilities, and run with significantly lower memory overhead.

This proposal is based on prior hands-on analysis of the EduAid backend, including reporting a directory traversal vulnerability (Issue #502).

## Motivation
The backend works fine for local testing but falls apart under real usage. File uploads accept anything, including filenames designed to escape the upload directory. AI inference runs synchronously inside Flask request handlers, so the third concurrent user typically times out waiting. Five generator classes each call `from_pretrained` independently, loading duplicate copies of the same models into memory.

A classroom of 30 students hitting the question generation endpoint simultaneously will produce timeouts, not questions. One malformed filename can write to arbitrary paths on the server. And the memory situation makes the hosting bill higher than it needs to be.

Students are the ones who pay for unreliable tools. Timeouts during studying are frustrating in a specific way that is different from a general SaaS outage. None of the work I want to do later—better document parsing, smarter AI features, horizontal scaling—is worth building on top of a backend with security gaps and resource leaks. So I want to fix the foundation first.

## Personal Motivation and Suitability
I found the directory traversal vulnerability by reading through how files move through the system. I traced an upload from the point it hits the endpoint all the way through to cleanup, and noticed that temp files only get deleted when the operation succeeds. Failures leave files behind with no cleanup scheduled. I reported this as Issue #502.

I like problems where you can tell whether the fix worked. Close a security hole and verify the attack vector is gone. Add async processing and run a load test. Reduce memory usage and measure before and after. Infrastructure work with that kind of feedback loop is the kind I find satisfying.

I have built backend systems before and have run into the specific failure modes EduAid has: temp files accumulating until disk fills up, blocking operations causing cascading timeouts, models loaded redundantly because nobody wired up a shared instance. I have already read enough of the codebase to understand how the components connect. I am not guessing at the scope.

## Tech Stack
Python, Flask, Celery, Redis, PyTorch, Transformers, PyMuPDF, `python-docx`, `yt-dlp`, Werkzeug, pytest, Docker

## Implementation Timeline

Testing is not a phase at the end. For each fix, I write the test that proves the problem exists, then I write the fix, then I confirm the test passes. Milestones below are checkpoints where I can show something working, not just code committed.

### Week 1: Security fixes
I will start by reproducing every issue I found, including Issue #502, to confirm exact scope before touching anything.

Secure file handling comes first. Every filename goes through `werkzeug.utils.secure_filename`, and the resulting path is validated with `os.path.abspath` to confirm it stays inside the uploads directory. Anything that escapes gets rejected outright.

```python
import os
from werkzeug.utils import secure_filename

UPLOAD_DIR = os.path.abspath("/app/uploads")

def safe_save(file, filename):
    name = secure_filename(filename)
    dest = os.path.abspath(os.path.join(UPLOAD_DIR, name))
    if not dest.startswith(UPLOAD_DIR + os.sep):
        raise ValueError("Path traversal attempt blocked")
    file.save(dest)
    return dest
```

I write the path traversal test before writing this function, so I know exactly what the fix needs to defeat. The test uploads a file named `../../etc/passwd` and asserts it gets rejected with a 400.

The `yt-dlp` injection fix runs the same week. Right now `video_id` comes from user input and goes into a subprocess call with `shell=True`. I sanitize the parameter and switch to argument list mode so shell metacharacters are never interpreted:

```python
import re
import subprocess

if not re.fullmatch(r'[A-Za-z0-9_-]{6,16}', video_id):
    raise ValueError("Invalid video ID")
subprocess.run(["yt-dlp", video_id, "-o", "output.mp4"])
```

Test first here too. I pass `; rm -rf /tmp/test` as a video ID and confirm it gets blocked before touching the subprocess call.

File upload validation also goes in this week: a whitelist of PDF and DOCX only, size limits at both the application layer and Nginx, and payload checks that reject oversized requests before Flask ever sees them.

**Milestone:** Path traversal test passes. Shell injection test passes. A reviewer can run both in under a minute.

### Week 2: Reliability and file handling
The cleanup problem is straightforward but needs consistent treatment everywhere. Context managers and `try/finally` blocks wrap every operation that touches temp files. Whether the operation succeeds or crashes, the file gets deleted. Celery task failure hooks get the same treatment so background failures do not leave orphaned files.

UUIDs replace the current filename scheme. Each request gets its own isolated subdirectory, which eliminates the race condition in subtitle processing where concurrent requests write to the same location and try to figure out which file belongs to them by comparing timestamps. With per-request directories that problem disappears.

Bare `except` blocks that catch everything and do nothing become proper logging that captures what operation failed, what the inputs were, and what the exception was. HTTP status codes get used correctly so callers can tell what went wrong.

A periodic background scan finds and removes temp files older than a configurable threshold, catching anything that slips through during unexpected process termination.

**Milestone:** Force a failure mid-upload and confirm the temp file is gone. Repeat for three different failure points in the pipeline.

### Weeks 3 to 5: Asynchronous processing
This is the biggest architectural change and the one with the most ways to go wrong unexpectedly. Three weeks, with real buffer for debugging Celery and Flask interactions, which in my experience never go smoothly the first time.

Right now document parsing and AI inference run inside Flask request handlers. Under load, requests queue up and the ones at the back time out. The fix: heavy endpoints validate input, enqueue a Celery task, and return a task ID immediately. The actual work runs in a background worker.

**API migration.** Moving to async is a breaking change for existing callers. I will handle this with a `/v2/` namespace alongside the existing synchronous endpoints. The old endpoints stay functional but return a `Deprecation` response header pointing to the migration guide. New `/v2/task/status/<task_id>` and `/v2/task/result/<task_id>` endpoints expose progress and results for polling.

One operational concern I want to address directly: what happens to a request actively being processed on the old synchronous endpoint when a deployment occurs? For long-running requests this is a real problem. I will add a short draining period to the deployment process so the load balancer stops routing new traffic to the old endpoint while in-flight requests finish. After a timeout, they fail gracefully and the client gets a `503 Service Unavailable` with a `Retry-After` header. That is simpler than trying to migrate in-flight state across the v1/v2 boundary.

Celery and Redis setup. Redis serves as both the message broker and result backend. Retry logic uses exponential backoff with a cap so tasks cannot loop indefinitely. Stuck tasks are detectable through timeout tracking rather than silently sitting in "processing" forever.

**Rate limiting.** Flask-Limiter with Redis will cap request rates at around 5 document processing requests per minute per IP as a floor. There is one problem with hard per-IP limits in a classroom context worth acknowledging: if 30 students are all behind the same school NAT, they share a single IP address. A strict per-IP limit blocks all of them after the fifth request. My approach is to apply the per-IP floor as burst protection, use a higher threshold of around 20 requests per minute per IP, and pair it with a global queue depth limit so no single source can flood the worker pool regardless of auth status. For deployments with authentication, the limit applies per authenticated user instead.

SIGTERM handlers go in for graceful shutdowns so workers finish their current task and update state before exiting. Nothing appears stuck after a deployment.

After each major piece—Celery setup, rate limiting, graceful shutdown—I run a concurrent load test with 10 simultaneous clients before moving on. The load testing is not saved for the end.

**Milestone end of week 5:** Upload a document, receive a task ID, poll for completion, fetch the result. Full async round trip working. Old synchronous endpoint still responds and returns the deprecation header.

### Weeks 6 to 7: Model optimization
Five generator classes each call `from_pretrained` independently. MCQGen loads t5-large. BoolQGen loads its own copy of t5-large. ShortQGen loads t5-base. The result is over 15GB of memory for something that could run under 5GB with shared instances.

I will build a centralized model manager that loads each model once per worker process and hands the same instance to whoever requests it. All redundant `from_pretrained` calls get replaced with requests to the manager.

**PyTorch and Celery forking.** This is the part most writeups on Celery with ML models skip. Python's default `fork()` does not safely duplicate CUDA contexts. If models are loaded before the fork, GPU memory can become corrupted or deadlocked in child workers. The correct pattern is to load models after the fork using Celery's `worker_process_init` signal:

```python
from celery.signals import worker_process_init
from model_manager import ModelManager

manager = None

@worker_process_init.connect
def init_models(**kwargs):
    global manager
    manager = ModelManager()
    manager.preload(["t5-large", "t5-base"])
```

If CPU-only inference is used the forking constraint is relaxed, but I will enforce the signal-based pattern regardless so the code is safe whether or not a GPU is present.

Loading is lazy by default: models load on first request rather than at worker startup. This speeds up deployment and lets workers that only handle certain task types skip loading models they will never use.

**Milestone:** Memory usage measured before and after with an identical workload. Both numbers documented.

### Week 8: Buffer and consolidation
I built this week in deliberately. Weeks 3 through 7 carry real complexity and something will take longer than expected. Unexpected Celery and Flask interaction bugs, Redis connection edge cases under load, model manager thread safety—these are all places I expect to spend extra time that is hard to budget precisely upfront.

Whatever spilled from earlier phases gets resolved here. Edge cases found during integration testing get fixed. The security tests, async workflow tests, and memory benchmarks I have been running incrementally throughout get consolidated into a single suite that a reviewer can run with one command.

### Week 9: Finalization
Mentor feedback from the full review gets incorporated. Documentation covers the new async architecture, how to deploy with Celery and Redis, what the v2 API changes are, the migration path from the old synchronous endpoints, and what the updated system requirements are. The implementation gets cleaned up and submitted.

## Extended Work (if core finishes early)
* **Intelligent caching.** Before creating a task, hash the input (URL or PDF checksum) and check Redis for a cached result from an identical previous request. In classroom settings where 50 students process the same assigned video, this reduces compute from 50 full processing runs to one.
* **Improved document processing.** The current approach pipes everything through `get_text` and splits on periods with regex, which destroys structure. Bullet points become fragments, code blocks get mangled, paragraphs split in the wrong places. A proper parser would preserve headings, lists, and code blocks and chunk on semantic boundaries so the questions generated are about coherent content rather than sentence fragments.

## Logistics and Availability
- **Time zone:** IST (UTC+5:30) 
- **Availability:** 25 to 30 hours per week for the full GSoC duration. 
- **Known conflicts:** None at this time.
- I am available for the full GSoC duration and can dedicate approximately 25 to 30 hours per week to this project. I am comfortable collaborating asynchronously and will actively communicate progress, blockers, and updates with mentors. I will also keep a public progress log throughout the project.

## Why This Project Matters
EduAid is for students. A security hole in a student tool is not just a technical problem. It is a breach of trust with people who are trying to learn. Timeouts that interrupt studying are direct interference with someone's work, not an abstract SLA number.

The goal is a backend students can actually depend on. Getting there means fixing what is broken before adding anything new.
