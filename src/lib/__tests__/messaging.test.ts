import { MessageBus } from '@/lib/messaging';

describe('lib/messaging MessageBus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendToBackground resolves with response', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((msg, cb) => {
      cb({ ok: true, echo: msg.type });
    });

    const result = await MessageBus.sendToBackground({ type: 'PING', data: { a: 1 } });
    expect(result).toEqual({ ok: true, echo: 'PING' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  test('sendToActiveTab throws when there is no active tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([]);
    await expect(MessageBus.sendToActiveTab({ type: 'ANY', data: {} })).rejects.toThrow('No active tab found');
  });

  test('sendToActiveTab sends to the first active tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 123 }]);
    (chrome.tabs.sendMessage as jest.Mock).mockImplementation((_tabId, _msg, cb) => cb({ ok: 1 }));

    const res = await MessageBus.sendToActiveTab({ type: 'HELLO', data: { x: 1 } });
    expect(chrome.tabs.query).toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, { type: 'HELLO', data: { x: 1 } }, expect.any(Function));
    expect(res).toEqual({ ok: 1 });
  });

  test('addListener registers runtime.onMessage listener once', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();

    MessageBus.addListener('A', cb1);
    MessageBus.addListener('B', cb2);

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });
});
