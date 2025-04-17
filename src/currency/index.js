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

    // Create the operation
    const operation = {
      type: OP_TYPES.MINT,
      to:
        typeof to === "object"
          ? to.publicIdentity.publicKey.toString("hex")
          : to,
      amount,
      minterId: minter.publicIdentity.publicKey.toString("hex"),
    };

    // Apply the operation
    const result = apply([operation]);

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
    // Create the operation
    const operation = {
      type: OP_TYPES.TRANSFER,
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

    // Apply the operation
    const result = apply([operation]);

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
    // Create the operation
    const operation = {
      type: OP_TYPES.BURN,
      from:
        typeof from === "object"
          ? from.publicIdentity.publicKey.toString("hex")
          : from,
      amount,
      burnerId: burner.publicIdentity.publicKey.toString("hex"),
    };

    // Apply the operation
    const result = apply([operation]);

    // Check if the operation was successful
    const lastTransaction = transactions[transactions.length - 1];
    return lastTransaction.status === "success";
  }

  /**
   * Gets the balance of an account
   * @param {Object|string} account - The account to check
   * @returns {number} The account balance
   */
  function balanceOf(account) {
    const address =
      typeof account === "object"
        ? account.publicIdentity.publicKey.toString("hex")
        : account;

    return balances.get(address) || 0;
  }

  /**
   * Gets the transaction history
   * @param {Object} options - Filter options
   * @returns {Array} The filtered transactions
   */
  function getTransactions(options = {}) {
    let filteredTransactions = [...transactions];

    // Filter by account
    if (options.account) {
      const address =
        typeof options.account === "object"
          ? options.account.publicIdentity.publicKey.toString("hex")
          : options.account;

      filteredTransactions = filteredTransactions.filter(
        (tx) => tx.from === address || tx.to === address
      );
    }

    // Filter by type
    if (options.type) {
      filteredTransactions = filteredTransactions.filter(
        (tx) => tx.type === options.type
      );
    }

    // Filter by status
    if (options.status) {
      filteredTransactions = filteredTransactions.filter(
        (tx) => tx.status === options.status
      );
    }

    return filteredTransactions;
  }

  return {
    // Currency info
    name: config.name,
    symbol: config.symbol,
    decimals: config.decimals,
    maxSupply: config.maxSupply,

    // Methods
    mint,
    transfer,
    burn,
    balanceOf,
    getTransactions,

    // State accessors
    get totalSupply() {
      return totalSupply;
    },
  };
}

/**
 * Creates a resource system for an Autobase
 * @param {Object} autobase - The autobase instance
 * @param {Object} options - Configuration options
 * @returns {Object} The resource system
 */
function createResourceSystem(autobase, options = {}) {
  // Similar to currency system, but with additional features for resource management
  // This is a simplified version that could be expanded upon

  // Define the resources
  const resources = new Map();

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

  // A map of who owns which resources
  // Map<userAddress, Map<resourceId, amount>>
  const holdings = new Map();

  // Resource operations
  const operations = [];

  // Operation types
  const OP_TYPES = {
    CREATE_RESOURCE: "CREATE_RESOURCE",
    MINT_RESOURCE: "MINT_RESOURCE",
    TRANSFER_RESOURCE: "TRANSFER_RESOURCE",
    CONSUME_RESOURCE: "CONSUME_RESOURCE",
  };

  /**
   * The apply function for the resource system
   * @param {Array} ops - The operations to apply
   * @returns {Object} The new state
   */
  function apply(ops) {
    // Process operations in order
    for (const op of ops) {
      switch (op.type) {
        case OP_TYPES.CREATE_RESOURCE:
          createResourceInternal(
            op.resourceId,
            op.name,
            op.description,
            op.maxSupply,
            op.creatorId
          );
          break;

        case OP_TYPES.MINT_RESOURCE:
          mintResourceInternal(op.resourceId, op.to, op.amount, op.minterId);
          break;

        case OP_TYPES.TRANSFER_RESOURCE:
          transferResourceInternal(
            op.resourceId,
            op.from,
            op.to,
            op.amount,
            op.timestamp
          );
          break;

        case OP_TYPES.CONSUME_RESOURCE:
          consumeResourceInternal(
            op.resourceId,
            op.from,
            op.amount,
            op.reason,
            op.timestamp
          );
          break;
      }
    }

    // Return the updated state
    return {
      resources: Array.from(resources.values()),
      holdings: Object.fromEntries(
        Array.from(holdings.entries()).map(([key, value]) => [
          key,
          Object.fromEntries(value),
        ])
      ),
      operations,
    };
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

    apply([operation]);

    return resources.get(resourceId);
  }

  /**
   * Mints a resource to an account
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

    apply([operation]);

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

    apply([operation]);

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

    apply([operation]);

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

  return {
    // Methods
    createResource,
    mintResource,
    transferResource,
    consumeResource,
    getHoldings,
    getAllResources,
    getResource,
  };
}

module.exports = {
  createCurrencySystem,
  createResourceSystem,
};
