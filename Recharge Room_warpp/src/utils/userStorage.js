/**
 * User-specific data storage utility
 * Ensures each user has their own separate data storage
 */

// Get current user's email for data isolation
const getCurrentUserEmail = () => {
  try {
    const userData = localStorage.getItem('recharge_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.email;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  return 'anonymous';
};

// Create user-specific storage key
const getUserKey = (baseKey) => {
  const userEmail = getCurrentUserEmail();
  return `${baseKey}_${userEmail}`;
};

// User-specific storage functions
export const userStorage = {
  // Get user-specific data
  getItem: (key) => {
    try {
      const userKey = getUserKey(key);
      const data = localStorage.getItem(userKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting user data for key ${key}:`, error);
      return null;
    }
  },

  // Set user-specific data
  setItem: (key, value) => {
    try {
      const userKey = getUserKey(key);
      localStorage.setItem(userKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting user data for key ${key}:`, error);
    }
  },

  // Remove user-specific data
  removeItem: (key) => {
    try {
      const userKey = getUserKey(key);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error(`Error removing user data for key ${key}:`, error);
    }
  },

  // Clear all data for current user (but keep other users' data)
  clearUserData: () => {
    try {
      const userEmail = getCurrentUserEmail();
      const keysToRemove = [];
      
      // Find all keys for this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith(`_${userEmail}`)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove user-specific keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared data for user: ${userEmail}`);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },

  // Get all users who have stored data
  getAllUsers: () => {
    try {
      const users = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('recharge_') && key.includes('_')) {
          const parts = key.split('_');
          if (parts.length >= 3) {
            const email = parts[parts.length - 1];
            if (email.includes('@')) {
              users.add(email);
            }
          }
        }
      }
      return Array.from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
};

// Migration function to convert existing global data to user-specific
export const migrateToUserSpecificStorage = () => {
  try {
    const currentUser = getCurrentUserEmail();
    if (currentUser === 'anonymous') return;

    const globalKeys = [
      'recharge_tasks',
      'recharge_journal', 
      'recharge_moods',
      'recharge_voices',
      'recharge_badges',
      'recharge_quick_actions',
      'recharge_voice_drafts',
      'recharge_last_visit'
    ];

    globalKeys.forEach(key => {
      const globalData = localStorage.getItem(key);
      if (globalData && !localStorage.getItem(getUserKey(key))) {
        // Move global data to user-specific storage
        localStorage.setItem(getUserKey(key), globalData);
        console.log(`Migrated ${key} to user-specific storage`);
      }
    });
  } catch (error) {
    console.error('Error migrating to user-specific storage:', error);
  }
};