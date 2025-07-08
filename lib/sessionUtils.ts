export interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  label: string;
}

export function generateSessions(startTime: Date, count: number): Session[] {
  const sessions: Session[] = [];
  let currentTime = new Date(startTime);
  
  // Set seconds to 1 and milliseconds to 0
  currentTime.setSeconds(1, 0);

  for (let i = 0; i < count; i++) {
    const sessionStart = new Date(currentTime);
    const sessionEnd = new Date(currentTime);
    
    // Set end time to :59 of the same minute
    sessionEnd.setSeconds(59, 999);
    
    sessions.push({
      id: `session-${i + 1}`,
      startTime: new Date(sessionStart),
      endTime: new Date(sessionEnd),
      label: sessionStart.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    });
    
    // Move to the next minute
    currentTime.setMinutes(currentTime.getMinutes() + 1);
    currentTime.setSeconds(1, 0);
  }
  
  return sessions;
}

export function getCurrentSession(): Session {
  const now = new Date();
  const sessionStart = new Date(now);
  const sessionEnd = new Date(now);
  
  // Set to current minute:01.000
  sessionStart.setSeconds(1, 0);
  
  // Set to current minute:59.999
  sessionEnd.setSeconds(59, 999);
  
  return {
    id: 'current',
    startTime: sessionStart,
    endTime: sessionEnd,
    label: sessionStart.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

export function getNextSessions(count: number): Session[] {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1); // Start from next minute
  now.setSeconds(1, 0);
  return generateSessions(now, count);
}

export function isSessionActive(session: Session): boolean {
  const now = new Date();
  return now >= session.startTime && now <= session.endTime;
}
