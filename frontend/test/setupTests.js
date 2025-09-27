import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { vi } from 'vitest';

// for solving the error: ResizeObserver is not a constructor
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// for solving the error: Cannot read properties of undefined (reading 'width')
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  const React = await vi.importActual('react');

  // دالة صغيرة تنظف props: تمرر فقط الصفات الآمنة إلى عنوان DOM
  const sanitizeProps = (props = {}) => {
    const safe = {};
    for (const [key, val] of Object.entries(props)) {
      // اسماء مسموحة تنطبق على صفات HTML القياسية أو data-/aria-
      if (
        key === 'id' ||
        key === 'className' ||
        key === 'style' ||
        key === 'role' ||
        key === 'tabIndex' ||
        /^aria-/i.test(key) ||
        /^data-/i.test(key)
      ) {
        safe[key] = val;
      }
      // تجاهل كل شيء آخر (مثلاً onValueChange, onChange, justifyContent, value, ...)
    }
    return safe;
  };

  const makeDiv = (testid) => (props) =>
    React.createElement('div', { 'data-testid': testid, ...sanitizeProps(props) }, props.children);

  const Slider = {
    Root: makeDiv('mock-slider-root'),
    Control: makeDiv('mock-slider-control'),
    Track: makeDiv('mock-slider-track'),
    Range: (props) => React.createElement('div', { 'data-testid': 'mock-slider-range', ...sanitizeProps(props) }),
    Thumbs: makeDiv('mock-slider-thumbs'),
    Thumb: (props) => React.createElement('div', { 'data-testid': 'mock-slider-thumb', ...sanitizeProps(props) }),
  };

  return {
    ...actual,
    Slider,
  };
});

globalThis.ResizeObserver = ResizeObserver;