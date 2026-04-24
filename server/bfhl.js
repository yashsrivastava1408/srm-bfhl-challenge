const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

function normalizeEntry(entry) {
  if (typeof entry !== 'string') {
    return null;
  }

  return entry.trim();
}

function formatUserId(fullName, dob) {
  const normalizedName = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return `${normalizedName || 'fullname'}_${dob}`;
}

function getIdentity() {
  const fullName = process.env.FULL_NAME || 'Your Full Name';
  const dob = process.env.DOB_DDMMYYYY || '17091999';

  return {
    user_id: formatUserId(fullName, dob),
    email_id: process.env.COLLEGE_EMAIL || 'your.name@college.edu',
    college_roll_number: process.env.COLLEGE_ROLL_NUMBER || '21CS1001',
  };
}

function buildTree(root, childrenByParent) {
  const children = childrenByParent.get(root) || [];
  const branch = {};

  for (const child of children) {
    branch[child] = buildTree(child, childrenByParent);
  }

  return branch;
}

function getDepth(root, childrenByParent) {
  const children = childrenByParent.get(root) || [];

  if (children.length === 0) {
    return 1;
  }

  let maxChildDepth = 0;

  for (const child of children) {
    maxChildDepth = Math.max(maxChildDepth, getDepth(child, childrenByParent));
  }

  return maxChildDepth + 1;
}

function hasCycleFrom(root, childrenByParent, componentNodes) {
  const visiting = new Set();
  const visited = new Set();

  function visit(node) {
    if (!componentNodes.has(node)) {
      return false;
    }

    if (visiting.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visiting.add(node);

    for (const child of childrenByParent.get(node) || []) {
      if (visit(child)) {
        return true;
      }
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of componentNodes) {
    if (visit(node)) {
      return true;
    }
  }

  return false;
}

function getComponents(nodes, undirectedGraph, firstSeenByNode) {
  const components = [];
  const visited = new Set();
  const orderedNodes = [...nodes].sort((left, right) => {
    return firstSeenByNode.get(left) - firstSeenByNode.get(right);
  });

  for (const startNode of orderedNodes) {
    if (visited.has(startNode)) {
      continue;
    }

    const stack = [startNode];
    const componentNodes = new Set();

    while (stack.length > 0) {
      const node = stack.pop();

      if (visited.has(node)) {
        continue;
      }

      visited.add(node);
      componentNodes.add(node);

      for (const neighbor of undirectedGraph.get(node) || []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }

    components.push(componentNodes);
  }

  return components.sort((left, right) => {
    const leftOrder = Math.min(...[...left].map((node) => firstSeenByNode.get(node)));
    const rightOrder = Math.min(...[...right].map((node) => firstSeenByNode.get(node)));
    return leftOrder - rightOrder;
  });
}

export function processHierarchy(data) {
  const identity = getIdentity();
  const invalidEntries = [];
  const duplicateEdges = [];
  const duplicateEdgeSet = new Set();
  const seenValidEdges = new Set();
  const retainedEdges = [];
  const childOwner = new Map();

  if (!Array.isArray(data)) {
    return {
      ...identity,
      hierarchies: [],
      invalid_entries: ['Request body must include a data array'],
      duplicate_edges: [],
      summary: {
        total_trees: 0,
        total_cycles: 0,
        largest_tree_root: '',
      },
    };
  }

  data.forEach((entry) => {
    const normalized = normalizeEntry(entry);

    if (normalized === null) {
      invalidEntries.push(String(entry));
      return;
    }

    if (normalized.length === 0) {
      invalidEntries.push('');
      return;
    }

    const match = normalized.match(EDGE_PATTERN);

    if (!match || match[1] === match[2]) {
      invalidEntries.push(normalized);
      return;
    }

    if (seenValidEdges.has(normalized)) {
      if (!duplicateEdgeSet.has(normalized)) {
        duplicateEdges.push(normalized);
        duplicateEdgeSet.add(normalized);
      }
      return;
    }

    seenValidEdges.add(normalized);

    const [, parent, child] = match;

    if (childOwner.has(child)) {
      return;
    }

    childOwner.set(child, parent);
    retainedEdges.push({ parent, child });
  });

  const nodes = new Set();
  const indegree = new Map();
  const childrenByParent = new Map();
  const undirectedGraph = new Map();
  const firstSeenByNode = new Map();

  retainedEdges.forEach(({ parent, child }, index) => {
    nodes.add(parent);
    nodes.add(child);

    if (!firstSeenByNode.has(parent)) {
      firstSeenByNode.set(parent, index);
    }

    if (!firstSeenByNode.has(child)) {
      firstSeenByNode.set(child, index + 0.1);
    }

    if (!childrenByParent.has(parent)) {
      childrenByParent.set(parent, []);
    }

    childrenByParent.get(parent).push(child);
    indegree.set(child, (indegree.get(child) || 0) + 1);

    if (!indegree.has(parent)) {
      indegree.set(parent, indegree.get(parent) || 0);
    }

    if (!undirectedGraph.has(parent)) {
      undirectedGraph.set(parent, new Set());
    }

    if (!undirectedGraph.has(child)) {
      undirectedGraph.set(child, new Set());
    }

    undirectedGraph.get(parent).add(child);
    undirectedGraph.get(child).add(parent);
  });

  const hierarchies = [];
  const components = getComponents(nodes, undirectedGraph, firstSeenByNode);
  let largestTreeRoot = '';
  let largestDepth = 0;
  let totalTrees = 0;
  let totalCycles = 0;

  for (const componentNodes of components) {
    const candidates = [...componentNodes]
      .filter((node) => (indegree.get(node) || 0) === 0)
      .sort();
    const root = candidates[0] || [...componentNodes].sort()[0];
    const cycleDetected = hasCycleFrom(root, childrenByParent, componentNodes);

    if (cycleDetected) {
      totalCycles += 1;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    const tree = {
      [root]: buildTree(root, childrenByParent),
    };
    const depth = getDepth(root, childrenByParent);

    totalTrees += 1;

    if (
      depth > largestDepth ||
      (depth === largestDepth && (largestTreeRoot === '' || root < largestTreeRoot))
    ) {
      largestDepth = depth;
      largestTreeRoot = root;
    }

    hierarchies.push({
      root,
      tree,
      depth,
    });
  }

  return {
    ...identity,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot,
    },
  };
}
