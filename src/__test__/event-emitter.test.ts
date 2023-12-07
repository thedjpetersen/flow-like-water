import EventEmitter from "../event-emitter";

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test('should initialize with an empty events map', () => {
    expect(emitter).toHaveProperty('events');
    expect(emitter['events'].size).toBe(0); // Accessing private property for testing
  });

  describe('on method', () => {
    test('should add a listener to an event', () => {
      const listener = jest.fn();
      emitter.on('testEvent', listener);

      expect(emitter['events'].get('testEvent')).toContain(listener);
    });

    test('should allow multiple listeners for an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('testEvent', listener1);
      emitter.on('testEvent', listener2);

      expect(emitter['events'].get('testEvent')).toEqual(expect.arrayContaining([listener1, listener2]));
    });
  });

  describe('emit method', () => {
    test('should call the listeners of the specified event', () => {
      const listener = jest.fn();
      emitter.on('testEvent', listener);

      emitter.emit('testEvent', 'arg1', 42);

      expect(listener).toHaveBeenCalledWith('arg1', 42);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('should not call listeners of other events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.emit('event1', 'data');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    test('should handle emitting events with no listeners without errors', () => {
      expect(() => emitter.emit('nonExistentEvent')).not.toThrow();
    });
  });
});
