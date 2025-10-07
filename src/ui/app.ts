import { evaluateSource } from '../index.js';
import { formatError, formatResult, getDefaultSnippet } from './presentation.js';

type UIElements = {
  source: HTMLTextAreaElement;
  output: HTMLElement;
  runButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
};

function getElements(): UIElements {
  const source = document.getElementById('source');
  const output = document.getElementById('output');
  const runButton = document.getElementById('run');
  const resetButton = document.getElementById('reset');

  if (!(source instanceof HTMLTextAreaElement)) {
    throw new Error('Source textarea not found');
  }

  if (!(output instanceof HTMLElement)) {
    throw new Error('Output element not found');
  }

  if (!(runButton instanceof HTMLButtonElement)) {
    throw new Error('Run button not found');
  }

  if (!(resetButton instanceof HTMLButtonElement)) {
    throw new Error('Reset button not found');
  }

  return { source, output, runButton, resetButton };
}

function updateOutput(container: HTMLElement, text: string) {
  container.textContent = text;
}

function runScript({ source, output, runButton }: UIElements) {
  const code = source.value.trim();
  if (!code) {
    updateOutput(output, 'Write some Typescala code to get started.');
    return;
  }

  runButton.disabled = true;
  runButton.textContent = 'Running…';

  try {
    const result = evaluateSource(code);
    updateOutput(output, formatResult(result));
  } catch (error) {
    updateOutput(output, formatError(error));
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run script';
  }
}

function resetEditor({ source, output }: UIElements) {
  source.value = getDefaultSnippet();
  updateOutput(output, 'Ready to run.');
}

function init() {
  const elements = getElements();
  resetEditor(elements);

  elements.runButton.addEventListener('click', () => runScript(elements));
  elements.resetButton.addEventListener('click', () => resetEditor(elements));

  elements.source.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = elements.source;
      elements.source.value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      const cursor = selectionStart + 2;
      elements.source.setSelectionRange(cursor, cursor);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
