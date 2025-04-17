/**
 * Currency and Resource Management Module
 *
 * This module provides functionality for managing in-game currencies
 * and resources using Autobase as the "smart contract" executor.
 */

/**
 * Creates a currency system for an Autobase
 * @param {Object} autobase - The autobase instance
 * @param {Object} options - Configuration options
 * @returns {Object} The currency system
 */
function createCurrencySystem(autobase, options = {}) {
  // Set default options
  const config = {
    name: options.name || "Token",
    symbol: options.symbol || "TKN",
    decimals: options.decimals || 2,
    maxSupply: options.maxSupply || 1000000,
    initialSupply: options.initialSupply || 0,
    initialHolder: options.initialHolder || null,
  };

  // In a real implementation, the state would be maintained by the autobase's apply function
  // For simplicity, we'll use in-memory objects here
  const balances = new Map();
  const transactions = [];
  let totalSupply = 0;

  // Flag to track if the system is initialized from Autobase
  let isInitialized = false;

  // Keep track of processed operations to prevent duplicates
  const processedOperations = new Set();

  // Operation types for the Autobase
  const OP_TYPES = {
    MINT: "MINT",
    TRANSFER: "TRANSFER",
    BURN: "BURN",
  };

  // Initialize with initial supply if specified
  if (config.initialSupply > 0 && config.initialHolder) {
    balances.set(config.initialHolder, config.initialSupply);
    totalSupply = config.initialSupply;
  }

  /**
   * Generate a unique ID for an operation to track duplicates
   * @param {Object} operation - The operation to generate an ID for
   * @returns {string} A unique ID for the operation
   */
  function generateOperationId(operation) {
    if (
      !operation ||
      !operation.system ||
      !operation.data ||
      !operation.timestamp
    ) {
      return null;
    }

    // Create a unique ID based on the operation type, data, and timestamp
    const { type } = operation.data;
    let idParts = [operation.system, type, operation.timestamp];

    switch (type) {
      case "MINT":
        if (operation.data.to && operation.data.amount) {
          idParts.push(operation.data.to, operation.data.amount);
        }
        break;
      case "TRANSFER":
        if (operation.data.from && operation.data.to && operation.data.amount) {
          idParts.push(
            operation.data.from,
            operation.data.to,
            operation.data.amount
          );
        }
        break;
      case "BURN":
        if (operation.data.from && operation.data.amount) {
          idParts.push(operation.data.from, operation.data.amount);
        }
        break;
    }

    return idParts.join("_");
  }

  /**
   * Initialize the currency system by processing existing operations in Autobase
   * @returns {Promise<void>}
   */
  async function initialize() {
    if (isInitialized || !autobase) return;

    try {
      console.log("Initializing currency system from Autobase...");

      // Reset state before loading
      balances.clear();
      transactions.length = 0;
      totalSupply = 0;
      processedOperations.clear();

      // For Autobase 7.5.0, we need to explicitly handle reading operations
      if (autobase.view && typeof autobase.view.get === "function") {
        const length = autobase.view.length;
        console.log(`Loading ${length} operations from Autobase view...`);

        // Process each operation from the view
        for (let i = 0; i < length; i++) {
          try {
            const nodeValue = await autobase.view.get(i);
            if (!nodeValue) continue;

            // Parse the operation
            let operation;
            if (typeof nodeValue === "string") {
              operation = JSON.parse(nodeValue);
            } else if (Buffer.isBuffer(nodeValue)) {
              operation = JSON.parse(nodeValue.toString());
            } else {
              operation = nodeValue;
            }

            // Process currency operations
            if (operation.system === "currency" && operation.data) {
              // Generate a unique ID for this operation
              const opId = generateOperationId(operation);

              // Skip if we've already processed this operation
              if (opId && processedOperations.has(opId)) {
                console.log(
                  `Skipping duplicate operation: ${operation.data.type}`
                );
                continue;
              }

              // Process the operation
              updateFromOperation(operation);

              // Mark as processed if we have an ID
              if (opId) {
                processedOperations.add(opId);
              }
            }
          } catch (error) {
            console.error(`Error processing operation at index ${i}:`, error);
          }
        }
      }

      // Trigger Autobase update to process any new operations
      if (typeof autobase.update === "function") {
        await autobase.update();
      }

      isInitialized = true;
      console.log("Currency system initialized");
    } catch (error) {
      console.error("Failed to initialize currency system:", error);
    }
  }

  /**
   * The apply function for the Autobase
   * This is where all the currency logic happens
   * @param {Array} ops - The operations to apply
   * @returns {Object} The new state
   */
  function apply(ops) {
    // Process operations in order
    for (const op of ops) {
      // Process the operation
      switch (op.type) {
        case OP_TYPES.MINT:
          mintInternal(op.to, op.amount, op.minterId);
          break;

        case OP_TYPES.TRANSFER:
          transferInternal(op.from, op.to, op.amount, op.timestamp);
          break;

        case OP_TYPES.BURN:
          burnInternal(op.from, op.amount, op.burnerId);
          break;
      }
    }

    // Return the updated state
    return {
      balances: Object.fromEntries(balances),
      transactions,
      totalSupply,
      config,
    };
  }

  /**
   * Process currency operation from Autobase
   * @param {Object} operation - The operation from Autobase
   * @returns {boolean} Success status
   */
  function updateFromOperation(operation) {
    try {
      if (operation.system === "currency" && operation.data) {
        console.log(`Processing currency operation: ${operation.data.type}`);

        const { type } = operation.data;

        switch (type) {
          case "MINT":
            const { to, amount, minterId } = operation.data;
            mintInternal(to, amount, minterId);
            console.log(
              `Applied mint operation: ${amount} coins to ${to.slice(0, 10)}...`
            );
            return true;

          case "TRANSFER":
            const {
              from,
              to: recipient,
              amount: transferAmount,
            } = operation.data;
            transferInternal(
              from,
              recipient,
              transferAmount,
              operation.timestamp || Date.now()
            );
            console.log(
              `Applied transfer operation: ${transferAmount} coins from ${from.slice(
                0,
                10
              )}... to ${recipient.slice(0, 10)}...`
            );
            return true;

          case "BURN":
            const {
              from: burnFrom,
              amount: burnAmount,
              burnerId,
            } = operation.data;
            burnInternal(burnFrom, burnAmount, burnerId);
            console.log(
              `Applied burn operation: ${burnAmount} coins from ${burnFrom.slice(
                0,
                10
              )}...`
            );
            return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error applying currency operation:", error);
      return false;
    }
  }

  /**
   * Function to write a currency operation to autobase
   * @param {string} type - The operation type (MINT, TRANSFER, BURN)
   * @param {Object} data - The operation data
   * @returns {Promise<boolean>} Success status
   */
  async function writeOperation(type, data) {
    try {
      if (!autobase) {
        console.warn("No autobase instance provided");
        return false;
      }

      // Create the operation object
      const operation = {
        system: "currency",
        data: {
          type,
          ...data,
        },
        timestamp: Date.now(),
      };

      // Generate an ID and add to the set of processed operations
      const opId = generateOperationId(operation);
      if (opId) {
        processedOperations.add(opId);
      }

      // Append to autobase if it's available
      if (typeof autobase.append === "function") {
        await autobase.append(operation);
        console.log(`Currency operation of type ${type} written to Autobase`);
        return true;
      } else {
        console.warn("Autobase does not have an append method");
        return false;
      }
    } catch (error) {
      console.error("Error writing currency operation:", error);
      return false;
    }
  }

  /**
   * Internal function to mint new currency
   */
  function mintInternal(to, amount, minterId) {
    // Check if minting would exceed max supply
    if (totalSupply + amount > config.maxSupply) {
      // Skip this operation
      transactions.push({
        type: OP_TYPES.MINT,
        to,
        amount,
        minterId,
        timestamp: Date.now(),
        status: "failed",
        reason: "Would exceed max supply",
      });
      return;
    }

    // Mint the currency
    const currentBalance = balances.get(to) || 0;
    balances.set(to, currentBalance + amount);
    totalSupply += amount;

    // Record the transaction
    transactions.push({
      type: OP_TYPES.MINT,
      to,
      amount,
      minterId,
      timestamp: Date.now(),
      status: "success",
    });
  }

  /**
   * Internal function to transfer currency
   */
  function transferInternal(from, to, amount, timestamp) {
    const fromBalance = balances.get(from) || 0;

    // Check if the sender has enough balance
    if (fromBalance < amount) {
      // Skip this operation
      transactions.push({
        type: OP_TYPES.TRANSFER,
        from,
        to,
        amount,
        timestamp,
        status: "failed",
        reason: "Insufficient balance",
      });
      return;
    }

    // Transfer the currency
    balances.set(from, fromBalance - amount);
    const toBalance = balances.get(to) || 0;
    balances.set(to, toBalance + amount);

    // Record the transaction
    transactions.push({
      type: OP_TYPES.TRANSFER,
      from,
      to,
      amount,
      timestamp,
      status: "success",
    });
  }

  /**
   * Internal function to burn currency
   */
  function burnInternal(from, amount, burnerId) {
    const fromBalance = balances.get(from) || 0;

    // Check if the account has enough balance
    if (fromBalance < amount) {
      // Skip this operation
      transactions.push({
        type: OP_TYPES.BURN,
        from,
        amount,
        burnerId,
        timestamp: Date.now(),
        status: "failed",
        reason: "Insufficient balance",
      });
      return;
    }

    // Burn the currency
    balances.set(from, fromBalance - amount);
    totalSupply -= amount;

    // Record the transaction
    transactions.push({
      type: OP_TYPES.BURN,
      from,
      amount,
      burnerId,
      timestamp: Date.now(),
      status: "success",
    });
  }

  /**
   * Mints new currency
   * @param {string} to - The recipient's address
   * @param {number} amount - The amount to mint
   * @param {Object} minter - The minter's identity
   * @returns {boolean} Success status
   */
  function mint(to, amount, minter) {
    // In a real implementation, we would check if the minter is authorized
    // For simplicity, we'll allow anyone to mint in this example

    // Convert inputs for storage
    const toStr =
      typeof to === "object" ? to.publicIdentity.publicKey.toString("hex") : to;

    const minterStr = minter.publicIdentity.publicKey.toString("hex");

    // Create the operation data
    const operationData = {
      to: toStr,
      amount,
      minterId: minterStr,
    };

    // Apply the operation locally
    mintInternal(toStr, amount, minterStr);

    // Write to autobase if available
    if (autobase) {
      writeOperation(OP_TYPES.MINT, operationData).catch((err) => {
        console.error("Failed to write mint operation to autobase:", err);
      });
    }

    // Check if the operation was successful
    const lastTransaction = transactions[transactions.length - 1];
    return lastTransaction.status === "success";
  }

  /**
   * Transfers currency from one account to another
   * @param {Object|string} from - The sender's identity or address
   * @param {Object|string} to - The recipient's identity or address
   * @param {number} amount - The amount to transfer
   * @returns {boolean} Success status
   */
  function transfer(from, to, amount) {
    // Convert inputs for storage
    const fromStr =
      typeof from === "object"
        ? from.publicIdentity.publicKey.toString("hex")
        : from;

    const toStr =
      typeof to === "object" ? to.publicIdentity.publicKey.toString("hex") : to;

    // Create the operation data
    const operationData = {
      from: fromStr,
      to: toStr,
      amount,
      timestamp: Date.now(),
    };

    // Apply the operation locally
    transferInternal(fromStr, toStr, amount, operationData.timestamp);

    // Write to autobase if available
    if (autobase) {
      writeOperation(OP_TYPES.TRANSFER, operationData).catch((err) => {
        console.error("Failed to write transfer operation to autobase:", err);
      });
    }

    // Check if the operation was successful
    const lastTransaction = transactions[transactions.length - 1];
    return lastTransaction.status === "success";
  }

  /**
   * Burns currency
   * @param {Object|string} from - The account to burn from
   * @param {number} amount - The amount to burn
   * @param {Object} burner - The burner's identity
   * @returns {boolean} Success status
   */
  function burn(from, amount, burner) {
    // Convert inputs for storage
    const fromStr =
      typeof from === "object"
        ? from.publicIdentity.publicKey.toString("hex")
        : from;

    const burnerStr = burner.publicIdentity.publicKey.toString("hex");

    // Create the operation data
    const operationData = {
      from: fromStr,
      amount,
      burnerId: burnerStr,
    };

    // Apply the operation locally
    burnInternal(fromStr, amount, burnerStr);

    // Write to autobase if available
    if (autobase) {
      writeOperation(OP_TYPES.BURN, operationData).catch((err) => {
        console.error("Failed to write burn operation to autobase:", err);
      });
    }

    // Check if the operation was successful
    const lastTransaction = transactions[transactions.length - 1];
    return lastTransaction.status === "success";
  }

  /**
   * Gets the balance of an account
   * @param {Object|string} account - The account to check
   * @returns {number} The balance
   */
  function balanceOf(account) {
    const key =
      typeof account === "object"
        ? account.publicIdentity.publicKey.toString("hex")
        : account;

    return balances.get(key) || 0;
  }

  /**
   * Gets transaction history
   * @param {Object} options - Options for filtering transactions
   * @returns {Array} The transaction history
   */
  function getTransactions(options = {}) {
    const { from, to, type, status } = options;

    let filtered = [...transactions];

    if (from) {
      const fromKey =
        typeof from === "object"
          ? from.publicIdentity.publicKey.toString("hex")
          : from;

      filtered = filtered.filter((tx) => tx.from === fromKey);
    }

    if (to) {
      const toKey =
        typeof to === "object"
          ? to.publicIdentity.publicKey.toString("hex")
          : to;

      filtered = filtered.filter((tx) => tx.to === toKey);
    }

    if (type) {
      filtered = filtered.filter((tx) => tx.type === type);
    }

    if (status) {
      filtered = filtered.filter((tx) => tx.status === status);
    }

    return filtered;
  }

  // Initialize the system if autobase is provided
  if (autobase) {
    // Schedule initialization after current execution context
    setTimeout(() => {
      initialize().catch((err) => console.error("Initialization error:", err));
    }, 0);
  }

  return {
    // Core functionality
    mint,
    transfer,
    burn,
    balanceOf,
    getTransactions,

    // System functions for Autobase integration
    updateFromOperation,
    initialize,
    forceInitialize: initialize, // Alias for consistency with identity registry

    // Stats
    get totalSupply() {
      return totalSupply;
    },
  };
}

/**
 * Creates a resource system with operations
 * @param {Object} autobase - The autobase instance
 * @param {Object} options - Options for the resource system
 * @returns {Object} The resource system
 */
function createResourceSystem(autobase, options = {}) {
  // Storage for resources
  const resources = new Map();
  const holdings = new Map();
  const operations = [];
  const processedOperations = new Set();

  // Operation types for the resource system
  const OP_TYPES = {
    CREATE_RESOURCE: "CREATE_RESOURCE",
    MINT_RESOURCE: "MINT_RESOURCE",
    TRANSFER_RESOURCE: "TRANSFER_RESOURCE",
    CONSUME_RESOURCE: "CONSUME_RESOURCE",
  };

  // Initialize resources from options
  if (options.resources) {
    for (const [resourceId, resourceInfo] of Object.entries(
      options.resources
    )) {
      resources.set(resourceId, {
        id: resourceId,
        name: resourceInfo.name,
        description: resourceInfo.description,
        maxSupply: resourceInfo.maxSupply || 0,
        currentSupply: 0,
      });
    }
  }

  // Flag to track if the system is initialized from Autobase
  let isInitialized = false;

  /**
   * Initialize the resource system by processing existing operations in Autobase
   * @returns {Promise<void>}
   */
  async function initialize() {
    if (isInitialized || !autobase) return;

    try {
      console.log("Initializing resource system from Autobase...");

      // Trigger Autobase update to process existing operations
      if (typeof autobase.update === "function") {
        await autobase.update();
      }

      isInitialized = true;
      console.log("Resource system initialized");
    } catch (error) {
      console.error("Failed to initialize resource system:", error);
    }
  }

  /**
   * Process resource operation from Autobase
   * @param {Object} operation - The operation from Autobase
   * @returns {boolean} Success status
   */
  function updateFromOperation(operation) {
    try {
      if (operation.system === "resource" && operation.data) {
        console.log(`Processing resource operation: ${operation.data.type}`);

        const { type } = operation.data;

        switch (type) {
          case "CREATE_RESOURCE":
            const { resourceId, name, description, maxSupply, creatorId } =
              operation.data;
            createResourceInternal(
              resourceId,
              name,
              description,
              maxSupply,
              creatorId
            );
            console.log(
              `Applied create resource operation: ${name} (${resourceId})`
            );
            return true;

          case "MINT_RESOURCE":
            const {
              resourceId: mintResourceId,
              to,
              amount,
              minterId,
            } = operation.data;
            mintResourceInternal(mintResourceId, to, amount, minterId);
            console.log(
              `Applied mint resource operation: ${amount} of ${mintResourceId} to ${to.slice(
                0,
                10
              )}...`
            );
            return true;

          case "TRANSFER_RESOURCE":
            const {
              resourceId: transferResourceId,
              from,
              to: recipient,
              amount: transferAmount,
            } = operation.data;
            transferResourceInternal(
              transferResourceId,
              from,
              recipient,
              transferAmount,
              operation.timestamp || Date.now()
            );
            console.log(
              `Applied transfer resource operation: ${transferAmount} of ${transferResourceId}`
            );
            return true;

          case "CONSUME_RESOURCE":
            const {
              resourceId: consumeResourceId,
              from: consumer,
              amount: consumeAmount,
              reason,
            } = operation.data;
            consumeResourceInternal(
              consumeResourceId,
              consumer,
              consumeAmount,
              reason,
              operation.timestamp || Date.now()
            );
            console.log(
              `Applied consume resource operation: ${consumeAmount} of ${consumeResourceId}`
            );
            return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error applying resource operation:", error);
      return false;
    }
  }

  /**
   * Function to write a resource operation to autobase
   * @param {string} type - The operation type
   * @param {Object} data - The operation data
   * @returns {Promise<boolean>} Success status
   */
  async function writeOperation(type, data) {
    try {
      if (!autobase) {
        console.warn("No autobase instance provided");
        return false;
      }

      // Create the operation object
      const operation = {
        system: "resource",
        data: {
          type,
          ...data,
        },
        timestamp: Date.now(),
      };

      // Append to autobase if it's available
      if (typeof autobase.append === "function") {
        await autobase.append(operation);
        console.log(`Resource operation of type ${type} written to Autobase`);
        return true;
      } else {
        console.warn("Autobase does not have an append method");
        return false;
      }
    } catch (error) {
      console.error("Error writing resource operation:", error);
      return false;
    }
  }

  /**
   * Internal function to create a resource
   */
  function createResourceInternal(
    resourceId,
    name,
    description,
    maxSupply,
    creatorId
  ) {
    resources.set(resourceId, {
      id: resourceId,
      name,
      description,
      maxSupply: maxSupply || 0,
      currentSupply: 0,
      createdAt: Date.now(),
      createdBy: creatorId,
    });

    operations.push({
      type: OP_TYPES.CREATE_RESOURCE,
      resourceId,
      name,
      description,
      maxSupply,
      creatorId,
      timestamp: Date.now(),
      status: "success",
    });
  }

  /**
   * Internal function to mint a resource
   */
  function mintResourceInternal(resourceId, to, amount, minterId) {
    const resource = resources.get(resourceId);

    // Check if the resource exists
    if (!resource) {
      operations.push({
        type: OP_TYPES.MINT_RESOURCE,
        resourceId,
        to,
        amount,
        minterId,
        timestamp: Date.now(),
        status: "failed",
        reason: "Resource does not exist",
      });
      return;
    }

    // Check if minting would exceed max supply
    if (
      resource.maxSupply > 0 &&
      resource.currentSupply + amount > resource.maxSupply
    ) {
      operations.push({
        type: OP_TYPES.MINT_RESOURCE,
        resourceId,
        to,
        amount,
        minterId,
        timestamp: Date.now(),
        status: "failed",
        reason: "Would exceed max supply",
      });
      return;
    }

    // Mint the resource
    if (!holdings.has(to)) {
      holdings.set(to, new Map());
    }

    const userHoldings = holdings.get(to);
    const currentAmount = userHoldings.get(resourceId) || 0;
    userHoldings.set(resourceId, currentAmount + amount);

    // Update the resource supply
    resource.currentSupply += amount;
    resources.set(resourceId, resource);

    operations.push({
      type: OP_TYPES.MINT_RESOURCE,
      resourceId,
      to,
      amount,
      minterId,
      timestamp: Date.now(),
      status: "success",
    });
  }

  /**
   * Internal function to transfer a resource
   */
  function transferResourceInternal(resourceId, from, to, amount, timestamp) {
    // Check if the sender has enough of the resource
    if (!holdings.has(from)) {
      operations.push({
        type: OP_TYPES.TRANSFER_RESOURCE,
        resourceId,
        from,
        to,
        amount,
        timestamp,
        status: "failed",
        reason: "Sender has no holdings",
      });
      return;
    }

    const senderHoldings = holdings.get(from);
    const senderAmount = senderHoldings.get(resourceId) || 0;

    if (senderAmount < amount) {
      operations.push({
        type: OP_TYPES.TRANSFER_RESOURCE,
        resourceId,
        from,
        to,
        amount,
        timestamp,
        status: "failed",
        reason: "Insufficient resources",
      });
      return;
    }

    // Transfer the resource
    senderHoldings.set(resourceId, senderAmount - amount);

    if (!holdings.has(to)) {
      holdings.set(to, new Map());
    }

    const receiverHoldings = holdings.get(to);
    const receiverAmount = receiverHoldings.get(resourceId) || 0;
    receiverHoldings.set(resourceId, receiverAmount + amount);

    operations.push({
      type: OP_TYPES.TRANSFER_RESOURCE,
      resourceId,
      from,
      to,
      amount,
      timestamp,
      status: "success",
    });
  }

  /**
   * Internal function to consume a resource
   */
  function consumeResourceInternal(
    resourceId,
    from,
    amount,
    reason,
    timestamp
  ) {
    // Check if the user has enough of the resource
    if (!holdings.has(from)) {
      operations.push({
        type: OP_TYPES.CONSUME_RESOURCE,
        resourceId,
        from,
        amount,
        reason,
        timestamp,
        status: "failed",
        reason: "User has no holdings",
      });
      return;
    }

    const userHoldings = holdings.get(from);
    const userAmount = userHoldings.get(resourceId) || 0;

    if (userAmount < amount) {
      operations.push({
        type: OP_TYPES.CONSUME_RESOURCE,
        resourceId,
        from,
        amount,
        reason,
        timestamp,
        status: "failed",
        reason: "Insufficient resources",
      });
      return;
    }

    // Consume the resource
    userHoldings.set(resourceId, userAmount - amount);

    // Update the resource supply
    const resource = resources.get(resourceId);
    resource.currentSupply -= amount;
    resources.set(resourceId, resource);

    operations.push({
      type: OP_TYPES.CONSUME_RESOURCE,
      resourceId,
      from,
      amount,
      reason,
      timestamp,
      status: "success",
    });
  }

  /**
   * Creates a new resource
   * @param {string} name - The name of the resource
   * @param {string} description - The description of the resource
   * @param {number} maxSupply - The maximum supply of the resource (0 for unlimited)
   * @param {Object} creator - The creator's identity
   * @returns {Object} The created resource
   */
  function createResource(name, description, maxSupply, creator) {
    const resourceId = `resource_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const operation = {
      type: OP_TYPES.CREATE_RESOURCE,
      resourceId,
      name,
      description,
      maxSupply,
      creatorId: creator.publicIdentity.publicKey.toString("hex"),
    };

    applyResourceOperations([operation]);

    return resources.get(resourceId);
  }

  /**
   * Apply operations to update the resource system state
   * @param {Array} ops - Operations to apply
   */
  function applyResourceOperations(ops) {
    for (const op of ops) {
      updateFromOperation({
        system: "resource",
        data: op,
      });
    }
  }

  /**
   * Mints a resource
   * @param {string} resourceId - The ID of the resource
   * @param {Object|string} to - The recipient's identity or address
   * @param {number} amount - The amount to mint
   * @param {Object} minter - The minter's identity
   * @returns {boolean} Success status
   */
  function mintResource(resourceId, to, amount, minter) {
    const operation = {
      type: OP_TYPES.MINT_RESOURCE,
      resourceId,
      to:
        typeof to === "object"
          ? to.publicIdentity.publicKey.toString("hex")
          : to,
      amount,
      minterId: minter.publicIdentity.publicKey.toString("hex"),
    };

    applyResourceOperations([operation]);

    const lastOperation = operations[operations.length - 1];
    return lastOperation.status === "success";
  }

  /**
   * Transfers a resource from one account to another
   * @param {string} resourceId - The ID of the resource
   * @param {Object|string} from - The sender's identity or address
   * @param {Object|string} to - The recipient's identity or address
   * @param {number} amount - The amount to transfer
   * @returns {boolean} Success status
   */
  function transferResource(resourceId, from, to, amount) {
    const operation = {
      type: OP_TYPES.TRANSFER_RESOURCE,
      resourceId,
      from:
        typeof from === "object"
          ? from.publicIdentity.publicKey.toString("hex")
          : from,
      to:
        typeof to === "object"
          ? to.publicIdentity.publicKey.toString("hex")
          : to,
      amount,
      timestamp: Date.now(),
    };

    applyResourceOperations([operation]);

    const lastOperation = operations[operations.length - 1];
    return lastOperation.status === "success";
  }

  /**
   * Consumes a resource
   * @param {string} resourceId - The ID of the resource
   * @param {Object|string} from - The account to consume from
   * @param {number} amount - The amount to consume
   * @param {string} reason - The reason for consumption
   * @returns {boolean} Success status
   */
  function consumeResource(resourceId, from, amount, reason) {
    const operation = {
      type: OP_TYPES.CONSUME_RESOURCE,
      resourceId,
      from:
        typeof from === "object"
          ? from.publicIdentity.publicKey.toString("hex")
          : from,
      amount,
      reason,
      timestamp: Date.now(),
    };

    applyResourceOperations([operation]);

    const lastOperation = operations[operations.length - 1];
    return lastOperation.status === "success";
  }

  /**
   * Gets the resource holdings of an account
   * @param {Object|string} account - The account to check
   * @returns {Object} The account's resource holdings
   */
  function getHoldings(account) {
    const address =
      typeof account === "object"
        ? account.publicIdentity.publicKey.toString("hex")
        : account;

    if (!holdings.has(address)) {
      return {};
    }

    return Object.fromEntries(holdings.get(address));
  }

  /**
   * Gets all resources
   * @returns {Array} All resources
   */
  function getAllResources() {
    return Array.from(resources.values());
  }

  /**
   * Gets a specific resource
   * @param {string} resourceId - The ID of the resource
   * @returns {Object} The resource
   */
  function getResource(resourceId) {
    return resources.get(resourceId);
  }

  // Initialize the system if autobase is provided
  if (autobase) {
    // Schedule initialization after current execution context
    setTimeout(() => {
      initialize().catch((err) => console.error("Initialization error:", err));
    }, 0);
  }

  return {
    // Methods
    createResource,
    mintResource,
    transferResource,
    consumeResource,
    getHoldings,
    getAllResources,
    getResource,

    // Add new methods for Autobase integration
    updateFromOperation,
    initialize,
    forceInitialize: initialize,
  };
}

module.exports = {
  createCurrencySystem,
  createResourceSystem,
};
