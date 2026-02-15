# GitHub App Example

This example demonstrates how to build a GitHub App that uses Chrome DevTools MCP to test pull requests automatically.

## Features

- Listens for pull request events via webhooks
- Automatically tests preview deployments
- Runs performance analysis using Chrome DevTools MCP
- Posts results as GitHub check runs
- Takes screenshots and captures console errors

## Prerequisites

1. Node.js v20.19 or newer
2. Chrome browser installed
3. A GitHub App (see setup instructions below)
4. A public URL for webhooks (use ngrok for local development)

## Setup Instructions

### 1. Create a GitHub App

1. Go to GitHub Settings → Developer Settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in the details:
   - **Name**: Choose a unique name (e.g., "My PR Tester")
   - **Homepage URL**: Your app's URL (can be a placeholder)
   - **Webhook URL**: Your server's public URL + `/webhook` (e.g., `https://your-domain.com/webhook`)
   - **Webhook secret**: Generate a random string and save it
4. Set permissions:
   - Repository permissions:
     - Checks: Read & Write
     - Contents: Read
     - Pull requests: Read
5. Subscribe to events:
   - Pull request
6. Click "Create GitHub App"
7. Generate and download a private key

### 2. Install the GitHub App

1. Go to your GitHub App settings
2. Click "Install App"
3. Choose repositories where you want to install the app

### 3. Configure the Application

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=./path-to-private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret
PORT=3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Using ngrok for Local Development

To test webhooks locally, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Update your GitHub App webhook URL with the ngrok URL
# Example: https://abc123.ngrok.io/webhook
```

## How It Works

1. GitHub sends a webhook when a PR is opened or updated
2. The server applies rate limiting (60 requests per minute per IP)
3. The server verifies the webhook signature for security
4. Creates a GitHub check run with status "in_progress"
5. Uses Chrome DevTools MCP to:
   - Navigate to the preview deployment
   - Run performance tests
   - Take screenshots
   - Check for console errors
6. Updates the GitHub check run with results (pass/fail)

## Security Features

This example includes several security measures:

- **Webhook Signature Verification**: Validates all incoming webhooks using HMAC SHA-256
- **Rate Limiting**: Limits requests to 60 per minute per IP address to prevent abuse
- **Environment Variables**: Sensitive data (keys, secrets) stored in environment variables, not code

For production use, consider additional security measures like:
- Using a proper rate limiting library (e.g., express-rate-limit)
- Implementing request logging and monitoring
- Running behind a reverse proxy (e.g., nginx)
- Setting up firewall rules

## Testing

You can test the webhook handler locally:

```bash
npm test
```

Or manually test by creating a pull request in a repository where your app is installed.

## Customization

Edit `server.js` to customize:
- Which tests to run
- Pass/fail criteria
- Check run output format
- Additional MCP tools to use

## Troubleshooting

### Webhook not receiving events

- Check that your webhook URL is correct
- Verify ngrok is running (for local development)
- Check GitHub App webhook deliveries in settings

### MCP connection issues

- Ensure Chrome is installed
- Check MCP server logs
- Try running MCP server manually: `npx -y chrome-devtools-mcp@latest`

### Authentication errors

- Verify your private key path is correct
- Check that APP_ID matches your GitHub App
- Ensure webhook secret matches

## Learn More

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Building Applications Guide](../../docs/building-applications.md)
