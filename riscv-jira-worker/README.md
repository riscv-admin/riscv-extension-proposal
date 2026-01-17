# RISC-V Jira Worker

Cloudflare Worker that handles form submissions from the RISC-V Extension Proposal form and creates Jira issues.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Install Dependencies

```bash
cd riscv-jira-worker
npm install
```

### 4. Configure Secrets

Set the required secrets (these are stored securely in Cloudflare):

```bash
wrangler secret put JIRA_USER_EMAIL
# Enter your Jira user email when prompted

wrangler secret put JIRA_API_TOKEN
# Enter your Jira API token when prompted

wrangler secret put JIRA_SERVER_URL
# Enter your Jira server URL (e.g., https://yourcompany.atlassian.net)
```

### 5. Configure Environment Variables

Edit `wrangler.toml` and update:

- `JIRA_PROJECT_KEY` - Your Jira project key (default: "RVS")
- `ALLOWED_ORIGIN` - Your GitHub Pages URL (e.g., "https://riscv.github.io")

### 6. Deploy

```bash
npm run deploy
```

After deployment, you'll get a URL like:
```
https://riscv-jira-worker.<your-subdomain>.workers.dev
```

### 7. Update React App

Set the `VITE_API_ENDPOINT` environment variable in your React app build:

```bash
VITE_API_ENDPOINT=https://riscv-jira-worker.<your-subdomain>.workers.dev/api/submit npm run build
```

Or add it to your GitHub Actions workflow:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_API_ENDPOINT: https://riscv-jira-worker.<your-subdomain>.workers.dev/api/submit
```

## Development

Run locally for testing:

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`.

## API Endpoint

### POST /api/submit

Creates a new Jira issue.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "affiliation": "ACME Corp",
  "summary": "New Vector Extension",
  "description": "Proposal details...",
  "isaType": "ISA",
  "fastTrack": false,
  "githubUrl": "https://github.com/riscv/riscv-example",
  "extensions": ["Zve32x", "Zve64x"]
}
```

**Success Response:**
```json
{
  "success": true,
  "jiraKey": "RVS-1234",
  "jiraUrl": "https://yourcompany.atlassian.net/browse/RVS-1234"
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": ["First name is required", "Email is required"]
}
```
