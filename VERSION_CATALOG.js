/**
 * VERSION_CATALOG.js
 *
 * This file contains version information for the Autobase Smart Contract System
 * and provides utilities for tracking and checking module versions.
 */

/**
 * Current version of the entire system
 */
const SYSTEM_VERSION = "1.0.1";

/**
 * Version information for each module
 */
const MODULE_VERSIONS = {
  identity: {
    current: "1.0.0",
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
    history: [
      {
        version: "1.0.0",
        date: "2024-05-16",
        description: "Initial stable release",
        completed: true,
      },
      {
        version: "0.9.0",
        date: "2024-05-13",
        description: "Beta implementation with device registration",
        completed: true,
      },
      {
        version: "0.5.0",
        date: "2024-05-11",
        description: "Proof of concept",
        completed: true,
      },
    ],
  },
  permissions: {
    current: "1.0.1",
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
    history: [
      {
        version: "1.0.1",
        date: "2024-05-16",
        description: "Added missing setAutobase method",
        completed: true,
      },
      {
        version: "1.0.0",
        date: "2024-05-14",
        description: "Initial stable release",
        completed: true,
      },
      {
        version: "0.8.0",
        date: "2024-05-12",
        description: "Beta implementation",
        completed: true,
      },
    ],
  },
  currency: {
    current: "1.0.1",
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
    history: [
      {
        version: "1.0.1",
        date: "2024-05-16",
        description: "Fixed missing apply function in resource management",
        completed: true,
      },
      {
        version: "1.0.0",
        date: "2024-05-14",
        description: "Initial stable release",
        completed: true,
      },
      {
        version: "0.9.5",
        date: "2024-05-13",
        description: "Fixed duplication issues",
        completed: true,
      },
      {
        version: "0.9.0",
        date: "2024-05-11",
        description: "Beta implementation",
        completed: true,
      },
      {
        version: "0.8.0",
        date: "2024-05-09",
        description: "Initial prototype",
        completed: true,
      },
    ],
  },
  web3: {
    current: "1.0.0",
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
    history: [
      {
        version: "1.0.0",
        date: "2024-05-16",
        description: "Initial stable release",
        completed: true,
      },
      {
        version: "0.7.0",
        date: "2024-05-13",
        description: "Prototype implementation",
        completed: true,
      },
    ],
  },
  contracts: {
    current: "1.0.1",
    compatibility: {
      minAutobaseVersion: "7.5.0",
    },
    history: [
      {
        version: "1.0.1",
        date: "2024-05-16",
        description: "Fixed variable declaration issues",
        completed: true,
      },
      {
        version: "1.0.0",
        date: "2024-05-14",
        description: "Initial stable release",
        completed: true,
      },
      {
        version: "0.9.0",
        date: "2024-05-12",
        description: "Beta implementation",
        completed: true,
      },
    ],
  },
};

/**
 * Implementation details for each version
 */
const IMPLEMENTATION_DETAILS = {
  "1.0.1": {
    releaseDate: "2024-05-16",
    description:
      "Bug fix release addressing compatibility issues across modules",
    keyFeatures: [
      {
        text: "Identity Management",
        description: "Seed-based identities with device registration",
        completed: true,
      },
      {
        text: "Permissions System",
        description: "Role-based access control",
        completed: true,
      },
      {
        text: "Currency",
        description: "Token system with transaction persistence",
        completed: true,
      },
      {
        text: "Web3 Integration",
        description: "Blockchain connectivity",
        completed: true,
      },
      {
        text: "Smart Contracts",
        description: "Operation-based contract system",
        completed: true,
      },
    ],
    improvements: [
      {
        text: "Added missing setAutobase method to the permissions module",
        completed: true,
      },
      {
        text: "Fixed resource system's apply function handling in the currency module",
        completed: true,
      },
      {
        text: "Resolved variable declaration issues in the contracts module",
        completed: true,
      },
      {
        text: "Enhanced module initialization and cross-module communication",
        completed: true,
      },
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
  "1.0.0": {
    releaseDate: "2024-05-14",
    description: "Initial stable release of the Autobase Smart Contract System",
    keyFeatures: [
      {
        text: "Identity Management",
        description: "Seed-based identities with device registration",
        completed: true,
      },
      {
        text: "Permissions System",
        description: "Role-based access control",
        completed: true,
      },
      {
        text: "Currency",
        description: "Token system with transaction persistence",
        completed: true,
      },
      {
        text: "Web3 Integration",
        description: "Blockchain connectivity",
        completed: true,
      },
      {
        text: "Smart Contracts",
        description: "Operation-based contract system",
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
      {
        text: "Enhanced compatibility with Autobase v7.5.0",
        completed: true,
      },
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
      status: "in-progress",
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
      status: "planned",
      completed: false,
    },
    {
      name: "Encrypted Messaging",
      module: "communications",
      description: "Add support for encrypted P2P messaging",
      status: "in-progress",
      completed: false,
    },
  ],
  "2.0.0": [
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
    {
      name: "Advanced Contracts",
      module: "contracts",
      description: "Complex contract templates and state machines",
      status: "planned",
      completed: false,
    },
    {
      name: "Scalability Improvements",
      module: "core",
      description: "Improvements for high-volume applications",
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
