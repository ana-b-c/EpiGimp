# EpiGimp

EpiGimp is a desktop raster graphics editor developed with **Electron, React, TypeScript and HTML5 Canvas**.

The project aims to reproduce the core workflow of a raster graphics editor, with support for image creation and manipulation, drawing and selection tools, layers, masks, filters and multiple file formats.

EpiGimp is developed as part of a four-week project with a strong focus on **modularity, maintainability, performance and clean software architecture**.

---

## Features

### Core Editor

The core development roadmap includes:

- Raster image creation and import
- Canvas-based image editing
- Drawing tools
- Selection tools
- Undo / Redo
- Multi-layer editing
- Layer masks
- Image filters and effects
- Image export
- Multiple image formats

### Advanced Features

After the core editor is complete, the project roadmap includes additional features such as:

- Advanced selections
- Image transformations
- Advanced history management
- Advanced layer operations
- Filter previews
- Native `.epigimp` project files
- Autosave and recovery
- Canvas performance improvements
- Professional editor workflow improvements

> Features are implemented progressively throughout the project roadmap. The repository may not yet contain every feature listed above.

---

## Tech Stack

EpiGimp currently uses:

- **Electron** — desktop application runtime
- **React** — user interface
- **TypeScript** — application development
- **HTML5 Canvas** — raster rendering and image manipulation
- **Vite** — renderer development and production builds
- **ESLint** — static code analysis
- **Prettier** — code formatting

---

## Architecture

EpiGimp separates desktop functionality, user interface and graphics-editing logic.

```text id="w21mj7"
┌───────────────────────────┐
│   Electron Main Process   │
│                           │
│ Window / OS / Application │
└─────────────┬─────────────┘
              │ IPC
              ▼
┌───────────────────────────┐
│       Preload Layer       │
│                           │
│     contextBridge API     │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│      React Renderer       │
│                           │
│  UI / Canvas / Editor     │
└───────────────────────────┘
```

The renderer is organized into independent application domains:

```text id="xlk2wh"
src/
├── assets/
├── canvas/
├── components/
├── constants/
├── filters/
├── hooks/
├── layers/
├── styles/
├── tools/
├── types/
└── utils/
```

Shared visual values such as colors, typography and spacing are centralized through design tokens.

Shared application values are centralized through constants.

Editing logic, UI components, rendering and operating-system access are kept separate whenever possible.

For a detailed explanation, see [Architecture](./docs/architecture.md).

---

## Getting Started

### Requirements

Make sure the following tools are installed:

```text id="rvbm1m"
Node.js 20.x
npm 10.x
Git
```

### Installation

Clone the repository:

```bash id="7qrivg"
git clone https://github.com/ana-b-c/EpiGimp.git
cd EpiGimp
```

Install dependencies:

```bash id="0o2jge"
npm install
```

Start the development environment:

```bash id="7mbhkm"
npm run dev
```

This launches both the Vite development server and the Electron application.

For complete setup instructions and troubleshooting, see [Installation Guide](./docs/installation.md).

---

## Development

The main development commands are:

```bash id="33hyx4"
npm run dev
npm run lint
npm run format:check
npm run build
```

Before considering a development task complete, the project should pass:

```text id="xhp6na"
ESLint          ✓
Prettier        ✓
TypeScript      ✓
React build     ✓
Electron build  ✓
```

For coding conventions, modularity rules and the development workflow, see [Development Guide](./docs/development.md).

---

## Development Principles

EpiGimp follows several core principles:

- Single responsibility
- Separation of concerns
- Reusable and readable functions
- Centralized shared values
- Minimal duplication
- Modular application domains
- Controlled Electron APIs
- Continuous documentation

The project avoids both large multi-purpose modules and unnecessary over-modularization.

The goal is to keep the codebase understandable and extensible as the graphics editor grows.

---

## Project Roadmap

Development is organized into four milestones.

### Week 1 — Foundation & Core Editing

- Electron + React + TypeScript architecture
- Main editor interface
- Canvas workspace
- Raster document creation and import
- Core drawing and selection tools
- Basic Undo / Redo

### Week 2 — Layers, Masks, Filters & Export

- Multi-layer editing
- Basic layer masks
- Pixel-processing and filters
- Export
- Validation and first release

Weeks 1 and 2 focus on delivering the core raster graphics editor.

### Week 3 — Advanced Editing Workflow

- Advanced selections
- Image transformations
- Advanced history
- History panel
- Advanced layers
- Filter previews

### Week 4 — Professional Workflow & Performance

- Native `.epigimp` project format
- Autosave
- Unsaved-work protection
- Recovery
- Professional UX improvements
- Canvas performance improvements
- Final QA and documentation

The GitHub Project is used to track individual development issues and progress throughout these milestones.

---

## Documentation

Detailed project documentation is available in:

| Document                                     | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| [Installation Guide](./docs/installation.md) | Install, build and run EpiGimp              |
| [Architecture](./docs/architecture.md)       | Understand the technical architecture       |
| [Development Guide](./docs/development.md)   | Development workflow and coding conventions |

Documentation is maintained throughout development and should evolve together with the codebase.

---

## Current Status

EpiGimp is currently under active development.

The initial desktop foundation includes:

- React + TypeScript renderer
- Electron desktop runtime
- Secure preload layer
- Context isolation
- Controlled IPC architecture
- Development and production renderer loading
- Modular source structure
- Centralized design tokens
- ESLint and Prettier configuration
- Development and production builds

Graphics-editing functionality is implemented progressively according to the project roadmap.
