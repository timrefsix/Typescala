import { evaluateSource } from '../index.js';
import { formatError, formatResult, getDefaultSnippet } from './presentation.js';
import {
  CUSTOM_SCRIPT_ID,
  demoScripts,
  findScriptByCode,
  findScriptById,
  getDefaultScript,
} from './snippets.js';

type UIElements = {
  source: HTMLTextAreaElement;
  output: HTMLElement;
  runButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  scriptPicker: HTMLSelectElement;
};

function getElements(): UIElements {
  const source = document.getElementById('source');
  const output = document.getElementById('output');
  const runButton = document.getElementById('run');
  const resetButton = document.getElementById('reset');
  const scriptPicker = document.getElementById('script-picker');

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

  if (!(scriptPicker instanceof HTMLSelectElement)) {
    throw new Error('Script picker not found');
  }

  return { source, output, runButton, resetButton, scriptPicker };
}

function updateOutput(container: HTMLElement, text: string) {
  container.textContent = text;
}

function populateScriptPicker(select: HTMLSelectElement) {
  const customOption = document.createElement('option');
  customOption.value = CUSTOM_SCRIPT_ID;
  customOption.textContent = 'Custom script';
  select.append(customOption);

  for (const script of demoScripts) {
    const option = document.createElement('option');
    option.value = script.id;
    option.textContent = script.label;
    option.setAttribute('data-description', script.description);
    select.append(option);
  }

  select.value = getDefaultScript().id;
}

function applyScript(id: string, elements: UIElements) {
  const script = findScriptById(id);
  if (!script) {
    elements.scriptPicker.value = CUSTOM_SCRIPT_ID;
    return;
  }

  elements.source.value = script.code;
  elements.scriptPicker.value = script.id;
  updateOutput(elements.output, `${script.label} loaded. Ready to run.`);
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

function resetEditor(elements: UIElements) {
  elements.source.value = getDefaultSnippet();
  elements.scriptPicker.value = getDefaultScript().id;
  updateOutput(elements.output, 'Ready to run.');
}

function init() {
  const elements = getElements();
  populateScriptPicker(elements.scriptPicker);
  resetEditor(elements);

  elements.runButton.addEventListener('click', () => runScript(elements));
  elements.resetButton.addEventListener('click', () => resetEditor(elements));
  elements.scriptPicker.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      applyScript(target.value, elements);
    }
  });

  elements.source.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = elements.source;
      elements.source.value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      const cursor = selectionStart + 2;
      elements.source.setSelectionRange(cursor, cursor);
    }
  });

  elements.source.addEventListener('input', () => {
    const match = findScriptByCode(elements.source.value);
    elements.scriptPicker.value = match ? match.id : CUSTOM_SCRIPT_ID;
  });
}

document.addEventListener('DOMContentLoaded', init);
