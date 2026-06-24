/**
 * Generates and persists a unique device fingerprint in localStorage.
 * Used to track which device performed add/remove actions in the activity log.
 */
export const getDeviceId = () => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
};
