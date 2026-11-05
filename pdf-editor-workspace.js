(function () {
  'use strict';

  function bindPanelToggle(root, buttonId, panelId, expandedLabel, collapsedLabel) {
    const button = root.getElementById(buttonId);
    const panel = root.getElementById(panelId);
    if (!button || !panel || typeof button.addEventListener !== 'function') return;

    const initialExpanded = button.getAttribute('aria-expanded') !== 'false';
    button.setAttribute('aria-expanded', String(initialExpanded));
    button.textContent = initialExpanded ? expandedLabel : collapsedLabel;
    panel.classList.toggle('is-collapsed', !initialExpanded);

    button.addEventListener('click', function () {
      const currentlyExpanded = button.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !currentlyExpanded;
      button.setAttribute('aria-expanded', String(nextExpanded));
      button.textContent = nextExpanded ? expandedLabel : collapsedLabel;
      panel.classList.toggle('is-collapsed', !nextExpanded);
    });
  }

  function init(root) {
    const doc = root || document;
    bindPanelToggle(doc, 'togglePageRail', 'pdfPageRailPanel', 'Hide pages', 'Show pages');
    bindPanelToggle(doc, 'toggleInspector', 'pdfSelectionProperties', 'Hide properties', 'Show properties');
  }

  window.KAGZIPdfWorkspace = { init };
})();
