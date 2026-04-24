# SRM Full Stack Engineering Challenge

Production-ready submission for the Round 1 SRM Full Stack Engineering Challenge.

This project delivers:

- A lightning-fast `POST /bfhl` REST API that natively parses hierarchical node relationships, resolves duplicates, and handles infinite cycles.
- A highly polished **Asymmetric Futuristic Dashboard** frontend featuring custom CSS clip-paths, glitch animations, and interactive circuit-board tree visualizations.
- A **Monolithic Node.js server** that serves both the API and the pre-built React frontend from a single web service.
- A sample verification script to confirm the implementation perfectly matches the problem statement.

## Candidate Details

- Name: `Yash Srivastava`
- Email: `ys9183@srmist.edu.in`
- Roll Number: `RA2311003010594`

## Challenge Coverage

The implementation handles all required behaviors:

- Validates edges in `X->Y` format where both nodes are single uppercase letters.
- Trims whitespace before validation.
- Rejects invalid inputs including malformed entries and self-loops.
- Detects duplicate edges and reports them once in `duplicate_edges`.
- Resolves multi-parent conflicts by keeping the first parent edge only.
- Builds multiple independent hierarchies.
- Detects cyclic connected components and returns `tree: {}` with `has_cycle: true`.
- Computes longest root-to-leaf depth for non-cyclic trees.
- Returns summary fields including `total_trees`, `total_cycles`, and `largest_tree_root`.
- Enables CORS for cross-origin evaluation.

## Tech Stack

- Backend: `Node.js` with the built-in `http` module
- Frontend: `React` + `Vite`
- Language: `JavaScript`
- Build: `npm`

## Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                     Browser / Evaluator                   │
│  - Opens frontend                                         │
│  - Sends POST /bfhl requests                              │
└──────────────────────────────┬────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                   Node HTTP Server                        │
│                 server/server.js                          │
│                                                           │
│  Responsibilities                                         │
│  - CORS handling                                          │
│  - /health endpoint                                       │
│  - /bfhl endpoint                                         │
│  - Static serving of built frontend                       │
└──────────────────────────────┬────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│               Hierarchy Processing Engine                 │
│                   server/bfhl.js                          │
│                                                           │
│  - Input normalization                                    │
│  - Format validation                                      │
│  - Duplicate detection                                    │
│  - Multi-parent filtering                                 │
│  - Connected component discovery                          │
│  - Cycle detection                                        │
│  - Tree construction                                      │
│  - Depth calculation                                      │
│  - Summary generation                                     │
└───────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                    React Frontend                         │
│                  client/src/App.jsx                       │
│                                                           │
│  - Input area for edge lists                              │
│  - API base URL configuration                             │
│  - Structured response rendering                          │
│  - Hierarchy cards and tree view                          │
│  - Error state handling                                   │
└───────────────────────────────────────────────────────────┘
```

## Folder Structure

```text
srm-bfhl-challenge/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   └── verify-sample.js
├── server/
│   ├── bfhl.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Specification

### Endpoint

`POST /bfhl`

### Request Body

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Response Shape

```json
{
  "user_id": "yashsrivastava_14112004",
  "email_id": "ys9183@srmist.edu.in",
  "college_roll_number": "RA2311003010594",
  "hierarchies": [],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 0,
    "total_cycles": 0,
    "largest_tree_root": ""
  }
}
```

### Core Processing Rules Implemented

1. Inputs are trimmed before validation.
2. Only entries matching `^[A-Z]->[A-Z]$` are accepted.
3. Self-loops such as `A->A` are treated as invalid.
4. Repeated edges are captured once in `duplicate_edges`.
5. For multi-parent cases, the first parent edge wins.
6. Root selection uses:
   - the node with indegree `0`, if available
   - otherwise the lexicographically smallest node for pure cycles
7. Cyclic groups return:
   - `tree: {}`
   - `has_cycle: true`
8. Non-cyclic groups return:
   - nested tree object
   - `depth`

## Example

### Sample Request

```json
{
  "data": [
    "A->B",
    "A->C",
    "B->D",
    "C->E",
    "E->F",
    "X->Y",
    "Y->Z",
    "Z->X",
    "P->Q",
    "Q->R",
    "G->H",
    "G->H",
    "G->I",
    "hello",
    "1->2",
    "A->"
  ]
}
```

### Sample Output

```json
{
  "user_id": "yashsrivastava_14112004",
  "email_id": "ys9183@srmist.edu.in",
  "college_roll_number": "RA2311003010594",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": {
            "D": {}
          },
          "C": {
            "E": {
              "F": {}
            }
          }
        }
      },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    },
    {
      "root": "P",
      "tree": {
        "P": {
          "Q": {
            "R": {}
          }
        }
      },
      "depth": 3
    },
    {
      "root": "G",
      "tree": {
        "G": {
          "H": {},
          "I": {}
        }
      },
      "depth": 2
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## Frontend Highlights: Futuristic Cyber Dashboard

The UI was completely redesigned from standard web forms into a highly interactive, premium dashboard:

- **Asymmetric Geometry**: Uses CSS `clip-path` to create sharp, futuristic hexagonal cuts on data cards and buttons.
- **Glassmorphism & Depth**: Deep dark mode with translucent glass panels (`backdrop-filter`) and neon-glowing drop shadows.
- **Micro-Animations**:
  - A subtle RGB-split glitch animation on the main title.
  - Staggered slide-up entry animations for data cards and metrics.
  - Interactive hover states that light up the tree node connections like a circuit board.
- **Animated Backgrounds**: A responsive `.cyber-grid` with slowly floating cyan and purple ambient light orbs.
- **Collapsible Payload Data**: The raw JSON payload section defaults to a clean, collapsed view to save vertical space.
- **Fully Responsive**: Adapts seamlessly from a split-pane desktop console to a stacked mobile view.

## Local Setup

### 1. Go to the project folder

```bash
cd ~/Desktop/srm-bfhl-challenge
```

### 2. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 3. Prepare environment variables

```bash
cp .env.example .env
```

Current `.env` fields:

```env
FULL_NAME=YASH SRIVASTAVA
DOB_DDMMYYYY=14112004
COLLEGE_EMAIL=ys9183@srmist.edu.in
COLLEGE_ROLL_NUMBER=RA2311003010594
PORT=3001
```

### 4. Start the Monolithic Server

```bash
npm run start
```

The Node backend will now start on `http://localhost:3001`. 
Because it is a monolithic structure, you do not need to run a separate React server! Opening that URL in your browser will automatically serve the production-built React frontend, and hitting `http://localhost:3001/bfhl` will hit the API.

## Available Scripts

From the project root:

```bash
npm run start
npm run verify:sample
npm run build
npm run lint
```

### Script Purpose

- `npm run start`: starts the Node backend
- `npm run verify:sample`: checks the implementation against the sample challenge payload
- `npm run build`: builds the production frontend
- `npm run lint`: runs frontend lint checks

## Verification Status

The project has already been verified locally for:

- sample output correctness
- frontend linting
- production build generation
- live `/health` endpoint response
- live `POST /bfhl` response

## Submission Checklist

- Public GitHub repository created
- Environment variables configured
- Backend deployed
- Frontend accessible
- `/bfhl` publicly reachable
- Submission form updated with:
  - API base URL
  - Frontend URL
  - GitHub repository URL

## Notes

- The backend uses zero external server frameworks to keep runtime simple and fast.
- The processing logic is deterministic and designed for the challenge constraints.
- Identity values are read from `.env`, so the response remains easy to configure if needed.
