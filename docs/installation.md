# EpiGimp Installation Guide

This guide explains how to install the dependencies and run EpiGimp locally for development.

## 1. Prerequisites

Before installing EpiGimp, make sure the following tools are available on your machine:

- Git
- Node.js
- npm

The project has currently been developed and tested with:

```text
Node.js 20.x
npm 10.x
```

You can verify your installation with:

```bash
node --version
npm --version
git --version
```

## 2. Get the Project

Clone the EpiGimp repository:

```bash
git clone https://github.com/ana-b-c/EpiGimp.git
```

Then enter the project directory:

```bash
cd EpiGimp
```

## 3. Install Dependencies

Install all project dependencies with:

```bash
npm install
```

This installs both the React/Vite dependencies and the Electron development environment defined in `package.json`.

You should not install dependencies manually inside `node_modules`.

## 4. Start the Development Environment

Start EpiGimp with:

```bash
npm run dev
```

This command starts both:

- the Vite development server for the React renderer;
- the Electron desktop application.

The development architecture is:

```text
npm run dev
     │
     ├── Vite
     │     ↓
     │   React
     │     ↓
     │ localhost:5173
     │
     └── Electron
           ↓
       EpiGimp window
```

The Electron process waits for the Vite development server before opening the application.

## 5. Linux / Wayland Development Note

On the Ubuntu/Wayland development environment used during the initial EpiGimp setup, Electron encountered a Chromium/GTK rendering issue when launched normally.

The working development configuration launches Electron with:

```bash
--ozone-platform=x11
```

This option is already included in the current development script.

Some systems may display Chromium messages similar to:

```text
GetVSyncParametersIfAvailable() failed
```

During the initial development environment tests, these messages did not prevent EpiGimp from running correctly.

This workaround is environment-specific and is not considered an application requirement.

## 6. Build the Project

Create a production build with:

```bash
npm run build
```

The build process compiles both parts of the application:

```text
React / TypeScript
        ↓
      dist/

Electron / TypeScript
        ↓
  dist-electron/
```

A successful renderer build generates files similar to:

```text
dist/
├── index.html
└── assets/
```

The Electron build generates the compiled main and preload processes in:

```text
dist-electron/
```

## 7. Test the Built Application

After a successful build, the compiled application can currently be tested with:

```bash
npx electron . --ozone-platform=x11
```

This launches Electron without starting the Vite development server.

In this mode, Electron loads:

```text
dist/index.html
```

directly from the filesystem.

This verifies that the production renderer does not depend on the Vite development server.

> The current command is intended for the Linux development environment used during the project setup. Packaging EpiGimp into distributable application formats is separate from this build verification.

## 8. Verify Code Quality

Run ESLint with:

```bash
npm run lint
```

ESLint analyzes the TypeScript and React code for configured code-quality issues.

Check formatting with:

```bash
npm run format:check
```

If files need to be formatted, run:

```bash
npm run format
```

Prettier will automatically apply the project's formatting conventions.

## 9. Available Commands

The main development commands are:

```text
npm run dev           Start React and Electron in development mode
npm run dev:react     Start only the Vite development server
npm run dev:electron  Build and start the Electron process

npm run build         Build the complete project
npm run build:react   Build the React renderer
npm run build:electron Build the Electron main and preload processes

npm run lint          Run ESLint
npm run format        Format the project with Prettier
npm run format:check  Check formatting without modifying files
```

## 10. Expected Result

After running:

```bash
npm install
npm run dev
```

an Electron window should open and display the EpiGimp interface.

At the current foundation stage, the application displays:

```text
EpiGimp
Raster graphics editor
```

The complete graphics-editor interface is implemented progressively through the EpiGimp development roadmap.

## 11. Troubleshooting

### Electron does not start on Ubuntu/Wayland

If Electron crashes because of Chromium, GTK or Ozone-related errors, verify that it is being launched with:

```bash
--ozone-platform=x11
```

The current development script already applies this workaround.

### Port 5173 is already in use

EpiGimp currently expects the Vite development server at:

```text
http://localhost:5173
```

Stop the process already using this port before starting the normal EpiGimp development environment.

### Dependencies are missing

Run:

```bash
npm install
```

again from the project root.

Avoid modifying `node_modules` manually.

### Build succeeds but development mode does not start

The two parts can be tested separately:

```bash
npm run dev:react
```

and:

```bash
npm run dev:electron
```

This can help identify whether a problem originates from the Vite renderer or the Electron process.
