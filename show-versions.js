#!/usr/bin/env node

/**
 * show-versions.js
 *
 * A utility script to display version information for the Autobase Smart Contract System.
 * Run with: node show-versions.js
 */

const versionCatalog = require("./VERSION_CATALOG");
const path = require("path");

/**
 * Display formatted version information
 */
function displayVersionInfo() {
  const systemVersion = versionCatalog.getSystemVersion();

  console.log("\n=================================================");
  console.log(`  AUTOBASE SMART CONTRACT SYSTEM - v${systemVersion}`);
  console.log("=================================================\n");

  // Display system version details
  const details = versionCatalog.getImplementationDetails(systemVersion);
  console.log(`Release Date: ${details.releaseDate}`);
  console.log(`Description: ${details.description}\n`);

  console.log("Key Features:");
  details.keyFeatures.forEach((feature) => {
    const statusIcon = versionCatalog.getStatusIcon(feature.completed);
    console.log(`  ${statusIcon} ${feature.text}`);
  });
  console.log("");

  // Display module versions
  console.log("Module Versions:");
  console.log("--------------");

  const modules = Object.keys(versionCatalog.MODULE_VERSIONS);
  const maxLength = Math.max(...modules.map((m) => m.length));

  modules.forEach((module) => {
    const version = versionCatalog.getModuleVersion(module);
    const paddedModule = module.padEnd(maxLength);
    console.log(`  ${paddedModule} : v${version} ✅`);
  });

  console.log("\nLatest Changes:");
  console.log("--------------");
  modules.forEach((module) => {
    const history = versionCatalog.getModuleHistory(module);
    if (history && history.length > 0) {
      const latest = history[0];
      const statusIcon = versionCatalog.getStatusIcon(latest.completed);
      console.log(
        `  ${module} (v${latest.version} - ${latest.date}): ${statusIcon}`
      );
      console.log(`    ${latest.description}`);
    }
  });

  console.log("\nDependency Compatibility:");
  console.log("------------------------");
  Object.entries(versionCatalog.DEPENDENCY_COMPATIBILITY).forEach(
    ([dep, info]) => {
      console.log(
        `  ${dep}: ^${info.minVersion} (recommended: ${info.recommended})`
      );
    }
  );

  console.log("\nKnown Issues:");
  console.log("------------");
  details.knownIssues.forEach((issue) => {
    const statusIcon = issue.resolved ? "✅ [RESOLVED]" : "⚠️ [OPEN]";
    console.log(`  ${statusIcon} ${issue.text}`);
  });

  console.log("\nUpcoming Features:");
  console.log("-----------------");
  try {
    const nextVersion = "1.1.0";
    const features = versionCatalog.getPlannedFeatures(nextVersion);
    console.log(`Planned for v${nextVersion}:`);
    features.forEach((feature) => {
      // Display status indicator based on feature status
      let statusIndicator;
      if (feature.completed) {
        statusIndicator = "✅ [COMPLETED]";
      } else if (feature.status === "in-progress") {
        statusIndicator = "🔄 [IN PROGRESS]";
      } else {
        statusIndicator = "⏳ [PLANNED]";
      }

      console.log(
        `  ${statusIndicator} ${feature.name} (${feature.module}): ${feature.description}`
      );
    });

    // Also show v2.0.0 planned features
    console.log(`\nPlanned for v2.0.0:`);
    const v2Features = versionCatalog.getPlannedFeatures("2.0.0");
    v2Features.forEach((feature) => {
      // Display status indicator based on feature status
      let statusIndicator;
      if (feature.completed) {
        statusIndicator = "✅ [COMPLETED]";
      } else if (feature.status === "in-progress") {
        statusIndicator = "🔄 [IN PROGRESS]";
      } else {
        statusIndicator = "⏳ [PLANNED]";
      }

      console.log(
        `  ${statusIndicator} ${feature.name} (${feature.module}): ${feature.description}`
      );
    });
  } catch (error) {
    console.log("  No upcoming features defined");
  }

  console.log("\n=================================================\n");
}

/**
 * Display module-specific information
 * @param {string} moduleName - The name of the module
 */
function displayModuleInfo(moduleName) {
  try {
    const moduleInfo = versionCatalog.MODULE_VERSIONS[moduleName];
    if (!moduleInfo) {
      console.error(`Module '${moduleName}' not found.`);
      return;
    }

    console.log("\n=================================================");
    console.log(
      `  MODULE: ${moduleName.toUpperCase()} - v${moduleInfo.current} ✅`
    );
    console.log("=================================================\n");

    console.log("Version History:");
    console.log("---------------");
    moduleInfo.history.forEach((entry) => {
      const statusIcon = versionCatalog.getStatusIcon(entry.completed);
      console.log(`  v${entry.version} (${entry.date}): ${statusIcon}`);
      console.log(`    ${entry.description}`);
    });

    console.log("\nCompatibility:");
    console.log("-------------");
    console.log(
      `  Minimum Autobase Version: v${moduleInfo.compatibility.minAutobaseVersion}`
    );

    console.log("\n=================================================\n");
  } catch (error) {
    console.error(`Error displaying module info: ${error.message}`);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments, display overall version info
    displayVersionInfo();
  } else if (args[0] === "--module" && args[1]) {
    // Display specific module info
    displayModuleInfo(args[1]);
  } else if (args[0] === "--list-modules") {
    // List all available modules
    console.log("\nAvailable Modules:");
    console.log("-----------------");
    Object.keys(versionCatalog.MODULE_VERSIONS).forEach((module) => {
      const version = versionCatalog.getModuleVersion(module);
      console.log(`  - ${module} (v${version}) ✅`);
    });
    console.log("");
  } else if (args[0] === "--help") {
    // Display help information
    console.log("\nUsage:");
    console.log(
      "  node show-versions.js                 Display overall version information"
    );
    console.log(
      "  node show-versions.js --module NAME   Display information for a specific module"
    );
    console.log(
      "  node show-versions.js --list-modules  List all available modules"
    );
    console.log(
      "  node show-versions.js --help          Display this help message\n"
    );
  } else {
    console.error("Invalid arguments. Use --help for usage information.");
  }
}

main();
