/**
 * Permissions Management Module
 *
 * This module provides functionality for managing roles and permissions
 * in Autobase applications.
 */

const DEFAULT_PERMISSIONS = {
  MEMBER: {
    canRead: true,
    canWrite: true,
    canInvite: false,
    canManagePermissions: false,
    canManageChannels: false,
    canManageRoom: false,
  },
  MODERATOR: {
    canRead: true,
    canWrite: true,
    canInvite: true,
    canManagePermissions: true,
    canManageChannels: true,
    canManageRoom: false,
  },
  ADMIN: {
    canRead: true,
    canWrite: true,
    canInvite: true,
    canManagePermissions: true,
    canManageChannels: true,
    canManageRoom: true,
  },
};

/**
 * Creates a permissions system for an Autobase
 * @param {Object} autobase - The autobase instance
 * @returns {Object} The permissions system
 */
function createPermissionSystem(autobase) {
  // In a real implementation, the state would be maintained by the autobase's apply function
  // For simplicity, we'll use in-memory objects here
  const rooms = new Map();
  const members = new Map();
  const roles = new Map();
  const channels = new Map();

  // Store the autobase instance
  let _autobase = autobase;

  // Operation types for the Autobase
  const OP_TYPES = {
    CREATE_ROOM: "CREATE_ROOM",
    ADD_MEMBER: "ADD_MEMBER",
    UPDATE_MEMBER_ROLE: "UPDATE_MEMBER_ROLE",
    CREATE_CHANNEL: "CREATE_CHANNEL",
    DELETE_CHANNEL: "DELETE_CHANNEL",
    UPDATE_CHANNEL: "UPDATE_CHANNEL",
  };

  /**
   * The apply function for the Autobase
   * This is where all the permission checks happen
   * @param {Array} ops - The operations to apply
   * @returns {Object} The new state
   */
  function apply(ops) {
    // Process operations in order
    for (const op of ops) {
      // Check if the operation is valid based on permissions
      if (!isOperationAuthorized(op)) {
        continue; // Skip unauthorized operations
      }

      // Process the operation
      switch (op.type) {
        case OP_TYPES.CREATE_ROOM:
          createRoomInternal(op.roomId, op.name, op.creatorId);
          break;

        case OP_TYPES.ADD_MEMBER:
          addMemberInternal(op.roomId, op.memberId, op.role, op.inviterId);
          break;

        case OP_TYPES.UPDATE_MEMBER_ROLE:
          updateMemberRoleInternal(
            op.roomId,
            op.memberId,
            op.role,
            op.updaterId
          );
          break;

        case OP_TYPES.CREATE_CHANNEL:
          createChannelInternal(op.roomId, op.channelId, op.name, op.creatorId);
          break;

        case OP_TYPES.DELETE_CHANNEL:
          deleteChannelInternal(op.roomId, op.channelId, op.deleterId);
          break;

        case OP_TYPES.UPDATE_CHANNEL:
          updateChannelInternal(
            op.roomId,
            op.channelId,
            op.updates,
            op.updaterId
          );
          break;
      }
    }

    // Return the updated state
    return {
      rooms: Array.from(rooms.values()),
      members: Array.from(members.values()),
      roles: Array.from(roles.values()),
      channels: Array.from(channels.values()),
    };
  }

  /**
   * Checks if an operation is authorized
   * @param {Object} op - The operation to check
   * @returns {boolean} True if the operation is authorized
   */
  function isOperationAuthorized(op) {
    // Anyone can create a room
    if (op.type === OP_TYPES.CREATE_ROOM) {
      return true;
    }

    // For other operations, check if the user has the required permissions
    const roomId = op.roomId;
    const userId = op.creatorId || op.inviterId || op.updaterId || op.deleterId;
    const memberKey = `${roomId}:${userId}`;
    const member = members.get(memberKey);

    // If the user is not a member, they can't do anything
    if (!member) {
      return false;
    }

    const role = roles.get(member.role);

    switch (op.type) {
      case OP_TYPES.ADD_MEMBER:
        return role.permissions.canInvite;

      case OP_TYPES.UPDATE_MEMBER_ROLE:
        return role.permissions.canManagePermissions;

      case OP_TYPES.CREATE_CHANNEL:
      case OP_TYPES.DELETE_CHANNEL:
      case OP_TYPES.UPDATE_CHANNEL:
        return role.permissions.canManageChannels;

      default:
        return false;
    }
  }

  /**
   * Internal function to create a room
   */
  function createRoomInternal(roomId, name, creatorId) {
    // Create the room
    rooms.set(roomId, {
      id: roomId,
      name,
      createdBy: creatorId,
      createdAt: Date.now(),
    });

    // Set up default roles
    for (const [roleName, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
      const roleId = `${roomId}:${roleName}`;
      roles.set(roleId, {
        id: roleId,
        name: roleName,
        roomId,
        permissions,
      });
    }

    // Add the creator as an admin
    addMemberInternal(roomId, creatorId, `${roomId}:ADMIN`, creatorId);

    // Create a default channel
    const generalChannelId = `${roomId}:general`;
    createChannelInternal(roomId, generalChannelId, "General", creatorId);
  }

  /**
   * Internal function to add a member
   */
  function addMemberInternal(roomId, memberId, roleId, inviterId) {
    const memberKey = `${roomId}:${memberId}`;
    members.set(memberKey, {
      id: memberKey,
      userId: memberId,
      roomId,
      role: roleId,
      invitedBy: inviterId,
      joinedAt: Date.now(),
    });
  }

  /**
   * Internal function to update a member's role
   */
  function updateMemberRoleInternal(roomId, memberId, roleId, updaterId) {
    const memberKey = `${roomId}:${memberId}`;
    const member = members.get(memberKey);

    if (member) {
      member.role = roleId;
      members.set(memberKey, member);
    }
  }

  /**
   * Internal function to create a channel
   */
  function createChannelInternal(roomId, channelId, name, creatorId) {
    channels.set(channelId, {
      id: channelId,
      roomId,
      name,
      createdBy: creatorId,
      createdAt: Date.now(),
    });
  }

  /**
   * Internal function to delete a channel
   */
  function deleteChannelInternal(roomId, channelId, deleterId) {
    channels.delete(channelId);
  }

  /**
   * Internal function to update a channel
   */
  function updateChannelInternal(roomId, channelId, updates, updaterId) {
    const channel = channels.get(channelId);

    if (channel) {
      Object.assign(channel, updates);
      channels.set(channelId, channel);
    }
  }

  /**
   * Update the autobase instance used by the permission system
   * @param {Object} autobase - The new autobase instance to use
   */
  function setAutobase(newAutobase) {
    _autobase = newAutobase;
    console.log("Permission system: Updated autobase instance");
    return true;
  }

  /**
   * Function to create a room
   * @param {string} name - The name of the room
   * @param {string} creator - The ID of the creator
   * @returns {Object} The room object
   */
  function createRoom(name, creator) {
    const roomId = `room_${Date.now()}`;
    createRoomInternal(roomId, name, creator);

    // Return a room object with methods to manage the room
    return {
      id: roomId,
      name,
      creator,

      /**
       * Add a member to the room
       * @param {string} user - The user ID to add
       * @param {Object} options - Options for the member
       * @returns {boolean} True if the member was added
       */
      addMember(user, options = {}) {
        const role = options.role || `${roomId}:MEMBER`;
        const inviter = options.inviter || creator;

        addMemberInternal(roomId, user, role, inviter);
        return true;
      },

      /**
       * Update a member's role
       * @param {string} user - The user ID to update
       * @param {string} newRole - The new role for the user
       * @returns {boolean} True if the role was updated
       */
      updateMemberRole(user, newRole) {
        updateMemberRoleInternal(roomId, user, `${roomId}:${newRole}`, creator);
        return true;
      },

      /**
       * Create a new channel in the room
       * @param {string} name - The name of the channel
       * @returns {Object} The channel object
       */
      createChannel(name) {
        const channelId = `${roomId}:channel_${Date.now()}`;
        createChannelInternal(roomId, channelId, name, creator);

        return {
          id: channelId,
          name,
          roomId,
          creator,
        };
      },

      /**
       * Get all channels in the room
       * @returns {Array} The channels in the room
       */
      getChannels() {
        return Array.from(channels.values()).filter((c) => c.roomId === roomId);
      },

      /**
       * Get all members in the room
       * @returns {Array} The members in the room
       */
      getMembers() {
        return Array.from(members.values()).filter((m) => m.roomId === roomId);
      },
    };
  }

  // Return the permission system interface
  return {
    rooms,
    members,
    roles,
    channels,
    createRoom,
    apply,
    setAutobase,
  };
}

/**
 * Create a room outside the permission system
 * @param {string} name - The name of the room
 * @param {string} creator - The ID of the creator
 * @returns {Object} The room object
 */
function createRoom(name, creator) {
  const permissionSystem = createPermissionSystem();
  return permissionSystem.createRoom(name, creator);
}

// Export the permission system
module.exports = {
  createPermissionSystem,
  createRoom,
  DEFAULT_PERMISSIONS,
};
