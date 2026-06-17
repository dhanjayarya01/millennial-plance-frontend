type Subscriber = (message: string) => void;

const globalSubscribers = (global as any)._sseSubscribers || new Set<Subscriber>();
if (!(global as any)._sseSubscribers) {
  (global as any)._sseSubscribers = globalSubscribers;
}

export function subscribe(sub: Subscriber) {
  globalSubscribers.add(sub);
  return () => {
    globalSubscribers.delete(sub);
  };
}

export function broadcast(data: any) {
  const payload = JSON.stringify(data);
  globalSubscribers.forEach((send: Subscriber) => send(payload));
}
