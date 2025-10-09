export const pushActivity = (action: 'Added' | 'Edited' | 'Deleted', itemName: string, priority = 'Normal') => {
  const newActivity = {
    title: `${action} walk-out: ${itemName} (${priority})`,
    time: new Date().toLocaleString(),
    status: 'success' as const,
  };
  const stored = localStorage.getItem('SupervisorRecentActivity');
  const updated = [newActivity, ...(stored ? JSON.parse(stored) : [])].slice(0, 5);
  localStorage.setItem('SupervisorRecentActivity', JSON.stringify(updated));
};