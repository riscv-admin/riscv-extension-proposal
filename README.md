# RISC-V Extension Proposal Portal

A full-stack application for proposing and reviewing new RISC-V ISA extensions. It consists of a static frontend (React + Vite) deployed to GitHub Pages and a serverless backend (Cloudflare Worker) that creates tickets in Jira.

## Project Structure

- **Frontend (`/`)**: React application that collects user proposals.
- **Backend (`/riscv-jira-worker`)**: Cloudflare Worker that validates data and authenticates with Jira.

## Prerequisites

1.  **Cloudflare Account**: For hosting the worker.
2.  **Jira Account**:
    -   Account Email
    -   API Token (Create one at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens))
    -   Project Key (e.g., `RVS`) where tickets will be created.
3.  **GitHub Repository**: For hosting the frontend via GitHub Pages.

---

## Deployment Guide

Deploy the backend first, as you will need its URL to configure the frontend.

### Part 1: Backend (Cloudflare Worker)

1.  **Navigate to the worker directory:**
    ```bash
    cd riscv-jira-worker
    npm install
    ```

2.  **Login to Cloudflare:**
    ```bash
    npx wrangler login
    ```

3.  **Set Secure Secrets:**
    Run the following commands and enter the values when prompted. These are encrypted and stored in Cloudflare.
    ```bash
    npx wrangler secret put JIRA_USER_EMAIL  # Your Atlassian email
    npx wrangler secret put JIRA_API_TOKEN   # Your Atlassian API Token
    npx wrangler secret put JIRA_SERVER_URL  # e.g., https://your-org.atlassian.net
    ```

4.  **Configure `wrangler.toml`:**
    Edit `riscv-jira-worker/wrangler.toml`.
    -   `JIRA_PROJECT_KEY`: The Jira project key (e.g., "RVS").
    -   `ALLOWED_ORIGIN`: **Crucial.** Set this to your GitHub Pages base URL (e.g., `https://riscv-admin.github.io`).
        -   **Note:** Do not include the trailing slash or the repository sub-path. It must be the *origin* only.

5.  **Deploy:**
    ```bash
    npx wrangler deploy
    ```
    **Copy the deployed Worker URL** (e.g., `https://riscv-jira-worker.your-name.workers.dev`).

### Part 2: Frontend (GitHub Pages)

1.  **Configure API Endpoint:**
    Open `src/App.jsx` and update the `API_ENDPOINT` constant:
    ```javascript
    const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://<YOUR-WORKER-URL>/api/submit'
    ```

2.  **Push to GitHub:**
    The project is configured with a GitHub Action (`.github/workflows/deploy.yml`) that automatically builds and deploys the site.
    ```bash
    git add .
    git commit -m "Configure API endpoint"
    git push origin main
    ```

3.  **Enable GitHub Pages:**
    -   Go to Repository Settings > **Pages**.
    -   Under **Build and deployment**, select **Source**: "GitHub Actions".
    -   Wait for the Action to complete.

---

## Troubleshooting

### "Network Error" or "Failed to Fetch"
This is usually a **CORS (Cross-Origin Resource Sharing)** issue.

1.  **Check Browser Console:** If you see `Access-Control-Allow-Origin header... does not match`, your `ALLOWED_ORIGIN` in `wrangler.toml` is wrong.
2.  **Verify Origin:**
    -   If your site is `https://user.github.io/repo/`, your Origin is `https://user.github.io`.
    -   Update `wrangler.toml` with `https://user.github.io`.
    -   Run `npx wrangler deploy` again in the worker directory.

### Jira Ticket Not Created
1.  **Check Worker Logs:**
    ```bash
    cd riscv-jira-worker
    npx wrangler tail
    ```
    Then try submitting the form again to see real-time error logs.
2.  **Verify Secrets:** Ensure `JIRA_API_TOKEN` and `JIRA_USER_EMAIL` are correct.

## Local Development

1.  **Start Worker:**
    ```bash
    cd riscv-jira-worker
    npm run dev
    ```
    (Runs at `http://localhost:8787`)

2.  **Start Frontend:**
    In a new terminal:
    ```bash
    npm run dev
    ```
    (Runs at `http://localhost:5173`)

    *Note: For local dev to work, you may need to update `ALLOWED_ORIGIN` or the CORS logic to accept localhost.*