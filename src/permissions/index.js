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

  // Function to create a room
  function createRoom(name, creator) {
    const roomId = `room_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Add the operation to the autobase
    // In a real implementation, this would use autobase.append()
    const operation = {
      type: OP_TYPES.CREATE_ROOM,
      roomId,
      name,
      creatorId: creator.publicIdentity.publicKey.toString("hex"),
    };

    // Apply the operation
    apply([operation]);

    return {
      id: roomId,
      name,

      // Add a member to the room
      addMember(user, options = {}) {
        const role = options.role || `${roomId}:MEMBER`;

        const operation = {
          type: OP_TYPES.ADD_MEMBER,
          roomId,
          memberId: user.publicIdentity.publicKey.toString("hex"),
          role,
          inviterId: creator.publicIdentity.publicKey.toString("hex"),
        };

        apply([operation]);
      },

      // Update a member's role
      updateMemberRole(user, newRole) {
        const operation = {
          type: OP_TYPES.UPDATE_MEMBER_ROLE,
          roomId,
          memberId: user.publicIdentity.publicKey.toString("hex"),
          role: `${roomId}:${newRole}`,
          updaterId: creator.publicIdentity.publicKey.toString("hex"),
        };

        apply([operation]);
      },

      // Create a channel
      createChannel(name) {
        const channelId = `${roomId}:channel_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;

        const operation = {
          type: OP_TYPES.CREATE_CHANNEL,
          roomId,
          channelId,
          name,
          creatorId: creator.publicIdentity.publicKey.toString("hex"),
        };

        apply([operation]);

        return {
          id: channelId,
          name,
        };
      },

      // Get all channels
      getChannels() {
        return Array.from(channels.values()).filter(
          (channel) => channel.roomId === roomId
        );
      },

      // Get all members
      getMembers() {
        return Array.from(members.values())
          .filter((member) => member.roomId === roomId)
          .map((member) => {
            const role = roles.get(member.role);
            return {
              userId: member.userId,
              role: role.name,
              joinedAt: member.joinedAt,
            };
          });
      },
    };
  }

  return {
    createRoom,
    apply,
  };
}

/**
 * Creates a room with permissions
 * @param {string} name - The name of the room
 * @param {Object} creator - The creator's identity
 * @returns {Object} The room object
 */
function createRoom(name, creator) {
  // In a real implementation, this would use the autobase
  const permissionSystem = createPermissionSystem({});
  return permissionSystem.createRoom(name, creator);
}

module.exports = {
  createPermissionSystem,
  createRoom,
  DEFAULT_PERMISSIONS,
};
