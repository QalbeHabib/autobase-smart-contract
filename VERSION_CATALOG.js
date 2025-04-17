/**
 * VERSION_CATALOG.js
 *
 * This file contains version information for the Autobase Smart Contract System
 * and provides utilities for tracking and checking module versions.
 */

/**
 * Current version of the entire system
 */
const SYSTEM_VERSION = "1.0.0";

/**
 * Version information for each module
 */
const MODULE_VERSIONS = {
  identity: {
    current: "1.0.0",
    history: [
      {
        version: "1.0.0",
        date: "2024-05-01",
        description:
          "Initial implementation with seed-based identity generation and device management",
        completed: true,
      },
      {
        version: "0.9.0",
        date: "2024-04-15",
        description: "Beta implementation with basic device registration",
        completed: true,
      },
      {
        version: "0.5.0",
        date: "2024-03-10",
        description: "Proof of concept with key derivation",
        completed: true,
      },
    ],
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
  },
  permissions: {
    current: "1.0.0",
    history: [
      {
        version: "1.0.0",
        date: "2024-05-01",
        description: "Initial implementation with role-based access control",
        completed: true,
      },
      {
        version: "0.8.0",
        date: "2024-04-10",
        description: "Beta implementation with basic permission checks",
        completed: true,
      },
    ],
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
  },
  currency: {
    current: "1.0.0",
    history: [
      {
        version: "1.0.0",
        date: "2024-05-01",
        description: "Initial implementation with full token functionality",
        completed: true,
      },
      {
        version: "0.9.5",
        date: "2024-04-25",
        description: "Fixed duplication of operations during initialization",
        completed: true,
      },
      {
        version: "0.9.0",
        date: "2024-04-20",
        description: "Beta implementation with basic token operations",
        completed: true,
      },
      {
        version: "0.8.0",
        date: "2024-04-10",
        description: "Initial prototype with in-memory balances",
        completed: true,
      },
    ],
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
  },
  web3: {
    current: "1.0.0",
    history: [
      {
        version: "1.0.0",
        date: "2024-05-01",
        description: "Initial implementation with token verification",
        completed: true,
      },
      {
        version: "0.7.0",
        date: "2024-04-05",
        description: "Prototype with simulated blockchain interaction",
        completed: true,
      },
    ],
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
  },
  contracts: {
    current: "1.0.0",
    history: [
      {
        version: "1.0.0",
        date: "2024-05-01",
        description:
          "Initial implementation with full integration of all modules",
        completed: true,
      },
      {
        version: "0.9.0",
        date: "2024-04-15",
        description: "Beta implementation with basic operation handling",
        completed: true,
      },
    ],
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
  },
};

/**
 * Implementation details for each version
 */
const IMPLEMENTATION_DETAILS = {
  "1.0.0": {
    releaseDate: "2024-05-01",
    description: "Initial stable release of the Autobase Smart Contract System",
    keyFeatures: [
      {
        text: "Seed-based identity generation with multi-device support",
        completed: true,
      },
      { text: "Role-based access control system", completed: true },
      {
        text: "Token and resource management with persistence",
        completed: true,
      },
      { text: "Web3 integration for token-gated access", completed: true },
      {
        text: "Full Autobase integration for distributed operations",
        completed: true,
      },
    ],
    improvements: [
      {
        text: "Added persistence for all operations through Autobase",
        completed: true,
      },
      {
        text: "Fixed duplication issues in currency operations",
        completed: true,
      },
      {
        text: "Improved error handling throughout all modules",
        completed: true,
      },
      { text: "Enhanced compatibility with Autobase v7.5.0", completed: true },
    ],
    knownIssues: [
      {
        text: "Web3 module requires further testing with live blockchain integration",
        resolved: false,
      },
      {
        text: "Performance optimizations needed for large operation sets",
        resolved: false,
      },
    ],
  },
};

/**
 * Dependency compatibility information
 */
const DEPENDENCY_COMPATIBILITY = {
  autobase: {
    minVersion: "7.5.0",
    recommended: "7.5.0",
    tested: ["7.5.0"],
  },
  hypercore: {
    minVersion: "10.0.0",
    recommended: "10.0.0",
    tested: ["10.0.0"],
  },
  corestore: {
    minVersion: "6.0.0",
    recommended: "6.0.0",
    tested: ["6.0.0"],
  },
  nodejs: {
    minVersion: "16.0.0",
    recommended: "18.0.0",
    tested: ["16.0.0", "18.0.0", "20.0.0"],
  },
};

/**
 * Planned features for future versions
 */
const PLANNED_FEATURES = {
  "1.1.0": [
    {
      name: "Enhanced Resources",
      module: "currency",
      description: "Advanced resource management with crafting",
      status: "planned",
      completed: false,
    },
    {
      name: "NFT Support",
      module: "web3",
      description: "Native support for NFTs and collectibles",
      status: "planned",
      completed: false,
    },
    {
      name: "Performance Optimization",
      module: "core",
      description: "Improved handling of large operation sets",
      status: "in-progress",
      completed: false,
    },
    {
      name: "Encrypted Messaging",
      module: "communications",
      description: "Add support for encrypted P2P messaging",
      status: "planned",
      completed: false,
    },
  ],
  "2.0.0": [
    {
      name: "Custom Smart Contracts",
      module: "contracts",
      description: "User-defined smart contract functionality",
      status: "planned",
      completed: false,
    },
    {
      name: "Governance System",
      module: "dao",
      description: "Decentralized governance for system parameters",
      status: "planned",
      completed: false,
    },
    {
      name: "Cross-Chain Bridge",
      module: "web3",
      description: "Enhanced interoperability with multiple blockchains",
      status: "planned",
      completed: false,
    },
  ],
};

/**
 * Compare version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }

  return 0;
}

/**
 * Check if a module version is compatible with a dependency version
 * @param {string} moduleName - The name of the module to check
 * @param {string} dependencyName - The name of the dependency
 * @param {string} dependencyVersion - The version of the dependency
 * @returns {boolean} True if compatible, false otherwise
 */
function isCompatible(moduleName, dependencyName, dependencyVersion) {
  if (!MODULE_VERSIONS[moduleName]) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  if (!DEPENDENCY_COMPATIBILITY[dependencyName]) {
    throw new Error(`Unknown dependency: ${dependencyName}`);
  }

  const minVersion = DEPENDENCY_COMPATIBILITY[dependencyName].minVersion;
  return compareVersions(dependencyVersion, minVersion) >= 0;
}

/**
 * Get the current version of a module
 * @param {string} moduleName - The name of the module
 * @returns {string} The current version
 */
function getModuleVersion(moduleName) {
  if (!MODULE_VERSIONS[moduleName]) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  return MODULE_VERSIONS[moduleName].current;
}

/**
 * Get the current version of the entire system
 * @returns {string} The current system version
 */
function getSystemVersion() {
  return SYSTEM_VERSION;
}

/**
 * Get the version history for a module
 * @param {string} moduleName - The name of the module
 * @returns {Array} Version history
 */
function getModuleHistory(moduleName) {
  if (!MODULE_VERSIONS[moduleName]) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  return MODULE_VERSIONS[moduleName].history;
}

/**
 * Get implementation details for a version
 * @param {string} version - The version to get details for
 * @returns {Object} Implementation details
 */
function getImplementationDetails(version) {
  if (!IMPLEMENTATION_DETAILS[version]) {
    throw new Error(`Unknown version: ${version}`);
  }

  return IMPLEMENTATION_DETAILS[version];
}

/**
 * Get planned features for a future version
 * @param {string} version - The future version
 * @returns {Array} Planned features
 */
function getPlannedFeatures(version) {
  if (!PLANNED_FEATURES[version]) {
    throw new Error(`No planned features for version: ${version}`);
  }

  return PLANNED_FEATURES[version];
}

/**
 * Get status icon for completed features
 * @param {boolean} completed - Whether the feature is completed
 * @returns {string} Check mark or empty string
 */
function getStatusIcon(completed) {
  return completed ? "✅" : "⏳";
}

module.exports = {
  getSystemVersion,
  getModuleVersion,
  getModuleHistory,
  getImplementationDetails,
  getPlannedFeatures,
  isCompatible,
  compareVersions,
  getStatusIcon,

  // Export constants for direct access
  SYSTEM_VERSION,
  MODULE_VERSIONS,
  IMPLEMENTATION_DETAILS,
  DEPENDENCY_COMPATIBILITY,
  PLANNED_FEATURES,
};
