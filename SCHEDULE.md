# Daily posting schedule

The script `npm run tg10x:daily` runs **login + hiring post only** (`POST_ONLY=1`, `HEADLESS=1` by default). Ensure `.env` has valid `TG10X_EMAIL` and `TG10X_PASSWORD`. If headless login fails, set `HEADLESS=0` in `.env` or run the task **only when you are logged in** so a visible browser can open.

## GitHub Actions (online — no Task Scheduler)

Runs in the cloud on a schedule (free for public repos; private repos get limited minutes).

1. Create a **GitHub** repository and push this project (do **not** commit `.env`; secrets live in GitHub only).
2. Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - `TG10X_EMAIL`
   - `TG10X_PASSWORD`
   - Optional: `TG10X_POST_TEXT`, `TG10X_BASE_URL`
3. The workflow file is `.github/workflows/tg10x-daily.yml`. Edit the `cron` lines for your time (**GitHub uses UTC only**). Evening **EST** slots include `33 0`, `35 0`, `0 1`, `10 1`, `15 1` UTC (see YAML for 7:33 / 7:35 / 8:00 / 8:10 / 8:15 PM EST). In **EDT**, use the alternate crons noted in the file.
4. **Actions** → **TG10X daily post** → **Run workflow** to test once.

**Notes:** Cron runs can be delayed a few minutes on GitHub’s free tier — for an exact one-off test, use **Run workflow**. Some sites block logins from cloud IPs; if the job always fails at login, use Task Scheduler on your PC or a self-hosted runner instead.

### If the workflow shows **Failure** (exit code 1)

1. Open the run → job **post** → expand each step. **Check Actions secrets** fails → add `TG10X_EMAIL` and `TG10X_PASSWORD` under **Settings → Secrets and variables → Actions**.
2. **Run daily post** fails → usually **TG10X login** in headless mode from GitHub’s servers (blocked or wrong password). Confirm secrets, reset the site password if needed, or run **`npm run tg10x:daily`** on your PC instead.
3. On failure, download **tg10x-error** artifact (if present) for the screenshot, or read the log for `Error:` / `TimeoutError`.
4. Ignore stray warnings about **Node 16** if your workflow uses **actions/checkout@v4** and **@v4** for other actions; re-save the workflow from this repo if you still see **@v1** in the file.

## Windows — Task Scheduler

1. Open **Task Scheduler** → **Create Task** (not Basic Task).
2. **General:** name e.g. `TG10X Daily Post`; choose **Run only when user is logged on** if you use `HEADLESS=0`.
3. **Triggers:** New → **Daily** → set time (e.g. 09:00).
4. **Actions:** New → **Start a program**
   - **Program:** `C:\Program Files\nodejs\npm.cmd`  
     (or `npm.cmd` if `node` is on PATH — use full path if tasks fail with “not found”).
   - **Add arguments:** `run tg10x:daily`
   - **Start in:** `C:\Users\suman\OneDrive\Desktop\10gx` (your project folder).
5. **Conditions / Settings:** disable “Start only on AC power” if on a laptop and you want runs on battery.

Optional logging: use **Actions** → `powershell.exe` with arguments  
`-NoProfile -Command "cd 'C:\Users\suman\OneDrive\Desktop\10gx'; npm run tg10x:daily *>> tg10x-daily.log 2>&1"`

## Linux / macOS — cron

```bash
crontab -e
```

Example: every day at 9:00 (adjust path):

```cron
0 9 * * * cd /path/to/10gx && /usr/bin/env POST_ONLY=1 HEADLESS=1 /usr/bin/npm run tg10x:daily >> /path/to/10gx/tg10x-daily.log 2>&1
```

Use `which node` and `which npm` for correct paths. For headless login issues, use `HEADLESS=0` and a logged-in graphical session, or a virtual display (e.g. `xvfb-run` on Linux).

## One-off test

```bash
cd /path/to/10gx
npm run tg10x:daily
```
