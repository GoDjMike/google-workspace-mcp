# Google Workspace MCP Server

[![smithery badge](https://smithery.ai/badge/@aaronsb/google-workspace-mcp)](https://smithery.ai/server/@aaronsb/google-workspace-mcp)
[![glama badge](https://glama.ai/mcp/servers/0finyxgwlk/badge)](https://glama.ai/mcp/servers/0finyxgwlk)

A Model Context Protocol (MCP) server that provides authenticated access to Google Workspace APIs, offering comprehensive Gmail and Calendar functionality.

## Features

- **Gmail Integration**: Complete email operations (list, get, send messages)
- **Calendar Integration**: Full calendar event management and scheduling
- **OAuth Authentication**: Robust OAuth 2.0 flow with token refresh
- **Account Management**: Multi-account support with secure token handling
- **Error Handling**: Detailed error messages with resolution steps
- **Modular Design**: Extensible architecture for additional services

## Current Capabilities

- **Gmail Operations**:
  - List and fetch emails with filtering
  - Send emails with CC/BCC support
  - Gmail-specific error handling

- **Calendar Operations**:
  - List and fetch calendar events
  - Create and manage calendar events
  - Meeting scheduling support

- **Account Management**:
  - Multiple account support
  - Secure token storage
  - Automatic token refresh

## Documentation

- [API Documentation](docs/API.md): Available tools and usage
- [Architecture](ARCHITECTURE.md): System design and components
- [Error Handling](docs/ERRORS.md): Error types and resolution

## Getting Started

### Installing via Smithery

To install Google Workspace MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@aaronsb/google-workspace-mcp):

```bash
npx -y @smithery/cli install @aaronsb/google-workspace-mcp --client claude
```

### Manual Installation
1. **Initial Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd google-workspace-mcp

   # Install dependencies
   npm install

   # Run setup script to create required directories and example configs
   npx ts-node src/scripts/setup-environment.ts
   ```

2. **Setup Google Cloud Project**
   ⚠️ **IMPORTANT: Individual Setup Required**
   Each user currently needs to set up their own Google Cloud Project. This is a temporary requirement as the project maintainer does not maintain a central application for security, cost, and logistics reasons.

   Follow these steps to set up your own project:

   1. Create or Select Project:
      - Go to the [Google Cloud Console](https://console.cloud.google.com)
      - Create a new project or select an existing one

   2. Enable Required APIs:
      - Enable the Gmail API
      - Enable the Google Calendar API

   3. Configure OAuth Consent Screen:
      - Set up as an External app
      - Add test users who will be using the application
      - No need to submit for verification (only test users can access)

   4. Create OAuth 2.0 Credentials:
      - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
      - Choose "Desktop app" or "Web application" as the application type
      - For callback URL, you can use the default localhost callback
        (The app uses out of band OAuth flow: urn:ietf:wg:oauth:2.0:oob)

   5. Save Credentials:
      - Copy credentials to `config/gauth.json` using the template in `config/gauth.example.json`

3. **Configure Accounts**
   - Copy `config/accounts.example.json` to `config/accounts.json` if not done by setup script
   - Edit `config/accounts.json` to add your Google accounts
   - Run the authentication script:
     ```bash
     npx ts-node src/scripts/setup-google-env.ts
     ```

4. **Basic Usage**
   ```typescript
   // List emails
   const response = await use_mcp_tool({
     server_name: "gsuite",
     tool_name: "list_workspace_emails",
     arguments: {
       email: "user@example.com",
       maxResults: 10,
       labelIds: ["INBOX"]
     }
   });

   // Send email
   await use_mcp_tool({
     server_name: "gsuite",
     tool_name: "send_workspace_email",
     arguments: {
       email: "user@example.com",
       to: ["recipient@example.com"],
       subject: "Hello",
       body: "Message content"
     }
   });
   ```

## Docker Installation

⚠️ **IMPORTANT: Config Directory Mounting Required**

The MCP server requires configuration files to run. When using Docker, you **must** mount a local config directory containing your credentials and account settings.

### Required Configuration Files

Before running the container, prepare your configuration:

1. Create a `config` directory on your host machine
2. Add these required files to your config directory:
   - `gauth.json`: Your Google OAuth credentials
   - `accounts.json`: Your account configurations

You can use the example files in `config/*.example.json` as templates.

### Running with Docker

You can run this MCP server using Docker in two ways:

#### Option 1: Pull from GitHub Container Registry

```bash
# Pull the latest image
docker pull ghcr.io/aaronsb/google-workspace-mcp:latest

# Run the container (replace /path/to/your/config with your actual config directory path)
docker run -v /path/to/your/config:/app/config ghcr.io/aaronsb/gsuite-mcp:latest
```

#### Option 2: Build Locally

```bash
# Clone the repository
git clone [repository-url]
cd gsuite-mcp

# Build the image
docker build -t gsuite-mcp .

# Run the container (replace /path/to/your/config with your actual config directory path)
docker run -v /path/to/your/config:/app/config gsuite-mcp
```

### Configuration Volume Mount

The `-v /path/to/your/config:/app/config` flag is **required** and mounts your local config directory into the container:
- Source: `/path/to/your/config` (your local config directory)
- Target: `/app/config` (where the container expects config files)

Without this volume mount, the container will fail to start with an OAuth configuration error.

## Available Tools

### Account Management
- `list_workspace_accounts`: List configured accounts
- `authenticate_workspace_account`: Add/authenticate account
- `remove_workspace_account`: Remove account

### Gmail Operations
- `list_workspace_emails`: Fetch emails with filtering
- `send_workspace_email`: Send emails with CC/BCC

### Calendar Operations
- `list_workspace_calendar_events`: List calendar events with filtering
- `get_workspace_calendar_event`: Get a specific calendar event
- `create_workspace_calendar_event`: Create a new calendar event

See [API Documentation](docs/API.md) for detailed usage.

## Coming Soon

### Future Services
- Drive API integration
- Admin SDK support
- Additional Google services

## Testing Strategy

### Unit Testing Approach

1. **Simplified Mocking**
   - Use static mock responses for predictable testing
   - Avoid complex end-to-end simulations in unit tests
   - Focus on testing one piece of functionality at a time
   - Mock external dependencies (OAuth, file system) with simple implementations

2. **Test Organization**
   - Group tests by functionality (e.g., account operations, file operations)
   - Use clear, descriptive test names
   - Keep tests focused and isolated
   - Reset mocks and modules between tests

3. **Mock Management**
   - Use jest.resetModules() to ensure clean state
   - Re-require modules after mock changes
   - Track mock function calls explicitly
   - Verify both function calls and results

4. **File System Testing**
   - Use simple JSON structures
   - Focus on data correctness over formatting
   - Test error scenarios (missing files, invalid JSON)
   - Verify file operations without implementation details

5. **Token Handling**
   - Mock token validation with static responses
   - Test success and failure scenarios separately
   - Verify token operations without OAuth complexity
   - Focus on account manager's token handling logic

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.ts

# Run tests with coverage
npm test -- --coverage
```

## Best Practices

1. **Authentication**
   - Store credentials securely
   - Use minimal required scopes
   - Handle token refresh properly

2. **Error Handling**
   - Check response status
   - Handle auth errors appropriately
   - Implement proper retries

3. **Configuration & Security**
   - Each user maintains their own Google Cloud Project
   - Use environment variables
   - Secure credential storage
   - Regular token rotation
   - Never commit accounts.json to git
   - Use accounts.example.json as a template
   - A pre-commit hook prevents accidental token commits

4. **Local Development Setup**
   - Copy accounts.example.json to accounts.json (gitignored)
   - Add your account details to accounts.json
   - Keep sensitive tokens out of version control
   - Run authentication script for each account

## Troubleshooting

### Common Setup Issues

1. **Missing Configuration Files**
   - Error: "Required file config/gauth.json is missing"
   - Solution: Run `npx ts-node src/scripts/setup-environment.ts` to create example files, then copy and configure with your credentials

2. **Authentication Errors**
   - Error: "Invalid OAuth credentials"
   - Solution:
     - Verify your Google Cloud project is properly configured
     - Ensure you've added yourself as a test user in the OAuth consent screen
     - Check that both Gmail API and Google Calendar API are enabled
     - Verify credentials in gauth.json match your OAuth client configuration

3. **Token Issues**
   - Error: "Token refresh failed"
   - Solution: Remove the account using `remove_workspace_account` and re-authenticate
   - Check that your Google Cloud project has the necessary API scopes enabled

4. **Directory Structure**
   - Error: "Directory not found"
   - Solution: Run the setup script to create required directories
   - Ensure you have write permissions in the config directory

For additional help, consult the [Error Handling](docs/ERRORS.md) documentation.

## License

MIT License - See LICENSE file for details
